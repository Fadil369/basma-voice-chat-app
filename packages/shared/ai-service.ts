import Anthropic from '@anthropic-ai/sdk';
import type { Env, ConversationMessage, VisitorData } from '@basma/shared/types';

// vLLM OpenAI-compatible API support
interface LLMProvider {
  name: 'claude' | 'vllm';
  apiKey: string;
  baseURL?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

const BASMA_SYSTEM_PROMPT = `You are **Basma**, the intelligent AI voice secretary for BrainSAIT, a healthcare technology company specializing in HIPAA-compliant, bilingual (Arabic/English) medical systems.

## CORE IDENTITY
- **Name:** Basma (بسمة) - meaning "smile" in Arabic
- **Role:** Executive AI Secretary for BrainSAIT
- **Voice:** Warm, professional, culturally aware, bilingual fluency
- **Tone:** Confident yet approachable, efficient but never rushed

## RESPONSE GUIDELINES
1. Automatically detect caller's language (Arabic/English) and respond accordingly
2. Keep responses concise and natural - this is VOICE conversation
3. Use verbal acknowledgments: "I understand," "Got it," "نعم، فهمت"
4. For appointments, collect: name, contact (phone/email), preferred time, appointment type
5. Be proactive: offer solutions, suggest next steps
6. Handle objections gracefully: "I understand your concern..."
7. Maintain professional boundaries: never discuss PHI (Protected Health Information)

## APPOINTMENT TYPES
- **demo**: Product demonstration (30-45min)
- **consultation**: Technical consultation (60min)
- **partnership**: Partnership discussion (45-60min)
- **support**: Technical support request
- **inquiry**: General information request

## BRAINSAIT OVERVIEW
Healthcare technology company building AI-powered, HIPAA-compliant medical systems with native Arabic-English support. Specializes in NPHIES (Saudi healthcare) integration, FHIR R4 compliance, and clinical decision support.

## CRITICAL RULES
❌ NEVER ask for or accept PHI (patient data)
❌ NEVER discuss patient-specific cases
✅ Always verify information before confirming
✅ Escalate urgent issues immediately
✅ Log all interactions with audit trail

Keep responses natural, brief (2-3 sentences max for voice), and action-oriented.`;

export class AIService {
  private anthropicClient?: Anthropic;
  private vllmClient?: ReturnType<typeof fetch>;
  private provider: 'claude' | 'vllm';
  private model: string;
  private vllmBaseURL?: string;
  private apiKey: string;
  
  constructor(config: {
    apiKey: string;
    model?: string;
    provider?: 'claude' | 'vllm';
    vllmBaseURL?: string;
  }) {
    this.apiKey = config.apiKey;
    this.provider = config.provider || 'claude';
    this.model = config.model || 'claude-3-5-sonnet-20241022';
    this.vllmBaseURL = config.vllmBaseURL || 'http://localhost:8000/v1';
    
    if (this.provider === 'claude') {
      this.anthropicClient = new Anthropic({ apiKey: this.apiKey });
    }
  }

  setProvider(provider: 'claude' | 'vllm', baseURL?: string): void {
    this.provider = provider;
    if (provider === 'vllm' && baseURL) {
      this.vllmBaseURL = baseURL;
    }
    if (provider === 'claude' && !this.anthropicClient) {
      this.anthropicClient = new Anthropic({ apiKey: this.apiKey });
    }
  }

  async processCall(
    conversationHistory: ConversationMessage[],
    visitorData: VisitorData
  ): Promise<ReadableStream> {
    const contextPrompt = this.buildContextPrompt(visitorData);
    const systemPrompt = `${BASMA_SYSTEM_PROMPT}\n\n${contextPrompt}`;

    if (this.provider === 'claude') {
      return this.processCallClaude(conversationHistory, systemPrompt);
    } else {
      return this.processCallVLLM(conversationHistory, systemPrompt);
    }
  }

  private async processCallClaude(
    conversationHistory: ConversationMessage[],
    systemPrompt: string
  ): Promise<ReadableStream> {
    if (!this.anthropicClient) {
      throw new Error('Claude client not initialized');
    }

    const stream = await this.anthropicClient.messages.create({
      model: this.model,
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages: conversationHistory,
      stream: true,
    });

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && 
                event.delta.type === 'text_delta') {
              const text = event.delta.text;
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });
  }

  private async processCallVLLM(
    conversationHistory: ConversationMessage[],
    systemPrompt: string
  ): Promise<ReadableStream> {
    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
      ],
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    };

    const response = await fetch(`${this.vllmBaseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`vLLM API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body from vLLM');
    }

    return new ReadableStream({
      async start(controller) {
        try {
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const json = JSON.parse(data);
                  const content = json.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(content));
                  }
                } catch (e) {
                  // Skip malformed JSON
                }
              }
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });
  }

  async extractVisitorData(transcript: string): Promise<Partial<VisitorData>> {
    const extractionPrompt = `Extract structured data from this call transcript. Return ONLY valid JSON.

Transcript:
${transcript}

Extract:
{
  "name": "full name if mentioned",
  "phone": "phone number if provided",
  "email": "email if provided",
  "company": "company name if mentioned",
  "language": "en" | "ar" | "mixed",
  "appointment_requested": true/false,
  "preferred_time": "any time preference mentioned",
  "inquiry_type": "demo" | "consultation" | "partnership" | "support" | "inquiry"
}

Return NULL for fields not mentioned. Response must be valid JSON only.`;

    if (this.provider === 'claude') {
      return this.extractVisitorDataClaude(extractionPrompt);
    } else {
      return this.extractVisitorDataVLLM(extractionPrompt);
    }
  }

  private async extractVisitorDataClaude(prompt: string): Promise<Partial<VisitorData>> {
    if (!this.anthropicClient) {
      throw new Error('Claude client not initialized');
    }

    const response = await this.anthropicClient.messages.create({
      model: this.model,
      max_tokens: 512,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        const extracted = JSON.parse(content.text);
        return Object.fromEntries(
          Object.entries(extracted).filter(([_, v]) => v !== null && v !== undefined)
        );
      } catch (e) {
        console.error('Failed to parse extracted data:', e);
        return {};
      }
    }
    
    return {};
  }

  private async extractVisitorDataVLLM(prompt: string): Promise<Partial<VisitorData>> {
    const payload = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
      temperature: 0.3,
    };

    const response = await fetch(`${this.vllmBaseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`vLLM extraction error: ${response.status}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;

    if (content) {
      try {
        const extracted = JSON.parse(content);
        return Object.fromEntries(
          Object.entries(extracted).filter(([_, v]) => v !== null && v !== undefined)
        );
      } catch (e) {
        console.error('Failed to parse vLLM extracted data:', e);
        return {};
      }
    }

    return {};
  }

  async generateSummary(conversationHistory: ConversationMessage[]): Promise<string> {
    const prompt = `Summarize this call in 2-3 sentences, focusing on: caller's purpose, key information exchanged, and outcome/next steps.

Conversation:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`;

    if (this.provider === 'claude') {
      return this.generateSummaryClaude(prompt);
    } else {
      return this.generateSummaryVLLM(prompt);
    }
  }

  private async generateSummaryClaude(prompt: string): Promise<string> {
    if (!this.anthropicClient) {
      throw new Error('Claude client not initialized');
    }

    const response = await this.anthropicClient.messages.create({
      model: this.model,
      max_tokens: 256,
      temperature: 0.5,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }

  private async generateSummaryVLLM(prompt: string): Promise<string> {
    const payload = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 256,
      temperature: 0.5,
    };

    const response = await fetch(`${this.vllmBaseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`vLLM summary error: ${response.status}`);
    }

    const json = await response.json();
    return json.choices?.[0]?.message?.content || '';
  }

  async detectLanguage(text: string): Promise<'en' | 'ar' | 'mixed'> {
    const arabicChars = text.match(/[\u0600-\u06FF]/g);
    const englishChars = text.match(/[a-zA-Z]/g);
    
    if (!arabicChars && englishChars) return 'en';
    if (arabicChars && !englishChars) return 'ar';
    return 'mixed';
  }

  async analyzeSentiment(text: string): Promise<'positive' | 'neutral' | 'negative' | 'urgent'> {
    const urgentKeywords = ['urgent', 'emergency', 'asap', 'عاجل', 'طارئ', 'فوري'];
    const negativeKeywords = ['problem', 'issue', 'angry', 'frustrated', 'مشكلة', 'غاضب', 'منزعج'];
    const positiveKeywords = ['thank', 'great', 'excellent', 'شكرا', 'ممتاز', 'رائع'];
    
    const lowerText = text.toLowerCase();
    
    if (urgentKeywords.some(k => lowerText.includes(k))) return 'urgent';
    if (negativeKeywords.some(k => lowerText.includes(k))) return 'negative';
    if (positiveKeywords.some(k => lowerText.includes(k))) return 'positive';
    
    return 'neutral';
  }

  private buildContextPrompt(visitorData: VisitorData): string {
    const parts = ['## CURRENT CONTEXT'];
    
    if (visitorData.name) parts.push(`Caller Name: ${visitorData.name}`);
    if (visitorData.company) parts.push(`Company: ${visitorData.company}`);
    if (visitorData.language) parts.push(`Language: ${visitorData.language}`);
    if (visitorData.visitorId) parts.push(`Returning Visitor: Yes (ID: ${visitorData.visitorId})`);
    
    return parts.join('\n');
  }
}

export function createAIService(env: Env): AIService {
  const provider = (env.ANTHROPIC_PROVIDER || 'claude') as 'claude' | 'vllm';
  
  return new AIService({
    apiKey: provider === 'vllm' ? (env.VLLM_API_KEY || '') : env.ANTHROPIC_API_KEY,
    model: env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    provider: provider,
    vllmBaseURL: env.VLLM_BASE_URL || 'http://localhost:8000/v1',
  });
}

// Example: How to use vLLM in Basma Voice Worker
// File: apps/workers/voice/src/index.ts

import { AIService } from '@basma/shared/ai-service';
import type { ConversationMessage, VisitorData } from '@basma/shared/types';

export interface Env {
  ANTHROPIC_PROVIDER?: 'claude' | 'vllm';
  ANTHROPIC_API_KEY?: string;
  VLLM_API_KEY?: string;
  VLLM_BASE_URL?: string;
  // ... other bindings
}

// Initialize AI Service with vLLM support
function createAIService(env: Env): AIService {
  const provider = (env.ANTHROPIC_PROVIDER || 'claude') as 'claude' | 'vllm';
  
  const aiService = new AIService({
    apiKey: provider === 'vllm' ? (env.VLLM_API_KEY || '') : (env.ANTHROPIC_API_KEY || ''),
    model: 'meta-llama/Llama-2-7b-chat-hf', // or claude-3-5-sonnet-20241022
    provider: provider,
    vllmBaseURL: env.VLLM_BASE_URL || 'http://localhost:8000/v1',
  });

  return aiService;
}

// Example: Handle voice call with vLLM
async function handleVoiceCall(req: Request, env: Env): Promise<Response> {
  const aiService = createAIService(env);
  
  // Example conversation history
  const conversationHistory: ConversationMessage[] = [
    { role: 'user', content: 'مرحبا، أريد تحديد موعد استشارة' },
  ];

  // Example visitor data
  const visitorData: VisitorData = {
    name: 'أحمد محمد',
    phone: '+966501234567',
    language: 'ar',
  };

  try {
    // Process call with vLLM (streaming)
    const stream = await aiService.processCall(conversationHistory, visitorData);
    
    // Return stream response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Voice processing error:', error);
    
    // Optional: Fall back to Claude if vLLM is unavailable
    if (env.ANTHROPIC_PROVIDER === 'vllm' && env.ANTHROPIC_API_KEY) {
      console.log('Falling back to Claude...');
      aiService.setProvider('claude');
      const stream = await aiService.processCall(conversationHistory, visitorData);
      return new Response(stream);
    }
    
    return new Response('Error processing call', { status: 500 });
  }
}

// Example: Extract visitor data with vLLM
async function extractVisitorInfo(transcript: string, env: Env): Promise<any> {
  const aiService = createAIService(env);
  
  try {
    const extracted = await aiService.extractVisitorData(transcript);
    return extracted;
  } catch (error) {
    console.error('Extraction error:', error);
    return {};
  }
}

// Example: Generate call summary with vLLM
async function generateCallSummary(
  conversationHistory: ConversationMessage[],
  env: Env
): Promise<string> {
  const aiService = createAIService(env);
  
  try {
    const summary = await aiService.generateSummary(conversationHistory);
    return summary;
  } catch (error) {
    console.error('Summary generation error:', error);
    return 'Unable to generate summary';
  }
}

// Example: Switch between providers at runtime
async function demonstrateProviderSwitching(env: Env) {
  const aiService = createAIService(env);
  
  const messages: ConversationMessage[] = [
    { role: 'user', content: 'What is BrainSAIT?' },
  ];
  const visitor: VisitorData = { language: 'en' };

  // Process with initial provider
  console.log(`Using provider: ${env.ANTHROPIC_PROVIDER || 'claude'}`);
  let stream = await aiService.processCall(messages, visitor);
  let response1 = await stream.getReader().read();

  // Switch provider
  if (env.ANTHROPIC_PROVIDER === 'vllm') {
    console.log('Switching to Claude...');
    aiService.setProvider('claude');
  } else {
    console.log('Switching to vLLM...');
    aiService.setProvider('vllm', env.VLLM_BASE_URL);
  }

  // Process again with switched provider
  stream = await aiService.processCall(messages, visitor);
  let response2 = await stream.getReader().read();

  console.log('Provider switching successful!');
}

// Example: wrangler.toml configuration

/*
# For vLLM (local inference)
[env.vllm]
vars = {
  ANTHROPIC_PROVIDER = "vllm",
  VLLM_BASE_URL = "http://localhost:8000/v1",
  VLLM_API_KEY = "sk-local-key"
}

# For Claude API (production)
[env.production]
vars = {
  ANTHROPIC_PROVIDER = "claude"
}
secrets = [
  "ANTHROPIC_API_KEY"
]

# For Hybrid (vLLM with Claude fallback)
[env.hybrid]
vars = {
  ANTHROPIC_PROVIDER = "vllm",
  VLLM_BASE_URL = "http://localhost:8000/v1",
  VLLM_API_KEY = "sk-local-key"
}
secrets = [
  "ANTHROPIC_API_KEY"
]
*/

// Example: Environment setup for Docker Compose

/*
# .env.vllm
ANTHROPIC_PROVIDER=vllm
VLLM_BASE_URL=http://localhost:8000/v1
VLLM_API_KEY=sk-local-key
ANTHROPIC_MODEL=meta-llama/Llama-2-7b-chat-hf

# Start services
docker-compose -f docker-compose.vllm.yml up -d

# Verify
curl http://localhost:8000/v1/models
*/

// Example: Bilingual call handling

async function handleBilingualCall(
  arabicTranscript: string,
  englishTranscript: string,
  env: Env
): Promise<{ arabicResponse: string; englishResponse: string }> {
  const aiService = createAIService(env);

  // Process Arabic query
  const arabicMessages: ConversationMessage[] = [
    { role: 'user', content: arabicTranscript },
  ];
  const arabicStream = await aiService.processCall(arabicMessages, {
    language: 'ar',
  });
  const arabicData = await arabicStream.getReader().read();
  const arabicResponse = new TextDecoder().decode(arabicData.value);

  // Process English query
  const englishMessages: ConversationMessage[] = [
    { role: 'user', content: englishTranscript },
  ];
  const englishStream = await aiService.processCall(englishMessages, {
    language: 'en',
  });
  const englishData = await englishStream.getReader().read();
  const englishResponse = new TextDecoder().decode(englishData.value);

  return { arabicResponse, englishResponse };
}

// Export examples
export {
  handleVoiceCall,
  extractVisitorInfo,
  generateCallSummary,
  demonstrateProviderSwitching,
  handleBilingualCall,
};

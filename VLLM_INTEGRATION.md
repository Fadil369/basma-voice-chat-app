# vLLM Integration Guide for Basma

## Overview

This guide walks you through integrating **vLLM** (open-source LLM serving engine) with Basma for local/self-hosted LLM inference. This allows you to:

- Run open-source models (Llama, Mistral, etc.) locally or on-premises
- Reduce API costs for high-volume call centers
- Ensure data privacy (no external API calls)
- Support multiple model architectures via OpenAI-compatible API

## Quick Start (5 minutes)

### 1. Setup vLLM Stack

```bash
# Copy Docker Compose file to your Basma root
cp docker-compose.vllm.yml docker-compose.vllm.yml

# Create .env file with vLLM config
cp .env.vllm.example .env.vllm
# Edit .env.vllm with your settings
```

### 2. Start vLLM Server

```bash
# Start vLLM with Llama 2 7B (recommended for most setups)
VLLM_MODEL=meta-llama/Llama-2-7b-chat-hf docker-compose -f docker-compose.vllm.yml up -d

# Verify vLLM is running
curl http://localhost:8000/v1/models

# View logs
docker-compose -f docker-compose.vllm.yml logs -f vllm
```

### 3. Update Basma to Use vLLM

```bash
# In your Cloudflare Worker (wrangler.toml)
[env.vllm]
vars = { ANTHROPIC_PROVIDER = "vllm" }

# Or set in your environment
export ANTHROPIC_PROVIDER=vllm
export VLLM_BASE_URL=http://localhost:8000/v1

# Deploy
npm run deploy
```

### 4. Test Integration

```bash
# Run a test call through the voice worker
curl -X POST http://localhost:8787/twilio/voice \
  -H "Content-Type: application/json" \
  -d '{"CallSid": "test-123", "From": "+1234567890"}'
```

## Model Selection Guide

### CPU-Only Deployments

**Recommended:** `meta-llama/Llama-2-7b-chat-hf`

```bash
VLLM_MODEL=meta-llama/Llama-2-7b-chat-hf
TENSOR_PARALLEL_SIZE=1
```

- Fits in ~16GB RAM
- ~1-2s response time on modern CPU
- Good bilingual support (Arabic/English)

### Single GPU (8GB+)

**Recommended:** `meta-llama/Llama-2-13b-chat-hf`

```bash
VLLM_MODEL=meta-llama/Llama-2-13b-chat-hf
TENSOR_PARALLEL_SIZE=1
docker run --gpus all vllm/vllm-openai:latest
```

- ~2-3x faster than 7B
- Better instruction following
- Requires A10G, RTX 3080+, or similar

### Multi-GPU / High Volume

**Recommended:** `meta-llama/Llama-2-70b-chat-hf` with tensor parallelism

```bash
VLLM_MODEL=meta-llama/Llama-2-70b-chat-hf
TENSOR_PARALLEL_SIZE=2  # For 2 GPUs
```

- Full 70B parameter model
- Excellent quality for complex queries
- Requires 2x A100 or 4x RTX A6000

### Lightweight / Edge Devices

**Recommended:** `mistralai/Mistral-7B-Instruct-v0.1` (quantized)

```bash
VLLM_MODEL=mistralai/Mistral-7B-Instruct-v0.1
QUANTIZATION=awq  # or gptq, bitsandbytes
```

- ~4GB RAM with quantization
- Faster inference
- Good for mobile/edge deployments

## Configuration Details

### Environment Variables

```env
# Provider selection
ANTHROPIC_PROVIDER=vllm              # 'claude' or 'vllm'
ANTHROPIC_MODEL=meta-llama/Llama-2-7b-chat-hf

# vLLM server
VLLM_BASE_URL=http://localhost:8000/v1
VLLM_API_KEY=sk-local-key            # Can be any string for local setup

# Performance tuning
TENSOR_PARALLEL_SIZE=1               # Number of GPUs for tensor parallelism
VLLM_GPU_MEMORY_UTILIZATION=0.9      # Max GPU memory usage (0.0-1.0)
VLLM_MAX_MODEL_LEN=4096              # Max sequence length

# Quantization (optional, reduces memory)
QUANTIZATION=                        # 'awq', 'gptq', 'bitsandbytes', or empty
```

### Docker Compose Services

#### vLLM Service
```yaml
ports:
  - "8000:8000"                      # OpenAI-compatible API
volumes:
  - huggingface_cache:/root/.cache/huggingface  # Model cache
environment:
  - MODEL_ID                         # HuggingFace model ID
  - TENSOR_PARALLEL_SIZE             # For multi-GPU
  - ENABLE_PREFIX_CACHING=true       # Memory optimization
```

#### Optional: Redis
```yaml
# High-performance caching for:
# - Session state during calls
# - Prompt embeddings
# - Rate limiting data
```

#### Optional: PostgreSQL with pgvector
```yaml
# Vector database for:
# - Semantic similarity search (find similar past calls)
# - Patient context retrieval
# - Clinical decision support
```

## Performance Tuning

### Request Batching
vLLM automatically batches requests. For voice calls:

```typescript
// In ai-service.ts
max_tokens: 1024,           // Reasonable for voice
temperature: 0.7,           // Balanced for healthcare
```

### Caching Strategies

```bash
# Enable prefix caching for repeated context
ENABLE_PREFIX_CACHING=true

# Cache the BASMA_SYSTEM_PROMPT (reused in every call)
# This saves ~300 tokens per request
```

### Memory Optimization

```bash
# If running out of memory:

# 1. Use quantization
QUANTIZATION=awq

# 2. Reduce max sequence length
VLLM_MAX_MODEL_LEN=2048

# 3. Use a smaller model
ANTHROPIC_MODEL=meta-llama/Llama-2-7b-chat-hf

# 4. Enable page attention (kernel optimization)
# (Automatic in vLLM 0.3.0+)
```

### GPU Configuration

```bash
# For NVIDIA GPUs
docker run --gpus all vllm/vllm-openai:latest

# For AMD ROCm
docker run --device /dev/kfd --device /dev/dri vllm/vllm-openai-rocm:latest

# For Intel Arc
docker run --device /dev/dri vllm/vllm-openai-xpu:latest
```

## Deployment Options

### Option 1: Local Development (CPU)
```bash
docker-compose -f docker-compose.vllm.yml up -d vllm
# Access: http://localhost:8000
# Cost: Free
# Latency: 1-3s
```

### Option 2: Single GPU Server
```bash
# On-premises or cloud GPU (AWS, GCP, Azure)
docker-compose -f docker-compose.vllm.yml up -d
# Cost: GPU compute cost (~$0.50/hour for A10G)
# Latency: 100-500ms
```

### Option 3: Managed vLLM (Cloud)

**Together AI** - Production vLLM endpoint
```bash
VLLM_BASE_URL=https://api.together.xyz/v1
VLLM_API_KEY=<your-together-key>
```

**Replicate** - On-demand model serving
```bash
# Via API, no self-hosting needed
```

**Anyscale Endpoints** - Ray-powered distributed serving
```bash
VLLM_BASE_URL=https://api.endpoints.anyscale.com/v1
```

### Option 4: Hybrid (Claude + vLLM Fallback)

```typescript
// In ai-service.ts
async processCall(messages) {
  try {
    // Try vLLM first (cheaper)
    return await this.processCallVLLM(messages);
  } catch (error) {
    console.warn('vLLM unavailable, falling back to Claude:', error);
    return await this.processCallClaude(messages);
  }
}
```

Configure via environment:
```env
ANTHROPIC_PROVIDER=vllm              # Primary
ANTHROPIC_API_KEY=<claude-key>       # Fallback
```

## Monitoring & Debugging

### Health Check
```bash
# Verify vLLM is ready
curl http://localhost:8000/v1/models

# Should return:
# {"object":"list","data":[{"id":"meta-llama/Llama-2-7b-chat-hf",...}]}
```

### Logs
```bash
# View real-time vLLM logs
docker-compose -f docker-compose.vllm.yml logs -f vllm

# Check for errors
docker-compose -f docker-compose.vllm.yml logs vllm | grep -i error
```

### Performance Metrics
```bash
# vLLM exposes Prometheus metrics
curl http://localhost:8000/metrics

# Key metrics:
# - vllm_request_duration_seconds (inference time)
# - vllm_request_cache_hit_rate (caching efficiency)
# - vllm_num_requests_waiting (queue depth)
```

### Load Testing
```bash
# Test with concurrent voice calls
ab -n 100 -c 10 http://localhost:8787/twilio/voice

# Monitor vLLM during load
docker-compose -f docker-compose.vllm.yml exec vllm \
  curl http://localhost:8000/metrics | grep vllm_num_requests
```

## Troubleshooting

### vLLM Not Starting
```bash
# Check logs
docker-compose logs vllm

# Common issues:
# 1. Out of memory - reduce model size or batch size
# 2. Port 8000 in use - change port mapping
# 3. Model download timeout - increase --initial-delay-seconds
```

### Slow Responses
```bash
# Check GPU utilization
docker-compose exec vllm nvidia-smi

# Check queue depth
curl http://localhost:8000/metrics | grep waiting

# Solutions:
# - Increase num_gpu_blocks
# - Enable prefix caching
# - Reduce max_model_len
```

### Memory Issues
```bash
# Monitor memory during calls
docker stats basma-vllm

# If OOM:
QUANTIZATION=awq              # Reduce model size by 4x
VLLM_MAX_MODEL_LEN=2048       # Reduce sequence length
TENSOR_PARALLEL_SIZE=2         # Distribute across GPUs
```

### Bilingual Inference Not Working
```bash
# Ensure model supports Arabic
# Good models: Llama 2, Mistral, Aya

# Bad models: GPT-2, CodeLLaMA (code-specific)

# Test Arabic
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Llama-2-7b-chat-hf",
    "messages": [{"role": "user", "content": "مرحبا"}],
    "max_tokens": 50
  }'
```

## Cost Comparison

| Setup | Monthly Cost | Latency | Quality |
|-------|--------------|---------|---------|
| Claude API | $50-500 | 500ms | Best |
| vLLM (self-hosted GPU) | $400-1000 | 200ms | Good |
| vLLM (CPU) | $0 | 2-5s | Good |
| vLLM (managed) | $100-300 | 300ms | Good |

## Next Steps

1. **Start with CPU vLLM**: Test locally, no GPU required
2. **Migrate voice worker**: Update `ai-service.ts` configuration
3. **Monitor quality**: Compare Claude vs vLLM responses
4. **Optimize**: Tune prompts for open-source models
5. **Scale**: Add GPU server or managed endpoint as needed

## References

- [vLLM Documentation](https://vllm.ai/)
- [Meta Llama 2](https://huggingface.co/meta-llama/Llama-2-7b-chat-hf)
- [Mistral Model](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.1)
- [OpenAI API Compatibility](https://vllm.ai/getting_started/installation.html#openai-compatible-server)

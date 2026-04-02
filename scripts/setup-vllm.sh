#!/bin/bash
# vLLM Quick Start Script for Basma
# Run: ./scripts/setup-vllm.sh

set -e

echo "🚀 Basma vLLM Integration Setup"
echo "================================\n"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop."
    exit 1
fi

# Create .env.vllm if not exists
if [ ! -f .env.vllm ]; then
    echo "📝 Creating .env.vllm..."
    cp .env.vllm.example .env.vllm
    echo "✅ Created .env.vllm (review and edit as needed)"
fi

# Load environment
set -a
source .env.vllm
set +a

# Menu
echo "Select vLLM setup option:"
echo "========================="
echo "1) CPU-only (Llama 2 7B) - No GPU required, slower"
echo "2) Single GPU (Llama 2 13B) - Requires GPU, faster"
echo "3) Multi-GPU (Llama 2 70B) - Requires 2+ GPUs, best quality"
echo "4) Lightweight (Mistral 7B) - Quantized, fastest"
echo "5) Custom model - Specify your own"
echo ""
read -p "Choose option (1-5): " choice

case $choice in
    1)
        MODEL="meta-llama/Llama-2-7b-chat-hf"
        TENSOR_SIZE=1
        QUANTIZATION=""
        echo "📦 Using: Llama 2 7B (CPU)"
        ;;
    2)
        MODEL="meta-llama/Llama-2-13b-chat-hf"
        TENSOR_SIZE=1
        QUANTIZATION=""
        echo "📦 Using: Llama 2 13B (Single GPU)"
        ;;
    3)
        MODEL="meta-llama/Llama-2-70b-chat-hf"
        TENSOR_SIZE=2
        QUANTIZATION=""
        echo "📦 Using: Llama 2 70B (Multi-GPU)"
        ;;
    4)
        MODEL="mistralai/Mistral-7B-Instruct-v0.1"
        TENSOR_SIZE=1
        QUANTIZATION="awq"
        echo "📦 Using: Mistral 7B (Quantized)"
        ;;
    5)
        read -p "Enter HuggingFace model ID: " MODEL
        read -p "Enter tensor parallel size (default 1): " TENSOR_SIZE
        TENSOR_SIZE=${TENSOR_SIZE:-1}
        echo "📦 Using: $MODEL"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# Update .env.vllm
sed -i '' "s/ANTHROPIC_MODEL=.*/ANTHROPIC_MODEL=$MODEL/" .env.vllm
sed -i '' "s/TENSOR_PARALLEL_SIZE=.*/TENSOR_PARALLEL_SIZE=$TENSOR_SIZE/" .env.vllm
if [ -n "$QUANTIZATION" ]; then
    sed -i '' "s/QUANTIZATION=.*/QUANTIZATION=$QUANTIZATION/" .env.vllm
fi

echo ""
echo "🐳 Starting vLLM..."
docker-compose -f docker-compose.vllm.yml up -d vllm redis

# Wait for vLLM to be ready
echo ""
echo "⏳ Waiting for vLLM to start (this may take 1-2 minutes)..."
max_attempts=60
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8000/v1/models > /dev/null 2>&1; then
        echo "✅ vLLM is ready!"
        break
    fi
    echo "  Attempt $((attempt+1))/$max_attempts..."
    sleep 2
    ((attempt++))
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ vLLM failed to start"
    echo "📋 Check logs: docker-compose -f docker-compose.vllm.yml logs vllm"
    exit 1
fi

# Test the API
echo ""
echo "🧪 Testing vLLM API..."
response=$(curl -s http://localhost:8000/v1/models)
echo "Models available: $response"

# Verify model
echo ""
echo "✅ vLLM Setup Complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Update your worker code to use vLLM:"
echo "   export ANTHROPIC_PROVIDER=vllm"
echo "   export VLLM_BASE_URL=http://localhost:8000/v1"
echo ""
echo "2. Test a chat completion:"
echo "   curl http://localhost:8000/v1/chat/completions -H 'Content-Type: application/json' \\"
echo "     -d '{\"model\":\"'$MODEL'\",\"messages\":[{\"role\":\"user\",\"content\":\"مرحبا\"}],\"max_tokens\":100}'"
echo ""
echo "3. Monitor vLLM:"
echo "   docker-compose -f docker-compose.vllm.yml logs -f vllm"
echo ""
echo "4. Stop services:"
echo "   docker-compose -f docker-compose.vllm.yml down"
echo ""

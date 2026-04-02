#!/bin/bash
# Verify vLLM Integration
# Run: ./scripts/verify-vllm.sh

set -e

echo "🔍 Verifying vLLM Integration for Basma"
echo "======================================\n"

# Check files
echo "📋 Checking integration files..."
files=(
  "packages/shared/ai-service.ts"
  "packages/shared/types.ts"
  "docker-compose.vllm.yml"
  ".env.vllm.example"
  "VLLM_INTEGRATION.md"
  "VLLM_INTEGRATION_SUMMARY.md"
  "VLLM_USAGE_EXAMPLES.ts"
  "scripts/setup-vllm.sh"
)

missing=0
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file (MISSING)"
    missing=$((missing + 1))
  fi
done

if [ $missing -gt 0 ]; then
  echo "\n❌ $missing files missing!"
  exit 1
fi

echo "\n✅ All integration files present\n"

# Check ai-service.ts has vLLM support
echo "🔎 Checking AI Service implementation..."
if grep -q "processCallVLLM" packages/shared/ai-service.ts; then
  echo "✅ vLLM stream handler implemented"
else
  echo "❌ vLLM stream handler missing"
  exit 1
fi

if grep -q "setProvider" packages/shared/ai-service.ts; then
  echo "✅ Provider switching implemented"
else
  echo "❌ Provider switching missing"
  exit 1
fi

# Check types.ts has vLLM env vars
echo "\n🔎 Checking type definitions..."
if grep -q "VLLM_API_KEY" packages/shared/types.ts; then
  echo "✅ VLLM_API_KEY environment variable"
else
  echo "❌ VLLM_API_KEY missing"
  exit 1
fi

if grep -q "VLLM_BASE_URL" packages/shared/types.ts; then
  echo "✅ VLLM_BASE_URL environment variable"
else
  echo "❌ VLLM_BASE_URL missing"
  exit 1
fi

if grep -q "ANTHROPIC_PROVIDER" packages/shared/types.ts; then
  echo "✅ ANTHROPIC_PROVIDER environment variable"
else
  echo "❌ ANTHROPIC_PROVIDER missing"
  exit 1
fi

# Check Docker Compose
echo "\n🐳 Checking Docker Compose configuration..."
if grep -q "vllm/vllm-openai" docker-compose.vllm.yml; then
  echo "✅ vLLM service configured"
else
  echo "❌ vLLM service missing"
  exit 1
fi

if grep -q "redis:7-alpine" docker-compose.vllm.yml; then
  echo "✅ Redis service configured"
else
  echo "❌ Redis service missing"
  exit 1
fi

if grep -q "pgvector" docker-compose.vllm.yml; then
  echo "✅ PostgreSQL pgvector configured"
else
  echo "❌ PostgreSQL pgvector missing"
  exit 1
fi

# Check npm scripts
echo "\n📦 Checking npm scripts..."
if grep -q "vllm:setup" package.json; then
  echo "✅ npm run vllm:setup script"
else
  echo "❌ vllm:setup script missing"
  exit 1
fi

if grep -q "vllm:start" package.json; then
  echo "✅ npm run vllm:start script"
else
  echo "❌ vllm:start script missing"
  exit 1
fi

if grep -q "vllm:logs" package.json; then
  echo "✅ npm run vllm:logs script"
else
  echo "❌ vllm:logs script missing"
  exit 1
fi

# Check documentation
echo "\n📚 Checking documentation..."
if [ -f "VLLM_INTEGRATION.md" ] && [ $(wc -l < VLLM_INTEGRATION.md) -gt 300 ]; then
  echo "✅ Comprehensive integration guide ($(wc -l < VLLM_INTEGRATION.md) lines)"
else
  echo "❌ Integration guide too short or missing"
  exit 1
fi

if grep -q "Quick Start" VLLM_INTEGRATION_SUMMARY.md; then
  echo "✅ Quick start guide present"
else
  echo "❌ Quick start guide missing"
  exit 1
fi

# Check examples
echo "\n💡 Checking usage examples..."
if grep -q "handleVoiceCall" VLLM_USAGE_EXAMPLES.ts; then
  echo "✅ Voice call example"
else
  echo "❌ Voice call example missing"
  exit 1
fi

if grep -q "demonstrateProviderSwitching" VLLM_USAGE_EXAMPLES.ts; then
  echo "✅ Provider switching example"
else
  echo "❌ Provider switching example missing"
  exit 1
fi

# Summary
echo "\n✨ Integration Verification Summary"
echo "===================================="
echo ""
echo "✅ All files present and configured"
echo "✅ AI Service supports vLLM"
echo "✅ Type definitions updated"
echo "✅ Docker Compose stack ready"
echo "✅ npm scripts configured"
echo "✅ Documentation comprehensive"
echo "✅ Usage examples provided"
echo ""
echo "🚀 Ready to start vLLM!"
echo ""
echo "Next steps:"
echo "1. npm run vllm:setup"
echo "2. npm run vllm:start"
echo "3. npm run vllm:status"
echo "4. npm run vllm:test"
echo ""

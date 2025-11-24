#!/bin/bash

# CI/CD Pipeline Validation Script
# This script validates that the CI/CD pipeline is correctly configured
# without actually triggering deployments

# Don't exit on error, we want to collect all results
set +e

echo "🧪 CI/CD Pipeline Validation Script"
echo "===================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Test 1: Check if workflow files exist
echo "📋 Test 1: Checking workflow files..."
if [ -f ".github/workflows/deploy-staging.yml" ]; then
    pass "Staging workflow file exists"
else
    fail "Staging workflow file not found"
fi

if [ -f ".github/workflows/deploy-production.yml" ]; then
    pass "Production workflow file exists"
else
    fail "Production workflow file not found"
fi
echo ""

# Test 2: Check if documentation exists
echo "📚 Test 2: Checking documentation..."
DOCS=(
    "docs/LOCAL_DEVELOPMENT.md"
    "docs/GITHUB_SECRETS_SETUP.md"
    "docs/VERCEL_ENV_SETUP.md"
    "docs/WORKFLOW_GUIDE.md"
    "docs/DEPLOYMENT_ROLLBACK_GUIDE.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        pass "Documentation exists: $doc"
    else
        fail "Documentation missing: $doc"
    fi
done
echo ""

# Test 3: Validate staging workflow configuration
echo "🔧 Test 3: Validating staging workflow configuration..."
if grep -q "branches:" ".github/workflows/deploy-staging.yml" && \
   grep -q "stage" ".github/workflows/deploy-staging.yml"; then
    pass "Staging workflow triggers on 'stage' branch"
else
    fail "Staging workflow branch trigger not configured correctly"
fi

if grep -q "wuinfsedukvxlkfvlpna" ".github/workflows/deploy-staging.yml"; then
    pass "Staging workflow uses correct Supabase project ID"
else
    fail "Staging workflow Supabase project ID incorrect"
fi

if grep -q "SUPABASE_ACCESS_TOKEN_STAGING" ".github/workflows/deploy-staging.yml"; then
    pass "Staging workflow references staging access token"
else
    fail "Staging workflow missing staging access token reference"
fi

if grep -q "preview" ".github/workflows/deploy-staging.yml"; then
    pass "Staging workflow deploys to Vercel preview"
else
    fail "Staging workflow not configured for Vercel preview"
fi
echo ""

# Test 4: Validate production workflow configuration
echo "🔧 Test 4: Validating production workflow configuration..."
if grep -q "branches:" ".github/workflows/deploy-production.yml" && \
   grep -q "main" ".github/workflows/deploy-production.yml"; then
    pass "Production workflow triggers on 'main' branch"
else
    fail "Production workflow branch trigger not configured correctly"
fi

if grep -q "fkjbvwbnbxslornufhlp" ".github/workflows/deploy-production.yml"; then
    pass "Production workflow uses correct Supabase project ID"
else
    fail "Production workflow Supabase project ID incorrect"
fi

if grep -q "SUPABASE_ACCESS_TOKEN_PROD" ".github/workflows/deploy-production.yml"; then
    pass "Production workflow references production access token"
else
    fail "Production workflow missing production access token reference"
fi

if grep -q "\-\-prod" ".github/workflows/deploy-production.yml"; then
    pass "Production workflow deploys to Vercel production"
else
    fail "Production workflow not configured for Vercel production"
fi
echo ""

# Test 5: Check workflow step ordering
echo "📊 Test 5: Validating workflow step ordering..."

# Check staging workflow
STAGING_CONTENT=$(cat .github/workflows/deploy-staging.yml)
MIGRATION_LINE=$(echo "$STAGING_CONTENT" | grep -n "Run Supabase migrations" | cut -d: -f1)
FUNCTIONS_LINE=$(echo "$STAGING_CONTENT" | grep -n "Deploy Supabase Edge Functions" | cut -d: -f1)
VERCEL_LINE=$(echo "$STAGING_CONTENT" | grep -n "Deploy to Vercel" | cut -d: -f1)

if [ "$MIGRATION_LINE" -lt "$FUNCTIONS_LINE" ] && [ "$FUNCTIONS_LINE" -lt "$VERCEL_LINE" ]; then
    pass "Staging workflow steps are in correct order (migrations → functions → vercel)"
else
    fail "Staging workflow steps are not in correct order"
fi

# Check production workflow
PROD_CONTENT=$(cat .github/workflows/deploy-production.yml)
MIGRATION_LINE=$(echo "$PROD_CONTENT" | grep -n "Run Supabase migrations" | cut -d: -f1)
FUNCTIONS_LINE=$(echo "$PROD_CONTENT" | grep -n "Deploy Supabase Edge Functions" | cut -d: -f1)
VERCEL_LINE=$(echo "$PROD_CONTENT" | grep -n "Deploy to Vercel" | cut -d: -f1)

if [ "$MIGRATION_LINE" -lt "$FUNCTIONS_LINE" ] && [ "$FUNCTIONS_LINE" -lt "$VERCEL_LINE" ]; then
    pass "Production workflow steps are in correct order (migrations → functions → vercel)"
else
    fail "Production workflow steps are not in correct order"
fi
echo ""

# Test 6: Check for error handling (if: success())
echo "🛡️  Test 6: Validating error handling..."
if grep -q "if: success()" ".github/workflows/deploy-staging.yml"; then
    pass "Staging workflow has error handling (if: success())"
else
    fail "Staging workflow missing error handling"
fi

if grep -q "if: success()" ".github/workflows/deploy-production.yml"; then
    pass "Production workflow has error handling (if: success())"
else
    fail "Production workflow missing error handling"
fi
echo ""

# Test 7: Check for required secrets references
echo "🔐 Test 7: Validating secrets references..."
REQUIRED_SECRETS=(
    "SUPABASE_ACCESS_TOKEN_STAGING"
    "SUPABASE_ACCESS_TOKEN_PROD"
    "VERCEL_TOKEN"
    "VERCEL_ORG_ID"
    "VERCEL_PROJECT_ID"
)

for secret in "${REQUIRED_SECRETS[@]}"; do
    if grep -rq "$secret" .github/workflows/; then
        pass "Secret referenced: $secret"
    else
        fail "Secret not referenced: $secret"
    fi
done
echo ""

# Test 8: Check Supabase configuration
echo "🗄️  Test 8: Checking Supabase configuration..."
if [ -f "supabase/config.toml" ]; then
    pass "Supabase config.toml exists"
else
    fail "Supabase config.toml not found"
fi

if [ -d "supabase/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
    pass "Supabase migrations directory exists ($MIGRATION_COUNT migrations found)"
else
    fail "Supabase migrations directory not found"
fi

if [ -d "supabase/functions" ]; then
    FUNCTION_COUNT=$(ls -1d supabase/functions/*/ 2>/dev/null | wc -l)
    pass "Supabase functions directory exists ($FUNCTION_COUNT functions found)"
else
    warn "Supabase functions directory not found (optional)"
fi
echo ""

# Test 9: Check test files
echo "🧪 Test 9: Checking test files..."
if [ -f "src/__tests__/workflows/deploy-staging.test.ts" ]; then
    pass "Staging workflow tests exist"
else
    fail "Staging workflow tests not found"
fi

if [ -f "src/__tests__/workflows/deploy-production.test.ts" ]; then
    pass "Production workflow tests exist"
else
    fail "Production workflow tests not found"
fi
echo ""

# Test 10: Check validation script
echo "🔍 Test 10: Checking validation script..."
if [ -f "scripts/validate-local-setup.sh" ]; then
    pass "Local setup validation script exists"
else
    fail "Local setup validation script not found"
fi
echo ""

# Test 11: Validate workflow syntax (if yq is available)
echo "✅ Test 11: Validating YAML syntax..."
if command -v yq &> /dev/null; then
    if yq eval '.jobs.deploy.steps' .github/workflows/deploy-staging.yml > /dev/null 2>&1; then
        pass "Staging workflow YAML is valid"
    else
        fail "Staging workflow YAML has syntax errors"
    fi
    
    if yq eval '.jobs.deploy.steps' .github/workflows/deploy-production.yml > /dev/null 2>&1; then
        pass "Production workflow YAML is valid"
    else
        fail "Production workflow YAML has syntax errors"
    fi
else
    warn "yq not installed, skipping YAML validation"
fi
echo ""

# Summary
echo "===================================="
echo "📊 Test Summary"
echo "===================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! CI/CD pipeline is correctly configured.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Ensure GitHub Secrets are configured (see docs/GITHUB_SECRETS_SETUP.md)"
    echo "2. Ensure Vercel environment variables are set (see docs/VERCEL_ENV_SETUP.md)"
    echo "3. Create a test branch and push to 'stage' to trigger staging deployment"
    echo "4. After validation, merge to 'main' to trigger production deployment"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi

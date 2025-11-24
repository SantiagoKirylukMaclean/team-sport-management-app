#!/bin/bash

# Supabase Local Setup Validation Script
# This script checks if your local development environment is properly configured

set -e

echo "🔍 Validating Supabase Local Development Setup..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any checks fail
FAILED=0

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
    FAILED=1
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to print info
info() {
    echo -e "ℹ $1"
}

echo "1. Checking Prerequisites..."
echo "----------------------------"

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d ' ' -f3 | cut -d ',' -f1)
    success "Docker installed (version $DOCKER_VERSION)"
    
    # Check if Docker is running
    if docker ps &> /dev/null; then
        success "Docker daemon is running"
    else
        error "Docker daemon is not running. Please start Docker Desktop."
    fi
else
    error "Docker is not installed. Install from https://docker.com"
fi

# Check Supabase CLI
if command -v supabase &> /dev/null; then
    SUPABASE_VERSION=$(supabase --version 2>&1 | head -1)
    success "Supabase CLI installed ($SUPABASE_VERSION)"
else
    error "Supabase CLI is not installed. Run: brew install supabase/tap/supabase"
fi

echo ""
echo "2. Checking Configuration Files..."
echo "-----------------------------------"

# Check config.toml exists
if [ -f "supabase/config.toml" ]; then
    success "supabase/config.toml exists"
    
    # Validate key settings
    if grep -q "project_id = \"team-sport-management-app\"" supabase/config.toml; then
        success "Project ID is configured"
    else
        warning "Project ID might not be set correctly"
    fi
    
    # Check ports
    if grep -q "port = 54321" supabase/config.toml; then
        success "API port configured (54321)"
    fi
    
    if grep -q "port = 54322" supabase/config.toml; then
        success "Database port configured (54322)"
    fi
    
    if grep -q "port = 54323" supabase/config.toml; then
        success "Studio port configured (54323)"
    fi
else
    error "supabase/config.toml not found"
fi

# Check migrations directory
if [ -d "supabase/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
    success "Migrations directory exists ($MIGRATION_COUNT migrations found)"
else
    error "supabase/migrations directory not found"
fi

# Check functions directory
if [ -d "supabase/functions" ]; then
    FUNCTION_COUNT=$(ls -1d supabase/functions/*/ 2>/dev/null | wc -l | tr -d ' ')
    success "Functions directory exists ($FUNCTION_COUNT functions found)"
else
    warning "supabase/functions directory not found (optional)"
fi

echo ""
echo "3. Checking Port Availability..."
echo "---------------------------------"

# Function to check if port is in use
check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        warning "Port $port ($service) is already in use"
        info "    Run: lsof -i :$port to see what's using it"
    else
        success "Port $port ($service) is available"
    fi
}

check_port 54321 "API"
check_port 54322 "Database"
check_port 54323 "Studio"
check_port 54324 "Inbucket"

echo ""
echo "4. Checking Supabase Status..."
echo "-------------------------------"

# Check if Supabase is running
if supabase status &> /dev/null; then
    success "Supabase is running"
    info "    Access Studio at: http://127.0.0.1:54323"
    info "    API endpoint: http://127.0.0.1:54321"
else
    warning "Supabase is not currently running"
    info "    Start with: supabase start"
fi

echo ""
echo "5. Checking Environment Variables..."
echo "-------------------------------------"

# Check .env.local
if [ -f ".env.local" ]; then
    success ".env.local exists"
    
    # Check for Supabase URL
    if grep -q "VITE_SUPABASE_URL" .env.local; then
        SUPABASE_URL=$(grep "VITE_SUPABASE_URL" .env.local | cut -d '=' -f2)
        if [[ "$SUPABASE_URL" == *"127.0.0.1:54321"* ]]; then
            success "VITE_SUPABASE_URL points to local instance"
        else
            warning "VITE_SUPABASE_URL might not point to local instance"
            info "    Should be: http://127.0.0.1:54321"
        fi
    else
        warning "VITE_SUPABASE_URL not found in .env.local"
    fi
    
    # Check for anon key
    if grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
        success "VITE_SUPABASE_ANON_KEY is set"
    else
        warning "VITE_SUPABASE_ANON_KEY not found in .env.local"
        info "    Get it from: supabase status"
    fi
else
    warning ".env.local not found"
    info "    Create it with local Supabase credentials"
fi

echo ""
echo "6. Checking Documentation..."
echo "-----------------------------"

# Check if documentation exists
if [ -f "docs/LOCAL_DEVELOPMENT.md" ]; then
    success "Local development guide exists"
else
    warning "docs/LOCAL_DEVELOPMENT.md not found"
fi

if [ -f "docs/SUPABASE_QUICK_REFERENCE.md" ]; then
    success "Quick reference guide exists"
else
    warning "docs/SUPABASE_QUICK_REFERENCE.md not found"
fi

if [ -f "supabase/README.md" ]; then
    success "Supabase directory README exists"
else
    warning "supabase/README.md not found"
fi

echo ""
echo "=========================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Your local development environment is ready."
    echo ""
    echo "Next steps:"
    echo "  1. Start Supabase: supabase start"
    echo "  2. Access Studio: http://127.0.0.1:54323"
    echo "  3. Start your app: npm run dev"
    echo ""
    echo "Documentation:"
    echo "  - Local Development: docs/LOCAL_DEVELOPMENT.md"
    echo "  - Quick Reference: docs/SUPABASE_QUICK_REFERENCE.md"
    echo "  - Troubleshooting: docs/SUPABASE_TROUBLESHOOTING.md"
else
    echo -e "${RED}✗ Some checks failed${NC}"
    echo ""
    echo "Please fix the errors above before proceeding."
    echo "See docs/SUPABASE_TROUBLESHOOTING.md for help."
    exit 1
fi

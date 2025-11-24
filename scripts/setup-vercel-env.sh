#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Vercel Environment Setup Automation ===${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check login status
echo -e "${BLUE}Checking Vercel login status...${NC}"
if ! npx vercel whoami &> /dev/null; then
    echo -e "${YELLOW}You are not logged in to Vercel.${NC}"
    echo -e "${YELLOW}Please log in via the browser window that will open...${NC}"
    npx vercel login
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Login failed. Please try running 'npx vercel login' manually.${NC}"
        exit 1
    fi
fi

# Link project if not linked
if [ ! -d ".vercel" ]; then
    echo -e "${BLUE}Linking project to Vercel...${NC}"
    npx vercel link
fi

echo -e "${BLUE}Configuring Environment Variables...${NC}"

# Function to add env var
add_env_var() {
    local key=$1
    local value=$2
    local env=$3
    
    echo -e "Setting ${YELLOW}$key${NC} for ${GREEN}$env${NC}..."
    echo "$value" | npx vercel env add "$key" "$env" 2>/dev/null || \
    echo -e "${YELLOW}Variable might already exist. Attempting to remove and re-add...${NC}" && \
    npx vercel env rm "$key" "$env" -y 2>/dev/null && \
    echo "$value" | npx vercel env add "$key" "$env"
}

# Staging (Preview) Values
STAGING_URL="https://wuinfsedukvxlkfvlpna.supabase.co"
STAGING_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aW5mc2VkdWt2eGxrZnZscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODAyNzksImV4cCI6MjA3Mzk1NjI3OX0.e0jkrGdwA6-lKRN-nbu_GDsoQWv_wq74Z535_1jqwTU"

# Production Values
PROD_URL="https://fkjbvwbnbxslornufhlp.supabase.co"
PROD_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZramJ2d2JuYnhzbG9ybnVmaGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODAyMTYsImV4cCI6MjA3Mzk1NjIxNn0.V0PjH40lQndc4RoEs6pUiJi_DwYg2Ou6UB_QPfQV24k"

# Configure Preview
echo -e "\n${BLUE}--- Configuring Preview Environment ---${NC}"
add_env_var "VITE_SUPABASE_URL" "$STAGING_URL" "preview"
add_env_var "VITE_SUPABASE_ANON_KEY" "$STAGING_KEY" "preview"

# Configure Production
echo -e "\n${BLUE}--- Configuring Production Environment ---${NC}"
add_env_var "VITE_SUPABASE_URL" "$PROD_URL" "production"
add_env_var "VITE_SUPABASE_ANON_KEY" "$PROD_KEY" "production"

echo -e "\n${GREEN}=== Configuration Complete! ===${NC}"
echo -e "You can verify variables in the Vercel Dashboard or by running 'npx vercel env ls'"

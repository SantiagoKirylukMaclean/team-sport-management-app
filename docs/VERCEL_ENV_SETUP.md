# Vercel Environment Variables Configuration Guide

This guide provides step-by-step instructions for configuring environment variables in Vercel for both staging (Preview) and production environments.

## Overview

The application requires Supabase connection details to be configured as environment variables in Vercel. These variables tell the frontend application which Supabase project to connect to based on the deployment environment.

## Required Environment Variables

The following environment variables must be configured in Vercel:

1. `VITE_SUPABASE_URL` - The URL of your Supabase project
2. `VITE_SUPABASE_ANON_KEY` - The anonymous (public) key for your Supabase project

These variables must be configured separately for:
- **Preview environment** (staging) - Connected to staging Supabase project
- **Production environment** - Connected to production Supabase project

## Prerequisites

Before configuring environment variables, ensure you have:
- Access to the Vercel project with appropriate permissions
- Access to both Supabase projects (staging and production)
- The Supabase project URLs and anon keys

## Environment Values

### Staging (Preview Environment)

Use these values for the Preview environment:

```
VITE_SUPABASE_URL=https://wuinfsedukvxlkfvlpna.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aW5mc2VkdWt2eGxrZnZscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODAyNzksImV4cCI6MjA3Mzk1NjI3OX0.e0jkrGdwA6-lKRN-nbu_GDsoQWv_wq74Z535_1jqwTU
```

### Production Environment

Use these values for the Production environment:

```
VITE_SUPABASE_URL=https://fkjbvwbnbxslornufhlp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZramJ2d2JuYnhzbG9ybnVmaGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODAyMTYsImV4cCI6MjA3Mzk1NjIxNn0.V0PjH40lQndc4RoEs6pUiJi_DwYg2Ou6UB_QPfQV24k
```

## Step-by-Step Configuration

### Method 1: Using Vercel Dashboard (Recommended)

#### 1. Navigate to Project Settings

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Log in with your account
3. Select your project from the projects list
4. Click on **Settings** in the top navigation bar

#### 2. Access Environment Variables

1. In the left sidebar, click on **Environment Variables**
2. You'll see a form to add new environment variables

#### 3. Add VITE_SUPABASE_URL for Preview

1. In the **Key** field, enter: `VITE_SUPABASE_URL`
2. In the **Value** field, enter: `https://wuinfsedukvxlkfvlpna.supabase.co`
3. Under **Environments**, select **Preview** only
4. Click **Save**

#### 4. Add VITE_SUPABASE_URL for Production

1. Click **Add Another** or the **+** button to add a new variable
2. In the **Key** field, enter: `VITE_SUPABASE_URL`
3. In the **Value** field, enter: `https://fkjbvwbnbxslornufhlp.supabase.co`
4. Under **Environments**, select **Production** only
5. Click **Save**

#### 5. Add VITE_SUPABASE_ANON_KEY for Preview

1. Click **Add Another** to add a new variable
2. In the **Key** field, enter: `VITE_SUPABASE_ANON_KEY`
3. In the **Value** field, paste the staging anon key:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aW5mc2VkdWt2eGxrZnZscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODAyNzksImV4cCI6MjA3Mzk1NjI3OX0.e0jkrGdwA6-lKRN-nbu_GDsoQWv_wq74Z535_1jqwTU
   ```
4. Under **Environments**, select **Preview** only
5. **Optional**: Check **Sensitive** to hide the value in the UI (recommended for keys)
6. Click **Save**

#### 6. Add VITE_SUPABASE_ANON_KEY for Production

1. Click **Add Another** to add a new variable
2. In the **Key** field, enter: `VITE_SUPABASE_ANON_KEY`
3. In the **Value** field, paste the production anon key:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZramJ2d2JuYnhzbG9ybnVmaGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODAyMTYsImV4cCI6MjA3Mzk1NjIxNn0.V0PjH40lQndc4RoEs6pUiJi_DwYg2Ou6UB_QPfQV24k
   ```
4. Under **Environments**, select **Production** only
5. **Optional**: Check **Sensitive** to hide the value in the UI (recommended for keys)
6. Click **Save**

#### 7. Verify Configuration

After adding all variables, you should see:

**Preview Environment**:
- `VITE_SUPABASE_URL` = `https://wuinfsedukvxlkfvlpna.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJhbGc...` (staging key)

**Production Environment**:
- `VITE_SUPABASE_URL` = `https://fkjbvwbnbxslornufhlp.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJhbGc...` (production key)

### Method 2: Using Vercel CLI

If you prefer using the command line:

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Link to Your Project

```bash
cd /path/to/your/project
vercel link
```

#### 4. Add Environment Variables

Add variables for Preview environment:

```bash
vercel env add VITE_SUPABASE_URL preview
# When prompted, enter: https://wuinfsedukvxlkfvlpna.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY preview
# When prompted, paste the staging anon key
```

Add variables for Production environment:

```bash
vercel env add VITE_SUPABASE_URL production
# When prompted, enter: https://fkjbvwbnbxslornufhlp.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# When prompted, paste the production anon key
```

#### 5. Verify Configuration

List all environment variables:

```bash
vercel env ls
```

You should see all four variables listed with their respective environments.

## Understanding Environment Variables

### VITE_SUPABASE_URL

**Purpose**: Tells the application which Supabase project to connect to

**Format**: `https://<project-ref>.supabase.co`

**Where to find it**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL**

### VITE_SUPABASE_ANON_KEY

**Purpose**: Provides public authentication for client-side requests

**Format**: JWT token (long string starting with `eyJ...`)

**Where to find it**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **anon public** key

**Security Note**: The anon key is designed to be public and exposed in frontend code. Security is enforced through Row Level Security (RLS) policies in your Supabase database, not by hiding this key.

## How Environment Variables Work

### Build-Time vs Runtime

Vite environment variables (prefixed with `VITE_`) are **build-time** variables:
- They are embedded into the JavaScript bundle during the build process
- The values are determined by the environment where the build occurs
- Changing them requires a new deployment

### Environment Selection

Vercel automatically selects the correct environment based on the deployment type:

| Deployment Type | Branch | Environment | Variables Used |
|----------------|--------|-------------|----------------|
| Production | `main` | Production | Production values |
| Preview | `stage` or PR | Preview | Preview values |
| Development | Local | Development | `.env.local` values |

### Variable Precedence

When multiple environments are selected for a variable, Vercel uses this precedence:
1. Production (highest priority)
2. Preview
3. Development (lowest priority)

**Best Practice**: Always specify exactly one environment per variable to avoid confusion.

## Validation

### Test Preview Deployment

1. Push a change to the `stage` branch:
   ```bash
   git checkout stage
   git pull origin stage
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: validate preview environment variables"
   git push origin stage
   ```

2. Wait for the GitHub Actions workflow to complete
3. Go to Vercel Dashboard → Deployments
4. Find the preview deployment for the `stage` branch
5. Click on the deployment URL
6. Open browser DevTools → Console
7. Check that the app connects to staging Supabase:
   ```javascript
   // In console, check:
   console.log(import.meta.env.VITE_SUPABASE_URL)
   // Should output: https://wuinfsedukvxlkfvlpna.supabase.co
   ```

### Test Production Deployment

1. Merge `stage` to `main`:
   ```bash
   git checkout main
   git pull origin main
   git merge stage
   git push origin main
   ```

2. Wait for the GitHub Actions workflow to complete
3. Go to Vercel Dashboard → Deployments
4. Find the production deployment
5. Click on the production URL
6. Open browser DevTools → Console
7. Check that the app connects to production Supabase:
   ```javascript
   // In console, check:
   console.log(import.meta.env.VITE_SUPABASE_URL)
   // Should output: https://fkjbvwbnbxslornufhlp.supabase.co
   ```

## Troubleshooting

### Error: "supabaseClient is not defined"

**Cause**: Environment variables are not configured or not loaded

**Solution**:
1. Verify variables are configured in Vercel Dashboard
2. Check that variable names match exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Ensure variables are assigned to the correct environment (Preview or Production)
4. Trigger a new deployment to rebuild with the new variables

### Error: "Invalid API key"

**Cause**: Wrong anon key for the environment

**Solution**:
1. Verify you're using the correct anon key for each environment
2. Check that Preview uses staging key and Production uses production key
3. Ensure the key hasn't been rotated in Supabase
4. Update the variable in Vercel and redeploy

### Preview deployment connects to production database

**Cause**: Environment variable is assigned to wrong environment

**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Find `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Verify each variable has two entries:
   - One for Preview with staging values
   - One for Production with production values
4. If a variable is assigned to multiple environments, delete it and recreate with correct environment selection
5. Redeploy to apply changes

### Variables not updating after change

**Cause**: Vercel caches environment variables during build

**Solution**:
1. After updating variables in Vercel, trigger a new deployment
2. Go to Vercel Dashboard → Deployments
3. Find the latest deployment
4. Click the three dots menu → **Redeploy**
5. Select **Use existing Build Cache: No** to force a fresh build
6. Click **Redeploy**

### Error: "Failed to fetch" when calling Supabase

**Cause**: Incorrect Supabase URL or network issue

**Solution**:
1. Verify the `VITE_SUPABASE_URL` is correct and accessible
2. Test the URL in a browser: `https://wuinfsedukvxlkfvlpna.supabase.co`
3. Check Supabase project status in the dashboard
4. Ensure no typos in the URL (common: missing 'https://' or extra spaces)
5. Verify CORS settings in Supabase if needed

## Security Considerations

### Anon Key Security

**Important**: The anon key is designed to be public and will be visible in:
- Browser DevTools
- Network requests
- JavaScript source code
- Client-side storage

**Security is enforced through**:
- Row Level Security (RLS) policies in Supabase
- Authentication requirements for sensitive operations
- API rate limiting
- Supabase's built-in security features

**Never use the service_role key in frontend code** - it bypasses all security policies.

### Environment Separation

**Best Practices**:
- Always use separate Supabase projects for staging and production
- Never use production credentials in preview deployments
- Test thoroughly in staging before deploying to production
- Monitor both environments for unusual activity

### Key Rotation

If you need to rotate Supabase keys:

1. Generate new keys in Supabase Dashboard:
   - Go to Settings → API
   - Click **Reset** next to the anon key (if available)
   - Or create a new project and migrate data

2. Update Vercel environment variables with new keys

3. Redeploy all environments:
   ```bash
   # Redeploy preview
   git push origin stage --force-with-lease
   
   # Redeploy production
   git push origin main --force-with-lease
   ```

4. Old deployments will continue using old keys until redeployed

## Adding New Environment Variables

If you need to add additional environment variables in the future:

### 1. Add to Local Development

Update `.env.local`:
```bash
VITE_NEW_VARIABLE=local_value
```

### 2. Add to Vercel

Follow the same process as above:
- Add variable for Preview environment with staging value
- Add variable for Production environment with production value

### 3. Update Application Code

Access the variable in your code:
```typescript
const newVariable = import.meta.env.VITE_NEW_VARIABLE;
```

### 4. Document the Variable

Update this guide and any relevant documentation with:
- Variable name and purpose
- Where to find the value
- Which environments need it
- Any security considerations

## Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite Environment Variables Guide](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase API Settings](https://supabase.com/docs/guides/api)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)

## Support

If you encounter issues not covered in this guide:

1. Check the [Vercel deployment logs](https://vercel.com/docs/concepts/deployments/logs) for build errors
2. Review the [Supabase Troubleshooting Guide](./SUPABASE_TROUBLESHOOTING.md)
3. Consult the [Local Development Guide](./LOCAL_DEVELOPMENT.md) for testing locally
4. Check the [GitHub Secrets Setup Guide](./GITHUB_SECRETS_SETUP.md) for CI/CD configuration
5. Contact the DevOps team for assistance

## Summary Checklist

Before deploying, ensure:

- [ ] Added `VITE_SUPABASE_URL` for Preview environment (staging URL)
- [ ] Added `VITE_SUPABASE_URL` for Production environment (production URL)
- [ ] Added `VITE_SUPABASE_ANON_KEY` for Preview environment (staging key)
- [ ] Added `VITE_SUPABASE_ANON_KEY` for Production environment (production key)
- [ ] Verified each variable is assigned to exactly one environment
- [ ] Tested preview deployment connects to staging Supabase
- [ ] Tested production deployment connects to production Supabase
- [ ] Documented any additional custom environment variables
- [ ] Verified application functionality in both environments

## Quick Reference

### Staging (Preview) Values
```bash
VITE_SUPABASE_URL=https://wuinfsedukvxlkfvlpna.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aW5mc2VkdWt2eGxrZnZscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODAyNzksImV4cCI6MjA3Mzk1NjI3OX0.e0jkrGdwA6-lKRN-nbu_GDsoQWv_wq74Z535_1jqwTU
```

### Production Values
```bash
VITE_SUPABASE_URL=https://fkjbvwbnbxslornufhlp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZramJ2d2JuYnhzbG9ybnVmaGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODAyMTYsImV4cCI6MjA3Mzk1NjIxNn0.V0PjH40lQndc4RoEs6pUiJi_DwYg2Ou6UB_QPfQV24k
```

# GitHub Secrets Configuration Guide

This guide provides step-by-step instructions for configuring all GitHub Secrets required for the CI/CD deployment pipeline.

## Overview

The CI/CD workflows require several secrets to authenticate with Supabase and Vercel. These secrets must be configured in your GitHub repository settings before the workflows can run successfully.

## Required Secrets

The following secrets are required:

1. `SUPABASE_ACCESS_TOKEN_STAGING` - Access token for Supabase staging project
2. `SUPABASE_ACCESS_TOKEN_PROD` - Access token for Supabase production project
3. `VERCEL_TOKEN` - Authentication token for Vercel deployments
4. `VERCEL_ORG_ID` - Your Vercel organization ID
5. `VERCEL_PROJECT_ID` - Your Vercel project ID

## Prerequisites

Before configuring secrets, ensure you have:
- Admin access to the GitHub repository
- Access to both Supabase projects (staging and production)
- Access to the Vercel project
- Appropriate permissions to create access tokens

## Step-by-Step Configuration

### 1. Configure Supabase Access Tokens

#### 1.1 Generate Supabase Access Token for Staging

1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard)
2. Log in with your account
3. Click on your profile icon in the top right corner
4. Select **Account Settings** from the dropdown
5. In the left sidebar, click on **Access Tokens**
6. Click **Generate New Token**
7. Provide a descriptive name: `GitHub Actions - Staging`
8. Set an appropriate expiration date (recommended: 1 year)
9. Click **Generate Token**
10. **Important**: Copy the token immediately - it will only be shown once
11. Save this token securely - you'll add it to GitHub in step 3

#### 1.2 Generate Supabase Access Token for Production

1. Follow the same steps as above (1.1)
2. Use the name: `GitHub Actions - Production`
3. Copy and save this token separately from the staging token

**Security Note**: These tokens provide full access to your Supabase projects. Keep them secure and never commit them to your repository.

### 2. Configure Vercel Tokens and IDs

#### 2.1 Generate Vercel Token

1. Navigate to [Vercel Dashboard](https://vercel.com/dashboard)
2. Log in with your account
3. Click on your profile icon in the top right corner
4. Select **Settings** from the dropdown
5. In the left sidebar, click on **Tokens**
6. Click **Create Token**
7. Provide a descriptive name: `GitHub Actions CI/CD`
8. Select the appropriate scope:
   - **Recommended**: Select specific projects if available
   - **Alternative**: Full Account access (use with caution)
9. Set an expiration date (recommended: 1 year)
10. Click **Create Token**
11. **Important**: Copy the token immediately - it will only be shown once
12. Save this token securely

#### 2.2 Get Vercel Organization ID

1. In the Vercel Dashboard, click on your profile/team name in the top left
2. Select **Settings** from the dropdown
3. In the **General** tab, find the **Organization ID** section
4. Copy the Organization ID (format: `team_xxxxxxxxxxxxx` or similar)
5. Save this ID - you'll need it for GitHub Secrets

**Note**: If you're using a personal account instead of a team, your Organization ID might be your user ID.

#### 2.3 Get Vercel Project ID

1. In the Vercel Dashboard, navigate to your project
2. Click on **Settings** in the top navigation
3. In the **General** tab, scroll down to find the **Project ID** section
4. Copy the Project ID (format: `prj_xxxxxxxxxxxxx` or similar)
5. Save this ID - you'll need it for GitHub Secrets

**Alternative Method** (using Vercel CLI):
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to your project directory
cd /path/to/your/project

# Link to your Vercel project
vercel link

# Get project information (includes Project ID)
vercel project ls
```

### 3. Add Secrets to GitHub Repository

#### 3.1 Navigate to Repository Secrets

1. Go to your GitHub repository
2. Click on **Settings** in the top navigation
3. In the left sidebar, expand **Secrets and variables**
4. Click on **Actions**

#### 3.2 Add Each Secret

For each of the five secrets, follow these steps:

1. Click **New repository secret**
2. Enter the **Name** (exactly as shown below)
3. Paste the corresponding **Value**
4. Click **Add secret**

**Secrets to Add**:

| Secret Name | Value Source | Description |
|------------|--------------|-------------|
| `SUPABASE_ACCESS_TOKEN_STAGING` | From step 1.1 | Supabase staging access token |
| `SUPABASE_ACCESS_TOKEN_PROD` | From step 1.2 | Supabase production access token |
| `VERCEL_TOKEN` | From step 2.1 | Vercel authentication token |
| `VERCEL_ORG_ID` | From step 2.2 | Vercel organization ID |
| `VERCEL_PROJECT_ID` | From step 2.3 | Vercel project ID |

#### 3.3 Verify Secrets Configuration

After adding all secrets, you should see all five listed in the repository secrets page:

```
✓ SUPABASE_ACCESS_TOKEN_STAGING
✓ SUPABASE_ACCESS_TOKEN_PROD
✓ VERCEL_TOKEN
✓ VERCEL_ORG_ID
✓ VERCEL_PROJECT_ID
```

**Note**: GitHub will show when each secret was last updated but will never display the actual values for security reasons.

## Validation

### Test Staging Workflow

1. Create a test branch from `stage`:
   ```bash
   git checkout stage
   git pull origin stage
   git checkout -b test-staging-secrets
   ```

2. Make a small change (e.g., update a comment in README)
3. Commit and push to `stage`:
   ```bash
   git add .
   git commit -m "test: validate staging secrets configuration"
   git push origin test-staging-secrets
   git checkout stage
   git merge test-staging-secrets
   git push origin stage
   ```

4. Go to **Actions** tab in GitHub
5. Watch the `Deploy to Staging` workflow
6. If secrets are configured correctly, the workflow should:
   - ✓ Checkout code
   - ✓ Setup Supabase CLI
   - ✓ Run migrations (or skip if none pending)
   - ✓ Deploy edge functions
   - ✓ Deploy to Vercel

### Test Production Workflow

**Warning**: Only test production after validating staging works correctly.

1. If staging workflow succeeded, merge `stage` to `main`:
   ```bash
   git checkout main
   git pull origin main
   git merge stage
   git push origin main
   ```

2. Go to **Actions** tab in GitHub
3. Watch the `Deploy to Production` workflow
4. Verify all steps complete successfully

## Troubleshooting

### Error: "SUPABASE_ACCESS_TOKEN_STAGING not found"

**Cause**: Secret name is misspelled or not configured

**Solution**:
1. Go to repository Settings → Secrets and variables → Actions
2. Verify the secret name matches exactly: `SUPABASE_ACCESS_TOKEN_STAGING`
3. Secret names are case-sensitive
4. If missing, add the secret following step 3.2

### Error: "Invalid Supabase access token"

**Cause**: Token is expired, revoked, or incorrect

**Solution**:
1. Generate a new access token following step 1.1 or 1.2
2. Update the secret in GitHub:
   - Go to repository Settings → Secrets and variables → Actions
   - Click on the secret name
   - Click **Update secret**
   - Paste the new token
   - Click **Update secret**

### Error: "Vercel authentication failed"

**Cause**: Vercel token is invalid or expired

**Solution**:
1. Generate a new Vercel token following step 2.1
2. Update the `VERCEL_TOKEN` secret in GitHub
3. Ensure the token has appropriate permissions for the project

### Error: "Project not found" (Vercel)

**Cause**: `VERCEL_PROJECT_ID` or `VERCEL_ORG_ID` is incorrect

**Solution**:
1. Verify the IDs following steps 2.2 and 2.3
2. Update the secrets in GitHub with the correct values
3. Ensure you're using the correct project (not a different Vercel project)

### Error: "Permission denied" (Supabase)

**Cause**: Access token doesn't have sufficient permissions

**Solution**:
1. Verify you're using a personal access token (not a project-specific key)
2. Ensure the token was generated from your account settings
3. Generate a new token with full access
4. Update the secret in GitHub

## Security Best Practices

### Token Rotation

- **Rotate tokens every 6-12 months** to maintain security
- Set expiration dates when creating tokens
- Update GitHub secrets before tokens expire to avoid workflow failures

### Access Control

- **Limit repository access**: Only give admin access to trusted team members
- **Use team accounts**: For production, consider using a dedicated service account
- **Audit regularly**: Review who has access to repository settings

### Token Scope

- **Principle of least privilege**: Use tokens with minimum required permissions
- **Separate tokens**: Use different tokens for staging and production
- **Monitor usage**: Check Supabase and Vercel dashboards for unusual activity

### Incident Response

If a token is compromised:

1. **Immediately revoke** the token in Supabase/Vercel dashboard
2. **Generate a new token** following the steps above
3. **Update the GitHub secret** with the new token
4. **Review recent activity** in Supabase/Vercel for unauthorized access
5. **Notify team members** if necessary

## Additional Resources

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Supabase Access Tokens](https://supabase.com/docs/guides/platform/access-tokens)
- [Vercel Tokens](https://vercel.com/docs/rest-api#authentication)

## Support

If you encounter issues not covered in this guide:

1. Check the [GitHub Actions logs](../../actions) for detailed error messages
2. Review the [Supabase Troubleshooting Guide](./SUPABASE_TROUBLESHOOTING.md)
3. Consult the [Local Development Guide](./LOCAL_DEVELOPMENT.md) for testing locally first
4. Contact the DevOps team for assistance

## Summary Checklist

Before running workflows, ensure:

- [ ] Generated Supabase access token for staging
- [ ] Generated Supabase access token for production
- [ ] Generated Vercel authentication token
- [ ] Retrieved Vercel Organization ID
- [ ] Retrieved Vercel Project ID
- [ ] Added all 5 secrets to GitHub repository
- [ ] Verified secret names match exactly (case-sensitive)
- [ ] Tested staging workflow successfully
- [ ] Tested production workflow successfully
- [ ] Documented token expiration dates for future rotation

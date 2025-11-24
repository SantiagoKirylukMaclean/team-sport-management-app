# CI/CD Pipeline Testing Guide

This guide provides step-by-step instructions for testing the CI/CD pipeline.

## Quick Validation (No Deployment)

Run the validation script to check that everything is configured correctly:

```bash
./scripts/test-cicd-pipeline.sh
```

This will validate:
- ✅ Workflow files exist and are correctly configured
- ✅ Documentation is complete
- ✅ Branch triggers are correct
- ✅ Supabase project IDs are correct
- ✅ Secret references are present
- ✅ Step ordering is correct
- ✅ Error handling is in place

## Prerequisites for Live Testing

Before testing actual deployments, ensure:

### 1. GitHub Secrets Configured
See `docs/GITHUB_SECRETS_SETUP.md` for details.

Required secrets:
- `SUPABASE_ACCESS_TOKEN_STAGING`
- `SUPABASE_ACCESS_TOKEN_PROD`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### 2. Vercel Environment Variables Configured
See `docs/VERCEL_ENV_SETUP.md` for details.

Required for Preview environment:
- `VITE_SUPABASE_URL` → https://wuinfsedukvxlkfvlpna.supabase.co
- `VITE_SUPABASE_ANON_KEY` → [staging anon key]

Required for Production environment:
- `VITE_SUPABASE_URL` → https://fkjbvwbnbxslornufhlp.supabase.co
- `VITE_SUPABASE_ANON_KEY` → [production anon key]

## Test 1: Staging Deployment

### Step 1: Create Test Branch
```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create a test branch
git checkout -b test-cicd-staging
```

### Step 2: Make a Test Change
```bash
# Make a small, safe change (e.g., update README)
echo "" >> README.md
echo "CI/CD Pipeline Test - $(date)" >> README.md

# Commit the change
git add README.md
git commit -m "test: validate staging CI/CD pipeline"
```

### Step 3: Push to Stage Branch
```bash
# Switch to stage branch
git checkout stage
git pull origin stage  # Get latest changes

# Merge your test branch
git merge test-cicd-staging

# Push to trigger the workflow
git push origin stage
```

### Step 4: Monitor the Deployment

1. **Go to GitHub Actions**
   - Navigate to: `https://github.com/[your-org]/[your-repo]/actions`
   - You should see "Deploy to Staging" workflow running

2. **Watch the Steps**
   - ✅ Checkout code
   - ✅ Setup Supabase CLI
   - ✅ Setup Node.js
   - ✅ Install Vercel CLI
   - ✅ Run Supabase migrations
   - ✅ Deploy Supabase Edge Functions
   - ✅ Deploy to Vercel Preview
   - ✅ Deployment Summary

3. **Check the Logs**
   - Click on the workflow run
   - Expand each step to see detailed logs
   - Look for the Vercel preview URL in the "Deploy to Vercel Preview" step

### Step 5: Validate the Deployment

1. **Check Supabase Staging**
   - Go to: https://supabase.com/dashboard/project/wuinfsedukvxlkfvlpna
   - Navigate to Database → Migrations
   - Verify all migrations are applied
   - Navigate to Edge Functions
   - Verify functions are deployed

2. **Check Vercel Preview**
   - Copy the preview URL from the workflow logs
   - Open it in your browser
   - Test the application functionality
   - Verify it connects to staging Supabase

3. **Verify Requirements**
   - ✅ Requirement 3.3: Workflow triggered on stage branch
   - ✅ Requirement 5.1: Migrations applied successfully
   - ✅ Requirement 6.1: Edge functions deployed
   - ✅ Requirement 7.1: Vercel deployed to preview
   - ✅ Requirement 10.1, 10.2, 10.3: Steps executed in correct order

## Test 2: Production Deployment

⚠️ **Warning:** Only proceed after thoroughly validating staging deployment.

### Step 1: Merge to Main
```bash
# Ensure stage is working correctly first!
# Then merge to main
git checkout main
git pull origin main

# Merge stage into main
git merge stage

# Push to trigger production deployment
git push origin main
```

### Step 2: Monitor the Deployment

1. **Go to GitHub Actions**
   - Navigate to: `https://github.com/[your-org]/[your-repo]/actions`
   - You should see "Deploy to Production" workflow running

2. **Watch the Steps**
   - ✅ Checkout code
   - ✅ Setup Supabase CLI
   - ✅ Setup Node.js
   - ✅ Install Vercel CLI
   - ✅ Run Supabase migrations
   - ✅ Deploy Supabase Edge Functions
   - ✅ Deploy to Vercel Production
   - ✅ Deployment Summary

3. **Check the Logs**
   - Click on the workflow run
   - Expand each step to see detailed logs
   - Look for the production URL in the "Deploy to Vercel Production" step

### Step 3: Validate the Deployment

1. **Check Supabase Production**
   - Go to: https://supabase.com/dashboard/project/fkjbvwbnbxslornufhlp
   - Navigate to Database → Migrations
   - Verify all migrations are applied
   - Navigate to Edge Functions
   - Verify functions are deployed

2. **Check Vercel Production**
   - Copy the production URL from the workflow logs
   - Open it in your browser
   - Test the application functionality
   - Verify it connects to production Supabase

3. **Verify Requirements**
   - ✅ Requirement 3.5: Workflow triggered on main branch
   - ✅ Requirement 5.1: Migrations applied successfully
   - ✅ Requirement 6.1: Edge functions deployed
   - ✅ Requirement 7.2: Vercel deployed to production
   - ✅ Requirement 10.1, 10.2, 10.3: Steps executed in correct order

## Test 3: Error Handling

### Test Migration Failure

1. **Create a Bad Migration**
```bash
# Create a new branch
git checkout -b test-migration-failure

# Create an intentionally bad migration
cat > supabase/migrations/99999999999999_test_failure.sql << 'EOF'
-- This migration will fail intentionally
SELECT * FROM nonexistent_table;
EOF

git add supabase/migrations/
git commit -m "test: intentional migration failure"
```

2. **Push to Stage**
```bash
git checkout stage
git merge test-migration-failure
git push origin stage
```

3. **Verify Failure Handling**
   - Workflow should fail at "Run Supabase migrations" step
   - Edge Functions deployment should NOT run
   - Vercel deployment should NOT run
   - Previous deployment should remain active

4. **Clean Up**
```bash
# Revert the bad migration
git revert HEAD
git push origin stage

# Delete the test branch
git branch -D test-migration-failure
```

### Test Function Deployment Failure

Similar process but with an intentionally broken edge function.

## Test 4: Rollback

See `docs/DEPLOYMENT_ROLLBACK_GUIDE.md` for detailed rollback procedures.

### Quick Rollback Test

1. **Revert a Commit**
```bash
git checkout stage
git revert HEAD
git push origin stage
```

2. **Verify Rollback**
   - Workflow triggers automatically
   - Previous version is deployed
   - Application returns to previous state

## Validation Checklist

After completing all tests, verify:

- [ ] Staging workflow triggers on push to `stage` branch
- [ ] Production workflow triggers on push to `main` branch
- [ ] Migrations apply successfully in both environments
- [ ] Edge functions deploy successfully in both environments
- [ ] Vercel deploys to preview for staging
- [ ] Vercel deploys to production for main
- [ ] Failed migrations prevent subsequent steps
- [ ] Failed function deployments prevent Vercel deployment
- [ ] Deployment summaries are generated
- [ ] Rollback procedures work correctly

## Troubleshooting

### Workflow Doesn't Trigger

**Problem:** Push to stage/main doesn't trigger workflow

**Solutions:**
1. Check that workflow files are in `.github/workflows/`
2. Verify branch names match exactly (case-sensitive)
3. Check GitHub Actions is enabled for the repository
4. Verify you have push permissions

### Migration Fails

**Problem:** "Run Supabase migrations" step fails

**Solutions:**
1. Check migration syntax locally: `supabase db reset`
2. Verify Supabase access token is valid
3. Check project ID is correct
4. Review migration logs for specific errors

### Function Deployment Fails

**Problem:** "Deploy Supabase Edge Functions" step fails

**Solutions:**
1. Test functions locally: `supabase functions serve`
2. Verify function code has no syntax errors
3. Check function dependencies are included
4. Verify Supabase access token has function deployment permissions

### Vercel Deployment Fails

**Problem:** "Deploy to Vercel" step fails

**Solutions:**
1. Verify Vercel token is valid
2. Check VERCEL_ORG_ID and VERCEL_PROJECT_ID are correct
3. Review build logs for errors
4. Verify environment variables are set in Vercel

### Secrets Not Found

**Problem:** Workflow fails with "secret not found" error

**Solutions:**
1. Go to GitHub repository Settings → Secrets and variables → Actions
2. Verify all required secrets are added
3. Check secret names match exactly (case-sensitive)
4. Regenerate tokens if they've expired

## Additional Resources

- **Local Development:** `docs/LOCAL_DEVELOPMENT.md`
- **GitHub Secrets Setup:** `docs/GITHUB_SECRETS_SETUP.md`
- **Vercel Environment Setup:** `docs/VERCEL_ENV_SETUP.md`
- **Workflow Guide:** `docs/WORKFLOW_GUIDE.md`
- **Rollback Guide:** `docs/DEPLOYMENT_ROLLBACK_GUIDE.md`
- **Test Report:** `docs/CICD_PIPELINE_TEST_REPORT.md`

## Support

If you encounter issues not covered in this guide:

1. Check the workflow logs in GitHub Actions
2. Review the troubleshooting section above
3. Consult the additional resources
4. Check Supabase and Vercel dashboards for errors

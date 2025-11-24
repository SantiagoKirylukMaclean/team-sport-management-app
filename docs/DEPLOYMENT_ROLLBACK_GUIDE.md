# Deployment and Rollback Guide

## Table of Contents

1. [Deployment Flow](#deployment-flow)
2. [Rollback Strategies](#rollback-strategies)
3. [Common Failure Scenarios](#common-failure-scenarios)
4. [Recovery Processes](#recovery-processes)
5. [Best Practices](#best-practices)

---

## Deployment Flow

### Overview

The deployment system uses a three-environment strategy:

```
Local (Docker) → Staging (stage branch) → Production (main branch)
```

### Complete Deployment Workflow

#### 1. Local Development Phase

**Purpose**: Develop and test changes in isolation without affecting remote environments.

```bash
# Start local Supabase services
supabase start

# Create a new migration (if needed)
supabase migration new add_new_feature

# Edit the migration file in supabase/migrations/
# The migration applies automatically to local DB

# Test your changes locally
npm run dev

# Verify the migration worked
supabase db reset  # Resets DB and reapplies all migrations

# Stop services when done
supabase stop
```

**Checklist**:
- [ ] Local Supabase services running
- [ ] Migration created and tested
- [ ] Application works with new schema
- [ ] Edge functions tested (if applicable)
- [ ] All local tests pass

#### 2. Staging Deployment Phase

**Purpose**: Validate changes in a production-like environment before going live.

```bash
# Commit your changes
git add .
git commit -m "feat: add new feature"

# Push to stage branch
git push origin stage
```

**What Happens Automatically**:

1. **GitHub Actions Trigger**: Push to `stage` triggers `.github/workflows/deploy-staging.yml`
2. **Checkout Code**: Workflow checks out the latest code
3. **Setup Tools**: Installs Supabase CLI and Vercel CLI
4. **Run Migrations**: Executes `supabase db push` against staging project (`wuinfsedukvxlkfvlpna`)
   - If migrations fail → workflow stops, deployment aborted
5. **Deploy Edge Functions**: Executes `supabase functions deploy`
   - If deployment fails → workflow stops, Vercel deployment aborted
6. **Deploy to Vercel**: Deploys to Vercel preview environment
   - Uses staging environment variables
   - Generates preview URL
7. **Report Status**: Workflow completes, commit marked with status

**Monitoring**:
- Watch GitHub Actions tab for workflow progress
- Check workflow logs for any errors
- Visit the preview URL to test the deployment

**Validation Checklist**:
- [ ] Workflow completed successfully
- [ ] Migrations applied without errors
- [ ] Edge functions deployed
- [ ] Preview URL accessible
- [ ] Application functions correctly in staging
- [ ] Database schema matches expectations

#### 3. Production Deployment Phase

**Purpose**: Deploy validated changes to production.

```bash
# After staging validation, merge to main
git checkout main
git merge stage
git push origin main
```

**What Happens Automatically**:

1. **GitHub Actions Trigger**: Push to `main` triggers `.github/workflows/deploy-production.yml`
2. **Checkout Code**: Workflow checks out the latest code
3. **Setup Tools**: Installs Supabase CLI and Vercel CLI
4. **Run Migrations**: Executes `supabase db push` against production project (`fkjbvwbnbxslornufhlp`)
   - If migrations fail → workflow stops, deployment aborted
5. **Deploy Edge Functions**: Executes `supabase functions deploy`
   - If deployment fails → workflow stops, Vercel deployment aborted
6. **Deploy to Vercel**: Deploys to Vercel production environment
   - Uses production environment variables
   - Updates production URL
7. **Report Status**: Workflow completes, commit marked with status

**Monitoring**:
- Watch GitHub Actions tab for workflow progress
- Check workflow logs for any errors
- Visit production URL to verify deployment
- Monitor error tracking tools (if configured)

**Validation Checklist**:
- [ ] Workflow completed successfully
- [ ] Migrations applied without errors
- [ ] Edge functions deployed
- [ ] Production URL accessible
- [ ] Application functions correctly
- [ ] No errors in production logs
- [ ] Database schema matches expectations

---

## Rollback Strategies

### Strategy Overview

Different components require different rollback approaches:

| Component | Rollback Method | Automatic? | Risk Level |
|-----------|----------------|------------|------------|
| Application Code | Git revert + redeploy | No | Low |
| Edge Functions | Git revert + redeploy | No | Low |
| Database Migrations | Manual migration | No | High |
| Environment Variables | Vercel dashboard | No | Medium |

### 1. Application Code Rollback

**When to Use**: 
- Application has bugs in production
- Performance issues detected
- Breaking changes in frontend

**Process**:

```bash
# Option A: Revert the problematic commit
git revert <commit-hash>
git push origin main

# Option B: Reset to previous working commit (use with caution)
git reset --hard <previous-commit-hash>
git push origin main --force

# Option C: Create a fix commit
# Make your fixes
git commit -m "fix: resolve production issue"
git push origin main
```

**Timeline**: 5-10 minutes (time for workflow to complete)

**Risks**: 
- Low risk - previous deployment remains active until new one completes
- Vercel maintains previous deployment as fallback

**Verification**:
```bash
# Check workflow status
# Visit production URL
# Verify application works as expected
```

### 2. Edge Functions Rollback

**When to Use**:
- Function has bugs
- Function causing errors
- Performance issues with function

**Process**:

```bash
# Revert the function code
git revert <commit-hash>
git push origin main

# The workflow will automatically redeploy the previous version
```

**Alternative - Manual Rollback**:

```bash
# Checkout previous version of function
git checkout <previous-commit> -- supabase/functions/<function-name>

# Commit and push
git commit -m "rollback: revert function to previous version"
git push origin main
```

**Timeline**: 5-10 minutes

**Risks**: 
- Low risk - previous function version remains active until new deployment
- Function calls continue to work during rollback

**Verification**:
```bash
# Test function endpoint
curl https://wuinfsedukvxlkfvlpna.supabase.co/functions/v1/<function-name>

# Check Supabase function logs
```

### 3. Database Migration Rollback

**When to Use**:
- Migration caused data issues
- Migration broke application functionality
- Migration has performance problems

**⚠️ IMPORTANT**: Database migrations are NOT automatically rolled back. This is intentional to prevent data loss.

**Process**:

#### Option A: Create Reverse Migration (Recommended)

```bash
# 1. Create a new migration locally
supabase migration new rollback_feature_name

# 2. Write SQL to reverse the changes
# Example: If original migration added a column
```

```sql
-- Original migration: 20231120000000_add_user_preferences.sql
ALTER TABLE users ADD COLUMN preferences JSONB;

-- Rollback migration: 20231120100000_rollback_user_preferences.sql
ALTER TABLE users DROP COLUMN preferences;
```

```bash
# 3. Test locally
supabase db reset

# 4. Deploy through normal flow
git add supabase/migrations/
git commit -m "rollback: remove user preferences column"
git push origin stage  # Test in staging first!

# 5. After staging validation, deploy to production
git push origin main
```

**Timeline**: 30-60 minutes (includes testing)

**Risks**: 
- **HIGH RISK** - Can cause data loss if not careful
- Must consider data that exists in the columns/tables being removed
- May need data migration before schema rollback

#### Option B: Manual Database Changes (Emergency Only)

```bash
# 1. Access Supabase Dashboard
# Go to https://supabase.com/dashboard/project/<project-id>

# 2. Navigate to SQL Editor

# 3. Execute rollback SQL manually
# ⚠️ Test in staging first!

# 4. Document the manual change
# Create a migration file that matches what you did manually
```

**Timeline**: 10-20 minutes

**Risks**: 
- **VERY HIGH RISK** - No version control
- Can cause inconsistency between environments
- Must manually sync migration files

#### Option C: Restore from Backup

```bash
# 1. Access Supabase Dashboard
# Go to Database → Backups

# 2. Select backup point before problematic migration

# 3. Restore backup
# ⚠️ This will lose ALL data changes since backup

# 4. Re-apply safe migrations if needed
```

**Timeline**: 15-30 minutes (depending on database size)

**Risks**: 
- **VERY HIGH RISK** - Loses all data changes since backup
- Should only be used in catastrophic scenarios
- Requires careful coordination with users

### 4. Environment Variables Rollback

**When to Use**:
- Wrong API keys deployed
- Configuration causing issues
- Need to revert to previous settings

**Process**:

```bash
# 1. Access Vercel Dashboard
# Go to https://vercel.com/dashboard

# 2. Navigate to Project → Settings → Environment Variables

# 3. Update the problematic variable(s)
# - Change value
# - Or delete and recreate

# 4. Redeploy to apply changes
# Option A: Trigger redeploy from Vercel dashboard
# Option B: Push empty commit to trigger workflow
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

**Timeline**: 5-10 minutes

**Risks**: 
- Medium risk - wrong values can break application
- Changes apply immediately on next deployment

---

## Common Failure Scenarios

### Scenario 1: Migration Fails During Deployment

**Symptoms**:
- Workflow fails at "Run migrations" step
- Error message in GitHub Actions logs
- Application still works (previous version active)

**Example Error**:
```
Error: Database error
column "new_column" of relation "users" already exists
```

**Root Causes**:
- Migration not idempotent (doesn't use `IF NOT EXISTS`)
- Migration conflicts with existing schema
- Syntax error in SQL
- Permission issues

**Recovery Process**:

1. **Identify the Problem**:
```bash
# Check workflow logs in GitHub Actions
# Look for the specific SQL error
```

2. **Fix Locally**:
```bash
# Reset local database
supabase db reset

# If it fails locally, fix the migration file
# Make it idempotent:
```

```sql
-- Bad (not idempotent)
ALTER TABLE users ADD COLUMN preferences JSONB;

-- Good (idempotent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB;
```

3. **Test the Fix**:
```bash
# Reset and test multiple times
supabase db reset
supabase db reset  # Should work second time too
```

4. **Deploy the Fix**:
```bash
git add supabase/migrations/
git commit -m "fix: make migration idempotent"
git push origin stage  # Test in staging first
```

5. **Verify**:
- Check workflow completes successfully
- Verify schema in Supabase dashboard
- Test application functionality

**Prevention**:
- Always use `IF NOT EXISTS` / `IF EXISTS`
- Test migrations locally with `supabase db reset` multiple times
- Review migration SQL before committing

### Scenario 2: Edge Function Deployment Fails

**Symptoms**:
- Workflow fails at "Deploy edge functions" step
- Error in GitHub Actions logs
- Previous function version still active

**Example Error**:
```
Error: Failed to deploy function 'invite-user'
Import error: Cannot find module 'some-package'
```

**Root Causes**:
- Missing dependencies in function
- Syntax error in function code
- Import path issues
- Environment variable missing

**Recovery Process**:

1. **Check Function Locally**:
```bash
# Serve function locally
supabase functions serve invite-user

# Test it
curl -i --location --request POST 'http://localhost:54321/functions/v1/invite-user' \
  --header 'Authorization: Bearer <anon-key>' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@example.com"}'
```

2. **Fix the Issue**:
```typescript
// Common fixes:

// Fix 1: Add missing import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Fix 2: Fix import path
import { corsHeaders } from '../_shared/cors.ts'  // Correct relative path

// Fix 3: Add error handling
try {
  // function logic
} catch (error) {
  return new Response(JSON.stringify({ error: error.message }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

3. **Test Again Locally**:
```bash
supabase functions serve invite-user
# Test with curl
```

4. **Deploy**:
```bash
git add supabase/functions/
git commit -m "fix: resolve function deployment issue"
git push origin stage
```

**Prevention**:
- Always test functions locally before pushing
- Use `supabase functions serve` during development
- Check Deno import URLs are accessible
- Verify environment variables are set

### Scenario 3: Vercel Deployment Fails

**Symptoms**:
- Workflow fails at "Deploy to Vercel" step
- Build errors in logs
- Previous deployment still active

**Example Error**:
```
Error: Command "npm run build" exited with 1
Module not found: Can't resolve './components/NewComponent'
```

**Root Causes**:
- Build errors (TypeScript, ESLint)
- Missing dependencies
- Environment variables not set
- Import path issues

**Recovery Process**:

1. **Reproduce Locally**:
```bash
# Clean install and build
rm -rf node_modules
npm install
npm run build
```

2. **Fix Build Errors**:
```bash
# Common fixes:

# Fix 1: Missing dependency
npm install missing-package

# Fix 2: TypeScript error
# Fix type issues in code

# Fix 3: Import path
# Use correct relative or absolute path

# Fix 4: Environment variable
# Add to .env.local for testing
```

3. **Verify Build**:
```bash
npm run build
# Should complete without errors

# Test the build
npm run preview
```

4. **Deploy**:
```bash
git add .
git commit -m "fix: resolve build errors"
git push origin stage
```

**Prevention**:
- Run `npm run build` before committing
- Use TypeScript strict mode
- Configure ESLint to catch issues early
- Test builds in CI before deployment

### Scenario 4: Missing or Invalid Secrets

**Symptoms**:
- Workflow fails immediately
- Authentication error in logs
- "Secret not found" error

**Example Error**:
```
Error: Input required and not supplied: SUPABASE_ACCESS_TOKEN
```

**Root Causes**:
- Secret not configured in GitHub
- Secret name typo
- Token expired or invalid
- Wrong permissions on token

**Recovery Process**:

1. **Verify Secret Exists**:
```bash
# Go to GitHub repository
# Settings → Secrets and variables → Actions
# Check if secret exists
```

2. **Generate New Token** (if needed):

For Supabase:
```bash
# Go to https://supabase.com/dashboard/account/tokens
# Click "Generate new token"
# Give it a descriptive name: "GitHub Actions - Staging"
# Copy the token
```

For Vercel:
```bash
# Go to https://vercel.com/account/tokens
# Click "Create"
# Give it a name: "GitHub Actions"
# Copy the token
```

3. **Update Secret**:
```bash
# In GitHub repository settings
# Settings → Secrets and variables → Actions
# Click "New repository secret" or "Update"
# Name: SUPABASE_ACCESS_TOKEN_STAGING
# Value: <paste token>
# Click "Add secret"
```

4. **Re-run Workflow**:
```bash
# Go to GitHub Actions tab
# Find the failed workflow
# Click "Re-run jobs"
```

**Prevention**:
- Document all required secrets
- Use descriptive secret names
- Set token expiration reminders
- Test secrets after creation

### Scenario 5: Database Connection Issues

**Symptoms**:
- Migration step hangs or times out
- "Connection refused" errors
- "Authentication failed" errors

**Example Error**:
```
Error: Connection to database failed
could not connect to server: Connection refused
```

**Root Causes**:
- Supabase project paused (free tier)
- Network issues
- Invalid project ID
- Database overloaded

**Recovery Process**:

1. **Check Project Status**:
```bash
# Go to Supabase Dashboard
# Check if project is active
# Free tier projects pause after inactivity
```

2. **Resume Project** (if paused):
```bash
# Click "Resume project" in dashboard
# Wait for project to start (1-2 minutes)
```

3. **Verify Connection**:
```bash
# Test connection with Supabase CLI
supabase db push --project-ref wuinfsedukvxlkfvlpna

# Should connect successfully
```

4. **Re-run Workflow**:
```bash
# Go to GitHub Actions
# Re-run the failed workflow
```

**Prevention**:
- Upgrade to paid tier for production
- Keep projects active with regular deployments
- Monitor project status
- Set up alerts for project issues

---

## Recovery Processes

### Process 1: Emergency Rollback (Critical Production Issue)

**When to Use**: Production is broken and users are affected

**Timeline**: 10-15 minutes

**Steps**:

1. **Assess the Situation** (2 minutes):
```bash
# Check what changed
git log --oneline -5

# Check error logs
# - Vercel dashboard
# - Supabase logs
# - Browser console
```

2. **Identify Last Working Commit** (2 minutes):
```bash
# Find the commit before the problem
git log --oneline

# Note the commit hash
```

3. **Revert to Working Version** (3 minutes):
```bash
# Option A: Revert specific commit
git revert <bad-commit-hash>
git push origin main

# Option B: Reset to working commit (if multiple bad commits)
git reset --hard <good-commit-hash>
git push origin main --force
```

4. **Monitor Deployment** (5 minutes):
```bash
# Watch GitHub Actions workflow
# Wait for deployment to complete
# Verify production is working
```

5. **Communicate**:
```bash
# Notify team
# Update status page (if applicable)
# Document the incident
```

6. **Post-Mortem** (later):
```bash
# Investigate root cause
# Create fix in feature branch
# Test thoroughly in staging
# Deploy fix when ready
```

### Process 2: Migration Recovery (Data Integrity Issue)

**When to Use**: Migration caused data problems but application still works

**Timeline**: 30-60 minutes

**Steps**:

1. **Stop Further Deployments** (2 minutes):
```bash
# Communicate to team: no deployments
# Consider protecting main branch temporarily
```

2. **Assess Data Impact** (10 minutes):
```sql
-- Connect to Supabase SQL Editor
-- Check affected data

-- Example: Check if column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'preferences';

-- Example: Check data in affected column
SELECT id, preferences 
FROM users 
WHERE preferences IS NOT NULL 
LIMIT 10;
```

3. **Create Data Backup** (5 minutes):
```sql
-- Export affected data
COPY (SELECT * FROM users) TO '/tmp/users_backup.csv' CSV HEADER;

-- Or use Supabase dashboard to export table
```

4. **Create Reverse Migration** (10 minutes):
```bash
# Create new migration
supabase migration new rollback_problematic_change

# Write reverse SQL
```

```sql
-- Example: Safely remove column with data preservation
-- First, backup data if needed
CREATE TABLE users_preferences_backup AS 
SELECT id, preferences FROM users WHERE preferences IS NOT NULL;

-- Then remove column
ALTER TABLE users DROP COLUMN preferences;
```

5. **Test in Staging** (15 minutes):
```bash
# Deploy to staging
git add supabase/migrations/
git commit -m "rollback: reverse problematic migration"
git push origin stage

# Verify in staging
# - Check data integrity
# - Test application
# - Verify no errors
```

6. **Deploy to Production** (10 minutes):
```bash
# After staging validation
git checkout main
git merge stage
git push origin main

# Monitor deployment
# Verify data integrity
```

7. **Verify and Document** (10 minutes):
```sql
-- Verify schema is correct
\d users

-- Verify data is intact
SELECT COUNT(*) FROM users;

-- Document what happened and how it was fixed
```

### Process 3: Complete Environment Recovery

**When to Use**: Multiple components failed, need full recovery

**Timeline**: 1-2 hours

**Steps**:

1. **Identify All Issues** (15 minutes):
```bash
# Check all components:
# - Application code status
# - Database schema state
# - Edge functions status
# - Environment variables

# Document current state
```

2. **Prioritize Recovery** (5 minutes):
```bash
# Priority order:
# 1. Database (highest risk)
# 2. Edge functions (if critical)
# 3. Application code
# 4. Environment variables
```

3. **Recover Database** (30 minutes):
```bash
# Follow "Migration Recovery" process above
# Ensure database is in known good state
```

4. **Recover Edge Functions** (15 minutes):
```bash
# Revert function code
git checkout <good-commit> -- supabase/functions/

# Test locally
supabase functions serve

# Deploy
git commit -m "rollback: restore working functions"
git push origin main
```

5. **Recover Application** (15 minutes):
```bash
# Revert application code
git revert <bad-commits>

# Or reset to known good state
git reset --hard <good-commit>

# Deploy
git push origin main --force  # if using reset
```

6. **Verify Environment Variables** (10 minutes):
```bash
# Check Vercel dashboard
# Verify all variables are correct
# Update if needed
# Trigger redeploy if changed
```

7. **Full System Test** (20 minutes):
```bash
# Test all critical paths:
# - User authentication
# - Core features
# - Database operations
# - Edge function calls
# - API integrations

# Monitor logs for errors
```

8. **Document and Communicate** (10 minutes):
```bash
# Document:
# - What failed
# - What was done
# - Current state
# - Lessons learned

# Communicate to team and stakeholders
```

---

## Best Practices

### Deployment Best Practices

1. **Always Test Locally First**
   ```bash
   # Full local test cycle
   supabase start
   supabase db reset
   npm run build
   npm run dev
   # Manual testing
   supabase stop
   ```

2. **Use Staging as Production Rehearsal**
   - Deploy to staging first, always
   - Test thoroughly in staging
   - Wait at least 30 minutes before production deployment
   - Monitor staging for errors

3. **Deploy During Low-Traffic Periods**
   - Schedule production deployments for off-peak hours
   - Avoid deployments on Fridays or before holidays
   - Have team available during deployment

4. **Make Incremental Changes**
   - Small, focused deployments are safer
   - Easier to identify issues
   - Faster to rollback if needed

5. **Monitor After Deployment**
   - Watch logs for 15-30 minutes after deployment
   - Check error tracking tools
   - Verify critical functionality
   - Be ready to rollback

### Migration Best Practices

1. **Always Make Migrations Idempotent**
   ```sql
   -- Good
   CREATE TABLE IF NOT EXISTS users (...);
   ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
   DROP TABLE IF EXISTS old_table;
   
   -- Bad
   CREATE TABLE users (...);  -- Fails if exists
   ALTER TABLE users ADD COLUMN email TEXT;  -- Fails if exists
   ```

2. **Test Migrations Multiple Times**
   ```bash
   # Should work every time
   supabase db reset
   supabase db reset
   supabase db reset
   ```

3. **Consider Data Migration Separately**
   ```sql
   -- Step 1: Add new column (safe)
   ALTER TABLE users ADD COLUMN new_email TEXT;
   
   -- Step 2: Migrate data (separate deployment)
   UPDATE users SET new_email = old_email WHERE new_email IS NULL;
   
   -- Step 3: Remove old column (separate deployment)
   ALTER TABLE users DROP COLUMN old_email;
   ```

4. **Never Drop Columns with Data Immediately**
   ```sql
   -- Step 1: Stop using column in code (deploy application)
   -- Step 2: Wait 24-48 hours
   -- Step 3: Rename column to mark for deletion
   ALTER TABLE users RENAME COLUMN old_column TO old_column_deprecated;
   -- Step 4: Wait another 24-48 hours
   -- Step 5: Drop column
   ALTER TABLE users DROP COLUMN old_column_deprecated;
   ```

5. **Use Transactions for Complex Migrations**
   ```sql
   BEGIN;
   
   -- Multiple related changes
   ALTER TABLE users ADD COLUMN status TEXT;
   UPDATE users SET status = 'active';
   ALTER TABLE users ALTER COLUMN status SET NOT NULL;
   
   COMMIT;
   ```

### Rollback Best Practices

1. **Have a Rollback Plan Before Deploying**
   - Document rollback steps
   - Identify rollback triggers
   - Know who can authorize rollback

2. **Practice Rollbacks**
   - Test rollback procedures in staging
   - Time how long rollbacks take
   - Ensure team knows the process

3. **Keep Previous Deployments Available**
   - Vercel keeps previous deployments
   - Can instantly switch back
   - Don't delete old deployments immediately

4. **Document Every Rollback**
   - What went wrong
   - Why rollback was needed
   - What was rolled back
   - Lessons learned

5. **Fix Forward When Possible**
   - Sometimes a quick fix is better than rollback
   - Especially for minor issues
   - Rollback for major problems only

### Monitoring Best Practices

1. **Set Up Alerts**
   - GitHub Actions failures
   - Vercel deployment failures
   - Supabase errors
   - Application errors

2. **Check Logs Regularly**
   - GitHub Actions logs after each deployment
   - Vercel logs for runtime errors
   - Supabase logs for database issues

3. **Monitor Key Metrics**
   - Application response times
   - Error rates
   - Database query performance
   - Function execution times

4. **Keep Communication Channels Open**
   - Team chat for deployment notifications
   - Status page for user communication
   - Incident response procedures

### Security Best Practices

1. **Rotate Secrets Regularly**
   - Change tokens every 90 days
   - Update after team member leaves
   - Use strong, unique tokens

2. **Limit Secret Access**
   - Only necessary team members
   - Use GitHub environment protection rules
   - Audit secret access regularly

3. **Never Commit Secrets**
   - Use `.gitignore` for local env files
   - Scan commits for secrets
   - Revoke any exposed secrets immediately

4. **Use Environment-Specific Secrets**
   - Different tokens for staging and production
   - Prevents accidental production changes
   - Limits blast radius of compromised tokens

---

## Quick Reference

### Emergency Contacts

```bash
# Add your team contacts here
# - On-call engineer: [contact]
# - DevOps lead: [contact]
# - Database admin: [contact]
```

### Quick Commands

```bash
# Rollback application code
git revert HEAD && git push origin main

# Check deployment status
# Go to: https://github.com/<org>/<repo>/actions

# Check Vercel status
# Go to: https://vercel.com/dashboard

# Check Supabase status
# Go to: https://supabase.com/dashboard

# Test local setup
supabase start && npm run dev

# Reset local database
supabase db reset
```

### Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Local Development Guide](./LOCAL_DEVELOPMENT.md)
- [GitHub Secrets Setup](./GITHUB_SECRETS_SETUP.md)
- [Vercel Environment Setup](./VERCEL_ENV_SETUP.md)

---

## Appendix: Rollback Decision Tree

```
Is production broken?
├─ Yes → Emergency rollback (Process 1)
│   ├─ Code issue? → Revert commit
│   ├─ Function issue? → Revert function
│   └─ Data issue? → Follow Migration Recovery (Process 2)
│
└─ No → Is there a data integrity issue?
    ├─ Yes → Migration Recovery (Process 2)
    │   ├─ Create reverse migration
    │   ├─ Test in staging
    │   └─ Deploy to production
    │
    └─ No → Is it a minor issue?
        ├─ Yes → Fix forward
        │   ├─ Create fix
        │   ├─ Test in staging
        │   └─ Deploy to production
        │
        └─ No → Evaluate if rollback needed
            ├─ Can wait for fix? → Fix forward
            └─ Needs immediate action? → Rollback
```

---

**Last Updated**: 2024-11-23
**Version**: 1.0
**Maintained By**: DevOps Team

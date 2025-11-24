# Local Development Guide

## Overview

This guide covers how to set up and use Supabase locally for development using Docker. Local development allows you to develop and test database migrations, edge functions, and application features without affecting remote environments.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop**: Download from [docker.com](https://www.docker.com/products/docker-desktop)
- **Supabase CLI**: Install via homebrew or npm
  ```bash
  # macOS (Homebrew)
  brew install supabase/tap/supabase
  
  # npm (all platforms)
  npm install -g supabase
  ```

## Quick Start

### 1. Start Supabase Services

Start all Supabase services in Docker containers:

```bash
supabase start
```

This command will:
- Pull necessary Docker images (first time only)
- Start PostgreSQL database on port 54322
- Start Supabase Studio on port 54323
- Start API server on port 54321
- Start Inbucket (email testing) on port 54324
- Apply all migrations from `supabase/migrations/`

**First run may take 2-5 minutes to download images.**

### 2. Access Local Services

Once started, you can access:

- **Supabase Studio**: http://127.0.0.1:54323
  - Visual database management interface
  - View tables, run queries, manage auth users
  
- **API Endpoint**: http://127.0.0.1:54321
  - Your application connects to this endpoint locally
  
- **Database**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
  - Direct PostgreSQL connection
  
- **Inbucket (Email Testing)**: http://127.0.0.1:54324
  - View emails sent by your application

### 3. Configure Your Application

Update your `.env.local` file to point to local Supabase:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon_key_from_supabase_start_output>
```

**Note**: The anon key is displayed in the terminal output when you run `supabase start`.

### 4. Stop Supabase Services

When you're done developing:

```bash
supabase stop
```

This stops all containers but **preserves your data**. Next time you run `supabase start`, your data will still be there.

## Essential Commands

### Database Management

#### Create a New Migration

```bash
supabase migration new <migration_name>
```

Example:
```bash
supabase migration new add_user_preferences
```

This creates a new timestamped SQL file in `supabase/migrations/`.

#### Reset Database

Reset the database to a clean state and reapply all migrations:

```bash
supabase db reset
```

**Warning**: This deletes all local data and recreates the database from scratch.

Use this when:
- You want to test migrations from a clean state
- Your local database is in a bad state
- You want to start fresh

#### View Database Diff

See what changes exist between your local database and migrations:

```bash
supabase db diff
```

#### Generate Migration from Changes

If you made changes via Studio or SQL, generate a migration file:

```bash
supabase db diff -f <migration_name>
```

### Edge Functions

#### Create a New Function

```bash
supabase functions new <function_name>
```

#### Serve Functions Locally

Run edge functions locally for testing:

```bash
supabase functions serve
```

Functions will be available at: http://127.0.0.1:54321/functions/v1/<function_name>

#### Deploy a Function (to remote)

```bash
supabase functions deploy <function_name>
```

### Status and Logs

#### Check Status

View the status of all services:

```bash
supabase status
```

#### View Logs

View logs from all services:

```bash
supabase logs
```

View logs from a specific service:

```bash
supabase logs db
supabase logs api
supabase logs auth
```

## Development Workflow

### Complete Feature Development Flow (Local → Staging → Production)

This project uses a three-environment workflow with automated CI/CD:

```
Feature Branch (Local) → Stage Branch (Staging) → Main Branch (Production)
     ↓                        ↓                         ↓
  Docker/Local          Auto-deploy to            Auto-deploy to
  Development           Staging Environment       Production Environment
```

#### Phase 1: Local Development

1. **Create a feature branch from stage**
   ```bash
   # Always branch from stage, not main
   git checkout stage
   git pull origin stage
   git checkout -b feature/my-new-feature
   ```

2. **Start Supabase locally**
   ```bash
   supabase start
   ```
   
   This starts all services in Docker containers on your machine.

3. **Develop your feature**
   - Make code changes in your editor
   - Create migrations if database changes are needed
   - Test everything locally

4. **Create database migrations** (if needed)
   ```bash
   supabase migration new add_my_feature_tables
   ```
   
   Edit the generated file in `supabase/migrations/` with your SQL:
   ```sql
   -- Create new table
   CREATE TABLE IF NOT EXISTS my_feature (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     name TEXT NOT NULL
   );
   
   -- Add RLS policies
   ALTER TABLE my_feature ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can read their own data"
     ON my_feature FOR SELECT
     USING (auth.uid() = user_id);
   ```

5. **Test migrations thoroughly**
   ```bash
   # Reset database to test migrations from scratch
   supabase db reset
   
   # Verify everything works
   npm run dev
   
   # Test your feature in the browser
   open http://localhost:5173
   ```

6. **Test edge functions** (if applicable)
   ```bash
   supabase functions serve
   
   # Test your function
   curl -X POST http://127.0.0.1:54321/functions/v1/my-function \
     -H "Authorization: Bearer <anon_key>" \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

7. **Run tests**
   ```bash
   npm run test
   ```

8. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add my feature with database migrations"
   git push origin feature/my-new-feature
   ```

#### Phase 2: Deploy to Staging

9. **Create Pull Request to stage**
   - Go to GitHub and create a PR from `feature/my-new-feature` → `stage`
   - Add description of changes
   - Request review from team members
   - Wait for approval

10. **Merge to stage branch**
    ```bash
    # After PR approval, merge on GitHub or via CLI:
    git checkout stage
    git pull origin stage
    git merge feature/my-new-feature
    git push origin stage
    ```

11. **Automatic deployment to staging**
    
    When you push to `stage`, GitHub Actions automatically:
    - ✓ Runs migrations on staging Supabase (wuinfsedukvxlkfvlpna)
    - ✓ Deploys edge functions to staging
    - ✓ Deploys frontend to Vercel preview environment
    
    **Monitor the deployment**:
    - Go to GitHub → Actions tab
    - Watch the "Deploy to Staging" workflow
    - Check for any errors

12. **Test on staging**
    
    Once deployment completes:
    - Visit the Vercel preview URL (shown in GitHub Actions logs)
    - Test your feature thoroughly
    - Verify migrations applied correctly
    - Check edge functions work
    - Test with real-world scenarios
    
    **Staging URLs**:
    - Frontend: Check Vercel deployment URL
    - Supabase: https://wuinfsedukvxlkfvlpna.supabase.co
    - Studio: https://supabase.com/dashboard/project/wuinfsedukvxlkfvlpna

#### Phase 3: Deploy to Production

13. **Create Pull Request to main**
    
    After staging is validated:
    - Create PR from `stage` → `main`
    - Add detailed description of what's being released
    - Include testing notes
    - Request review from team lead

14. **Merge to main branch**
    ```bash
    # After PR approval, merge on GitHub or via CLI:
    git checkout main
    git pull origin main
    git merge stage
    git push origin main
    ```

15. **Automatic deployment to production**
    
    When you push to `main`, GitHub Actions automatically:
    - ✓ Runs migrations on production Supabase (fkjbvwbnbxslornufhlp)
    - ✓ Deploys edge functions to production
    - ✓ Deploys frontend to Vercel production environment
    
    **Monitor the deployment**:
    - Go to GitHub → Actions tab
    - Watch the "Deploy to Production" workflow
    - Verify all steps complete successfully

16. **Verify production deployment**
    
    - Visit production URL
    - Test critical features
    - Monitor for errors
    - Check analytics/logs
    
    **Production URLs**:
    - Frontend: Your production domain
    - Supabase: https://fkjbvwbnbxslornufhlp.supabase.co
    - Studio: https://supabase.com/dashboard/project/fkjbvwbnbxslornufhlp

### Workflow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Workflow                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Create feature branch from stage                         │
│  2. Develop locally with Docker/Supabase                     │
│  3. Test migrations with `supabase db reset`                 │
│  4. Commit and push feature branch                           │
│  5. Create PR: feature → stage                               │
│  6. Merge to stage → Auto-deploy to staging                  │
│  7. Test on staging environment                              │
│  8. Create PR: stage → main                                  │
│  9. Merge to main → Auto-deploy to production                │
│  10. Verify production deployment                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Important Workflow Rules

1. **Always branch from stage**, never from main
2. **Test locally first** - Never push untested code
3. **Test migrations from scratch** - Use `supabase db reset` before pushing
4. **Stage before production** - Always deploy to staging first
5. **Monitor deployments** - Watch GitHub Actions for errors
6. **Verify each environment** - Test after each deployment

### Testing Migrations

Always test migrations locally before pushing:

```bash
# 1. Reset to clean state
supabase db reset

# 2. Verify all migrations apply successfully
# (supabase db reset applies all migrations)

# 3. Test your application
npm run dev

# 4. Verify data integrity
# Use Supabase Studio to inspect tables and data
```

### Working with Seed Data

If you need test data for development:

1. Create `supabase/seed.sql`:
   ```sql
   -- Insert test users, teams, etc.
   INSERT INTO teams (name, sport_id) VALUES
     ('Test Team 1', '<sport_uuid>'),
     ('Test Team 2', '<sport_uuid>');
   ```

2. The seed file runs automatically during `supabase db reset`

3. Or run it manually:
   ```bash
   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < supabase/seed.sql
   ```

## Troubleshooting

### Local Development Issues

#### Supabase won't start

**Problem**: `supabase start` fails or hangs

**Solutions**:
1. Check Docker is running: `docker ps`
2. Stop and remove containers: `supabase stop && docker system prune`
3. Try starting with debug: `supabase start --debug`
4. Check port conflicts (54321-54324, 54322)

#### Migration fails

**Problem**: Migration fails during `supabase db reset` or `supabase start`

**Solutions**:
1. Check migration SQL syntax
2. Ensure migrations are idempotent (use `IF NOT EXISTS`, `IF EXISTS`)
3. Check migration order (they run chronologically by filename)
4. View detailed error: `supabase db reset --debug`

#### Port already in use

**Problem**: Error about ports 54321-54324 being in use

**Solutions**:
1. Stop Supabase: `supabase stop`
2. Check what's using the port: `lsof -i :54321`
3. Kill the process or change Supabase ports in `supabase/config.toml`

#### Database connection refused

**Problem**: Application can't connect to local database

**Solutions**:
1. Verify Supabase is running: `supabase status`
2. Check `.env.local` has correct URL: `http://127.0.0.1:54321`
3. Verify anon key matches output from `supabase status`
4. Restart Supabase: `supabase stop && supabase start`

#### Changes not appearing

**Problem**: Code or database changes don't show up

**Solutions**:
1. For migrations: `supabase db reset` to reapply all migrations
2. For functions: Restart `supabase functions serve`
3. For app code: Restart your dev server (`npm run dev`)
4. Clear browser cache

#### Docker out of space

**Problem**: Docker runs out of disk space

**Solutions**:
```bash
# Remove unused containers and images
docker system prune -a

# Remove Supabase volumes (WARNING: deletes all local data)
supabase stop
docker volume prune
```

### CI/CD Workflow Issues

#### Deployment to staging failed

**Problem**: GitHub Actions workflow fails when pushing to `stage`

**Solutions**:
1. **Check GitHub Actions logs**:
   - Go to GitHub → Actions tab
   - Click on the failed workflow
   - Review error messages

2. **Common causes**:
   - Migration syntax error → Fix migration locally and push again
   - Missing GitHub Secrets → Contact admin to configure secrets
   - Vercel deployment error → Check Vercel dashboard for details

3. **Test migration locally first**:
   ```bash
   supabase db reset --debug
   ```

4. **Re-run the workflow**:
   - Fix the issue
   - Commit and push again
   - Or manually re-run from GitHub Actions UI

#### Deployment to production failed

**Problem**: GitHub Actions workflow fails when pushing to `main`

**Solutions**:
1. **Check if staging deployment worked**:
   - If staging failed, fix there first
   - Never deploy to production if staging is broken

2. **Review production logs**:
   - GitHub → Actions → Failed workflow
   - Check which step failed (migrations, functions, or Vercel)

3. **Rollback if needed**:
   ```bash
   # Revert the merge commit
   git revert HEAD
   git push origin main
   ```

4. **Contact team lead** if production is broken

#### Migration works locally but fails in CI/CD

**Problem**: Migration succeeds with `supabase db reset` but fails in GitHub Actions

**Common causes**:
1. **Migration not idempotent**:
   - Missing `IF NOT EXISTS` or `IF EXISTS`
   - Trying to create objects that already exist
   
   **Fix**:
   ```sql
   -- Bad
   CREATE TABLE users (id UUID);
   
   -- Good
   CREATE TABLE IF NOT EXISTS users (id UUID);
   ```

2. **Migration depends on manual changes**:
   - You made changes in Studio that aren't in migrations
   - Remote database has different state than local
   
   **Fix**: Generate migration from changes:
   ```bash
   supabase db diff -f fix_missing_changes
   ```

3. **Wrong migration order**:
   - Migration depends on another migration that hasn't run yet
   
   **Fix**: Check timestamps and ensure proper order

#### Edge function works locally but fails in deployment

**Problem**: Function works with `supabase functions serve` but fails when deployed

**Common causes**:
1. **Missing environment variables**:
   - Function uses env vars not configured in Supabase
   
   **Fix**: Add secrets in Supabase Dashboard → Edge Functions → Secrets

2. **Import path issues**:
   - Using local file paths that don't work in deployment
   
   **Fix**: Use proper Deno imports:
   ```typescript
   // Bad
   import { helper } from "./helper.ts"
   
   // Good
   import { helper } from "../_shared/helper.ts"
   ```

3. **CORS issues**:
   - Missing CORS headers
   
   **Fix**: Add CORS headers to response:
   ```typescript
   import { corsHeaders } from "../_shared/cors.ts"
   
   return new Response(data, { 
     headers: { ...corsHeaders, "Content-Type": "application/json" } 
   })
   ```

#### Vercel deployment succeeds but app doesn't work

**Problem**: Vercel shows successful deployment but app has errors

**Common causes**:
1. **Wrong environment variables**:
   - Vercel using wrong Supabase URL or anon key
   
   **Fix**: Check Vercel → Settings → Environment Variables
   - Staging should use: wuinfsedukvxlkfvlpna
   - Production should use: fkjbvwbnbxslornufhlp

2. **Build errors hidden**:
   - TypeScript errors ignored during build
   
   **Fix**: Check build logs in Vercel dashboard

3. **RLS policies blocking access**:
   - Row Level Security preventing data access
   
   **Fix**: Check policies in Supabase Studio

#### Can't merge to stage or main

**Problem**: Git won't let you merge or push

**Solutions**:
1. **Branch protection rules**:
   - Use Pull Requests instead of direct push
   - Get required approvals

2. **Merge conflicts**:
   ```bash
   git checkout stage
   git pull origin stage
   git checkout feature/my-feature
   git merge stage
   # Resolve conflicts
   git commit
   git push
   ```

3. **Behind remote**:
   ```bash
   git pull origin stage --rebase
   git push origin feature/my-feature
   ```

## Best Practices

### Migration Best Practices

1. **Always test locally first**: Never push untested migrations
2. **Make migrations idempotent**: Use `IF NOT EXISTS`, `IF EXISTS`
3. **One logical change per migration**: Don't combine unrelated changes
4. **Add comments**: Explain what the migration does
5. **Test rollback scenarios**: Know how to undo changes if needed
6. **Avoid destructive changes**: Don't `DROP TABLE` without backups

### Development Best Practices

1. **Use feature branches**: Branch from `stage`, not `main`
2. **Test migrations from clean state**: Use `supabase db reset` regularly
3. **Keep local environment updated**: Pull latest migrations from `stage`
4. **Don't commit `.env.local`**: Keep local config out of git
5. **Use Supabase Studio**: Visual tools help catch issues early

### Edge Function Best Practices

1. **Test locally first**: Use `supabase functions serve`
2. **Handle errors gracefully**: Return proper HTTP status codes
3. **Use environment variables**: Don't hardcode secrets
4. **Keep functions small**: One function, one purpose
5. **Add CORS headers**: Required for browser requests

## Environment Variables

### Local Development

Your `.env.local` should contain:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<from_supabase_status>
```

### Getting the Anon Key

Run `supabase status` and look for:
```
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Copy this value to your `.env.local`.

## Next Steps

After setting up local development:

1. **Read the deployment guide**: See `docs/DEPLOYMENT.md` (to be created)
2. **Review migration files**: Check `supabase/migrations/` to understand the schema
3. **Explore Supabase Studio**: http://127.0.0.1:54323
4. **Test the application**: `npm run dev` and verify everything works

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Edge Functions](https://supabase.com/docs/guides/functions)

## Quick Reference

### Supabase Commands

```bash
# Start/Stop
supabase start              # Start all services
supabase stop               # Stop all services
supabase status             # Check status

# Database
supabase db reset           # Reset database with all migrations
supabase migration new NAME # Create new migration
supabase db diff            # Show schema differences

# Functions
supabase functions new NAME # Create new function
supabase functions serve    # Run functions locally

# Logs
supabase logs               # View all logs
supabase logs db            # View database logs
```

### Git Workflow Commands

```bash
# Start new feature
git checkout stage
git pull origin stage
git checkout -b feature/my-feature

# Develop locally
supabase start
npm run dev
# ... make changes ...

# Test migrations
supabase db reset
npm run test

# Push feature
git add .
git commit -m "Add feature"
git push origin feature/my-feature

# Deploy to staging (after PR merge)
git checkout stage
git pull origin stage
# GitHub Actions auto-deploys

# Deploy to production (after PR merge)
git checkout main
git pull origin main
# GitHub Actions auto-deploys
```

### Environment Quick Reference

| Environment | Branch | Supabase Project | Deployment | URL |
|-------------|--------|------------------|------------|-----|
| Local | feature/* | Docker (local) | Manual | http://localhost:5173 |
| Staging | stage | wuinfsedukvxlkfvlpna | Auto (GitHub Actions) | Vercel Preview |
| Production | main | fkjbvwbnbxslornufhlp | Auto (GitHub Actions) | Production Domain |

### Deployment Checklist

Before pushing to stage:
- [ ] Tested locally with `supabase db reset`
- [ ] All tests pass (`npm run test`)
- [ ] Migrations are idempotent
- [ ] Edge functions tested locally
- [ ] Code reviewed
- [ ] Documentation updated

Before merging to main:
- [ ] Staging deployment successful
- [ ] Feature tested on staging
- [ ] No errors in staging logs
- [ ] Team lead approval
- [ ] Release notes prepared

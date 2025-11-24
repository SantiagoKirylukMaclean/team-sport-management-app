# Development Workflow Guide

## Quick Start

This guide provides a quick overview of the complete development workflow from local development to production deployment.

## Three-Environment Architecture

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│    LOCAL     │      │   STAGING    │      │  PRODUCTION  │
│   (Docker)   │─────▶│  (Preview)   │─────▶│    (Live)    │
└──────────────┘      └──────────────┘      └──────────────┘
  feature/*              stage branch          main branch
  Manual testing         Auto-deploy          Auto-deploy
```

| Environment | Purpose | Branch | Supabase | Deployment |
|-------------|---------|--------|----------|------------|
| **Local** | Development & Testing | feature/* | Docker (local) | Manual |
| **Staging** | Pre-production Testing | stage | wuinfsedukvxlkfvlpna | GitHub Actions |
| **Production** | Live Application | main | fkjbvwbnbxslornufhlp | GitHub Actions |

## Complete Workflow (Step by Step)

### Phase 1: Local Development

```bash
# 1. Create feature branch from stage
git checkout stage
git pull origin stage
git checkout -b feature/add-new-feature

# 2. Start local Supabase
supabase start

# 3. Start development server
npm run dev

# 4. Make your changes
# - Edit code
# - Create migrations if needed
# - Test in browser

# 5. Create migration (if database changes needed)
supabase migration new add_new_tables

# 6. Test migration from scratch
supabase db reset

# 7. Run tests
npm run test

# 8. Commit and push
git add .
git commit -m "Add new feature"
git push origin feature/add-new-feature
```

### Phase 2: Deploy to Staging

```bash
# 9. Create Pull Request
# - Go to GitHub
# - Create PR: feature/add-new-feature → stage
# - Add description and request review

# 10. Merge to stage (after approval)
# - Merge PR on GitHub
# - OR via command line:
git checkout stage
git pull origin stage
git merge feature/add-new-feature
git push origin stage

# 11. Automatic deployment happens
# - GitHub Actions runs automatically
# - Migrations applied to staging Supabase
# - Edge functions deployed
# - Frontend deployed to Vercel preview

# 12. Monitor deployment
# - Go to GitHub → Actions
# - Watch "Deploy to Staging" workflow
# - Check for errors

# 13. Test on staging
# - Visit Vercel preview URL (from Actions logs)
# - Test all features thoroughly
# - Verify migrations worked
# - Check edge functions
```

### Phase 3: Deploy to Production

```bash
# 14. Create Pull Request to main
# - Create PR: stage → main
# - Add release notes
# - Request team lead approval

# 15. Merge to main (after approval)
git checkout main
git pull origin main
git merge stage
git push origin main

# 16. Automatic deployment happens
# - GitHub Actions runs automatically
# - Migrations applied to production Supabase
# - Edge functions deployed
# - Frontend deployed to Vercel production

# 17. Monitor deployment
# - Go to GitHub → Actions
# - Watch "Deploy to Production" workflow
# - Verify all steps succeed

# 18. Verify production
# - Visit production URL
# - Test critical features
# - Monitor logs for errors
```

## Essential Commands

### Supabase CLI

```bash
# Start/Stop
supabase start              # Start all services in Docker
supabase stop               # Stop all services
supabase status             # Check status and get keys

# Database
supabase db reset           # Reset DB and apply all migrations
supabase migration new NAME # Create new migration file
supabase db diff            # Show schema differences

# Edge Functions
supabase functions new NAME # Create new function
supabase functions serve    # Run functions locally

# Debugging
supabase logs               # View all logs
supabase logs db            # View database logs
supabase start --debug      # Start with debug output
```

### Git Workflow

```bash
# Feature development
git checkout stage
git pull origin stage
git checkout -b feature/my-feature

# Push changes
git add .
git commit -m "Description"
git push origin feature/my-feature

# Update from stage
git checkout feature/my-feature
git merge stage
git push

# Deploy to staging
git checkout stage
git merge feature/my-feature
git push origin stage

# Deploy to production
git checkout main
git merge stage
git push origin main
```

## Common Scenarios

### Scenario 1: Adding a New Feature

```bash
# 1. Branch from stage
git checkout stage && git pull && git checkout -b feature/user-profiles

# 2. Develop locally
supabase start
npm run dev
# ... make changes ...

# 3. Test thoroughly
supabase db reset
npm run test

# 4. Push and create PR to stage
git push origin feature/user-profiles
# Create PR on GitHub

# 5. After merge, test on staging
# Visit staging URL and verify

# 6. Create PR to main
# After staging validation

# 7. After merge, verify production
# Check production URL
```

### Scenario 2: Database Migration

```bash
# 1. Create migration
supabase migration new add_user_preferences

# 2. Edit migration file
# supabase/migrations/YYYYMMDDHHMMSS_add_user_preferences.sql

# 3. Write idempotent SQL
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  theme TEXT DEFAULT 'light'
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

# 4. Test from scratch
supabase db reset

# 5. Verify in Studio
open http://127.0.0.1:54323

# 6. Push to stage
git add supabase/migrations/
git commit -m "Add user preferences table"
git push origin feature/user-preferences

# 7. Follow normal workflow
# PR → stage → test → PR → main
```

### Scenario 3: Edge Function

```bash
# 1. Create function
supabase functions new send-notification

# 2. Edit function
# supabase/functions/send-notification/index.ts

# 3. Test locally
supabase functions serve

# 4. Test with curl
curl -X POST http://127.0.0.1:54321/functions/v1/send-notification \
  -H "Authorization: Bearer <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# 5. Push and deploy
git add supabase/functions/
git commit -m "Add notification function"
git push origin feature/notifications

# 6. Follow normal workflow
# Function auto-deploys with GitHub Actions
```

### Scenario 4: Hotfix for Production

```bash
# 1. Branch from main (not stage!)
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Fix the issue
# ... make minimal changes ...

# 3. Test locally
supabase start
npm run test

# 4. Push and create PR to main
git push origin hotfix/critical-bug
# Create PR: hotfix/critical-bug → main

# 5. After merge, backport to stage
git checkout stage
git merge main
git push origin stage
```

## Troubleshooting Quick Reference

### Local Issues

| Problem | Solution |
|---------|----------|
| Supabase won't start | `docker ps` → Check Docker running |
| Port in use | `supabase stop` → `lsof -i :54321` |
| Migration fails | Check SQL syntax, use `IF NOT EXISTS` |
| Can't connect | Check `.env.local` has `http://127.0.0.1:54321` |
| Changes not showing | `supabase db reset` or restart dev server |

### CI/CD Issues

| Problem | Solution |
|---------|----------|
| Staging deploy fails | Check GitHub Actions logs |
| Migration fails in CI | Ensure idempotent, test with `supabase db reset` |
| Function fails in CI | Check imports, CORS headers, env vars |
| Vercel deploy succeeds but broken | Check Vercel env vars match environment |
| Can't merge | Use Pull Requests, resolve conflicts |

## Best Practices

### ✅ Do

- Always branch from `stage`, not `main`
- Test migrations with `supabase db reset` before pushing
- Make migrations idempotent (use `IF NOT EXISTS`)
- Test on staging before production
- Monitor GitHub Actions after pushing
- Write clear commit messages
- Add comments to migrations
- Keep functions small and focused

### ❌ Don't

- Don't push untested migrations
- Don't branch from `main` for features
- Don't skip staging environment
- Don't commit `.env.local`
- Don't make manual changes in production
- Don't use `DROP TABLE` without backups
- Don't deploy on Friday afternoon 😉

## Pre-Deployment Checklist

### Before Pushing to Stage

- [ ] Code works locally
- [ ] Migrations tested with `supabase db reset`
- [ ] All tests pass (`npm run test`)
- [ ] Migrations are idempotent
- [ ] Edge functions tested locally
- [ ] No console errors in browser
- [ ] Code reviewed by peer
- [ ] Documentation updated

### Before Merging to Main

- [ ] Staging deployment successful
- [ ] Feature fully tested on staging
- [ ] No errors in staging logs
- [ ] Team lead approval obtained
- [ ] Release notes prepared
- [ ] Rollback plan ready
- [ ] Monitoring in place

## Getting Help

### Documentation

- **[LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)** - Comprehensive local dev guide
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Initial setup guide
- **[SUPABASE_QUICK_REFERENCE.md](./SUPABASE_QUICK_REFERENCE.md)** - Command cheat sheet
- **[SUPABASE_TROUBLESHOOTING.md](./SUPABASE_TROUBLESHOOTING.md)** - Fix common issues
- **[GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)** - CI/CD configuration
- **[VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)** - Vercel configuration

### Quick Links

- **Local Studio**: http://127.0.0.1:54323
- **Local API**: http://127.0.0.1:54321
- **Staging Supabase**: https://supabase.com/dashboard/project/wuinfsedukvxlkfvlpna
- **Production Supabase**: https://supabase.com/dashboard/project/fkjbvwbnbxslornufhlp
- **GitHub Actions**: https://github.com/[your-repo]/actions
- **Vercel Dashboard**: https://vercel.com/dashboard

### Support

1. **Check documentation** - Start with this guide
2. **Run validation** - `./scripts/validate-local-setup.sh`
3. **Check logs** - `supabase logs` or GitHub Actions
4. **Ask the team** - Slack/Discord
5. **Supabase docs** - https://supabase.com/docs

## Visual Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Complete Development Flow                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Developer                                                        │
│     │                                                             │
│     ├─▶ Create feature branch from stage                         │
│     │                                                             │
│     ├─▶ Develop locally (Docker/Supabase)                        │
│     │   ├─ Write code                                            │
│     │   ├─ Create migrations                                     │
│     │   ├─ Test with supabase db reset                           │
│     │   └─ Run tests                                             │
│     │                                                             │
│     ├─▶ Push feature branch                                      │
│     │                                                             │
│     ├─▶ Create PR: feature → stage                               │
│     │                                                             │
│     ├─▶ Merge to stage                                           │
│     │        │                                                    │
│     │        ├─▶ GitHub Actions (Staging)                        │
│     │        │   ├─ Run migrations on staging DB                 │
│     │        │   ├─ Deploy edge functions                        │
│     │        │   └─ Deploy to Vercel preview                     │
│     │        │                                                    │
│     │        └─▶ Staging Environment Ready                       │
│     │                                                             │
│     ├─▶ Test on staging                                          │
│     │                                                             │
│     ├─▶ Create PR: stage → main                                  │
│     │                                                             │
│     └─▶ Merge to main                                            │
│              │                                                    │
│              ├─▶ GitHub Actions (Production)                     │
│              │   ├─ Run migrations on production DB              │
│              │   ├─ Deploy edge functions                        │
│              │   └─ Deploy to Vercel production                  │
│              │                                                    │
│              └─▶ Production Environment Updated                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Summary

The workflow is designed to ensure:
- **Safety**: Test locally before staging, staging before production
- **Automation**: CI/CD handles deployments automatically
- **Consistency**: Same process for all features
- **Traceability**: Git history shows what was deployed when
- **Rollback**: Easy to revert if something goes wrong

**Remember**: Local → Staging → Production. Always test at each stage!

---

**Ready to start?** Check out [GETTING_STARTED.md](./GETTING_STARTED.md) for initial setup! 🚀

# Getting Started with Local Development

This guide will help you set up your local development environment from scratch.

## Prerequisites

Before you begin, install these tools:

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop)
2. **Supabase CLI** - Install via Homebrew:
   ```bash
   brew install supabase/tap/supabase
   ```
3. **Node.js** - Version 18 or higher
4. **Git** - For version control

## Quick Setup (5 minutes)

### 1. Clone and Install

```bash
# Clone the repository (if you haven't already)
git clone <repository-url>
cd team-sport-management-app

# Install dependencies
npm install
```

### 2. Validate Your Setup

Run the validation script to check if everything is configured correctly:

```bash
./scripts/validate-local-setup.sh
```

This will check:
- ✓ Docker is installed and running
- ✓ Supabase CLI is installed
- ✓ Configuration files exist
- ✓ Ports are available
- ✓ Documentation is present

### 3. Start Supabase

Start all Supabase services in Docker:

```bash
supabase start
```

**First time?** This will take 5-10 minutes to download Docker images (~2GB). Subsequent starts will be much faster (10-30 seconds).

You'll see output like:
```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: Copy the `anon key` - you'll need it in the next step!

### 4. Configure Environment Variables

Update your `.env.local` file to point to local Supabase:

```bash
# Copy the example file if you don't have .env.local
cp .env.local.example .env.local

# Edit .env.local
nano .env.local
```

Set these values:
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<paste-anon-key-from-supabase-start>
```

**Tip**: Get the anon key anytime by running `supabase status`

### 5. Start Your Application

```bash
npm run dev
```

Your app should now be running at http://localhost:5173 (or similar) and connected to your local Supabase instance!

### 6. Access Supabase Studio

Open http://127.0.0.1:54323 in your browser to access Supabase Studio, where you can:
- View and edit database tables
- Run SQL queries
- Manage authentication users
- View logs and metrics

## Verify Everything Works

### Test Database Connection

1. Open your app at http://localhost:5173
2. Try logging in or signing up
3. Check Supabase Studio to see if data appears

### Test Migrations

All migrations should have been applied automatically. Verify in Studio:
- Check that tables exist (users, teams, players, etc.)
- Verify Row Level Security policies are in place

### Test Email (Optional)

1. Open Inbucket at http://127.0.0.1:54324
2. Trigger an email in your app (e.g., password reset)
3. Check Inbucket to see the email

## Common Issues

### Supabase won't start

**Problem**: `supabase start` fails

**Solution**:
```bash
# Check Docker is running
docker ps

# If not, start Docker Desktop

# Try again
supabase start
```

### Port conflicts

**Problem**: "port already in use"

**Solution**:
```bash
# Check what's using the port
lsof -i :54321

# Stop Supabase if it's already running
supabase stop

# Start again
supabase start
```

### App can't connect to database

**Problem**: Connection errors in your app

**Solution**:
1. Verify Supabase is running: `supabase status`
2. Check `.env.local` has correct URL: `http://127.0.0.1:54321`
3. Verify anon key matches: `supabase status | grep "anon key"`
4. Restart your dev server: `npm run dev`

### More help

See [SUPABASE_TROUBLESHOOTING.md](./SUPABASE_TROUBLESHOOTING.md) for detailed troubleshooting.

## Daily Development Workflow

### Starting Your Day

```bash
# 1. Pull latest changes
git pull origin stage

# 2. Start Supabase (if not already running)
supabase start

# 3. Apply any new migrations
supabase db reset  # Only if there are new migrations

# 4. Start your app
npm run dev
```

### During Development

```bash
# Create a new migration
supabase migration new add_my_feature

# Edit the migration file
# supabase/migrations/YYYYMMDDHHMMSS_add_my_feature.sql

# Test the migration
supabase db reset

# View in Studio
open http://127.0.0.1:54323
```

### Ending Your Day

```bash
# Stop your app (Ctrl+C)

# Stop Supabase (optional - it's fine to leave it running)
supabase stop

# Commit your changes
git add .
git commit -m "Add my feature"
git push origin feature/my-feature
```

## Development Environments

This project uses three environments:

| Environment | Purpose | Supabase | Vercel | Branch |
|-------------|---------|----------|--------|--------|
| **Local** | Development | Docker (local) | localhost:5173 | feature/* |
| **Staging** | Testing | wuinfsedukvxlkfvlpna | Preview | stage |
| **Production** | Live | fkjbvwbnbxslornufhlp | Production | main |

### Switching Environments

To test against staging or production, update `.env.local`:

```env
# Staging
VITE_SUPABASE_URL=https://wuinfsedukvxlkfvlpna.supabase.co
VITE_SUPABASE_ANON_KEY=<staging-anon-key>

# Production
VITE_SUPABASE_URL=https://fkjbvwbnbxslornufhlp.supabase.co
VITE_SUPABASE_ANON_KEY=<production-anon-key>
```

**Warning**: Be careful when testing against production!

## Next Steps

Now that you're set up, learn more about:

1. **Creating Migrations** - [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md#creating-migrations)
2. **Edge Functions** - [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md#edge-functions)
3. **Testing** - [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md#testing-migrations)
4. **Deployment** - [DEPLOYMENT.md](./DEPLOYMENT.md) (to be created)

## Quick Reference

### Essential Commands

```bash
# Supabase
supabase start              # Start all services
supabase stop               # Stop all services
supabase status             # Check status
supabase db reset           # Reset database with migrations

# Development
npm run dev                 # Start dev server
npm run build               # Build for production
npm run test                # Run tests

# Validation
./scripts/validate-local-setup.sh  # Check setup
```

### Important URLs

- **App**: http://localhost:5173
- **Supabase Studio**: http://127.0.0.1:54323
- **API**: http://127.0.0.1:54321
- **Email Testing**: http://127.0.0.1:54324

### Documentation

- [Local Development Guide](./LOCAL_DEVELOPMENT.md) - Comprehensive guide
- [Quick Reference](./SUPABASE_QUICK_REFERENCE.md) - Command cheat sheet
- [Troubleshooting](./SUPABASE_TROUBLESHOOTING.md) - Fix common issues
- [Supabase README](../supabase/README.md) - Supabase directory structure

## Getting Help

1. **Check the docs** - Start with [SUPABASE_TROUBLESHOOTING.md](./SUPABASE_TROUBLESHOOTING.md)
2. **Run validation** - `./scripts/validate-local-setup.sh`
3. **Check logs** - `supabase logs`
4. **Ask the team** - Reach out on Slack/Discord
5. **Supabase docs** - [supabase.com/docs](https://supabase.com/docs)

## Tips for Success

1. **Always test locally first** - Never push untested migrations
2. **Use feature branches** - Branch from `stage`, not `main`
3. **Reset often** - Use `supabase db reset` to test migrations from scratch
4. **Keep docs updated** - Update documentation when you learn something new
5. **Ask questions** - If you're stuck, ask! Others probably have the same question

---

**Ready to start developing?** Run `supabase start` and `npm run dev`! 🚀

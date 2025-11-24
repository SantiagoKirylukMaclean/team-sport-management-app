# Supabase CLI Quick Reference

## Essential Commands

### Starting and Stopping

```bash
# Start all Supabase services (PostgreSQL, Studio, API, etc.)
supabase start

# Stop all services (preserves data)
supabase stop

# Check status of all services
supabase status

# View connection details and keys
supabase status
```

### Database Migrations

```bash
# Create a new migration file
supabase migration new <name>
# Example: supabase migration new add_user_preferences

# Reset database and reapply all migrations (DELETES ALL DATA)
supabase db reset

# Show differences between local schema and migrations
supabase db diff

# Generate a migration from current database changes
supabase db diff -f <migration_name>

# Push migrations to remote project
supabase db push
```

### Edge Functions

```bash
# Create a new edge function
supabase functions new <function_name>

# Serve functions locally for testing
supabase functions serve

# Deploy a specific function to remote
supabase functions deploy <function_name>

# Deploy all functions
supabase functions deploy

# Delete a function from remote
supabase functions delete <function_name>
```

### Logs and Debugging

```bash
# View all logs
supabase logs

# View logs from specific service
supabase logs db        # Database logs
supabase logs api       # API logs
supabase logs auth      # Auth logs
supabase logs realtime  # Realtime logs
supabase logs storage   # Storage logs

# Follow logs in real-time
supabase logs -f

# Start with debug output
supabase start --debug
```

### Project Management

```bash
# Link to a remote Supabase project
supabase link --project-ref <project-id>

# Initialize Supabase in a new project
supabase init

# Generate TypeScript types from database schema
supabase gen types typescript --local > src/types/supabase.ts
```

## Local Service URLs

When running `supabase start`, services are available at:

| Service | URL | Description |
|---------|-----|-------------|
| API | http://127.0.0.1:54321 | REST API endpoint |
| Studio | http://127.0.0.1:54323 | Database management UI |
| Inbucket | http://127.0.0.1:54324 | Email testing interface |
| Database | postgresql://postgres:postgres@127.0.0.1:54322/postgres | Direct PostgreSQL connection |

## Common Workflows

### Create and Test a Migration

```bash
# 1. Create migration
supabase migration new add_new_feature

# 2. Edit the file in supabase/migrations/
# Add your SQL changes

# 3. Reset database to test from clean state
supabase db reset

# 4. Verify in Studio
open http://127.0.0.1:54323

# 5. Test your application
npm run dev
```

### Develop an Edge Function

```bash
# 1. Create function
supabase functions new my-function

# 2. Edit supabase/functions/my-function/index.ts

# 3. Serve locally
supabase functions serve

# 4. Test with curl
curl -X POST http://127.0.0.1:54321/functions/v1/my-function \
  -H "Authorization: Bearer <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# 5. Deploy when ready
supabase functions deploy my-function
```

### Reset Everything

```bash
# Stop Supabase
supabase stop

# Remove all Docker volumes (DELETES ALL DATA)
docker volume prune

# Start fresh
supabase start
```

## Environment Variables

### Local Development (.env.local)

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<get_from_supabase_status>
```

### Get Keys

```bash
# Run this to see all keys and URLs
supabase status

# Look for:
# - anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# - service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Troubleshooting Commands

```bash
# Check Docker is running
docker ps

# View Supabase containers
docker ps | grep supabase

# Stop and clean Docker
supabase stop
docker system prune

# Check port usage
lsof -i :54321
lsof -i :54322
lsof -i :54323

# Update Supabase CLI
brew upgrade supabase

# View Supabase CLI version
supabase --version
```

## Migration Best Practices

### Idempotent Migrations

Always use conditional statements:

```sql
-- Good: Idempotent
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY
);

-- Bad: Will fail on second run
CREATE TABLE users (
  id UUID PRIMARY KEY
);
```

### Safe Column Addition

```sql
-- Add column safely
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add with default
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
```

### Enable RLS

```sql
-- Always enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

## Tips and Tricks

### Quick Database Access

```bash
# Connect to local database with psql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Run SQL file
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < script.sql
```

### Generate Types

```bash
# Generate TypeScript types from your schema
supabase gen types typescript --local > src/types/database.ts
```

### Seed Data

Create `supabase/seed.sql` and it will run automatically on `supabase db reset`:

```sql
-- supabase/seed.sql
INSERT INTO teams (name) VALUES ('Test Team 1'), ('Test Team 2');
```

### Watch Mode for Functions

```bash
# Functions auto-reload when you save changes
supabase functions serve
```

## Getting Help

```bash
# General help
supabase help

# Help for specific command
supabase db help
supabase functions help
supabase migration help

# View all available commands
supabase --help
```

## Additional Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Local Development](https://supabase.com/docs/guides/local-development)
- [Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Edge Functions](https://supabase.com/docs/guides/functions)

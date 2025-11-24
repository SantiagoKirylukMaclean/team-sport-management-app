# Supabase Directory

This directory contains all Supabase-related configuration and code for local development and deployment.

## Directory Structure

```
supabase/
├── config.toml           # Supabase CLI configuration
├── migrations/           # Database migration files (SQL)
├── functions/            # Edge Functions (Deno/TypeScript)
│   ├── _shared/         # Shared utilities for functions
│   └── invite-user/     # Example function
├── seed.sql             # (Optional) Seed data for local development
└── .temp/               # Temporary files (gitignored)
```

## Configuration File

The `config.toml` file configures how Supabase runs locally. Key settings:

- **project_id**: Identifies this project (`team-sport-management-app`)
- **Database port**: 54322 (PostgreSQL)
- **API port**: 54321 (REST API)
- **Studio port**: 54323 (Web UI)
- **Inbucket port**: 54324 (Email testing)

## Migrations

Database migrations are stored in `migrations/` as timestamped SQL files:

```
20250920165657_init_roles_profiles.sql
20250923010400_base_sports_clubs_teams_and_rls.sql
...
```

### Migration Naming Convention

Format: `YYYYMMDDHHMMSS_description.sql`

Example: `20251120120000_add_user_preferences.sql`

### Creating Migrations

```bash
# Create a new migration
supabase migration new add_user_preferences

# This creates: supabase/migrations/20251120120000_add_user_preferences.sql
```

### Migration Best Practices

1. **Idempotent**: Use `IF NOT EXISTS` and `IF EXISTS`
2. **One purpose**: Each migration should do one logical thing
3. **Documented**: Add comments explaining what and why
4. **Tested**: Always test with `supabase db reset` before pushing

Example migration:

```sql
-- Add user preferences table
-- Allows users to store UI preferences and settings

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own preferences
CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
  ON user_preferences(user_id);
```

## Edge Functions

Edge Functions are serverless functions that run on Supabase's edge network.

### Current Functions

- **invite-user**: Handles user invitation emails and account creation

### Creating Functions

```bash
# Create a new function
supabase functions new my-function

# This creates: supabase/functions/my-function/index.ts
```

### Function Structure

```typescript
// supabase/functions/my-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const { data } = await req.json()
    
    // Your function logic here
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

### Testing Functions Locally

```bash
# Start function server
supabase functions serve

# Test with curl
curl -X POST http://127.0.0.1:54321/functions/v1/my-function \
  -H "Authorization: Bearer <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Deploying Functions

Functions are deployed automatically via CI/CD when code is merged to `stage` or `main`.

Manual deployment:
```bash
# Deploy specific function
supabase functions deploy my-function

# Deploy all functions
supabase functions deploy
```

## Seed Data (Optional)

Create a `seed.sql` file to populate your local database with test data:

```sql
-- supabase/seed.sql
-- This runs automatically during `supabase db reset`

-- Insert test sports
INSERT INTO sports (name) VALUES 
  ('Soccer'),
  ('Basketball')
ON CONFLICT DO NOTHING;

-- Insert test clubs
INSERT INTO clubs (name, sport_id) VALUES 
  ('Test Club', (SELECT id FROM sports WHERE name = 'Soccer' LIMIT 1))
ON CONFLICT DO NOTHING;
```

The seed file is configured in `config.toml`:

```toml
[db.seed]
enabled = true
sql_paths = ["./seed.sql"]
```

## Local Development Workflow

### 1. Start Supabase

```bash
supabase start
```

This will:
- Start PostgreSQL database
- Apply all migrations
- Run seed data (if exists)
- Start all services

### 2. Access Services

- **Studio**: http://127.0.0.1:54323 (database management)
- **API**: http://127.0.0.1:54321 (your app connects here)
- **Inbucket**: http://127.0.0.1:54324 (view test emails)

### 3. Develop

Make changes to:
- Migrations (create new files)
- Edge functions (edit existing or create new)
- Application code

### 4. Test

```bash
# Reset database to test migrations
supabase db reset

# View logs
supabase logs

# Check status
supabase status
```

### 5. Stop

```bash
supabase stop
```

## Environment Variables

### Local Development

Your `.env.local` should point to local Supabase:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<from_supabase_status>
```

Get the anon key by running:
```bash
supabase status
```

### Remote Environments

Remote environments (staging, production) use different Supabase projects:

- **Staging**: `wuinfsedukvxlkfvlpna.supabase.co`
- **Production**: `fkjbvwbnbxslornufhlp.supabase.co`

These are configured in Vercel environment variables and GitHub Actions.

## Troubleshooting

### Migrations fail

```bash
# View detailed error
supabase db reset --debug

# Check migration syntax
cat supabase/migrations/<failing_migration>.sql
```

### Port conflicts

If ports 54321-54324 are in use:

```bash
# Check what's using the port
lsof -i :54321

# Stop Supabase
supabase stop

# Kill the conflicting process or change ports in config.toml
```

### Docker issues

```bash
# Check Docker is running
docker ps

# Clean up Docker
supabase stop
docker system prune

# Restart
supabase start
```

### Database in bad state

```bash
# Nuclear option: delete everything and start fresh
supabase stop
docker volume prune  # WARNING: Deletes all data
supabase start
```

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Local Development Guide](../docs/LOCAL_DEVELOPMENT.md)
- [Quick Reference](../docs/SUPABASE_QUICK_REFERENCE.md)
- [Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)

## CI/CD Integration

Migrations and functions are automatically deployed via GitHub Actions:

- **Staging**: Push to `stage` branch
- **Production**: Push to `main` branch

The CI/CD pipeline:
1. Runs migrations (`supabase db push`)
2. Deploys edge functions (`supabase functions deploy`)
3. Deploys frontend to Vercel

See `.github/workflows/` for workflow definitions.

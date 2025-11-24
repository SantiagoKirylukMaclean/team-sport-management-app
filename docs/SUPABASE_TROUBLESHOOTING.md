# Supabase Local Development Troubleshooting

This guide covers common issues when working with Supabase locally and how to resolve them.

## Installation Issues

### Supabase CLI not found

**Problem**: `command not found: supabase`

**Solution**:

```bash
# macOS (Homebrew)
brew install supabase/tap/supabase

# npm (all platforms)
npm install -g supabase

# Verify installation
supabase --version
```

### Docker not running

**Problem**: `Cannot connect to the Docker daemon`

**Solution**:

1. Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
2. Start Docker Desktop application
3. Verify Docker is running:
   ```bash
   docker ps
   ```

## Startup Issues

### First start takes a long time

**Problem**: `supabase start` takes 5-10 minutes on first run

**Explanation**: This is normal! Supabase needs to download Docker images (~2GB).

**What's happening**:
- Downloading PostgreSQL image
- Downloading Supabase services images
- Initializing database
- Applying migrations

**Solution**: Be patient. Subsequent starts will be much faster (10-30 seconds).

### Port already in use

**Problem**: 
```
Error: port 54321 is already in use
```

**Solution**:

```bash
# Check what's using the port
lsof -i :54321
lsof -i :54322
lsof -i :54323
lsof -i :54324

# Kill the process
kill -9 <PID>

# Or stop Supabase if it's already running
supabase stop

# Then start again
supabase start
```

**Alternative**: Change ports in `supabase/config.toml`:

```toml
[api]
port = 54331  # Changed from 54321

[db]
port = 54332  # Changed from 54322

[studio]
port = 54333  # Changed from 54323
```

### Container health check fails

**Problem**:
```
failed to inspect container health: Error response from daemon: No such container
```

**Solution**:

```bash
# Stop everything
supabase stop

# Clean up Docker
docker system prune

# Remove Supabase volumes (WARNING: deletes data)
docker volume ls | grep supabase
docker volume rm $(docker volume ls -q | grep supabase)

# Start fresh
supabase start
```

### Permission denied errors

**Problem**: Permission errors when starting Supabase

**Solution**:

```bash
# Ensure Docker has proper permissions
# On macOS: Check Docker Desktop settings
# On Linux: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Restart Docker
```

## Migration Issues

### Migration fails to apply

**Problem**: Migration fails during `supabase start` or `supabase db reset`

**Common causes**:
1. SQL syntax error
2. Missing dependencies (tables, functions)
3. Duplicate objects (not idempotent)
4. Foreign key violations

**Solution**:

```bash
# View detailed error
supabase db reset --debug

# Check the failing migration
cat supabase/migrations/<timestamp>_<name>.sql

# Common fixes:
# 1. Add IF NOT EXISTS / IF EXISTS
# 2. Check table/column names
# 3. Ensure proper order of operations
# 4. Verify foreign key references exist
```

**Example fixes**:

```sql
-- Bad: Will fail on second run
CREATE TABLE users (id UUID PRIMARY KEY);

-- Good: Idempotent
CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY);

-- Bad: Will fail if column exists
ALTER TABLE users ADD COLUMN email TEXT;

-- Good: Safe
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
```

### Migrations out of order

**Problem**: Migrations applied in wrong order

**Explanation**: Migrations run in chronological order based on filename timestamp.

**Solution**:

Ensure migration filenames follow the pattern:
```
YYYYMMDDHHMMSS_description.sql
```

If you need to reorder:
1. Rename files with correct timestamps
2. Run `supabase db reset` to reapply in new order

### Migration applied but changes not visible

**Problem**: Ran migration but changes don't appear in database

**Solution**:

```bash
# Reset database to reapply all migrations
supabase db reset

# Check migration was actually applied
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;"

# View in Studio
open http://127.0.0.1:54323
```

## Connection Issues

### Application can't connect to database

**Problem**: Application shows connection errors

**Solution**:

1. **Verify Supabase is running**:
   ```bash
   supabase status
   ```

2. **Check environment variables** in `.env.local`:
   ```env
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=<from_supabase_status>
   ```

3. **Get correct anon key**:
   ```bash
   supabase status | grep "anon key"
   ```

4. **Restart your dev server**:
   ```bash
   # Stop your app (Ctrl+C)
   npm run dev
   ```

### CORS errors in browser

**Problem**: CORS errors when calling Supabase API

**Solution**:

1. **Check API URL** - should be `http://127.0.0.1:54321` (not `localhost`)
2. **Verify auth header** - ensure anon key is correct
3. **Check browser console** for specific error
4. **Restart Supabase**:
   ```bash
   supabase stop
   supabase start
   ```

### Database connection refused

**Problem**: `connection refused` when connecting to PostgreSQL

**Solution**:

```bash
# Check database is running
docker ps | grep postgres

# Check port is correct (54322)
supabase status | grep "DB URL"

# Try connecting directly
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# If still failing, restart
supabase stop
supabase start
```

## Edge Function Issues

### Function not found

**Problem**: `404 Not Found` when calling function

**Solution**:

```bash
# Ensure functions are being served
supabase functions serve

# Check function exists
ls supabase/functions/

# Verify URL format
# Correct: http://127.0.0.1:54321/functions/v1/my-function
# Wrong: http://127.0.0.1:54321/my-function
```

### Function errors

**Problem**: Function returns 500 error

**Solution**:

```bash
# View function logs
supabase functions serve

# Logs appear in terminal when function is called

# Common issues:
# 1. Missing imports
# 2. Syntax errors
# 3. Missing environment variables
# 4. CORS headers not set
```

**Example function with proper error handling**:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { data } = await req.json()
    
    // Your logic here
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    )
  }
})
```

### Function changes not reflected

**Problem**: Updated function code but changes don't appear

**Solution**:

```bash
# Restart function server
# Press Ctrl+C to stop
supabase functions serve

# Functions should hot-reload, but if not:
supabase stop
supabase start
supabase functions serve
```

## Docker Issues

### Docker out of disk space

**Problem**: `no space left on device`

**Solution**:

```bash
# Check Docker disk usage
docker system df

# Clean up unused containers and images
docker system prune -a

# Remove Supabase volumes (WARNING: deletes data)
docker volume prune

# Restart
supabase start
```

### Docker containers won't stop

**Problem**: `supabase stop` hangs or fails

**Solution**:

```bash
# Force stop all Supabase containers
docker ps | grep supabase | awk '{print $1}' | xargs docker stop

# Force remove containers
docker ps -a | grep supabase | awk '{print $1}' | xargs docker rm

# Clean up
docker system prune

# Start fresh
supabase start
```

### Docker daemon not responding

**Problem**: Docker commands hang or timeout

**Solution**:

1. **Restart Docker Desktop** (macOS/Windows)
2. **Restart Docker service** (Linux):
   ```bash
   sudo systemctl restart docker
   ```
3. **Check Docker logs** for errors
4. **Reinstall Docker** if problems persist

## Performance Issues

### Supabase running slow

**Problem**: Database queries or API calls are slow

**Solution**:

1. **Check Docker resources**:
   - Docker Desktop → Settings → Resources
   - Increase CPU and Memory allocation
   - Recommended: 4GB RAM, 2 CPUs minimum

2. **Check disk space**:
   ```bash
   df -h
   docker system df
   ```

3. **Restart Docker**:
   ```bash
   supabase stop
   # Restart Docker Desktop
   supabase start
   ```

4. **Optimize queries**:
   - Add indexes to frequently queried columns
   - Use EXPLAIN ANALYZE to identify slow queries
   - Check query plans in Studio

### Database reset takes too long

**Problem**: `supabase db reset` takes several minutes

**Explanation**: Normal if you have many migrations or large seed data.

**Solution**:

```bash
# Skip seed data
supabase db reset --no-seed

# View progress
supabase db reset --debug
```

## Data Issues

### Lost local data

**Problem**: Local database data disappeared

**Possible causes**:
1. Ran `supabase db reset` (intentional)
2. Ran `docker volume prune` (deletes all data)
3. Docker crashed or was force-quit

**Solution**:

Unfortunately, local data is not backed up. You'll need to:

1. **Recreate data manually** or
2. **Use seed file** to populate test data:
   ```sql
   -- supabase/seed.sql
   INSERT INTO teams (name) VALUES ('Test Team');
   ```
3. **Run reset** to apply seed:
   ```bash
   supabase db reset
   ```

**Prevention**:
- Use seed files for important test data
- Don't use local environment for important data
- Use staging/production for persistent data

### Seed data not loading

**Problem**: `supabase db reset` doesn't load seed data

**Solution**:

1. **Check seed file exists**: `supabase/seed.sql`
2. **Check config.toml**:
   ```toml
   [db.seed]
   enabled = true
   sql_paths = ["./seed.sql"]
   ```
3. **Check seed file syntax**:
   ```bash
   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < supabase/seed.sql
   ```
4. **View errors**:
   ```bash
   supabase db reset --debug
   ```

## Studio Issues

### Studio won't load

**Problem**: http://127.0.0.1:54323 doesn't load

**Solution**:

```bash
# Check Studio is running
supabase status | grep Studio

# Check port 54323 is not blocked
lsof -i :54323

# Restart Supabase
supabase stop
supabase start

# Try different browser
# Clear browser cache
```

### Studio shows wrong data

**Problem**: Studio displays outdated or incorrect data

**Solution**:

```bash
# Refresh browser (Cmd+R or Ctrl+R)
# Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

# If still wrong, restart Supabase
supabase stop
supabase start
```

## Environment Variable Issues

### Wrong Supabase URL

**Problem**: App connects to wrong Supabase instance

**Solution**:

Check `.env.local`:
```env
# Local development
VITE_SUPABASE_URL=http://127.0.0.1:54321

# NOT these:
# VITE_SUPABASE_URL=https://wuinfsedukvxlkfvlpna.supabase.co  # Staging
# VITE_SUPABASE_URL=https://fkjbvwbnbxslornufhlp.supabase.co  # Production
```

Restart your dev server after changing:
```bash
npm run dev
```

### Anon key doesn't work

**Problem**: Authentication fails with local anon key

**Solution**:

```bash
# Get fresh anon key
supabase status

# Copy the "anon key" value to .env.local
# Restart your dev server
```

## Getting More Help

### Enable debug mode

```bash
# Start with debug output
supabase start --debug

# Reset with debug output
supabase db reset --debug

# View all logs
supabase logs
```

### Check logs

```bash
# All logs
supabase logs

# Specific service
supabase logs db
supabase logs api
supabase logs auth

# Follow logs in real-time
supabase logs -f
```

### Verify installation

```bash
# Check versions
supabase --version
docker --version

# Check Docker is running
docker ps

# Check Supabase status
supabase status
```

### Nuclear option: Complete reset

If nothing else works:

```bash
# 1. Stop Supabase
supabase stop

# 2. Remove all containers
docker ps -a | grep supabase | awk '{print $1}' | xargs docker rm -f

# 3. Remove all volumes (WARNING: deletes all data)
docker volume ls | grep supabase | awk '{print $2}' | xargs docker volume rm

# 4. Clean Docker
docker system prune -a

# 5. Restart Docker Desktop

# 6. Start fresh
supabase start
```

## Common Error Messages

### "failed to inspect container health"

**Cause**: Container doesn't exist or isn't running

**Solution**: `supabase stop && supabase start`

### "port is already allocated"

**Cause**: Port conflict

**Solution**: Stop conflicting service or change ports in config.toml

### "no space left on device"

**Cause**: Docker out of disk space

**Solution**: `docker system prune -a`

### "permission denied"

**Cause**: Docker permission issues

**Solution**: Add user to docker group or check Docker Desktop settings

### "connection refused"

**Cause**: Service not running or wrong port

**Solution**: Check `supabase status` and verify ports

## Additional Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Local Development Guide](./LOCAL_DEVELOPMENT.md)
- [Quick Reference](./SUPABASE_QUICK_REFERENCE.md)
- [Docker Documentation](https://docs.docker.com/)
- [Supabase Discord](https://discord.supabase.com/) - Community support

# User Invitation System Documentation

## Overview

The User Invitation System enables SUPER_ADMIN users to invite coaches and admins to join teams through a streamlined process that bypasses email validation. The system generates one-time recovery links that can be shared through any communication channel (WhatsApp, Slack, etc.), and automatically assigns roles and team memberships when invitees complete their registration.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Frontend Components](#frontend-components)
5. [Usage Examples](#usage-examples)
6. [Migration Process](#migration-process)
7. [Extending the System](#extending-the-system)
8. [Troubleshooting](#troubleshooting)
9. [Security Considerations](#security-considerations)

## System Architecture

The invitation system follows a three-tier architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Edge Function  │    │   Database      │
│   Components    │───▶│   invite-user    │───▶│   Triggers &    │
│                 │    │                  │    │   RLS Policies  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Components:
- **Frontend**: React components for invitation management
- **API Layer**: Supabase Edge Function for secure invitation processing
- **Database**: PostgreSQL with triggers for automatic user assignment

## Database Schema

### pending_invites Table

```sql
create table public.pending_invites (
  id bigserial primary key,
  email text not null unique,
  role app_role not null check (role in ('coach','admin')),
  team_ids bigint[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','accepted','canceled')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now(),
  accepted_at timestamptz
);
```

### Key Features:
- **Email uniqueness**: Prevents duplicate invitations
- **Role validation**: Only allows 'coach' and 'admin' roles
- **Team assignments**: Array of team IDs for multi-team invitations
- **Status tracking**: Monitors invitation lifecycle
- **Audit trail**: Tracks creation and acceptance timestamps

### Database Trigger

The `apply_pending_invite()` trigger automatically processes invitations when users complete registration:

```sql
create or replace function public.apply_pending_invite()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  -- Match user by email and process invitation
  -- Create profile with specified role
  -- Assign to teams via user_team_roles
  -- Mark invitation as accepted
  return new;
end;
$$;
```

## API Endpoints

### POST /functions/v1/invite-user

Creates a new user invitation and generates a recovery link.

**Authentication**: Bearer token (SUPER_ADMIN role required)

**Request Body**:
```typescript
{
  email: string;           // Invitee's email address
  display_name?: string;   // Optional display name
  role: 'coach' | 'admin'; // Role to assign
  teamIds: number[];       // Array of team IDs
  redirectTo?: string;     // Optional redirect URL after signup
}
```

**Response**:
```typescript
{
  ok: boolean;
  action_link: string;     // Recovery link to share
  error?: string;          // Error message if failed
}
```

## Frontend Components

### InviteUserPage
Main page component for creating invitations.

**Location**: `src/pages/admin/InviteUserPage.tsx`

**Features**:
- Form validation with Zod schema
- Team multi-select with hierarchical display
- Real-time validation feedback
- Success/error handling with toast notifications

### TeamMultiSelect
Reusable component for selecting multiple teams.

**Location**: `src/components/ui/team-multi-select.tsx`

**Props**:
```typescript
interface TeamMultiSelectProps {
  value: number[];
  onChange: (teamIds: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
}
```

### InvitationResult
Displays the generated invitation link with copy functionality.

**Location**: `src/components/ui/invitation-result.tsx`

**Features**:
- Copy to clipboard
- Visual feedback for successful copy
- Link validation display

## Usage Examples

### Creating an Invitation

```typescript
import { createInvitation } from '../services/invites';

// Create invitation for a coach
const inviteCoach = async () => {
  try {
    const result = await createInvitation({
      email: 'coach@example.com',
      display_name: 'John Coach',
      role: 'coach',
      teamIds: [1, 2, 3], // Assign to multiple teams
      redirectTo: 'https://myapp.com/dashboard'
    });
    
    if (result.ok) {
      console.log('Share this link:', result.action_link);
    }
  } catch (error) {
    console.error('Invitation failed:', error);
  }
};
```

### Listing Invitations

```typescript
import { listInvitations } from '../services/invites';

// Get all pending invitations
const getPendingInvitations = async () => {
  try {
    const invitations = await listInvitations('pending');
    console.log('Pending invitations:', invitations);
  } catch (error) {
    console.error('Failed to fetch invitations:', error);
  }
};
```

### Custom Team Selection

```typescript
import { TeamMultiSelect } from '../components/ui/team-multi-select';

const MyInviteForm = () => {
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  
  return (
    <form>
      <TeamMultiSelect
        value={selectedTeams}
        onChange={setSelectedTeams}
        placeholder="Select teams for the invitee"
      />
    </form>
  );
};
```

## Migration Process

### Database Migration

The invitation system requires a database migration to create the necessary tables and triggers.

**Migration File**: `supabase/migrations/20250923020000_invites_and_trigger.sql`

### Running the Migration

```bash
# Apply migration to local development
supabase db reset

# Apply to production (after testing)
supabase db push
```

### Migration Contents

1. **Create pending_invites table** with proper constraints
2. **Set up RLS policies** for security
3. **Create trigger function** for automatic processing
4. **Create indexes** for performance
5. **Grant necessary permissions**

### Rollback Strategy

If you need to rollback the migration:

```sql
-- Remove trigger
drop trigger if exists trg_apply_pending_invite on auth.users;

-- Remove function
drop function if exists public.apply_pending_invite();

-- Remove table
drop table if exists public.pending_invites;
```

## Extending the System

### Adding New Invitation Types

To support additional roles or invitation types:

1. **Update the role enum**:
```sql
alter type app_role add value 'new_role';
```

2. **Update validation schemas**:
```typescript
const roleSchema = z.enum(['coach', 'admin', 'new_role']);
```

3. **Update trigger logic** to handle new role assignments

### Custom Invitation Templates

Create custom invitation processing:

```typescript
// Custom invitation service
export class CustomInvitationService {
  async createBulkInvitations(invitations: InviteUserRequest[]) {
    const results = [];
    for (const invite of invitations) {
      const result = await createInvitation(invite);
      results.push(result);
    }
    return results;
  }
  
  async createInvitationWithTemplate(
    templateId: string, 
    userData: Partial<InviteUserRequest>
  ) {
    const template = await this.getTemplate(templateId);
    const invitation = { ...template, ...userData };
    return createInvitation(invitation);
  }
}
```

### Adding Invitation Expiration

Extend the system to support expiring invitations:

```sql
-- Add expiration column
alter table pending_invites 
add column expires_at timestamptz default (now() + interval '7 days');

-- Update trigger to check expiration
create or replace function public.apply_pending_invite()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  -- Check if invitation is not expired
  if exists (
    select 1 from pending_invites 
    where email = new.email 
    and status = 'pending' 
    and (expires_at is null or expires_at > now())
  ) then
    -- Process invitation
  end if;
  return new;
end;
$$;
```

### Custom Redirect Handling

Implement custom post-signup redirects:

```typescript
// Custom redirect service
export const handleInvitationRedirect = (
  actionLink: string, 
  customParams?: Record<string, string>
) => {
  const url = new URL(actionLink);
  
  // Add custom parameters
  if (customParams) {
    Object.entries(customParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  
  return url.toString();
};
```

## Troubleshooting

### Common Issues

#### 1. "Permission denied for table pending_invites"

**Cause**: User doesn't have SUPER_ADMIN role or RLS policies are blocking access.

**Solution**:
```sql
-- Check user role
select role from profiles where id = auth.uid();

-- Verify RLS policies
select * from pg_policies where tablename = 'pending_invites';
```

#### 2. "Invitation link not working"

**Cause**: Link may be expired, malformed, or user already exists.

**Solution**:
- Check invitation status in database
- Verify link format and expiration
- Regenerate link if needed

```sql
-- Check invitation status
select * from pending_invites where email = 'user@example.com';

-- Regenerate invitation
update pending_invites 
set status = 'pending', created_at = now() 
where email = 'user@example.com';
```

#### 3. "Teams not assigned after signup"

**Cause**: Trigger not executing or team IDs invalid.

**Solution**:
```sql
-- Check trigger exists
select * from pg_trigger where tgname = 'trg_apply_pending_invite';

-- Verify team IDs exist
select id, name from teams where id = any(array[1,2,3]);

-- Check user_team_roles assignments
select * from user_team_roles where user_id = 'user-uuid';
```

#### 4. "Edge Function authentication failed"

**Cause**: Invalid JWT token or missing SUPER_ADMIN role.

**Solution**:
- Verify token is valid and not expired
- Check user has SUPER_ADMIN role in profiles table
- Ensure proper Authorization header format

```typescript
// Correct header format
const headers = {
  'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
  'Content-Type': 'application/json'
};
```

### Debugging Steps

#### 1. Check Database Logs

```sql
-- Enable logging for debugging
set log_statement = 'all';
set log_min_duration_statement = 0;
```

#### 2. Verify Edge Function Logs

```bash
# View function logs
supabase functions logs invite-user

# Deploy with debug logging
supabase functions deploy invite-user --debug
```

#### 3. Test Trigger Manually

```sql
-- Test trigger execution
insert into auth.users (id, email, email_confirmed_at) 
values (gen_random_uuid(), 'test@example.com', now());
```

#### 4. Validate RLS Policies

```sql
-- Test as different users
set role authenticated;
set request.jwt.claims to '{"sub": "user-uuid", "role": "authenticated"}';

-- Test queries
select * from pending_invites;
```

### Performance Issues

#### 1. Slow Team Loading

**Solution**: Add indexes and optimize queries
```sql
-- Add indexes for better performance
create index idx_teams_sport_club on teams(sport_id, club_id);
create index idx_pending_invites_email on pending_invites(email);
create index idx_pending_invites_status on pending_invites(status);
```

#### 2. Trigger Performance

**Solution**: Optimize trigger logic
```sql
-- Use efficient queries in trigger
create or replace function public.apply_pending_invite()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  invite_record pending_invites%rowtype;
begin
  -- Use single query to get and lock invitation
  select * into invite_record 
  from pending_invites 
  where lower(email) = lower(new.email) 
  and status = 'pending'
  for update;
  
  if found then
    -- Process efficiently
  end if;
  
  return new;
end;
$$;
```

## Security Considerations

### Authentication & Authorization
- All invitation operations require SUPER_ADMIN role
- RLS policies prevent unauthorized data access
- JWT tokens validated on every request
- Trigger executes with elevated privileges securely

### Data Protection
- Email addresses validated and sanitized
- SQL injection prevented through parameterized queries
- XSS protection in frontend components
- Secure handling of recovery links

### Best Practices
1. **Always validate user roles** before invitation operations
2. **Use HTTPS** for all invitation links in production
3. **Implement rate limiting** for invitation creation
4. **Monitor invitation usage** for suspicious activity
5. **Regularly audit** invitation records and cleanup old data

### Security Checklist

- [ ] RLS policies properly configured
- [ ] Edge Function authentication working
- [ ] Trigger security definer set correctly
- [ ] Frontend input validation implemented
- [ ] HTTPS enforced in production
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] Regular security reviews scheduled

---

## Support

For additional help or questions about the invitation system:

1. Check the [troubleshooting section](#troubleshooting)
2. Review the [test files](../src/__tests__/) for usage examples
3. Consult the [design document](../.kiro/specs/user-invitation-system/design.md)
4. Check database logs and Edge Function logs for errors

## Contributing

When extending or modifying the invitation system:

1. Update relevant tests
2. Update this documentation
3. Follow existing code patterns
4. Test security implications
5. Update migration scripts if needed
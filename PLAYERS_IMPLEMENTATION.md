# Player Management Implementation

## Overview
This implementation provides a complete player management system with Row Level Security (RLS) for team-based access control.

## Database Migration
- **File**: `supabase/migrations/20251020000000_players.sql`
- **Features**:
  - Creates `public.players` table with team association
  - Implements RLS policies for super_admin and coach/admin access
  - Adds unique constraint for jersey numbers per team
  - Uses existing `is_superadmin()` and `is_coach_of_team()` functions

## Frontend Implementation

### Services
- **File**: `src/services/players.ts`
- **Functions**: `listPlayers`, `createPlayer`, `updatePlayer`, `deletePlayer`
- **Type**: `Player` interface

### UI Components
- **Main Page**: `src/pages/coach/PlayersPage.tsx`
- **Form Dialog**: `src/pages/coach/components/PlayerFormDialog.tsx`
- **Route Guard**: `src/components/RouteGuards/CoachGuard.tsx`
- **Layout**: `src/layouts/CoachLayout.tsx`

### Routes
- **Coach Panel**: `/coach/players`
- **Access**: Requires `super_admin`, `admin`, or `coach` role
- **Features**: Team selection, player CRUD operations, confirmation dialogs

## Key Features

### Security
- RLS policies ensure coaches only see players from their assigned teams
- Super admins have full access to all players
- Permission errors are handled gracefully

### UX
- Team selector with auto-selection of first available team
- Form validation with Zod schema
- Loading states and error handling
- Confirmation dialogs for destructive actions
- Empty states with helpful messaging

### Data Validation
- Player names: 2-120 characters
- Jersey numbers: 0-999, optional, unique per team
- Duplicate jersey number detection with user-friendly error messages

## Usage

1. **Apply Migration**: Run the migration to create the players table and RLS policies
2. **Access Interface**: Navigate to `/coach/players` as a coach/admin user
3. **Select Team**: Choose a team from the dropdown (auto-selected if only one)
4. **Manage Players**: Create, edit, and delete players with proper validation

## Error Handling
- **RLS Violations**: "No tenés permisos para este equipo"
- **Duplicate Jersey**: "Ese número ya existe en el equipo"
- **Generic Errors**: Display error message from API
- **Loading States**: Spinners and disabled buttons during operations

## Dependencies
All required UI components and utilities are already available in the project.
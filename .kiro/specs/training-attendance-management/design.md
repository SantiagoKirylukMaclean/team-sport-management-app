# Design Document

## Overview

The Training and Attendance Management feature enables coaches and administrators to create, manage, and track training sessions for their teams. The system records player attendance with three distinct states (on-time, late, absent) and enforces role-based access control through Supabase Row Level Security (RLS) policies.

The feature follows the existing application architecture patterns, using Supabase for backend services, React with TypeScript for the frontend, and shadcn/ui components for the user interface. The design ensures that coaches can only access training sessions and attendance records for teams they are assigned to, while super administrators have unrestricted access.

## Architecture

### Database Layer

The database schema consists of three main components:

1. **Enum Type**: `attendance_status` with values `on_time`, `late`, `absent`
2. **Training Sessions Table**: Stores training session metadata
3. **Training Attendance Table**: Stores individual player attendance records with a composite primary key

The migration script is idempotent, using conditional logic to safely create or update database objects without errors on repeated execution.

### Service Layer

The service layer provides a clean API for interacting with Supabase, following the established pattern seen in `players.ts` and `teams.ts`. Services handle:

- Type definitions for TypeScript
- CRUD operations for training sessions
- Attendance record management (upsert pattern)
- Error propagation to the UI layer

### UI Layer

The UI follows the coach pages pattern established in `PlayersPage.tsx`:

- Team selection dropdown (filtered by coach permissions)
- Training sessions list with CRUD operations
- Attendance tracking panel for each session
- Consistent error handling and loading states
- Reusable dialog components for forms and confirmations

## Components and Interfaces

### Database Schema

```sql
-- Enum for attendance status
CREATE TYPE attendance_status AS ENUM ('on_time', 'late', 'absent');

-- Training sessions table
CREATE TABLE public.training_sessions (
  id BIGSERIAL PRIMARY KEY,
  team_id BIGINT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Training attendance table
CREATE TABLE public.training_attendance (
  training_id BIGINT NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  status attendance_status NOT NULL,
  PRIMARY KEY (training_id, player_id)
);
```

### RLS Policies

**Training Sessions Policies:**
- `ts superadmin all`: Super admins have full access
- `ts coach crud`: Coaches can CRUD sessions for their assigned teams using `is_coach_of_team(team_id)`

**Training Attendance Policies:**
- `ta superadmin all`: Super admins have full access
- `ta coach crud`: Coaches can CRUD attendance records only when both the training session and player belong to a team they coach

### Service Layer Types and Functions

**File**: `src/services/trainings.ts`

```typescript
// Type definitions
export type TrainingSession = {
  id: number
  team_id: number
  session_date: string
  notes: string | null
  created_at: string
}

export type TrainingAttendance = {
  training_id: number
  player_id: number
  status: 'on_time' | 'late' | 'absent'
}

export type AttendanceWithPlayer = TrainingAttendance & {
  player: {
    id: number
    full_name: string
    jersey_number: number | null
  }
}

// Functions
listTrainingSessions(teamId: number): Promise<SupabaseResponse<TrainingSession[]>>
createTrainingSession(values: { team_id: number; session_date: string; notes?: string }): Promise<SupabaseResponse<TrainingSession>>
updateTrainingSession(id: number, values: { session_date?: string; notes?: string }): Promise<SupabaseResponse<TrainingSession>>
deleteTrainingSession(id: number): Promise<SupabaseResponse<void>>
listTrainingAttendance(trainingId: number): Promise<SupabaseResponse<AttendanceWithPlayer[]>>
upsertTrainingAttendance(trainingId: number, playerId: number, status: 'on_time' | 'late' | 'absent'): Promise<SupabaseResponse<TrainingAttendance>>
```

### UI Components

**1. TrainingsPage** (`src/pages/coach/TrainingsPage.tsx`)

Main page component that orchestrates the training management interface.

**State Management:**
- `teams`: List of teams the coach has access to
- `selectedTeamId`: Currently selected team
- `trainingSessions`: List of training sessions for selected team
- `loading`: Initial page load state
- `sessionsLoading`: Training sessions loading state
- Dialog states for create/edit/delete operations

**Key Features:**
- Team selector dropdown (auto-selects first team)
- Training sessions table with date, notes, and action buttons
- Create new session button
- Edit and delete actions per session
- Click on session row to view/edit attendance
- Empty states for no teams and no sessions

**2. TrainingFormDialog** (`src/pages/coach/components/TrainingFormDialog.tsx`)

Dialog component for creating and editing training sessions.

**Props:**
- `open`: Dialog visibility state
- `onClose`: Close handler
- `onSave`: Success callback
- `training`: Training session to edit (null for create)
- `teamId`: Team ID for new sessions

**Form Fields:**
- `session_date`: Date picker (required)
- `notes`: Textarea (optional)

**Validation:**
- Date is required
- Notes max length 500 characters

**3. TrainingAttendancePanel** (`src/pages/coach/components/TrainingAttendancePanel.tsx`)

Panel component for marking player attendance for a specific training session.

**Props:**
- `trainingId`: Training session ID
- `teamId`: Team ID to fetch players
- `onClose`: Close handler

**Features:**
- Displays all players from the team
- Shows current attendance status for each player
- Select dropdown for each player with three options: On Time, Late, Absent
- Auto-saves on status change (upsert pattern)
- Loading states during save operations
- Error handling with toast notifications

**Layout:**
- Table format with columns: Player Name, Jersey Number, Attendance Status
- Status displayed as badges with color coding:
  - On Time: Green badge
  - Late: Yellow badge
  - Absent: Red badge
  - Not Marked: Gray badge

## Data Models

### TrainingSession

Represents a scheduled training session for a team.

```typescript
{
  id: number                    // Auto-generated primary key
  team_id: number              // Foreign key to teams table
  session_date: string         // ISO date string (YYYY-MM-DD)
  notes: string | null         // Optional notes about the session
  created_at: string           // ISO timestamp of creation
}
```

### TrainingAttendance

Represents a player's attendance record for a training session.

```typescript
{
  training_id: number          // Foreign key to training_sessions
  player_id: number            // Foreign key to players
  status: 'on_time' | 'late' | 'absent'  // Attendance status
}
```

### AttendanceWithPlayer

Extended attendance record with player information for UI display.

```typescript
{
  training_id: number
  player_id: number
  status: 'on_time' | 'late' | 'absent'
  player: {
    id: number
    full_name: string
    jersey_number: number | null
  }
}
```

## Error Handling

### Database Errors

**RLS Policy Violations:**
- Detected by checking for permission-related error messages
- Display user-friendly message: "No tenés permisos para acceder a este recurso"
- Prevent further actions until user selects a valid team

**Constraint Violations:**
- Unique constraint on (training_id, player_id) in attendance table
- Foreign key violations if team/player is deleted
- Display specific error messages based on constraint type

**Network Errors:**
- Timeout errors: "Error de conexión. Verificá tu conexión a internet."
- Server errors: "Error del servidor. Intentá nuevamente más tarde."

### UI Error States

**Loading States:**
- Skeleton loaders for initial page load
- Spinner indicators for async operations
- Disabled buttons during form submission

**Empty States:**
- No teams assigned: Display message to contact administrator
- No training sessions: Display call-to-action to create first session
- No players in team: Display message that attendance cannot be tracked

**Toast Notifications:**
- Success: Green toast with confirmation message
- Error: Red toast with specific error description
- Info: Blue toast for informational messages

### Error Recovery

**Retry Logic:**
- Allow users to retry failed operations
- Refresh data after successful retry
- Clear error state on successful operation

**Graceful Degradation:**
- If attendance fetch fails, still show training sessions
- If player list fails, show error in attendance panel only
- Maintain partial functionality when possible

## Testing Strategy

### Unit Tests

**Service Layer Tests** (`src/services/__tests__/trainings.test.ts`)

Test each service function in isolation using mocked Supabase client:

- `listTrainingSessions`: Verify correct query parameters and team filtering
- `createTrainingSession`: Verify insert with required and optional fields
- `updateTrainingSession`: Verify update with partial data
- `deleteTrainingSession`: Verify delete by ID
- `listTrainingAttendance`: Verify join with players table
- `upsertTrainingAttendance`: Verify upsert logic for new and existing records

**Component Tests**

`src/pages/coach/components/__tests__/TrainingFormDialog.test.tsx`:
- Renders form fields correctly
- Validates required fields
- Handles create and edit modes
- Displays loading state during submission
- Shows error messages on validation failure

`src/pages/coach/components/__tests__/TrainingAttendancePanel.test.tsx`:
- Renders player list with attendance status
- Updates attendance on status change
- Displays loading state during save
- Shows error toast on save failure
- Handles empty player list

### Integration Tests

**Training Workflow** (`src/__tests__/TrainingWorkflow.integration.test.tsx`)

Test complete user workflows:

1. Coach selects team from dropdown
2. Creates new training session
3. Verifies session appears in list
4. Opens attendance panel
5. Marks attendance for multiple players
6. Verifies attendance is saved
7. Edits training session details
8. Deletes training session

**RLS Policy Tests** (`src/__tests__/TrainingRLS.test.ts`)

Test access control scenarios:

- Super admin can access all training sessions
- Coach can only access sessions for assigned teams
- Coach cannot access sessions for unassigned teams
- Coach can only mark attendance for players in their teams
- Attendance records are deleted when training session is deleted

### Manual Testing Checklist

- [ ] Team selector populates with coach's teams only
- [ ] Creating training session with valid data succeeds
- [ ] Creating training session with missing date fails with validation error
- [ ] Editing training session updates data correctly
- [ ] Deleting training session removes it from list
- [ ] Attendance panel shows all players from team
- [ ] Changing attendance status saves immediately
- [ ] Attendance status displays with correct color coding
- [ ] RLS blocks access to other teams' sessions
- [ ] Error messages are user-friendly and in Spanish
- [ ] Loading states display during async operations
- [ ] Empty states display appropriate messages

## Implementation Notes

### Migration Idempotency

The migration uses PL/pgSQL blocks with conditional logic to ensure safe repeated execution:

- Check if enum type exists before creating
- Add enum values only if they don't exist
- Use `CREATE TABLE IF NOT EXISTS` for tables
- Use `DROP POLICY IF EXISTS` before `CREATE POLICY` for policies
- Use `CREATE INDEX IF NOT EXISTS` for indexes

### Attendance Upsert Pattern

The attendance tracking uses Supabase's upsert functionality:

```typescript
supabase
  .from('training_attendance')
  .upsert(
    { training_id, player_id, status },
    { onConflict: 'training_id,player_id' }
  )
```

This allows seamless updates when a coach changes a player's attendance status without checking if a record exists first.

### Date Handling

Training session dates are stored as PostgreSQL `DATE` type (no time component). The UI uses:

- HTML5 date input for session_date field
- ISO date format (YYYY-MM-DD) for API communication
- Localized date display using `toLocaleDateString('es-AR')` in tables

### Performance Considerations

**Indexes:**
- `idx_training_sessions_team` on `training_sessions(team_id)` for fast team filtering
- Composite primary key on `training_attendance(training_id, player_id)` provides index for lookups

**Query Optimization:**
- Attendance query joins with players table to fetch player details in single query
- Training sessions ordered by `session_date DESC` to show recent sessions first
- Team list cached in component state to avoid repeated fetches

### Accessibility

- Form labels properly associated with inputs
- Keyboard navigation supported in all dialogs
- Focus management when opening/closing dialogs
- ARIA labels for icon-only buttons
- Color-blind friendly status indicators (use badges with text, not just colors)

### Internationalization

All user-facing text is in Spanish (es-AR):
- UI labels and buttons
- Error messages
- Toast notifications
- Empty state messages
- Date formatting

Future enhancement: Extract strings to i18n files for multi-language support.

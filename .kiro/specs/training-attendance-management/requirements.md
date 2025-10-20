# Requirements Document

## Introduction

This feature enables coaches and administrators to manage training sessions for their teams and track player attendance with three distinct states: on-time, late, and absent. The system provides role-based access control ensuring that coaches can only manage training sessions and attendance for teams they are assigned to, while super administrators have full access across all teams.

## Glossary

- **Training System**: The complete training and attendance management feature
- **Training Session**: A scheduled training event for a specific team on a specific date
- **Attendance Record**: A record of a player's attendance status for a specific training session
- **Coach**: A user with the role 'coach' or 'admin' assigned to one or more teams
- **Super Admin**: A user with the role 'super_admin' who has unrestricted access to all system resources
- **Team**: A group of players associated with a club and sport
- **Player**: An individual member of a team whose attendance is tracked
- **Attendance Status**: An enumerated value representing player attendance (on_time, late, absent)
- **RLS**: Row Level Security policies that enforce access control at the database level

## Requirements

### Requirement 1

**User Story:** As a coach, I want to create training sessions for my teams, so that I can schedule and organize team activities

#### Acceptance Criteria

1. WHEN a coach creates a training session, THE Training System SHALL store the team_id, session_date, and optional notes in the training_sessions table
2. WHEN a coach attempts to create a training session, THE Training System SHALL verify the coach has permission for the specified team through RLS policies
3. THE Training System SHALL require session_date as a mandatory field for all training sessions
4. WHEN a training session is created, THE Training System SHALL automatically set the created_at timestamp to the current time
5. IF a coach attempts to create a training session for a team they are not assigned to, THEN THE Training System SHALL reject the operation with an RLS error

### Requirement 2

**User Story:** As a coach, I want to view all training sessions for my teams, so that I can track scheduled activities

#### Acceptance Criteria

1. WHEN a coach requests training sessions for a team, THE Training System SHALL return only sessions for teams the coach is assigned to
2. THE Training System SHALL display session_date, notes, and created_at for each training session
3. WHEN a super admin requests training sessions, THE Training System SHALL return sessions for all teams without restriction
4. THE Training System SHALL order training sessions by session_date in descending order by default

### Requirement 3

**User Story:** As a coach, I want to edit training session details, so that I can update scheduling or add notes

#### Acceptance Criteria

1. WHEN a coach updates a training session, THE Training System SHALL allow modification of session_date and notes fields
2. WHEN a coach attempts to update a training session, THE Training System SHALL verify the coach has permission for the associated team through RLS policies
3. IF a coach attempts to update a training session for a team they are not assigned to, THEN THE Training System SHALL reject the operation with an RLS error
4. THE Training System SHALL preserve the original created_at timestamp when updating a session

### Requirement 4

**User Story:** As a coach, I want to delete training sessions, so that I can remove cancelled or incorrectly created sessions

#### Acceptance Criteria

1. WHEN a coach deletes a training session, THE Training System SHALL remove the session and all associated attendance records through cascade deletion
2. WHEN a coach attempts to delete a training session, THE Training System SHALL verify the coach has permission for the associated team through RLS policies
3. IF a coach attempts to delete a training session for a team they are not assigned to, THEN THE Training System SHALL reject the operation with an RLS error
4. WHEN a training session is deleted, THE Training System SHALL automatically delete all related training_attendance records

### Requirement 5

**User Story:** As a coach, I want to mark player attendance for training sessions, so that I can track who attended, arrived late, or was absent

#### Acceptance Criteria

1. WHEN a coach records attendance, THE Training System SHALL accept one of three status values: on_time, late, or absent
2. THE Training System SHALL enforce a unique constraint on the combination of training_id and player_id
3. WHEN a coach updates attendance for a player, THE Training System SHALL upsert the record (insert if new, update if exists)
4. WHEN a coach attempts to record attendance, THE Training System SHALL verify both the training session and player belong to a team the coach is assigned to
5. IF a coach attempts to record attendance for a player not on the training session's team, THEN THE Training System SHALL reject the operation with an RLS error

### Requirement 6

**User Story:** As a coach, I want to view attendance records for a training session, so that I can see which players attended and their status

#### Acceptance Criteria

1. WHEN a coach requests attendance for a training session, THE Training System SHALL return all attendance records for that session
2. THE Training System SHALL display player_id and status for each attendance record
3. WHEN a coach requests attendance, THE Training System SHALL verify the coach has permission for the associated team through RLS policies
4. THE Training System SHALL return an empty list if no attendance has been recorded for the session

### Requirement 7

**User Story:** As a super admin, I want full access to all training sessions and attendance records, so that I can manage the system globally

#### Acceptance Criteria

1. WHEN a super admin performs any operation on training sessions, THE Training System SHALL allow the operation without team-based restrictions
2. WHEN a super admin performs any operation on attendance records, THE Training System SHALL allow the operation without team-based restrictions
3. THE Training System SHALL apply super admin policies before team-based coach policies in RLS evaluation

### Requirement 8

**User Story:** As a coach, I want to see clear error messages when operations fail, so that I can understand what went wrong

#### Acceptance Criteria

1. WHEN an RLS policy blocks an operation, THE Training System SHALL display a user-friendly error message indicating insufficient permissions
2. WHEN a database constraint is violated, THE Training System SHALL display a user-friendly error message explaining the validation failure
3. WHEN a network error occurs, THE Training System SHALL display a user-friendly error message indicating connectivity issues
4. THE Training System SHALL display loading indicators during asynchronous operations

### Requirement 9

**User Story:** As a system administrator, I want the database migration to be idempotent, so that it can be safely run multiple times without errors

#### Acceptance Criteria

1. WHEN the migration is executed, THE Training System SHALL create the attendance_status enum only if it does not already exist
2. WHEN the migration is executed, THE Training System SHALL create the training_sessions table only if it does not already exist
3. WHEN the migration is executed, THE Training System SHALL create the training_attendance table only if it does not already exist
4. WHEN the migration is executed, THE Training System SHALL drop and recreate all RLS policies to ensure they match the current specification
5. THE Training System SHALL create indexes on team_id in training_sessions for query performance

### Requirement 10

**User Story:** As a coach, I want the UI to filter training sessions by team, so that I can focus on specific team activities

#### Acceptance Criteria

1. WHEN a coach views the training page, THE Training System SHALL provide a team selector control
2. WHEN a coach selects a team, THE Training System SHALL display only training sessions for that team
3. THE Training System SHALL populate the team selector with only teams the coach is assigned to
4. WHEN a super admin views the training page, THE Training System SHALL populate the team selector with all teams

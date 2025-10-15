# Requirements Document

## Introduction

This feature enables SUPER_ADMIN users to invite new users (coaches or admins) to join one or multiple teams through a streamlined invitation system. The system generates one-time recovery links that can be shared through any communication channel (WhatsApp, Slack, etc.), eliminating the need for email validation. When invitees access the link, they set their password and are automatically assigned to the specified teams with the appropriate roles.

## Requirements

### Requirement 1

**User Story:** As a SUPER_ADMIN, I want to invite users to join teams with specific roles, so that I can efficiently onboard coaches and admins without requiring email validation.

#### Acceptance Criteria

1. WHEN a SUPER_ADMIN accesses the invitation interface THEN the system SHALL display a form with fields for email, display name, role selection, team selection, and optional redirect URL
2. WHEN a SUPER_ADMIN submits an invitation THEN the system SHALL validate that at least one team is selected and the email format is correct
3. WHEN an invitation is created THEN the system SHALL generate a one-time recovery link and display it for copying
4. WHEN a SUPER_ADMIN creates an invitation for an existing user THEN the system SHALL be idempotent and regenerate the link while updating the invitation record

### Requirement 2

**User Story:** As a SUPER_ADMIN, I want the system to automatically assign roles and team memberships when invitees complete registration, so that manual assignment is not required.

#### Acceptance Criteria

1. WHEN an invitee clicks the recovery link THEN the system SHALL redirect them to set their password
2. WHEN an invitee completes password setup THEN the system SHALL automatically create their profile with the specified role
3. WHEN profile creation occurs THEN the system SHALL automatically assign the user to all specified teams with the invitation role
4. WHEN the invitation process completes THEN the system SHALL mark the invitation as 'accepted' with a timestamp

### Requirement 3

**User Story:** As a SUPER_ADMIN, I want to track invitation status and maintain audit trails, so that I can monitor the invitation process and resend invitations if needed.

#### Acceptance Criteria

1. WHEN invitations are created THEN the system SHALL store them in a pending_invites table with status tracking
2. WHEN a SUPER_ADMIN views invitations THEN the system SHALL display pending, accepted, and canceled invitations
3. WHEN an invitation is used THEN the system SHALL update the status to 'accepted' and record the acceptance timestamp
4. WHEN a SUPER_ADMIN cancels an invitation THEN the system SHALL update the status to 'canceled'

### Requirement 4

**User Story:** As a system administrator, I want proper security controls on the invitation system, so that only authorized users can create invitations and access invitation data.

#### Acceptance Criteria

1. WHEN a user attempts to create invitations THEN the system SHALL verify they have SUPER_ADMIN role
2. WHEN a user attempts to view invitations THEN the system SHALL only show invitations they created or allow full access for SUPER_ADMIN
3. WHEN the invitation trigger executes THEN the system SHALL run with elevated privileges to modify user profiles and team assignments
4. WHEN invitation data is accessed THEN the system SHALL enforce row-level security policies

### Requirement 5

**User Story:** As a SUPER_ADMIN, I want to specify which teams users should join during invitation, so that they are automatically assigned to the correct teams upon registration.

#### Acceptance Criteria

1. WHEN creating an invitation THEN the system SHALL allow selection of multiple teams from available teams
2. WHEN displaying team options THEN the system SHALL show teams organized by sport and club for easy selection
3. WHEN an invitation specifies team assignments THEN the system SHALL validate that all team IDs exist and are accessible
4. WHEN the invitee registers THEN the system SHALL create user_team_roles entries for each specified team

### Requirement 6

**User Story:** As a SUPER_ADMIN, I want to assign appropriate roles (coach or admin) to invitees, so that they have the correct permissions when they join.

#### Acceptance Criteria

1. WHEN creating an invitation THEN the system SHALL allow selection of either 'coach' or 'admin' role
2. WHEN the invitation is processed THEN the system SHALL assign the specified role to the user's profile
3. WHEN creating team assignments THEN the system SHALL use the invitation role for all team memberships
4. WHEN role validation occurs THEN the system SHALL only allow 'coach' and 'admin' roles for invitations

### Requirement 7

**User Story:** As a system, I want to handle edge cases gracefully, so that the invitation process is robust and reliable.

#### Acceptance Criteria

1. WHEN an invitation is created for an existing user THEN the system SHALL update the existing invitation or create a new one
2. WHEN a user already has a team assignment THEN the system SHALL skip duplicate assignments without error
3. WHEN an invitation link expires THEN the system SHALL handle the error gracefully and allow regeneration
4. WHEN database operations fail THEN the system SHALL provide meaningful error messages and maintain data consistency
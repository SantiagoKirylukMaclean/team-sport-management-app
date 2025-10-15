/**
 * Type validation file
 * This file validates that all type definitions are correctly structured
 * and can be used without compilation errors
 */

import type {
  AppRole,
  Profile,
  Sport,
  Club,
  Team,
  ClubWithSport,
  TeamWithClub,
  AdminListItem,
  DatabaseError,
  PaginatedResponse,
  PendingInvite,
  InviteUserRequest,
  InviteUserResponse,
  InviteFormData,
  PendingInviteWithCreator
} from './db'

// Validate AppRole type accepts all expected values
const validRoles: AppRole[] = ['super_admin', 'admin', 'coach', 'player']

// Validate Profile interface
const sampleProfile: Profile = {
  id: 'uuid-string',
  email: 'user@example.com',
  display_name: 'John Doe',
  role: 'super_admin',
  created_at: '2024-01-01T00:00:00Z'
}

// Validate Sport interface
const sampleSport: Sport = {
  id: 'sport-uuid',
  name: 'Football',
  created_at: '2024-01-01T00:00:00Z'
}

// Validate Club interface
const sampleClub: Club = {
  id: 'club-uuid',
  name: 'Manchester United',
  sport_id: 'sport-uuid',
  created_at: '2024-01-01T00:00:00Z'
}

// Validate ClubWithSport interface
const sampleClubWithSport: ClubWithSport = {
  id: 'club-uuid',
  name: 'Manchester United',
  sport_id: 'sport-uuid',
  created_at: '2024-01-01T00:00:00Z',
  sports: {
    name: 'Football'
  }
}

// Validate Team interface
const sampleTeam: Team = {
  id: 'team-uuid',
  name: 'First Team',
  club_id: 'club-uuid',
  created_at: '2024-01-01T00:00:00Z'
}

// Validate TeamWithClub interface
const sampleTeamWithClub: TeamWithClub = {
  id: 'team-uuid',
  name: 'First Team',
  club_id: 'club-uuid',
  created_at: '2024-01-01T00:00:00Z',
  clubs: {
    name: 'Manchester United'
  }
}

// Validate AdminListItem interface
const sampleAdminListItem: AdminListItem = {
  id: 'item-uuid',
  name: 'Sample Item',
  created_at: '2024-01-01T00:00:00Z',
  relationshipName: 'Related Entity'
}

// Validate DatabaseError interface
const sampleError: DatabaseError = {
  message: 'Database connection failed',
  details: 'Connection timeout after 30 seconds',
  hint: 'Check your network connection',
  code: 'CONNECTION_TIMEOUT'
}

// Validate PaginatedResponse interface
const samplePaginatedResponse: PaginatedResponse<Sport> = {
  data: [sampleSport],
  count: 1,
  error: undefined
}

// Validate invitation system types
const samplePendingInvite: PendingInvite = {
  id: 1,
  email: 'coach@example.com',
  role: 'coach',
  team_ids: [1, 2, 3],
  status: 'pending',
  created_by: 'creator-uuid',
  created_at: '2024-01-01T00:00:00Z',
  accepted_at: undefined
}

const sampleInviteUserRequest: InviteUserRequest = {
  email: 'newcoach@example.com',
  display_name: 'New Coach',
  role: 'coach',
  teamIds: [1, 2],
  redirectTo: 'https://app.example.com/dashboard'
}

const sampleInviteUserResponse: InviteUserResponse = {
  ok: true,
  action_link: 'https://supabase.co/auth/v1/recover?token=abc123',
  error: undefined
}

const sampleInviteFormData: InviteFormData = {
  email: 'formuser@example.com',
  display_name: 'Form User',
  role: 'admin',
  teamIds: [1, 2, 3],
  redirectTo: 'https://app.example.com/welcome'
}

const samplePendingInviteWithCreator: PendingInviteWithCreator = {
  id: 1,
  email: 'invited@example.com',
  role: 'coach',
  team_ids: [1, 2],
  status: 'pending',
  created_by: 'creator-uuid',
  created_at: '2024-01-01T00:00:00Z',
  accepted_at: undefined,
  creator: {
    display_name: 'Super Admin',
    email: 'admin@example.com'
  }
}

// Export validation functions for use in other parts of the application
export const validateTypes = () => {
  return {
    validRoles,
    sampleProfile,
    sampleSport,
    sampleClub,
    sampleClubWithSport,
    sampleTeam,
    sampleTeamWithClub,
    sampleAdminListItem,
    sampleError,
    samplePaginatedResponse,
    samplePendingInvite,
    sampleInviteUserRequest,
    sampleInviteUserResponse,
    sampleInviteFormData,
    samplePendingInviteWithCreator
  }
}

// Type guards for runtime type checking
export const isValidAppRole = (role: string): role is AppRole => {
  return ['super_admin', 'admin', 'coach', 'player'].includes(role)
}

export const isProfile = (obj: any): obj is Profile => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    (obj.email === null || typeof obj.email === 'string') &&
    (obj.display_name === null || typeof obj.display_name === 'string') &&
    isValidAppRole(obj.role) &&
    typeof obj.created_at === 'string'
  )
}

export const isSport = (obj: any): obj is Sport => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.created_at === 'string'
  )
}

export const isClub = (obj: any): obj is Club => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.sport_id === 'string' &&
    typeof obj.created_at === 'string'
  )
}

export const isTeam = (obj: any): obj is Team => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.club_id === 'string' &&
    typeof obj.created_at === 'string'
  )
}

// Type guards for invitation system types
export const isValidInviteRole = (role: string): role is 'coach' | 'admin' => {
  return ['coach', 'admin'].includes(role)
}

export const isValidInviteStatus = (status: string): status is 'pending' | 'accepted' | 'canceled' => {
  return ['pending', 'accepted', 'canceled'].includes(status)
}

export const isPendingInvite = (obj: any): obj is PendingInvite => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.email === 'string' &&
    isValidInviteRole(obj.role) &&
    Array.isArray(obj.team_ids) &&
    obj.team_ids.every((id: any) => typeof id === 'number') &&
    isValidInviteStatus(obj.status) &&
    typeof obj.created_by === 'string' &&
    typeof obj.created_at === 'string' &&
    (obj.accepted_at === undefined || typeof obj.accepted_at === 'string')
  )
}

export const isInviteUserRequest = (obj: any): obj is InviteUserRequest => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.email === 'string' &&
    (obj.display_name === undefined || typeof obj.display_name === 'string') &&
    isValidInviteRole(obj.role) &&
    Array.isArray(obj.teamIds) &&
    obj.teamIds.every((id: any) => typeof id === 'number') &&
    (obj.redirectTo === undefined || typeof obj.redirectTo === 'string')
  )
}

export const isInviteUserResponse = (obj: any): obj is InviteUserResponse => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.ok === 'boolean' &&
    typeof obj.action_link === 'string' &&
    (obj.error === undefined || typeof obj.error === 'string')
  )
}

export const isInviteFormData = (obj: any): obj is InviteFormData => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.email === 'string' &&
    typeof obj.display_name === 'string' &&
    isValidInviteRole(obj.role) &&
    Array.isArray(obj.teamIds) &&
    obj.teamIds.every((id: any) => typeof id === 'number') &&
    typeof obj.redirectTo === 'string'
  )
}
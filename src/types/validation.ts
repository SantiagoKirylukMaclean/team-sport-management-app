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
  PaginatedResponse
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
    samplePaginatedResponse
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
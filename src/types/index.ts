/**
 * Central type exports for the application
 * This file provides a single entry point for importing types across the application
 */

// Database types
export type {
  AppRole,
  Profile,
  Sport,
  Club,
  Team,
  SportWithMetadata,
  ClubWithSport,
  TeamWithClub,
  DatabaseError,
  PaginatedResponse,
  AdminEntityType,
  AdminListItem,
  PendingInvite,
  InviteUserRequest,
  InviteUserResponse,
  InviteFormData,
  PendingInviteWithCreator
} from './db'

// Type validation functions and guards
export {
  validateTypes,
  isValidAppRole,
  isProfile,
  isSport,
  isClub,
  isTeam,
  isValidInviteRole,
  isValidInviteStatus,
  isPendingInvite,
  isInviteUserRequest,
  isInviteUserResponse,
  isInviteFormData
} from './validation'

// Re-export commonly used Supabase types for convenience
export type { User, Session } from '@supabase/supabase-js'
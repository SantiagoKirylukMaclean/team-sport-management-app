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
  AdminListItem
} from './db'

// Type validation functions and guards
export {
  validateTypes,
  isValidAppRole,
  isProfile,
  isSport,
  isClub,
  isTeam
} from './validation'

// Re-export commonly used Supabase types for convenience
export type { User, Session } from '@supabase/supabase-js'
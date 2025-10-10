/**
 * Database type definitions for the sports management application
 * These types correspond to the database schema and are used across admin components
 */

// Re-export the AppRole type from AuthContext for consistency
export type AppRole = 'super_admin' | 'admin' | 'coach' | 'player'

/**
 * Enhanced Profile interface that matches the profiles table schema
 */
export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  role: AppRole
  created_at: string
}

/**
 * Sport entity interface
 * Represents the sports table in the database
 */
export interface Sport {
  id: string
  name: string
  created_at: string
}

/**
 * Club entity interface
 * Represents the clubs table with optional sport relationship
 */
export interface Club {
  id: string
  name: string
  sport_id: string
  created_at: string
  // Optional nested sport data when using joins
  sports?: {
    name: string
  }
}

/**
 * Team entity interface
 * Represents the teams table with optional club relationship
 */
export interface Team {
  id: string
  name: string
  club_id: string
  created_at: string
  // Optional nested club data when using joins
  clubs?: {
    name: string
  }
}

/**
 * Database query result types for admin pages
 * These types represent the expected structure when fetching data with joins
 */

export interface SportWithMetadata extends Sport {
  // Future: could include counts of clubs, teams, etc.
}

export interface ClubWithSport extends Club {
  sports: {
    name: string
  }
}

export interface TeamWithClub extends Team {
  clubs: {
    name: string
  }
}

/**
 * Common database response patterns
 */
export interface DatabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count?: number
  error?: DatabaseError
}

/**
 * Admin page data fetching types
 */
export type AdminEntityType = 'sports' | 'clubs' | 'teams'

export interface AdminListItem {
  id: string
  name: string
  created_at: string
  relationshipName?: string // For displaying related entity names
}
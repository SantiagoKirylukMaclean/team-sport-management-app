# Type Definitions

This directory contains all TypeScript type definitions for the sports management application, specifically designed to support the admin role gating feature.

## Files

### `db.ts`
Contains all database-related type definitions:
- **AppRole**: Union type for user roles ('super_admin' | 'admin' | 'coach' | 'player')
- **Profile**: Enhanced interface matching the profiles table schema
- **Sport**: Interface for sports entities
- **Club**: Interface for clubs entities with optional sport relationship
- **Team**: Interface for teams entities with optional club relationship
- **DatabaseError**: Interface for handling database errors
- **PaginatedResponse**: Generic interface for paginated API responses

### `validation.ts`
Contains type validation functions and runtime type guards:
- **validateTypes()**: Function that validates all type definitions
- **isValidAppRole()**: Type guard for AppRole validation
- **isProfile()**, **isSport()**, **isClub()**, **isTeam()**: Runtime type guards

### `index.ts`
Central export point for all types, providing a single import location for the entire application.

## Usage

```typescript
// Import types from the central location
import type { AppRole, Profile, Sport, Club, Team } from '@/types'

// Import validation functions
import { isValidAppRole, isProfile } from '@/types'

// Use in components
const userRole: AppRole = 'super_admin'
const isAdmin = isValidAppRole(userRole)
```

## Integration

The types are integrated with the existing AuthContext to ensure consistency across the application. The AppRole type is now centrally defined and imported by the AuthContext instead of being defined locally.

## Requirements Compliance

These type definitions fulfill requirements 4.1 and 4.2 from the admin role gating specification:
- 4.1: Strict TypeScript union type for user roles
- 4.2: Proper error handling types for database operations
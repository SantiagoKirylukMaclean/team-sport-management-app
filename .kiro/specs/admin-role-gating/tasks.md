# Implementation Plan

- [x] 1. Create type definitions and database interfaces
  - Create TypeScript types for database entities (Sport, Club, Team) and enhanced Profile interface
  - Define proper type exports for use across admin components
  - _Requirements: 4.1, 4.2_

- [x] 2. Create AdminGuard route protection component
  - Implement AdminGuard component that checks user role and loading state
  - Add redirect logic for unauthorized users to home page
  - Include loading spinner while role is being determined
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 3. Create AdminLayout component for admin interface structure
  - Build AdminLayout component with sidebar navigation for Sports, Clubs, Teams
  - Implement responsive design consistent with existing AppShell
  - Add proper routing outlet for nested admin pages
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 4. Implement SportsPage with data fetching and error handling
  - Create SportsPage component that fetches and displays sports data
  - Implement proper loading states and error handling with user-friendly messages
  - Add pagination support (limit 25 items) and empty state handling
  - _Requirements: 1.3, 3.2, 3.3, 3.4, 5.5_

- [x] 5. Implement ClubsPage with sport relationship data
  - Create ClubsPage component that fetches clubs with sport name joins
  - Handle join query failures with fallback to separate queries and manual mapping
  - Implement consistent loading, error, and empty states
  - _Requirements: 1.4, 3.2, 3.3, 4.5_

- [x] 6. Implement TeamsPage with club relationship data
  - Create TeamsPage component that fetches teams with club name joins
  - Handle relationship data fetching with proper error handling and fallbacks
  - Maintain consistent UI patterns with other admin pages
  - _Requirements: 1.5, 3.2, 3.3, 4.5_

- [x] 7. Update existing Sidebar component for role-based admin menu visibility
  - Modify Sidebar component to conditionally show Admin section based on user role
  - Update admin navigation items to point to new admin routes (sports, clubs, teams)
  - Ensure admin menu is hidden for non-super_admin users
  - _Requirements: 1.1, 2.1, 5.4_

- [x] 8. Configure admin routes with proper nesting and protection
  - Add admin routes to main routing configuration with nested structure
  - Wrap admin routes with AdminGuard for protection
  - Set up proper route redirects and default admin page routing
  - _Requirements: 6.4, 1.1, 1.2_

- [x] 9. Add comprehensive error handling and loading states
  - All admin components already implement consistent error handling using ErrorDisplay component
  - Loading indicators are properly implemented using PageLoading and LoadingSpinner components
  - User-friendly error messages with retry options are implemented across all admin pages
  - _Requirements: 3.3, 3.4, 4.3_

- [x] 10. Set up testing framework and dependencies
  - Install testing framework (Vitest) and React testing utilities
  - Configure test environment and setup files
  - Add test scripts to package.json
  - _Requirements: 2.2, 6.1, 6.2_

- [x] 11. Create unit tests for AdminGuard component
  - Write tests for AdminGuard with different role scenarios (super_admin, admin, coach, player, null)
  - Test loading states and error handling in AdminGuard
  - Test redirect behavior for unauthorized users
  - _Requirements: 2.2, 6.1, 6.2_

- [x] 12. Create unit tests for admin pages
  - Write tests for SportsPage data fetching and error handling
  - Write tests for ClubsPage with join fallback logic
  - Write tests for TeamsPage with relationship data handling
  - Test loading states, error states, and empty states for all admin pages
  - _Requirements: 1.3, 1.4, 1.5, 3.2, 3.3, 3.4_

- [x] 13. Create integration tests for role-based navigation
  - Test Sidebar component admin menu visibility based on user roles
  - Test admin route navigation and protection
  - Verify proper session management and role persistence across navigation
  - _Requirements: 1.1, 2.1, 5.4, 6.4_

- [x] 14. Create end-to-end tests for complete admin workflow
  - Test complete admin workflow from login to data display
  - Test unauthorized access attempts and proper redirections
  - Verify data fetching, error handling, and UI state management in realistic scenarios
  - _Requirements: 1.6, 3.1, 3.5, 2.2_
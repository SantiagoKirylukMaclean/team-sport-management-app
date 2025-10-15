# Implementation Plan

- [x] 1. Create database migration for invitation system
  - Create `supabase/migrations/006_invites_and_trigger.sql` with pending_invites table, RLS policies, trigger function, and trigger
  - Include all constraints, indexes, and security policies as specified in design
  - Test migration applies cleanly and creates all required database objects
  - _Requirements: 2.2, 2.3, 4.1, 4.2, 4.3_

- [x] 2. Implement Edge Function for invitation creation
  - Create `supabase/functions/invite-user/index.ts` with Deno runtime
  - Implement JWT validation and SUPER_ADMIN role verification
  - Add user creation/lookup logic using Supabase admin client
  - Implement recovery link generation with custom redirect handling
  - Add pending_invites table upsert logic with proper error handling
  - _Requirements: 1.1, 1.3, 1.4, 4.1, 7.1, 7.4_

- [x] 3. Create invitation service layer
  - Create `src/services/invites.ts` with TypeScript interfaces for invitation data
  - Implement `createInvitation` function that calls the Edge Function
  - Add `listInvitations` function for fetching invitation history
  - Include proper error handling and type safety
  - _Requirements: 1.3, 3.1, 3.2_

- [x] 4. Implement invitation form component
  - Create `src/pages/admin/InviteUserPage.tsx` with form validation using zod
  - Implement email, display_name, role selection, and team multi-select inputs
  - Add form submission logic with loading states and error handling
  - Include redirect URL input with optional validation
  - _Requirements: 1.1, 1.2, 5.1, 5.2, 6.1, 6.2_

- [x] 5. Create team selection component
  - Implement `TeamMultiSelect` component with hierarchical team display (Sport > Club > Team)
  - Add search/filter functionality for easy team discovery
  - Include validation to ensure at least one team is selected
  - Integrate with existing `services/teams.ts` for data fetching
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 6. Implement invitation result display
  - Create `InvitationResult` component to display generated action_link
  - Add copy-to-clipboard functionality with user feedback
  - Include success messaging and instructions for sharing the link
  - Add error display for failed invitation creation
  - _Requirements: 1.3, 1.4_

- [x] 7. Add invitation management interface
  - Create invitation list component to display pending/accepted/canceled invitations
  - Implement status filtering and search functionality
  - Add invitation cancellation capability for pending invitations
  - Include audit trail display with creation and acceptance timestamps
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 8. Integrate invitation page with admin routing
  - Add invitation route to admin routing configuration
  - Implement AdminGuard protection for invitation pages
  - Add navigation menu item for invitation management
  - Ensure proper breadcrumb and page title handling
  - _Requirements: 4.1, 4.2_

- [x] 9. Add database types for invitation system
  - Extend `src/types/db.ts` with PendingInvite interface
  - Add InviteUserRequest and InviteUserResponse types
  - Include form data types and validation schemas
  - Update existing types if needed for integration
  - _Requirements: 1.1, 1.3, 3.1_

- [x] 10. Write unit tests for invitation service
  - Create tests for `services/invites.ts` functions
  - Mock Edge Function responses and test error handling
  - Test invitation data transformation and validation
  - Include edge cases like network failures and invalid responses
  - _Requirements: 7.4_

- [x] 11. Write component tests for invitation forms
  - Create tests for `InviteUserPage` form validation and submission
  - Test `TeamMultiSelect` component behavior and team selection
  - Test `InvitationResult` component display and copy functionality
  - Include accessibility testing for form components
  - _Requirements: 1.1, 1.2, 5.1, 6.1_

- [x] 12. Write integration tests for invitation workflow
  - Create end-to-end test for complete invitation creation flow
  - Test database trigger execution when users complete registration
  - Verify proper role assignment and team membership creation
  - Test invitation status updates and audit trail functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.3_

- [x] 13. Add error handling and user feedback
  - Implement comprehensive error handling in all components
  - Add toast notifications for success and error states
  - Include loading spinners and disabled states during API calls
  - Add form validation feedback with clear error messages
  - _Requirements: 7.4_

- [x] 14. Test invitation system security
  - Verify RLS policies prevent unauthorized access to invitation data
  - Test Edge Function authentication and role verification
  - Validate that only SUPER_ADMIN users can create invitations
  - Test trigger security and proper privilege escalation
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 15. Create documentation and usage examples
  - Document invitation workflow in README or user guide
  - Create code examples for extending invitation functionality
  - Document database schema changes and migration process
  - Include troubleshooting guide for common issues
  - _Requirements: 3.1, 3.2_
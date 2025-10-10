# Testing Setup

This directory contains the testing configuration and utilities for the application.

## Files

- `setup.ts` - Global test setup file that configures jest-dom and mocks browser APIs
- `utils.tsx` - Custom render function and testing utilities including mock users and providers

## Available Scripts

- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Run tests with coverage report

## Testing Framework

- **Vitest** - Fast unit test framework
- **React Testing Library** - Testing utilities for React components
- **jsdom** - DOM environment for testing
- **@testing-library/jest-dom** - Custom matchers for DOM testing

## Usage

Import the custom render function and utilities:

```typescript
import { render, screen, mockUsers } from '@/test/utils'

// Use custom render that includes providers
render(<MyComponent />)

// Use mock users for role-based testing
const superAdmin = mockUsers.superAdmin
```

## Mock Users

The following mock users are available for testing role-based functionality:

- `mockUsers.superAdmin` - User with 'super_admin' role
- `mockUsers.admin` - User with 'admin' role  
- `mockUsers.coach` - User with 'coach' role
- `mockUsers.player` - User with 'player' role
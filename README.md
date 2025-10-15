# Sports Team Management Application

A comprehensive sports team management application built with React, TypeScript, and Supabase.

## Features

- **User Authentication & Authorization**: Role-based access control with SUPER_ADMIN, admin, and coach roles
- **Team Management**: Create and manage sports teams, clubs, and organizations
- **User Invitation System**: Streamlined invitation process for onboarding new coaches and admins
- **Role-Based Navigation**: Dynamic UI based on user permissions
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS

## User Invitation System

This application includes a comprehensive user invitation system that allows SUPER_ADMIN users to invite new coaches and admins to join teams. The system generates one-time recovery links that can be shared through any communication channel.

### Documentation

- **[User Invitation System Overview](docs/USER_INVITATION_SYSTEM.md)** - Complete system documentation
- **[Code Examples](docs/INVITATION_CODE_EXAMPLES.md)** - Practical implementation examples
- **[Migration Guide](docs/INVITATION_MIGRATION_GUIDE.md)** - Step-by-step implementation instructions
- **[Troubleshooting Guide](docs/INVITATION_TROUBLESHOOTING.md)** - Common issues and solutions

### Key Features

- **One-time invitation links** - No email validation required
- **Automatic role assignment** - Users are automatically assigned to teams with correct roles
- **Bulk invitations** - Support for inviting multiple users at once
- **Invitation tracking** - Monitor invitation status and acceptance rates
- **Security controls** - Role-based access with comprehensive RLS policies

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Edge Functions, Authentication)
- **Styling**: Tailwind CSS, shadcn/ui components
- **Testing**: Vitest, React Testing Library
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase CLI
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sports-team-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   ```bash
   # Initialize Supabase (if not already done)
   supabase init
   
   # Start local development
   supabase start
   
   # Apply database migrations
   supabase db reset
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Database Setup

The application uses Supabase with PostgreSQL. Key database components include:

- **Authentication**: Managed by Supabase Auth
- **Profiles**: User profile data with role-based access
- **Teams/Clubs/Sports**: Organizational structure
- **Invitations**: Pending user invitations with automatic processing

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test files
npm test -- invitation

# Generate coverage report
npm run test:coverage
```

### Deployment

1. **Deploy to Supabase**
   ```bash
   # Link to your Supabase project
   supabase link --project-ref your-project-ref
   
   # Deploy database migrations
   supabase db push
   
   # Deploy Edge Functions
   supabase functions deploy
   ```

2. **Deploy Frontend**
   ```bash
   # Build for production
   npm run build
   
   # Deploy to your preferred platform (Vercel, Netlify, etc.)
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── layout/         # Layout components
│   └── RouteGuards/    # Authentication guards
├── pages/              # Page components
│   ├── admin/          # Admin-only pages
│   └── auth/           # Authentication pages
├── services/           # API service layers
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── types/              # TypeScript type definitions
└── __tests__/          # Test files

supabase/
├── migrations/         # Database migrations
├── functions/          # Edge Functions
└── config.toml         # Supabase configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure all tests pass before submitting PR
- Update documentation for new features

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

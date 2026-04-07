# Agent Guidelines

## Build, Lint & Test Commands

### Core Commands

- **dev**: `npm run dev` - Start Electron development server
- **dev:web**: `npm run dev:web` - Start web development server (Vite)
- **build**: `npm run build` - Typecheck + build for Electron
- **build:web**: `npm run build:web` - Build for web deployment

### Linting & Type Checking

- **lint**: `npm run lint` - Run ESLint with cache
- **typecheck**: `npm run typecheck` - Run TypeScript checks (node + web)
- **typecheck:node**: `npm run typecheck:node` - Check Electron/main code
- **typecheck:web**: `npm run typecheck:web` - Check renderer code
- **format**: `npm run format` - Format code with Prettier

### Testing

- **test**: `npm run test` - Run all tests with Vitest (single run)
- **test:watch**: `npx vitest` - Run tests in watch mode
- **test:ui**: `npx vitest --ui` - Run tests with Vitest UI
- **test:e2e**: `npm run test:e2e` - Open Cypress for E2E tests

### Testing Single Files/Tests

- Run specific test file: `npx vitest run src/renderer/src/utils/__tests__/dates.test.ts`
- Run specific test by name: `npx vitest run -t "parses year, month, day"`
- Run in watch mode: `npx vitest src/renderer/src/utils/__tests__/dates.test.ts`

### Other Commands

- **cap:sync**: `npm run cap:sync` - Sync web build to Capacitor
- **cap:open:ios**: `npm run cap:open:ios` - Open iOS in Xcode
- **cap:open:android**: `npm run cap:open:android` - Open Android in Studio
- **db:schema**: `npm run db:schema` - Generate Supabase TypeScript types

## Code Style Guidelines

### Imports

- Use absolute imports with `@renderer` alias for renderer code
- Group imports: Node/built-in first, then external packages, then internal imports
- Use named imports when possible; prefer default imports for single exports
- No trailing commas in import lists

### Formatting (Prettier)

- Single quotes (`'`)
- No semicolons
- Print width: 100 characters
- No trailing commas
- Functions use parenthesized call style

### TypeScript

- Strict mode enabled; avoid `any`
- Use `interface` for public APIs and object shapes
- Use `type` for unions, intersections, and primitives
- Explicit return types on exported functions
- Prefer `const` over `let`; avoid `var`
- Use `readonly` for immutable properties

### Naming Conventions

- **Files**: PascalCase for components (`Button.tsx`), camelCase for utilities (`dates.ts`)
- **Components**: PascalCase (`CalendarDay`, `SettingsPage`)
- **Functions/Variables**: camelCase (`addMonths`, `isSameDay`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ITEMS`, `API_BASE_URL`)
- **Interfaces/Types**: PascalCase with clear prefixes (`Props`, `State`, `ApiError`)
- **Private members**: Prefix with underscore (`_cache`, `_render()`)

### React/tsx

- Functional components with hooks only
- Destructure props in function signature with defaults
- Component names match filename (PascalCase)
- Use React state management (Zustand for global state)
- Keep components small and focused

### Error Handling

- Use try/catch for async operations
- Validate inputs at function boundaries
- Use TypeScript for compile-time safety
- Return early on invalid state (guard clauses)
- Log errors with context; avoid silent failures

### Testing (Vitest)

- Tests in `__tests__/` subdirectory or `.test.ts` suffix
- Use `describe()` for test suites, `it()` or `test()` for individual cases
- Arrange-Act-Assert pattern
- Mock external dependencies
- Test edge cases and error conditions

### Project Structure

- `src/main/` - Electron main process
- `src/preload/` - Electron preload scripts
- `src/renderer/` - React renderer code
- `src/renderer/src/components/` - React components
- `src/renderer/src/utils/` - Utility functions
- `src/renderer/src/types/` - TypeScript type definitions
- `src/renderer/src/platform/` - Platform-specific abstractions

### Key Technologies

- **Electron** with **electron-vite** for desktop
- **React 19** with TypeScript
- **Zustand** for state management
- **Temporal API** (`@js-temporal/polyfill`) for date handling
- **Tailwind CSS** v4 for styling
- **Vitest** for unit testing
- **Cypress** for E2E testing

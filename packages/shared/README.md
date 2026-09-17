# @migo/shared

Shared types, validation schemas, constants, DTOs, and utilities for the MIGO Event Discovery Platform.

This package provides a single source of truth for all shared code between the backend API and mobile app, ensuring type safety and consistency across the entire platform.

## 📦 Installation

This package is part of the MIGO monorepo and is automatically linked via npm workspaces.

```bash
# From root of monorepo
npm install

# Build the shared package
npm run build:shared
```

## 📚 Package Contents

### 1. **Schemas** (`/schemas`)
Zod validation schemas for request/response validation.

- `auth.schema.ts` - Authentication schemas (register, login, password reset, etc.)
- `event.schema.ts` - Event schemas (create, update, query, search)
- `user.schema.ts` - User profile schemas (update profile, location, preferences)
- `booking.schema.ts` - Booking schemas (create, update, cancel)
- `review.schema.ts` - Review schemas (create, update)

### 2. **Types** (`/types`)
TypeScript interfaces and type definitions.

- `common.types.ts` - Common types (pagination, coordinates, file uploads, etc.)
- `event.types.ts` - Event-related types
- `user.types.ts` - User-related types
- `auth.types.ts` - Authentication types (tokens, credentials, etc.)
- `booking.types.ts` - Booking-related types
- `api.types.ts` - API request/response types (chat, health check, etc.)

### 3. **Constants** (`/constants`)
Shared constants and enums.

- `validation.constants.ts` - Validation rules (min/max lengths, regex patterns)
- `events.constants.ts` - Event categories, booking types, location types
- `api.constants.ts` - HTTP status codes, pagination defaults, currencies
- `errors.constants.ts` - Error codes and error messages

### 4. **DTOs** (`/dto`)
Data Transfer Objects with helper functions.

- `api-response.dto.ts` - Standardized API responses with helper functions

### 5. **Utils** (`/utils`)
Shared utility functions (placeholder for future utilities).

## 🚀 Usage Examples

### Using Schemas for Validation

```typescript
// Backend example: Validating request body
import { registerSchema, loginSchema } from '@migo/shared';

const result = registerSchema.safeParse({
  email: 'user@example.com',
  password: 'SecurePass123',
  name: 'John Doe',
  acceptTerms: true,
});

if (result.success) {
  // Valid data - result.data is typed!
  const { email, password, name } = result.data;
} else {
  // Validation failed
  console.error(result.error.errors);
}
```

```typescript
// Mobile example: Form validation
import { loginSchema, LoginInput } from '@migo/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const { control, handleSubmit } = useForm<LoginInput>({
  resolver: zodResolver(loginSchema),
});
```

### Using Types

```typescript
// Backend example
import { Event, User, ApiResponse } from '@migo/shared';

async function getEvent(id: string): Promise<ApiResponse<Event>> {
  const event = await prisma.event.findUnique({ where: { id } });
  return createSuccessResponse(event, 'Event retrieved successfully');
}
```

```typescript
// Mobile example
import { Event, EventFilters } from '@migo/shared';

interface EventListProps {
  events: Event[];
  filters: EventFilters;
  onFilterChange: (filters: EventFilters) => void;
}
```

### Using Constants

```typescript
import {
  HTTP_STATUS,
  ErrorCode,
  EVENT_CATEGORIES,
  DEFAULT_LIMIT,
  PASSWORD_MIN_LENGTH,
} from '@migo/shared';

// HTTP status codes
res.status(HTTP_STATUS.NOT_FOUND).json({ ... });

// Error codes
throw new ApiError(ErrorCode.UNAUTHORIZED, 'Invalid token');

// Event categories
const categories = EVENT_CATEGORIES; // ['MUSIC', 'SPORTS', 'ARTS', ...]

// Pagination
const limit = query.limit || DEFAULT_LIMIT; // 20

// Validation
if (password.length < PASSWORD_MIN_LENGTH) {
  throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
}
```

### Using DTOs and Helper Functions

```typescript
// Backend example: Creating responses
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  createNotFoundResponse,
  createValidationErrorResponse,
  ErrorCode,
} from '@migo/shared';

// Success response
router.get('/events/:id', async (req, res) => {
  const event = await findEvent(req.params.id);
  if (!event) {
    return res.status(404).json(createNotFoundResponse('Event', req.params.id));
  }
  return res.json(createSuccessResponse(event, 'Event found'));
});

// Paginated response
router.get('/events', async (req, res) => {
  const { data, total } = await getEvents(req.query);
  const response = createPaginatedResponse(data, total, page, limit);
  return res.json(response);
});

// Error response
router.post('/events', async (req, res) => {
  try {
    const event = await createEvent(req.body);
    return res.status(201).json(createSuccessResponse(event, 'Event created', 201));
  } catch (error) {
    return res.status(500).json(
      createErrorResponse(ErrorCode.DATABASE_ERROR, 'Failed to create event', 500)
    );
  }
});

// Validation error
const result = schema.safeParse(req.body);
if (!result.success) {
  const errors = result.error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));
  return res.status(400).json(createValidationErrorResponse(errors));
}
```

```typescript
// Mobile example: Handling API responses
import { ApiResponse, isSuccessResponse, isErrorResponse } from '@migo/shared';

async function fetchEvent(id: string) {
  const response: ApiResponse<Event> = await api.get(`/events/${id}`);

  if (isSuccessResponse(response)) {
    // TypeScript knows response.data is Event
    setEvent(response.data);
  } else if (isErrorResponse(response)) {
    // TypeScript knows response.error exists
    showError(response.error.message);
  }
}
```

### Using Error Codes

```typescript
import { ErrorCode, ERROR_MESSAGES } from '@migo/shared';

// Backend: Throwing errors with codes
if (!user) {
  throw new ApiError(
    ErrorCode.USER_NOT_FOUND,
    ERROR_MESSAGES[ErrorCode.USER_NOT_FOUND]
  );
}

// Mobile: Handling specific error codes
try {
  await loginUser(credentials);
} catch (error) {
  if (error.code === ErrorCode.INVALID_CREDENTIALS) {
    setError('Invalid email or password');
  } else if (error.code === ErrorCode.EMAIL_NOT_VERIFIED) {
    navigate('/verify-email');
  } else {
    setError('An unexpected error occurred');
  }
}
```

## 🏗️ Architecture

### Import Path Structure

All exports are available from the root:

```typescript
import {
  // Schemas
  registerSchema,
  loginSchema,
  createEventSchema,

  // Types
  Event,
  User,
  ApiResponse,

  // Constants
  HTTP_STATUS,
  ErrorCode,
  EVENT_CATEGORIES,

  // DTOs & Helpers
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
} from '@migo/shared';
```

Or import from specific modules:

```typescript
import { registerSchema, loginSchema } from '@migo/shared/schemas';
import { Event, User } from '@migo/shared/types';
import { HTTP_STATUS, ErrorCode } from '@migo/shared/constants';
import { createSuccessResponse } from '@migo/shared/dto';
```

## 📝 Development

### Building the Package

```bash
# From root
npm run build:shared

# From packages/shared
npm run build
```

### Watching for Changes

```bash
# From packages/shared
npm run dev
```

### Type Checking

```bash
# From packages/shared
npm run type-check
```

## 🔄 Migration Notes

This package was created by extracting and consolidating:

- Backend validation schemas from `apps/backend/src/api/*/validation.ts`
- Backend types from `apps/backend/src/api/types/`
- Mobile types from `apps/mobile/src/types/`
- Backend response utilities from `apps/backend/src/utils/response.ts`
- Scattered constants from both apps

## 📌 Best Practices

### 1. **Always use shared schemas for validation**
   - Don't duplicate validation logic
   - Use Zod schemas on both backend and mobile

### 2. **Use TypeScript types for all data structures**
   - Import types from `@migo/shared`
   - Don't create duplicate interfaces

### 3. **Use constants instead of magic strings/numbers**
   - Import error codes, HTTP status codes, etc.
   - Makes code more maintainable

### 4. **Use helper functions for API responses**
   - Consistent response format across all endpoints
   - Easier error handling on the frontend

### 5. **Keep the shared package dependency-free**
   - Only use `zod` as a dependency
   - Don't add Express, React Native, or other framework-specific code

## 🐛 Troubleshooting

### Build errors after adding new exports

```bash
# Clean and rebuild
npm run clean --workspace=@migo/shared
npm run build:shared
```

### TypeScript can't find @migo/shared

```bash
# Reinstall dependencies
npm install

# Ensure packages/shared is built
npm run build:shared
```

### Changes not reflecting in apps

```bash
# Rebuild shared package
npm run build:shared

# Restart your dev servers
npm run dev:backend
npm run dev:mobile
```

## 📄 License

ISC - MIGO TEAM

---

**Version:** 1.0.0
**Last Updated:** 2026-02-10

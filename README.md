# Freedom Admin ERP

[![Bun](https://img.shields.io/badge/Bun-000000?style=flat&logo=bun&logoColor=white)](https://bun.sh)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)

Full-stack web application template built with modern technologies. Features a complete authentication system, role-based access control (RBAC), audit logging, PWA capabilities, and multi-language support (Lao).

## ✨ Features

### 🏗️ Architecture
- **Modular Monolith**: Feature-based modules combining frontend/backend
- **Frontend**: React 19 + TanStack Router + TanStack Query
- **Backend**: Hono framework + Drizzle ORM + PostgreSQL
- **Authentication**: Better Auth with JWT sessions
- **Authorization**: RBAC with granular permissions
- **Audit**: Comprehensive activity logging
- **PWA**: Offline support with service worker

### 🎯 Core Technologies
- **Runtime**: [Bun](https://bun.sh) - Fast JavaScript runtime
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Routing**: TanStack Router (code-based, lazy loading, view transitions)
- **State**: TanStack Query for server state management
- **Backend**: Hono - Fast web framework
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth - Complete auth solution
- **Linting**: Biome - Fast linter & formatter
- **Build**: Bun's native bundler with optimizations

### 🌐 PWA & UX
- **Progressive Web App** - Installable on mobile/desktop
- **Offline Support** - Cache-first strategy
- **Smooth Transitions** - Native view transitions API
- **Multi-language** - Lao language support with Noto fonts
- **Responsive Design** - Mobile-first approach

### 🔐 Security & Compliance
- **Type Safety** - End-to-end TypeScript
- **RBAC** - Role-based access control
- **Audit Logging** - Track all user activities
- **Input Validation** - Zod schemas throughout
- **CSRF Protection** - Built-in auth security

### 📦 Business Modules
- **Authentication** - User registration, login, session management
- **User Management** - CRUD operations, user profiles, banning/unbanning
- **RBAC System** - Roles, permissions, and user-role assignments
- **Audit Logging** - Activity tracking and compliance reporting
- **Dashboard** - Analytics and system overview

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/docs/installation) (latest version)
- [PostgreSQL](https://www.postgresql.org/download/) (v14+)
- Node.js 18+ (for some dev tools)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd freedom-admin-erp
   bun install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and other configs
   ```

3. **Database setup**
   ```bash
   # Push schema to database
   bun run db:push

   # Run migrations
   bun run db:migrate

   # Optional: Open Drizzle Studio
   bun run db:studio
   ```

4. **Seed initial data**
   ```bash
   # Create admin user
   bun run src/server/scripts/seed-admin.ts

   # Sync RBAC permissions
   bun run rbac:sync
   ```

5. **Start development server**
   ```bash
   bun dev
   ```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
src/
├── modules/               # Feature modules (Domain + Presentation)
│   ├── auth/              # Authentication module
│   │   ├── api/           # API routes
│   │   ├── domain/        # Business logic & contracts
│   │   │   ├── contracts/ # Zod schemas & types
│   │   │   ├── repo/      # Data access layer
│   │   │   ├── services/  # Business services
│   │   │   └── types.ts   # Module types
│   │   └── presentation/  # UI layer
│   │       ├── api/       # API clients & queries
│   │       ├── pages/     # React pages
│   │       └── ui/        # UI components
│   ├── users/             # User management module
│   ├── roles/             # RBAC module (permissions & roles)
│   ├── audit/             # Audit logging module
│   └── dashboard/         # Dashboard module
├── platform/              # Infrastructure layer
│   ├── database/          # Database layer (Drizzle schemas)
│   ├── http/              # HTTP middleware & server
│   └── observability/     # Logging & monitoring
├── app/                   # Application shell
│   ├── layout/            # Layout components
│   ├── providers/         # Context providers
│   └── router.tsx         # Router configuration
├── shared/                # Shared utilities
│   ├── contracts/         # Shared contracts (pagination, filtering)
│   ├── ui/                # Shared UI components
│   ├── lib/               # Shared utilities
│   ├── hooks/             # Custom hooks
│   ├── types.ts           # Global types
│   └── events/            # Event system
├── server/                # Server entry points
│   ├── api/               # API route registration
│   ├── main.ts            # Server startup
│   └── scripts/           # Utility scripts
├── assets/                # Static assets
│   └── Noto_Sans_Lao_Looped/  # Lao fonts
├── service-worker.ts      # PWA service worker
├── manifest.webmanifest   # PWA manifest
├── frontend.tsx           # React entry point
└── index.html             # HTML template
```

## 🛠️ Development

### Available Scripts

```bash
# Development
bun dev                    # Start dev server with hot reload
bun run lint              # Lint code with Biome
bun run format            # Format code with Biome

# Database
bun run db:push           # Push schema to database
bun run db:migrate        # Run migrations
bun run db:studio         # Open Drizzle Studio
bun run db:generate       # Generate migrations
bun run db:pull           # Pull schema from database

# Build & Deploy
bun run build.ts          # Build for production
bun start                 # Start production server
bun run compile           # Compile server for deployment

# Utilities
bun run rbac:sync         # Sync RBAC permissions from code
bun run test:reports      # Reports & Analytics acceptance (Phase 5)
```

### Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# CORS
CORS_ORIGIN=http://localhost:3000

# App
NODE_ENV=development
PORT=3000
```

## 🔌 API Reference

All API endpoints are organized by modules and accessible under `/api/` prefix. Each module handles its own routes and business logic.

### Authentication Module (`/api/auth/*`)
- `POST /api/auth/sign-in` - User sign in
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/session` - Get current session

### Users Module (`/api/users/*`, `/api/me/*`)
- `GET /api/users` - List users (admin only)
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/ban` - Ban user
- `POST /api/users/:id/unban` - Unban user
- `GET /api/me` - Get current user profile
- `PUT /api/me` - Update profile

### Roles Module (`/api/rbac/*`)
- `GET /api/rbac/roles` - List roles
- `POST /api/rbac/roles` - Create role
- `PATCH /api/rbac/roles/:id` - Update role
- `DELETE /api/rbac/roles/:id` - Delete role
- `GET /api/rbac/my-permissions` - Get current user permissions

### Audit Module (`/api/audit/*`)
- `GET /api/audit` - List audit logs
- `GET /api/audit/:id` - Get audit log details

### Health Check
- `GET /api/health` - System health status

## 🏗️ Architecture Patterns

### 🏛️ Modular Monolith Architecture
This project uses a **Modular Monolith** approach where each business domain is encapsulated in its own module, combining both backend and frontend code.

#### Module Structure (per feature)
```
modules/[feature]/
├── api/              # HTTP API routes (backend)
├── domain/           # Business logic (backend)
│   ├── contracts/    # Zod schemas & types
│   ├── repo/         # Data access layer
│   └── services/     # Business services
└── presentation/     # UI layer (frontend)
    ├── api/          # API clients & React Query
    ├── pages/        # React pages
    └── ui/           # UI components
```

#### Layer Separation
- **Domain Layer**: Pure business logic, contracts, and data access
- **API Layer**: HTTP routes and external API integration
- **Presentation Layer**: UI components and user interactions
- **Infrastructure Layer**: Database, HTTP server, logging (shared)

#### Key Benefits
- **Modularity**: Each feature is self-contained
- **Type Safety**: End-to-end TypeScript with Zod validation
- **Separation of Concerns**: Clear boundaries between layers
- **Maintainability**: Easy to modify individual features
- **Scalability**: Can be extracted into microservices later

### Database Schema
- **Users**: User accounts & profiles
- **Sessions**: Authentication sessions
- **Accounts**: OAuth provider accounts
- **Roles**: RBAC roles with permissions
- **Permissions**: Granular permission definitions
- **UserRoles**: User-role assignments
- **AuditLogs**: Comprehensive activity logging

## 🔒 Security Features

### Authentication
- JWT-based sessions with refresh tokens
- Password hashing with bcrypt
- Email verification support
- Session management with IP/user-agent tracking

### Authorization
- Role-Based Access Control (RBAC)
- Granular permissions system
- Permission inheritance
- Route-level protection

### Audit & Compliance
- Comprehensive audit logging
- User activity tracking
- Security event monitoring
- GDPR-compliant data handling

## 🌐 PWA Features

### Service Worker
- Cache-first strategy for static assets
- Network-first for API calls
- Offline fallback pages
- Background sync capabilities

### Web App Manifest
- Installable on desktop/mobile
- Custom icons & splash screens
- Full-screen standalone mode
- Theme color integration

## 🚢 Deployment

### Docker Deployment
```dockerfile
FROM oven/bun:latest

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production

COPY . .
RUN bun run build.ts

EXPOSE 3000
CMD ["bun", "start"]
```

### Production Build
```bash
# Build frontend & server
bun run build.ts

# Compile server for better performance
bun run compile

# Start production server
NODE_ENV=production bun index.ts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

### Code Quality
- Run `bun run lint` before committing
- Run `bun run format` to format code
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Development & Extensibility

### Adding New Modules
1. Create new module folder: `src/modules/[new-feature]/`
2. Implement the 4-layer structure:
   - `domain/` - Business logic and contracts
   - `api/` - HTTP routes
   - `presentation/` - UI components
   - `infrastructure/` - Module-specific infrastructure
3. Register API routes in `src/server/api/rest/index.ts`
4. Add routing in `src/app/router.tsx`

### Module Independence
Each module is self-contained with its own:
- Zod schemas and types
- Business logic
- API endpoints
- UI components
- Tests (when added)

This architecture allows for easy:
- **Feature development** - Work on one module at a time
- **Team collaboration** - Multiple teams can work on different modules
- **Microservices migration** - Modules can be extracted as separate services
- **Code maintainability** - Clear boundaries and responsibilities

## 🙏 Acknowledgments

- [Bun](https://bun.sh) - Fast JavaScript runtime
- [React](https://reactjs.org) - UI library
- [TanStack](https://tanstack.com) - Query & Router
- [Hono](https://hono.dev) - Web framework
- [Drizzle](https://drizzle.team) - ORM
- [Better Auth](https://better-auth.com) - Authentication
- [Biome](https://biomejs.dev) - Linter & formatter
- [Radix UI](https://www.radix-ui.com) - UI component primitives
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework

---

Built with ❤️ using modern web technologies and modular architecture principles
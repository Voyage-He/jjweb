# Development Environment Setup

This guide will help you set up your development environment for contributing to Jujutsu GUI.

## System Requirements

| Requirement | Minimum Version | Recommended |
|-------------|-----------------|-------------|
| Node.js | 18.0.0 | 20.x LTS |
| npm | 9.0.0 | 10.x |
| jj (Jujutsu) | 0.15.0 | Latest |
| Git | 2.30.0 | Latest |

### Operating Systems

- **macOS**: 12 (Monterey) or later
- **Linux**: Ubuntu 20.04+, Fedora 36+, or equivalent
- **Windows**: Windows 10+ with WSL2 (recommended) or native

## Installation Steps

### 1. Install Node.js

We recommend using [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager):

```bash
# macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc  # or ~/.zshrc

# Install Node.js
nvm install 20
nvm use 20
nvm alias default 20
```

On Windows, use [nvm-windows](https://github.com/coreybutler/nvm-windows):

```powershell
# Download and install from https://github.com/coreybutler/nvm-windows/releases
nvm install 20
nvm use 20
```

### 2. Install jj (Jujutsu)

**macOS:**
```bash
brew install jj
```

**Linux:**
```bash
# Using cargo (Rust package manager)
cargo install jj-cli

# Or download binary from releases
# https://github.com/martinvonz/jj/releases
```

**Windows:**
```powershell
cargo install jj-cli
# Or use scoop
scoop install jj
```

Verify installation:
```bash
jj --version
```

### 3. Clone and Setup the Project

```bash
# Clone using jj (recommended for this project)
jj git clone https://github.com/yourorg/jujutsu-gui.git
cd jujutsu-gui

# Or using git
git clone https://github.com/yourorg/jujutsu-gui.git
cd jujutsu-gui

# Install dependencies
npm install
```

### 4. Configure jj for the Project

Create or update `~/.jj/config.toml`:

```toml
[user]
name = "Your Name"
email = "your.email@example.com"

[ui]
pager = ":builtin"
```

## Project Structure

```
jjweb/
├── packages/
│   ├── web/                 # Frontend React application
│   │   ├── src/
│   │   │   ├── components/  # React components by feature
│   │   │   │   ├── commits/   # Commit graph and details
│   │   │   │   ├── repo/      # Repository management
│   │   │   │   ├── working-copy/  # Working copy panel
│   │   │   │   ├── bookmarks/ # Bookmark management
│   │   │   │   ├── operations/ # Change operations
│   │   │   │   ├── conflicts/ # Conflict resolution
│   │   │   │   ├── command-palette/ # Quick actions
│   │   │   │   └── ui/       # Base UI components (shadcn)
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── stores/       # Zustand state management
│   │   │   ├── api/          # API client
│   │   │   └── lib/          # Utilities
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── server/              # Backend Fastify application
│   │   ├── src/
│   │   │   ├── routes/       # API route handlers
│   │   │   │   └── api.ts    # Main API router
│   │   │   ├── services/     # Business logic
│   │   │   │   ├── jjExecutor.ts  # jj CLI wrapper
│   │   │   │   └── jjParsers.ts   # Output parsers
│   │   │   ├── utils/        # Utilities
│   │   │   └── index.ts      # Server entry point
│   │   └── package.json
│   │
│   └── shared/              # Shared TypeScript types
│       ├── src/
│       │   ├── types/
│       │   │   ├── entities.ts  # Core types (Commit, FileChange, etc.)
│       │   │   ├── api.ts       # Request/response types
│       │   │   └── websocket.ts # WebSocket message types
│       │   └── index.ts
│       └── package.json
│
├── e2e/                     # Playwright E2E tests
│   └── app.spec.ts
│
├── openspec/               # Project documentation
│   └── changes/            # Change tracking
│
├── package.json            # Root package.json (workspaces)
├── tsconfig.base.json      # Shared TypeScript config
├── playwright.config.ts    # E2E test configuration
└── README.md
```

## Development Workflow

### Starting the Development Server

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:web      # Frontend only (port 5173)
npm run dev:server   # Backend only (port 3000)
```

### Building for Production

```bash
# Build all packages
npm run build

# Build individual packages
npm run build:web
npm run build:server
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests for specific package
npm run test --workspace=packages/web
npm run test --workspace=packages/server

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix lint issues
npm run lint:fix

# Format with Prettier
npm run format
```

## Configuration Files

### TypeScript (`tsconfig.base.json`)

Shared TypeScript configuration for all packages:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### ESLint (`.eslintrc.js`)

Project-wide ESLint configuration with React and TypeScript support.

### Prettier (`.prettierrc`)

Code formatting configuration.

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
HOST=localhost

# Frontend (Vite)
VITE_API_URL=http://localhost:3000
```

## Common Development Tasks

### Adding a New Component

1. Create the component file in the appropriate directory:
   ```bash
   # Example: Adding a new repo feature
   touch packages/web/src/components/repo/NewFeature.tsx
   ```

2. Export from the index file:
   ```bash
   echo "export { NewFeature } from './NewFeature';" >> packages/web/src/components/repo/index.ts
   ```

3. Import and use in your views.

### Adding a New API Endpoint

1. Add the route in `packages/server/src/routes/api.ts`
2. Create a service function if needed in `packages/server/src/services/`
3. Add types in `packages/shared/src/types/`
4. Add the API client method in `packages/web/src/api/client.ts`

### Adding Shared Types

1. Define the type in `packages/shared/src/types/entities.ts` or `api.ts`
2. Export from `packages/shared/src/index.ts`
3. Use in both frontend and backend

## Debugging

### VS Code Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:server"],
      "console": "integratedTerminal"
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Frontend",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/packages/web/src"
    }
  ]
}
```

### Browser DevTools

- React DevTools: [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)
- Redux/Zustand DevTools: Built into React DevTools

## Troubleshooting

### "jj not found" Error

Ensure jj is installed and in your PATH:
```bash
which jj  # Should return the path to jj
jj --version  # Should print version
```

### Node Module Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules packages/*/node_modules
rm -f package-lock.json
npm install
```

### TypeScript Errors

```bash
# Regenerate TypeScript references
npm run build:types
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>
```

## Useful Resources

- [Jujutsu Documentation](https://martinvonz.github.io/jj/latest/)
- [jj CLI Reference](https://martinvonz.github.io/jj/latest/cli-reference/)
- [React Documentation](https://react.dev/)
- [Fastify Documentation](https://fastify.dev/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [TanStack Query](https://tanstack.com/query/latest)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)

## Getting Help

- Open a GitHub Issue for bugs or feature requests
- Check existing issues before creating new ones
- Join discussions in GitHub Discussions

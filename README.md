# Jujutsu GUI

A modern web-based graphical interface for the [Jujutsu (jj)](https://github.com/martinvonz/jj) version control system.

![Jujutsu GUI Screenshot](./docs/screenshot.png)

## Features

- **Visual Commit Graph**: Interactive canvas-based visualization of your repository history
- **Change Management**: Create, edit, abandon, rebase, squash, and split changes
- **Working Copy View**: See modified, added, deleted, and untracked files with diff previews
- **Bookmark Management**: Create, move, and delete bookmarks with remote tracking support
- **Repository Management**: Open, initialize, clone, and switch between repositories
- **Command Palette**: Quick keyboard access to all actions (Cmd/Ctrl+K)
- **Dark Mode**: Full dark theme support
- **Real-time Updates**: WebSocket-based live updates when repository changes

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18.0.0
- [Jujutsu (jj)](https://github.com/martinvonz/jj) >= 0.15.0

### Installing jj

```bash
# macOS
brew install jj

# Linux
cargo install jj-cli

# Windows
cargo install jj-cli
# or download from https://github.com/martinvonz/jj/releases
```

Verify jj is installed:
```bash
jj --version
```

## Installation

```bash
# Clone the repository
git clone https://github.com/yourorg/jujutsu-gui.git
cd jujutsu-gui

# Install dependencies
npm install
```

## Usage

### Development

Start both frontend and backend in development mode:

```bash
npm run dev
```

This will start:
- Frontend dev server at http://localhost:5173
- Backend API server at http://localhost:3000

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Frontend (React + Vite)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │Commit    │ │Change    │ │Working   │ │Repo     │ │
│  │Graph     │ │Operations│ │Copy      │ │Mgmt     │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
├─────────────────────────────────────────────────────┤
│              Backend API (Node.js / Fastify)          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │Command   │ │File      │ │WebSocket │            │
│  │Executor  │ │Watcher   │ │Events    │            │
│  └──────────┘ └──────────┘ └──────────┘            │
├─────────────────────────────────────────────────────┤
│                     jj CLI                           │
└─────────────────────────────────────────────────────┘
```

### Project Structure

```
jjweb/
├── packages/
│   ├── web/           # Frontend React application
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── hooks/        # Custom hooks
│   │   │   ├── stores/       # Zustand stores
│   │   │   └── api/          # API client
│   │   └── ...
│   ├── server/        # Backend Fastify application
│   │   ├── src/
│   │   │   ├── routes/       # API routes
│   │   │   └── services/     # Business logic
│   │   └── ...
│   └── shared/        # Shared TypeScript types
│       └── src/types/
├── e2e/               # Playwright E2E tests
└── openspec/          # Project documentation
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `j` / `↓` | Move to next commit |
| `k` / `↑` | Move to previous commit |
| `h` / `←` | Move to parent commit |
| `l` / `→` | Move to child commit |
| `g` / `Home` | Go to first commit |
| `G` / `End` | Go to last commit |
| `c` | Toggle collapse |
| `Enter` / `Space` | Toggle collapse on selected |

## API Reference

### Repository

- `POST /api/repo/init` - Initialize a new repository
- `POST /api/repo/clone` - Clone a repository
- `POST /api/repo/open` - Open an existing repository
- `POST /api/repo/close` - Close current repository
- `GET /api/repo/recent` - Get recent repositories list
- `DELETE /api/repo/recent/:path` - Remove from recent list

### Commits

- `GET /api/repo/log` - Get commit history
- `GET /api/repo/show/:revision` - Get commit details

### Changes

- `POST /api/changes/new` - Create new change
- `PUT /api/changes/:id/description` - Edit description
- `DELETE /api/changes/:id` - Abandon change
- `POST /api/changes/:id/move` - Rebase change
- `POST /api/changes/:id/squash` - Squash change
- `POST /api/changes/:id/split` - Split change

### Bookmarks

- `GET /api/bookmarks` - List bookmarks
- `POST /api/bookmarks` - Create bookmark
- `PUT /api/bookmarks/:name` - Move bookmark
- `DELETE /api/bookmarks/:name` - Delete bookmark

### Working Copy

- `GET /api/working-copy/status` - Get working copy status
- `GET /api/working-copy/diff` - Get file diff
- `DELETE /api/working-copy/files/:path` - Discard file changes

## Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run all tests with coverage
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`jj new && jj describe -m "Add amazing feature"`)
4. Push to the branch (`jj git push`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Jujutsu](https://github.com/martinvonz/jj) - The version control system this GUI is built for
- [React](https://react.dev/) - UI framework
- [Fastify](https://fastify.dev/) - Backend framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [AntV G6](https://g6.antv.antgroup.com/) - Graph visualization

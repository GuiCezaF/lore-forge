# LoreForge Agent Guide

## Project

LoreForge is a private web-based Virtual Tabletop (VTT) for **Ordem Paranormal RPG**.

The project is intended only for me and my friends. Prioritize simplicity, maintainability, performance, and reliability over unnecessary abstractions or premature optimization.

---

# Core Principles

- Produce production-ready code.
- Prefer simple, maintainable solutions.
- Preserve existing architecture and conventions.
- Do not introduce new libraries or frameworks unless explicitly requested.
- Keep changes as small and focused as possible.
- Favor readability over cleverness.

---

# Architecture

The repository contains two independent applications:

```
apps/
  web/   # Next.js
  api/   # NestJS
```

Rules:

- Never share code between applications.
- Communication happens only through REST/OpenAPI and WebSocket.
- The backend is the single source of truth.
- Never implement authoritative game logic in the frontend.

---

# Technology Stack

## Backend

- NestJS
- Drizzle ORM
- PostgreSQL
- Redis
- S3-compatible storage

## Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zustand
- TanStack Query
- PixiJS
- React Flow
- TipTap

Use the existing stack. Avoid introducing alternatives unless requested.

---

# Code Style

## General

- Write code in English.
- Documentation may remain in Portuguese.
- Use strict TypeScript.
- Avoid `any`.
- Prefer explicit types.
- One export per file.
- Prefer immutable data.
- Avoid magic numbers.
- Prefer constants.

## Naming

- PascalCase for classes and types.
- camelCase for variables, functions and methods.
- kebab-case for files and folders.
- UPPERCASE for environment variables.
- Functions should start with verbs.
- Boolean names should use `is`, `has`, `can` or `should`.

## Functions

- Keep functions small and focused.
- Give each function a single responsibility.
- Prefer early returns over nested conditions.
- Group multiple parameters into objects.
- Prefer composition over inheritance.
- Apply SOLID only when it improves the design.

## Comments

Write comments or JSDoc only when explaining:

- architectural decisions;
- business rules;
- invariants;
- public contracts;
- external integrations;
- non-obvious behavior.

Do not document obvious code.

---

# Backend Guidelines

Organize business domains using pragmatic DDD whenever complexity justifies it.

```
api/
application/
domain/
infrastructure/
```

Rules:

- Controllers only handle transport.
- Business rules belong to Application or Domain.
- Domain never depends on Infrastructure.
- Validate all inputs using DTOs.
- Never expose internal entities directly.
- Return Response DTOs.
- Keep OpenAPI documentation synchronized with public APIs.

---

# Frontend Guidelines

- Prefer React Server Components.
- Minimize `use client`.
- Avoid unnecessary `useEffect`.
- Keep components small and reusable.
- Use Zustand for client state.
- Use TanStack Query for server state.
- Use Zod when schema validation is needed.
- Prefer mobile-first responsive layouts.
- Use dynamic imports when beneficial.
- Optimize images and rendering performance.
- The frontend validates UX only; the backend validates business rules.

---

# Security

Assume every external input is untrusted.

Always:

- Validate all inputs.
- Validate authentication and authorization on the backend.
- Validate resource ownership.
- Use parameterized database queries.
- Protect secrets.
- Fail securely.
- Apply the Principle of Least Privilege.
- Prefer secure defaults.
- Use well-maintained libraries.

Never:

- Trust frontend validation.
- Trust frontend authorization.
- Expose stack traces.
- Expose secrets or internal implementation details.
- Store secrets in source code.
- Implement custom cryptography.

When implementing or reviewing code, always consider:

- Authentication
- Authorization
- IDOR / BOLA
- Injection attacks
- XSS
- CSRF
- SSRF
- Path Traversal
- Sensitive data exposure
- Business logic abuse

Choose the safest reasonable implementation.

---

# Testing

Backend:

- Jest for unit, integration and end-to-end tests.
- Prioritize Domain, Use Cases, Repositories and Controllers.

Frontend:

- Vitest
- React Testing Library
- MSW
- Cypress for critical user flows

Whenever public contracts change:

- Update tests.
- Update OpenAPI.
- Update WebSocket types when applicable.

---

# Documentation

Do not create additional Markdown files unless explicitly requested.

Update documentation only when changing:

- architecture;
- public API contracts;
- important business rules;
- project setup or deployment;
- licensing.

---

# Domain Rules

- Authentication uses Google OAuth.
- Campaign roles are `gm`, `player` and `spectator`.
- Character sheets and dice rolls are always validated by the backend.
- The API is authoritative for permissions, persistence and game rules.
- Real-time synchronization must support at least four simultaneous players per campaign.

---

# Ordem Paranormal License

LoreForge follows the **Ordem Paranormal Community License v1.0**.

Always:

- Use only permitted generic terminology.
- Display the required license notice and unofficial disclaimer.

Never:

- Use official logos or visual identity.
- Include copyrighted canon content.

---

# Expected Behavior

When solving a task:

1. Understand the existing implementation before changing it.
2. Reuse existing patterns whenever possible.
3. Produce complete, production-ready code.
4. Keep changes minimal and consistent.
5. Consider edge cases, performance, security and maintainability.
6. Do not simplify by removing important functionality.
7. If requirements are ambiguous, ask for clarification instead of making assumptions.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for `GuiCezaF/lore-forge`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the five default triage labels. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository using root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->
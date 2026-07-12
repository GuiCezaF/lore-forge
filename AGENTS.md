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

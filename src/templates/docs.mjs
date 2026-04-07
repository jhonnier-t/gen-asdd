export { copilotInstructions, specTemplate, agentsCatalog }

// copilot-instructions, spec template, agents catalog, changelog

function copilotInstructions(name, version, date) {
  return `# Copilot Instructions — ${name}
${version ? `\nVersion: ${version}\n` : ''}
This file is the main instruction file loaded by GitHub Copilot for every interaction in this project.
All AI agents, code completions, and chat responses must follow these guidelines.

---

## Project Overview

**Project**: ${name}
**Generated**: ${date}

> Replace this section with a description of: what the project does, its primary domain,
> and the audience/users it serves.

---

## Architecture & Design Principles

This project follows these design principles. Update this section to reflect the actual
patterns used in the codebase.

### Core Principles
- **SOLID** — Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **DRY** — Don't Repeat Yourself: extract shared logic, avoid duplication across layers
- **KISS** — Keep It Simple, Stupid: prefer simple, readable solutions over clever ones
- **YAGNI** — You Aren't Gonna Need It: don't build features until they are required
- **Separation of Concerns** — each module/layer has one clearly defined responsibility

### Layered Architecture (default)
\`\`\`
┌──────────────────────────────┐
│  API / Presentation Layer    │  ← Routes, controllers, request/response mapping
├──────────────────────────────┤
│  Application / Use-Case Layer│  ← Business logic, orchestration, DTOs
├──────────────────────────────┤
│  Domain Layer                │  ← Entities, value objects, domain rules (no dependencies)
├──────────────────────────────┤
│  Infrastructure Layer        │  ← DB, external APIs, file I/O, adapters
└──────────────────────────────┘
\`\`\`

Dependencies flow **inward only**: Infrastructure → Application → Domain.
The Domain layer must never import from Application or Infrastructure.

---

## Coding Standards

- **Naming**: Use descriptive, intention-revealing names. Avoid abbreviations.
  - Variables/functions: camelCase
  - Classes/types: PascalCase
  - Constants: UPPER_SNAKE_CASE
  - Files: kebab-case
- **Functions**: Small, single-purpose. If a function needs a comment to explain what it does, rename it.
- **Error handling**: Always handle errors explicitly. Never swallow exceptions silently.
- **Immutability**: Prefer immutable data structures where possible.
- **Comments**: Explain *why*, not *what*. Code should be self-documenting.
- **Dead code**: Remove unused code; do not comment it out.

---

## ASDD Workflow (mandatory)

Every feature MUST follow this pipeline — no exceptions:

\`\`\`
Step 1 — SPEC (prerequisite for everything)
  Developer or @spec creates .github/specs/FEAT-<id>-<slug>.md
  Spec must reach status: approved before any implementation starts

Step 2 — PARALLEL ∥ — TDD Red Phase (spec approved → write failing tests)
  @tdd-backend  → writes backend tests from spec (tests must fail — no impl yet)
  @tdd-frontend → writes frontend tests from spec (tests must fail — no impl yet)

Step 3 — PARALLEL ∥ — TDD Green Phase (tests exist → implement to pass them)
  @backend      → implements backend code to make Step 2 tests pass
  @frontend     → implements frontend code to make Step 2 tests pass

Step 4 — PARALLEL (after Step 3 completes)
  @documentation → generates docs, ADR entries, and changelog updates
  @qa            → generates Gherkin acceptance scenarios and risk matrix
\`\`\`

**Rules:**
- No agent in Steps 2, 3 or 4 runs without a spec file with \`status: approved\`
- All agents must read the spec before generating anything
- All generated code must reference the spec ID in commit messages (\`feat(FEAT-XXX): ...\`)

---

## AI Agent Roles

| Agent | Invoke with | When to use |
|-------|-------------|-------------|
| @spec | \`@spec\` | Create a new feature specification |
| @orchestrator | \`@orchestrator\` | Trigger or validate the full ASDD pipeline |
| @tdd-backend | \`@tdd-backend\` | Write backend tests before implementation |
| @tdd-frontend | \`@tdd-frontend\` | Write frontend tests before implementation |
| @backend | \`@backend\` | Implement backend code to pass tests |
| @frontend | \`@frontend\` | Implement frontend code to pass tests |
| @documentation | \`@documentation\` | Generate docs, ADRs, changelog entries |
| @qa | \`@qa\` | Generate Gherkin acceptance scenarios |

---

## Security Requirements

- Never expose secrets, tokens, or credentials in code or commits
- Always validate and sanitize inputs at system boundaries
- Apply OWASP Top 10 practices: injection prevention, broken auth, XSS, IDOR
- Use parameterized queries — never string-concatenate SQL
- Enforce authentication before accessing protected resources
- Log security events but never log sensitive data (PII, tokens, passwords)

---

## Performance Requirements

- Avoid N+1 queries: batch or join where possible
- Index database columns used in WHERE/ORDER BY clauses
- Paginate list endpoints — never return unbounded collections
- Lazy-load/code-split large frontend bundles
- Set timeouts on all external HTTP calls
`
}

// ---------------------------------------------------------------------------
// Agent definitions
// ---------------------------------------------------------------------------

function specTemplate(date) {
  return `---
id: FEAT-XXX
title: "<Feature title>"
status: draft
created: ${date}
author: "<github-handle>"
agents: tdd-backend, tdd-frontend, backend, frontend, documentation, qa
---

# FEAT-XXX — <Feature title>

> **ASDD**: Set \`status: approved\` in the frontmatter, then invoke \`@orchestrator\` to trigger the full pipeline.

## 1. Context & Motivation

Why does this feature exist? What problem does it solve?
Reference related issues (e.g. Closes #123).

## 2. Goals

What this feature must achieve. Use specific, measurable objectives.

- Goal 1
- Goal 2

## 3. Non-Goals

What is explicitly out of scope for this feature.

## 4. Actors & Entry Points

Who uses this feature and how do they trigger it?

| Actor | Entry point | Description |
|-------|-------------|-------------|
| User  | UI / API    | ...         |

## 5. Functional Requirements

List every requirement the implementation must satisfy.

- REQ-1: ...
- REQ-2: ...
- REQ-3: ...

## 6. Acceptance Criteria

Written in Given/When/Then format. These become test cases.

**Scenario: <happy path name>**
- Given: <precondition>
- When: <action>
- Then: <expected outcome>
- And: <additional assertion>

**Scenario: <error case>**
- Given: <precondition>
- When: <invalid action>
- Then: <error message is shown>

## 7. Data Model

Entities involved, their fields, and relationships.

\`\`\`
Entity: <Name>
  id: uuid (PK)
  field: type — description
  createdAt: datetime
\`\`\`

## 8. API Contract (if applicable)

\`\`\`
POST /api/v1/<resource>
Authorization: Bearer <token>

Request:
  { "field": "value" }

Response 201:
  { "id": "...", "field": "value" }

Response 422:
  { "error": "validation_failed", "details": [...] }
\`\`\`

## 9. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Response time | p99 < 500ms |
| Test coverage | ≥ 80% of new code |
| Accessibility | WCAG 2.1 AA |

## 10. Open Questions

Questions that must be resolved before this spec can be approved.

- [ ] Question 1
- [ ] Question 2
`
}

// ---------------------------------------------------------------------------
// Prompt files
// ---------------------------------------------------------------------------

function agentsCatalog(name) {
  return `# AI Agent Catalog — ${name}

This file describes all Copilot agents installed by ASDD. Invoke them in GitHub Copilot Chat.

## @spec

**Purpose**: Creates feature specification files in \`.github/specs/\`
**When to use**: Starting a new feature
**Invoke with**: \`@spec Create a spec for user email verification\`
**Output**: \`.github/specs/FEAT-XXX-<slug>.md\` with status: draft

---

## @orchestrator

**Purpose**: Coordinates the full ASDD pipeline
**When to use**: After approving a spec, to trigger all agents
**Invoke with**: \`@orchestrator Run pipeline for FEAT-042\`
**Output**: Validates spec, triggers all sub-agents, reports completion

---

## @tdd-backend

**Purpose**: Writes failing backend tests before implementation
**When to use**: TDD Red phase — after spec is approved
**Invoke with**: \`@tdd-backend Write tests for FEAT-042\`
**Output**: Test files covering all acceptance criteria

---

## @tdd-frontend

**Purpose**: Writes failing frontend/UI tests before implementation
**When to use**: TDD Red phase — after spec is approved
**Invoke with**: \`@tdd-frontend Write UI tests for FEAT-042\`
**Output**: Component/integration test files

---

## @backend

**Purpose**: Implements backend code to make failing tests pass
**When to use**: TDD Green phase — after backend tests exist
**Invoke with**: \`@backend Implement FEAT-042 backend\`
**Output**: Domain, application, infrastructure, and API layer code

---

## @frontend

**Purpose**: Implements UI components to make failing tests pass
**When to use**: TDD Green phase — after frontend tests exist
**Invoke with**: \`@frontend Implement FEAT-042 frontend\`
**Output**: Components, hooks, and data-fetching code

---

## @documentation

**Purpose**: Generates documentation for completed features
**When to use**: After implementation is complete
**Invoke with**: \`@documentation Document FEAT-042\`
**Output**: CHANGELOG entry, README updates, ADR (if applicable)

---

## @qa

**Purpose**: Generates Gherkin acceptance scenarios from spec
**When to use**: After spec is approved (can run in parallel with dev)
**Invoke with**: \`@qa Generate Gherkin for FEAT-042\`
**Output**: \`.github/specs/scenarios/FEAT-042-<slug>.feature\`

---

## Full ASDD Pipeline

\`\`\`
1. @spec     → create .github/specs/FEAT-XXX.md (status: draft)
   Developer → review spec, set status: approved

2. @orchestrator → validates spec, triggers:
   Phase 2 (parallel — TDD Red): @tdd-backend + @tdd-frontend
   → tests must FAIL before continuing

3. @orchestrator → verifies Red phase, triggers:
   Phase 3 (parallel — TDD Green): @backend + @frontend
   → all tests must PASS before continuing

4. Parallel: @documentation + @qa
\`\`\`
`
}

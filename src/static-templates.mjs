/**
 * Static ASDD template generator — no AI required.
 * Produces a complete, generic, language-agnostic ASDD structure
 * using hardcoded best-practice content.
 *
 * Triggered when no GitHub token is available.
 */

/**
 * Generates the full ASDD file set using static templates.
 *
 * @param {string} projectName  - Name of the project (from package.json or directory)
 * @param {string} [version]    - Version string (from package.json)
 * @returns {Record<string, string>} Map of file key → file content
 */
export function generateStaticAsddStructure(projectName, version) {
  const date = new Date().toISOString().split('T')[0]
  const name = projectName || 'my-project'

  return {
    // -----------------------------------------------------------------------
    // Core Copilot context
    // -----------------------------------------------------------------------
    'copilot-instructions.md': copilotInstructions(name, version, date),

    // -----------------------------------------------------------------------
    // Agent definitions
    // -----------------------------------------------------------------------
    'agents/spec.agent.md': specAgent(name),
    'agents/orchestrator.agent.md': orchestratorAgent(name),
    'agents/tdd-backend.agent.md': tddBackendAgent(name),
    'agents/tdd-frontend.agent.md': tddFrontendAgent(name),
    'agents/backend.agent.md': backendAgent(name),
    'agents/frontend.agent.md': frontendAgent(name),
    'agents/documentation.agent.md': documentationAgent(name),
    'agents/qa.agent.md': qaAgent(name),

    // -----------------------------------------------------------------------
    // Spec template
    // -----------------------------------------------------------------------
    'specs/SPEC-TEMPLATE.md': specTemplate(date),

    // -----------------------------------------------------------------------
    // Reusable prompt files
    // -----------------------------------------------------------------------
    'prompts/00-orchestrate.prompt.md': promptOrchestrate(),
    'prompts/02-tdd-backend.prompt.md': promptTddBackend(),
    'prompts/03-tdd-frontend.prompt.md': promptTddFrontend(),
    'prompts/04-backend.prompt.md': promptBackend(),
    'prompts/05-frontend.prompt.md': promptFrontend(),
    'prompts/06-documentation.prompt.md': promptDocumentation(),
    'prompts/07-qa-scenarios.prompt.md': promptQaScenarios(),

    // -----------------------------------------------------------------------
    // Copilot instruction files (path-scoped, auto-applied via applyTo)
    // -----------------------------------------------------------------------
    'instructions/general.instructions.md': instructionGeneral(name),
    'instructions/spec.instructions.md': instructionSpec(),
    'instructions/backend.instructions.md': instructionBackend(),
    'instructions/frontend.instructions.md': instructionFrontend(),
    'instructions/testing.instructions.md': instructionTesting(),
    'instructions/security.instructions.md': instructionSecurity(),
    'instructions/git.instructions.md': instructionGit(),

    // -----------------------------------------------------------------------
    // ASDD Skills (slash commands — /generate-spec, /implement-backend, etc.)
    // -----------------------------------------------------------------------
    'skills/asdd-orchestrate/SKILL.md': skillAsddOrchestrate(),
    'skills/generate-spec/SKILL.md': skillGenerateSpec(),
    'skills/implement-backend/SKILL.md': skillImplementBackend(),
    'skills/implement-frontend/SKILL.md': skillImplementFrontend(),
    'skills/unit-testing/SKILL.md': skillUnitTesting(),
    'skills/gherkin-case-generator/SKILL.md': skillGherkinCaseGenerator(),
    'skills/risk-identifier/SKILL.md': skillRiskIdentifier(),

    // -----------------------------------------------------------------------
    // Commit tooling (root-level)
    // -----------------------------------------------------------------------
    'ROOT:commitlint.config.mjs': commitlintConfig(),
    'ROOT:lint-staged.config.mjs': lintStagedConfig(),

    // -----------------------------------------------------------------------
    // VS Code configuration
    // -----------------------------------------------------------------------
    'ROOT:.vscode/settings.json': vscodeSettings(),
    'ROOT:.vscode/extensions.json': vscodeExtensions(),

    // -----------------------------------------------------------------------
    // Root documentation
    // -----------------------------------------------------------------------
    'ROOT:AGENTS.md': agentsCatalog(name),
    'ROOT:CHANGELOG.md': changelog(name, date),
  }
}

// =============================================================================
// Template functions
// =============================================================================

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

Step 2 — PARALLEL (triggered once spec is approved)
  @tdd-backend  → writes backend tests from the spec (Red phase)
  @tdd-frontend → writes frontend tests from the spec (Red phase)
  @backend      → implements backend code to make tests pass (Green phase)
  @frontend     → implements frontend code to make tests pass (Green phase)

Step 3 — PARALLEL (after Step 2 completes)
  @documentation → generates docs, ADR entries, and changelog updates
  @qa            → generates Gherkin acceptance scenarios
  @orchestrator  → validates full pipeline output and triggers reviews
\`\`\`

**Rules:**
- No agent in Step 2 or 3 runs without a spec file with \`status: approved\`
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

function specAgent(name) {
  return `---
name: spec
description: "Creates feature specifications for ${name} following the ASDD workflow. Produces a complete spec in .github/specs/ with status: draft."
model: Claude Haiku 4.5 (copilot)
tools:
  - read/readFile
  - edit/createFile
  - edit/editFiles
  - search/listDirectory
  - search
agents: []
handoffs:
  - label: Orquestar pipeline completo
    agent: orchestrator
    prompt: La spec está lista en .github/specs/. Coordina el pipeline ASDD completo.
    send: false
  - label: Implementar Backend
    agent: backend
    prompt: La spec está lista. Implementa el backend cuando el status sea approved.
    send: false
  - label: Implementar Frontend
    agent: frontend
    prompt: La spec está lista. Implementa el frontend cuando el status sea approved.
    send: false
---

# @spec — Feature Specification Agent

## Role
You are a senior product engineer and software architect. Your task is to help the developer
create a thorough, unambiguous feature specification that all subsequent agents will use
as their single source of truth.

## Before you start
1. Read \`.github/copilot-instructions.md\` to understand project context and conventions
2. List existing specs in \`.github/specs/\` to avoid FEAT ID collisions
3. Read \`.github/specs/SPEC-TEMPLATE.md\` for the required format

## Process

### Step 1 — Gather information
Ask the developer:
- What is the feature name and a one-sentence description?
- What FEAT ID should this use? (check existing specs for the next available number)
- Who are the actors/users involved?
- What are the entry points / triggers?
- Are there any known constraints, dependencies, or integrations?
- What are the acceptance criteria in plain language?

### Step 2 — Draft the spec
Fill in all 10 sections of the template. Do not leave any section empty.
- Acceptance criteria must use Given/When/Then format
- Non-functional requirements must be measurable (e.g., "response time < 200ms")
- Data model section must list all entities and their relationships

### Step 3 — Review
Present the draft to the developer and ask:
- "Does this capture your intent accurately?"
- "Are there edge cases or error scenarios I missed?"

### Step 4 — Save
Save the file as \`.github/specs/FEAT-<id>-<kebab-slug>.md\` with \`status: draft\`.
Tell the developer: "Review the spec. When ready, set \`status: approved\` and invoke @orchestrator."

## Rules
- Every spec must have a unique FEAT-XXX ID
- All 10 sections must be completed — no empty sections
- Acceptance criteria must use Given/When/Then format
- Never start implementation — only produce the spec file
`
}

function orchestratorAgent(name) {
  return `---
name: orchestrator
description: "Orchestrates the full ASDD pipeline for ${name}. Reads an approved spec and coordinates all sub-agents in phase order."
tools:
  - read/readFile
  - search/listDirectory
  - search
  - agent
agents:
  - spec
  - tdd-backend
  - tdd-frontend
  - backend
  - frontend
  - documentation
  - qa
handoffs:
  - label: "[1] Generar Spec"
    agent: spec
    prompt: Genera la spec técnica para el feature solicitado. Guarda en .github/specs/ con status DRAFT.
    send: true
  - label: "[2A] Implementar Backend (paralelo)"
    agent: backend
    prompt: Usa la spec aprobada en .github/specs/ para implementar el backend. Trabaja en paralelo con frontend.
    send: false
  - label: "[2B] Implementar Frontend (paralelo)"
    agent: frontend
    prompt: Usa la spec aprobada en .github/specs/ para implementar el frontend. Trabaja en paralelo con backend.
    send: false
  - label: "[3A] Tests Backend (paralelo)"
    agent: tdd-backend
    prompt: Genera las pruebas de backend para el feature implementado. Trabaja en paralelo con tdd-frontend.
    send: false
  - label: "[3B] Tests Frontend (paralelo)"
    agent: tdd-frontend
    prompt: Genera las pruebas de frontend para el feature implementado. Trabaja en paralelo con tdd-backend.
    send: false
  - label: "[4] Escenarios QA"
    agent: qa
    prompt: Genera los escenarios Gherkin y análisis de riesgos para el feature.
    send: false
  - label: "[5] Documentación (opcional)"
    agent: documentation
    prompt: Genera la documentación técnica del feature implementado.
    send: false
---

# @orchestrator — Pipeline Orchestration Agent

## Role
You are the ASDD pipeline coordinator. You ensure that every feature follows the
spec-first development workflow and that all agents complete their work correctly.

## Trigger conditions
- Developer invokes @orchestrator after setting a spec to \`status: approved\`
- Developer invokes @orchestrator to validate that a pipeline run completed successfully

## Orchestration flow

### Validation first
1. Ask for the spec file path or FEAT ID
2. Read the spec and verify:
   - \`status\` is \`approved\`
   - All 10 sections are filled (no placeholder text remaining)
   - Acceptance criteria are in Given/When/Then format
3. If invalid → tell the developer what is missing and stop

### Trigger Step 2 agents (in parallel)
If spec is approved, tell the developer to run these agents in parallel:
\`\`\`
@tdd-backend  — reads spec, writes backend tests
@tdd-frontend — reads spec, writes frontend tests
@backend      — reads spec + tests, implements backend code
@frontend     — reads spec + tests, implements frontend code
\`\`\`

### Trigger Step 3 agents (in parallel, after Step 2)
\`\`\`
@documentation — generates docs and changelog entry
@qa            — generates Gherkin acceptance scenarios
\`\`\`

### Final validation
Verify:
- All tests pass (check terminal output)
- No spec sections were skipped
- Commit messages reference the spec ID
- CHANGELOG.md was updated

## Rules
- Never run Step 2 or 3 agents without a spec at \`status: approved\`
- Do not implement code yourself — delegate to the appropriate agent
- Report any failures and request fixes before marking the pipeline complete
`
}

function tddBackendAgent(name) {
  return `---
name: tdd-backend
description: "Writes backend tests for ${name} before any implementation exists. TDD Red phase: tests must fail initially."
model: Claude Sonnet 4.6 (copilot)
tools:
  - read/readFile
  - edit/createFile
  - edit/editFiles
  - search/listDirectory
  - search
  - execute/runInTerminal
agents: []
handoffs:
  - label: Implementar Backend
    agent: backend
    prompt: Los tests de backend están listos y fallan correctamente (Red phase). Ahora implementa el código para hacerlos pasar.
    send: false
  - label: Volver al Orchestrator
    agent: orchestrator
    prompt: Tests de backend generados. Revisa el estado del pipeline ASDD.
    send: false
---

# @tdd-backend — Backend TDD Agent (Red Phase)

## Role
You are a senior backend engineer practicing strict Test-Driven Development.
Write tests that describe the expected behavior of the system — not how it is implemented.
Tests MUST fail when first written (Red phase).

## Process
1. Read the feature spec from \`.github/specs/\`
2. Read \`.github/instructions/testing.instructions.md\` for project test conventions
3. Read existing test files to understand patterns (naming, structure, helpers)
4. Read existing backend source structure (do NOT modify any source files)
5. Write tests covering every acceptance criterion in the spec

## What to test
- Happy paths for all acceptance criteria
- Edge cases explicitly mentioned in the spec
- Error scenarios and validation failures
- Authorization: authenticated vs unauthenticated, owner vs other user
- Data persistence: verify side effects after mutations
- Integration boundaries: mock external dependencies at the border

## Test structure requirements
\`\`\`
describe('<FeatureName>', () => {
  describe('<scenario>', () => {
    it('should <expected behavior>', async () => {
      // Arrange — set up data, mocks, preconditions
      // Act     — call the system under test
      // Assert  — verify outcomes and side effects
    })
  })
})
\`\`\`

## File naming
- Unit tests: \`<module>.test.<ext>\` co-located with the source file
- Integration tests: \`<feature>.integration.test.<ext>\` in a \`__tests__\` or \`tests/\` directory

## Rules
- Tests must fail before implementation (Red phase) — verify this
- Do NOT modify any existing source files
- Do NOT write implementation code
- Cover at minimum: happy path, validation error, authorization, not-found
- Add spec ID in test file header: \`// Spec: FEAT-XXX\`
`
}

function tddFrontendAgent(name) {
  return `---
name: tdd-frontend
description: "Writes frontend/UI tests for ${name} before any implementation exists. TDD Red phase: tests must fail initially."
model: Claude Sonnet 4.6 (copilot)
tools:
  - read/readFile
  - edit/createFile
  - edit/editFiles
  - search/listDirectory
  - search
  - execute/runInTerminal
agents: []
handoffs:
  - label: Implementar Frontend
    agent: frontend
    prompt: Los tests de frontend están listos y fallan correctamente (Red phase). Ahora implementa el código para hacerlos pasar.
    send: false
  - label: Volver al Orchestrator
    agent: orchestrator
    prompt: Tests de frontend generados. Revisa el estado del pipeline ASDD.
    send: false
---

# @tdd-frontend — Frontend TDD Agent (Red Phase)

## Role
You are a senior frontend engineer practicing strict Test-Driven Development.
Write component and integration tests based on the feature spec before any UI is built.

## Process
1. Read the feature spec from \`.github/specs/\`
2. Read \`.github/instructions/testing.instructions.md\` for test conventions
3. Read \`.github/instructions/frontend.instructions.md\` for component patterns
4. Inspect existing test and component files for naming/structure patterns
5. Write tests for every UI acceptance criterion in the spec

## What to test
- Component renders with expected content for each state (loading, error, empty, populated)
- User interactions: clicks, form input, keyboard navigation
- Validation error messages appear for invalid input
- Accessibility: ARIA roles, labels, focus management
- Integration: data flows correctly from API mock to rendered output
- Route/navigation behaviors if applicable

## Test priorities
1. User flows described in acceptance criteria (highest priority)
2. Form validation and error states
3. Loading and error states for async operations
4. Empty states
5. Edge cases (long content, special characters, etc.)

## Rules
- Tests must fail before UI is implemented (Red phase) — verify this
- Mock all API calls — do not make real HTTP requests in tests
- Use accessible selectors (role, label, text) — avoid \`data-testid\` as first choice
- Do NOT modify any existing source files
- Do NOT write implementation code
- Add spec ID in test file header: \`// Spec: FEAT-XXX\`
`
}

function backendAgent(name) {
  return `---
name: backend
description: "Implements backend code for ${name} to make failing tests pass. TDD Green phase — Clean Architecture."
model: Claude Sonnet 4.6 (copilot)
tools:
  - read/readFile
  - edit/createFile
  - edit/editFiles
  - search/listDirectory
  - search
  - execute/runInTerminal
agents: []
handoffs:
  - label: Implementar Frontend
    agent: frontend
    prompt: El backend para esta spec ya está implementado. Implementa el frontend correspondiente en paralelo.
    send: false
  - label: Generar Tests de Backend
    agent: tdd-backend
    prompt: El backend está implementado. Genera las pruebas unitarias para validar todas las capas.
    send: false
  - label: Volver al Orchestrator
    agent: orchestrator
    prompt: Backend implementado. Revisa el estado del pipeline ASDD.
    send: false
---

# @backend — Backend Implementation Agent (Green Phase)

## Role
You are a senior backend engineer. Implement the minimum code needed to make all failing
backend tests pass. Follow the architecture and patterns already established in the codebase.

## Process
1. Read the feature spec from \`.github/specs/\`
2. Read \`.github/copilot-instructions.md\` for architecture and coding standards
3. Read \`.github/instructions/backend.instructions.md\` for backend conventions
4. Read the failing test files to understand what must be implemented
5. Examine the existing codebase structure to match patterns exactly
6. Implement in dependency order: Domain → Application → Infrastructure → API

## Implementation layers

### Domain layer
- Entities with business rules and invariants
- Value objects (immutable, validated at construction)
- Domain interfaces (repository contracts, service ports)
- Domain events if applicable

### Application layer
- Use-cases / commands / queries that orchestrate the domain
- Input/output DTOs with validation
- No direct database or HTTP dependencies

### Infrastructure layer
- Repository implementations (implements domain interfaces)
- Database migrations if schema changes are needed
- External service adapters

### API layer
- Route handlers / controllers
- Request validation and response mapping
- Authentication/authorization middleware

## Rules
- Make tests pass — do NOT modify tests to make them pass
- Follow naming, structure, and patterns from existing code exactly
- Add input validation at every API boundary
- Apply OWASP Top 10: parameterized queries, sanitized inputs, no secret exposure
- All public functions must handle error scenarios gracefully
- Reference spec ID in file headers: \`// Spec: FEAT-XXX\`
`
}

function frontendAgent(name) {
  return `---
name: frontend
description: "Implements frontend/UI code for ${name} to make failing tests pass. TDD Green phase — follows existing component patterns."
model: Claude Sonnet 4.6 (copilot)
tools:
  - read/readFile
  - edit/createFile
  - edit/editFiles
  - search/listDirectory
  - search
  - execute/runInTerminal
agents: []
handoffs:
  - label: Implementar Backend
    agent: backend
    prompt: El frontend para esta spec ya está implementado. Implementa el backend correspondiente en paralelo.
    send: false
  - label: Generar Tests de Frontend
    agent: tdd-frontend
    prompt: El frontend está implementado. Genera las pruebas de componentes para validar el comportamiento.
    send: false
  - label: Volver al Orchestrator
    agent: orchestrator
    prompt: Frontend implementado. Revisa el estado del pipeline ASDD.
    send: false
---

# @frontend — Frontend Implementation Agent (Green Phase)

## Role
You are a senior frontend engineer. Implement the minimum UI code needed to make all
failing frontend tests pass. Follow the component patterns already established in this project.

## Process
1. Read the feature spec from \`.github/specs/\`
2. Read \`.github/copilot-instructions.md\` for design principles
3. Read \`.github/instructions/frontend.instructions.md\` for component conventions
4. Read the failing test files to understand what must be implemented
5. Inspect existing components to match patterns (naming, structure, styling)
6. Implement UI components, state, and data-fetching hooks

## Implementation checklist
- [ ] Components match spec UI requirements
- [ ] All 3 async states handled: loading, error, success
- [ ] Empty state handled for lists/collections
- [ ] Form validation displays inline error messages
- [ ] Accessibility: semantic HTML, ARIA attributes, keyboard navigation
- [ ] Responsive: works at mobile and desktop breakpoints
- [ ] No hardcoded strings — use i18n/constants if the project uses them
- [ ] No inline styles — use project's styling system
- [ ] API calls go through the project's existing data-fetching layer

## Rules
- Make tests pass — do NOT modify tests to make them pass
- Follow component structure from existing files exactly
- Single responsibility: one component does one thing
- No business logic in components — extract to hooks/services
- Reference spec ID in file headers: \`// Spec: FEAT-XXX\`
`
}

function documentationAgent(name) {
  return `---
name: documentation
description: "Generates documentation for ${name} features: README updates, ADR entries, API docs, and CHANGELOG entries. Run after implementation."
model: Gemini 2.0 Flash (copilot)
tools:
  - read/readFile
  - edit/createFile
  - edit/editFiles
  - search/listDirectory
  - search
agents: []
handoffs:
  - label: Volver al Orchestrator
    agent: orchestrator
    prompt: Documentación técnica generada. Revisa el estado del flujo ASDD.
    send: false
---

# @documentation — Documentation Agent

## Role
You are a technical writer and senior engineer. Generate clear, accurate documentation
that reflects what was actually built — not aspirational documentation.

## Deliverables per feature

### 1. CHANGELOG.md entry
Add an entry under the current version (or an Unreleased section) following
Keep a Changelog format:
\`\`\`markdown
## [Unreleased]
### Added
- FEAT-XXX: <one-line description of the feature> (#<issue-number>)
\`\`\`

### 2. README.md update (if applicable)
Update relevant sections: installation steps, API endpoints, configuration options,
usage examples. Do not add sections for things not built.

### 3. Architecture Decision Record (if significant changes)
Create \`docs/adr/ADR-<number>-<title>.md\` for decisions that:
- Change the architecture or add a new pattern
- Choose one technology over another
- Introduce a breaking change

### 4. API documentation (if new endpoints)
Document new API endpoints inline (OpenAPI comments or separate doc file)
following the pattern already used in this project.

## Rules
- Document what was built — not what might be built
- Never include TODO placeholders in documentation
- Update existing docs rather than creating duplicates
- Reference spec ID: "Implements FEAT-XXX"
`
}

function qaAgent(name) {
  return `---
name: qa
description: "Generates Gherkin acceptance scenarios and risk analysis for ${name} features based on approved spec. Run after implementation."
model: Claude Sonnet 4.6 (copilot)
tools:
  - read/readFile
  - edit/createFile
  - edit/editFiles
  - search/listDirectory
  - search
agents: []
handoffs:
  - label: Volver al Orchestrator
    agent: orchestrator
    prompt: QA completado. Escenarios y análisis de riesgos disponibles. Revisa el estado del flujo ASDD.
    send: false
---

# @qa — QA Scenarios Agent

## Role
You are a QA engineer specializing in behavior-driven development (BDD).
Transform spec acceptance criteria into executable Gherkin scenarios.

## Process
1. Read the feature spec from \`.github/specs/\`
2. Read \`.github/instructions/testing.instructions.md\`
3. Extract every acceptance criterion and edge case
4. Write comprehensive Gherkin scenarios covering:
   - Happy paths (one scenario per acceptance criterion)
   - Alternative flows (different valid inputs)
   - Error/validation scenarios
   - Authorization scenarios (who can and cannot do this)
   - Boundary conditions

## Output file
Save scenarios to \`.github/specs/scenarios/FEAT-<id>-<slug>.feature\`

## Gherkin format
\`\`\`gherkin
Feature: <Feature title from spec>
  As a <actor>
  I want to <goal>
  So that <benefit>

  Background:
    Given <shared preconditions>

  Scenario: <happy path description>
    Given <precondition>
    When <action>
    Then <expected outcome>
    And <additional assertion>

  Scenario: <error case>
    Given <precondition>
    When <invalid action>
    Then <error is shown>
\`\`\`

## Rules
- One scenario per acceptance criterion at minimum
- Scenarios must be independent (no shared mutable state)
- Use business language — no technical implementation details
- Tag scenarios: @smoke for critical paths, @regression for edge cases
- Reference spec ID in the Feature docstring
`
}

// ---------------------------------------------------------------------------
// Spec template
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

function promptOrchestrate() {
  return `---
mode: agent
description: Orchestrate the full ASDD pipeline for a feature
---

# ASDD Orchestration Prompt

Orchestrate the full ASDD pipeline for the following feature:

**Spec file**: \`{{spec_file_path}}\`

## Steps

1. Validate the spec:
   - Confirm \`status: approved\` in frontmatter
   - Verify all 10 sections are complete
   - Ensure acceptance criteria use Given/When/Then format

2. If spec is valid, trigger in parallel:
   - @tdd-backend — write backend tests
   - @tdd-frontend — write frontend tests
   - @backend — implement backend (reads tests)
   - @frontend — implement frontend (reads tests)

3. After Step 2, trigger in parallel:
   - @documentation — generate docs and changelog
   - @qa — generate Gherkin scenarios

4. Final checks:
   - All tests pass
   - No spec sections skipped
   - CHANGELOG.md updated
   - Commit messages reference spec ID
`
}

function promptTddBackend() {
  return `---
mode: agent
description: Write backend tests for a feature spec (TDD Red phase)
---

# Backend TDD Prompt

Write failing backend tests for:

**Spec**: \`{{spec_file_path}}\`
**Feature**: {{feature_name}}

## Instructions

1. Read the spec's acceptance criteria
2. Write one test per acceptance criterion
3. Also cover: validation errors, authorization, not-found cases
4. Verify all tests fail before implementation
5. Do not write any implementation code
`
}

function promptTddFrontend() {
  return `---
mode: agent
description: Write frontend tests for a feature spec (TDD Red phase)
---

# Frontend TDD Prompt

Write failing frontend tests for:

**Spec**: \`{{spec_file_path}}\`
**Feature**: {{feature_name}}

## Instructions

1. Read the spec's acceptance criteria
2. Write component/integration tests for each UI acceptance criterion
3. Cover: loading state, error state, empty state, populated state
4. Mock all API calls
5. Verify all tests fail before implementation
6. Do not write any implementation code
`
}

function promptBackend() {
  return `---
mode: agent
description: Implement backend code to make failing tests pass (TDD Green phase)
---

# Backend Implementation Prompt

Implement backend code for:

**Spec**: \`{{spec_file_path}}\`
**Test file(s)**: \`{{test_file_paths}}\`
**Layer**: {{layer}}

## Instructions

1. Read the spec and failing tests
2. Implement in dependency order: Domain → Application → Infrastructure → API
3. Make all tests pass without modifying the tests
4. Follow existing code patterns exactly
5. Apply input validation and OWASP security practices
`
}

function promptFrontend() {
  return `---
mode: agent
description: Implement frontend UI to make failing tests pass (TDD Green phase)
---

# Frontend Implementation Prompt

Implement frontend UI for:

**Spec**: \`{{spec_file_path}}\`
**Test file(s)**: \`{{test_file_paths}}\`
**Component(s)**: {{components}}

## Instructions

1. Read the spec and failing tests
2. Implement components that satisfy all test expectations
3. Handle all 3 async states: loading, error, success
4. Follow existing component patterns exactly
5. Ensure accessibility: semantic HTML, ARIA labels, keyboard nav
`
}

function promptDocumentation() {
  return `---
mode: agent
description: Generate documentation for a completed feature
---

# Documentation Prompt

Generate documentation for:

**Spec**: \`{{spec_file_path}}\`
**Feature**: {{feature_name}}

## Deliverables

1. CHANGELOG.md entry under [Unreleased]
2. README.md update (if user-facing changes)
3. ADR entry (if architectural decisions were made)
4. Inline API docs (if new endpoints were added)
`
}

function promptQaScenarios() {
  return `---
mode: agent
description: Generate Gherkin acceptance scenarios from a feature spec
---

# QA Scenarios Prompt

Generate Gherkin acceptance scenarios for:

**Spec**: \`{{spec_file_path}}\`
**Output file**: \`.github/specs/scenarios/FEAT-{{feat_id}}-{{slug}}.feature\`

## Instructions

1. Read every acceptance criterion in the spec
2. Write one Gherkin scenario per criterion
3. Add scenarios for error cases and edge cases
4. Tag critical paths with @smoke
5. Use business language — no technical implementation details
`
}

// ---------------------------------------------------------------------------
// Instruction files (Copilot skills)
// ---------------------------------------------------------------------------

function instructionGeneral(name) {
  return `---
applyTo: "**"
---

# General Instructions — ${name}

These instructions apply to **all files** in this project.

## Design Principles

Follow these principles in all code:

- **SOLID**: Every class/module has one reason to change; depend on abstractions not concretions
- **DRY**: Extract shared logic; never copy-paste code — create a shared utility
- **KISS**: Prefer the simplest solution that works; avoid premature abstraction
- **YAGNI**: Do not build features until they are explicitly required
- **Separation of Concerns**: Each layer/module has one well-defined responsibility

## Naming Conventions

- Variables and functions: camelCase, descriptive names (\`getUserById\`, not \`getUser\` or \`g\`)
- Classes and types: PascalCase (\`UserRepository\`, \`CreateUserDto\`)
- Constants: UPPER_SNAKE_CASE (\`MAX_RETRY_COUNT\`)
- Files: kebab-case (\`user-repository.ts\`, \`create-user.dto.ts\`)
- Boolean variables: prefix with \`is\`, \`has\`, \`can\`, \`should\`

## Error Handling

- Never silently catch and discard exceptions
- Always propagate errors to callers or translate to domain-specific errors
- Include context in error messages: what operation failed and why
- Log errors at the boundary where they are handled — not at every layer
- Distinguish recoverable errors (return error result) from unrecoverable ones (throw)

## Immutability

- Prefer \`const\` over \`let\`; never use \`var\`
- Prefer immutable data transformations (map/filter/reduce) over mutation
- Use record/object spread for updates; avoid direct mutation

## Comments

- Comment *why*, not *what* — code should be self-documenting
- Prefer renaming unclear code over adding a comment
- JSDoc/TSDoc for all public API surfaces (functions, types, classes)
- Remove commented-out code — use version control instead

## Import Organization

1. External/standard library imports
2. Internal absolute imports (by path alias)
3. Internal relative imports
4. Type-only imports (last, or grouped with their source)

## Forbidden Patterns

- No \`any\` type in TypeScript (use \`unknown\` and narrow it)
- No \`console.log\` in committed code (use project's logger)
- No hardcoded secrets, tokens, or URLs (use environment variables)
- No nested ternaries (use if/else or extract to a function)
- No functions longer than 40 lines (extract to helpers)
- No files longer than 300 lines (split into modules)

## ASDD Workflow Reminder

Always follow the spec-first workflow:
1. Spec approved → 2. Tests written → 3. Code implemented → 4. Docs updated
Never write implementation code without an approved spec.
`
}

function instructionSpec() {
  return `---
applyTo: ".github/specs/**"
---

# Spec Instructions

These instructions apply to all spec files in \`.github/specs/\`.

## Spec File Requirements

Every spec file must contain all 10 required sections (no section may be omitted or empty):

1. Context & Motivation
2. Goals
3. Non-Goals
4. Actors & Entry Points
5. Functional Requirements
6. Acceptance Criteria ← **must use Given/When/Then format**
7. Data Model
8. API Contract (or "N/A — no API changes")
9. Non-Functional Requirements
10. Open Questions (or "None — all resolved")

## Frontmatter fields

\`\`\`yaml
---
id: FEAT-XXX           # Unique, sequential, never reused
title: "Feature title" # Descriptive, verb-noun form
status: draft          # draft | in-review | approved | done | cancelled
created: YYYY-MM-DD
author: github-handle
agents: tdd-backend, backend, documentation, qa  # which agents will run
---
\`\`\`

## Acceptance Criteria format

Each criterion must use Given/When/Then:
\`\`\`
**Scenario: <name>**
- Given: <precondition that must be true>
- When: <action that the actor performs>
- Then: <expected system response>
- And: <optional additional assertion>
\`\`\`

## Status transitions

\`draft\` → \`in-review\` → \`approved\` → \`done\`

Only move to \`approved\` when:
- All sections are complete
- All Open Questions are resolved
- Acceptance criteria authored in Given/When/Then

Once \`approved\`, spec content must NOT be changed without creating a new FEAT ID.
`
}

function instructionBackend() {
  return `---
applyTo: "{src,app,server,api,lib,services,domain,infrastructure}/**"
---

# Backend Instructions

These instructions apply to all backend source files.

## Architecture

Follow a layered architecture with strict dependency direction (inward only):

\`\`\`
API / Controller   → Application / Use-Case   → Domain   ← Infrastructure
\`\`\`

- **Domain layer**: entities, value objects, domain events, repository interfaces — zero external dependencies
- **Application layer**: use-cases, commands, queries, DTOs — depends only on Domain
- **Infrastructure layer**: repositories, adapters, DB — implements Domain interfaces
- **API layer**: routes, controllers, middleware — calls Application use-cases

## API Design

- Use HTTP verbs correctly: GET (read), POST (create), PUT (full replace), PATCH (partial update), DELETE
- Use plural nouns for resource paths: \`/api/v1/users\`, \`/api/v1/orders\`
- Return proper HTTP status codes: 200 (ok), 201 (created), 204 (no content), 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 422 (unprocessable), 500 (server error)
- Version APIs: \`/api/v1/\`
- Return paginated responses for list endpoints with \`{ data: [], total, page, pageSize }\`

## Validation

- Validate all inputs at the API boundary using a schema validation library
- Never trust client input — validate types, formats, lengths, and ranges
- Return structured validation errors with field-level messages

## Database Patterns

- Never query from controllers — use repositories/services
- Use parameterized queries — never string-concatenate SQL
- Wrap multi-step operations in transactions
- Avoid N+1: use joins or batched queries for related data
- Add indexes for columns used in WHERE/ORDER BY clauses

## Security (OWASP Top 10)

- Parameterized queries for all database access (prevent SQL injection)
- Validate and sanitize all user inputs
- Enforce authentication before accessing protected routes
- Enforce authorization: verify the requester owns/can access the resource
- Never log or expose passwords, tokens, or secret keys
- Set appropriate CORS headers and CSP
- Rate-limit sensitive endpoints (login, password reset, etc.)
`
}

function instructionFrontend() {
  return `---
applyTo: "{src/components,src/pages,src/app,src/features,src/ui}/**"
---

# Frontend Instructions

These instructions apply to all frontend/UI source files.

## Component Design

- One component = one responsibility. If you need a comment to explain what it does, split it.
- Components receive data via props — no internal HTTP calls in components
- Extract data-fetching into custom hooks or a query layer
- Avoid deeply nested component hierarchies (max 4 levels)
- Export named components, not anonymous arrow functions

## State Management

| State type | Where to store |
|------------|----------------|
| Local UI state (open, selected, focused) | \`useState\` inside component |
| Shared UI state (modal, toast, theme) | Context or store |
| Server state (fetched data) | Query library / SWR / React Query |
| URL state (filters, pagination) | URL search params |
| Form state | Form library / controlled inputs |

## Async States (always handle all 3)

\`\`\`
Loading state → show skeleton/spinner, disable interactions
Error state   → show user-friendly message, offer retry
Success state → render data
\`\`\`

Never render data without first handling loading and error states.

## Accessibility

- Use semantic HTML: \`<button>\` for buttons, \`<a>\` for links, \`<nav>\` for navigation
- Every form input must have a visible \`<label>\` or \`aria-label\`
- Images need descriptive \`alt\` text (empty \`alt=""\` for decorative images)
- Interactive elements must be keyboard-operable (Tab, Enter, Space, Esc)
- Manage focus after modal open/close
- Color alone must not convey meaning

## Performance

- Lazy-load routes and heavy components (\`React.lazy\` or dynamic import)
- Memoize only when profiling proves it necessary (\`useMemo\`, \`React.memo\`)
- Never cause layout thrash (batch DOM reads and writes)
- Paginate or virtualize large lists (> 100 items)

## Styling

- Use classes/CSS modules/styled components from the project's styling system
- No inline styles for anything beyond dynamic values
- No hardcoded colors or spacing (use design tokens/theme values)
`
}

function instructionTesting() {
  return `---
applyTo: "**/*.{test,spec}.{ts,tsx,js,jsx,mjs}"
---

# Testing Instructions

These instructions apply to all test files.

## TDD Mandate

**Tests are written BEFORE implementation (Red → Green → Refactor).**

1. **Red**: Write a failing test that describes expected behavior
2. **Green**: Write the minimum code to make the test pass
3. **Refactor**: Clean up without breaking the tests

## Test Organization

- Unit tests co-located with source files: \`user.service.test.ts\` next to \`user.service.ts\`
- Integration tests in \`__tests__/\` or \`tests/\` directory
- E2E tests in \`e2e/\` or \`playwright/\` directory
- Group with \`describe\` blocks matching module/class/function structure
- Test names must describe behavior: \`"should return 404 when user is not found"\`

## AAA Pattern (mandatory)

Every test must have clearly delineated sections:
\`\`\`
// Arrange — set up data, mocks, system state
// Act     — call the code under test (usually one line)
// Assert  — verify outcomes and side effects
\`\`\`

## What to test

✅ Test: public behavior, return values, side effects, error scenarios, boundaries
❌ Do not test: private methods, internal state, implementation details, third-party code

## Mocking rules

- Mock at the boundary of your module (e.g., repository, HTTP client)
- Prefer fakes/stubs over mocks when state matters
- Do not over-mock: if it's fast and deterministic, use the real thing
- Always restore/reset mocks between tests

## Test data

- Use factory functions or builders for test data creation
- No magic strings/numbers in assertions — use named constants
- Never share mutable state between tests

## Coverage targets

| Module type | Minimum coverage |
|-------------|------------------|
| Domain / Business logic | 90% |
| Use-cases / Services | 80% |
| API controllers | 70% |
| UI Components | 70% |
| Utilities | 90% |

## Forbidden patterns

- Never commit tests with \`.only\` or \`.skip\`
- Never use \`setTimeout\` / \`sleep\` in tests — use fake timers or async utilities
- Never test implementation internals (private fields, internal function calls)
- Never assert on exact timestamps — use relative comparisons or mock time
`
}

function instructionSecurity() {
  return `---
applyTo: "**"
---

# Security Instructions

These instructions apply to **all files**.

## OWASP Top 10 (mandatory compliance)

### A01 — Broken Access Control
- Always verify authentication before accessing protected resources
- Always verify authorization: requester must own/have permission for the resource
- Enforce access control at the server — never trust client-side checks
- Default to deny access; explicitly grant permissions

### A02 — Cryptographic Failures
- Never store passwords in plaintext — use bcrypt/argon2 with appropriate cost factor
- Use HTTPS everywhere — never transmit sensitive data over HTTP
- Never log or expose secrets, tokens, passwords, or PII
- Rotate secrets and tokens regularly

### A03 — Injection
- **Always** use parameterized queries or ORMs — never concatenate user input into SQL
- Escape output when rendering user-provided content in HTML
- Validate, sanitize, and encode all inputs at system boundaries

### A07 — Authentication Failures
- Implement account lockout or rate-limiting for authentication endpoints
- Use secure session management (httpOnly, Secure, SameSite cookies)
- Enforce strong password policies
- Use short-lived tokens with refresh token rotation

### A09 — Security Logging
- Log authentication events (login, logout, failed attempts)
- Log authorization failures
- Never log passwords, tokens, PII, or secrets
- Store logs securely and monitor for anomalies

## Secrets management

- All secrets must come from environment variables — never hardcoded
- Never commit \`.env\` files, API keys, or credentials to version control
- Use \`.env.example\` with placeholder values for documentation
- Validate required environment variables at startup

## Input validation

- Validate type, format, length, and range of all inputs
- Reject unexpected fields in request bodies (allowlist, not blocklist)
- Sanitize file uploads: check MIME type, file extension, and content separately

## Dependencies

- Keep dependencies up to date
- Run \`npm audit\` / \`pip-audit\` / \`cargo audit\` regularly
- Remove unused dependencies
`
}

function instructionGit() {
  return `---
applyTo: ".github/**"
---

# Git & Collaboration Instructions

## Commit Message Format (Conventional Commits)

\`\`\`
<type>(<scope>): <short description>

[optional body — explain WHY, not WHAT]

[optional footer — BREAKING CHANGE, Closes #issue, Refs FEAT-XXX]
\`\`\`

### Types
| Type | When to use |
|------|-------------|
| \`feat\` | New feature |
| \`fix\` | Bug fix |
| \`test\` | Adding/updating tests |
| \`docs\` | Documentation only |
| \`refactor\` | Code change that isn't feat or fix |
| \`chore\` | Build, tooling, dependency updates |
| \`perf\` | Performance improvement |
| \`ci\` | CI/CD pipeline changes |

### Rules
- Subject line ≤ 72 characters, imperative mood ("add" not "added")
- Always reference spec ID: \`feat(auth): add email verification (FEAT-042)\`
- Breaking changes: add \`BREAKING CHANGE:\` in footer with migration instructions

## Branch Strategy

\`\`\`
main          — production (protected, requires PR + review)
staging       — pre-production testing
develop       — integration branch (optional)
feat/FEAT-XXX-slug    — feature work
fix/FEAT-XXX-slug     — bug fixes
chore/description     — maintenance
\`\`\`

## Pull Request Rules

- PR title must follow Conventional Commits format
- PR description must link to the spec: "Implements FEAT-XXX"
- All CI checks must pass before merge
- At least one code review approval required
- Squash commits when merging feature branches
- Delete branch after merge
`
}

// ---------------------------------------------------------------------------
// ASDD Skills (slash commands)
// ---------------------------------------------------------------------------

function skillAsddOrchestrate() {
  return `---
name: asdd-orchestrate
description: "Orchestrates the full ASDD pipeline. Phase 1 (Spec) → Phase 2 (Backend ∥ Frontend) → Phase 3 (Tests ∥) → Phase 4 (QA)."
argument-hint: "<feature-name> | status"
---

# ASDD Orchestrate

## Pipeline

\`\`\`
[PHASE 1 — SEQUENTIAL]
  spec → .github/specs/<feature>.spec.md  (DRAFT → APPROVED)

[PHASE 2 — PARALLEL ∥]
  backend  ∥  frontend

[PHASE 3 — PARALLEL ∥]
  tdd-backend  ∥  tdd-frontend

[PHASE 4 — SEQUENTIAL]
  qa → Gherkin scenarios + risk analysis
\`\`\`

## Process
1. Look for \`.github/specs/<feature>.spec.md\`
   - Does not exist → invoke \`/generate-spec\` and wait
   - \`DRAFT\` → ask user to review and approve
   - \`APPROVED\` → update to \`IN_PROGRESS\` and continue
2. Launch Phase 2 in parallel (@backend + @frontend)
3. When Phase 2 completes → launch Phase 3 in parallel (@tdd-backend + @tdd-frontend)
4. When Phase 3 completes → launch Phase 4 (@qa)
5. Update spec to \`IMPLEMENTED\` and report final status

## Status command
When called with \`status\`: list all specs in \`.github/specs/\` with their current status and next pending action.

## Rules
- No spec with \`APPROVED\` status → no code. No exceptions.
- Do not implement directly — only coordinate and delegate.
- If a phase fails → stop the pipeline and report to user with context.
- Phase 5 (documentation) only if explicitly requested.
`
}

function skillGenerateSpec() {
  return `---
name: generate-spec
description: "Generates a technical ASDD spec in .github/specs/<feature>.spec.md. Required before any implementation."
argument-hint: "<feature-name>: <requirement description>"
---

# Generate Spec

## Definition of Ready — validate before generating

A story can generate a spec only if:

- [ ] Clear feature name and one-sentence description provided
- [ ] At least one user story (As a / I want / So that)
- [ ] Acceptance criteria in Given/When/Then format
- [ ] API contract defined if applicable (method, route, request, response, HTTP codes)
- [ ] No ambiguity in scope — open questions are listed

If requirements do not meet DoR → list pending questions before generating.

## Process

1. Check for existing requirement in \`.github/requirements/<feature>.md\` (use it if exists)
2. Read stack: \`.github/instructions/backend.instructions.md\`, \`.github/instructions/frontend.instructions.md\`
3. Explore existing code — do not duplicate existing models or endpoints
4. Validate DoR (above) — list questions if there are ambiguities
5. Use the spec template from \`.github/specs/SPEC-TEMPLATE.md\` EXACTLY
6. Save to \`.github/specs/<feature-name-kebab-case>.spec.md\`

## Required frontmatter

\`\`\`yaml
---
id: FEAT-XXX
title: "<Feature title>"
status: draft
created: YYYY-MM-DD
author: spec-generator
---
\`\`\`

## Required sections

- \`## 1. Context & Motivation\` — why this feature exists
- \`## 2. Goals\` — measurable objectives
- \`## 3. Acceptance Criteria\` — Given/When/Then format
- \`## 4. Data Model\` — entities and relationships
- \`## 5. API Contract\` — endpoints with request/response/codes
- \`## 6. Non-Functional Requirements\` — performance, security, accessibility

## Restrictions

- Read and create only. Do not modify existing code.
- Status always \`draft\`. User approves before implementation.
`
}

function skillImplementBackend() {
  return `---
name: implement-backend
description: "Implements a complete backend feature. Requires spec with status APPROVED in .github/specs/."
argument-hint: "<feature-name>"
---

# Implement Backend

## Prerequisites
1. Read spec: \`.github/specs/<feature>.spec.md\` — sections: API contract, data model
2. Read architecture: \`.github/instructions/backend.instructions.md\`
3. Read coding standards: \`.github/copilot-instructions.md\`

## Implementation order
\`\`\`
Domain → Application → Infrastructure → API
\`\`\`

| Layer | Responsibility | Forbidden |
|-------|---------------|-----------|
| **Domain** | Entities, value objects, business rules, domain interfaces | Framework imports |
| **Application** | Use-cases, DTOs, input validation | Direct DB queries |
| **Infrastructure** | Repository implementations, migrations, adapters | Business logic |
| **API** | Route handlers, DI wiring, request/response mapping | Business logic |

## Rules
- Make tests pass — NEVER modify tests to pass
- Follow naming and patterns from existing code exactly
- Validate all inputs at API boundaries (schema validation)
- Apply OWASP Top 10: parameterized queries, sanitized inputs, auth enforcement
- Reference spec ID in file headers: \`// Spec: FEAT-XXX\`

## Restrictions
- Only backend directory. Do not touch frontend.
- Do not generate tests (responsibility of @tdd-backend).
`
}

function skillImplementFrontend() {
  return `---
name: implement-frontend
description: "Implements a complete frontend feature. Requires spec with status APPROVED in .github/specs/."
argument-hint: "<feature-name>"
---

# Implement Frontend

## Prerequisites
1. Read spec: \`.github/specs/<feature>.spec.md\` — sections: UI requirements, acceptance criteria
2. Read conventions: \`.github/instructions/frontend.instructions.md\`
3. Read coding standards: \`.github/copilot-instructions.md\`

## Implementation checklist
- [ ] Components match spec UI requirements exactly
- [ ] Loading, error, and empty states handled for all async operations
- [ ] Form validation with inline error messages
- [ ] Accessibility: semantic HTML, ARIA attributes, keyboard navigation
- [ ] Responsive layout at mobile and desktop breakpoints
- [ ] API calls go through the project's existing data-fetching layer
- [ ] No business logic in components — extract to hooks or services
- [ ] No inline styles — use project's styling system

## Rules
- Make tests pass — NEVER modify tests to pass
- Follow component structure from existing files exactly
- Single responsibility: one component does one thing
- Reference spec ID in file headers: \`// Spec: FEAT-XXX\`

## Restrictions
- Only frontend directory. Do not touch backend.
- Do not generate tests (responsibility of @tdd-frontend).
`
}

function skillUnitTesting() {
  return `---
name: unit-testing
description: "Generates the full unit test suite for a feature. Run after spec is APPROVED, before or after implementation."
argument-hint: "<feature-name>"
---

# Unit Testing

## Process
1. Read spec: \`.github/specs/<feature>.spec.md\` — acceptance criteria and edge cases
2. Read testing conventions: \`.github/instructions/testing.instructions.md\`
3. Read existing test files to match patterns (naming, structure, helpers, mocks)
4. Generate backend and frontend test suites

## Backend tests to generate

| Layer | File pattern | Content |
|-------|-------------|---------|
| API/Routes | \`tests/routes/test_<feature>_router\` | Integration: HTTP client, auth headers |
| Services | \`tests/services/test_<feature>_service\` | Unit: mock all repos |
| Repositories | \`tests/repositories/test_<feature>_repo\` | Unit: mock DB client |

**Minimum coverage per layer:**
- Happy path (HTTP 200/201)
- Validation error (HTTP 400/422)
- Unauthorized (HTTP 401)
- Not found (HTTP 404)

## Frontend tests to generate

| Type | File pattern | Content |
|------|-------------|---------|
| Components | \`__tests__/<Component>.test\` | Renders, user events, states |
| Hooks | \`__tests__/<hook>.test\` | State transitions, mock API |
| Integration | \`__tests__/<feature>.integration.test\` | Full user flow |

## Rules
- Tests must fail before implementation (Red phase) — verify with test runner
- Mock all external dependencies at system boundaries
- Use business-readable test names, not implementation details
- Add spec ID at the top of each test file: \`// Spec: FEAT-XXX\`
- NEVER modify existing passing tests
`
}

function skillGherkinCaseGenerator() {
  return `---
name: gherkin-case-generator
description: "Maps critical flows, generates Gherkin scenarios, and defines test data from the spec. Output in docs/output/qa/."
argument-hint: "<feature-name>"
---

# Gherkin Case Generator

## Process
1. Read spec: \`.github/specs/<feature>.spec.md\` — acceptance criteria and business rules
2. Identify critical flows (happy paths + error paths + edge cases)
3. Generate one Gherkin scenario per acceptance criterion
4. Define synthetic test data per scenario
5. Save to \`docs/output/qa/<feature>-gherkin.md\`

## Critical flows — identify first

| Type | Impact | Tag |
|------|--------|-----|
| Main happy path | High | \`@smoke @critical\` |
| Input validation | Medium | \`@error-path\` |
| Authorization/auth | High | \`@smoke @security\` |
| Edge case | Variable | \`@edge-case\` |

## Gherkin format

\`\`\`gherkin
Feature: [feature in business language]
  As a [actor]
  I want to [goal]
  So that [benefit]

  @smoke @critical
  Scenario: [successful flow]
    Given [precondition]
    When [user action]
    Then [verifiable result]

  @error-path
  Scenario: [expected error]
    Given [precondition]
    When [invalid action]
    Then [appropriate error message is shown]
    And [the operation is NOT performed]
\`\`\`

## Rules
- Business language only — no API routes or technical IDs in Gherkin
- Scenarios must be independent (no shared mutable state)
- One scenario per acceptance criterion at minimum
- Include a test data table for scenarios with multiple inputs
`
}

function skillRiskIdentifier() {
  return `---
name: risk-identifier
description: "Classifies risks for a feature using the ASD risk rule (High/Medium/Low). Output in docs/output/qa/."
argument-hint: "<feature-name>"
---

# Risk Identifier

## Process
1. Read spec: \`.github/specs/<feature>.spec.md\`
2. Read implemented code for the feature
3. Identify all risk vectors
4. Classify each risk by probability × impact
5. Save to \`docs/output/qa/<feature>-risks.md\`

## ASD Risk Rule

\`\`\`
Risk Level = Probability × Impact

HIGH   = likely to occur AND significant damage if it does
MEDIUM = either likely OR significant impact, not both
LOW    = unlikely AND low damage
\`\`\`

## Risk vectors to evaluate

| Vector | Examples |
|--------|---------|
| **Security** | Auth bypass, injection, data exposure, IDOR |
| **Data integrity** | Missing validation, race conditions, partial updates |
| **Performance** | N+1 queries, missing indexes, unbounded results |
| **Availability** | No timeout on external calls, cascading failures |
| **User experience** | Missing error states, inaccessible UI, confusing flows |
| **Compliance** | PII handling, audit trail, retention policies |

## Output format

\`\`\`markdown
## Risk Matrix — <Feature>

| ID | Risk | Vector | Probability | Impact | Level | Mitigation |
|----|------|--------|-------------|--------|-------|-----------|
| R-01 | [description] | Security | High | High | **HIGH** | [action] |
\`\`\`

## Rules
- Every HIGH risk must have a concrete mitigation action
- Do not mark risks as LOW without justification
- If a risk is already mitigated in code, note it as "Mitigated: [how]"
`
}

// ---------------------------------------------------------------------------
// Git hooks and tooling
// ---------------------------------------------------------------------------

function commitlintConfig() {
  return `/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'test', 'docs', 'refactor', 'chore', 'perf', 'ci', 'build', 'revert'],
    ],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 200],
  },
}
`
}

function lintStagedConfig() {
  return `/** @type {import('lint-staged').Configuration} */
export default {
  // TypeScript / JavaScript
  '*.{ts,tsx,mts,cts}': ['tsc --noEmit'],
  '*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}': ['eslint --fix', 'prettier --write'],

  // Styles
  '*.{css,scss,sass}': ['prettier --write'],

  // Markdown
  '*.{md,mdx}': ['prettier --write'],

  // JSON / YAML
  '*.{json,yaml,yml}': ['prettier --write'],
}
`
}

// ---------------------------------------------------------------------------
// VS Code configuration
// ---------------------------------------------------------------------------

function vscodeSettings() {
  return JSON.stringify({
    'github.copilot.chat.agent.enabled': true,
    'github.copilot.chat.codeGeneration.instructions': [
      { file: '.github/copilot-instructions.md' },
    ],
    'editor.formatOnSave': true,
    'editor.defaultFormatter': 'esbenp.prettier-vscode',
    'editor.codeActionsOnSave': {
      'source.fixAll.eslint': 'explicit',
    },
    'editor.rulers': [100],
    'files.trimTrailingWhitespace': true,
    'files.insertFinalNewline': true,
    'files.associations': {
      '*.instructions.md': 'markdown',
      '*.agent.md': 'markdown',
      '*.prompt.md': 'markdown',
    },
    'markdown.validate.enabled': true,
  }, null, 2)
}

function vscodeExtensions() {
  return JSON.stringify({
    recommendations: [
      'GitHub.copilot',
      'GitHub.copilot-chat',
      'esbenp.prettier-vscode',
      'dbaeumer.vscode-eslint',
      'streetsidesoftware.code-spell-checker',
      'eamodio.gitlens',
      'usernamehw.errorlens',
      'bradlc.vscode-tailwindcss',
      'Prisma.prisma',
    ],
  }, null, 2)
}

// ---------------------------------------------------------------------------
// Root documentation
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
   Parallel: @tdd-backend + @tdd-frontend + @backend + @frontend

3. Parallel: @documentation + @qa + @orchestrator (validate)
\`\`\`
`
}

function changelog(name, date) {
  return `# Changelog — ${name}

All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [Unreleased]

### Added

- ASDD infrastructure generated on ${date}

---

## [0.1.0] — ${date}

### Added

- Initial project setup
`
}

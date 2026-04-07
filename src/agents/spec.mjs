import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a senior software architect specialized in Spec Driven Development.
Your task is to analyze a project's documentation and produce specification documents
and agent definitions that serve as the foundation for all subsequent AI agents.

You MUST detect and respect the architecture patterns already established in the project.
If no patterns are documented, apply SOLID, DRY, KISS, and YAGNI as defaults.

Output format: Pure markdown. No prose intro or closing remarks outside the document.`

/**
 * Generates the project specification scaffold.
 *
 * @param {object} params
 * @returns {Promise<Record<string, string>>}
 */
export async function runSpecAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)
  const archPrinciples = ctx.architecturePatterns?.principles?.join(', ') || 'SOLID, DRY, KISS, YAGNI'
  const detectedPatterns = ctx.architecturePatterns?.detected?.length
    ? `Detected architecture patterns: ${ctx.architecturePatterns.detected.join(', ')}.`
    : 'No specific architecture patterns detected — use SOLID, DRY, KISS, YAGNI as defaults.'

  const [instructionsContent, agentContent] = await Promise.all([
    // ---------- copilot-instructions.md ----------
    chat({
      token,
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `${contextBlock}

Generate a \`copilot-instructions.md\` file for this project.
This is the main instruction file loaded by GitHub Copilot for every interaction.

Architecture context: ${detectedPatterns}
Design principles to enforce: ${archPrinciples}

The file must include:
1. **Project overview** — Purpose, domain, and target audience
2. **Architecture** — Describe the detected/default architecture layers with a diagram.
   If patterns were detected (${ctx.architecturePatterns?.detected?.join(', ') || 'none'}),
   document them specifically. If not, describe a clean layered architecture.
3. **Design principles** — For each principle in [${archPrinciples}], write 2-3 specific,
   actionable rules. Do NOT list generic definitions — write project-specific directives.
4. **Tech stack** — Technologies, frameworks, and their roles in this project
5. **Coding standards** — Language conventions, naming, formatting specific to this stack
6. **Key domain concepts** — Business entities, vocabulary, bounded contexts from the docs
7. **ASDD Workflow (mandatory section — describe this exactly)**:

   \`\`\`
   Step 1 — SPEC (sequential, prerequisite for everything)
     Developer or @spec agent creates .github/specs/FEAT-<id>-<slug>.md
     Spec must be approved (status: approved) before continuing

   Step 2 — PARALLEL (triggered once spec is approved)
     @tdd-backend   → writes backend tests reading the spec
     @tdd-frontend  → writes frontend tests reading the spec
     @backend       → implements backend code to pass tests
     @frontend      → implements frontend code to pass tests

   Step 3 — PARALLEL (triggered after step 2)
     @documentation → generates docs from spec + code
     @qa            → generates Gherkin scenarios from acceptance criteria
     @orchestrator  → validates the full pipeline output
   \`\`\`

   **Rules:**
   - No agent in Step 2 or 3 runs without a spec file with status: approved
   - All agents must read the spec file before generating anything
   - All generated code must reference the spec ID in file headers and commit messages

8. **AI agent roles** — Brief description of each ASDD agent and when to invoke it
9. **Security constraints** — OWASP Top 10 compliance, secret management, input validation rules

Write in clear, directive language (imperative: "Use X", "Always Y", "Never Z").
Be specific to this project — avoid generic boilerplate.
`,
        },
      ],
    }),

    // ---------- agents/spec.agent.md ----------
    chat({
      token,
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `${contextBlock}

Generate \`agents/spec.agent.md\` — a GitHub Copilot agent definition file.

Architecture context: ${detectedPatterns}

This agent is invoked when a developer needs to create a new feature specification.
The agent must:

1. Ask for the feature name, ID, and brief description
2. Read \`copilot-instructions.md\` and existing specs in \`.github/specs/\` for context
3. Ask clarifying questions about the feature (scope, actors, integrations, constraints)
4. Identify which architecture layers will be touched (${archPrinciples})
5. Produce a complete spec following \`.github/instructions/spec.instructions.md\`
6. Save as \`.github/specs/FEAT-<id>-<kebab-slug>.md\` with status: draft
7. Tell the developer: "Review the spec. When ready, set status to 'approved' and run @orchestrator"

The agent MUST enforce:
- Every spec has a unique FEAT-XXX ID (check existing specs to avoid collisions)
- All 10 sections of the template are filled (no empty sections)
- Acceptance criteria are written in Given/When/Then format
- Non-functional requirements are explicit and measurable ("response time < 200ms p99")
- Data model section reflects the project's actual domain entities

Use YAML frontmatter format compatible with GitHub Copilot agent files (.agent.md):
  name: spec
  description: (keyword-rich: spec, feature, ASDD, specification, draft)
  model: Claude Haiku 4.5 (copilot)
  tools:
    - read/readFile
    - edit/createFile
    - edit/editFiles
    - search/listDirectory
    - search
  agents: []
  handoffs:
    - label: "Orquestar pipeline completo" → agent: orchestrator, prompt: "La spec está lista. Coordina el pipeline ASDD completo.", send: false
    - label: "Implementar Backend" → agent: backend, prompt: "La spec está lista. Implementa el backend cuando el status sea approved.", send: false
    - label: "Implementar Frontend" → agent: frontend, send: false
`,
        },
      ],
    }),
  ])

  const specTemplate = generateSpecTemplate(ctx)

  return {
    'copilot-instructions.md': instructionsContent,
    'agents/spec.agent.md': agentContent,
    'specs/SPEC-TEMPLATE.md': specTemplate,
  }
}

// ---------------------------------------------------------------------------
// Static spec template (deterministic)
// ---------------------------------------------------------------------------

function generateSpecTemplate(ctx) {
  const date = new Date().toISOString().split('T')[0]
  const archPrinciples = ctx.architecturePatterns?.principles?.join(', ') || 'SOLID, DRY, KISS, YAGNI'

  return `---
id: FEAT-XXX
title: "<Feature title>"
status: draft
created: ${date}
author: "<github-handle>"
agents: tdd-backend, tdd-frontend, backend, frontend, documentation, qa
---

# FEAT-XXX — <Feature title>

> **ASDD**: Set \`status: approved\` in the frontmatter, then run \`@orchestrator\` to trigger the full pipeline.
>
> Principles enforced: ${archPrinciples}

## 1. Context & Motivation

Why does this feature exist? What problem does it solve?
Reference related issues (e.g. Closes #123).

## 2. Goals

What this feature must achieve (measurable objectives).

- Goal 1
- Goal 2

## 3. Non-Goals

What is explicitly out of scope.

## 4. Actors & Entry Points

| Actor | Entry point | Description |
|-------|-------------|-------------|
| User  | UI / API    | ...         |

## 5. Functional Requirements

- REQ-1:
- REQ-2:
- REQ-3:

## 6. Acceptance Criteria

**Scenario: <happy path>**
- Given: <precondition>
- When: <action>
- Then: <expected outcome>

**Scenario: <error case>**
- Given: <precondition>
- When: <invalid action>
- Then: <error message is shown>

## 7. Data Model

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

Request:  { "field": "value" }
Response 201: { "id": "...", "field": "value" }
Response 422: { "error": "validation_failed", "details": [...] }
\`\`\`

## 9. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Response time | p99 < 500ms |
| Test coverage | ≥ 80% new code |
| Accessibility | WCAG 2.1 AA |

## 10. Open Questions

- [ ] Question 1
`
}



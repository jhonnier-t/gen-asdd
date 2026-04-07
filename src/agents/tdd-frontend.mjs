import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a senior frontend engineer and TDD practitioner.
Produce a GitHub Copilot agent definition for frontend TDD (Red phase).

Detect the project's component patterns, testing framework, and styling system from context.
Generate instructions that enforce those specific patterns.

Output format: Pure markdown with YAML frontmatter. No extra prose.`

/**
 * Generates frontend TDD agent file.
 * @param {object} params
 * @returns {Promise<{ 'agents/tdd-frontend.agent.md': string, 'prompts/03-tdd-frontend.prompt.md': string }>}
 */
export async function runTddFrontendAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)
  const stack = ctx.techStack.join(', ') || 'generic'
  const archPrinciples = ctx.architecturePatterns?.principles?.join(', ') || 'SOLID, DRY, KISS'
  const detectedPatterns = ctx.architecturePatterns?.detected?.length
    ? `The project uses: ${ctx.architecturePatterns.detected.join(', ')}.`
    : 'No specific patterns detected — use component-driven design with SOLID as defaults.'

  const agentContent = await chat({
    token,
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `${contextBlock}

Generate \`agents/tdd-frontend.agent.md\` — a GitHub Copilot agent for frontend TDD (Red phase).

Architecture context: ${detectedPatterns}
Principles: ${archPrinciples}
Tech stack: ${stack}

This agent writes FAILING frontend tests before any UI is implemented.
It must:

1. Read the approved feature spec from .github/specs/
2. Read .github/instructions/testing.instructions.md and .github/instructions/frontend.instructions.md
3. Map each UI acceptance criterion to one or more component tests
4. Write tests using accessible selectors (getByRole, getByLabelText) — not data-testid first
5. Cover all 3 async states: loading, error, success/populated
6. Cover: form validation errors, empty states, accessibility (ARIA, keyboard nav)
7. Mock all API calls at the network boundary
8. Write tests that FAIL before implementation — verify this
9. NEVER write any implementation code

Test frameworks for this stack (${stack}):
Choose from: Vitest + Testing Library, Jest + RTL, Playwright, Cypress, Storybook.

Include YAML frontmatter:
  name: tdd-frontend
  description: (keyword-rich: frontend tests, TDD Red, component testing, test-first)
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
    - label: "Implementar Frontend" → agent: frontend, prompt: "Los tests de frontend están listos y fallan (Red phase). Implementa el código para hacerlos pasar.", send: false
    - label: "Volver al Orchestrator" → agent: orchestrator, send: false — a reusable TDD prompt for frontend tests.

Architecture: ${detectedPatterns}

Structure with:
- Variables: {{spec_file}}, {{component_name}}, {{feature_name}}
- Test coverage checklist (render, interaction, a11y, async states)
- Mock strategy for API/router/auth context
- \"Tests must fail\" verification step
- Output: list of test files with paths

Use YAML frontmatter with mode: agent.
`,
      },
    ],
  })

  return {
    'agents/tdd-frontend.agent.md': agentContent,
    'prompts/03-tdd-frontend.prompt.md': promptContent,
  }
}

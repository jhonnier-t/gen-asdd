import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a senior backend engineer and TDD practitioner.
Produce a GitHub Copilot agent definition that guides AI agents to write backend tests
BEFORE any implementation code is written (Red phase of TDD).

You MUST detect the project's testing framework, test conventions, and architecture patterns
from the context, then generate an agent definition that enforces those specific patterns.

Output format: Pure markdown with YAML frontmatter. No extra prose.`

/**
 * Generates backend TDD agent file.
 * @param {object} params
 * @returns {Promise<{ 'agents/tdd-backend.agent.md': string, 'prompts/02-tdd-backend.prompt.md': string }>}
 */
export async function runTddBackendAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)
  const stack = ctx.techStack.join(', ') || 'generic'
  const archPrinciples = ctx.architecturePatterns?.principles?.join(', ') || 'SOLID, DRY, KISS'
  const detectedPatterns = ctx.architecturePatterns?.detected?.length
    ? `The project uses: ${ctx.architecturePatterns.detected.join(', ')}.`
    : 'No specific patterns detected — use Clean Architecture with SOLID as defaults.'

  const agentContent = await chat({
    token,
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `${contextBlock}

Generate \`agents/tdd-backend.agent.md\` — a GitHub Copilot agent for backend TDD (Red phase).

Architecture context: ${detectedPatterns}
Principles: ${archPrinciples}
Tech stack: ${stack}

This agent is invoked with @tdd-backend to write FAILING tests before any implementation.
It must:

1. Read the approved feature spec from .github/specs/
2. Read .github/instructions/testing.instructions.md for testing conventions
3. Identify every backend unit that will be needed:
   - Based on the architecture (${ctx.architecturePatterns?.detected?.join(', ') || 'layered'}),
     identify the layers and classes/functions to test
   - Services/use-cases, repositories, domain entities, API handlers
4. Write tests using AAA pattern (Arrange / Act / Assert):
   - One describe block per module/class
   - One it/test block per behavior (not per method)
   - Tests must FAIL before implementation — verify this
5. Cover for each unit: happy path, validation error, not-found, unauthorized
6. Mock all external dependencies at the correct boundary
7. Define test data factories for test setup
8. NEVER write implementation code

Tech stack test frameworks: ${stack} (use appropriate framework: Jest/Vitest/pytest/JUnit etc.)

Include YAML frontmatter:
  name: tdd-backend
  description: (keyword-rich: backend tests, TDD Red, unit testing, test-first)
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
    - label: "Implementar Backend" → agent: backend, prompt: "Los tests de backend están listos y fallan (Red phase). Implementa el código para hacerlos pasar.", send: false
    - label: "Volver al Orchestrator" → agent: orchestrator, send: false — a reusable TDD prompt for backend tests.

Architecture: ${detectedPatterns}

Structure with:
- Variables: {{spec_file}}, {{module_path}}, {{layer}}
- Test coverage checklist per architecture layer
- Mocking strategy for external dependencies
- "Tests must fail" verification step
- Output: list of test files with paths and coverage targets

Use YAML frontmatter with mode: agent.
`,
      },
    ],
  })

  return {
    'agents/tdd-backend.agent.md': agentContent,
    'prompts/02-tdd-backend.prompt.md': promptContent,
  }
}

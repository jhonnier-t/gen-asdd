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
 * @returns {Promise<{ 'agents/tdd-backend.agent.md': string, 'prompts/tdd-backend.prompt.md': string }>}
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

Genera un prompt reutilizable para escritura de pruebas de backend que deben FALLAR (TDD Red phase).

IMPORTANT - use this EXACT frontmatter format (GitHub Copilot .prompt.md convention):
\`\`\`yaml
---
name: tdd-backend
description: <keyword-rich one-line description>
argument-hint: "nombre-del-feature"
agent: tdd-backend
tools:
  - edit/createFile
  - edit/editFiles
  - read/readFile
  - search/listDirectory
  - search
  - execute/runInTerminal
---
\`\`\`

Rules:
- "agent" field must contain the agent NAME - NOT "mode: agent"
- Variables use \${input:featureName:nombre del feature en kebab-case} syntax - NOT {{mustache}}
- Do NOT include a "mode" field
- Body: imperative numbered steps in Spanish with concrete file-path references

Body must cover:
1. Leer spec en .github/specs/\${input:featureName}.spec.md - criterios de aceptacion
2. Escribir una prueba por criterio + casos de error (400/422, 401, 404)
3. Verificar que TODAS las pruebas FALLAN antes de entregar
4. NO escribir codigo de implementacion - solo pruebas
Restricciones: referencia Spec ID en encabezado, no modificar pruebas existentes
`,
      },
    ],
  })

  return {
    'agents/tdd-backend.agent.md': agentContent,
    'prompts/tdd-backend.prompt.md': promptContent,
  }
}

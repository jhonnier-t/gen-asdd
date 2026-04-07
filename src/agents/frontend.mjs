import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a senior frontend engineer.
Produce a GitHub Copilot agent definition that guides frontend UI implementation
following existing tests (TDD Green phase) and the project's component patterns.

Detect the component architecture, styling system, and state management patterns from
the project context. Generate instructions that enforce those specific patterns.

Output format: Pure markdown with YAML frontmatter. No extra prose.`

/**
 * Generates frontend implementation agent file.
 * @param {object} params
 * @returns {Promise<{ 'agents/frontend.agent.md': string, 'prompts/frontend.prompt.md': string }>}
 */
export async function runFrontendAgent({ token, model, ctx }) {
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

Generate \`agents/frontend.agent.md\` — a GitHub Copilot agent for frontend implementation.

Architecture context: ${detectedPatterns}
Principles: ${archPrinciples}
Tech stack: ${stack}

This agent implements UI code to make failing frontend tests pass.
It must:

1. Read the feature spec and failing test files before writing any code
2. Scan the existing component structure to identify patterns:
   - Component naming, folder layout, barrel exports
   - Styling approach (CSS modules, Tailwind, styled-components, etc.)
   - State management (local useState, context, Zustand, Redux, etc.)
   - Data fetching (React Query, SWR, useFetch, direct fetch, etc.)
3. Implement following Single Responsibility: one component = one job
4. Make all tests pass — NEVER modify tests to pass
5. Handle ALL 3 async states: loading (skeleton/spinner), error (message + retry), success
6. Handle empty states for lists/collections
7. Accessibility (WCAG 2.1 AA): semantic HTML, ARIA labels, keyboard navigation, focus management
8. No business logic in components — extract to hooks/services
9. Match existing file structure and naming exactly

The agent definition must include a component implementation checklist and
specific accessibility checks for this stack (${stack}).

Include YAML frontmatter:
  name: frontend
  description: (keyword-rich: frontend, UI, implementation, TDD Green, components)
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
    - label: "Implementar Backend" → agent: backend, send: false
    - label: "Generar Tests de Frontend" → agent: tdd-frontend, prompt: "El frontend está implementado. Genera las pruebas de componentes.", send: false
    - label: "Volver al Orchestrator" → agent: orchestrator, send: false
`,
      },
    ],
  })

  const promptContent = await chat({
    token,
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `${contextBlock}

Generate \`prompts/frontend.prompt.md\` — a reusable prompt for frontend implementation.

Architecture: ${detectedPatterns}

Genera un prompt reutilizable para implementacion de frontend (TDD Green phase).

IMPORTANT - use this EXACT frontmatter format (GitHub Copilot .prompt.md convention):
\`\`\`yaml
---
name: frontend-task
description: <keyword-rich one-line description>
argument-hint: "nombre-del-feature"
agent: frontend
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
1. Leer spec en .github/specs/\${input:featureName}.spec.md - seccion UI/UX
2. Leer pruebas fallidas - son el contrato de los componentes
3. Implementar componentes que satisfagan las expectativas de las pruebas
4. Manejar los 3 estados asincronos: carga, error, exito
5. Verificar que TODAS las pruebas pasan
Restricciones: seguir .github/instructions/frontend.instructions.md, no logica de negocio en componentes
`,
      },
    ],
  })

  return {
    'agents/frontend.agent.md': agentContent,
    'prompts/frontend.prompt.md': promptContent,
  }
}

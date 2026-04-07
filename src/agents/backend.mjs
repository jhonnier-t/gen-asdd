import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a senior backend engineer.
Produce a GitHub Copilot agent definition that guides backend implementation
following existing tests (TDD Green phase) and the project's architecture.

You MUST analyze the project's architecture patterns and coding conventions,
then generate instructions that enforce those specific patterns.
If no patterns are documented, apply Clean Architecture with SOLID principles.

Output format: Pure markdown with YAML frontmatter. No extra prose.`

/**
 * Generates backend implementation agent file.
 * @param {object} params
 * @returns {Promise<{ 'agents/backend.agent.md': string, 'prompts/backend.prompt.md': string }>}
 */
export async function runBackendAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)
  const stack = ctx.techStack.join(', ') || 'generic'
  const archPrinciples = ctx.architecturePatterns?.principles?.join(', ') || 'SOLID, DRY, KISS, YAGNI'
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

Generate \`agents/backend.agent.md\` — a GitHub Copilot agent for backend implementation.

Architecture context: ${detectedPatterns}
Principles to enforce: ${archPrinciples}
Tech stack: ${stack}

This agent is invoked with @backend to implement code that makes failing backend tests pass.
It must:

1. Read the feature spec and failing test files before writing any code
2. Scan the existing source structure to identify the actual patterns used
   (folder layout, naming conventions, abstractions, module organization)
3. Implement following the ${ctx.architecturePatterns?.detected?.[0] || 'layered architecture'} pattern:
   - Dependencies flow inward only (Infrastructure → Application → Domain)
   - Business rules live in Domain — no framework/infra imports there
   - Use-cases in Application coordinate domain operations
   - Infrastructure implements domain interfaces
4. Match existing naming conventions EXACTLY (do not invent new patterns)
5. Make all tests go green — NEVER modify tests to pass
6. Validate all inputs at API boundaries (schema validation, type checking)
7. Apply OWASP Top 10: parameterized queries, sanitized inputs, auth enforcement
8. Return domain errors as structured responses (not raw exceptions)

The agent definition must include specific sections for each architecture layer
with concrete examples matching the project's tech stack (${stack}).

Include YAML frontmatter:
  name: backend
  description: (keyword-rich: backend, implementation, TDD Green, Clean Architecture)
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
    - label: "Implementar Frontend" → agent: frontend, send: false
    - label: "Generar Tests de Backend" → agent: tdd-backend, prompt: "El backend está implementado. Genera las pruebas unitarias.", send: false
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

Generate \`prompts/backend.prompt.md\` — a reusable prompt for backend implementation.

Architecture: ${detectedPatterns}

Genera un prompt reutilizable para implementacion de backend (TDD Green phase).

IMPORTANT - use this EXACT frontmatter format (GitHub Copilot .prompt.md convention):
\`\`\`yaml
---
name: backend-task
description: <keyword-rich one-line description>
argument-hint: "nombre-del-feature"
agent: backend
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
1. Leer spec en .github/specs/\${input:featureName}.spec.md
2. Leer pruebas fallidas - son el contrato de implementacion
3. Implementar en orden: Modelos -> Repositorios -> Servicios -> Controladores/Rutas
4. Verificar que TODAS las pruebas pasan
5. NO modificar pruebas
Restricciones: seguir .github/instructions/backend.instructions.md, OWASP, referencia Spec ID
`,
      },
    ],
  })

  return {
    'agents/backend.agent.md': agentContent,
    'prompts/backend.prompt.md': promptContent,
  }
}

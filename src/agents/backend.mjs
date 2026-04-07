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
 * @returns {Promise<{ 'agents/backend.agent.md': string, 'prompts/04-backend.prompt.md': string }>}
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

Generate \`prompts/04-backend.prompt.md\` — a reusable prompt for backend implementation.

Architecture: ${detectedPatterns}

Structure with:
- Variables: {{spec_file}}, {{layer}}, {{test_file_path}}
- Per-layer implementation checklist (Domain → Application → Infrastructure → API)
- Security checklist (OWASP items to verify before finishing)
- Output expectations (file paths, function signatures, exports)
- "Definition of Done" section: all tests pass, no security violations, conventions matched

Use YAML frontmatter with mode: agent.
`,
      },
    ],
  })

  return {
    'agents/backend.agent.md': agentContent,
    'prompts/04-backend.prompt.md': promptContent,
  }
}

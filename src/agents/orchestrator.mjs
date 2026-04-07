import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a software engineering orchestrator that manages AI agents.
Produce a GitHub Copilot orchestrator agent definition that coordinates
all ASDD sub-agents following the project's architecture patterns.

Output format: Pure markdown with YAML frontmatter. No extra prose.`

export async function runOrchestratorAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)
  const archPrinciples = ctx.architecturePatterns?.principles?.join(', ') || 'SOLID, DRY, KISS, YAGNI'
  const detectedPatterns = ctx.architecturePatterns?.detected?.length
    ? `The project uses: ${ctx.architecturePatterns.detected.join(', ')}.`
    : 'No specific patterns detected — use SOLID, DRY, KISS, YAGNI as defaults.'

  const agentContent = await chat({
    token,
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `${contextBlock}

Generate \`agents/orchestrator.agent.md\` — the meta-orchestrator GitHub Copilot agent.

Architecture context: ${detectedPatterns}
Principles: ${archPrinciples}

This agent is invoked with @orchestrator to coordinate the full ASDD pipeline.
Pipeline rules:

**Prerequisite (must complete first):**
  @spec → generates feature spec; nothing else runs without an approved spec

**Parallel group 1 — TDD Red Phase (after spec approved):**
  @tdd-backend + @tdd-frontend write failing tests
  Tests MUST fail — no implementation exists yet. Verify failure before proceeding.

**Parallel group 2 — TDD Green Phase (after group 1 tests confirmed failing):**
  @backend + @frontend implement code to make tests pass
  ALL tests MUST pass before moving to group 3.

**Parallel group 3 (after group 2):**
  @documentation + @qa

The orchestrator agent must:
1. Validate the spec exists with status: approved (halt if not)
2. Verify all required sections are present and non-empty
3. Coordinate parallel execution of each group
4. Validate that ALL tests pass before moving to group 2
5. Report partial failures without blocking unaffected agents
6. Enforce that architecture principles (${archPrinciples}) are followed in outputs
7. Produce a completion summary: files generated, tests passed, coverage met

Include a \"Usage\" section with concrete invocation examples.
Include YAML frontmatter with:
  name: orchestrator
  description: (keyword-rich, mention ASDD, pipeline, spec, coordinate)
  tools:
    - read/readFile
    - search/listDirectory
    - search
    - agent
  agents: (list all sub-agent names: spec, tdd-backend, tdd-frontend, backend, frontend, documentation, qa)
  handoffs: (one handoff per phase step, format: label / agent / prompt / send)
    - "[1] Generar Spec" → agent: spec, send: true
    - "[2A] Tests Backend — Red Phase (paralelo)" → agent: tdd-backend, send: false
    - "[2B] Tests Frontend — Red Phase (paralelo)" → agent: tdd-frontend, send: false
    - "[3A] Implementar Backend — Green Phase (paralelo)" → agent: backend, send: false
    - "[3B] Implementar Frontend — Green Phase (paralelo)" → agent: frontend, send: false
    - "[4] Escenarios QA" → agent: qa, send: false
    - "[5] Documentación (opcional)" → agent: documentation, send: false
  (do NOT include a model field — orchestrator inherits default)
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

Generate \`prompts/orchestrate.prompt.md\` — the main ASDD orchestration prompt.

Architecture: ${detectedPatterns}

Use this EXACT frontmatter format (matching GitHub Copilot .prompt.md convention):
\`\`\`yaml
---
name: full-flow
description: <keyword-rich description mentioning ASDD pipeline, spec, TDD, phases>
argument-hint: "<nombre-feature>"
agent: orchestrator
tools:
  - read/readFile
  - search/listDirectory
  - search
  - agent
---
\`\`\`

IMPORTANT rules for the frontmatter:
- Use "agent" field with the agent name — NOT "mode: agent"
- Use \`\${input:featureName:nombre del feature en kebab-case}\` for variables — NOT {{mustache}} syntax
- Do NOT include a "mode" field

Body structure:
- Opening: "Orquesta el flujo ASDD completo para el feature especificado."
- Feature variable line: "**Feature**: \${input:featureName:nombre del feature en kebab-case}"
- Numbered steps covering: spec validation, Phase 2 TDD Red (parallel), Phase 3 TDD Green (parallel), Phase 4 QA
- Each phase must include checkpoint: verify tests FAIL after Phase 2, verify tests PASS after Phase 3
- Final validation checklist (tests pass, CHANGELOG updated, spec status updated)
`,
      },
    ],
  })

  return {
    'agents/orchestrator.agent.md': agentContent,
    'prompts/orchestrate.prompt.md': promptContent,
  }
}


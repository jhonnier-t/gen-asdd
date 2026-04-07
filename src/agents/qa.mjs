import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a QA engineer specializing in behavior-driven development (BDD),
Gherkin scenario writing, and acceptance test automation.
Produce a GitHub Copilot agent that generates Gherkin feature files and acceptance tests.

Output format: Pure markdown with YAML frontmatter. No extra prose.`

export async function runQaAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)
  const stack = ctx.techStack.join(', ') || 'generic'

  const agentContent = await chat({
    token,
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `${contextBlock}

Generate \`agents/qa.agent.md\` — a GitHub Copilot agent for QA and Gherkin scenarios.

Tech stack: ${stack}

This agent is invoked with @qa to produce acceptance tests from a feature specification.
It must:

1. Read the feature spec and its acceptance criteria
2. Produce **Gherkin feature files** covering:
   - Happy path scenario for each acceptance criterion
   - Negative/error scenarios (invalid input, unauthorized, missing data)
   - Edge cases (boundary values, empty collections, concurrent operations)
3. Write Gherkin in business language — no implementation details in steps
4. Use Scenario Outline + Examples for parameterized tests
5. Tag scenarios: @smoke for critical paths, @regression for edge cases
6. Save to \`.github/specs/scenarios/FEAT-<id>-<slug>.feature\`
7. Every acceptance criterion must map to at least one scenario

Gherkin quality rules:
- Use \"Given/When/Then\" strictly (not And/But to start a step)
- One behavior per scenario (one When per scenario)
- Scenarios are independent — no shared mutable state between them
- Reference spec ID in Feature docstring

Include YAML frontmatter:
  name: qa
  description: (keyword-rich: QA, Gherkin, acceptance scenarios, risk, BDD)
  model: Claude Sonnet 4.6 (copilot)
  tools:
    - read/readFile
    - edit/createFile
    - edit/editFiles
    - search/listDirectory
    - search
  agents: []
  handoffs:
    - label: "Volver al Orchestrator" → agent: orchestrator, prompt: "QA completado. Escenarios y riesgos disponibles. Revisa el estado del flujo ASDD.", send: false — a reusable QA prompt.

Structure with:
- Variables: {{spec_file}}, {{feat_id}}, {{slug}}
- Scenario coverage matrix (happy path / negative / edge / boundary)
- Gherkin quality checklist
- Output: .feature file path with all scenarios

Use YAML frontmatter with mode: agent.
`,
      },
    ],
  })

  return {
    'agents/qa.agent.md': agentContent,
    'prompts/07-qa-scenarios.prompt.md': promptContent,
  }
}


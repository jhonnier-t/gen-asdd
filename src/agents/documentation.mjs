import { chat, buildContextBlock } from '../llm.mjs'

const SYSTEM = `You are a technical writer and documentation engineer.
Produce a GitHub Copilot agent that auto-generates developer documentation
aligned with the project's architecture patterns and coding conventions.

Output format: Pure markdown with YAML frontmatter. No extra prose.`

export async function runDocumentationAgent({ token, model, ctx }) {
  const contextBlock = buildContextBlock(ctx)
  const stack = ctx.techStack.join(', ') || 'generic'
  const detectedPatterns = ctx.architecturePatterns?.detected?.length
    ? `The project uses: ${ctx.architecturePatterns.detected.join(', ')}.`
    : 'No specific patterns detected — document using layered architecture as baseline.'

  const agentContent = await chat({
    token,
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `${contextBlock}

Generate \`agents/documentation.agent.md\` — a GitHub Copilot agent for documentation.

Architecture context: ${detectedPatterns}
Tech stack: ${stack}

This agent is invoked with @documentation after a feature is implemented.
It must:

1. Read the feature spec, implemented source code, and existing documentation
2. Generate or update these artifacts:
   - **CHANGELOG.md**: Add entry under [Unreleased] following Keep a Changelog format
   - **README.md**: Update any sections affected by the feature (setup, API, config)
   - **Architecture Decision Record**: Create \`docs/adr/ADR-<n>-<title>.md\` if the feature
     introduces a significant architectural or design decision
   - **API Reference**: Document new endpoints (path, method, auth, request, response, errors)
   - **Environment variables**: Document any new env vars in .env.example
3. Write documentation that reflects the actual implementation — never aspirational
4. Maintain consistent documentation style with existing docs
5. Reference the spec ID: \"Implements FEAT-XXX\"
6. Update the AGENTS.md catalog if new agents or capabilities were added

Architecture documentation rules:
- Document WHY decisions were made, not just what was built
- If the feature introduces a new ${ctx.architecturePatterns?.detected?.[0] || 'layer/module'},
  add a diagram showing how it fits into the overall architecture

Include YAML frontmatter:
  name: documentation
  description: (keyword-rich: documentation, README, ADR, changelog, technical writer)
  model: Gemini 2.0 Flash (copilot)
  tools:
    - read/readFile
    - edit/createFile
    - edit/editFiles
    - search/listDirectory
    - search
  agents: []
  handoffs:
    - label: "Volver al Orchestrator" → agent: orchestrator, prompt: "Documentación técnica generada. Revisa el estado del flujo ASDD.", send: false — a reusable documentation prompt.

Architecture: ${detectedPatterns}

Structure with:
- Variables: {{spec_file}}, {{feature_name}}, {{changed_files}}
- Documentation artifacts checklist (CHANGELOG, README, ADR, API docs, .env.example)
- Style guide (tone: directive/imperative, format per artifact type)
- \"Definition of Done\" for documentation: all artifacts complete, spec referenced

Use YAML frontmatter with mode: agent.
`,
      },
    ],
  })

  return {
    'agents/documentation.agent.md': agentContent,
    'prompts/06-documentation.prompt.md': promptContent,
  }
}


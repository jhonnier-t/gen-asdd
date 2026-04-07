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

Genera un prompt reutilizable para documentacion tecnica de un feature completado.

IMPORTANT - use this EXACT frontmatter format (GitHub Copilot .prompt.md convention):
\`\`\`yaml
---
name: doc-task
description: <keyword-rich one-line description>
argument-hint: "nombre-del-feature"
agent: documentation
tools:
  - edit/createFile
  - edit/editFiles
  - read/readFile
  - search/listDirectory
  - search
---
\`\`\`

Rules:
- "agent" field must contain the agent NAME - NOT "mode: agent"
- Variables use \${input:featureName:nombre del feature en kebab-case} syntax - NOT {{mustache}}
- Do NOT include a "mode" field
- Body: imperative numbered steps in Spanish with concrete file-path references

Body must cover:
1. Leer spec en .github/specs/\${input:featureName}.spec.md
2. Generar entrada en CHANGELOG.md bajo [Unreleased]
3. Actualizar README.md si hay cambios visibles al usuario
4. Crear ADR en docs/adr/ si se tomaron decisiones arquitectonicas
5. Agregar docs de API inline si se aniadieron nuevas rutas
Restricciones: solo documentar - NO modificar codigo de implementacion
`,
      },
    ],
  })

  return {
    'agents/documentation.agent.md': agentContent,
    'prompts/documentation.prompt.md': promptContent,
  }
}


/**
 * Static ASDD template generator — no AI required.
 *
 * Produces a complete, generic, language-agnostic ASDD structure using
 * hardcoded best-practice content. Triggered when no GitHub token is available.
 *
 * Each domain of templates lives in its own module:
 *   ./docs.mjs         — copilot-instructions, spec template, agents catalog, changelog
 *   ./agents.mjs       — agent .agent.md definitions
 *   ./prompts.mjs      — reusable .prompt.md task prompts
 *   ./instructions.mjs — path-scoped .instructions.md files
 *   ./skills.mjs       — SKILL.md slash-command definitions
 *   ./configs.mjs      — tooling configuration files
 */

import { copilotInstructions, specTemplate, agentsCatalog, changelog } from './docs.mjs'
import { specAgent, orchestratorAgent, tddBackendAgent, tddFrontendAgent, backendAgent, frontendAgent, documentationAgent, qaAgent } from './agents.mjs'
import { promptOrchestrate, promptTddBackend, promptTddFrontend, promptBackend, promptFrontend, promptDocumentation, promptQaScenarios } from './prompts.mjs'
import { instructionGeneral, instructionSpec, instructionBackend, instructionFrontend, instructionTesting, instructionSecurity, instructionGit } from './instructions.mjs'
import { skillAsddOrchestrate, skillGenerateSpec, skillImplementBackend, skillImplementFrontend, skillUnitTesting, skillGherkinCaseGenerator, skillRiskIdentifier } from './skills.mjs'
import { vscodeExtensions } from './configs.mjs'

/**
 * @param {string} projectName
 * @param {string} [version]
 * @returns {Record<string, string>}
 */
export function generateStaticAsddStructure(projectName, version) {
  const date = new Date().toISOString().split('T')[0]
  const name = projectName || 'my-project'

  return {
    // Core Copilot context
    'copilot-instructions.md': copilotInstructions(name, version, date),

    // Agent definitions
    'agents/spec.agent.md': specAgent(name),
    'agents/orchestrator.agent.md': orchestratorAgent(name),
    'agents/tdd-backend.agent.md': tddBackendAgent(name),
    'agents/tdd-frontend.agent.md': tddFrontendAgent(name),
    'agents/backend.agent.md': backendAgent(name),
    'agents/frontend.agent.md': frontendAgent(name),
    'agents/documentation.agent.md': documentationAgent(name),
    'agents/qa.agent.md': qaAgent(name),

    // Spec template
    'specs/SPEC-TEMPLATE.md': specTemplate(date),

    // Reusable prompt files
    'prompts/orchestrate.prompt.md': promptOrchestrate(),
    'prompts/tdd-backend.prompt.md': promptTddBackend(),
    'prompts/tdd-frontend.prompt.md': promptTddFrontend(),
    'prompts/backend.prompt.md': promptBackend(),
    'prompts/frontend.prompt.md': promptFrontend(),
    'prompts/documentation.prompt.md': promptDocumentation(),
    'prompts/qa-scenarios.prompt.md': promptQaScenarios(),

    // Copilot instruction files (path-scoped, auto-applied via applyTo)
    'instructions/general.instructions.md': instructionGeneral(name),
    'instructions/spec.instructions.md': instructionSpec(),
    'instructions/backend.instructions.md': instructionBackend(),
    'instructions/frontend.instructions.md': instructionFrontend(),
    'instructions/testing.instructions.md': instructionTesting(),
    'instructions/security.instructions.md': instructionSecurity(),
    'instructions/git.instructions.md': instructionGit(),

    // ASDD Skills (slash commands)
    'skills/asdd-orchestrate/SKILL.md': skillAsddOrchestrate(),
    'skills/generate-spec/SKILL.md': skillGenerateSpec(),
    'skills/implement-backend/SKILL.md': skillImplementBackend(),
    'skills/implement-frontend/SKILL.md': skillImplementFrontend(),
    'skills/unit-testing/SKILL.md': skillUnitTesting(),
    'skills/gherkin-case-generator/SKILL.md': skillGherkinCaseGenerator(),
    'skills/risk-identifier/SKILL.md': skillRiskIdentifier(),

    // VS Code extension recommendations (additive — does not overwrite user settings)
    'ROOT:.vscode/extensions.json': vscodeExtensions(),

    // Root documentation
    'ROOT:AGENTS.md': agentsCatalog(name),
    'ROOT:CHANGELOG.md': changelog(name, date),
  }
}

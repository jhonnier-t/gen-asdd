import { readProjectContext } from './context.mjs'
import { resolveToken } from './auth.mjs'
import { log } from './logger.mjs'
import { writeGithubFolder } from './writer.mjs'
import { runSpecAgent } from './agents/spec.mjs'
import { runTddBackendAgent } from './agents/tdd-backend.mjs'
import { runTddFrontendAgent } from './agents/tdd-frontend.mjs'
import { runBackendAgent } from './agents/backend.mjs'
import { runFrontendAgent } from './agents/frontend.mjs'
import { runDocumentationAgent } from './agents/documentation.mjs'
import { runQaAgent } from './agents/qa.mjs'
import { runOrchestratorAgent } from './agents/orchestrator.mjs'
import { runSkillsAgent } from './agents/skills.mjs'
import { runGitHooksAgent } from './agents/git-hooks.mjs'
import { runVscodeConfigAgent } from './agents/vscode-config.mjs'

/**
 * Main orchestration function.
 * Coordinates all ASDD phases with correct parallelism:
 *
 *   Phase 0 — Context reading (local, instant)
 *   Phase 1 — Spec (sequential)
 *   Phase 2 — TDD Backend + TDD Frontend + Backend + Frontend (parallel)
 *   Phase 3 — Documentation + QA + Orchestrator + Skills + Git Hooks + VS Code Config (all parallel)
 *
 * @param {object} opts - Parsed CLI flags from index.mjs
 */
export async function orchestrate(opts) {
  const outputDir = opts.output ?? process.cwd()
  const model = opts.model ?? 'openai/gpt-4o'
  const dryRun = opts['dry-run'] ?? false
  const verboseContext = (opts['verbose-context'] ?? true) && !opts['quiet-context']
  const maxAgentConcurrency = 2

  log.title('asdd-gen — Agentic Spec Driven Development Generator')

  // ─── Phase 0: Context ──────────────────────────────────────────────────────
  log.phase(0, 'Understanding project context...')
  const ctx = readProjectContext(outputDir, {
    onProgress: verboseContext
      ? (event) => {
          if (event.type === 'file-read') {
            log.dim(`  • reading: ${event.path}`)
            return
          }
          if (event.type === 'file-indexed') {
            log.dim(`  • indexed: ${event.path}`)
            return
          }
          if (event.message) {
            log.dim(`  • ${event.message}`)
          }
        }
      : undefined,
  })

  log.info(`Project  : ${ctx.projectName}`)
  log.info(`Tech     : ${ctx.techStack.length ? ctx.techStack.join(', ') : 'none detected'}`)
  log.info(`Model    : ${model}`)
  if (ctx.contextStats) {
    log.info(
      `Context : ${ctx.contextStats.totalVisitedDirs} dirs, ${ctx.contextStats.totalVisitedFiles} files scanned, ${ctx.contextStats.includedFiles} indexed`
    )
  }
  if (dryRun) log.warn('Dry-run mode — no files will be written')
  console.log('')

  if (dryRun) {
    log.success('Context read successfully. Files that would be generated:')
    printArtifactList()
    return
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────
  log.phase('⚙️ ', 'Resolving GitHub token...')
  let token
  try {
    token = await resolveToken(opts.token)
    log.success('✓ GitHub token resolved\n')
  } catch (err) {
    console.log('')
    log.error('Failed to resolve GitHub token')
    console.log('')
    console.log(err.message)
    console.log('')
    // Exit immediately with no cleanup to avoid hanging processes
    process.exit(1)
  }

  const agentArgs = { token, model, ctx }
  /** @type {Record<string, string>} collected file contents across all phases */
  const files = {}

  log.phase('⚙️ ', 'Generating ASDD agents and instruction files...')
  console.log('')

  // ─── Phase 1: Spec ─────────────────────────────────────────────────────────
  log.phase(1, 'Generating specification (sequential)...')

  const specFiles = await runSpecAgent(agentArgs)
  Object.assign(files, specFiles)
  log.agent('spec', `created ${Object.keys(specFiles).length} files — ${Object.keys(specFiles).join(', ')}`)
  console.log('')

  // ─── Phase 2: TDD + Implementation (parallel) ──────────────────────────────
  log.phase(2, `Generating TDD and implementation agents (concurrency: ${maxAgentConcurrency})...`)

  const phase2Tasks = [
    { name: 'tdd-backend', run: () => runTddBackendAgent(agentArgs) },
    { name: 'backend', run: () => runBackendAgent(agentArgs) },
    { name: 'tdd-frontend', run: () => runTddFrontendAgent(agentArgs) },
    { name: 'frontend', run: () => runFrontendAgent(agentArgs) },
  ]

  const phase2Results = await runTasksWithConcurrency(phase2Tasks, maxAgentConcurrency)
  processPhaseResults(phase2Results, phase2Tasks.map((task) => task.name), files)
  console.log('')

  // ─── Phase 3: Documentation + QA + GitHub Structure (parallel) ────────────
  log.phase(3, `Generating documentation, QA, orchestration, and tooling artifacts (concurrency: ${maxAgentConcurrency})...`)

  const phase3Tasks = [
    { name: 'documentation', run: () => runDocumentationAgent(agentArgs) },
    { name: 'qa', run: () => runQaAgent(agentArgs) },
    { name: 'orchestrator', run: () => runOrchestratorAgent(agentArgs) },
    { name: 'skills', run: () => runSkillsAgent(agentArgs) },
    { name: 'git-hooks', run: () => runGitHooksAgent(agentArgs) },
    { name: 'vscode-config', run: () => runVscodeConfigAgent(agentArgs) },
  ]

  const phase3Results = await runTasksWithConcurrency(phase3Tasks, maxAgentConcurrency)

  processPhaseResults(phase3Results, phase3Tasks.map((task) => task.name), files)
  console.log('')

  // ─── Write Output ──────────────────────────────────────────────────────────
  log.phase('✓', 'Writing output files...')
  const writtenPaths = await writeGithubFolder(outputDir, files)
  console.log('')
  log.success(`Generated ${writtenPaths.length} files:`)
  for (const p of writtenPaths) log.dim(`  ${p}`)
  console.log('')
  log.success('ASDD structure ready. Open GitHub Copilot and invoke @orchestrator to start!')
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Processes Promise.allSettled results, merges fulfilled files, warns on errors.
 * @param {PromiseSettledResult[]} results
 * @param {string[]} names - Agent names in same order as results
 * @param {Record<string,string>} files - Accumulator
 */
function processPhaseResults(results, names, files) {
  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    const name = names[i]
    if (result.status === 'fulfilled') {
      Object.assign(files, result.value)
      log.agent(name, `created ${Object.keys(result.value).length} files — ${Object.keys(result.value).join(', ')}`)
    } else {
      log.warn(`Agent "${name}" failed: ${result.reason?.message ?? result.reason}`)
    }
  }
}

/**
 * Runs async tasks with bounded concurrency and returns Promise.allSettled-compatible results.
 * @param {{name: string, run: () => Promise<Record<string, string>>}[]} tasks
 * @param {number} concurrency
 * @returns {Promise<PromiseSettledResult<Record<string, string>>[]>}
 */
async function runTasksWithConcurrency(tasks, concurrency) {
  const results = new Array(tasks.length)
  let nextIndex = 0

  async function worker() {
    while (true) {
      const index = nextIndex
      nextIndex++
      if (index >= tasks.length) return

      try {
        const value = await tasks[index].run()
        results[index] = { status: 'fulfilled', value }
      } catch (reason) {
        results[index] = { status: 'rejected', reason }
      }
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, tasks.length))
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return /** @type {PromiseSettledResult<Record<string, string>>[]} */ (results)
}

function printArtifactList() {
  const artifacts = [
    // Copilot main instructions
    '.github/copilot-instructions.md',
    // Spec agent + canonical template
    '.github/agents/spec.agent.md',
    '.github/specs/SPEC-TEMPLATE.md',
    // ASDD Agents (spec.agent.md is listed above under spec section)
    '.github/agents/orchestrator.agent.md',
    '.github/agents/tdd-backend.agent.md',
    '.github/agents/tdd-frontend.agent.md',
    '.github/agents/backend.agent.md',
    '.github/agents/frontend.agent.md',
    '.github/agents/documentation.agent.md',
    '.github/agents/qa.agent.md',
    // Prompts
    '.github/prompts/00-orchestrate.prompt.md',
    '.github/prompts/02-tdd-backend.prompt.md',
    '.github/prompts/03-tdd-frontend.prompt.md',
    '.github/prompts/04-backend.prompt.md',
    '.github/prompts/05-frontend.prompt.md',
    '.github/prompts/06-documentation.prompt.md',
    '.github/prompts/07-qa-scenarios.prompt.md',
    // Skills — Copilot instruction files (scoped by applyTo)
    '.github/instructions/general.instructions.md',
    '.github/instructions/spec.instructions.md',
    '.github/instructions/backend.instructions.md',
    '.github/instructions/frontend.instructions.md',
    '.github/instructions/testing.instructions.md',
    '.github/instructions/security.instructions.md',
    '.github/instructions/git.instructions.md',
    // Git hooks
    'ROOT:.husky/pre-commit',
    'ROOT:.husky/commit-msg',
    'ROOT:.husky/pre-push',
    'ROOT:commitlint.config.mjs',
    'ROOT:lint-staged.config.mjs',
    // VS Code / Copilot agent config
    'ROOT:.vscode/settings.json',
    'ROOT:.vscode/extensions.json',
    // Root-level files
    'AGENTS.md',
    'CHANGELOG.md',
  ]

  for (const a of artifacts) log.dim(`  ${a}`)
}

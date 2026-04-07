import { readProjectContext } from './context.mjs'
import { resolveToken } from './auth.mjs'
import { log } from './logger.mjs'
import { writeGithubFolder } from './writer.mjs'
import { generateStaticAsddStructure } from './static-templates.mjs'
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
 * Determines if AI mode should be used.
 * AI mode requires an explicit --token flag OR a GITHUB_TOKEN/GH_TOKEN environment variable.
 * Running `npx asdd-gen` with none of these → static mode (no AI, instant).
 *
 * @param {object} opts - Parsed CLI flags
 * @returns {boolean}
 */
function isAiMode(opts) {
  return Boolean(opts.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN)
}

/**
 * Main orchestration function.
 * Supports two modes:
 *   - Static mode: instant, no AI, no token — generates generic ASDD structure
 *   - AI mode:     uses GitHub Models API to generate project-specific ASDD structure
 *
 * @param {object} opts - Parsed CLI flags from index.mjs
 */
export async function orchestrate(opts) {
  const outputDir = opts.output ?? process.cwd()
  const dryRun = opts['dry-run'] ?? false
  const verboseContext = (opts['verbose-context'] ?? true) && !opts['quiet-context']

  log.title('asdd-gen — Agentic Spec Driven Development Generator')

  const aiMode = isAiMode(opts)

  if (aiMode) {
    await orchestrateWithAi(opts, outputDir, dryRun, verboseContext)
  } else {
    await orchestrateStatic(opts, outputDir, dryRun, verboseContext)
  }
}

// ---------------------------------------------------------------------------
// Static mode — no AI, no token, instant generation
// ---------------------------------------------------------------------------

async function orchestrateStatic(opts, outputDir, dryRun, verboseContext) {
  log.info('Mode: static (no token provided — generating generic ASDD structure)')
  log.dim('  Tip: run with --token <github-token> to generate project-specific content with AI')
  console.log('')

  // Read minimal context for project name
  const ctx = readProjectContext(outputDir, {
    onProgress: verboseContext
      ? (event) => {
          if (event.type === 'file-read') log.dim(`  • reading: ${event.path}`)
          else if (event.type === 'file-indexed') log.dim(`  • indexed: ${event.path}`)
        }
      : undefined,
  })

  log.info(`Project  : ${ctx.projectName}`)
  if (ctx.version) log.info(`Version  : ${ctx.version}`)
  log.info(`Tech     : ${ctx.techStack.length ? ctx.techStack.join(', ') : 'not detected'}`)

  if (ctx.architecturePatterns?.detected?.length) {
    log.info(`Patterns : ${ctx.architecturePatterns.detected.join(', ')}`)
  } else {
    log.info('Patterns : none detected — using SOLID, DRY, KISS, YAGNI defaults')
  }
  console.log('')

  if (dryRun) {
    log.success('Dry-run: files that would be generated:')
    printArtifactList()
    return
  }

  log.info('Generating ASDD structure...')
  const files = generateStaticAsddStructure(ctx.projectName, ctx.version)

  const writtenPathsSet = new Set()
  const written = await writeGithubFolder(outputDir, files)
  for (const p of written) writtenPathsSet.add(p)

  console.log('')
  log.success(`Generated ${writtenPathsSet.size} files:`)
  for (const p of writtenPathsSet) log.dim(`  ${p}`)
  console.log('')
  log.success('ASDD structure ready!')
  log.dim('  → Open .github/copilot-instructions.md to review and customize')
  log.dim('  → Open .github/specs/SPEC-TEMPLATE.md to create your first spec')
  log.dim('  → Run with --token <github-token> next time for AI-generated content')
}

// ---------------------------------------------------------------------------
// AI mode — uses GitHub Models API for project-specific generation
// ---------------------------------------------------------------------------

async function orchestrateWithAi(opts, outputDir, dryRun, verboseContext) {
  const model = opts.model ?? 'openai/gpt-4o'
  const maxAgentConcurrency = 2

  log.info('Mode: AI (generating project-specific ASDD structure)')
  log.info(`Model    : ${model}`)
  console.log('')

  log.info('Reading project documentation...')
  const ctx = readProjectContext(outputDir, {
    onProgress: verboseContext
      ? (event) => {
          if (event.type === 'file-read') log.dim(`  • reading: ${event.path}`)
          else if (event.type === 'file-indexed') log.dim(`  • indexed: ${event.path}`)
          else if (event.message) log.dim(`  • ${event.message}`)
        }
      : undefined,
  })

  log.info(`Project  : ${ctx.projectName}`)
  if (ctx.version) log.info(`Version  : ${ctx.version}`)
  log.info(`Tech     : ${ctx.techStack.length ? ctx.techStack.join(', ') : 'none detected'}`)

  if (ctx.architecturePatterns?.detected?.length) {
    log.info(`Patterns : ${ctx.architecturePatterns.detected.join(', ')} (from docs)`)
  } else {
    log.info('Patterns : none detected — agents will apply SOLID, DRY, KISS, YAGNI')
  }

  log.info(`Docs     : ${ctx.docs?.length ?? 0} markdown file(s) read`)

  if (dryRun) {
    log.warn('Dry-run mode — no files will be written')
    console.log('')
    log.success('Context read successfully. Files that would be generated:')
    printArtifactList()
    return
  }
  console.log('')

  log.info('Resolving GitHub token...')
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
    process.exit(1)
  }

  const agentArgs = { token, model, ctx }
  const writtenPathsSet = new Set()

  log.info('Generating ASDD structure files...')
  log.dim('  • files are written as each agent finishes')
  console.log('')

  log.info('Creating core specification files...')
  const specFiles = await runSpecAgent(agentArgs)
  await processAgentResult('spec', { status: 'fulfilled', value: specFiles }, outputDir, writtenPathsSet)
  console.log('')

  log.info('Creating implementation and test agent files...')
  const phase2Tasks = [
    { name: 'tdd-backend', run: () => runTddBackendAgent(agentArgs) },
    { name: 'backend', run: () => runBackendAgent(agentArgs) },
    { name: 'tdd-frontend', run: () => runTddFrontendAgent(agentArgs) },
    { name: 'frontend', run: () => runFrontendAgent(agentArgs) },
  ]

  await runTasksWithConcurrency(phase2Tasks, maxAgentConcurrency, async (index, result) => {
    await processAgentResult(phase2Tasks[index].name, result, outputDir, writtenPathsSet)
  })
  console.log('')

  log.info('Creating documentation, orchestration, and tooling files...')
  const phase3Tasks = [
    { name: 'documentation', run: () => runDocumentationAgent(agentArgs) },
    { name: 'qa', run: () => runQaAgent(agentArgs) },
    { name: 'orchestrator', run: () => runOrchestratorAgent(agentArgs) },
    { name: 'skills', run: () => runSkillsAgent(agentArgs) },
    { name: 'git-hooks', run: () => runGitHooksAgent(agentArgs) },
    { name: 'vscode-config', run: () => runVscodeConfigAgent(agentArgs) },
  ]

  await runTasksWithConcurrency(phase3Tasks, maxAgentConcurrency, async (index, result) => {
    await processAgentResult(phase3Tasks[index].name, result, outputDir, writtenPathsSet)
  })
  console.log('')

  const writtenPaths = [...writtenPathsSet]
  console.log('')
  log.success(`Generated ${writtenPaths.length} files:`)
  for (const p of writtenPaths) log.dim(`  ${p}`)
  console.log('')
  log.success('ASDD structure ready. Open GitHub Copilot and invoke @orchestrator to start!')
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function processAgentResult(name, result, outputDir, writtenPathsSet) {
  if (result.status === 'fulfilled') {
    const written = await writeGithubFolder(outputDir, result.value)
    for (const p of written) writtenPathsSet.add(p)
    log.agent(name, `created ${Object.keys(result.value).length} files — ${Object.keys(result.value).join(', ')}`)
    for (const p of written) log.dim(`    wrote: ${p}`)
  } else {
    log.warn(`Agent "${name}" failed: ${result.reason?.message ?? result.reason}`)
  }
}

async function runTasksWithConcurrency(tasks, concurrency, onSettled) {
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

      if (onSettled) {
        try {
          await onSettled(index, results[index])
        } catch (callbackError) {
          log.warn(`Post-process for agent "${tasks[index].name}" failed: ${callbackError?.message ?? callbackError}`)
        }
      }
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, tasks.length))
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return results
}

function printArtifactList() {
  const artifacts = [
    '.github/copilot-instructions.md',
    '.github/agents/spec.agent.md',
    '.github/agents/orchestrator.agent.md',
    '.github/agents/tdd-backend.agent.md',
    '.github/agents/tdd-frontend.agent.md',
    '.github/agents/backend.agent.md',
    '.github/agents/frontend.agent.md',
    '.github/agents/documentation.agent.md',
    '.github/agents/qa.agent.md',
    '.github/specs/SPEC-TEMPLATE.md',
    '.github/prompts/00-orchestrate.prompt.md',
    '.github/prompts/02-tdd-backend.prompt.md',
    '.github/prompts/03-tdd-frontend.prompt.md',
    '.github/prompts/04-backend.prompt.md',
    '.github/prompts/05-frontend.prompt.md',
    '.github/prompts/06-documentation.prompt.md',
    '.github/prompts/07-qa-scenarios.prompt.md',
    '.github/instructions/general.instructions.md',
    '.github/instructions/spec.instructions.md',
    '.github/instructions/backend.instructions.md',
    '.github/instructions/frontend.instructions.md',
    '.github/instructions/testing.instructions.md',
    '.github/instructions/security.instructions.md',
    '.github/instructions/git.instructions.md',
    '.github/skills/asdd-orchestrate/SKILL.md',
    '.github/skills/generate-spec/SKILL.md',
    '.github/skills/implement-backend/SKILL.md',
    '.github/skills/implement-frontend/SKILL.md',
    '.github/skills/unit-testing/SKILL.md',
    '.github/skills/gherkin-case-generator/SKILL.md',
    '.github/skills/risk-identifier/SKILL.md',
    'commitlint.config.mjs',
    'lint-staged.config.mjs',
    '.vscode/settings.json',
    '.vscode/extensions.json',
    'AGENTS.md',
    'CHANGELOG.md',
  ]
  for (const a of artifacts) log.dim(`  ${a}`)
}


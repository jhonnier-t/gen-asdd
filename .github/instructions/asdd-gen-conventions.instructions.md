---
description: "Use when writing or modifying asdd-gen source code. Covers ESM module conventions, dual-mode architecture, agent contract, context scanning rules, and project coding style."
applyTo: "**/*.mjs"
---
# asdd-gen — Project Structure & Development Guidelines

## Project map

```
index.mjs                    ← CLI entry point: parse args, call orchestrate()
src/
  orchestrator.mjs           ← Mode router: static vs AI, phase sequencing
  context.mjs                ← Read .md docs, detect architecture patterns
  llm.mjs                    ← GitHub Models API client + model cache
  static-templates.mjs       ← All static file content (no AI)
  writer.mjs                 ← Write output files to disk (only place that touches fs)
  auth.mjs                   ← Token resolution: --token → env vars → gh CLI → OAuth
  logger.mjs                 ← ANSI log helpers: log.info/success/warn/error/phase/agent
  agents/
    spec.mjs                 ← Phase 1: copilot-instructions.md + spec template + @spec agent
    tdd-backend.mjs          ← Phase 2 (parallel): @tdd-backend agent
    tdd-frontend.mjs         ← Phase 2 (parallel): @tdd-frontend agent
    backend.mjs              ← Phase 2 (parallel): @backend agent
    frontend.mjs             ← Phase 2 (parallel): @frontend agent
    documentation.mjs        ← Phase 3 (parallel): @docs agent
    qa.mjs                   ← Phase 3 (parallel): @qa agent
    orchestrator.mjs         ← Phase 3 (parallel): @orchestrator agent
    skills.mjs               ← Phase 3 (parallel): .github/instructions/* files
    git-hooks.mjs            ← Phase 3 (parallel): commitlint.config.mjs + lint-staged.config.mjs
    vscode-config.mjs        ← Phase 3 (parallel): .vscode/settings.json + extensions.json
```

---

## Data flow

```
index.mjs
  └─ parseArgs() → opts
  └─ orchestrate(opts)
       └─ isAiMode(opts)?
            ├─ NO  → orchestrateStatic()
            │         readProjectContext(rootDir)  ← package.json only
            │         generateStaticAsddStructure(name, version)
            │         writeGithubFolder(outputDir, files)
            └─ YES → orchestrateWithAi()
                      resolveToken()
                      readProjectContext(rootDir)  ← package.json + .md docs
                      Phase 1: runSpecAgent({ token, model, ctx })
                      Phase 2: Promise.all([tddBackend, tddFrontend, backend, frontend])
                      Phase 3: Promise.all([docs, qa, orchestrator, skills, gitHooks, vscode])
                      writeGithubFolder(outputDir, mergedFiles)
```

---

## ESM rules

- All files use `.mjs` extension. No `require()`, no `module.exports`.
- Named exports only. No default exports.
- `node:` prefix mandatory on built-in imports: `import { readFileSync } from 'node:fs'`
- No external runtime dependencies. Everything in `node:` built-ins or inline.

---

## Module contracts

### `context.mjs` — `readProjectContext(rootDir, options?)`
Returns a `ProjectContext` object:
```js
{
  rootDir,          // string — absolute path
  projectName,      // string — from package.json or directory name
  description,      // string — from package.json
  version,          // string — from package.json
  techStack,        // string[] — detected from package.json dependencies
  architecturePatterns: {
    detected,       // string[] — pattern names found in docs (may be empty)
    principles,     // string[] — SOLID/DRY/... or pattern-derived principles
    isDefault,      // boolean — true when no patterns found
  },
  docs,             // Array<{ path, content }> — .md/.mdx files read from doc dirs
  directoryTree,    // string — dirs-only tree (depth 3)
  packageJson,      // object | null — raw parsed package.json
}
```
Never add source file scanning here. Context = docs + metadata only.

### `llm.mjs` — `chat({ token, model, messages })`
Calls GitHub Models API. Handles retries on transient errors (429, 503). Returns the assistant message string.
- Model cache: `_availableModelsCache` (module-level `Map`, keyed by token). Populated once per CLI run.
- `buildContextBlock(ctx)` → formats `ProjectContext` into a prompt string.

### `writer.mjs` — `writeGithubFolder(outputDir, files)`
Receives a `Record<string, string>` (key → content) and writes to disk.
- No key prefix → `.github/<key>`
- `ROOT:<path>` → `<outputDir>/<path>`
- `VSCODE:<path>` → `<outputDir>/.vscode/<path>`
Never bypass `writer.mjs` to write files directly from agents or orchestrator.

### `logger.mjs` — `log.*`
ANSI output helpers. No external deps.
- `log.phase(n, msg)` → phase headers
- `log.agent(name, msg)` → agent progress lines
- `log.info / success / warn / error / dim / title`

---

## Agent contract (all files in `src/agents/`)

Every agent must follow this exact signature:

```js
export async function runXxxAgent({ token, model, ctx }) {
  // Build prompt using ctx and buildContextBlock(ctx) from llm.mjs
  // Call chat({ token, model, messages }) one or more times
  // Return a flat object: file key → content string
  return {
    'agents/xxx.agent.md': '...',
    'ROOT:xxx.config.mjs': '...',
    'VSCODE:settings.json': '...',
  }
}
```

Rules:
- Parameters are always a **single destructured object** `{ token, model, ctx }`.
- Return value is always `Record<string, string>` — never `void`, never nested.
- **Never write to disk** inside an agent.
- Never import from another agent. Agents are independent.
- Use `buildContextBlock(ctx)` from `llm.mjs` as the shared context prefix for all prompts.

---

## Dual-mode rule

Every new feature must work in both modes:

| Question | Static mode | AI mode |
|----------|------------|---------|
| How is content generated? | `static-templates.mjs` (hardcoded) | Agent in `src/agents/` (LLM call) |
| Is there a network call? | Never | Yes (GitHub Models API) |
| Default principles | SOLID, DRY, KISS, YAGNI | Detected from docs or same default |

`isAiMode(opts)` = `Boolean(opts.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN)`

---

## How to add a new agent

1. Create `src/agents/<name>.mjs` following the agent contract above.
2. Add its static equivalent in `static-templates.mjs` → new entry in the returned object.
3. Import and call in `orchestrator.mjs`:
   - Phase 2 if it produces content that other Phase 3 agents depend on.
   - Phase 3 `Promise.all` if it's independent.
4. Add its output keys to `printArtifactList()` in `orchestrator.mjs`.
5. Run `node --check src/agents/<name>.mjs` before committing.

---

## How to add a new CLI flag

1. Add the option to `parseArgs` options map in `index.mjs`.
2. Add it to the `HELP` string in `index.mjs`.
3. Read it from `opts` in `orchestrator.mjs` — pass it down as needed.
4. Document it in `README.md` options table.

---

## How to add a new architecture pattern

In `context.mjs`, add an entry to `ARCHITECTURE_SIGNATURES`:
```js
{ name: 'Pattern Name', keywords: ['keyword1', 'keyword2', 'compound keyword phrase'] }
```
Keywords are matched case-insensitively against concatenated `.md` doc content.

---

## Phase structure

```
Phase 1 — sequential (output feeds Phase 2 and 3 prompts)
  runSpecAgent → copilot-instructions.md + spec template + @spec agent

Phase 2 — parallel (all read ctx, none depend on each other)
  runTddBackendAgent  runTddFrontendAgent  runBackendAgent  runFrontendAgent

Phase 3 — parallel (all read ctx, none depend on each other)
  runDocumentationAgent  runQaAgent  runOrchestratorAgent
  runSkillsAgent  runGitHooksAgent  runVscodeConfigAgent
```

Never move an agent to an earlier phase unless it produces output that later agents need in their prompts.

---

## No overhead tools rule

Do not generate config for tools that require project-level installation steps (e.g., `npm install --save-dev X`) unless the value is unambiguous. Generated files should work or be ignorable with zero extra setup. Example: Husky was removed — too much setup friction for the user.

---

## Validation

After editing any `.mjs` file:
```bash
node --check src/path/to/file.mjs
```

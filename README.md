# asdd-gen

**Agentic Spec Driven Development** generator.

One command. Full ASDD infrastructure for your project, generated with GitHub Copilot.

```bash
npx asdd-gen
```

Reads your project context (package.json, README, file tree), connects to GitHub Models API (powered by Copilot), and generates the complete ASDD infrastructure: AI agents, Copilot skills, git hooks, and VS Code config — everything your team needs to follow the spec-driven development workflow.

> `asdd-gen` generates the **structure**. Your team (and the generated agents) create the specs and code.

---

## What it generates

```
npx asdd-gen
```

1. **Phase 0** — Reads project context locally (package.json, README, file tree)
2. **Phase 1** — Generates `copilot-instructions.md`, the `@spec` agent definition, and `specs/SPEC-TEMPLATE.md`
3. **Phase 2** — Generates TDD backend + TDD frontend + Backend + Frontend agent definitions **in parallel**
4. **Phase 3** — Generates Documentation + QA + Orchestrator agents + Copilot skills + git hooks + VS Code config **in parallel**
5. Writes everything to `.github/`, project root, and `.vscode/`

---

## Generated structure

```
.github/
├── copilot-instructions.md          ← Main Copilot context + ASDD workflow rules
├── specs/
│   └── SPEC-TEMPLATE.md             ← Blank template — copy this per feature
├── agents/
│   ├── orchestrator.agent.md        ← @orchestrator: coordinates all sub-agents
│   ├── spec.agent.md                ← @spec: creates specs in .github/specs/
│   ├── tdd-backend.agent.md         ← @tdd-backend: writes backend tests first (reads spec)
│   ├── tdd-frontend.agent.md        ← @tdd-frontend: writes frontend tests first (reads spec)
│   ├── backend.agent.md             ← @backend: implements backend code to pass tests
│   ├── frontend.agent.md            ← @frontend: implements frontend code to pass tests
│   ├── documentation.agent.md       ← @docs: updates docs, ADRs, changelog
│   └── qa.agent.md                  ← @qa: generates Gherkin scenarios from spec
├── prompts/
│   ├── 00-orchestrate.prompt.md
│   ├── 02-tdd-backend.prompt.md
│   ├── 03-tdd-frontend.prompt.md
│   ├── 04-backend.prompt.md
│   ├── 05-frontend.prompt.md
│   ├── 06-documentation.prompt.md
│   └── 07-qa-scenarios.prompt.md
└── instructions/                    ← Copilot skills (auto-loaded by applyTo glob)
    ├── spec.instructions.md         ← Spec template + ASDD flow (applyTo: .github/specs/**)
    ├── general.instructions.md      ← Global rules (applyTo: **)
    ├── backend.instructions.md      ← Backend conventions
    ├── frontend.instructions.md     ← Frontend/component conventions
    ├── testing.instructions.md      ← TDD mandate + test patterns
    ├── security.instructions.md     ← OWASP rules (applyTo: **)
    └── git.instructions.md          ← Commit conventions + branch strategy

.husky/
├── pre-commit                       ← Runs lint-staged on staged files
├── commit-msg                       ← Validates Conventional Commits with commitlint
└── pre-push                         ← Type-check + full test suite before push

.vscode/
├── settings.json                    ← Copilot agent mode enabled + editor config
└── extensions.json                  ← Recommended extensions for this stack

commitlint.config.mjs                ← Project-specific commit scopes (generated)
lint-staged.config.mjs               ← Per-filetype lint rules (generated)
AGENTS.md                            ← AI agent catalog (human-readable)
CHANGELOG.md                         ← Project changelog
```

---

## The ASDD workflow (after running asdd-gen)

Once the structure is generated, your team follows this flow using the installed agents:

```
1. @spec   →  creates .github/specs/FEAT-001-<slug>.md
              Developer reviews and sets status: approved

2. @orchestrator  →  reads the approved spec, triggers:
   (parallel)  @tdd-backend  @tdd-frontend  @backend  @frontend

3. (parallel)  @documentation  @qa  @orchestrator(validate)
```

---

## Auth

The tool resolves a GitHub token in this order:

| Priority | Source |
|----------|--------|
| 1 | `--token <value>` CLI flag |
| 2 | `GITHUB_TOKEN` environment variable |
| 3 | `GH_TOKEN` environment variable |
| 4 | `gh auth token` (GitHub CLI) |
| 5 | OAuth device flow (opens github.com/login/device) |

---

## Options

```
--dry-run        Show what would be generated, without writing files
--model <name>   GitHub Models model (default: openai/gpt-4o)
--token <tok>    GitHub token
--output <dir>   Output directory (default: current working directory)
-y, --yes        Skip confirmation prompts
-h, --help       Show help
```

---

## Requirements

- Node.js >= 22.0.0
- A GitHub account with access to [GitHub Models](https://github.com/marketplace/models)

---

## Token setup

`asdd-gen` requires a GitHub token to access the GitHub Models API. 

### Getting a Fine-grained Personal Access Token

1. Go to: **https://github.com/settings/tokens?type=beta**
2. Click **"Generate new token"** → **"Fine-grained personal access token"**
3. Fill in:
   - **Token name**: `asdd-gen`
   - **Repository access**: "All repositories"
4. Under **Permissions**, ensure these are set (scroll down):
   - **Models**: Read and write
5. Click **"Generate token"** and copy it immediately (you won't see it again)

### Using the token

Use the token with the `--token` flag:

```bash
npx asdd-gen --token ghp_xxx...
```

Or export it as an environment variable:

```bash
export GITHUB_TOKEN=ghp_xxx...
npx asdd-gen
```

Tokens starting with `github_pat_` are also valid (fine-grained format).

---

## Security & Privacy

**Your token is never stored, logged, or sent anywhere except to GitHub.**

- Tokens passed via `--token` flag or environment variables are used **only** to authenticate requests to GitHub Models API
- No tokens are logged, cached, or stored on disk
- All token handling happens in-process and in-memory only
- Generated files never contain or reference your token
- `asdd-gen` is open-source; you can review the code at https://github.com/jhonnier-t/asdd-gen

---

## Troubleshooting

### "No token found" / OAuth device flow fails

**Error**: Device flow initiation failed (HTTP 404)

**Solution**: Create a Fine-grained PAT (see [Token setup](#token-setup) above) and pass it via `--token` or `GITHUB_TOKEN` env variable.

### "The `models` permission is required" (HTTP 401)

**Error**: GitHub Models API error [401]: The `models` permission is required to access this endpoint

**Reason**: Your token doesn't have the "Models" permission scope.

**Solution**:
1. Create a **new Fine-grained Personal Access Token**: https://github.com/settings/tokens?type=beta
2. Make sure **"Models" permission is set to "Read and write"**
3. Copy the new token and use it:
   ```bash
   npx asdd-gen --token ghp_xxx...
   ```

### GitHub Models API not available

**Error**: 403 Forbidden or "Models service not available"

**Reason**: Your GitHub account doesn't have access to [GitHub Models](https://github.com/marketplace/models) yet.

**Solution**: Request access at https://github.com/models

### Unknown model error (HTTP 400)

**Error**: Unknown model: openai/gpt-4o

**Reason**: The specified model is not available in your GitHub Models account. Different models are rolled out gradually.

**Solution**: 
1. Check your available models: **https://github.com/marketplace/models**
2. Try a different model with the `--model` flag:

```bash
npx asdd-gen --model openai/gpt-4o-mini --token ghp_xxx...
npx asdd-gen --model claude-3.5-haiku --token ghp_xxx...
npx asdd-gen --model google/gemini-2.0-flash --token ghp_xxx...
```

For more details, see: https://docs.github.com/en/github-models

---



# asdd-gen

**Agentic Spec Driven Development** generator.

One command. Full ASDD infrastructure for your project.

```bash
# Static mode — instant, no token required
npx asdd-gen

# AI mode — project-specific content via GitHub Models
npx asdd-gen --token ghp_xxx
```

> `asdd-gen` generates the **structure**. Your team (and the generated agents) create the specs and code.

---

## Two modes

### Static mode — no token, instant

```bash
npx asdd-gen
```

Generates a complete, generic ASDD structure in seconds. No API calls, no token needed. Language-agnostic, based on SOLID / DRY / KISS / YAGNI principles.

### AI mode — token required

```bash
npx asdd-gen --token ghp_xxx
```

Reads your project's `.md` documentation to detect architecture patterns (Clean Architecture, Hexagonal, DDD, CQRS, MVC, etc.) and generates content tailored to your stack and conventions. Falls back to SOLID/DRY/KISS defaults when no patterns are found.

| | Static | AI |
|---|---|---|
| Token required | No | Yes |
| Time | ~1s | ~1-2 min |
| Content | Generic, language-agnostic | Project-specific |
| Architecture detection | No | Yes (from `.md` docs) |

---

## What gets generated

```
npx asdd-gen [--token ghp_xxx]
```

**Static mode:**
1. Reads `package.json` for project name
2. Generates the complete ASDD structure instantly

**AI mode:**
1. Reads all `.md` files from `docs/`, `wiki/`, `architecture/`, `adr/`, `.github/`, etc.
2. Detects architecture patterns from documentation content
3. **Phase 1** — Generates `copilot-instructions.md` + `@spec` agent + spec template
4. **Phase 2** — Generates TDD backend + TDD frontend + Backend + Frontend agents **in parallel**
5. **Phase 3** — Generates Documentation + QA + Orchestrator agents + Copilot skills + commit config + VS Code config **in parallel**
6. Writes everything to `.github/`, project root, and `.vscode/`

---

## Generated structure

```
.github/
├── copilot-instructions.md          ← Main Copilot context + architecture rules + ASDD workflow
├── specs/
│   └── SPEC-TEMPLATE.md             ← Blank template — copy per feature
├── agents/
│   ├── orchestrator.agent.md        ← @orchestrator: coordinates full pipeline (model + tools + handoffs)
│   ├── spec.agent.md                ← @spec: creates specs in .github/specs/
│   ├── tdd-backend.agent.md         ← @tdd-backend: writes backend tests first (reads spec)
│   ├── tdd-frontend.agent.md        ← @tdd-frontend: writes frontend tests first (reads spec)
│   ├── backend.agent.md             ← @backend: implements backend code to pass tests
│   ├── frontend.agent.md            ← @frontend: implements frontend code to pass tests
│   ├── documentation.agent.md       ← @docs: updates docs, ADRs, changelog
│   └── qa.agent.md                  ← @qa: generates Gherkin scenarios + risk matrix
├── prompts/
│   ├── 00-orchestrate.prompt.md
│   ├── 02-tdd-backend.prompt.md
│   ├── 03-tdd-frontend.prompt.md
│   ├── 04-backend.prompt.md
│   ├── 05-frontend.prompt.md
│   ├── 06-documentation.prompt.md
│   └── 07-qa-scenarios.prompt.md
├── instructions/                    ← Path-scoped rules (auto-applied via applyTo glob)
│   ├── general.instructions.md      ← Global rules + architecture principles (applyTo: **)
│   ├── spec.instructions.md         ← Spec template + ASDD flow (applyTo: .github/specs/**)
│   ├── backend.instructions.md      ← Backend conventions + layer rules
│   ├── frontend.instructions.md     ← Frontend/component conventions
│   ├── testing.instructions.md      ← TDD mandate + test patterns
│   ├── security.instructions.md     ← OWASP Top 10 rules (applyTo: **)
│   └── git.instructions.md          ← Commit conventions + branch strategy
└── skills/                          ← Slash-command workflows (type / in Copilot Chat)
    ├── asdd-orchestrate/SKILL.md    ← /asdd-orchestrate
    ├── generate-spec/SKILL.md       ← /generate-spec
    ├── implement-backend/SKILL.md   ← /implement-backend
    ├── implement-frontend/SKILL.md  ← /implement-frontend
    ├── unit-testing/SKILL.md        ← /unit-testing
    ├── gherkin-case-generator/SKILL.md ← /gherkin-case-generator
    └── risk-identifier/SKILL.md     ← /risk-identifier

.vscode/
├── settings.json                    ← Copilot agent mode + editor config
└── extensions.json                  ← Recommended extensions for this stack

commitlint.config.mjs                ← Conventional Commits config with project scopes
lint-staged.config.mjs               ← Per-filetype lint rules for pre-commit checks
AGENTS.md                            ← AI agent catalog (human-readable)
CHANGELOG.md                         ← Project changelog
```

---

## The ASDD workflow (after running asdd-gen)

Once the structure is in place, your team follows this flow using GitHub Copilot:

```
1. @spec   →  creates .github/specs/FEAT-001-<slug>.md
              Developer reviews and sets status: approved

2. @orchestrator  →  reads the approved spec, triggers in parallel:
                     @tdd-backend  @tdd-frontend  @backend  @frontend

3. After step 2:  @documentation  @qa  @orchestrator (validation)
```

**Rule**: No agent in step 2 or 3 runs without a spec with `status: approved`.

---

## Architecture detection (AI mode)

In AI mode, `asdd-gen` reads your `.md` documentation to detect which architecture patterns your project uses:

| Pattern detected | Examples |
|-----------------|---------|
| Clean Architecture | Domain, Application, Infrastructure, Presentation layers |
| Hexagonal / Ports & Adapters | Ports, adapters, driven/driving sides |
| Domain-Driven Design (DDD) | Aggregates, bounded contexts, value objects |
| CQRS | Command/query separation, read/write models |
| Event Sourcing | Event store, projections |
| MVC | Controllers, models, views |
| Repository Pattern | Repositories, data access abstraction |
| Event-Driven | Publishers, subscribers, message queues |
| Microservices | Service boundaries, API gateway |
| Layered Architecture | Presentation, business logic, data layers |

When no patterns are detected, agents default to **SOLID, DRY, KISS, YAGNI, Separation of Concerns**.

---

## Auth (AI mode only)

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
--dry-run         Show what would be generated, without writing files
--verbose-context Show per-file context scan logs (default: on)
--quiet-context   Hide per-file context scan logs
--model <name>    GitHub Models model to use (default: openai/gpt-4o)
                  Only relevant in AI mode
--token <tok>     GitHub token — enables AI mode
--output <dir>    Output directory (default: current working directory)
-y, --yes         Skip confirmation prompts
-h, --help        Show help
```

---

## Examples

```bash
# Static mode — instant generic structure, no token
npx asdd-gen

# Preview what would be generated (static)
npx asdd-gen --dry-run

# AI mode — project-specific, reads your .md docs
npx asdd-gen --token ghp_xxx

# AI mode with a specific model, quieter output
npx asdd-gen --token ghp_xxx --model openai/gpt-4o-mini --quiet-context

# Write to a specific directory
npx asdd-gen --token ghp_xxx --output ./my-project

# Set token via environment variable
export GITHUB_TOKEN=ghp_xxx
npx asdd-gen
```

---

## Requirements

- Node.js >= 22.0.0
- GitHub account with access to [GitHub Models](https://github.com/marketplace/models) *(AI mode only)*

---

## Token setup (AI mode)

### Getting a Fine-grained Personal Access Token

1. Go to: **https://github.com/settings/tokens?type=beta**
2. Click **"Generate new token"** → **"Fine-grained personal access token"**
3. Fill in:
   - **Token name**: `asdd-gen`
   - **Repository access**: "All repositories"
4. Under **Permissions**, set **Models** → **Read and write**
5. Click **"Generate token"** and copy it immediately

```bash
npx asdd-gen --token ghp_xxx...
# or
export GITHUB_TOKEN=ghp_xxx...
npx asdd-gen
```

Tokens starting with `github_pat_` (fine-grained format) are also accepted.

---

## Security & Privacy

**Your token is never stored, logged, or sent anywhere except to GitHub.**

- Used only to authenticate requests to the GitHub Models API
- Never logged, cached, or written to disk
- All token handling is in-process and in-memory only
- Generated files never contain or reference your token
- `asdd-gen` is open-source: https://github.com/jhonnier-t/asdd-gen

---

## Troubleshooting

### "No token found" / OAuth device flow fails

**Error**: Device flow initiation failed (HTTP 404)

**Solution**: Create a Fine-grained PAT (see [Token setup](#token-setup-ai-mode) above) and pass it via `--token` or `GITHUB_TOKEN`.

### "The `models` permission is required" (HTTP 401)

**Reason**: Your token doesn't have the "Models" permission scope.

**Solution**: Create a new Fine-grained PAT at https://github.com/settings/tokens?type=beta with **Models → Read and write**.

### GitHub Models API not available (403)

**Reason**: Your GitHub account doesn't have access to GitHub Models yet.

**Solution**: Request access at https://github.com/models

### "Your account type is not currently supported" (HTTP 401)

**Reason**: Your account plan doesn't support the requested model endpoint.

**Solution**: Check available models at https://github.com/marketplace/models and try a different model:

```bash
npx asdd-gen --model openai/gpt-4o-mini --token ghp_xxx
npx asdd-gen --model google/gemini-2.0-flash --token ghp_xxx
```

### Unknown model error (HTTP 400)

**Reason**: The model is not available in your account. Models are rolled out gradually.

**Solution**: `asdd-gen` queries your available models and maps aliases automatically. Try:

```bash
npx asdd-gen --model openai/gpt-4o-mini --token ghp_xxx
npx asdd-gen --model claude-3.5-haiku --token ghp_xxx
```

For more details: https://docs.github.com/en/github-models

---



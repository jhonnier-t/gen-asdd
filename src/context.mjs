import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, extname } from 'node:path'

// File extensions and names to include in file tree
const RELEVANT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.mts', '.cts',
  '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java', '.kt', '.cs', '.cpp', '.c',
  '.html', '.css', '.scss', '.sass', '.less',
  '.vue', '.svelte', '.astro',
  '.json', '.yaml', '.yml', '.toml', '.env.example',
  '.md', '.mdx',
  '.prisma', '.graphql', '.sql',
  '.sh', '.bash',
])

const RELEVANT_CONFIG_NAMES = new Set([
  'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock',
  'tsconfig.json', 'jsconfig.json',
  'vite.config.ts', 'vite.config.js', 'vite.config.mjs',
  'next.config.ts', 'next.config.js', 'next.config.mjs',
  'nuxt.config.ts', 'nuxt.config.js',
  'astro.config.mjs', 'astro.config.ts',
  'tailwind.config.ts', 'tailwind.config.js',
  'vitest.config.ts', 'vitest.config.js',
  'jest.config.ts', 'jest.config.js',
  'playwright.config.ts', 'playwright.config.js',
  'docker-compose.yml', 'docker-compose.yaml', 'Dockerfile',
  '.eslintrc.json', '.eslintrc.js', 'eslint.config.js', 'eslint.config.mjs',
  '.prettierrc', '.prettierrc.json',
  'wrangler.json', 'wrangler.toml',
  'gradle.build', 'build.gradle', 'pom.xml',
  'Cargo.toml', 'go.mod', 'requirements.txt', 'pyproject.toml', 'Gemfile',
])

// Directories to skip
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.astro',
  'out', 'coverage', '.cache', '.turbo', 'vendor', '__pycache__',
  '.venv', 'venv', 'target', 'bin', 'obj', '.gradle',
  '.mypy_cache', '.pytest_cache', '.ruff_cache', '.tox',
  '.claude',
])

const MAX_TREE_DEPTH = 4
const MAX_TREE_ENTRIES = 120
const MAX_README_CHARS = 3000

/**
 * Reads and builds the project context from the given root directory.
 * @param {string} rootDir - Absolute path to the project root
 * @param {object} [options]
 * @param {(event: {type: string, path?: string, message?: string}) => void} [options.onProgress]
 * @returns {ProjectContext}
 */
export function readProjectContext(rootDir, options = {}) {
  const { onProgress } = options

  const packageJson = readPackageJson(rootDir, onProgress)
  const readme = readReadme(rootDir, onProgress)
  const { tree: fileTree, stats: scanStats } = buildFileTree(rootDir, onProgress)
  const techStack = detectTechStack(rootDir, packageJson)

  onProgress?.({
    type: 'summary',
    message: `Scanned ${scanStats.totalVisitedDirs} folders and ${scanStats.totalVisitedFiles} files (included ${scanStats.includedFiles} in context tree)`,
  })

  return {
    rootDir,
    projectName: packageJson?.name ?? extractNameFromPath(rootDir),
    description: packageJson?.description ?? extractDescriptionFromReadme(readme),
    techStack,
    fileTree,
    packageJson,
    readme,
    contextStats: scanStats,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function readPackageJson(rootDir, onProgress) {
  const filePath = join(rootDir, 'package.json')
  if (!existsSync(filePath)) return null
  try {
    onProgress?.({ type: 'file-read', path: relative(rootDir, filePath) || 'package.json' })
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

function readReadme(rootDir, onProgress) {
  const candidates = ['README.md', 'README.mdx', 'readme.md', 'Readme.md']
  for (const name of candidates) {
    const filePath = join(rootDir, name)
    if (existsSync(filePath)) {
      try {
        onProgress?.({ type: 'file-read', path: relative(rootDir, filePath) || name })
        const content = readFileSync(filePath, 'utf8')
        return content.slice(0, MAX_README_CHARS)
      } catch {
        return ''
      }
    }
  }
  return ''
}

function buildFileTree(rootDir, onProgress) {
  const lines = []
  let count = 0
  let truncationNotified = false
  const stats = {
    totalVisitedDirs: 0,
    totalVisitedFiles: 0,
    includedFiles: 0,
    skippedDirs: 0,
    truncated: false,
  }

  function walk(dir, depth, prefix) {
    if (depth > MAX_TREE_DEPTH || count >= MAX_TREE_ENTRIES) return

    stats.totalVisitedDirs++

    let entries
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }

    // Sort: directories first, then files
    entries.sort((a, b) => {
      const aIsDir = isDir(join(dir, a))
      const bIsDir = isDir(join(dir, b))
      if (aIsDir && !bIsDir) return -1
      if (!aIsDir && bIsDir) return 1
      return a.localeCompare(b)
    })

    for (let i = 0; i < entries.length; i++) {
      if (count >= MAX_TREE_ENTRIES) {
        lines.push(`${prefix}... (truncated)`)
        stats.truncated = true
        if (!truncationNotified) {
          onProgress?.({ type: 'truncated', message: 'Context tree truncated at maximum entry limit' })
          truncationNotified = true
        }
        return
      }

      const name = entries[i]
      const fullPath = join(dir, name)
      const isLast = i === entries.length - 1
      const connector = isLast ? '└── ' : '├── '
      const childPrefix = isLast ? prefix + '    ' : prefix + '│   '

      if (isDir(fullPath)) {
        if (SKIP_DIRS.has(name)) {
          stats.skippedDirs++
          continue
        }
        lines.push(`${prefix}${connector}${name}/`)
        count++
        walk(fullPath, depth + 1, childPrefix)
      } else {
        stats.totalVisitedFiles++
        const ext = extname(name).toLowerCase()
        if (RELEVANT_EXTENSIONS.has(ext) || RELEVANT_CONFIG_NAMES.has(name)) {
          lines.push(`${prefix}${connector}${name}`)
          count++
          stats.includedFiles++
          onProgress?.({ type: 'file-indexed', path: relative(rootDir, fullPath) })
        }
      }
    }
  }

  walk(rootDir, 0, '')
  return { tree: lines.join('\n'), stats }
}

function isDir(p) {
  try { return statSync(p).isDirectory() } catch { return false }
}

function detectTechStack(rootDir, pkg) {
  const stack = []
  const deps = {
    ...pkg?.dependencies,
    ...pkg?.devDependencies,
  }

  const checks = [
    // Frontend frameworks
    ['react', ['react']],
    ['next.js', ['next']],
    ['vue', ['vue', '@vue/core']],
    ['nuxt', ['nuxt']],
    ['svelte', ['svelte', '@sveltejs/kit']],
    ['angular', ['@angular/core']],
    ['astro', ['astro']],
    // Styling
    ['tailwindcss', ['tailwindcss', '@tailwindcss/vite']],
    ['shadcn/ui', []] , // detected by config file
    // Backend
    ['express', ['express']],
    ['nestjs', ['@nestjs/core']],
    ['fastify', ['fastify']],
    ['hono', ['hono']],
    // Runtime/tooling
    ['typescript', ['typescript']],
    ['vite', ['vite']],
    ['vitest', ['vitest']],
    ['jest', ['jest', '@jest/core']],
    ['playwright', ['@playwright/test', 'playwright']],
    // Databases/ORM
    ['prisma', ['prisma', '@prisma/client']],
    ['drizzle', ['drizzle-orm', 'drizzle-kit']],
    ['supabase', ['@supabase/supabase-js']],
    // Auth
    ['clerk', []],   // detected by @clerk/* scope below
    ['better-auth', ['better-auth']],
    // Mobile
    ['react-native', ['react-native']],
    ['expo', ['expo']],
  ]

  for (const [name, packages] of checks) {
    if (packages.some((p) => p in deps)) stack.push(name)
  }

  // Scope-based detection
  if (Object.keys(deps).some((d) => d.startsWith('@clerk/'))) stack.push('clerk')
  if (Object.keys(deps).some((d) => d.startsWith('@aws-sdk/'))) stack.push('aws')
  if (Object.keys(deps).some((d) => d.startsWith('@azure/'))) stack.push('azure')

  // Config-file based
  if (existsSync(join(rootDir, 'components.json'))) stack.push('shadcn/ui')
  if (
    existsSync(join(rootDir, 'bun.lockb')) ||
    existsSync(join(rootDir, 'bun.lock'))
  ) stack.push('bun')
  if (existsSync(join(rootDir, 'deno.json'))) stack.push('deno')
  if (existsSync(join(rootDir, 'wrangler.toml')) ||
      existsSync(join(rootDir, 'wrangler.json'))) stack.push('cloudflare-workers')
  if (existsSync(join(rootDir, 'docker-compose.yml')) ||
      existsSync(join(rootDir, 'docker-compose.yaml')) ||
      existsSync(join(rootDir, 'Dockerfile'))) stack.push('docker')
  if (existsSync(join(rootDir, 'go.mod'))) stack.push('go')
  if (existsSync(join(rootDir, 'requirements.txt')) ||
      existsSync(join(rootDir, 'pyproject.toml'))) stack.push('python')
  if (existsSync(join(rootDir, 'Cargo.toml'))) stack.push('rust')
  if (existsSync(join(rootDir, 'pom.xml'))) stack.push('java/maven')
  if (existsSync(join(rootDir, 'build.gradle')) ||
      existsSync(join(rootDir, 'build.gradle.kts'))) stack.push('gradle')

  return [...new Set(stack)]
}

function extractNameFromPath(dir) {
  return dir.split(/[\\/]/).filter(Boolean).pop() ?? 'my-project'
}

function extractDescriptionFromReadme(readme) {
  if (!readme) return ''
  // Try to extract first non-heading paragraph
  const lines = readme.split('\n').map((l) => l.trim()).filter(Boolean)
  for (const line of lines) {
    if (!line.startsWith('#') && line.length > 10) return line.slice(0, 200)
  }
  return ''
}

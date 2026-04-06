import { execSync } from 'node:child_process'
import { createInterface } from 'node:readline'
import { log } from './logger.mjs'

const DEVICE_CODE_URL = 'https://github.com/login/device/code'
const ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token'

// Public OAuth App client_id for asdd-gen.
// Users can override by registering their own app and setting ASDD_CLIENT_ID.
const CLIENT_ID = process.env.ASDD_CLIENT_ID ?? 'Ov23liasddgen00001'

/**
 * Resolves a GitHub token using multiple fallback strategies.
 * @param {string|undefined} flagToken - Token passed via --token flag
 * @returns {Promise<string>} GitHub personal access token
 */
export async function resolveToken(flagToken) {
  // 1. --token flag
  if (flagToken) {
    log.dim('✓ Using token from --token flag')
    return flagToken
  }

  // 2. GITHUB_TOKEN environment variable
  if (process.env.GITHUB_TOKEN) {
    log.dim('✓ Using GITHUB_TOKEN environment variable')
    return process.env.GITHUB_TOKEN
  }

  // 3. GH_TOKEN environment variable
  if (process.env.GH_TOKEN) {
    log.dim('✓ Using GH_TOKEN environment variable')
    return process.env.GH_TOKEN
  }

  // 4. GitHub CLI `gh auth token`
  const ghToken = tryGhCli()
  if (ghToken) {
    log.dim('✓ Using token from `gh auth token` (GitHub CLI)')
    return ghToken
  }

  // 5. OAuth device flow
  log.warn('No token found in flags or environment. Attempting OAuth device flow...')
  return deviceFlow()
}

/**
 * Tries to get a token from the GitHub CLI.
 * @returns {string|null}
 */
function tryGhCli() {
  try {
    const token = execSync('gh auth token', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    }).trim()
    return token || null
  } catch {
    return null
  }
}

/**
 * GitHub OAuth Device Flow for headless/CLI environments.
 * Requires that the GitHub OAuth App has device flow enabled.
 * @returns {Promise<string>} access token
 */
async function deviceFlow() {
  try {
    // Step 1: Request device + user verification codes
    const deviceRes = await fetch(DEVICE_CODE_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ client_id: CLIENT_ID, scope: 'read:user' }),
      timeout: 10000,
    })

    if (!deviceRes.ok) {
      const msg = `Device flow initiation failed (HTTP ${deviceRes.status})`
      const suggestions = [
        'Generate a Personal Access Token:',
        '   https://github.com/settings/tokens',
        '',
        '   Steps:',
        '   1. Click "Generate new token" → "Personal access token (classic)"',
        '   2. Name: "asdd-gen"',
        '   3. Select scope: "read:user"',
        '   4. Click "Generate token" and copy it (e.g., ghp_xxx...)',
        '',
        'Then run:',
        '',
        '   npx asdd-gen --token ghp_xxx...',
        '',
        'Alternative methods:',
        '',
        'Option 1: Export as environment variable',
        '   export GITHUB_TOKEN=ghp_xxx...',
        '   npx asdd-gen',
        '',
        'Option 2: Use GitHub CLI',
        '   gh auth login',
        '   gh auth token',
      ]
      throw new Error([msg, ...suggestions].join('\n   '))
    }

    const { device_code, user_code, verification_uri, expires_in, interval } =
      await deviceRes.json()

    // Step 2: Show code to the user
    console.log('')
    log.info(`Open ${verification_uri} in your browser`)
    log.info(`Enter code: \x1b[1m\x1b[32m${user_code}\x1b[0m`)
    log.dim(`Code expires in ${expires_in} seconds`)
    console.log('')

    // Optionally open the browser on supported platforms
    tryOpenBrowser(verification_uri)

    // Step 3: Poll for authorization
    return await pollForToken(device_code, interval, expires_in)
  } catch (err) {
    const errorMsg = err.message.includes('\n') ? err.message : `GitHub OAuth failed: ${err.message}`
    throw new Error(errorMsg)
  }
}

/**
 * Polls the GitHub OAuth access_token endpoint until authorized or expired.
 */
async function pollForToken(deviceCode, intervalSeconds, expiresIn) {
  const deadline = Date.now() + expiresIn * 1000
  let currentInterval = intervalSeconds * 1000

  while (Date.now() < deadline) {
    await sleep(currentInterval)

    const res = await fetch(ACCESS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    })

    const data = await res.json()

    if (data.access_token) return data.access_token

    switch (data.error) {
      case 'authorization_pending':
        process.stdout.write('.')
        break
      case 'slow_down':
        currentInterval += 5000
        process.stdout.write('.')
        break
      case 'expired_token':
        throw new Error('Device code expired. Run asdd-gen again.')
      case 'access_denied':
        throw new Error('Authorization denied. If you declined on GitHub, run asdd-gen again.')
      default:
        throw new Error(`OAuth error: ${data.error_description ?? data.error}`)
    }
  }

  throw new Error('Device code expired before authorization. Run asdd-gen again.')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function tryOpenBrowser(url) {
  try {
    const platform = process.platform
    if (platform === 'win32') {
      // Windows: use start without waiting
      execSync(`start "" "${url}"`, { 
        stdio: 'ignore', 
        windowsHide: true,
        timeout: 2000 
      })
    } else if (platform === 'darwin') {
      // macOS
      execSync(`open "${url}"`, { stdio: 'ignore', timeout: 2000 })
    } else {
      // Linux
      execSync(`xdg-open "${url}" 2>/dev/null`, { stdio: 'ignore', timeout: 2000 })
    }
  } catch {
    // Ignore — browser open is best-effort
  }
}

// GitHub Models API — OpenAI-compatible inference endpoint
// Docs: https://docs.github.com/en/github-models
const GITHUB_MODELS_ENDPOINT = 'https://models.inference.ai.azure.com'

async function fetchAvailableModels(token) {
  try {
    const response = await fetch(`${GITHUB_MODELS_ENDPOINT}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) return []

    const data = await response.json()
    if (!Array.isArray(data)) return []

    return data
      .map((model) => model?.id)
      .filter((id) => typeof id === 'string' && id.length > 0)
  } catch {
    return []
  }
}

/**
 * Calls the GitHub Models chat completions API.
 *
 * @param {object} options
 * @param {string} options.token      - GitHub personal access token
 * @param {string} options.model      - Model identifier (e.g. "openai/gpt-4o")
 * @param {Array}  options.messages   - Chat messages array
 * @param {number} [options.maxTokens=4096] - Max completion tokens
 * @param {number} [options.temperature=0.2] - Sampling temperature
 * @returns {Promise<string>} The assistant's text response
 */
export async function chat({ token, model, messages, maxTokens = 4096, temperature = 0.2 }) {
  const url = `${GITHUB_MODELS_ENDPOINT}/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    let errorDetail = ''
    try {
      const errData = await response.json()
      errorDetail = errData?.error?.message ?? JSON.stringify(errData)
    } catch {
      errorDetail = await response.text()
    }

    // Handle 401 Unauthorized with models permission issue
    if (response.status === 401 && errorDetail.includes('models')) {
      const suggestions = [
        'GitHub Models API requires proper token permissions.',
        '',
        'Create a Fine-grained Personal Access Token:',
        '   https://github.com/settings/tokens?type=beta',
        '',
        'Steps:',
        '   1. Click "Generate new token" → "Fine-grained personal access token"',
        '   2. Name: "asdd-gen"',
        '   3. Under "Repository access": Select "All repositories"',
        '   4. Under "Permissions", scroll to "Models"',
        '   5. Set "Models" permission to "Read and write"',
        '   6. Click "Generate token" and copy it',
        '',
        'Then run:',
        '   npx asdd-gen --token ghp_xxx...',
      ]
      throw new Error(suggestions.join('\n   '))
    }

    // Handle 401 account type not supported
    if (response.status === 401 && errorDetail.includes('account type is not currently supported')) {
      const suggestions = [
        'Your GitHub account type is not currently supported for this model endpoint.',
        '',
        'What to do next:',
        '   1. Check your available models:',
        '      https://github.com/marketplace/models',
        '   2. Verify GitHub Models access:',
        '      https://github.com/models',
        '   3. Try a different model available for your account:',
        '      npx asdd-gen --model openai/gpt-4o-mini --token ghp_xxx...',
        '      npx asdd-gen --model mistral-large --token ghp_xxx...',
        '',
        'If this persists, your account or organization plan may not support this endpoint yet.',
      ]
      throw new Error(suggestions.join('\n   '))
    }

    // Handle 400 Unknown model error
    if (response.status === 400 && errorDetail.includes('Unknown model')) {
      const availableModels = await fetchAvailableModels(token)
      const preferredModels = [
        'openai/gpt-4o-mini',
        'claude-3.5-haiku',
        'claude-3.5-sonnet',
        'google/gemini-2.0-flash',
        'mistral-large',
      ]
      const suggestedModels = preferredModels.filter((m) => availableModels.includes(m))
      const fallbackModels = availableModels.slice(0, 5)
      const modelsToShow = suggestedModels.length ? suggestedModels : fallbackModels

      const suggestions = [
        `Model "${model}" is not available in your account.`,
        '',
        'Check your available models:',
        '   https://github.com/marketplace/models',
      ]

      if (modelsToShow.length) {
        suggestions.push('', 'Models available for your account:')
        for (const availableModel of modelsToShow) {
          suggestions.push(`   ${availableModel}`)
        }

        suggestions.push('', 'Run with one of these models:')
        for (const availableModel of modelsToShow.slice(0, 3)) {
          suggestions.push(`   npx asdd-gen --model ${availableModel} --token ghp_xxx...`)
        }
      } else {
        suggestions.push(
          '',
          'No model list could be retrieved for this token/account.',
          'Verify GitHub Models access: https://github.com/models',
          'See GitHub Models documentation: https://docs.github.com/en/github-models'
        )
      }

      throw new Error(suggestions.join('\n   '))
    }

    throw new Error(
      `GitHub Models API error [${response.status}]: ${errorDetail}\n` +
      `Model: ${model} | Endpoint: ${url}`
    )
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content

  if (!content) {
    throw new Error(`Unexpected response from GitHub Models API: ${JSON.stringify(data)}`)
  }

  return content
}

/**
 * Builds the common context block injected into every agent prompt.
 * @param {import('./context.mjs').ProjectContext} ctx
 * @returns {string}
 */
export function buildContextBlock(ctx) {
  const techList = ctx.techStack.length
    ? ctx.techStack.join(', ')
    : 'not yet determined'

  return `## Project Context

**Project name**: ${ctx.projectName}
**Description**: ${ctx.description || '(none)'}
**Tech stack detected**: ${techList}

### File tree (partial)
\`\`\`
${ctx.fileTree || '(empty project)'}
\`\`\`
${
  ctx.readme
    ? `\n### README excerpt\n\`\`\`\n${ctx.readme}\n\`\`\``
    : ''
}
`
}

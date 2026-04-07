export { vscodeExtensions }

// VS Code extension recommendations — the only config file asdd-gen generates
// at the project root. It is additive (VS Code merges recommendations) and does
// not overwrite any user settings.

function vscodeExtensions() {
  return JSON.stringify({
    recommendations: [
      'GitHub.copilot',
      'GitHub.copilot-chat',
      'esbenp.prettier-vscode',
      'dbaeumer.vscode-eslint',
      'streetsidesoftware.code-spell-checker',
      'eamodio.gitlens',
      'usernamehw.errorlens',
      'bradlc.vscode-tailwindcss',
      'Prisma.prisma',
    ],
  }, null, 2)
}

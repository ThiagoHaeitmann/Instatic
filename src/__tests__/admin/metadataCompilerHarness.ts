import { afterAll } from 'bun:test'
import { transformSync } from '@babel/core'
import { reactCompilerPreset } from '@vitejs/plugin-react'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const temporaryRoot = fileURLToPath(new URL('../../../.tmp/', import.meta.url))
mkdirSync(temporaryRoot, { recursive: true })
const compiledDirectory = mkdtempSync(join(temporaryRoot, 'metadata-compiler-'))

afterAll(() => {
  rmSync(compiledDirectory, { recursive: true, force: true })
})

/** Run the production React Compiler preset, retaining real imports and components. */
export async function compileAdminMetadataModule<TModule>(
  sourceUrl: URL,
  extraExports: readonly string[] = [],
): Promise<{ module: TModule; code: string }> {
  const filename = fileURLToPath(sourceUrl)
  const source = readFileSync(filename, 'utf8')
  const result = transformSync(
    source + (extraExports.length > 0 ? `\nexport { ${extraExports.join(', ')} }\n` : ''),
    {
      filename,
      configFile: false,
      babelrc: false,
      parserOpts: { plugins: ['typescript', 'jsx'] },
      presets: [reactCompilerPreset().preset],
    },
  )
  if (!result?.code || !result.code.includes('react/compiler-runtime')) {
    throw new Error(`React Compiler did not transform ${filename}`)
  }

  // The compiled fixture lives outside its source folder; resolve relative
  // imports back to that folder so contexts, metadata and UI remain real.
  const code = result.code.replace(
    /(from\s+['"])(\.[^'"]+)(['"])/g,
    (_match, before: string, specifier: string, after: string) =>
      before + resolve(dirname(filename), specifier) + after,
  )
  const output = join(compiledDirectory, `${dirname(filename).split('/').at(-1)}-${sourceUrl.pathname.split('/').at(-1)}`)
  writeFileSync(output, code)
  const module = await import(output) as TModule
  return { module, code: result.code }
}

import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  // Custom rules for date handling
  {
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.property.name='toLocaleDateString']",
          message: 'Avoid toLocaleDateString() for date display - use formatDateStringUTC() from @/app/lib/utils to prevent timezone shift bugs. See CLAUDE.md for date handling guidance.',
        },
      ],
    },
  },
])

export default eslintConfig
// apps/web ships its own framework-aware ESLint config. It pulls in Next's
// rules and keeps the shared `as never` ban as a purity ratchet.
import next from 'eslint-config-next';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

// Ban laundering values through `as never`. Keep it a pure ratchet: green today,
// fails the moment an `as never` reappears.
const noAsNeverRule = {
  selector: 'TSAsExpression > TSNeverKeyword',
  message:
    'Do not launder values through `as never`. Use a smart constructor for branded ids, or the generated insert/update types for DB write payloads.',
};

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      '.turbo/**',
      'next-env.d.ts',
      'coverage/**',
    ],
  },
  ...next,
  ...nextCoreWebVitals,
  {
    rules: {
      'no-restricted-syntax': ['error', noAsNeverRule],
    },
  },
];

export default config;

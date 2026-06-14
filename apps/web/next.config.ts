import { join } from 'node:path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This app lives in a pnpm/Turbo monorepo. Point file tracing at the repo root
  // so serverless bundles include workspace files and Next doesn't get confused
  // by the multiple lockfiles a monorepo can have.
  outputFileTracingRoot: join(import.meta.dirname, '..', '..'),
};

export default nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Next.js 16 uses Turbopack by default.
  // @react-pdf/renderer's optional 'canvas' dep is handled by turbopack automatically;
  // no explicit external config needed.
  turbopack: {},
};

export default nextConfig;

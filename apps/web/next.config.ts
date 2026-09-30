import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  typedRoutes: true,
  experimental: {
    appNewScrollHandler: true,
    cachedNavigations: true,
    inlineCss: true,
    prefetchInlining: true,
    turbopackRustReactCompiler: true,
    typedEnv: true,
    useOffline: true,
  },
}

export default nextConfig

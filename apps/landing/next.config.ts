import type { NextConfig } from "next";

// Unprefixed — landing owns "/" (Decision 27).
const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@cbb/ui"],
};

export default nextConfig;

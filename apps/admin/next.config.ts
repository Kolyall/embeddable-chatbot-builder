import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "/admin",
  transpilePackages: ["@cbb/db", "@cbb/auth", "@cbb/ui"],
};

export default nextConfig;

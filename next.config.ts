import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGitHubPages ? "/hoban-recruit-2027" : "",
  assetPrefix: isGitHubPages ? "/hoban-recruit-2027" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

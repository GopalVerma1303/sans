import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Enable static exports
  images: {
    unoptimized: true, // Required for static export
  },
  // Required for proper static file serving
  trailingSlash: true,
  // Ensure pages are generated with correct paths
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
};

export default nextConfig;

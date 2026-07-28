import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default 1MB is too small for the Guest View image section uploads
    // (Server Actions send the file as part of the action's body).
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;

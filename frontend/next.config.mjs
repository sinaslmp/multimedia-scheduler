/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the API URL to be overridden via environment variable.
  // Default points to the FastAPI backend running locally.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  },
};

export default nextConfig;

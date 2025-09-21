import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    typedRoutes: true,
    experimental: {
        optimizePackageImports: [
            "lucide-react",
            "sonner",
        ],
    },
};

export default nextConfig;

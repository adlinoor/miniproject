import { NextConfig } from "next";
import { Configuration } from "webpack";
import path from "path";

/** @type {import('next').NextConfig} */
interface CustomWebpackConfig extends Configuration {
  resolve: {
    alias: {
      [key: string]: string;
    };
  };
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Add this if using path aliases
  webpack: (config: CustomWebpackConfig): CustomWebpackConfig => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};

module.exports = nextConfig;

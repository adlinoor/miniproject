"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    preset: "ts-jest",
    testEnvironment: "node",
    setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
    moduleFileExtensions: ["ts", "js"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.json",
                diagnostics: {
                    warnOnly: true,
                },
            },
        ],
    },
    testMatch: ["**/src/tests/**/*.test.ts"],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    testTimeout: 30000, // Increased timeout to 30 seconds
    coveragePathIgnorePatterns: ["/node_modules/", "/dist/"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    testEnvironmentOptions: {
        url: "http://localhost",
    },
    detectOpenHandles: true, // Add this to help identify hanging connections
    logHeapUsage: true, // Add heap usage information
};
exports.default = config;

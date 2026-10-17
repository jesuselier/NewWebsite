import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone browser app migrated from ClassyCrypto; syntax-checked with node --check.
    "public/tier-list-assets/**",
    // Standalone Swarm page and the design lab it is built from (scripts/build-swarm-site.mjs);
    // browser scripts, syntax-checked with node --check.
    "public/swarm-site/**",
    "design-lab/**",
  ]),
]);

export default eslintConfig;

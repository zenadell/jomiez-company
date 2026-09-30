import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "aethron/**",
      "next-env.d.ts",
      "payload-types.ts",
      "app/(payload)/admin/importMap.js",
      "cms/migrations/**", "cms/migrations-pg/**",
    ],
  },
];

export default config;

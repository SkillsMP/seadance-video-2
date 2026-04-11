import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Relax migration-noisy rules and keep higher-signal runtime checks.
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@next/next/no-assign-module-variable": "off",
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "off",
      "prefer-const": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react/display-name": "off",
    },
  },
  {
    ignores: [".source/**"],
  },
];

export default config;

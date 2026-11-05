import { defineConfig, devices } from "@playwright/test";

const port = 3100;

export default defineConfig({
  testDir: "tests/navigateur",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL ?? `http://localhost:${port}`,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Sans BASE_URL : teste la version compilée (npm run build au préalable).
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `npx next start -p ${port}`, port, reuseExistingServer: true,
        // Valeurs de test seulement (aucun vrai secret) : dépôt des contenus en mémoire et mot de passe d'essai.
        env: {
          MILAGHAIBA_DEPOT_MEMOIRE: "1",
          HADITH_ADMIN_PASSWORD: "mot-de-passe-de-test-1234",
          HADITH_IMPORT_SESSION_SECRET: "secret-de-test-de-session-32-caracteres!",
        },
      },
});

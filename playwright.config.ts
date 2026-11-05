import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Les e-mails du serveur de test sont écrits dans ce fichier au lieu d'être envoyés.
export const JOURNAL_COURRIELS = join(tmpdir(), "milaghaiba-courriels-test.ndjson");

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
          MILAGHAIBA_COURRIEL_JOURNAL: JOURNAL_COURRIELS,
        },
      },
});

import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_WEB_URL ?? "http://localhost:3001",
    env: {
      apiUrl: process.env.CYPRESS_API_URL ?? "http://localhost:3000",
    },
    supportFile: false,
    video: false,
    screenshotsFolder: "cypress/screenshots",
    videosFolder: "cypress/videos",
  },
});

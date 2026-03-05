import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cloudflareConfig = defineCloudflareConfig({
  // Enable R2 incremental cache later if needed.
});

export default {
  ...cloudflareConfig,
  buildCommand: "npm run build:next",
};

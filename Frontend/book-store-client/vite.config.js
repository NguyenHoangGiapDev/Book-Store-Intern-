import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    outDir: "../../Backend/BookStore.Api/wwwroot",
    emptyOutDir: false,
    chunkSizeWarningLimit: 1000,
  },
});
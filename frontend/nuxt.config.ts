// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  routeRules: {
    "/**": { ssr: false },
  },

  modules: ["@pinia/nuxt", "@nuxt/ui", "@nuxt/icon"],

  icon: {
    provider: "server",
    collections: ["heroicons", "lucide"],
  },

  vite: {
    optimizeDeps: {
      include: ["pinia-plugin-persistedstate"],
    },
    plugins: [tailwindcss()],
    server: {
      hmr: {
        protocol: "ws",
        host: "0.0.0.0",
      },
      watch: {
        usePolling: true,
        ignored: ["**/node_modules/**", "**/.nuxt/**", "**/.output/**"],
      },
    },
  },

  css: ["~/assets/css/main.css"],

  imports: {
    dirs: ["stores", "app/stores"],
  },

  typescript: {
    shim: false,
  },

  pinia: {
    storesDirs: ["./app/stores/**"],
  },
  // Runtime config — public vars available in frontend
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? "http://127.0.0.1:3333",
    },
  },

  // App-wide head config
  app: {
    head: {
      title: "Job Queue Manager",
      titleTemplate: "%s — Job Queue Manager",
      meta: [
        {
          name: "description",
          content: "VT CS code submission and grading platform",
        },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      // link: [
      //   { rel: "preconnect", href: "https://fonts.googleapis.com" },
      //   {
      //     rel: "preconnect",
      //     href: "https://fonts.gstatic.com",
      //     crossorigin: "",
      //   },
      //   {
      //     rel: "stylesheet",
      //     href: "https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&display=swap",
      //   },
      // ],
    },
  },
});

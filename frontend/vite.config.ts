import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig(({ command }) => ({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		tailwindcss(),
		tanstackStart(),
		nitro({
			routeRules:
				command === "serve"
					? { "/api/**": { proxy: "http://127.0.0.1:8000/api/**" } }
					: {},
		}),
		viteReact(),
	],
}));

export default config;

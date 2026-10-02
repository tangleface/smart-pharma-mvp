import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const frontendRoot = dirname(here);
const sourceDir = join(frontendRoot, "node_modules", "maplibre-gl", "dist");
const targetDir = join(frontendRoot, "public", "maplibre");

await mkdir(targetDir, { recursive: true });

for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  await copyFile(join(sourceDir, file), join(targetDir, file));
}

console.log("MapLibre worker assets copied to public/maplibre");

import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

/** @type {esbuild.BuildOptions} */
const buildOptions = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/main.mjs",
  format: "esm",
  platform: "browser",
  sourcemap: true,
  minify: false,
  keepNames: true,
  resolveExtensions: [".ts", ".mjs", ".js", ".json"],
};

if (watch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("esbuild watching for changes...");
} else {
  const result = await esbuild.build(buildOptions);
  console.log("esbuild build complete.");
}

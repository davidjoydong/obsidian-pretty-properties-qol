import esbuild from "esbuild";
import process from "process";

const production = process.argv[2] === "production";

const context = await esbuild.context({
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: ["obsidian"],
	format: "cjs",
	platform: "node",
	target: "es2018",
	outdir: ".",
	 sourcemap: production ? false : "inline",
	minify: production,
	logLevel: "info"
});

if (production) {
	await context.rebuild();
	await context.dispose();
} else {
	await context.watch();
	console.log("Watching for changes...");
}

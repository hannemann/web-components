import esbuild from "esbuild";
import postcss from "esbuild-postcss";

const isProduction = process.env.NODE_ENV === "production";
const minify = true;
const sourcemap = "inline";
const bundle = true;
const target = ["esnext"];
const watch = isProduction
  ? false
  : {
      onRebuild(error, result) {
        if (error) console.error("watch build failed:", error);
        else {
          console.log("watch build succeeded:", result);
          // HERE: somehow restart the server from here, e.g., by sending a signal that you trap and react to inside the server.
        }
      },
    };

const defaults = { minify, sourcemap, bundle, target, watch };

const cssConfig = {
  entryPoints: ["./css/style.css"],
  outfile: "./public/static/style.css",
  plugins: [postcss()],
};

const noDeferConfig = {
  entryPoints: ["./js/prompt.js"],
  outfile: "./public/static/prompt.js",
};

const jsConfig = {
  entryPoints: ["./js/Components/index.js"],
  outfile: "./public/static/index.js",
};

process.on("SIGINT", () => process.exit());

esbuild.build({ ...cssConfig, ...defaults }).catch(() => process.exit(1));
esbuild.build({ ...noDeferConfig, ...defaults }).catch(() => process.exit(1));

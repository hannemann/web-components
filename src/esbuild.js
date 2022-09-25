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
  entryPoints: ["./css/core.css"],
  outfile: "../public/static/core.css",
  plugins: [postcss()],
};

const promptConfig = {
  entryPoints: ["./js/core.js"],
  outfile: "../public/static/core.js",
};

const deferConfig = {
  entryPoints: ["./js/defer.js"],
  outfile: "../public/static/defer.js",
};

process.on("SIGINT", () => process.exit());

esbuild.build({ ...cssConfig, ...defaults }).catch(() => process.exit(1));
esbuild.build({ ...promptConfig, ...defaults }).catch(() => process.exit(1));
esbuild.build({ ...deferConfig, ...defaults }).catch(() => process.exit(1));

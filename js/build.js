const esbuild = require("esbuild");
const postcss = require("esbuild-postcss");
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

const componentsConfig = {
  entryPoints: ["./js/Components/build.js"],
  outfile: "./public/static/components.js",
};

process.on("SIGINT", () => process.exit());

esbuild.build({ ...cssConfig, ...defaults }).catch(() => process.exit(1));
esbuild
  .build({ ...componentsConfig, ...defaults })
  .catch(() => process.exit(1));

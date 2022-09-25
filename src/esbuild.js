import esbuild from "esbuild";
import postcss from "esbuild-postcss";

const isProduction = process.env.NODE_ENV === "production";
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

const options = {
  minify: true,
  sourcemap: "inline",
  bundle: true,
  target: ["esnext"],
  watch,
  plugins: [postcss()],
  outdir: "../public/static/",
  entryPoints: ["./css/core.css", "./js/core.js", "./js/defer.js"],
};

process.on("SIGINT", () => process.exit());

esbuild.build(options).catch(() => process.exit(1));

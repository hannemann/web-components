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
        }
      },
    };

const buildOptions = {
  minify: true,
  sourcemap: "inline",
  bundle: true,
  target: ["esnext"],
  plugins: [postcss()],
  outdir: "../public/static/",
  entryPoints: ["./css/core.css", "./js/core.js", "./js/defer.js"],
};

const serveOptions = {
  port: 8000,
  servedir: "../public",
};

process.on("SIGINT", function () {
  process.exit();
});

if (!isProduction) {
  esbuild.serve(serveOptions, buildOptions);
}
esbuild.build({ ...buildOptions, ...{ watch } });

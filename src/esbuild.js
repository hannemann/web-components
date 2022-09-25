import esbuild from "esbuild";
import postcss from "esbuild-postcss";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

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
  minify: process.env.ESBUILD_MINIFY === "true",
  sourcemap: process.env.ESBUILD_SOURCEMAP,
  bundle: process.env.ESBUILD_BUNDLE === "true",
  target: process.env.ESBUILD_TARGET.split(" "),
  plugins: [postcss()],
  outdir: process.env.ESBUILD_OUTDIR,
  entryPoints: process.env.ESBUILD_ENTRYPOINTS.split(" "),
};

const serveOptions = {
  port: parseInt(process.env.ESSERVE_PORT),
  servedir: process.env.ESSERVE_DIR,
};

process.on("SIGINT", function () {
  process.exit();
});

if (!isProduction) {
  esbuild.serve(serveOptions, buildOptions);
}
esbuild.build({ ...buildOptions, ...{ watch } });

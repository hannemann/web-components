require("dotenv").config({ path: "../.env" });
let plugins = [];

if (process.env.POSTCSS_PRESET_ENV === "true") {
  plugins = [require("postcss-preset-env")({ stage: 1 })];
} else {
  plugins = [
    require("postcss-import"),
    require("postcss-custom-media"),
    require("postcss-custom-selectors"),
    require(`postcss-${process.env.POSTCSS_NEST_PLUGIN}`),
  ];
}
module.exports = { plugins };

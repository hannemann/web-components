const customMedia = require("postcss-custom-media");
const nested = require("postcss-nested");
const importPlugin = require("postcss-import");

module.exports = {
  plugins: [nested, importPlugin, customMedia],
};

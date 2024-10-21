var commonjs = require('@rollup/plugin-commonjs')
var terser = require('@rollup/plugin-terser')

module.exports = {
  input: 'index.js',
  output: [
    {
      name: "minify",
      format: 'umd',
      file: 'dist/webmin.umd.js'
    },
    {
      format: 'cjs',
      file: 'dist/webmin.cjs.js'
    },
    {
      format: 'es',
      file: 'dist/webmin.es.js',
    },
    {
      name: "minify",
      format: 'umd',
      file: 'dist/webmin.min.umd.js',
      plugins: [terser()]
    },
    {
      format: 'cjs',
      file: 'dist/webmin.min.cjs.js',
      plugins: [terser()]
    },
    {
      format: 'es',
      file: 'dist/webmin.min.es.js',
      plugins: [terser()]
    }
  ],
  plugins: [commonjs()]
}

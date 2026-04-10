import terser from '@rollup/plugin-terser';

export default {
  input: 'dist/frontend/app.js',
  output: {
    file: 'dist/frontend/app.js',
    format: 'esm',
    sourcemap: false
  },
  external(source) {
    return source.startsWith('/');
  },
  plugins: [
    terser({
      compress: true,
      mangle: true,
      format: {
        comments: false,
        beautify: false,
        max_line_len: false
      }
    })
  ]
};

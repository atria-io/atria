import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const forceProductionNodeEnv = () => ({
  name: 'force-production-node-env',
  transform(code) {
    if (!code.includes('process.env.NODE_ENV')) {
      return null;
    }

    return {
      code: code.split('process.env.NODE_ENV').join('"production"'),
      map: null
    };
  }
});

export default {
  input: 'dist/system/createRoot.js',
  output: {
    file: 'dist/app.js',
    format: 'esm',
    sourcemap: 'hidden'
  },
  plugins: [
    forceProductionNodeEnv(),
    resolve({ browser: true }),
    commonjs(),
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

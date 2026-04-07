import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

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

const resolveReactRuntime = () => ({
  name: 'resolve-react-runtime',
  resolveId(source) {
    if (
      source === 'react' ||
      source === 'react/jsx-runtime' ||
      source === 'react-dom' ||
      source === 'react-dom/client'
    ) {
      return require.resolve(source);
    }

    return null;
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
    resolveReactRuntime(),
    resolve({
      browser: true,
      preferBuiltins: false,
      dedupe: ['react', 'react-dom', 'react/jsx-runtime']
    }),
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

import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import typescript from '@rollup/plugin-typescript'

export default {
  input: 'src/app/kernel/runtime/main.tsx',
  output: {
    file: 'dist/app.js',
    format: 'esm',
    sourcemap: true
  },
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    resolve({browser: true}),
    commonjs(),
    typescript({tsconfig: './tsconfig.bundle.json'})
  ]
}

import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'

const forceProductionNodeEnv = () => ({
  name: 'force-production-node-env',
  transform(code) {
    if (!code.includes('process.env.NODE_ENV')) {
      return null
    }

    return {
      code: code.split('process.env.NODE_ENV').join('"production"'),
      map: null
    }
  }
})

export default {
  input: 'dist/app/kernel/runtime/main.js',
  output: {
    file: 'dist/app.js',
    format: 'esm',
    sourcemap: true
  },
  plugins: [
    forceProductionNodeEnv(),
    resolve({browser: true}),
    commonjs()
  ]
}

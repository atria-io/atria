import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);

const md5 = (value) =>
  createHash('md5')
    .update(value || '')
    .digest('hex')
    .slice(0, 8);

const lowercaseChunkNames = () => ({
  name: 'lowercase-chunk-names',
  generateBundle(_, bundle) {
    const renamed = new Map();

    for (const file of Object.values(bundle)) {
      if (file.type !== 'chunk' || file.isEntry) {
        continue;
      }

      const previousFileName = file.fileName;
      const nameHash = md5(file.name || 'chunk');
      const contentHash = md5(file.code || '');
      const nextFileName = `${nameHash}${contentHash}.js`;

      file.fileName = nextFileName;
      renamed.set(previousFileName, nextFileName);
    }

    if (renamed.size === 0) {
      return;
    }

    for (const file of Object.values(bundle)) {
      if (file.type !== 'chunk') {
        continue;
      }

      let nextCode = file.code;
      let changed = false;

      for (const [before, after] of renamed.entries()) {
        if (!nextCode.includes(before)) {
          continue;
        }

        nextCode = nextCode.split(before).join(after);
        changed = true;
      }

      if (changed) {
        file.code = nextCode;
      }
    }
  }
});

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
    dir: 'dist/static',
    format: 'esm',
    sourcemap: 'hidden',
    entryFileNames: 'app.js',
    chunkFileNames: '[name]-[hash].js',
    manualChunks(id) {
      if (id.includes('/node_modules/')) {
        return 'vendor';
      }

      const moduleMatch = id.match(/\/runtime\/studio\/modules\/([^/]+)\//);
      if (moduleMatch) {
        return moduleMatch[1];
      }

      const realmDirMatch = id.match(/\/runtime\/([^/.]+)\//);
      if (realmDirMatch && realmDirMatch[1] !== 'studio') {
        return realmDirMatch[1];
      }

      const screenMatch = id.match(/\/([A-Za-z]+)Screen\.js$/);
      if (screenMatch) {
        const realm = screenMatch[1].replace(/Screen$/, '').toLowerCase();
        return realm === 'studio' ? 'studio' : realm;
      }

      if (id.includes('/runtime/studio/')) {
        return 'studio';
      }

      return null;
    }
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
    }),
    lowercaseChunkNames()
  ]
};

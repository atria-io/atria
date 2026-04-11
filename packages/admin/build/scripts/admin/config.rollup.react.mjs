import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { createRequire } from 'node:module';
import { md5 } from '../../../../shared/src/hash/md5.ts';
import { stripLucideInternalClasses } from './config.lucide.mjs';

const require = createRequire(import.meta.url);

const lowercaseChunkNames = () => ({
  name: 'lowercase-chunk-names',
  generateBundle(_, bundle) {
    const renamed = [];

    for (const file of Object.values(bundle)) {
      if (file.type !== 'chunk' || file.isEntry) {
        continue;
      }

      const previousFileName = file.fileName;
      const original = file.fileName;
      const originalDir = original.includes('/') ? original.slice(0, original.lastIndexOf('/')) : '';
      const nextBaseName = `${md5(original).slice(0, 8)}.js`;
      const nextFileName = originalDir === '' ? nextBaseName : `${originalDir}/${nextBaseName}`;

      file.fileName = nextFileName;
      renamed.push({
        previousFileName,
        nextFileName,
        previousBaseName: previousFileName.includes('/')
          ? previousFileName.slice(previousFileName.lastIndexOf('/') + 1)
          : previousFileName,
        nextBaseName,
      });
    }

    if (renamed.length === 0) {
      return;
    }

    for (const file of Object.values(bundle)) {
      if (file.type !== 'chunk') {
        continue;
      }

      let nextCode = file.code;
      let changed = false;

      for (const renamedChunk of renamed) {
        if (nextCode.includes(renamedChunk.previousFileName)) {
          nextCode = nextCode.split(renamedChunk.previousFileName).join(renamedChunk.nextFileName);
          changed = true;
        }

        if (nextCode.includes(renamedChunk.previousBaseName)) {
          nextCode = nextCode.split(renamedChunk.previousBaseName).join(renamedChunk.nextBaseName);
          changed = true;
        }
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
  onwarn(warning, warn) {
    if (
      warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
      typeof warning.id === 'string' &&
      warning.id.includes('/node_modules/lucide-react/dist/esm/')
    ) {
      return;
    }

    warn(warning);
  },
  output: {
    dir: 'dist/frontend/static',
    format: 'esm',
    sourcemap: false,
    entryFileNames: 'js/app.js',
    chunkFileNames: 'js/[name]-[hash].js',
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
    stripLucideInternalClasses(),
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

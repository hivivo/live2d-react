import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function normalizeBasePath(basePath: string | undefined) {
  if (!basePath || basePath === '/') {
    return '/';
  }

  const withLeadingSlash = basePath.startsWith('/')
    ? basePath
    : `/${basePath}`;
  const withoutTrailingSlashes = withLeadingSlash.replace(/\/+$/, '');

  return `${withoutTrailingSlashes}/`;
}

export default defineConfig(() => {
  const base = normalizeBasePath(process.env.VITE_BASE_PATH);

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@framework': fileURLToPath(
          new URL('./src/cubism/framework', import.meta.url)
        )
      }
    }
  };
});

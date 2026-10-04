/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'stylis-plugin-rtl' {
  import type { StylisPlugin } from '@emotion/cache';
  const plugin: StylisPlugin;
  export default plugin;
}

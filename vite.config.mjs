import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      'vue': 'vue/dist/vue.runtime.esm-bundler.js',
      '@': path.resolve('./src')
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
  },
  build: {
    write: false,
    cssCodeSplit: false,
    minify: false,
    lib: {
      entry: path.resolve('./src/main.js'),
      name: 'PDFGoApp',
      formats: ['iife'],
      fileName: () => 'app.iife.js'
    }
  }
});

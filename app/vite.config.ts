import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// styled-components 5.3.1 — требование SDDS Serv.
// Babel-плагин включаем для корректных displayName и SSR-безопасных классов.
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-styled-components', { displayName: true, ssr: false }]],
      },
    }),
  ],
  // SDDS Serv тянет собственные копии react/styled-components через plasma-new-hope.
  // Дедуп заставляет всё приложение использовать один экземпляр — иначе "Invalid hook call".
  resolve: {
    dedupe: ['react', 'react-dom', 'styled-components'],
  },
});

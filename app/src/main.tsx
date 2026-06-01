import React from 'react';
import ReactDOM from 'react-dom/client';
import { createGlobalStyle } from 'styled-components';
import { NotificationsProvider } from '@salutejs/sdds-serv';
import { sdds_serv__light } from '@salutejs/sdds-themes';
import { App } from './App';

// Тема прототипа — светлая sdds_serv__light (роль Клиент, SDDS Serv).
const Theme = createGlobalStyle(sdds_serv__light);

// Базовый шрифт. Тема SDDS не задаёт font-family на body → простые элементы
// (бейджи, заголовки) падали в дефолтный serif (Times). Сажаем всё на SB Sans.
// Фолбэки — только sans-serif, никаких засечек.
const GlobalBase = createGlobalStyle`
  html, body {
    margin: 0;
    font-family: var(--plasma-typo-body-m-font-family), 'SB Sans Text', -apple-system,
      'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  button, input, textarea, select {
    font-family: inherit;
  }
`;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Theme />
    <GlobalBase />
    <NotificationsProvider>
      <App />
    </NotificationsProvider>
  </React.StrictMode>,
);

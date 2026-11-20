import React from 'react';
import ReactDOM from 'react-dom/client';
import { Theme } from '@astryxdesign/core/theme';
import { stoneTheme } from '@astryxdesign/theme-stone';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Theme theme={stoneTheme} mode="light">
      <App />
    </Theme>
  </React.StrictMode>
);

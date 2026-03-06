import { jsx as _jsx } from "react/jsx-runtime";
/// <reference types="vite/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(BrowserRouter, { basename: import.meta.env.DEV ? "/" : "/news", children: _jsx(App, {}) }) }));

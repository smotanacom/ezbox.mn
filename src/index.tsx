import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {BrowserRouter} from "react-router-dom";

// Auto-detect base path: use '/ezbox.mn' for GitHub Pages, '/' for custom domain
const getBaseName = () => {
  const hostname = window.location.hostname;
  if (hostname === 'smotanacom.github.io') {
    return '/ezbox.mn';
  }
  return '/';
};

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <BrowserRouter basename={getBaseName()}>
        <App/>
    </BrowserRouter>,
);

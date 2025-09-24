import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {BrowserRouter} from "react-router-dom";

// Use root path for custom domain
const getBaseName = () => {
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

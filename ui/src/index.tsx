import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorker from "./serviceWorker"
// import reportWebVitals from './reportWebVitals';

console.log("欢迎使用 Van Nav Enhanced 增强版")
console.log("项目地址: https://github.com/DeerFishSheep/van-nav-enhanced")
console.log("基于原版: https://github.com/Mereithhh/van-nav v1.12.1")

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

serviceWorker.register(null);
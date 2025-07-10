import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css'; // global tailwind styles

// Check if we're running in Electron
const isElectron = typeof window !== 'undefined' && window.process?.type === 'renderer';

// Initialize the app
const root = ReactDOM.createRoot(document.getElementById('app') as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Only load Electron-specific features if we're in Electron
if (isElectron) {
  // Import Electron-specific code here if needed
  console.log('Running in Electron environment');
} else {
  console.log('Running in web browser environment');
}

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'

// Show immediate feedback that JS is loading
const rootElement = document.getElementById("root");
if (rootElement) {
  rootElement.innerHTML = '<div style="padding: 20px; font-family: sans-serif; text-align: center; min-height: 100vh; display: flex; align-items: center; justify-content: center;"><div><div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div><p>Loading application...</p></div></div><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>';
}

console.log("🚀 Starting app initialization...");

// Ensure root element exists
if (!rootElement) {
  console.error("❌ Root element not found!");
  document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1 style="color: red;">Error: Root element not found!</h1></div>';
  throw new Error("Root element not found! Make sure index.html has <div id='root'></div>");
}
console.log("✅ Root element found");

// Add error handling for the root render
try {
  console.log("🔄 Creating React root...");
  const root = createRoot(rootElement);
  console.log("✅ React root created");
  
  console.log("🔄 Rendering app...");
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  console.log("✅ App rendered successfully!");
} catch (error) {
  console.error("❌ Failed to render app:", error);
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; background: white; min-height: 100vh;">
        <h1 style="color: red; font-size: 24px; margin-bottom: 16px;">🚨 Critical Error</h1>
        <p style="color: #666; margin-bottom: 16px;">The application failed to start. Check the console for details.</p>
        <pre style="background: #f5f5f5; padding: 16px; border-radius: 4px; overflow: auto; border: 1px solid #ddd;">
          <strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}
          ${error instanceof Error && error.stack ? `\n\n<strong>Stack:</strong>\n${error.stack}` : ''}
        </pre>
      </div>
    `;
  }
}

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (rootElement && rootElement.innerHTML.includes('Loading application...')) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; background: white; min-height: 100vh;">
        <h1 style="color: red; font-size: 24px; margin-bottom: 16px;">🚨 JavaScript Error</h1>
        <p style="color: #666; margin-bottom: 16px;">An error occurred while loading the application.</p>
        <pre style="background: #f5f5f5; padding: 16px; border-radius: 4px; overflow: auto; border: 1px solid #ddd;">
          <strong>Error:</strong> ${event.error?.message || event.message || 'Unknown error'}
          ${event.error?.stack ? `\n\n<strong>Stack:</strong>\n${event.error.stack}` : ''}
        </pre>
      </div>
    `;
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  if (rootElement && rootElement.innerHTML.includes('Loading application...')) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; background: white; min-height: 100vh;">
        <h1 style="color: red; font-size: 24px; margin-bottom: 16px;">🚨 Loading Error</h1>
        <p style="color: #666; margin-bottom: 16px;">A module failed to load. This might be a network issue.</p>
        <pre style="background: #f5f5f5; padding: 16px; border-radius: 4px; overflow: auto; border: 1px solid #ddd;">
          <strong>Error:</strong> ${event.reason?.message || String(event.reason) || 'Unknown error'}
        </pre>
      </div>
    `;
  }
});

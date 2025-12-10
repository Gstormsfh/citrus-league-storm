import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'

console.log("🚀 Starting app initialization...");

// Ensure root element exists
const rootElement = document.getElementById("root");
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

import React from 'react';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 font-sans">
      <style>{`
        * {
          --color-dark: #2d2319;
          --color-panel: #3d3427;
          --color-border: #5c4d3d;
          --color-accent: #8b7355;
          --color-text: #d4c4a8;
          --color-input: #4a3f32;
        }
        
        body {
          background-color: var(--color-dark);
          color: var(--color-text);
        }
        
        input, select, textarea {
          background-color: var(--color-input) !important;
          border-color: var(--color-border) !important;
          color: var(--color-text) !important;
        }
        
        input::placeholder, select::placeholder {
          color: var(--color-accent);
        }
        
        button, [role="button"] {
          transition: all 0.2s ease;
        }
        
        button:hover, [role="button"]:hover {
          brightness: 1.1;
        }
      `}</style>
      {children}
    </div>
  );
}
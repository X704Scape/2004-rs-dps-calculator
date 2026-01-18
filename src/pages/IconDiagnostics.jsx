import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function IconDiagnostics() {
  const [items, setItems] = useState([]);
  const [missingIcons, setMissingIcons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await base44.functions.invoke('fetchGameData', { type: 'items' });
        const itemsList = response.data.items || [];
        setItems(itemsList);
        
        // Test each icon
        const missing = [];
        for (const item of itemsList) {
          try {
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = item.icon;
            });
          } catch {
            missing.push(item);
          }
        }
        setMissingIcons(missing);
      } catch (error) {
        console.error('Failed to load items:', error);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-600 mb-6">Icon Diagnostics</h1>
        
        {loading ? (
          <div className="text-amber-100 text-center py-12">Loading items and testing icons...</div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-amber-900 rounded p-6">
              <h2 className="text-xl font-bold text-amber-600 mb-4">Summary</h2>
              <div className="text-amber-100 space-y-2">
                <div>Total Items: {items.length}</div>
                <div>Missing Icons: {missingIcons.length}</div>
                <div>Success Rate: {((items.length - missingIcons.length) / items.length * 100).toFixed(1)}%</div>
              </div>
            </div>

            {missingIcons.length > 0 && (
              <div className="bg-gray-900 border border-amber-900 rounded p-6">
                <h2 className="text-xl font-bold text-amber-600 mb-4">Items Without Icons ({missingIcons.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                  {missingIcons.map(item => (
                    <div key={item.id} className="text-xs text-amber-100 bg-gray-800 p-2 rounded">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-amber-700 text-xs truncate">{item.icon}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
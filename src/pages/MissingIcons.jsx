import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MissingIcons() {
  const [items, setItems] = useState([]);
  const [missingIcons, setMissingIcons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndTestIcons = async () => {
      try {
        const response = await base44.functions.invoke('fetchGameData', { type: 'items' });
        const allItems = response.data.items || [];
        setItems(allItems);

        const missing = [];
        
        for (const item of allItems) {
          const iconUrl = item.iconUrl || item.icon;
          if (!iconUrl) {
            missing.push({ ...item, reason: 'No icon URL' });
            continue;
          }

          try {
            const testResponse = await fetch(iconUrl, { method: 'HEAD' });
            if (!testResponse.ok) {
              missing.push({ ...item, reason: 'Icon not found (404)' });
            }
          } catch (error) {
            missing.push({ ...item, reason: 'Failed to load' });
          }
        }

        setMissingIcons(missing);
      } catch (error) {
        console.error('Failed to fetch items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndTestIcons();
  }, []);

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Slot', 'Reason', 'Icon URL'];
    const rows = missingIcons.map(item => [
      item.id,
      item.name,
      item.slot,
      item.reason,
      item.iconUrl || ''
    ]);
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `missing-icons-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const data = JSON.stringify(missingIcons, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `missing-icons-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center">
        <div className="text-amber-100 text-lg">Testing {items.length} items...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-600 mb-6">Missing Icons Report</h1>
        
        <div className="bg-gray-900 border-2 border-amber-900 rounded p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-amber-100">{items.length}</div>
              <div className="text-sm text-amber-700">Total Items</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-500">{missingIcons.length}</div>
              <div className="text-sm text-amber-700">Missing Icons</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-500">
                {((items.length - missingIcons.length) / items.length * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-amber-700">Success Rate</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border-2 border-amber-900 rounded">
          <div className="bg-gray-950 border-b-2 border-amber-900 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-amber-600">Items with Missing Icons</h2>
            <div className="flex gap-2">
              <Button
                onClick={exportToCSV}
                disabled={missingIcons.length === 0}
                className="bg-amber-900 hover:bg-amber-800 text-amber-100"
                size="sm"
              >
                <Download size={16} className="mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={exportToJSON}
                disabled={missingIcons.length === 0}
                className="bg-amber-900 hover:bg-amber-800 text-amber-100"
                size="sm"
              >
                <Download size={16} className="mr-2" />
                Export JSON
              </Button>
            </div>
          </div>
          
          <div className="p-4">
            {missingIcons.length === 0 ? (
              <div className="text-center py-8 text-green-500 flex items-center justify-center gap-2">
                <CheckCircle size={24} />
                <span>All items have valid icons!</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {missingIcons.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-950 border border-amber-900 rounded p-3 flex items-start gap-3"
                  >
                    <AlertCircle size={20} className="text-red-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-amber-100 font-semibold">{item.name}</div>
                      <div className="text-xs text-amber-700 mt-1">
                        ID: {item.id} • Slot: {item.slot} • {item.reason}
                      </div>
                      {item.iconUrl && (
                        <div className="text-xs text-amber-800 mt-1 break-all">
                          {item.iconUrl}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import { useTranslation } from '@/contexts/LanguageContext';

type TableOption = {
  id: string;
  name: string;
  translationKey: string;
};

const TABLES: TableOption[] = [
  { id: 'categories', name: 'Categories', translationKey: 'admin.export.table-categories' },
  { id: 'products', name: 'Products', translationKey: 'admin.export.table-products' },
  { id: 'orders', name: 'Orders', translationKey: 'admin.export.table-orders' },
  { id: 'users', name: 'Users', translationKey: 'admin.export.table-users' },
  { id: 'specials', name: 'Special Offers', translationKey: 'admin.export.table-specials' },
  { id: 'parameters', name: 'Parameters', translationKey: 'admin.export.table-parameters' },
  { id: 'parameter_groups', name: 'Parameter Groups', translationKey: 'admin.export.table-parameter-groups' },
  { id: 'carts', name: 'Carts', translationKey: 'admin.export.table-carts' },
  { id: 'history', name: 'History', translationKey: 'admin.export.table-history' },
];

type ExportFormat = 'json' | 'csv';

export default function ExportPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleTable = (tableId: string) => {
    setSelectedTables(prev =>
      prev.includes(tableId)
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
    setError(null);
  };

  const handleSelectAll = () => {
    setSelectedTables(TABLES.map(t => t.id));
    setError(null);
  };

  const handleDeselectAll = () => {
    setSelectedTables([]);
    setError(null);
  };

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      setError(t('admin.export.no-tables'));
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tables: selectedTables,
          format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('admin.export.error'));
      }

      // Handle the download
      if (format === 'json') {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `database-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `database-export-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // Show success message
      alert(t('admin.export.success'));
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : t('admin.export.error'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t('admin.export.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {t('admin.export.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Description */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              {t('admin.export.description')}
            </p>
          </div>

          {/* Export Format Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('admin.export.format')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">
                  {t('admin.export.format-csv')}
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === 'json'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">
                  {t('admin.export.format-json')}
                </span>
              </label>
            </div>
          </div>

          {/* Table Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                {t('admin.export.tables')}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t('admin.export.select-all')}
                </button>
                <span className="text-gray-400">|</span>
                <button
                  onClick={handleDeselectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t('admin.export.deselect-all')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {TABLES.map((table) => (
                <label
                  key={table.id}
                  className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedTables.includes(table.id)}
                    onChange={() => handleToggleTable(table.id)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    {t(table.translationKey as any)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={isExporting || selectedTables.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
            >
              {isExporting ? t('admin.export.exporting') : t('admin.export.export-button')}
            </button>
          </div>

          {/* Selected Count */}
          {selectedTables.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              {selectedTables.length} {selectedTables.length === 1 ? 'table' : 'tables'} selected
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

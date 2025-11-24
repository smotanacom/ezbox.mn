import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';

// Available tables for export
const EXPORTABLE_TABLES = [
  'categories',
  'products',
  'orders',
  'users',
  'specials',
  'parameters',
  'parameter_groups',
  'carts',
  'history',
  'product_in_cart',
  'special_items',
  'product_parameter_groups',
] as const;

type ExportFormat = 'json' | 'csv';
type TableName = typeof EXPORTABLE_TABLES[number];

// Convert JSON data to CSV format
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach(row => {
    Object.keys(row).forEach(key => allKeys.add(key));
  });
  const headers = Array.from(allKeys);

  // Create CSV header
  const csvRows: string[] = [];
  csvRows.push(headers.map(h => `"${h}"`).join(','));

  // Create CSV rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';

      // Handle objects and arrays
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }

      // Handle strings with quotes or commas
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tables, format } = body as {
      tables: string[];
      format: ExportFormat;
    };

    // Validate input
    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one table' },
        { status: 400 }
      );
    }

    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be json or csv' },
        { status: 400 }
      );
    }

    // Validate table names
    const invalidTables = tables.filter(
      table => !EXPORTABLE_TABLES.includes(table as TableName)
    );
    if (invalidTables.length > 0) {
      return NextResponse.json(
        { error: `Invalid tables: ${invalidTables.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch data from each table
    const exportData: Record<string, any> = {};

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error(`Error fetching ${table}:`, error);
        return NextResponse.json(
          { error: `Failed to fetch ${table}: ${error.message}` },
          { status: 500 }
        );
      }

      exportData[table] = data || [];
    }

    // Format response based on requested format
    if (format === 'json') {
      return NextResponse.json({
        exported_at: new Date().toISOString(),
        exported_by: admin.username,
        tables: exportData,
      });
    } else if (format === 'csv') {
      // For CSV, create a ZIP-like structure with multiple files
      // For simplicity, we'll create a single CSV with table names as sections
      let csvContent = `# Database Export\n`;
      csvContent += `# Exported at: ${new Date().toISOString()}\n`;
      csvContent += `# Exported by: ${admin.username}\n\n`;

      for (const table of tables) {
        csvContent += `\n# Table: ${table}\n`;
        csvContent += convertToCSV(exportData[table]);
        csvContent += '\n';
      }

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="database-export-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to export data';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

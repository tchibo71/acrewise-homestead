import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { exportToCSV, printReport } from "@/components/utils/printHelpers";

export default function ExportButtons({ 
  data, 
  columns, 
  title, 
  subtitle, 
  fileName,
  variant = "outline",
  size = "default"
}) {
  const handleCSVExport = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Transform data using columns for proper formatting
    const exportData = data.map(item => {
      const row = {};
      columns.forEach(col => {
        const value = item[col.key];
        row[col.label] = col.format ? col.format(value) : (value ?? '');
      });
      return row;
    });

    exportToCSV(exportData, fileName);
  };

  const handlePrint = () => {
    printReport({
      title,
      subtitle,
      data: data.map(item => {
        const row = {};
        columns.forEach(col => {
          row[col.key] = col.format ? col.format(item[col.key]) : item[col.key];
        });
        return row;
      }),
      columns,
      fileName
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCSVExport}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export to CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print / PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
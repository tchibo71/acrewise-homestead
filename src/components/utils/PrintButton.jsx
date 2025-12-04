import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Printer, FileText, Download } from "lucide-react";
import { printReport, exportToWord, printToPhysical } from "./printUtils";

export default function PrintButton({ reportData, variant = "outline", size = "default", className = "" }) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async (type) => {
    setIsPrinting(true);
    try {
      if (type === 'pdf') {
        printReport(reportData);
      } else if (type === 'word') {
        exportToWord(reportData);
      } else if (type === 'printer') {
        printToPhysical(reportData);
      }
    } catch (error) {
      console.error("Print error:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setTimeout(() => setIsPrinting(false), 500);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={isPrinting}>
          <Printer className="w-4 h-4 mr-2" />
          {isPrinting ? "Generating..." : "Print / Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handlePrint('printer')}>
          <Printer className="w-4 h-4 mr-2" />
          Print to Printer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePrint('pdf')}>
          <FileText className="w-4 h-4 mr-2" />
          Save as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePrint('word')}>
          <Download className="w-4 h-4 mr-2" />
          Export to Word
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
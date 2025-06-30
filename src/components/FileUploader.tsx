
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, FileText, FileSpreadsheet, Link, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { DataRow } from "@/pages/Index";

interface FileUploaderProps {
  onDataLoaded: (data: DataRow[], headers: string[]) => void;
}

export const FileUploader = ({ onDataLoaded }: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [isLoadingGoogleSheet, setIsLoadingGoogleSheet] = useState(false);

  const processFile = useCallback((file: File) => {
    setIsProcessing(true);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          const data = results.data as DataRow[];
          onDataLoaded(data, headers);
          setIsProcessing(false);
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          setIsProcessing(false);
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length > 0) {
            const headers = jsonData[0] as string[];
            const rows = jsonData.slice(1).map(row => {
              const obj: DataRow = {};
              headers.forEach((header, index) => {
                obj[header] = (row as any[])[index] || '';
              });
              return obj;
            });
            
            onDataLoaded(rows, headers);
          }
          setIsProcessing(false);
        } catch (error) {
          console.error("Excel parsing error:", error);
          setIsProcessing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      setIsProcessing(false);
    }
  }, [onDataLoaded]);

  const handleGoogleSheetImport = async () => {
    if (!googleSheetUrl.trim()) return;
    
    setIsLoadingGoogleSheet(true);
    
    try {
      // Extract sheet ID from various Google Sheets URL formats
      let sheetId = '';
      const urlPatterns = [
        /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
        /id=([a-zA-Z0-9-_]+)/
      ];
      
      for (const pattern of urlPatterns) {
        const match = googleSheetUrl.match(pattern);
        if (match) {
          sheetId = match[1];
          break;
        }
      }
      
      if (!sheetId) {
        throw new Error('Invalid Google Sheets URL');
      }
      
      // Convert to CSV export URL
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch Google Sheet data');
      }
      
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          const data = results.data as DataRow[];
          onDataLoaded(data, headers);
          setIsLoadingGoogleSheet(false);
          setGoogleSheetUrl("");
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          alert("Error parsing Google Sheet data");
          setIsLoadingGoogleSheet(false);
        }
      });
      
    } catch (error) {
      console.error("Google Sheets import error:", error);
      alert("Error importing Google Sheet. Make sure the sheet is publicly accessible.");
      setIsLoadingGoogleSheet(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* File Upload Section */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 px-4">
          <div className="flex items-center gap-4 mb-4">
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          
          <div className="text-center mb-4">
            <p className="text-lg font-medium mb-2">
              Drop your file here or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supports CSV and Excel files (.csv, .xlsx, .xls)
            </p>
          </div>

          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          
          <Button 
            asChild 
            disabled={isProcessing}
            className="min-w-32"
          >
            <label htmlFor="file-upload" className="cursor-pointer">
              {isProcessing ? "Processing..." : "Choose File"}
            </label>
          </Button>
        </CardContent>
      </Card>

      {/* Google Sheets Import Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Link className="h-5 w-5 text-green-600" />
            <span className="font-medium">Import from Google Sheets</span>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Paste Google Sheets URL here..."
              value={googleSheetUrl}
              onChange={(e) => setGoogleSheetUrl(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleGoogleSheetImport}
              disabled={!googleSheetUrl.trim() || isLoadingGoogleSheet}
              className="min-w-32"
            >
              {isLoadingGoogleSheet ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Import"
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Note: The Google Sheet must be publicly accessible (Anyone with the link can view)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

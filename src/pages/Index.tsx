
import { useState } from "react";
import { FileUploader } from "@/components/FileUploader";
import { HeaderMapper } from "@/components/HeaderMapper";
import { SelectionUI } from "@/components/SelectionUI";
import { DecisionOutput } from "@/components/DecisionOutput";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface DataRow {
  [key: string]: string | number;
}

export interface HeaderMapping {
  item: string;
  thirdParty: string;
  grossProfit: string;
}

export interface Selection {
  thirdParty: string;
  items: string[];
}

export interface DecisionResult {
  decision: "Send to Apple" | "Send to Grand";
  totalProfit: number;
  drugCount: number;
  drugProfits: { drug: string; profit: number }[];
}

const Index = () => {
  const [data, setData] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [headerMapping, setHeaderMapping] = useState<HeaderMapping | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [decisionResult, setDecisionResult] = useState<DecisionResult | null>(null);

  const resetToStep = (step: number) => {
    if (step <= 1) {
      setData([]);
      setHeaders([]);
      setHeaderMapping(null);
      setSelection(null);
      setDecisionResult(null);
    } else if (step <= 2) {
      setHeaderMapping(null);
      setSelection(null);
      setDecisionResult(null);
    } else if (step <= 3) {
      setSelection(null);
      setDecisionResult(null);
    } else if (step <= 4) {
      setDecisionResult(null);
    }
  };

  const calculateDecision = (mapping: HeaderMapping, selection: Selection, data: DataRow[]): DecisionResult => {
    const drugProfits: { drug: string; profit: number }[] = [];
    let totalProfit = 0;

    // Calculate profit for each selected drug
    selection.items.forEach(item => {
      const matchingRow = data.find(row => 
        String(row[mapping.item]).toLowerCase() === item.toLowerCase() && 
        String(row[mapping.thirdParty]).toLowerCase() === selection.thirdParty.toLowerCase()
      );
      
      const profit = matchingRow ? parseFloat(String(matchingRow[mapping.grossProfit])) || 0 : 0;
      drugProfits.push({ drug: item, profit });
      totalProfit += profit;
    });

    // Apply decision logic
    let decision: "Send to Apple" | "Send to Grand";
    
    // Check if any drug starts with "doxy" (case-insensitive)
    const hasDoxyDrug = selection.items.some(item => 
      item.toLowerCase().startsWith("doxy")
    );
    
    if (hasDoxyDrug) {
      decision = "Send to Apple";
    } else if (totalProfit >= 36.50 * selection.items.length) {
      decision = "Send to Apple";
    } else {
      decision = "Send to Grand";
    }

    return {
      decision,
      totalProfit,
      drugCount: selection.items.length,
      drugProfits
    };
  };

  const handleSelectionComplete = (newSelection: Selection) => {
    setSelection(newSelection);
    if (headerMapping) {
      const result = calculateDecision(headerMapping, newSelection, data);
      setDecisionResult(result);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">CDI Decision Tool</h1>
            <p className="text-muted-foreground">Upload data and get intelligent routing decisions</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="space-y-6">
          {/* Step 1: File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                Upload Data File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploader 
                onDataLoaded={(newData, newHeaders) => {
                  setData(newData);
                  setHeaders(newHeaders);
                  resetToStep(2);
                }} 
              />
              {data.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    ✅ Loaded {data.length} rows with {headers.length} columns
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Header Mapping */}
          {headers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  Map Data Columns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HeaderMapper
                  headers={headers}
                  onMappingComplete={(mapping) => {
                    setHeaderMapping(mapping);
                    resetToStep(3);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Selection */}
          {headerMapping && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                  Make Your Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SelectionUI
                  data={data}
                  headerMapping={headerMapping}
                  onSelectionComplete={handleSelectionComplete}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Decision Output */}
          {decisionResult && selection && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                  Decision Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DecisionOutput
                  result={decisionResult}
                  selection={selection}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;

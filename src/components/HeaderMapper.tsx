
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { HeaderMapping } from "@/pages/Index";

interface HeaderMapperProps {
  headers: string[];
  onMappingComplete: (mapping: HeaderMapping) => void;
}

export const HeaderMapper = ({ headers, onMappingComplete }: HeaderMapperProps) => {
  const [mapping, setMapping] = useState<Partial<HeaderMapping>>({});

  // Auto-detect common column names
  useEffect(() => {
    const autoMapping: Partial<HeaderMapping> = {};
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      if (lowerHeader.includes('item') || lowerHeader.includes('drug') || lowerHeader.includes('product')) {
        autoMapping.item = header;
      } else if (lowerHeader.includes('third') || lowerHeader.includes('party') || lowerHeader.includes('insurance') || lowerHeader.includes('payer')) {
        autoMapping.thirdParty = header;
      } else if (lowerHeader.includes('profit') || lowerHeader.includes('gross')) {
        autoMapping.grossProfit = header;
      }
    });
    
    setMapping(autoMapping);
  }, [headers]);

  const handleSubmit = () => {
    if (mapping.item && mapping.thirdParty && mapping.grossProfit) {
      onMappingComplete(mapping as HeaderMapping);
    }
  };

  const isValid = mapping.item && mapping.thirdParty && mapping.grossProfit;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="item-select">Item (Drug Name)</Label>
          <Select
            value={mapping.item || ""}
            onValueChange={(value) => setMapping({ ...mapping, item: value })}
          >
            <SelectTrigger id="item-select">
              <SelectValue placeholder="Select item column" />
            </SelectTrigger>
            <SelectContent>
              {headers.map(header => (
                <SelectItem key={header} value={header}>
                  {header}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="third-party-select">Third Party (Insurance)</Label>
          <Select
            value={mapping.thirdParty || ""}
            onValueChange={(value) => setMapping({ ...mapping, thirdParty: value })}
          >
            <SelectTrigger id="third-party-select">
              <SelectValue placeholder="Select third party column" />
            </SelectTrigger>
            <SelectContent>
              {headers.map(header => (
                <SelectItem key={header} value={header}>
                  {header}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profit-select">Gross Profit</Label>
          <Select
            value={mapping.grossProfit || ""}
            onValueChange={(value) => setMapping({ ...mapping, grossProfit: value })}
          >
            <SelectTrigger id="profit-select">
              <SelectValue placeholder="Select profit column" />
            </SelectTrigger>
            <SelectContent>
              {headers.map(header => (
                <SelectItem key={header} value={header}>
                  {header}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={!isValid}
          className="min-w-32"
        >
          Continue
        </Button>
      </div>

      {!isValid && (
        <p className="text-sm text-muted-foreground">
          Please select all three column mappings to continue.
        </p>
      )}
    </div>
  );
};

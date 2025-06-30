
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DataRow, HeaderMapping, Selection } from "@/pages/Index";
import { SearchableSelect } from "@/components/SearchableSelect";
import { SearchableMultiSelect } from "@/components/SearchableMultiSelect";

interface SelectionUIProps {
  data: DataRow[];
  headerMapping: HeaderMapping;
  onSelectionComplete: (selection: Selection) => void;
}

export const SelectionUI = ({ data, headerMapping, onSelectionComplete }: SelectionUIProps) => {
  const [selectedThirdParty, setSelectedThirdParty] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Get unique values for dropdowns
  const uniqueThirdParties = useMemo(() => {
    const parties = new Set<string>();
    data.forEach(row => {
      const party = String(row[headerMapping.thirdParty]);
      if (party && party.trim()) {
        parties.add(party.trim());
      }
    });
    return Array.from(parties).sort();
  }, [data, headerMapping.thirdParty]);

  const uniqueItems = useMemo(() => {
    const items = new Set<string>();
    data.forEach(row => {
      const item = String(row[headerMapping.item]);
      if (item && item.trim()) {
        items.add(item.trim());
      }
    });
    return Array.from(items).sort();
  }, [data, headerMapping.item]);

  const handleSubmit = () => {
    if (selectedThirdParty && selectedItems.length > 0) {
      onSelectionComplete({
        thirdParty: selectedThirdParty,
        items: selectedItems
      });
    }
  };

  const isValid = selectedThirdParty && selectedItems.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Third Party Selection */}
        <div className="space-y-4">
          <Label htmlFor="third-party">Select Insurance/Payer</Label>
          <SearchableSelect
            options={uniqueThirdParties}
            value={selectedThirdParty}
            onValueChange={setSelectedThirdParty}
            placeholder="Choose an insurance/payer"
            emptyText="No insurance/payers found."
          />
          {selectedThirdParty && (
            <p className="text-sm text-muted-foreground">
              Selected: <span className="font-medium">{selectedThirdParty}</span>
            </p>
          )}
        </div>

        {/* Items Multi-select */}
        <div className="space-y-4">
          <Label>Select Drugs/Items ({selectedItems.length} selected)</Label>
          <SearchableMultiSelect
            options={uniqueItems}
            selectedValues={selectedItems}
            onSelectionChange={setSelectedItems}
            placeholder="Choose drugs/items"
            emptyText="No drugs/items found."
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {selectedItems.length > 0 && (
            <span>{selectedItems.length} drug{selectedItems.length !== 1 ? 's' : ''} selected</span>
          )}
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={!isValid}
          className="min-w-32"
        >
          Calculate Decision
        </Button>
      </div>

      {!isValid && (
        <p className="text-sm text-muted-foreground">
          Please select an insurance/payer and at least one drug to continue.
        </p>
      )}
    </div>
  );
};

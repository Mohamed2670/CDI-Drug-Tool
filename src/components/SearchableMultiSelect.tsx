
import { useState, useMemo } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableMultiSelectProps {
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder: string;
  emptyText?: string;
}

export const SearchableMultiSelect = ({ 
  options, 
  selectedValues, 
  onSelectionChange, 
  placeholder,
  emptyText = "No options found."
}: SearchableMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchValue) return options;
    return options.filter(option =>
      option.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [options, searchValue]);

  const handleToggleOption = (option: string) => {
    const isSelected = selectedValues.includes(option);
    if (isSelected) {
      onSelectionChange(selectedValues.filter(value => value !== option));
    } else {
      onSelectionChange([...selectedValues, option]);
    }
  };

  const handleRemoveOption = (option: string) => {
    onSelectionChange(selectedValues.filter(value => value !== option));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedValues.length > 0 
              ? `${selectedValues.length} selected`
              : placeholder
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command>
            <CommandInput
              placeholder={`Search ${placeholder.toLowerCase()}...`}
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => handleToggleOption(option)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedValues.includes(option) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option}
                    {option.toLowerCase().startsWith('doxy') && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-200">
                        Doxy Drug
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected items display */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px] bg-muted/30">
          {selectedValues.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {value}
              <button
                onClick={() => handleRemoveOption(value)}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, LogOut } from "lucide-react";
import { format, isValid } from "date-fns";
import { SearchableSelect } from "@/components/SearchableSelect";
import { SearchableMultiSelect } from "@/components/SearchableMultiSelect";
import { useAuth } from "@/contexts/AuthContext";
import {
  useProfitData,
  generateTransactionId,
  postToLogsSheet,
} from "@/hooks/useGoogleSheets";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/api/axiosInstance";

interface PatientData {
  lastName: string;
  dob: Date | undefined;
  firstInitial: string;
  mrn: string;
}

interface Selection {
  insurance: string;
  drugs: string[];
}

interface DecisionResult {
  decision: "Send to Apple" | "Send to Grand";
  totalProfit: number;
  drugProfits: { drug: string; profit: number }[];
  transactionId: string;
}

export const GuestWorkflow = () => {
  const { user, logout } = useAuth();
  const { data: profitData, loading } = useProfitData();
  const { toast } = useToast();
  const [patientData, setPatientData] = useState<PatientData>({
    lastName: "",
    dob: undefined,
    firstInitial: "",
    mrn: "",
  });
  const [selection, setSelection] = useState<Selection>({
    insurance: "",
    drugs: [],
  });
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get unique insurances
  const uniqueInsurances = [
    ...new Set(profitData.map((row) => row["Third Party"])),
  ]
    .filter(Boolean)
    .sort();

  // Filter drugs based on selected insurance
  const filteredDrugs = selection.insurance
    ? profitData
        .filter((row) => row["Third Party"] === selection.insurance)
        .map((row) => row.Item)
        .filter(Boolean)
    : [];

  const uniqueDrugs = [...new Set(filteredDrugs)].sort();

  const calculateDecision = (): DecisionResult => {
    const drugProfits: { drug: string; profit: number }[] = [];
    let totalProfit = 0;

    // Calculate profit for each selected drug
    selection.drugs.forEach((drug) => {
      const matchingRow = profitData.find(
        (row) => row.Item === drug && row["Third Party"] === selection.insurance
      );
      const raw = matchingRow?.["Gross Profit"] ?? "0";
      const profit = parseFloat(raw.replace(/[^0-9.-]+/g, "")) || 0;

      drugProfits.push({ drug, profit });
      totalProfit += profit;
    });

    // Apply decision logic
    let decision: "Send to Apple" | "Send to Grand";

    const hasDoxyDrug = selection.drugs.some((drug) =>
      drug.toLowerCase().startsWith("doxy")
    );

    if (hasDoxyDrug) {
      decision = "Send to Apple";
    } else if (totalProfit >= 36.5 * selection.drugs.length) {
      decision = "Send to Apple";
    } else {
      decision = "Send to Grand";
    }

    return {
      decision,
      totalProfit,
      drugProfits,
      transactionId: generateTransactionId(),
    };
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsSubmitting(true);
    const decisionResult = calculateDecision();
    setResult(decisionResult);

    try {
      // Log to Google Sheets
      await axiosInstance.post("/log/CreateLog", {
        "Guest Name": user?.name || "",
        "Last Name": patientData.lastName,
        dob: patientData.dob?.toISOString().split("T")[0] || "",
        "First Initial": patientData.firstInitial,
        mrn: patientData.mrn,
        insurance: selection.insurance,
        "Selected Drugs": decisionResult.drugProfits
          .map((item) => `${item.drug} ($${item.profit.toFixed(2)})`)
          .join(", "),
        "Total Profit": decisionResult.totalProfit.toFixed(2),
        "Final Decision": decisionResult.decision,
        "Transaction ID": decisionResult.transactionId,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: "Decision Calculated",
        description: "Data has been logged successfully.",
      });
    } catch (error) {
      toast({
        title: "Warning",
        description: "Decision calculated but logging failed.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      patientData.lastName &&
      patientData.dob &&
      patientData.firstInitial &&
      patientData.mrn &&
      selection.insurance &&
      selection.drugs.length > 0
    );
  };

  const resetForm = () => {
    setResult(null);
    setPatientData({
      lastName: "",
      dob: undefined,
      firstInitial: "",
      mrn: "",
    });
    setSelection({
      insurance: "",
      drugs: [],
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading profit data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">CDI Decision Tool</h1>
            <p className="text-muted-foreground">Welcome, {user?.name}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {!result ? (
          <div className="space-y-6">
            {/* Patient Information */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={patientData.lastName}
                    onChange={(e) =>
                      setPatientData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    max={format(new Date(), "yyyy-MM-dd")} // still restricts UI date picker
                    value={
                      patientData.dob && isValid(new Date(patientData.dob))
                        ? format(new Date(patientData.dob), "yyyy-MM-dd")
                        : ""
                    }
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const today = new Date();

                      // If selected date is in the future, override with today
                      const correctedDate =
                        selectedDate > today ? today : selectedDate;

                      setPatientData((prev) => ({
                        ...prev,
                        dob: isValid(correctedDate) ? correctedDate : undefined,
                      }));
                    }}
                    placeholder="YYYY-MM-DD"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="firstInitial">First Initial</Label>
                  <Input
                    id="firstInitial"
                    value={patientData.firstInitial}
                    onChange={(e) =>
                      setPatientData((prev) => ({
                        ...prev,
                        firstInitial: e.target.value.charAt(0).toUpperCase(),
                      }))
                    }
                    placeholder="F"
                    maxLength={1}
                  />
                </div>
                <div>
                  <Label htmlFor="mrn">MRN</Label>
                  <Input
                    id="mrn"
                    value={patientData.mrn}
                    onChange={(e) =>
                      setPatientData((prev) => ({
                        ...prev,
                        mrn: e.target.value,
                      }))
                    }
                    placeholder="Medical Record Number"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Drug Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Insurance/Payer</Label>
                  <SearchableSelect
                    options={uniqueInsurances}
                    value={selection.insurance}
                    onValueChange={(value) =>
                      setSelection((prev) => ({
                        ...prev,
                        insurance: value,
                        drugs: [], // Reset drugs when insurance changes
                      }))
                    }
                    placeholder="Select insurance"
                  />
                </div>
                <div>
                  <Label>Drugs ({selection.drugs.length} selected)</Label>
                  <SearchableMultiSelect
                    options={uniqueDrugs}
                    selectedValues={selection.drugs}
                    onSelectionChange={(drugs) =>
                      setSelection((prev) => ({ ...prev, drugs }))
                    }
                    placeholder={
                      selection.insurance
                        ? "Select drugs"
                        : "Select insurance first"
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? "Processing..." : "Calculate Decision"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Decision Result */}
            <Card
              className={
                result.decision === "Send to Apple"
                  ? "border-green-500"
                  : "border-red-500"
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Decision Result
                  <Badge
                    variant={
                      result.decision === "Send to Apple"
                        ? "default"
                        : "destructive"
                    }
                    className="text-lg px-4 py-2"
                  >
                    {result.decision}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {selection.drugs.length}
                    </p>
                    <p className="text-muted-foreground">Selected Drugs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-mono">{result.transactionId}</p>
                    <p className="text-muted-foreground">Transaction ID</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-2 text-left">
                          Drug
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.drugProfits.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-border p-2">
                            {item.drug}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Button onClick={resetForm} className="w-full" variant="outline">
              New Entry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DecisionResult, Selection } from "@/pages/Index";

interface DecisionOutputProps {
  result: DecisionResult;
  selection: Selection;
}

export const DecisionOutput = ({ result, selection }: DecisionOutputProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const isApple = result.decision === "Send to Apple";

  return (
    <div className="space-y-6">
      {/* Decision Card */}
      <Card className={`border-2 ${isApple ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'}`}>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${isApple ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {result.decision}
            </div>
            <Badge 
              variant={isApple ? "default" : "destructive"}
              className="text-lg px-4 py-2"
            >
              {isApple ? "✅ Apple Route" : "❌ Grand Route"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(result.totalProfit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Selected Drugs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {result.drugCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Insurance/Payer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium truncate">
              {selection.thirdParty}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drug Profit Table */}
      <Card>
        <CardHeader>
          <CardTitle>Drug Profit Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drug Name</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.drugProfits.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.drug}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={item.profit > 0 ? 'text-green-600' : 'text-muted-foreground'}>
                        {formatCurrency(item.profit)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.drug.toLowerCase().startsWith('doxy') && (
                        <Badge variant="secondary" className="text-xs">
                          Doxy Drug
                        </Badge>
                      )}
                      {item.profit === 0 && (
                        <Badge variant="outline" className="text-xs">
                          No matching data
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Logic Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Decision Logic Applied</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {selection.items.some(item => item.toLowerCase().startsWith('doxy')) ? (
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <strong>Doxy Rule Applied:</strong> At least one selected drug starts with "doxy" → Send to Apple
              </p>
            ) : (
              <>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  No "doxy" drugs selected
                </p>
                <p className="flex items-center gap-2">
                  <span className={`w-2 h-2 ${result.totalProfit >= 36.50 * result.drugCount ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></span>
                  <strong>Profit Rule:</strong> Total profit ({formatCurrency(result.totalProfit)}) 
                  {result.totalProfit >= 36.50 * result.drugCount ? ' ≥ ' : ' < '}
                  {formatCurrency(36.50 * result.drugCount)} (${36.50} × {result.drugCount} drugs)
                  → {result.decision}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

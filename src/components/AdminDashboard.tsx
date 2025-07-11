import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LogOut, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLogsData } from "@/hooks/useGoogleSheets";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const LOGS_PER_PAGE = 20;

export const AdminDashboard = () => {
  const { logout } = useAuth();
  const { data: logs, loading, refetch } = useLogsData();
  const [filters, setFilters] = useState({
    guestName: "",
    decision: "",
    dateFrom: "",
    dateTo: "",
  });

  // Modal state for cell click
  const [selectedCell, setSelectedCell] = useState<{
    label: string;
    value: string;
  } | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);

  const filteredLogs = useMemo(() => {
    const filtered = logs.filter((log) => {
      const matchesGuest =
        !filters.guestName ||
        log.GuestName.toLowerCase().includes(filters.guestName.toLowerCase());

      const matchesDecision =
        !filters.decision || log.Decision.includes(filters.decision);

      const logDate = new Date(log.Timestamp);
      const matchesDateFrom =
        !filters.dateFrom || logDate >= new Date(filters.dateFrom);

      const matchesDateTo =
        !filters.dateTo || logDate <= new Date(filters.dateTo);

      return (
        matchesGuest && matchesDecision && matchesDateFrom && matchesDateTo
      );
    });

    // Sort by Timestamp descending (most recent first)
    return filtered.sort(
      (a, b) =>
        new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
    );
  }, [logs, filters]);

  // Reset page to 1 when filters change
  useMemo(() => {
    setPage(1);
  }, [filters, logs]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / LOGS_PER_PAGE));
  const paginatedLogs = filteredLogs.slice(
    (page - 1) * LOGS_PER_PAGE,
    page * LOGS_PER_PAGE
  );

  const analytics = useMemo(() => {
    const totalDecisions = filteredLogs.length;
    const appleDecisions = filteredLogs.filter(
      (log) => log.Decision === "Send to Apple"
    ).length;
    const grandDecisions = filteredLogs.filter(
      (log) => log.Decision === "Send to Grand"
    ).length;

    const userActivity = filteredLogs.reduce((acc, log) => {
      const name = log.GuestName;
      if (!acc[name]) {
        acc[name] = { count: 0, totalProfit: 0 };
      }
      acc[name].count++;
      acc[name].totalProfit += parseFloat(log.TotalProfit) || 0;
      return acc;
    }, {} as Record<string, { count: number; totalProfit: number }>);

    const topUsers = Object.entries(userActivity)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    return {
      totalDecisions,
      appleDecisions,
      grandDecisions,
      applePercentage:
        totalDecisions > 0
          ? Math.round((appleDecisions / totalDecisions) * 100)
          : 0,
      grandPercentage:
        totalDecisions > 0
          ? Math.round((grandDecisions / totalDecisions) * 100)
          : 0,
      topUsers,
    };
  }, [filteredLogs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">System analytics and logs</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Decisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.totalDecisions}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Apple Decisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analytics.appleDecisions}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.applePercentage}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Grand Decisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {analytics.grandDecisions}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.grandPercentage}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.topUsers.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Users */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top Users by Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.topUsers.map(([name, stats], index) => (
                <div
                  key={name}
                  className="flex justify-between items-center p-2 bg-muted rounded"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="font-medium">{name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {stats.count} decisions
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${stats.totalProfit.toFixed(2)} total profit
                    </div>
                  </div>
                </div>
              ))}
              {analytics.topUsers.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No user activity yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="guestName">Guest Name</Label>
                <Input
                  id="guestName"
                  value={filters.guestName}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      guestName: e.target.value,
                    }))
                  }
                  placeholder="Filter by name"
                />
              </div>
              <div>
                <Label htmlFor="decision">Decision</Label>
                <select
                  id="decision"
                  value={filters.decision}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      decision: e.target.value,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">All Decisions</option>
                  <option value="Apple">Send to Apple</option>
                  <option value="Grand">Send to Grand</option>
                </select>
              </div>
              <div>
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateFrom: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="dateTo">Date To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table with Pagination */}
        <Card>
          <CardHeader>
            <CardTitle>
              Decision Logs ({filteredLogs.length} entries)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-2 text-left">
                      Timestamp
                    </th>
                    <th className="border border-border p-2 text-left">
                      Guest
                    </th>
                    <th className="border border-border p-2 text-left">
                      Patient
                    </th>
                    <th className="border border-border p-2 text-left">
                      Insurance
                    </th>
                    <th className="border border-border p-2 text-left">
                      Drugs
                    </th>
                    <th className="border border-border p-2 text-right">
                      Profit
                    </th>
                    <th className="border border-border p-2 text-center">
                      Decision
                    </th>
                    <th className="border border-border p-2 text-left">
                      Transaction ID
                    </th>
                    <th className="border border-border p-2 text-left">
                      First Initial
                    </th>
                    <th className="border border-border p-2 text-left">
                      DOB
                    </th>
                    <th className="border border-border p-2 text-left">
                      MRN
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td
                        className="border border-border p-2 cursor-pointer"
                        onClick={() =>
                          setSelectedCell({
                            label: "Timestamp",
                            value: new Date(log.Timestamp).toLocaleString(),
                          })
                        }
                      >
                        {new Date(log.Timestamp).toLocaleString()}
                      </td>
                      <td
                        className="border border-border p-2 cursor-pointer"
                        onClick={() =>
                          setSelectedCell({
                            label: "Guest",
                            value: log.GuestName,
                          })
                        }
                      >
                        {log.GuestName}
                      </td>
                      <td
                        className="border border-border p-2 cursor-pointer"
                        onClick={() =>
                          setSelectedCell({
                            label: "Patient",
                            value: `${log.LastName}, ${log.FirstInitial}\nMRN: ${log.MRN}`,
                          })
                        }
                      >
                        {log.LastName}, {log.FirstInitial}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          MRN: {log.MRN}
                        </span>
                      </td>
                      <td
                        className="border border-border p-2 cursor-pointer"
                        onClick={() =>
                          setSelectedCell({
                            label: "Insurance",
                            value: log.Insurance,
                          })
                        }
                      >
                        {log.Insurance}
                      </td>
                      <td
                        className="border border-border p-2 max-w-48 cursor-pointer"
                        onClick={() =>
                          setSelectedCell({
                            label: "Drugs",
                            value: log.Drugs,
                          })
                        }
                      >
                        <div className="truncate" title={log.Drugs}>
                          {log.Drugs}
                        </div>
                      </td>
                      <td
                        className="border border-border p-2 text-right cursor-pointer"
                        onClick={() =>
                          setSelectedCell({
                            label: "Profit",
                            value: `$${parseFloat(log.TotalProfit).toFixed(2)}`,
                          })
                        }
                      >
                        ${parseFloat(log.TotalProfit).toFixed(2)}
                      </td>
                      <td
                        className="border border-border p-2 text-center cursor-pointer"
                        onClick={() =>
                          setSelectedCell({
                            label: "Decision",
                            value: log.Decision,
                          })
                        }
                      >
                        <Badge
                          variant={
                            log.Decision === "Send to Apple"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {log.Decision}
                        </Badge>
                      </td>
                      <td
                        className="border border-border p-2 font-mono text-xs cursor-pointer"
                        onClick={() =>
                          setSelectedCell({
                            label: "Transaction ID",
                            value: log.TransactionID,
                          })
                        }
                      >
                        {log.TransactionID}
                      </td>
                      <td
                        className="border border-border p-2 font-mono text-xs cursor-pointer"
                        onClick={() =>
                          setSelectedCell({
                            label: "First Initial",
                            value: log.FirstInitial,
                          })
                        }
                      >
                        {log.FirstInitial}
                      </td>
                      <td
                        className="border border-border p-2 font-mono text-xs cursor-pointer"
                        onClick={() =>
                          setSelectedCell({
                            label: "DOB",
                            value: log.DOB,
                          })
                        }
                      >
                        {log.DOB}
                      </td>
                      <td
                        className="border border-border p-2 font-mono text-xs cursor-pointer"
                        onClick={() =>
                          setSelectedCell({
                            label: "MRN",
                            value: log.MRN,
                          })
                        }
                      >
                        {log.MRN}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No logs found matching the current filters
                </div>
              )}
            </div>
            {/* Pagination Controls */}
            {filteredLogs.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal for cell details */}
        <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedCell?.label}</DialogTitle>
            </DialogHeader>
            <div className="whitespace-pre-wrap break-all">{selectedCell?.value}</div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
import { useState, useEffect } from "react";
import Papa from "papaparse";
import { toast } from "sonner";

export interface ProfitData {
  Item: string;
  "Third Party": string;
  "Gross Profit": string;
}

export interface LogEntry {
  Timestamp: string;
  GuestName: string;          // ✅ no space
  LastName: string;
  DOB: string;
  FirstInitial: string;
  MRN: string;
  Insurance: string;
  Drugs: string;
  TotalProfit: string;
  Decision: string;
  TransactionID: string;
}

const PROFIT_DATA_URL =
  "https://docs.google.com/spreadsheets/d/18OMVNlPpyHEmW5NYUXkPFGvVwUnE4llR/export?format=csv&gid=1921540594";
const LOGS_DATA_URL =
  "https://docs.google.com/spreadsheets/d/1J-vVUlu9H1_v7OOH7iVYWV4dOKZ9oSl60lpg-TwLVxc/export?format=csv&gid=0";

export const useProfitData = () => {
  const [data, setData] = useState<ProfitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(PROFIT_DATA_URL);
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            setData(results.data as ProfitData[]);
            setLoading(false);
          },
          error: (error) => {
            setError(error.message);
            setLoading(false);
          },
        });
      } catch (err) {
        setError("Failed to fetch profit data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

export const useLogsData = () => {
  const [data, setData] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(LOGS_DATA_URL);
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          setData(results.data as LogEntry[]);
          setLoading(false);
        },
        error: (error) => {
          setError(error.message);
          setLoading(false);
        },
      });
      console.log("logs data [0]",data[0], "gust data : ",data[0]["Guest Name"]);
    } catch (err) {
      setError("Failed to fetch logs data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return { data, loading, error, refetch: fetchLogs };
};

export const generateTransactionId = () => {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0");
  const randomDigits = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `TXN-${dateStr}-${randomDigits}`;
};
export interface LogEntry2 {
  Timestamp: string;
  "Guest Name": string;
  "Last Name": string;
  DOB: string;
  "First Initial": string;
  MRN: string;
  Insurance: string;
  "Selected Drugs": string;
  "Total Profit": string;
  "Final Decision": string;
  "Transaction ID": string;
}
export const postToLogsSheet = async (logData: Omit<LogEntry2, "Timestamp">) => {
  try {
    // Prepare the data with timestamp in the format expected by your script
    const dataToSend = {
      Timestamp: new Date().toISOString(),
      GuestName: logData["Guest Name"] || "",
      LastName: logData["Last Name"] || "",
      DOB: logData.DOB || "",
      FirstInitial: logData["First Initial"] || "",
      MRN: logData.MRN || "",
      Insurance: logData.Insurance || "",
      Drugs: logData["Selected Drugs"] || "",
      TotalProfit: logData["Total Profit"] || "",
      Decision: logData["Final Decision"] || "",
      TransactionID: logData["Transaction ID"] || "",
    };
    console.log("Sending data to Google Apps Script:", dataToSend);

    const response = await fetch(
      "https://api.sheetbest.com/sheets/8e0f6a48-4f8c-4c31-901d-b286ca2e971b",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Logged to Google Sheet via Sheet.best:", result);
    toast.success("✅ Successfully logged!");
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ Failed to post to Sheet.best:", error);
    toast.error("❌ Logging failed.");
    throw error;
  }
};

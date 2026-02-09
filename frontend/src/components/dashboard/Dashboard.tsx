import { useEffect, useState } from "react";
import { getDashboardSummary } from "@/api/dashboard";
import StatCard from "./StatCard";
import { Phone, FileText, AlertTriangle, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getDashboardSummary();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Total Calls"
        value={data.totalCalls}
        subtitle="Calls processed"
        icon={Phone}
        variant="info"
      />
      <StatCard
        title="Summaries"
        value={data.summariesGenerated}
        subtitle="Generated"
        icon={FileText}
        variant="default"
      />
      <StatCard
        title="Warnings"
        value={data.complianceWarnings}
        subtitle="Compliance"
        icon={AlertTriangle}
        variant="warning"
      />
      <StatCard
        title="Success"
        value={data.successfulCalls}
        subtitle="Completed"
        icon={CheckCircle}
        variant="success"
      />
    </div>
  );
}

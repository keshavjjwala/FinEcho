import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import {
  Phone,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import DateRangePicker from '@/components/dashboard/DateRangePicker';
import { getCallsList } from '@/api/calls';
import type { CallFromCallsApi } from '@/api/calls';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const defaultRange = { from: subDays(new Date(), 30), to: new Date() };

const CallsList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultRange);
  const [calls, setCalls] = useState<CallFromCallsApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const from = dateRange?.from ?? defaultRange.from;
    const to = dateRange?.to ?? defaultRange.to;
    setLoading(true);
    setError(null);
    getCallsList(format(from, 'yyyy-MM-dd'), format(to, 'yyyy-MM-dd'))
      .then(setCalls)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load calls'))
      .finally(() => setLoading(false));
  }, [dateRange]);

  const filteredCalls = useMemo(() => {
    let result = calls;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (call) =>
          call.clientName.toLowerCase().includes(q) ||
          (call.advisorName ?? '').toLowerCase().includes(q)
      );
    }
    const statusParam = searchParams.get('status');
    if (statusParam === 'needs_review') {
      result = result.filter((call) => call.complianceStatus === 'needs_review');
    }
    return result;
  }, [calls, searchQuery, searchParams]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Calls</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage your recorded advisory calls
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client or advisor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
          <>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Language
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Compliance
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCalls.map((call) => (
                <tr
                  key={call.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/calls/${call.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-medium text-primary">
                          {call.clientName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {call.clientName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {call.advisorName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">
                      {format(new Date(call.callDate), 'MMM dd, yyyy')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDuration(call.callDuration)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="font-normal">
                      {call.languageDetected}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={cn(
                        'font-normal',
                        call.status === 'completed'
                          ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                          : call.status?.startsWith('failed')
                          ? 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
                          : 'bg-muted text-muted-foreground border-border hover:bg-muted'
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        {call.status === 'completed' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {(() => {
                          switch (call.status) {
                            case 'uploaded':
                              return 'Uploaded';
                            case 'transcribing':
                              return 'Transcribing';
                            case 'transcribed':
                              return 'Summarizing';
                            case 'completed':
                              return 'Completed';
                            case 'failed_transcription':
                              return 'Transcription failed';
                            case 'failed_summary':
                              return 'Summary failed';
                            default:
                              return call.status || 'Pending';
                          }
                        })()}
                      </span>
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={cn(
                        'font-normal',
                        call.complianceStatus === 'clear'
                          ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                          : (call.compliance_status === 'risk'
                            ? 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
                            : 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20')
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        {call.complianceStatus === 'clear' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {call.complianceStatus === 'clear'
                          ? 'Clear'
                          : (call.compliance_status === 'risk' ? 'Risk' : 'Warning') +
                            (Array.isArray(call.compliance_flags) && call.compliance_flags.length > 0
                              ? ` (${call.compliance_flags.length})`
                              : '')}
                      </span>
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCalls.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Phone className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No calls found for the selected criteria</p>
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallsList;

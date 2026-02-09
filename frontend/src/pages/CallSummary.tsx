import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Globe,
  FileText,
  Target,
  Shield,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCallById, deleteCall, type CallDetailFromApi } from '@/api/calls';
import { getCallSummary } from '@/api/dashboard';
import SIPCard from '@/components/call-summary/SIPCard';
import SummaryCharts from '@/components/call-summary/SummaryCharts';
import { cn } from '@/lib/utils';
import type { CallSummary as CallSummaryType } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

function mapApiSummaryToCallSummary(row: Record<string, unknown>, callId: string): CallSummaryType {
  const goals = row.goals;
  const financialGoals = Array.isArray(goals) ? goals as string[] : goals ? [String(goals)] : [];
  const riskLevel = (row.risk_level as string) || 'moderate';
  const sipType = (row.sip_type as string) || 'discussion_only';
  const sipCategory = (row.sip_category as string) || 'equity';
  const clientResponse = String(row.client_response || '').toLowerCase();
  const proceeded = clientResponse !== 'deferred';
  return {
    id: String(row.id ?? callId),
    callId,
    callDate: (row.created_at as string)?.slice(0, 10) ?? '',
    callDuration: 0,
    advisorName: 'Advisor',
    clientName: 'Client',
    languageUsed: '—',
    conversationSummary: String(row.summary ?? ''),
    clientUnderstanding: {
      financialGoals,
      timeHorizon: 'medium',
      riskComfortLevel: ['low', 'moderate', 'high'].includes(riskLevel) ? riskLevel as 'low' | 'moderate' | 'high' : 'moderate',
      investmentAwarenessLevel: 'moderate',
    },
    sipDiscussions: [
      {
        id: 'api-1',
        sipType: ['new', 'modification', 'pause', 'discussion_only'].includes(sipType) ? sipType as 'new' | 'modification' | 'pause' | 'discussion_only' : 'discussion_only',
        sipAmount: typeof row.sip_amount === 'number' ? row.sip_amount : undefined,
        sipFrequency: 'monthly',
        fundCategory: ['equity', 'debt', 'hybrid', 'elss'].includes(sipCategory) ? sipCategory as 'equity' | 'debt' | 'hybrid' | 'elss' : 'equity',
        goalBasedReason: 'From advisory call',
        riskExplanationGiven: row.risk_explained ? 'yes' : 'no',
        clientDecisionState: proceeded ? 'proceeded' : 'deferred',
        ...(proceeded ? {} : { deferralNote: 'Client did not provide immediate consent.' }),
      },
    ],
    clientResponseSummary: proceeded ? 'proceeded' : 'deferred',
  };
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

/** Call Details view from GET /api/calls/:id (calls table). */
function CallDetailsView({ call, onDelete }: { call: CallDetailFromApi; onDelete: () => void }) {
  const flags = call.compliance_flags ?? [];
  const isFailed = call.status?.startsWith('failed');

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <Button onClick={() => window.history.back()} variant="ghost">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Calls
        </Button>
        <Button
          variant="destructive"
          onClick={onDelete}
        >
          Delete Call
        </Button>
      </div>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Call Details</h1>
          <p className="text-muted-foreground">Client: {call.clientName}</p>
        </div>
        <Badge
          className={cn(
            'text-sm font-normal',
            call.compliance_status === 'clear' && 'bg-success/10 text-success border-success/20',
            call.compliance_status === 'warning' && 'bg-warning/10 text-warning border-warning/20',
            call.compliance_status === 'risk' && 'bg-destructive/10 text-destructive border-destructive/20'
          )}
        >
          {call.compliance_status === 'clear' ? (
            <><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Clear</>
          ) : call.compliance_status === 'risk' ? (
            <><AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Risk</>
          ) : (
            <><AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Warning</>
          )}
          {flags.length > 0 && ` (${flags.length})`}
        </Badge>
      </div>

      <section className="card-elevated p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Call overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium text-foreground">
                {call.created_at ? format(new Date(call.created_at), 'MMM dd, yyyy') : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-medium text-foreground">{formatDuration(call.duration_seconds)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="text-sm font-medium text-foreground">{call.clientName}</p>
              {(call.clientEmail || call.clientPhone) && (
                <p className="text-xs text-muted-foreground">{call.clientEmail || call.clientPhone}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Language</p>
              <p className="text-sm font-medium text-foreground">{call.language ?? '—'}</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Status: {call.status}</p>
      </section>

      {isFailed && (
        <section className="card-elevated p-6 mb-6">
          <Alert variant="destructive">
            <AlertDescription>
              {call.summary || 'Processing failed. Please try again or upload the call again.'}
            </AlertDescription>
          </Alert>
        </section>
      )}

      {call.transcript && (
        <section className="card-elevated p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Full transcript
          </h2>
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{call.transcript}</p>
        </section>
      )}

      {call.summary && !isFailed && (
        <section className="card-elevated p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            AI summary
          </h2>
          <p className="text-foreground leading-relaxed">{call.summary}</p>
        </section>
      )}

      {call.goals && call.goals.length > 0 && (
        <section className="card-elevated p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Goals detected
          </h2>
          <div className="flex flex-wrap gap-2">
            {call.goals.map((g, i) => (
              <Badge key={i} variant="secondary" className="font-normal">{g}</Badge>
            ))}
          </div>
        </section>
      )}

      {flags.length > 0 && (
        <section className="card-elevated p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Compliance results
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
            {flags.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </section>
      )}

      {call.status !== 'completed' && !isFailed && !call.transcript && (
        <section className="card-elevated p-6 mb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Processing: {call.status}. Transcript and summary will appear when ready.</span>
          </div>
        </section>
      )}
    </div>
  );
}

/** Legacy summary view from summaries table (SIP etc.). */
function LegacySummaryView({ summary }: { summary: CallSummaryType }) {
  const navigate = useNavigate();
  const getTimeHorizonLabel = (horizon: string) => ({ short: 'Short-term (1-3 years)', medium: 'Medium-term (3-7 years)', long: 'Long-term (7+ years)' }[horizon] || horizon);
  const getRiskLabel = (risk: string) => ({ low: 'Low', moderate: 'Moderate', high: 'High' }[risk] || risk);
  const getAwarenessLabel = (level: string) => ({ basic: 'Basic', moderate: 'Moderate', advanced: 'Advanced' }[level] || level);

  return (
    <div className="p-8 max-w-5xl">
      <Button onClick={() => navigate('/calls')} variant="ghost" className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Calls
      </Button>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Call Summary</h1>
          <p className="text-muted-foreground">AI-generated documentation for advisory conversation</p>
        </div>
        <Badge className={cn('text-sm font-normal', summary.clientResponseSummary === 'proceeded' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20')}>
          {summary.clientResponseSummary === 'proceeded' ? <><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Proceeded</> : <><AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Deferred</>}
        </Badge>
      </div>
      <section className="card-elevated p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Call Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Calendar className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground">Date</p><p className="text-sm font-medium text-foreground">{summary.callDate ? format(new Date(summary.callDate), 'MMM dd, yyyy') : '—'}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Clock className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground">Duration</p><p className="text-sm font-medium text-foreground">{formatDuration(summary.callDuration)}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><User className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground">Client</p><p className="text-sm font-medium text-foreground">{summary.clientName}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Globe className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground">Language</p><p className="text-sm font-medium text-foreground">{summary.languageUsed}</p></div>
          </div>
        </div>
      </section>
      <section className="card-elevated p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Conversation Summary</h2>
        <p className="text-foreground leading-relaxed">{summary.conversationSummary}</p>
      </section>
      <section className="card-elevated p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Financial Goals</h2>
        <div className="flex flex-wrap gap-2">
          {summary.clientUnderstanding.financialGoals.map((goal, i) => (
            <Badge key={i} variant="secondary" className="font-normal">{goal}</Badge>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-4"><p className="text-sm font-medium text-foreground mb-1">Time Horizon</p><p className="text-sm text-muted-foreground">{getTimeHorizonLabel(summary.clientUnderstanding.timeHorizon)}</p></div>
          <div className="rounded-lg bg-muted/50 p-4"><p className="text-sm font-medium text-foreground mb-1">Risk Comfort</p><Badge className="font-normal">{getRiskLabel(summary.clientUnderstanding.riskComfortLevel)}</Badge></div>
          <div className="rounded-lg bg-muted/50 p-4"><p className="text-sm font-medium text-foreground mb-1">Investment Awareness</p><Badge variant="secondary" className="font-normal">{getAwarenessLabel(summary.clientUnderstanding.investmentAwarenessLevel)}</Badge></div>
        </div>
      </section>
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> SIP & Mutual Fund Advice Discussed</h2>
        <div className="space-y-4">
          {summary.sipDiscussions.map((sip, index) => (
            <SIPCard key={sip.id} sip={sip} index={index} />
          ))}
        </div>
      </section>
      <section className="animate-slide-up">
        <h2 className="text-lg font-semibold text-foreground mb-4">Visual Summary</h2>
        <SummaryCharts sipDiscussions={summary.sipDiscussions} />
      </section>
    </div>
  );
}

const CallSummary: React.FC = () => {
  const { callId } = useParams();
  const navigate = useNavigate();
  const [callDetail, setCallDetail] = useState<CallDetailFromApi | null | undefined>(undefined);
  const [legacySummary, setLegacySummary] = useState<CallSummaryType | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isFinalStatus = (status?: string) =>
    !!status && (status === 'completed' || status.startsWith('failed'));

  useEffect(() => {
    if (!callId) {
      setCallDetail(null);
      setLegacySummary(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    let pollId: number | undefined;

    const loadCall = () => {
      if (cancelled) return;
      getCallById(callId)
        .then((data) => {
          if (cancelled) return;
          setCallDetail(data);
          setLegacySummary(null);

          if (!isFinalStatus(data.status) && !pollId) {
            pollId = window.setInterval(loadCall, 4000);
          }
          if (isFinalStatus(data.status) && pollId) {
            window.clearInterval(pollId);
            pollId = undefined;
          }
        })
        .catch(() => {
          if (cancelled) return;
          setCallDetail(null);
          // Fallback to legacy summaries table once; no polling needed here
          getCallSummary(callId)
            .then((data) => {
              if (cancelled) return;
              if (data == null) setLegacySummary(null);
              else setLegacySummary(mapApiSummaryToCallSummary(data as Record<string, unknown>, callId));
            })
            .catch((e) => {
              if (cancelled) return;
              setLegacySummary(null);
              setLoadError(e instanceof Error ? e.message : 'Failed to load call');
            });
        });
    };

    setLoadError(null);
    setCallDetail(undefined);
    setLegacySummary(null);
    loadCall();

    return () => {
      cancelled = true;
      if (pollId) {
        window.clearInterval(pollId);
      }
    };
  }, [callId]);

  const handleDelete = async () => {
    if (!callId) return;
    const confirmed = window.confirm(
      'Are you sure you want to delete this call? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await deleteCall(callId);
      navigate('/calls');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to delete call');
    }
  };

  if (callDetail === undefined && legacySummary === null && !loadError) {
    return (
      <div className="p-8 max-w-5xl">
        <Button onClick={() => navigate('/calls')} variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Calls
        </Button>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (callDetail) {
    return <CallDetailsView call={callDetail} onDelete={handleDelete} />;
  }
  if (legacySummary) {
    return <LegacySummaryView summary={legacySummary} />;
  }

  return (
    <div className="p-8">
      <Button onClick={() => navigate('/calls')} variant="ghost" className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Calls
      </Button>
      <div className="card-elevated p-12 text-center">
        {loadError ? (
          <p className="text-muted-foreground">{loadError}</p>
        ) : (
          <>
            <Loader2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4 animate-spin" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Processing in Progress</h2>
            <p className="text-muted-foreground">This call is still being processed. Please check back shortly.</p>
          </>
        )}
        <Button onClick={() => navigate('/calls')} variant="outline" className="mt-4">
          Back to Calls
        </Button>
      </div>
    </div>
  );
};

export default CallSummary;

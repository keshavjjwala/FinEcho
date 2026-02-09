import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import {
  Phone,
  CheckCircle,
  AlertTriangle,
  Clock,
  CalendarCheck,
  ArrowRight,
  Plus,
  Upload,
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import DateRangePicker from '@/components/dashboard/DateRangePicker';
import { getDashboardStats, type DashboardStats } from '@/api/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getClients } from '@/api/clients';
import { uploadCall } from '@/api/calls';
import type { ClientFromApi } from '@/api/clients';
import { toast } from 'sonner';

const defaultRange = {
  from: subDays(new Date(), 7),
  to: new Date(),
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultRange);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addCallOpen, setAddCallOpen] = useState(false);
  const [clients, setClients] = useState<ClientFromApi[]>([]);
  const [clientId, setClientId] = useState<string>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (addCallOpen) {
      getClients().then(setClients).catch(() => setClients([]));
    }
  }, [addCallOpen]);

  const handleAddCallSubmit = async () => {
    if (!user?.id || !clientId || !audioFile) {
      toast.error('Please select a client and an audio file.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.set('audio', audioFile);
    formData.set('client_id', clientId);
    if (notes.trim()) formData.set('notes', notes.trim());
    try {
      await uploadCall(formData);
      toast.success('Call uploaded. Processing will start shortly.');
      setAddCallOpen(false);
      setClientId('');
      setAudioFile(null);
      setNotes('');
      const from = dateRange?.from ?? defaultRange.from;
      const to = dateRange?.to ?? defaultRange.to;
      getDashboardStats(format(from, 'yyyy-MM-dd'), format(to, 'yyyy-MM-dd')).then(setStats);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const from = dateRange?.from ?? defaultRange.from;
    const to = dateRange?.to ?? defaultRange.to;
    setLoading(true);
    setError(null);
    getDashboardStats(format(from, 'yyyy-MM-dd'), format(to, 'yyyy-MM-dd'))
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, [dateRange]);

  const s = stats ?? {
    totalCallsRecorded: 0,
    callsProcessedByAI: 0,
    callsPendingReview: 0,
    complianceFlagsRaised: 0,
    followUpsRequired: 0,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what needs your attention
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Drawer open={addCallOpen} onOpenChange={setAddCallOpen}>
              <DrawerTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Call
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-w-md mx-auto">
                <DrawerHeader>
                  <DrawerTitle>Add Call Recording</DrawerTitle>
                </DrawerHeader>
                <div className="grid gap-4 px-4 py-2">
                  <div>
                    <Label>Client</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                        {clients.length === 0 && (
                          <SelectItem value="__none__" disabled>No clients found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Call recording (audio)</Label>
                    <Input
                      type="file"
                      accept="audio/*,video/*,.webm,.mp3,.m4a,.wav"
                      onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div>
                    <Label>Notes (optional)</Label>
                    <Textarea
                      placeholder="Optional notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                  {uploadError && (
                    <Alert variant="destructive">
                      <AlertDescription>{uploadError}</AlertDescription>
                    </Alert>
                  )}
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                  <Button onClick={handleAddCallSubmit} disabled={uploading} className="gap-2">
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading…' : 'Upload'}
                  </Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
            <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
              <StatCard title="Total Calls Recorded" value={s.totalCallsRecorded} icon={Phone} variant="default" />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <StatCard title="AI Processed" value={s.callsProcessedByAI} icon={CheckCircle} variant="success" />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <StatCard title="Pending Review" value={s.callsPendingReview} icon={Clock} variant="warning" />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <StatCard title="Compliance Flags" value={s.complianceFlagsRaised} icon={AlertTriangle} variant="warning" />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <StatCard title="Follow-ups Required" value={s.followUpsRequired} icon={CalendarCheck} variant="info" />
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
                <p className="text-sm text-muted-foreground">
                  What conversations do you need to review or act on?
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                onClick={() => navigate('/calls?status=needs_review')}
                className="flex items-center justify-between p-4 rounded-xl border border-warning/20 bg-warning/5 hover:bg-warning/10 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Review Flagged Calls</p>
                    <p className="text-sm text-muted-foreground">{s.callsPendingReview} calls need attention</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
              <button
                onClick={() => navigate('/calls?followup=true')}
                className="flex items-center justify-between p-4 rounded-xl border border-info/20 bg-info/5 hover:bg-info/10 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                    <CalendarCheck className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Follow-up Required</p>
                    <p className="text-sm text-muted-foreground">{s.followUpsRequired} clients deferred</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
              <button
                onClick={() => navigate('/calls')}
                className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Phone className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">View All Calls</p>
                    <p className="text-sm text-muted-foreground">Browse complete call history</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

import React from 'react';
import { CheckCircle, Clock, TrendingUp, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SIPDiscussion } from '@/types';
import { cn } from '@/lib/utils';

interface SIPCardProps {
  sip: SIPDiscussion;
  index: number;
}

const SIPCard: React.FC<SIPCardProps> = ({ sip, index }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSIPTypeLabel = (type: SIPDiscussion['sipType']): string => {
    const labels = {
      new: 'New SIP',
      modification: 'Modification',
      pause: 'Pause Request',
      discussion_only: 'Discussion Only',
    };
    return labels[type];
  };

  const getFundCategoryLabel = (category: SIPDiscussion['fundCategory']): string => {
    const labels = {
      equity: 'Equity',
      debt: 'Debt',
      hybrid: 'Hybrid',
      elss: 'ELSS (Tax Saving)',
    };
    return labels[category];
  };

  const getFrequencyLabel = (freq: SIPDiscussion['sipFrequency']): string => {
    const labels = {
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      not_finalized: 'Not Finalized',
    };
    return labels[freq];
  };

  const getRiskExplanationLabel = (risk: SIPDiscussion['riskExplanationGiven']): string => {
    const labels = {
      yes: 'Yes',
      no: 'No',
      unclear: 'Unclear',
    };
    return labels[risk];
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            sip.clientDecisionState === 'proceeded' ? 'bg-success/10' : 'bg-warning/10'
          )}>
            {sip.clientDecisionState === 'proceeded' ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <Clock className="h-5 w-5 text-warning" />
            )}
          </div>
          <div>
            <h4 className="font-medium text-foreground">{getSIPTypeLabel(sip.sipType)}</h4>
            <p className="text-sm text-muted-foreground">{getFundCategoryLabel(sip.fundCategory)}</p>
          </div>
        </div>
        <Badge className={cn(
          'font-normal',
          sip.clientDecisionState === 'proceeded'
            ? 'bg-success/10 text-success border-success/20'
            : 'bg-warning/10 text-warning border-warning/20'
        )}>
          {sip.clientDecisionState === 'proceeded' ? 'Proceeded' : 'Deferred'}
        </Badge>
      </div>

      {/* SIP Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sip.sipAmount && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Amount</p>
            <p className="text-sm font-medium text-foreground">{formatCurrency(sip.sipAmount)}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Frequency</p>
          <p className="text-sm font-medium text-foreground">{getFrequencyLabel(sip.sipFrequency)}</p>
        </div>
        {sip.expectedDuration && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Duration</p>
            <p className="text-sm font-medium text-foreground">{sip.expectedDuration} years</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Risk Explained</p>
          <Badge variant="outline" className={cn(
            'text-xs font-normal',
            sip.riskExplanationGiven === 'yes' && 'border-success/30 text-success',
            sip.riskExplanationGiven === 'no' && 'border-destructive/30 text-destructive',
            sip.riskExplanationGiven === 'unclear' && 'border-warning/30 text-warning'
          )}>
            {getRiskExplanationLabel(sip.riskExplanationGiven)}
          </Badge>
        </div>
      </div>

      {/* Goal-based Reason */}
      <div className="rounded-lg bg-muted/50 p-3">
        <div className="flex items-start gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Goal-based Reason</p>
            <p className="text-sm text-foreground">{sip.goalBasedReason}</p>
          </div>
        </div>
      </div>

      {/* Deferral Note */}
      {sip.clientDecisionState === 'deferred' && sip.deferralNote && (
        <div className="rounded-lg bg-warning/5 border border-warning/20 p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">{sip.deferralNote}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SIPCard;

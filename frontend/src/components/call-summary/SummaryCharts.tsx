import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { SIPDiscussion } from '@/types';

interface SummaryChartsProps {
  sipDiscussions: SIPDiscussion[];
}

const SummaryCharts: React.FC<SummaryChartsProps> = ({ sipDiscussions }) => {
  const sipDecisionData = [
    {
      name: 'Proceeded',
      value: sipDiscussions.filter(s => s.clientDecisionState === 'proceeded').length,
      color: 'hsl(152, 69%, 31%)',
      fill: 'url(#successGradient)'
    },
    {
      name: 'Deferred',
      value: sipDiscussions.filter(s => s.clientDecisionState === 'deferred').length,
      color: 'hsl(38, 92%, 50%)',
      fill: 'url(#warningGradient)'
    },
  ].filter(d => d.value > 0);

  const fundCategoryData = [
    { name: 'Equity', value: sipDiscussions.filter(s => s.fundCategory === 'equity').length, fill: '#3b82f6' },
    { name: 'Debt', value: sipDiscussions.filter(s => s.fundCategory === 'debt').length, fill: '#10b981' },
    { name: 'Hybrid', value: sipDiscussions.filter(s => s.fundCategory === 'hybrid').length, fill: '#f59e0b' },
    { name: 'ELSS', value: sipDiscussions.filter(s => s.fundCategory === 'elss').length, fill: '#8b5cf6' },
  ].filter(d => d.value > 0);

  const riskExplanationData = [
    {
      name: 'Yes',
      value: sipDiscussions.filter(s => s.riskExplanationGiven === 'yes').length,
      fill: 'hsl(152, 69%, 31%)',
      percentage: 0
    },
    {
      name: 'No',
      value: sipDiscussions.filter(s => s.riskExplanationGiven === 'no').length,
      fill: 'hsl(0, 84%, 60%)',
      percentage: 0
    },
    {
      name: 'Unclear',
      value: sipDiscussions.filter(s => s.riskExplanationGiven === 'unclear').length,
      fill: 'hsl(38, 92%, 50%)',
      percentage: 0
    },
  ].filter(d => d.value > 0);

  const total = riskExplanationData.reduce((sum, item) => sum + item.value, 0);
  riskExplanationData.forEach(item => {
    item.percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
          <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
          <p className="text-lg font-bold text-primary">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (sipDiscussions.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="card-elevated p-5 animate-scale-in hover:shadow-elevated-lg transition-shadow">
        <h4 className="text-sm font-medium text-foreground mb-4">SIP Decisions</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152, 69%, 40%)" />
                  <stop offset="100%" stopColor="hsl(152, 69%, 25%)" />
                </linearGradient>
                <linearGradient id="warningGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(38, 92%, 60%)" />
                  <stop offset="100%" stopColor="hsl(38, 92%, 45%)" />
                </linearGradient>
              </defs>
              <Pie
                data={sipDecisionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {sipDecisionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="hsl(var(--card))" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-xs text-muted-foreground font-medium">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-elevated p-5 animate-scale-in hover:shadow-elevated-lg transition-shadow" style={{ animationDelay: '100ms' }}>
        <h4 className="text-sm font-medium text-foreground mb-4">Fund Categories Discussed</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fundCategoryData} layout="horizontal">
              <defs>
                {fundCategoryData.map((entry, index) => (
                  <linearGradient key={index} id={`barGradient${index}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={entry.fill} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={entry.fill} stopOpacity={1} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                width={60}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                radius={[0, 8, 8, 0]}
                animationBegin={100}
                animationDuration={800}
              >
                {fundCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#barGradient${index})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-elevated p-5 animate-scale-in hover:shadow-elevated-lg transition-shadow" style={{ animationDelay: '200ms' }}>
        <h4 className="text-sm font-medium text-foreground mb-4">Risk Explanation Coverage</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="20%"
              outerRadius="90%"
              barSize={18}
              data={riskExplanationData}
              startAngle={90}
              endAngle={-270}
            >
              <defs>
                <linearGradient id="riskSuccessGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152, 69%, 40%)" />
                  <stop offset="100%" stopColor="hsl(152, 69%, 30%)" />
                </linearGradient>
                <linearGradient id="riskErrorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0, 84%, 65%)" />
                  <stop offset="100%" stopColor="hsl(0, 84%, 55%)" />
                </linearGradient>
                <linearGradient id="riskWarningGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(38, 92%, 55%)" />
                  <stop offset="100%" stopColor="hsl(38, 92%, 45%)" />
                </linearGradient>
              </defs>
              <RadialBar
                minAngle={15}
                background={{ fill: 'hsl(var(--muted))' }}
                clockWise
                dataKey="percentage"
                animationBegin={200}
                animationDuration={1000}
              />
              <Legend
                iconSize={10}
                layout="vertical"
                verticalAlign="middle"
                align="right"
                iconType="circle"
                formatter={(value, entry: any) => (
                  <span className="text-xs text-muted-foreground font-medium">
                    {value} ({entry.payload.value})
                  </span>
                )}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SummaryCharts;

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import {
  Title,
  Text,
  Badge,
  InsightsCard,
  Alert,
  AlertTitle,
  AlertDescription,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Button,
} from "@kognitos/lattice";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { Referral, DashboardMetrics } from "@/lib/referral-types";
import { STATUS_BADGE_VARIANT } from "@/lib/referral-types";

interface DashboardData {
  referrals: Referral[];
  metrics: DashboardMetrics;
}

function buildActivityData(referrals: Referral[]) {
  const grouped: Record<string, { processed: number; needsReview: number; other: number }> = {};
  for (const r of referrals) {
    const day = dayjs(r.createdAt).format("MMM D");
    if (!grouped[day]) grouped[day] = { processed: 0, needsReview: 0, other: 0 };
    if (r.status === "processed") grouped[day].processed++;
    else if (r.status === "needs_review") grouped[day].needsReview++;
    else grouped[day].other++;
  }
  return Object.entries(grouped)
    .map(([date, counts]) => ({ date, ...counts }))
    .reverse();
}

function buildDistribution(referrals: Referral[], getter: (r: Referral) => string | null) {
  const counts: Record<string, number> = {};
  for (const r of referrals) {
    if (r.status !== "processed") continue;
    const val = getter(r);
    if (!val) continue;
    counts[val] = (counts[val] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
}

const activityConfig = {
  processed: { label: "Processed", color: "var(--success)" },
  needsReview: { label: "Needs Review", color: "var(--warning)" },
  other: { label: "Other", color: "var(--muted)" },
};

const distConfig = {
  count: { label: "Referrals", color: "var(--chart-1)" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/referrals")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { referrals, metrics } = data;
  const activityData = buildActivityData(referrals);
  const insuranceDist = buildDistribution(referrals, (r) => r.insuranceName);
  const physicianDist = buildDistribution(referrals, (r) => r.referringPhysician);

  return (
    <div className="p-6 space-y-6">
      <div>
        <Title level="h2">Patient Referral Intake</Title>
        <Text color="muted">Referral processing dashboard</Text>
      </div>

      {metrics.needsReview > 0 && (
        <Alert>
          <Icon type="AlertCircle" size="sm" />
          <AlertTitle>
            {metrics.needsReview} referral{metrics.needsReview !== 1 ? "s" : ""} need{metrics.needsReview === 1 ? "s" : ""} review
          </AlertTitle>
          <AlertDescription>
            <Link href="/review" className="underline text-link">
              Go to Review Queue
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <InsightsCard
          title="Total Referrals"
          value={String(metrics.total)}
          trend={{ value: "all time" }}
        />
        <InsightsCard
          title="Processed"
          value={String(metrics.processed)}
          variant="success"
          trend={{ value: `${metrics.successRate ?? 0}% success`, type: "positive" }}
        />
        <InsightsCard
          title="Needs Review"
          value={String(metrics.needsReview)}
          variant={metrics.needsReview > 0 ? "destructive" : "default"}
          trend={
            metrics.needsReview > 0
              ? { value: "action needed", type: "negative" }
              : { value: "all clear", type: "positive" }
          }
        />
        <InsightsCard
          title="Processing"
          value={String(metrics.processing)}
          trend={{ value: "in progress" }}
        />
      </div>

      {activityData.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <Title level="h4" className="mb-4">
            Referral Activity
          </Title>
          <ChartContainer config={activityConfig} className="h-64 w-full">
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis allowDecimals={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="processed" stackId="a" fill="var(--success)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="needsReview" stackId="a" fill="var(--warning)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="other" stackId="a" fill="var(--muted)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {insuranceDist.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <Title level="h4" className="mb-4">
              Top Insurance Providers
            </Title>
            <ChartContainer config={distConfig} className="h-48 w-full">
              <BarChart data={insuranceDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} className="text-xs" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        )}
        {physicianDist.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <Title level="h4" className="mb-4">
              Top Referring Physicians
            </Title>
            <ChartContainer config={distConfig} className="h-48 w-full">
              <BarChart data={physicianDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} className="text-xs" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <Title level="h4">Recent Referrals</Title>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient ID</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Referring Physician</TableHead>
              <TableHead>Insurance</TableHead>
              <TableHead>Specialist</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Text color="muted">No referrals found</Text>
                </TableCell>
              </TableRow>
            ) : (
              referrals.map((r) => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link
                      href={`/referrals/${r.id}`}
                      className="text-link underline-offset-2 hover:underline"
                    >
                      {r.patientId ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>{r.patientName ?? "—"}</TableCell>
                  <TableCell>
                    <Text level="small">
                      {dayjs(r.createdAt).format("MMM D, YYYY h:mm A")}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[r.status] as any}>
                      {r.statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Text level="small" className="max-w-[200px] truncate">
                      {r.diagnosis ?? "—"}
                    </Text>
                  </TableCell>
                  <TableCell>{r.referringPhysician ?? "—"}</TableCell>
                  <TableCell>{r.insuranceName ?? "—"}</TableCell>
                  <TableCell>{r.specialistName ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

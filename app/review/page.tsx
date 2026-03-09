"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import {
  Title,
  Text,
  Badge,
  Button,
  Icon,
  Alert,
  AlertTitle,
  AlertDescription,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  Skeleton,
} from "@kognitos/lattice";
import type { Referral } from "@/lib/referral-types";
import { STATUS_BADGE_VARIANT } from "@/lib/referral-types";

export default function ReviewPage() {
  const [items, setItems] = useState<Referral[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/referrals")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        const reviewable = (data.referrals as Referral[]).filter(
          (r) => r.status === "needs_review" || r.status === "failed"
        );
        setItems(reviewable);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!items) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Title level="h2">Review Queue</Title>
        {items.length > 0 && (
          <Badge variant="warning">{items.length}</Badge>
        )}
      </div>
      <Text color="muted">
        Referrals that need human attention — timed out, encountered errors, or
        failed validation.
      </Text>

      {items.length === 0 ? (
        <div className="flex justify-center py-16">
          <Empty>
            <EmptyMedia>
              <Icon type="CircleCheck" size="xl" className="text-success" />
            </EmptyMedia>
            <EmptyTitle>All clear</EmptyTitle>
            <EmptyDescription>
              All referrals have been processed successfully. Nothing needs
              review right now.
            </EmptyDescription>
          </Empty>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle>
                      {item.patientName ?? "Unknown Patient"}
                    </CardTitle>
                    <Badge variant={STATUS_BADGE_VARIANT[item.status] as any}>
                      {item.statusLabel}
                    </Badge>
                  </div>
                  <Text level="xSmall" color="muted">
                    {dayjs(item.createdAt).format("MMM D, YYYY h:mm A")}
                  </Text>
                </div>
              </CardHeader>
              <CardContent>
                <Text color="muted">
                  {item.exceptionDescription ??
                    item.errorDescription ??
                    "No details available"}
                </Text>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/referrals/${item.id}`}>
                    <Icon type="Eye" size="xs" />
                    View Details
                  </Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <a
                    href={item.kognitosUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon type="ExternalLink" size="xs" />
                    View in Kognitos
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

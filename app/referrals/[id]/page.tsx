"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Skeleton,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Markdown,
} from "@kognitos/lattice";
import type { ReferralDetail } from "@/lib/referral-types";
import { STATUS_BADGE_VARIANT } from "@/lib/referral-types";

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <Text level="xSmall" color="muted" weight="medium">
        {label}
      </Text>
      <Text level="small">{value}</Text>
    </div>
  );
}

export default function ReferralDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [referral, setReferral] = useState<ReferralDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/referrals/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load referral");
        return res.json();
      })
      .then(setReferral)
      .catch((e) => setError(e.message));
  }, [id]);

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

  if (!referral) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const ext = referral.extraction;
  const clinicalSections = ext
    ? [
        { key: "diagnosis", label: "Diagnosis", value: ext.diagnosis },
        { key: "medications", label: "Medications", value: ext.medications },
        { key: "vitalSigns", label: "Vital Signs", value: ext.vitalSigns },
        { key: "labResults", label: "Lab Results", value: ext.labResults },
        { key: "respiratory", label: "Respiratory", value: ext.respiratory },
        { key: "imaging", label: "Imaging", value: ext.imaging },
        { key: "hospitalVisits", label: "Hospital Visits", value: ext.hospitalVisits },
        { key: "otherDetails", label: "Patient Preferences / Other Details", value: ext.otherDetails },
      ].filter((s) => s.value)
    : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <Icon type="ArrowLeft" size="xs" />
          Back to Dashboard
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Title level="h2">
                {referral.patientName ?? "Unknown Patient"}
              </Title>
              <Badge variant={STATUS_BADGE_VARIANT[referral.status] as any}>
                {referral.statusLabel}
              </Badge>
            </div>
            <Text color="muted">
              {referral.patientId ?? "No ID"} &middot; Received{" "}
              {dayjs(referral.createdAt).format("MMM D, YYYY [at] h:mm A")}
            </Text>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={referral.kognitosUrl} target="_blank" rel="noopener noreferrer">
              <Icon type="ExternalLink" size="xs" />
              View in Kognitos
            </a>
          </Button>
        </div>
      </div>

      {referral.validationError && (
        <Alert variant="destructive">
          <Icon type="AlertTriangle" size="sm" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>{referral.validationError}</AlertDescription>
        </Alert>
      )}

      {referral.exceptionDescription && (
        <Alert>
          <Icon type="AlertCircle" size="sm" />
          <AlertTitle>Needs Review</AlertTitle>
          <AlertDescription>{referral.exceptionDescription}</AlertDescription>
        </Alert>
      )}

      {referral.errorDescription && (
        <Alert variant="destructive">
          <Icon type="AlertCircle" size="sm" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{referral.errorDescription}</AlertDescription>
        </Alert>
      )}

      {ext && (
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <InfoRow label="First Name" value={ext.firstName} />
              <InfoRow label="Last Name" value={ext.lastName} />
              <InfoRow label="Date of Birth" value={ext.dateOfBirth} />
              <InfoRow label="Gender" value={ext.gender} />
              <InfoRow
                label="Address"
                value={[ext.address, ext.city, ext.state, ext.zipCode].filter(Boolean).join(", ")}
              />
              <InfoRow label="Phone" value={ext.phoneNumber} />
              <InfoRow label="Insurance" value={ext.insuranceName} />
              <InfoRow label="Member ID" value={ext.insuranceMemberId} />
              <InfoRow label="Group Number" value={ext.insuranceGroupNumber} />
              <InfoRow label="Referring Physician" value={ext.referringPhysician} />
              <InfoRow label="Referring Facility" value={ext.referringFacility} />
              <InfoRow label="Reason for Referral" value={ext.reasonForReferral} />
            </div>
          </CardContent>
        </Card>
      )}

      {clinicalSections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Clinical Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="multiple" defaultValue={["diagnosis"]}>
              {clinicalSections.map((section) => (
                <AccordionItem key={section.key} value={section.key}>
                  <AccordionTrigger>{section.label}</AccordionTrigger>
                  <AccordionContent>
                    <Text>{section.value}</Text>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {referral.specialist && (
        <Card>
          <CardHeader>
            <CardTitle>Matched Specialist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoRow label="Name" value={referral.specialist.name} />
              <InfoRow label="Email" value={referral.specialist.email} />
              <InfoRow label="Address" value={referral.specialist.address} />
            </div>
          </CardContent>
        </Card>
      )}

      {referral.referralNotice && (
        <Card>
          <CardHeader>
            <CardTitle>Referral Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown>{referral.referralNotice}</Markdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

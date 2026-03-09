export type ReferralStatus =
  | "processed"
  | "needs_review"
  | "processing"
  | "queued"
  | "failed"
  | "cancelled";

export const STATUS_LABELS: Record<ReferralStatus, string> = {
  processed: "Processed",
  needs_review: "Needs Review",
  processing: "Processing",
  queued: "Queued",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const STATUS_BADGE_VARIANT: Record<ReferralStatus, string> = {
  processed: "success",
  needs_review: "warning",
  processing: "secondary",
  queued: "secondary",
  failed: "destructive",
  cancelled: "outline",
};

export interface Specialist {
  name: string;
  email: string;
  address: string;
}

export interface IdpExtraction {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  insuranceName: string;
  insuranceMemberId: string;
  insuranceGroupNumber: string;
  diagnosis: string;
  reasonForReferral: string;
  referringPhysician: string;
  referringFacility: string;
  otherDetails: string;
  hospitalVisits: string;
  medications: string;
  labResults: string;
  vitalSigns: string;
  respiratory: string;
  imaging: string;
}

export interface Referral {
  id: string;
  status: ReferralStatus;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  patientName: string | null;
  patientId: string | null;
  diagnosis: string | null;
  referringPhysician: string | null;
  insuranceName: string | null;
  specialistName: string | null;
  kognitosUrl: string;
  exceptionDescription: string | null;
  errorDescription: string | null;
}

export interface ReferralDetail extends Referral {
  extraction: IdpExtraction | null;
  specialist: Specialist | null;
  referralNotice: string | null;
  validationError: string | null;
}

export interface DashboardMetrics {
  total: number;
  processed: number;
  needsReview: number;
  processing: number;
  successRate: number | null;
}

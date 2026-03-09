import { req, ORG_ID, WORKSPACE_ID, AUTOMATION_ID, kognitosRunUrl } from "./kognitos";
import type { Referral, ReferralDetail, DashboardMetrics, ReferralStatus, IdpExtraction, Specialist } from "./referral-types";
import { STATUS_LABELS } from "./referral-types";

export type { Referral, ReferralDetail, DashboardMetrics, ReferralStatus };

type RunState = "completed" | "awaiting_guidance" | "executing" | "pending" | "failed" | "stopped";

const STATE_MAP: Record<RunState, ReferralStatus> = {
  completed: "processed",
  awaiting_guidance: "needs_review",
  executing: "processing",
  pending: "queued",
  failed: "failed",
  stopped: "cancelled",
};

function getRunState(state: Record<string, unknown>): RunState {
  for (const key of Object.keys(state)) {
    if (key === "update_time") continue;
    if (key in STATE_MAP) return key as RunState;
  }
  return "pending";
}

function parseDictionary(dict: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  const entries = (dict as { dictionary?: { entries?: Array<{ key?: { text?: string }; value?: { text?: string } }> } })
    ?.dictionary?.entries;
  if (!entries) return result;
  for (const entry of entries) {
    const key = entry.key?.text;
    const val = entry.value?.text ?? "";
    if (key) result[key] = val;
  }
  return result;
}

function parseExtraction(raw: Record<string, string>): IdpExtraction {
  return {
    firstName: raw["First Name"] ?? "",
    lastName: raw["Last Name"] ?? "",
    dateOfBirth: raw["Date Of Birth"] ?? "",
    gender: raw["Gender"] ?? "",
    address: raw["Address"] ?? "",
    city: raw["City"] ?? "",
    state: raw["State"] ?? "",
    zipCode: raw["Zip Code"] ?? "",
    phoneNumber: raw["Phone Number"] ?? "",
    insuranceName: raw["Insurance Name"] ?? "",
    insuranceMemberId: raw["Insurance Member ID"] ?? "",
    insuranceGroupNumber: raw["Insurance Group Number"] ?? "",
    diagnosis: raw["Diagnosis"] ?? "",
    reasonForReferral: raw["Reason For Referral"] ?? "",
    referringPhysician: raw["Referring Physician"] ?? "",
    referringFacility: raw["Referring Facility"] ?? "",
    otherDetails: raw["Other Details"] ?? "",
    hospitalVisits: raw["Hospital Visits"] ?? "",
    medications: raw["Medications"] ?? "",
    labResults: raw["Lab Results"] ?? "",
    vitalSigns: raw["Vital Signs"] ?? "",
    respiratory: raw["Respiratory"] ?? "",
    imaging: raw["Imaging"] ?? "",
  };
}

function parseSpecialist(raw: unknown): Specialist | null {
  const dict = parseDictionary(raw);
  if (!dict.name) return null;
  return { name: dict.name, email: dict.email ?? "", address: dict.address ?? "" };
}

function getTextOutput(outputs: Record<string, unknown>, key: string): string | null {
  const val = outputs[key] as { text?: string; string?: { text?: string } | string } | undefined;
  if (!val) return null;
  if (val.text != null) return val.text;
  if (val.string != null) {
    return typeof val.string === "string" ? val.string : val.string.text ?? null;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRun(run: any): Referral {
  const id = (run.name as string).split("/").pop()!;
  const runState = getRunState(run.state ?? {});
  const status = STATE_MAP[runState];
  const outputs = run.state?.completed?.outputs ?? {};

  const idpRaw = parseDictionary(outputs.idp_extraction_results);
  const specialistDict = parseDictionary(outputs.closest_specialist);

  return {
    id,
    status,
    statusLabel: STATUS_LABELS[status],
    createdAt: run.create_time ?? "",
    updatedAt: run.update_time ?? run.create_time ?? "",
    patientName: getTextOutput(outputs, "patient_name"),
    patientId: getTextOutput(outputs, "patient_id"),
    diagnosis: idpRaw["Diagnosis"] || null,
    referringPhysician: idpRaw["Referring Physician"] || null,
    insuranceName: idpRaw["Insurance Name"] || null,
    specialistName: specialistDict.name || null,
    kognitosUrl: kognitosRunUrl(id),
    exceptionDescription: run.state?.awaiting_guidance?.description ?? null,
    errorDescription: run.state?.failed?.error ?? run.state?.failed?.description ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRunDetail(run: any): ReferralDetail {
  const base = normalizeRun(run);
  const outputs = run.state?.completed?.outputs ?? {};

  const idpRaw = parseDictionary(outputs.idp_extraction_results);
  const extraction = Object.keys(idpRaw).length > 0 ? parseExtraction(idpRaw) : null;
  const specialist = parseSpecialist(outputs.closest_specialist);
  const referralNotice = getTextOutput(outputs, "referral_notice");
  const validationError = getTextOutput(outputs, "validation_error");

  return { ...base, extraction, specialist, referralNotice, validationError };
}

export async function fetchReferrals(): Promise<{ referrals: Referral[]; metrics: DashboardMetrics }> {
  const path = `/organizations/${ORG_ID}/workspaces/${WORKSPACE_ID}/automations/${AUTOMATION_ID}/runs?pageSize=50`;
  const res = await req(path);
  if (!res.ok) throw new Error(`Failed to fetch referrals: ${res.status}`);

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runs = (data.runs ?? []) as any[];
  const referrals = runs.map(normalizeRun);

  const total = referrals.length;
  const processed = referrals.filter((r) => r.status === "processed").length;
  const needsReview = referrals.filter((r) => r.status === "needs_review").length;
  const processing = referrals.filter((r) => r.status === "processing").length;
  const finished = processed + referrals.filter((r) => r.status === "failed").length;
  const successRate = finished > 0 ? Math.round((processed / finished) * 100) : null;

  return { referrals, metrics: { total, processed, needsReview, processing, successRate } };
}

export async function fetchReferralDetail(runId: string): Promise<ReferralDetail> {
  const path = `/organizations/${ORG_ID}/workspaces/${WORKSPACE_ID}/automations/${AUTOMATION_ID}/runs/${runId}`;
  const res = await req(path);
  if (!res.ok) throw new Error(`Failed to fetch referral: ${res.status}`);

  const data = await res.json();
  return normalizeRunDetail(data);
}

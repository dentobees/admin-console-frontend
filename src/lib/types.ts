// API contract between this frontend and the Rust admin-api.
// Hand-written until the backend's utoipa OpenAPI spec exists; then replace
// with generated types (lib/api/types.gen.ts) and delete this file.

export type StaffRole = 'founder' | 'admin' | 'viewer';

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  initials: string;
  color: string;
}

export type LifecycleState = 'new' | 'never_activated' | 'active' | 'lapsing' | 'dormant' | 'suspended';

export type SnapshotStatus = 'success' | 'partial' | 'running' | 'failed' | 'none';

export interface SnapshotInfo {
  /** IST date (yyyy-mm-dd) the Overview numbers describe; null before the first snapshot. */
  asOf: string | null;
  /** Status of last night's run (the IST day that just ended). */
  status: SnapshotStatus;
  /** True when the run failed and all 4 attempts are used (D6). */
  attemptsExhausted: boolean;
  /** Clinics skipped by a partial run (D11). */
  missingClinics: number;
}

export interface TilePreview {
  count: number;
  /** First clinic name for the tile's sub-line, null when count is 0. */
  firstClinic: string | null;
}

export interface Overview {
  snapshot: SnapshotInfo;
  thisWeek: {
    newSignups: TilePreview;
    /** Most recent complete weekly cohort (signed up 8-14 days ago). */
    activation: { activated: number; cohort: number };
    /** null when there is not enough history to compare with 7 days ago. */
    wentDormant: TilePreview | null;
    newNoWhatsApp: TilePreview;
  };
  metrics: { active: number; total: number; teamJoined: number; spendPaiseMonth: number };
  states: Record<LifecycleState, number>;
  funnel: { signedUp: number; onboarded: number; whatsappLive: number; firstReply: number; teamJoined: number };
  /** 12 IST weeks, oldest first. */
  weeks: { weekStart: string; newSignups: number; active: number | null; reconstructed: boolean }[];
}

export interface ClinicRow {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  signedUpAt: string;
  state: LifecycleState;
  planTier: string;
  seats: number;
  whatsapp: 'live' | 'not_connected' | 'disconnected' | 'other';
  replies30d: number;
  lastEngagedAt: string | null;
  erpLinked: boolean;
  internal: boolean;
}

export interface Page<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClinicDetail extends ClinicRow {
  status: 'active' | 'suspended';
  walletEnforcement: 'off' | 'shadow' | 'on';
  tags: string[];
  phone: string | null;
  email: string | null;
  milestones: { label: string; at: string | null }[];
  engaged90d: { weekStart: string; count: number }[];
  members: { name: string; email: string; role: string; lastLoginAt: string | null }[];
  channels: { phone: string; status: string; quality: string | null; tier: string | null }[];
  suggestedErpClinicId: string | null;
}

export type ClinicAction =
  | { action: 'suspend'; reason: string }
  | { action: 'reactivate'; reason: string }
  | { action: 'wallet_enforcement'; value: 'off' | 'shadow' | 'on'; reason: string }
  | { action: 'mark_internal'; reason: string }
  | { action: 'unmark_internal'; reason: string };

export interface CrmUserRow {
  id: string;
  name: string;
  email: string;
  clinicId: string;
  clinicName: string;
  role: string;
  membershipStatus: 'active' | 'invited' | 'removed';
  lastLoginAt: string | null;
}

export interface AuditRow {
  id: string;
  at: string;
  actorName: string;
  action: string;
  clinicId: string | null;
  clinicName: string | null;
  before: string;
  after: string;
  reason: string;
}

export interface StaffRow {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
}

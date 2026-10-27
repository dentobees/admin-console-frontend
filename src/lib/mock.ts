// Fixture data for `pnpm dev:mock` (NEXT_PUBLIC_API_MOCK=1) while the Rust
// admin-api is being built. The shell shows a "Fixture data" strip whenever
// this is active, so nobody mistakes these numbers for the real CRM.
import type {
  AuditRow, ClinicDetail, ClinicRow, CrmUserRow, LifecycleState, Overview, Page, StaffRow, StaffUser,
} from './types';

const NAMES = [
  'Apollo Dental DSO', 'Sunrise Dental', 'OrthoPlus Center', 'Dr. Rao Orthodontics', 'Smile Studio',
  'CityDent Multispeciality', 'Pearl Dental Care', 'Bright Smiles Clinic', 'GumCare Family Dentistry',
  'Whitefield Dental', 'Dental Roots', 'Coral Dental Care', 'Tooth Fairy Kids Dental', 'Enamel & Co',
  'Prime Dental Hub', 'Molar Bay', 'Clove Dental Koramangala', 'Sparkle Dental', 'Root Canal Centre',
  'Happy Teeth Clinic', 'Align Ortho Studio', 'Dentique', 'Smile Craft', 'The Dental Lounge',
  'Implant Point', 'Care32 Dental', 'Bite Right', 'Dentcare Indiranagar', 'Ivory Dental', 'Floss & Gloss',
];
const CITIES = ['Bengaluru', 'Chennai', 'Hyderabad', 'Mumbai', 'Pune', 'Kochi', 'Delhi'];
const STATES: LifecycleState[] = ['active', 'active', 'active', 'lapsing', 'dormant', 'never_activated', 'new', 'active', 'never_activated', 'suspended'];

const DAY = 86_400_000;
const now = Date.now();

const CLINICS: ClinicRow[] = NAMES.map((name, i) => {
  const state = STATES[i % STATES.length];
  const engagedDaysAgo = state === 'active' ? i % 6 : state === 'lapsing' ? 10 : state === 'dormant' ? 21 + i : null;
  return {
    id: `c${String(i + 1).padStart(3, '0')}`,
    name,
    city: CITIES[i % CITIES.length],
    country: 'IN',
    signedUpAt: new Date(now - (state === 'new' ? 3 : 20 + i * 4) * DAY).toISOString(),
    state,
    planTier: i % 3 === 0 ? 'growth' : 'starter',
    seats: 1 + (i % 5),
    whatsapp: state === 'never_activated' ? 'not_connected' : state === 'suspended' ? 'disconnected' : 'live',
    replies30d: state === 'active' ? 40 + i * 13 : state === 'lapsing' ? 6 : 0,
    lastEngagedAt: engagedDaysAgo === null ? null : new Date(now - engagedDaysAgo * DAY).toISOString(),
    erpLinked: i % 3 === 1,
    internal: false,
  };
});

const OVERVIEW: Overview = {
  snapshot: { asOf: new Date(now - DAY).toISOString().slice(0, 10), status: 'success', attemptsExhausted: false, missingClinics: 0 },
  thisWeek: {
    newSignups: { count: 9, firstClinic: 'Smile Studio' },
    activation: { activated: 8, cohort: 21 },
    wentDormant: { count: 5, firstClinic: 'Apollo Dental DSO' },
    newNoWhatsApp: { count: 4, firstClinic: 'Pearl Dental Care' },
  },
  metrics: { active: 71, total: 142, teamJoined: 41, spendPaiseMonth: 1_842_000 },
  states: { new: 9, never_activated: 31, active: 71, lapsing: 14, dormant: 15, suspended: 2 },
  funnel: { signedUp: 142, onboarded: 120, whatsappLive: 88, firstReply: 74, teamJoined: 41 },
  weeks: Array.from({ length: 12 }, (_, w) => ({
    weekStart: new Date(now - (11 - w) * 7 * DAY).toISOString().slice(0, 10),
    newSignups: [6, 8, 7, 11, 9, 12, 10, 14, 13, 12, 15, 9][w],
    active: w < 4 ? null : [38, 42, 47, 53, 58, 63, 67, 71][w - 4],
    reconstructed: w < 6,
  })),
};

const STAFF_ME: StaffUser = { id: 's1', email: 'hidash@dentobees.com', name: 'Hidash', role: 'founder', initials: 'HD', color: '#067052' };

function detail(row: ClinicRow): ClinicDetail {
  return {
    ...row,
    status: row.state === 'suspended' ? 'suspended' : 'active',
    walletEnforcement: 'on',
    tags: row.internal ? ['internal'] : [],
    phone: '+91 98450 12345',
    email: `hello@${row.name.toLowerCase().replace(/[^a-z]+/g, '')}.in`,
    milestones: [
      { label: 'Signed up', at: row.signedUpAt },
      { label: 'Onboarded', at: row.state === 'new' ? null : row.signedUpAt },
      { label: 'WhatsApp live', at: row.whatsapp === 'not_connected' ? null : row.signedUpAt },
      { label: 'First staff reply', at: row.replies30d > 0 || row.state === 'dormant' ? row.signedUpAt : null },
      { label: 'Team joined', at: row.seats >= 2 ? row.signedUpAt : null },
    ],
    engaged90d: Array.from({ length: 13 }, (_, w) => ({
      weekStart: new Date(now - (12 - w) * 7 * DAY).toISOString().slice(0, 10),
      count: row.state === 'active' ? 10 + ((w * 7) % 23) : row.state === 'dormant' && w < 9 ? 8 : 0,
    })),
    members: [
      { name: 'Dr. Lakshmi Menon', email: 'lakshmi@clinic.in', role: 'owner', lastLoginAt: row.lastEngagedAt },
      ...(row.seats >= 2 ? [{ name: 'Asha (reception)', email: 'asha@clinic.in', role: 'reception', lastLoginAt: row.lastEngagedAt }] : []),
    ],
    channels: row.whatsapp === 'not_connected' ? [] : [{ phone: '+91 80 4567 8901', status: row.whatsapp, quality: 'GREEN', tier: 'TIER_1K' }],
    suggestedErpClinicId: row.erpLinked ? 'erp-77' : null,
  };
}

function page<T>(rows: T[], params: URLSearchParams): Page<T> {
  const p = Number(params.get('page') || 1);
  const size = 50;
  return { rows: rows.slice((p - 1) * size, p * size), total: rows.length, page: p, pageSize: size };
}

const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 250));

export async function mockGet<T>(path: string): Promise<T> {
  const url = new URL(path, 'http://mock');
  const q = (url.searchParams.get('q') || '').toLowerCase();
  if (url.pathname === '/auth/me') return delay(STAFF_ME as T);
  if (url.pathname === '/crm/overview') return delay(OVERVIEW as T);
  if (url.pathname === '/crm/clinics') {
    const state = url.searchParams.get('state');
    const plan = url.searchParams.get('plan');
    const erp = url.searchParams.get('erp');
    const view = url.searchParams.get('view');
    let rows = CLINICS.filter((c) => !c.internal || url.searchParams.get('internal') === '1');
    if (state) rows = rows.filter((c) => c.state === state);
    if (plan) rows = rows.filter((c) => c.planTier === plan);
    if (erp) rows = rows.filter((c) => c.erpLinked === (erp === 'linked'));
    if (view === 'went_dormant') rows = rows.filter((c) => c.state === 'dormant');
    if (view === 'new_this_week') rows = rows.filter((c) => c.state === 'new');
    if (view === 'new_no_whatsapp') rows = rows.filter((c) => c.state === 'new' && c.whatsapp !== 'live');
    if (q) rows = rows.filter((c) => `${c.name} ${c.city}`.toLowerCase().includes(q));
    return delay(page(rows, url.searchParams) as T);
  }
  const m = url.pathname.match(/^\/crm\/clinics\/([^/]+)$/);
  if (m) {
    const row = CLINICS.find((c) => c.id === m[1]);
    if (!row) throw new Error('not found');
    return delay(detail(row) as T);
  }
  if (url.pathname === '/crm/users') {
    const rows: CrmUserRow[] = CLINICS.flatMap((c, i) => [
      { id: `u${i}a`, name: `Dr. ${c.name.split(' ')[0]} Owner`, email: `owner@${c.id}.in`, clinicId: c.id, clinicName: c.name, role: 'owner', membershipStatus: 'active' as const, lastLoginAt: c.lastEngagedAt },
    ]).filter((u) => !q || `${u.name} ${u.email}`.toLowerCase().includes(q));
    return delay(page(rows, url.searchParams) as T);
  }
  if (url.pathname === '/audit') {
    const rows: AuditRow[] = [
      { id: 'a1', at: new Date(now - 2 * 3600_000).toISOString(), actorName: 'Hidash', action: 'suspend', clinicId: 'c010', clinicName: NAMES[9], before: 'active', after: 'suspended', reason: 'Payment overdue 45 days' },
    ];
    return delay(page(rows, url.searchParams) as T);
  }
  if (url.pathname === '/staff') {
    const rows: StaffRow[] = [{ id: 's1', name: 'Hidash', email: STAFF_ME.email, role: 'founder', active: true }];
    return delay(rows as T);
  }
  throw new Error(`mock: no fixture for GET ${path}`);
}

export async function mockSend<T>(method: string, path: string, body?: unknown): Promise<T> {
  void method; void body;
  if (path === '/auth/logout') return delay(undefined as T);
  return delay({ ok: true } as T);
}

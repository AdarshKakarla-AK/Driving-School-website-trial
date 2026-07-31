export type Role = "admin" | "instructor" | "student";

export type DocType =
  | "Aadhaar"
  | "Learner's License"
  | "Driving License"
  | "Medical Certificate"
  | "Passport Photo";

export interface Doc {
  id: string;
  type: DocType;
  fileName: string;
  number?: string;
  expiry?: string;
  reminderSentAt?: string;
  uploadedAt: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  passwordHash?: string;
  role: Role;
  verified: boolean;
  google?: boolean;
  active: boolean;
  // student fields
  studentId?: string;
  age?: number;
  dob?: string;
  gender?: string;
  address?: string;
  city?: string;
  guardianName?: string;
  guardianPhone?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  vehiclePreference?: "automatic" | "manual";
  batchPreference?: string;
  packageId?: string;
  enrolledAt?: string;
  referralCode?: string;
  referredBy?: string;
  birthdayRemindedYear?: number;
  documents: Doc[];
  // instructor fields
  avatarColor?: string;
  specialization?: string[];
  languages?: string[];
  rating?: number;
  reviewCount?: number;
  yearsExp?: number;
  certifications?: string[];
  bio?: string;
  salaryPerLesson?: number;
  commissionPct?: number;
  createdAt: string;
  updatedAt: string;
}

export type VehicleType = "automatic" | "manual";
export type VehicleStatus = "available" | "booked" | "maintenance" | "cleaning";

export interface Vehicle {
  id: string;
  name: string;
  model: string;
  regNumber: string;
  type: VehicleType;
  status: VehicleStatus;
  fuelLevel: number;
  odometer: number;
  lastService?: string;
  serviceDueKm: number;
  insuranceExpiry?: string;
  tyreReplacedAt?: string;
  lastCleanedAt?: string;
  notes?: string;
}

export interface CoursePackage {
  id: string;
  name: string;
  slug: string;
  category: string;
  durationWeeks: number;
  sessions: number;
  sessionMin: number;
  price: number;
  originalPrice?: number;
  vehicleType: VehicleType | "both";
  popular?: boolean;
  description: string;
  includes: string[];
  features: string[];
  emi?: { downPayment: number; months: number; monthly: number };
  active?: boolean;
}

export type SlotStatus = "available" | "booked" | "blocked" | "maintenance";

export interface Slot {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  instructorId: string;
  vehicleId: string;
  status: SlotStatus;
}

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "upcoming"
  | "completed"
  | "cancelled"
  | "no_show";

export type Attendance = "present" | "absent" | "late" | "na";

export interface Booking {
  id: string;
  ref: string;
  studentId: string;
  instructorId: string;
  vehicleId: string;
  packageId?: string;
  date: string;
  time: string;
  durationMin: number;
  status: BookingStatus;
  amount: number;
  paid: number;
  paymentRef?: string;
  attendance: Attendance;
  cancelledReason?: string;
  rescheduledFrom?: string;
  reminderSentAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LessonNote {
  id: string;
  bookingId: string;
  studentId: string;
  instructorId: string;
  date: string;
  note: string;
  recommendation?: string;
  skillDeltas: Record<string, number>;
}

export interface SkillProgress {
  value: number;
  history: { date: string; value: number }[];
}

export interface Progress {
  id: string;
  studentId: string;
  skills: Record<string, SkillProgress>;
  lessonsCompleted: number;
  lessonsTotal: number;
  licenseChecklist: Record<string, boolean>;
  updatedAt: string;
}

export type PayMethod = "upi" | "card" | "netbanking" | "wallet" | "emi" | "demo";
export type PayStatus = "paid" | "pending" | "failed" | "refunded" | "partial";

export interface Payment {
  id: string;
  ref: string;
  studentId: string;
  bookingId?: string;
  packageId?: string;
  amount: number;
  paidAmount: number;
  method: PayMethod;
  status: PayStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  invoiceNo?: string;
  installment?: number;
  dueDate?: string;
  reminderSentAt?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  studentId: string;
  paymentId: string;
  items: { name: string; qty: number; amount: number }[];
  subtotal: number;
  gst: number;
  total: number;
  issuedAt: string;
}

export type NotifChannel = "app" | "whatsapp" | "email" | "sms";
export interface Notification {
  id: string;
  userId: string;
  channel: NotifChannel;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export type AutomationType =
  | "welcome"
  | "booking_confirmed"
  | "lesson_reminder"
  | "payment_reminder"
  | "invoice"
  | "receipt"
  | "license_reminder"
  | "birthday"
  | "course_completed"
  | "feedback_request"
  | "promo"
  | "instructor_delayed"
  | "lesson_cancelled"
  | "rescheduled"
  | "referral"
  | "otp"
  | "review"
  | "vehicle_changed";

export interface AutomationLog {
  id: string;
  type: AutomationType;
  channel: NotifChannel;
  recipient: string;
  summary: string;
  status: "sent" | "simulated" | "failed";
  createdAt: string;
}

export type LeadStatus =
  | "new"
  | "called"
  | "interested"
  | "demo_booked"
  | "registered"
  | "active"
  | "completed"
  | "lost";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: "website" | "whatsapp" | "facebook" | "instagram" | "google" | "referral" | "walkin";
  status: LeadStatus;
  packageInterested?: string;
  followUpAt?: string;
  notes: string[];
  assignedTo?: string;
  studentId?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: "fuel" | "maintenance" | "salary" | "insurance" | "marketing" | "rent" | "utilities" | "other";
  amount: number;
  note: string;
  date: string;
}

export interface PayrollRecord {
  id: string;
  instructorId: string;
  month: string; // YYYY-MM
  lessons: number;
  base: number;
  bonus: number;
  commission: number;
  total: number;
  status: "pending" | "paid";
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "flat";
  value: number;
  maxUses: number;
  uses: number;
  validFrom: string;
  validTo: string;
  active: boolean;
}

export interface Review {
  id: string;
  studentId: string;
  rating: number;
  comment: string;
  private?: boolean;
  channel?: "google" | "app";
  createdAt: string;
}

export interface Certificate {
  id: string;
  studentId: string;
  packageId: string;
  code: string;
  issuedAt: string;
  signedBy: string;
}

export interface WaitlistEntry {
  id: string;
  studentId: string;
  instructorId: string;
  date: string;
  time: string;
  createdAt: string;
}

export interface OTP {
  id: string;
  identifier: string; // phone or email
  code: string;
  purpose: "login" | "register" | "reset";
  expiresAt: string;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  targetId?: string;
  meta?: string;
  createdAt: string;
}

export interface Settings {
  schoolName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  branches: { id: string; name: string; address: string; phone: string; city: string }[];
  gstin: string;
  openingHours: string;
  cancellationPolicyHours: number;
  cancellationFeePct: number;
  referralDiscount: number;
  demoMode: boolean;
}

export interface DB {
  users: User[];
  packages: CoursePackage[];
  vehicles: Vehicle[];
  slots: Slot[];
  bookings: Booking[];
  lessonNotes: LessonNote[];
  progresses: Progress[];
  payments: Payment[];
  invoices: Invoice[];
  notifications: Notification[];
  automationLogs: AutomationLog[];
  leads: Lead[];
  expenses: Expense[];
  payroll: PayrollRecord[];
  coupons: Coupon[];
  reviews: Review[];
  certificates: Certificate[];
  waitlist: WaitlistEntry[];
  otps: OTP[];
  auditLogs: AuditEntry[];
  settings: Settings;
  counters: Record<string, number>;
}

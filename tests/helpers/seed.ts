import type { DB, Settings, User, Vehicle, CoursePackage, Slot } from "@/lib/db/types";

export const futureDate = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

const settings: Settings = {
  schoolName: "Sri Mathru Driving School",
  tagline: "Drive safe",
  phone: "9000000000",
  whatsapp: "9000000000",
  email: "hello@srimathru.example",
  address: "Bengaluru",
  branches: [],
  gstin: "29AAAAA0000A1Z5",
  openingHours: "6:00 AM - 9:00 PM",
  cancellationPolicyHours: 24,
  cancellationFeePct: 10,
  referralDiscount: 500,
  demoMode: true,
};

const admin: User = {
  id: "adm_1",
  name: "Admin",
  phone: "9000000001",
  role: "admin",
  verified: true,
  active: true,
  documents: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const instructor: User = {
  id: "ins_1",
  name: "Ravi Kumar",
  phone: "9000000002",
  role: "instructor",
  verified: true,
  active: true,
  documents: [],
  specialization: ["Manual"],
  languages: ["Kannada", "English"],
  rating: 4.9,
  reviewCount: 42,
  yearsExp: 8,
  salaryPerLesson: 350,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const student1: User = {
  id: "stu_1",
  name: "Arun",
  phone: "9000000011",
  role: "student",
  verified: true,
  active: true,
  documents: [],
  studentId: "S001",
  enrolledAt: new Date().toISOString(),
  referralCode: "ARUN1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const student2: User = {
  id: "stu_2",
  name: "Bhavana",
  phone: "9000000012",
  role: "student",
  verified: true,
  active: true,
  documents: [],
  studentId: "S002",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const vehicle: Vehicle = {
  id: "veh_1",
  name: "Swift",
  model: "Maruti Swift VXi",
  regNumber: "KA-01-AB-1234",
  type: "automatic",
  status: "available",
  fuelLevel: 80,
  odometer: 12000,
  serviceDueKm: 5000,
  notes: "",
};

const pkg: CoursePackage = {
  id: "pkg_1",
  name: "Basic Driving Course",
  slug: "basic",
  category: "beginner",
  durationWeeks: 4,
  sessions: 10,
  sessionMin: 60,
  price: 12000,
  originalPrice: 15000,
  vehicleType: "automatic",
  popular: true,
  description: "Learn from scratch",
  includes: ["10 sessions"],
  features: ["Flexible slots"],
  emi: { downPayment: 3000, months: 3, monthly: 3500 },
  active: true,
};

function freshSlots(): Slot[] {
  const t = futureDate(3);
  return [
    { id: "slot_1", date: t, time: "09:00", instructorId: instructor.id, vehicleId: vehicle.id, status: "available" },
    { id: "slot_2", date: t, time: "10:00", instructorId: instructor.id, vehicleId: vehicle.id, status: "available" },
  ];
}

export function makeSeed(): DB {
  return {
    users: [admin, instructor, student1, student2],
    packages: [pkg],
    vehicles: [vehicle],
    slots: freshSlots(),
    bookings: [],
    lessonNotes: [],
    progresses: [],
    payments: [],
    invoices: [],
    notifications: [],
    automationLogs: [],
    leads: [],
    expenses: [],
    payroll: [],
    coupons: [],
    reviews: [],
    certificates: [],
    waitlist: [],
    otps: [],
    auditLogs: [],
    settings,
    counters: {},
  };
}

export const seedIds = {
  admin: admin.id,
  instructor: instructor.id,
  student1: student1.id,
  student2: student2.id,
  vehicle: vehicle.id,
  pkg: pkg.id,
};

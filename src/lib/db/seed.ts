import bcrypt from "bcryptjs";
import type { DB, User, CoursePackage, Vehicle, Booking, Slot, Progress, Payment, Invoice, Lead, Expense, PayrollRecord, Coupon, Review, Certificate, WaitlistEntry, AutomationLog, Notification, LessonNote } from "./types";

const DAY = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => iso(new Date(Date.now() - n * DAY));
const daysAhead = (n: number) => iso(new Date(Date.now() + n * DAY));
const tsAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

let counter = 0;
const uid = (p: string) => `${p}_${Date.now().toString(36)}_${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const hash = (pw: string) => bcrypt.hashSync(pw, 10);

export const SLOT_TIMES = ["06:30", "07:30", "09:00", "10:00", "11:00", "16:00", "17:00", "18:00", "19:00"];

export const SCHEDULE: { instructorId: string; vehicleId: string; shift: string[] }[] = [
  { instructorId: "inst_ravi", vehicleId: "veh_1", shift: ["06:30", "07:30", "09:00", "10:00", "11:00", "16:00", "17:00", "18:00"] },
  { instructorId: "inst_kavya", vehicleId: "veh_3", shift: ["07:30", "09:00", "10:00", "11:00", "16:00", "17:00", "18:00", "19:00"] },
  { instructorId: "inst_arjun", vehicleId: "veh_2", shift: ["06:30", "07:30", "09:00", "10:00", "16:00", "17:00", "18:00"] },
  { instructorId: "inst_divya", vehicleId: "veh_4", shift: ["09:00", "10:00", "11:00", "16:00", "17:00", "18:00", "19:00"] },
];

export const SKILLS = ["steering", "parking", "reverse", "traffic", "hillStart", "highway", "nightDriving"] as const;
export const SKILL_LABELS: Record<string, string> = {
  steering: "Steering Control",
  parking: "Parking",
  reverse: "Reverse Driving",
  traffic: "Traffic Handling",
  hillStart: "Hill Start",
  highway: "Highway Driving",
  nightDriving: "Night Driving",
};

const SKILL_SEED: Record<string, number> = {
  steering: 4,
  parking: 3,
  reverse: 4,
  traffic: 3,
  hillStart: 2,
  highway: 1,
  nightDriving: 3,
};

export function buildSeed(): DB {
  const users: User[] = [];
  const packages: CoursePackage[] = [
    {
      id: "pkg_beginner", name: "Beginner Package", slug: "beginner", category: "Core", durationWeeks: 4, sessions: 10, sessionMin: 60, price: 9999, originalPrice: 11999, vehicleType: "manual", popular: true,
      description: "Complete foundation course. Zero to confident on city roads with a certified instructor.",
      includes: ["10 practical sessions", "Learner's license guidance", "Traffic rules classes", "Mock test", "Insurance & RTO assistance"],
      features: ["Personal instructor", "Pickup & drop", "Certificate on completion", "Free demo session"],
      emi: { downPayment: 3999, months: 2, monthly: 3000 },
    },
    {
      id: "pkg_intermediate", name: "Intermediate Package", slug: "intermediate", category: "Core", durationWeeks: 3, sessions: 8, sessionMin: 60, price: 8499, vehicleType: "both",
      description: "For students who already know basics and want structured improvement before the RTO test.",
      includes: ["8 practical sessions", "Test route practice", "Traffic signal drills", "Reverse & parking focus"],
      features: ["Flexible timings", "Progress report", "RTO test slot help"],
      emi: { downPayment: 3499, months: 2, monthly: 2500 },
    },
    {
      id: "pkg_highway", name: "Highway Training", slug: "highway-training", category: "Advanced", durationWeeks: 2, sessions: 5, sessionMin: 90, price: 6499, vehicleType: "manual",
      description: "Master high-speed control, lane discipline, overtaking and long-distance confidence.",
      includes: ["5 highway sessions", "Toll & merge practice", "Night highway option"],
      features: ["Dual-control car", "Advanced instructor", "Driving license focus"],
      emi: { downPayment: 2499, months: 2, monthly: 2000 },
    },
    {
      id: "pkg_reverse", name: "Reverse & Parking Mastery", slug: "reverse-parking", category: "Advanced", durationWeeks: 2, sessions: 5, sessionMin: 60, price: 5999, vehicleType: "both",
      description: "Tight spots, parallel parking, reverse T, garage entry — mastered step by step.",
      includes: ["5 focused sessions", "Parallel parking drills", "Reverse-T practice", "Multi-storey ramp practice"],
      features: ["Specialist instructor", "Guaranteed improvement"],
    },
    {
      id: "pkg_license", name: "License Assistance", slug: "license-assistance", category: "Combo", durationWeeks: 3, sessions: 6, sessionMin: 60, price: 7499, originalPrice: 8499, vehicleType: "both",
      description: "Fast-track RTO license preparation: learner permit, eye test, test slot booking and final test.",
      includes: ["Learner's permit help", "Eye test coordination", "RTO slot booking", "Test-day vehicle", "6 practice sessions"],
      features: ["Dedicated coordinator", "Fees on milestone basis"],
      emi: { downPayment: 2999, months: 2, monthly: 2250 },
    },
    {
      id: "pkg_automatic", name: "Automatic Car Course", slug: "automatic-car", category: "Vehicle Focus", durationWeeks: 3, sessions: 8, sessionMin: 60, price: 9999, vehicleType: "automatic", popular: true,
      description: "Learn on a modern automatic — easier clutch-free control, perfect for quick mastery.",
      includes: ["8 sessions on automatic", "City + highway routes", "Modern AMT car"],
      features: ["Premium automatic cars", "Female-friendly batches", "Weekend batches"],
      emi: { downPayment: 3999, months: 2, monthly: 3000 },
    },
    {
      id: "pkg_manual", name: "Manual Car Course", slug: "manual-car", category: "Vehicle Focus", durationWeeks: 4, sessions: 10, sessionMin: 60, price: 9499, vehicleType: "manual",
      description: "Master gears and clutch on India's most common cars — full control on any vehicle.",
      includes: ["10 manual sessions", "Gear-shift mastery", "Traffic & slope starts"],
      features: ["Popular hatchbacks", "Dual control", "RTO assistance"],
      emi: { downPayment: 3499, months: 2, monthly: 3000 },
    },
    {
      id: "pkg_night", name: "Night Driving Course", slug: "night-driving", category: "Advanced", durationWeeks: 2, sessions: 5, sessionMin: 90, price: 6999, vehicleType: "both",
      description: "Build night confidence: beam etiquette, glare handling, low-light parking and highway night runs.",
      includes: ["5 night sessions", "High-beam discipline", "Night highway + parking"],
      features: ["Evening & late slots", "Safety-focused"],
    },
    {
      id: "pkg_luxury", name: "Luxury Car Training", slug: "luxury-car", category: "Vehicle Focus", durationWeeks: 3, sessions: 6, sessionMin: 60, price: 14999, originalPrice: 17999, vehicleType: "both",
      description: "Learn chauffeur-grade driving on premium sedans and SUVs. White-glove experience.",
      includes: ["6 luxury-car sessions", "Premium sedan/SUV", "Etiquette & smoothness coaching", "Chauffeur-ready skills"],
      features: ["Top-rated instructor", "Flexible hours", "VIP pickup"],
      emi: { downPayment: 5999, months: 3, monthly: 3000 },
    },
    {
      id: "pkg_female", name: "Female Instructor Course", slug: "female-instructor", category: "Special", durationWeeks: 4, sessions: 10, sessionMin: 60, price: 10499, vehicleType: "automatic", popular: true,
      description: "Learn from our most patient female instructors — comfortable, judgment-free, women-first batches.",
      includes: ["10 sessions", "Female instructor", "Safe & supportive environment"],
      features: ["Flexible timing for women", "Automatic cars", "Doorstep pickup"],
      emi: { downPayment: 3999, months: 2, monthly: 3250 },
    },
  ];

  const vehicles: Vehicle[] = [
    { id: "veh_1", name: "White Swift", model: "Maruti Swift VXi", regNumber: "KA 01 MJ 4521", type: "manual", status: "booked", fuelLevel: 72, odometer: 28450, lastService: daysAgo(20), serviceDueKm: 31000, insuranceExpiry: daysAhead(120), tyreReplacedAt: daysAgo(90), lastCleanedAt: daysAgo(1) },
    { id: "veh_2", name: "Silver Dzire", model: "Maruti Dzire ZXi", regNumber: "KA 05 MB 8890", type: "manual", status: "available", fuelLevel: 55, odometer: 41200, lastService: daysAgo(45), serviceDueKm: 45000, insuranceExpiry: daysAhead(60), tyreReplacedAt: daysAgo(200), lastCleanedAt: daysAgo(2) },
    { id: "veh_3", name: "Blue i10", model: "Hyundai i10 Nios AMT", regNumber: "KA 03 MK 1204", type: "automatic", status: "available", fuelLevel: 88, odometer: 16980, lastService: daysAgo(10), serviceDueKm: 20000, insuranceExpiry: daysAhead(200), tyreReplacedAt: daysAgo(150), lastCleanedAt: daysAgo(0) },
    { id: "veh_4", name: "Red Comet", model: "MG Comet EV", regNumber: "KA 02 MF 7741", type: "automatic", status: "available", fuelLevel: 96, odometer: 8900, lastService: daysAgo(5), serviceDueKm: 15000, insuranceExpiry: daysAhead(300), tyreReplacedAt: daysAgo(120), lastCleanedAt: daysAgo(1) },
    { id: "veh_5", name: "Black Alto", model: "Maruti Alto K10", regNumber: "KA 01 MC 3309", type: "manual", status: "maintenance", fuelLevel: 20, odometer: 65400, lastService: daysAgo(2), serviceDueKm: 66000, insuranceExpiry: daysAgo(10), tyreReplacedAt: daysAgo(400), notes: "Clutch plate replacement in progress", lastCleanedAt: daysAgo(5) },
    { id: "veh_6", name: "Pearl Verna", model: "Hyundai Verna SX", regNumber: "KA 04 MN 6612", type: "automatic", status: "cleaning", fuelLevel: 64, odometer: 22100, lastService: daysAgo(25), serviceDueKm: 26000, insuranceExpiry: daysAhead(45), tyreReplacedAt: daysAgo(80), notes: "Detailing for luxury batch", lastCleanedAt: daysAgo(0) },
  ];

  const instRavi = makeInstructor("inst_ravi", "Ravi Kumar", "ravi@srimathru.in", "9000000002", 4.9, 312, 12, ["Highway", "Luxury", "Night"], ["Kannada", "English", "Hindi"], "Vehicle maintenance expert, ex-fleet trainer.", "veh_1", "#f59e0b");
  const instKavya = makeInstructor("inst_kavya", "Kavya Shetty", "kavya@srimathru.in", "9000000003", 4.9, 287, 8, ["Beginner", "Automatic", "Female batches"], ["Kannada", "English"], "Calm, patient teaching style loved by first-timers.", "veh_3", "#8b5cf6");
  const instArjun = makeInstructor("inst_arjun", "Arjun Patel", "arjun@srimathru.in", "9000000004", 4.7, 241, 15, ["Manual", "License", "Traffic"], ["Kannada", "English", "Hindi"], "RTO test specialist with 98% first-attempt pass rate.", "veh_2", "#10b981");
  const instDivya = makeInstructor("inst_divya", "Divya Reddy", "divya@srimathru.in", "9000000005", 4.8, 198, 6, ["Reverse parking", "Automatic", "Female batches"], ["Kannada", "English", "Telugu"], "Young, energetic coach. Parking & reverse specialist.", "veh_4", "#ec4899");
  users.push(instRavi, instKavya, instArjun, instDivya);

  const instructors = [instRavi, instKavya, instArjun, instDivya];
  const instructorVehicle: Record<string, string> = {};
  const instructorShift: Record<string, string[]> = {};
  for (const r of SCHEDULE) {
    instructorVehicle[r.instructorId] = r.vehicleId;
    instructorShift[r.instructorId] = r.shift;
  }

  // admin + students
  users.push({
    id: "usr_admin", name: "Suresh Mathru", email: "admin@srimathru.in", phone: "9000000001", passwordHash: hash("admin123"), role: "admin", verified: true, active: true,
    documents: [], createdAt: tsAgo(400), updatedAt: tsAgo(1), referralCode: "SMOWNER",
  });

  const studentDefs: { id: string; name: string; phone: string; email: string; age: number; gender: string; city: string; pkg: string; weeks: number; enrolledWeeksAgo: number; completedCount: number; upcomingCount: number; attrs: ("present" | "late" | "absent")[] }[] = [
    { id: "usr_s1", name: "Rahul Sharma", phone: "9000000010", email: "rahul.sharma@gmail.com", age: 21, gender: "M", city: "Bengaluru", pkg: "pkg_beginner", weeks: 4, enrolledWeeksAgo: 10, completedCount: 7, upcomingCount: 3, attrs: ["present", "present", "late", "present", "absent", "present", "late"] },
    { id: "usr_s2", name: "Ananya Iyer", phone: "9000000011", email: "ananya.iyer@gmail.com", age: 24, gender: "F", city: "Bengaluru", pkg: "pkg_automatic", weeks: 3, enrolledWeeksAgo: 8, completedCount: 6, upcomingCount: 2, attrs: ["present", "present", "present", "present", "late", "present"] },
    { id: "usr_s3", name: "Mohammed Faisal", phone: "9000000012", email: "faisal.m@gmail.com", age: 27, gender: "M", city: "Bengaluru", pkg: "pkg_license", weeks: 3, enrolledWeeksAgo: 6, completedCount: 4, upcomingCount: 2, attrs: ["present", "absent", "present", "present"] },
    { id: "usr_s4", name: "Priya Nair", phone: "9000000013", email: "priya.nair@gmail.com", age: 22, gender: "F", city: "Mysuru", pkg: "pkg_female", weeks: 4, enrolledWeeksAgo: 7, completedCount: 5, upcomingCount: 3, attrs: ["present", "present", "present", "late", "present"] },
    { id: "usr_s5", name: "Karthik Reddy", phone: "9000000014", email: "karthik.r@gmail.com", age: 26, gender: "M", city: "Bengaluru", pkg: "pkg_manual", weeks: 4, enrolledWeeksAgo: 9, completedCount: 8, upcomingCount: 2, attrs: ["present", "present", "present", "present", "present", "absent", "present", "late"] },
    { id: "usr_s6", name: "Sneha Kulkarni", phone: "9000000015", email: "sneha.k@gmail.com", age: 25, gender: "F", city: "Bengaluru", pkg: "pkg_intermediate", weeks: 3, enrolledWeeksAgo: 5, completedCount: 3, upcomingCount: 2, attrs: ["present", "present", "present"] },
    { id: "usr_s7", name: "Vikram Singh", phone: "9000000016", email: "vikram.s@gmail.com", age: 31, gender: "M", city: "Bengaluru", pkg: "pkg_highway", weeks: 2, enrolledWeeksAgo: 4, completedCount: 3, upcomingCount: 2, attrs: ["present", "late", "present"] },
    { id: "usr_s8", name: "Lakshmi Venkat", phone: "9000000017", email: "lakshmi.v@gmail.com", age: 29, gender: "F", city: "Bengaluru", pkg: "pkg_luxury", weeks: 3, enrolledWeeksAgo: 12, completedCount: 6, upcomingCount: 0, attrs: ["present", "present", "present", "present", "present", "present"] },
    { id: "usr_s9", name: "Deepak Kumar", phone: "9000000018", email: "deepak.k@gmail.com", age: 23, gender: "M", city: "Bengaluru", pkg: "pkg_reverse", weeks: 2, enrolledWeeksAgo: 3, completedCount: 2, upcomingCount: 3, attrs: ["present", "present"] },
    { id: "usr_s10", name: "Meera Pillai", phone: "9000000019", email: "meera.p@gmail.com", age: 28, gender: "F", city: "Bengaluru", pkg: "pkg_night", weeks: 2, enrolledWeeksAgo: 2, completedCount: 2, upcomingCount: 3, attrs: ["present", "present"] },
  ];

  const slotMap = new Map<string, Slot>();
  const bookings: Booking[] = [];
  const notes: LessonNote[] = [];
  const progresses: Progress[] = [];
  const payments: Payment[] = [];
  const invoices: Invoice[] = [];
  const reviews: Review[] = [];
  const certificates: Certificate[] = [];
  const notifications: Notification[] = [];
  const automationLogs: AutomationLog[] = [];
  const waitlist: WaitlistEntry[] = [];

  // slots: next 14 days, skip Sundays, respect shifts; mark maintenance vehicle days
  for (let i = 0; i < 14; i++) {
    const date = daysAhead(i);
    const dow = new Date(Date.now() + i * DAY).getDay();
    if (dow === 0) continue;
    for (const r of SCHEDULE) {
      const maintenanceDay = (date === daysAhead(2) && r.instructorId === "inst_ravi");
      for (const time of r.shift) {
        const id = `${date}_${time}_${r.instructorId}`;
        slotMap.set(id, {
          id, date, time, instructorId: r.instructorId, vehicleId: r.vehicleId,
          status: maintenanceDay ? "maintenance" : "available",
        });
      }
    }
  }

  // build bookings for each student
  studentDefs.forEach((s, si) => {
    const inst = instructors[si % instructors.length];
    const pkg = packages.find((p) => p.id === s.pkg)!;
    const vehicleId = instructorVehicle[inst.id];
    users.push({
      id: s.id, name: s.name, email: s.email, phone: s.phone, passwordHash: hash("demo123"), role: "student", verified: true, active: true,
      studentId: `SMD${String(1000 + si + 1)}`, age: s.age, gender: s.gender, city: s.city,
      address: `${s.city} - 560001`, emergencyContact: "9876500001", emergencyContactName: "Parent", 
      vehiclePreference: pkg.vehicleType === "automatic" ? "automatic" : "manual",
      batchPreference: si % 2 === 0 ? "Morning (6-11 AM)" : "Evening (4-8 PM)",
      packageId: s.pkg, enrolledAt: daysAgo(s.enrolledWeeksAgo * 7), referralCode: `SM${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      documents: [
        { id: uid("doc"), type: "Aadhaar", fileName: "aadhaar.jpg", number: `${s.phone.slice(0, 2)}14 33${s.phone.slice(3, 7)} 2${s.phone.slice(7)}`, uploadedAt: tsAgo(s.enrolledWeeksAgo * 7) },
        { id: uid("doc"), type: "Learner's License", fileName: "ll.pdf", expiry: daysAhead(30), uploadedAt: tsAgo(s.enrolledWeeksAgo * 7 - 2) },
        { id: uid("doc"), type: "Passport Photo", fileName: "photo.jpg", uploadedAt: tsAgo(s.enrolledWeeksAgo * 7) },
      ],
      createdAt: tsAgo(s.enrolledWeeksAgo * 7), updatedAt: tsAgo(1),
    });

    // payment: full or EMI for the package
    const payId = uid("pay");
    const pkgPayments: Payment[] = [];
    if (pkg.emi && si % 2 === 1) {
      pkgPayments.push({ id: payId, ref: `TXN${Date.now().toString(36)}${si}A`, studentId: s.id, packageId: s.pkg, amount: pkg.emi.downPayment, paidAmount: pkg.emi.downPayment, method: "upi", status: "paid", invoiceNo: `INV-2026-${100 + si}`, createdAt: tsAgo(s.enrolledWeeksAgo * 7) });
      pkgPayments.push({ id: uid("pay"), ref: `TXN${Date.now().toString(36)}${si}B`, studentId: s.id, packageId: s.pkg, amount: pkg.emi.monthly, paidAmount: pkg.emi.monthly, method: "card", status: "paid", dueDate: daysAgo(s.enrolledWeeksAgo * 7 - 30), createdAt: tsAgo(s.enrolledWeeksAgo * 7 - 30) });
      if (si < 4) {
        pkgPayments.push({ id: uid("pay"), ref: `TXN${Date.now().toString(36)}${si}C`, studentId: s.id, packageId: s.pkg, amount: pkg.emi.monthly, paidAmount: 0, method: "emi", status: "pending", dueDate: daysAhead(5), createdAt: tsAgo(10) });
      }
    } else {
      pkgPayments.push({ id: payId, ref: `TXN${Date.now().toString(36)}${si}`, studentId: s.id, packageId: s.pkg, amount: pkg.price, paidAmount: pkg.price, method: si % 2 === 0 ? "upi" : "card", status: "paid", invoiceNo: `INV-2026-${100 + si}`, createdAt: tsAgo(s.enrolledWeeksAgo * 7) });
    }
    payments.push(...pkgPayments);
    const totalPaid = pkgPayments.reduce((a, p) => a + p.paidAmount, 0);
    const firstPay = pkgPayments[0];
    if (firstPay) {
      invoices.push({ id: uid("inv"), number: firstPay.invoiceNo!, studentId: s.id, paymentId: firstPay.id, items: [{ name: pkg.name, qty: 1, amount: pkg.price }], subtotal: pkg.price, gst: Math.round(pkg.price * 0.18), total: Math.round(pkg.price * 1.18), issuedAt: tsAgo(s.enrolledWeeksAgo * 7) });
    }

    // completed lessons at ~ weekly intervals from enrollment
    const skillValues: Record<string, number> = { ...SKILL_SEED };
    for (let c = 0; c < s.completedCount; c++) {
      const offset = (s.enrolledWeeksAgo * 7) - c * Math.max(4, Math.floor(s.weeks * 7 / s.completedCount));
      const date = daysAgo(offset);
      const time = instructorShift[inst.id][(c + si) % instructorShift[inst.id].length];
      const b: Booking = {
        id: uid("bk"), ref: `BK${String(2000 + si * 50 + c)}`, studentId: s.id, instructorId: inst.id, vehicleId, packageId: s.pkg,
        date, time, durationMin: pkg.sessionMin, status: "completed", amount: pkg.price, paid: totalPaid, attendance: s.attrs[c % s.attrs.length], createdAt: tsAgo(offset + 1),
      };
      bookings.push(b);
      // mark slot taken
      const slotKey = `${date}_${time}_${inst.id}`;
      const sl = slotMap.get(slotKey);
      if (sl) slotMap.set(slotKey, { ...sl, status: "booked" });

      // progress growth
      Object.entries(skillValues).forEach(([k, v], ki) => {
        if (c > 0 && (c + ki) % 3 === 0) skillValues[k] = Math.min(5, v + 0.5);
      });

      if (c === 2) {
        notes.push({ id: uid("note"), bookingId: b.id, studentId: s.id, instructorId: inst.id, date, note: "Good clutch control today. Needs more practice on turns.", recommendation: "Practice turning with proper hand-over-hand steering.", skillDeltas: { steering: 1, traffic: 0.5 } });
      }
      if (c === Math.floor(s.completedCount / 2)) {
        notes.push({ id: uid("note"), bookingId: b.id, studentId: s.id, instructorId: inst.id, date, note: "Confidence improving. Focus on smooth braking before signals.", recommendation: "Reverse parking drill next session.", skillDeltas: { reverse: 0.5 } });
      }
    }

    // upcoming lessons
    for (let u = 0; u < s.upcomingCount; u++) {
      const date = daysAhead(1 + u * 2 + (si % 2));
      const time = instructorShift[inst.id][(u + si + 2) % instructorShift[inst.id].length];
      const slotKey = `${date}_${time}_${inst.id}`;
      const sl = slotMap.get(slotKey);
      const vId = sl?.vehicleId ?? vehicleId;
      const b: Booking = {
        id: uid("bk"), ref: `BK${String(3000 + si * 50 + u)}`, studentId: s.id, instructorId: inst.id, vehicleId: vId, packageId: s.pkg,
        date, time, durationMin: pkg.sessionMin, status: u === 0 ? "confirmed" : "upcoming", amount: pkg.price, paid: totalPaid, attendance: "na", createdAt: tsAgo(2),
      };
      bookings.push(b);
      if (sl) slotMap.set(slotKey, { ...sl, status: "booked" });
      else slotMap.set(slotKey, { id: slotKey, date, time, instructorId: inst.id, vehicleId: vId, status: "booked" });
    }

    progresses.push({
      id: uid("prog"), studentId: s.id,
      skills: Object.fromEntries(Object.entries(skillValues).map(([k, v]) => [k, { value: Math.round(v * 2) / 2, history: [{ date: daysAgo(s.enrolledWeeksAgo * 7), value: 1 }, { date: daysAgo(s.completedCount * 3), value: Math.round((v - 1) * 2) / 2 }, { date: daysAgo(1), value: Math.round(v * 2) / 2 }] }])),
      lessonsCompleted: s.completedCount, lessonsTotal: pkg.sessions,
      licenseChecklist: { learnerLicense: true, eyeTest: true, practiceHours: s.completedCount >= 3, mockTest: s.completedCount >= 5, rtoSlot: s.completedCount >= 6, drivingTest: s.completedCount >= (s.pkg === "pkg_license" ? 6 : 8), licenseIssued: false },
      updatedAt: tsAgo(1),
    });

    // certificates + reviews for finished students
    if (s.completedCount >= pkg.sessions || s.id === "usr_s8") {
      certificates.push({ id: uid("cert"), studentId: s.id, packageId: s.pkg, code: `SMCERT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`, issuedAt: tsAgo(20), signedBy: "Suresh Mathru (Director)" });
      const rating = si % 4 === 0 ? 5 : si % 4 === 1 ? 5 : si % 4 === 2 ? 4 : 5;
      reviews.push({ id: uid("rev"), studentId: s.id, rating, comment: testiComments[si % testiComments.length], createdAt: tsAgo(15) });
    }
  });

  // one low-rating private review
  reviews.push({ id: uid("rev"), studentId: "usr_s5", rating: 3, comment: "Lesson timings clashed twice with my office hours. Instructors are good though.", private: true, createdAt: tsAgo(9) });

  const leads: Lead[] = [
    { id: uid("lead"), name: "Nithin Kumar", phone: "9876500002", email: "nithin@gmail.com", source: "website", status: "new", packageInterested: "Beginner Package", followUpAt: daysAhead(1), notes: ["Asked about weekend batches"], createdAt: tsAgo(0) },
    { id: uid("lead"), name: "Farhan Ahmed", phone: "9876500003", source: "google", status: "called", packageInterested: "License Assistance", followUpAt: daysAhead(1), notes: ["From Google Ads - 'driving school near me'"], createdAt: tsAgo(1) },
    { id: uid("lead"), name: "Shreya Gowda", phone: "9876500004", email: "shreya.g@gmail.com", source: "instagram", status: "interested", packageInterested: "Automatic Car Course", followUpAt: daysAhead(2), notes: ["Saw reels, wants AMT car"], createdAt: tsAgo(2) },
    { id: uid("lead"), name: "Rohan D'Souza", phone: "9876500005", source: "whatsapp", status: "demo_booked", packageInterested: "Beginner Package", followUpAt: daysAhead(1), notes: ["Free demo booked for weekend"], createdAt: tsAgo(2) },
    { id: uid("lead"), name: "Kavitha Rao", phone: "9876500006", email: "kavitha.rao@gmail.com", source: "facebook", status: "interested", packageInterested: "Female Instructor Course", followUpAt: daysAhead(3), notes: ["Wants female instructor, evening slots"], createdAt: tsAgo(3) },
    { id: uid("lead"), name: "Surya Prakash", phone: "9876500007", source: "website", status: "new", followUpAt: daysAhead(1), notes: ["Asked about luxury car training"], createdAt: tsAgo(0) },
    { id: uid("lead"), name: "Tanvi Shah", phone: "9876500008", source: "google", status: "registered", studentId: "usr_s9", packageInterested: "Reverse & Parking Mastery", createdAt: tsAgo(21), notes: ["Converted from search ad"] },
    { id: uid("lead"), name: "Abdul Rahman", phone: "9876500009", source: "walkin", status: "lost", followUpAt: daysAgo(5), notes: ["Price sensitive, never responded"], createdAt: tsAgo(30) },
    { id: uid("lead"), name: "Harini Prasad", phone: "9876500011", email: "harini.p@gmail.com", source: "referral", status: "new", packageInterested: "Night Driving Course", followUpAt: daysAhead(1), notes: ["Referred by Rahul Sharma"], createdAt: tsAgo(0) },
    { id: uid("lead"), name: "Ganesh Bhat", phone: "9876500012", source: "website", status: "called", packageInterested: "Manual Car Course", followUpAt: daysAhead(2), notes: ["Wants early morning slots"], createdAt: tsAgo(1) },
  ];

  const expenses: Expense[] = [];
  for (let m = 0; m < 3; m++) {
    const monthBase = m * 30;
    expenses.push({ id: uid("exp"), category: "fuel", amount: 14500 + m * 300, note: "Diesel & petrol for fleet", date: daysAgo(monthBase) });
    expenses.push({ id: uid("exp"), category: "maintenance", amount: 6800 + m * 900, note: "Vehicle servicing & parts", date: daysAgo(monthBase + 4) });
    expenses.push({ id: uid("exp"), category: "salary", amount: 64000, note: "Instructor salaries", date: daysAgo(monthBase + 1) });
    expenses.push({ id: uid("exp"), category: "insurance", amount: 12000, note: "Fleet insurance premium", date: daysAgo(monthBase + 12) });
    expenses.push({ id: uid("exp"), category: "marketing", amount: 9000 + m * 1500, note: "Google & Meta ads", date: daysAgo(monthBase + 6) });
    expenses.push({ id: uid("exp"), category: "rent", amount: 18000, note: "Office & practice yard rent", date: daysAgo(monthBase + 2) });
    expenses.push({ id: uid("exp"), category: "utilities", amount: 3400 + m * 200, note: "Electricity & water", date: daysAgo(monthBase + 8) });
  }

  const payroll: PayrollRecord[] = instructors.map((inst, i) => ({
    id: uid("payroll"), instructorId: inst.id, month: "2026-07", lessons: 60 - i * 6, base: 16000, bonus: i === 0 ? 3000 : 2000, commission: 12000 - i * 1500, total: 16000 + (i === 0 ? 3000 : 2000) + (12000 - i * 1500), status: "paid", createdAt: tsAgo(5),
  }));

  const coupons: Coupon[] = [
    { id: uid("cpn"), code: "FIRST100", type: "flat", value: 1000, maxUses: 50, uses: 12, validFrom: daysAgo(30), validTo: daysAhead(90), active: true },
    { id: uid("cpn"), code: "SUMMER25", type: "percent", value: 25, maxUses: 100, uses: 34, validFrom: daysAgo(20), validTo: daysAhead(40), active: true },
    { id: uid("cpn"), code: "STUDENT50", type: "flat", value: 500, maxUses: 200, uses: 61, validFrom: daysAgo(60), validTo: daysAhead(150), active: true },
  ];

  const notifSpecs: { userId: string; title: string; body: string; channel: Notification["channel"]; days: number }[] = [
    { userId: "usr_s1", title: "Lesson Reminder", body: "Your lesson with Ravi Kumar is tomorrow at 7:30 AM.", channel: "whatsapp", days: 1 },
    { userId: "usr_s1", title: "Payment Due", body: "Final installment of ₹0 due soon. Tap to pay now.", channel: "app", days: 2 },
    { userId: "usr_s2", title: "Lesson Reminder", body: "Your lesson with Kavya Shetty is tomorrow at 9:00 AM.", channel: "whatsapp", days: 1 },
    { userId: "usr_s2", title: "Progress Report", body: "You improved your parking skills this week! ⭐⭐⭐⭐", channel: "email", days: 2 },
    { userId: "usr_s4", title: "Welcome to Sri Mathru!", body: "Happy to have you aboard. Your Student ID is SMD1004.", channel: "whatsapp", days: 49 },
    { userId: "usr_s3", title: "License Deadline", body: "Your learner's license expires in 30 days. Book your test slot.", channel: "app", days: 0 },
  ];
  notifSpecs.forEach((n, i) => {
    notifications.push({ id: uid("notif"), userId: n.userId, channel: n.channel, title: n.title, body: n.body, read: i % 3 === 0, createdAt: tsAgo(n.days) });
    automationLogs.push({ id: uid("auto"), type: n.channel === "email" ? "lesson_reminder" : "lesson_reminder", channel: n.channel, recipient: n.userId === "usr_s1" ? "rahul.sharma@gmail.com" : n.userId === "usr_s2" ? "ananya.iyer@gmail.com" : n.userId === "usr_s4" ? "priya.nair@gmail.com" : "9000000012", summary: n.title, status: "sent", createdAt: tsAgo(n.days) });
  });

  // waitlist example
  waitlist.push({ id: uid("wl"), studentId: "usr_s6", instructorId: "inst_kavya", date: daysAhead(3), time: "18:00", createdAt: tsAgo(2) });

  const slots = [...slotMap.values()].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return {
    users, packages, vehicles, slots, bookings, lessonNotes: notes, progresses, payments, invoices,
    notifications, automationLogs, leads, expenses, payroll, coupons, reviews, certificates, waitlist,
    otps: [], auditLogs: [], settings: {
      schoolName: "Sri Mathru Driving School",
      tagline: "Learn. Drive. Win.",
      phone: "+91 90000 90000",
      whatsapp: "+91 90000 90000",
      email: "hello@srimathru.in",
      address: "#12, 4th Cross, Banashankari 2nd Stage, Bengaluru - 560070",
      branches: [
        { id: "br_bnk", name: "Banashankari (Main)", address: "#12, 4th Cross, Banashankari 2nd Stage, Bengaluru - 560070", phone: "+91 90000 90001", city: "Bengaluru" },
        { id: "br_bsk", name: "Banshankari Jayanagar", address: "102, 27th Main, Jayanagar 4th Block, Bengaluru - 560011", phone: "+91 90000 90002", city: "Bengaluru" },
        { id: "br_rmn", name: "RR Nagar", address: "45, 1st Main, Rajarajeshwari Nagar, Bengaluru - 560098", phone: "+91 90000 90003", city: "Bengaluru" },
      ],
      gstin: "29ABCDE1234F1Z5",
      openingHours: "Mon-Sat, 6:00 AM - 8:00 PM",
      cancellationPolicyHours: 24,
      cancellationFeePct: 10,
      referralDiscount: 500,
      demoMode: true,
    },
    counters: { booking: 4050, invoice: 140, payment: 900, certificate: 12, lead: 60 },
  };

  function makeInstructor(id: string, name: string, email: string, phone: string, rating: number, reviewCount: number, yearsExp: number, specialization: string[], languages: string[], bio: string, vehicleId: string, avatarColor: string): User {
    return {
      id, name, email, phone, passwordHash: hash("demo123"), role: "instructor", verified: true, active: true,
      avatarColor, specialization, languages, rating, reviewCount, yearsExp,
      certifications: ["RTO Certified Instructor", "Defensive Driving Trainer", "Advanced Driving License"],
      bio, salaryPerLesson: 500, commissionPct: 10, documents: [], createdAt: tsAgo(400), updatedAt: tsAgo(2),
    };
  }
}

/**
 * Rolls the demo availability window forward so the dashboard and booking
 * flow never go stale as real days pass. Adds any missing slots from the day
 * after the newest existing slot up to `today + days - 1` (Sundays skipped),
 * without touching or duplicating existing slots. Returns the number added.
 */
export function rollWindowForward(db: DB, days = 14): number {
  const horizon = iso(new Date(Date.now() + (days - 1) * DAY));
  let maxDate = "";
  for (const s of db.slots) if (s.date > maxDate) maxDate = s.date;
  if (maxDate >= horizon) return 0;

  let cursor: Date;
  if (maxDate) {
    cursor = new Date(`${maxDate}T00:00:00Z`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  } else {
    cursor = new Date(`${iso(new Date())}T00:00:00Z`);
  }
  const todayUtc = new Date(`${iso(new Date())}T00:00:00Z`);
  if (cursor < todayUtc) cursor = todayUtc;

  let added = 0;
  while (iso(cursor) <= horizon) {
    const date = iso(cursor);
    if (cursor.getUTCDay() !== 0) {
      for (const r of SCHEDULE) {
        for (const time of r.shift) {
          const id = `${date}_${time}_${r.instructorId}`;
          if (db.slots.some((s) => s.id === id)) continue;
          db.slots.push({ id, date, time, instructorId: r.instructorId, vehicleId: r.vehicleId, status: "available" });
          added++;
        }
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return added;
}

const testiComments = [
  "Best decision ever! Kavya ma'am was so patient. I passed my license test on the first attempt. Highly recommend Sri Mathru!",
  "The online booking system is a game changer. I booked lessons from my phone, got WhatsApp reminders — no calls needed.",
  "Very professional team. The automatic car course made learning so easy for me.",
  "Arjun sir is the best RTO trainer in Bengaluru. Cleared my test without any hassle.",
  "Clean cars, on-time instructors, and great progress tracking. Worth every rupee.",
  "The night driving course gave me real confidence on the highway. Thank you Sri Mathru!",
];

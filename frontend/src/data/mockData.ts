import { Customer, Package, Equipment, Session, PaymentRecord, RentalItem, Settings } from '../types';

export const initialSettings: Settings = {
  businessName: 'Chakreshwar Swimming Pool',
  phone: '+91 98200 12345',
  address: 'Chakreshwar Swimming Pool, Outer Ring Road, Bengaluru, Karnataka 560103',
  email: 'info@chakreshwarswimmingpool.com',
  currency: '₹',
  timezone: 'Asia/Kolkata',
  gstNumber: '29AABCS1429B1Z8',
  penaltyEnabled: true,
  penaltyAfterMinutes: 15,
  penaltyAmount: 50,
  fiveMinuteWarning: true,
  expiryAlarm: true,
  soundEnabled: true,
  soundVolume: 75,
  dateFormat: 'dd/MM/yyyy',
  timeFormat: '12h',
  defaultFilter: 'active',
  lockerCount: 20,
};

export const initialPackages: Package[] = [
  {
    id: 'pkg-monthly-coaching',
    name: 'Coaching',
    durationMinutes: 43200,
    price: 3500,
    description: '30-day monthly swimming coaching package.',
    isActive: true,
    packageKind: 'monthly',
    durationMonths: 1,
  },
  {
    id: 'pkg-monthly-regular',
    name: 'Regular Swimming',
    durationMinutes: 43200,
    price: 2000,
    description: '30-day regular monthly swimming package.',
    isActive: true,
    packageKind: 'monthly',
    durationMonths: 1,
  },
  {
    id: 'pkg-30',
    name: 'Quick Splash (30 Mins)',
    durationMinutes: 30,
    price: 50,
    description: 'Perfect for quick refreshing dips and beginner warmups.',
    isActive: true,
    swimmersCount: 142,
  },
  {
    id: 'pkg-60',
    name: 'Standard Swim (60 Mins)',
    durationMinutes: 60,
    price: 100,
    description: 'Most popular option for regular swimmers and lane training.',
    isActive: true,
    swimmersCount: 388,
  },
  {
    id: 'pkg-90',
    name: 'Extended Fitness (90 Mins)',
    durationMinutes: 90,
    price: 150,
    description: 'Extended endurance training, aqua fitness and full relaxation.',
    isActive: true,
    swimmersCount: 94,
  },
  {
    id: 'pkg-weekend',
    name: 'Weekend Club Pass (60 Mins)',
    durationMinutes: 60,
    price: 120,
    description: 'Weekend leisure swim with complimentary locker access.',
    isActive: true,
    swimmersCount: 215,
  },
  {
    id: 'pkg-kids',
    name: 'Junior Dolphin (45 Mins)',
    durationMinutes: 45,
    price: 70,
    description: 'Dedicated children pool session with safety supervision.',
    isActive: true,
    swimmersCount: 86,
  },
];

export const initialEquipment: Equipment[] = [
  {
    id: 'eq-costume-men',
    name: 'Swimming Costume (Men)',
    equipmentType: 'rental',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultRate: 50,
    defaultDeposit: 100,
    totalStock: 30,
    availableStock: 22,
  },
  {
    id: 'eq-costume-women',
    name: 'Swimming Costume (Women)',
    equipmentType: 'rental',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultRate: 50,
    defaultDeposit: 100,
    totalStock: 30,
    availableStock: 25,
  },
  {
    id: 'eq-goggles',
    name: 'Anti-Fog Swimming Goggles',
    equipmentType: 'rental',
    sizes: ['Standard'],
    defaultRate: 30,
    defaultDeposit: 50,
    totalStock: 45,
    availableStock: 34,
  },
  {
    id: 'eq-towel',
    name: 'Microfiber Quick-Dry Towel',
    equipmentType: 'rental',
    sizes: ['Standard', 'Large'],
    defaultRate: 40,
    defaultDeposit: 50,
    totalStock: 50,
    availableStock: 41,
  },
  {
    id: 'eq-cap',
    name: 'Silicone Swimming Cap',
    equipmentType: 'rental',
    sizes: ['Free Size'],
    defaultRate: 20,
    defaultDeposit: 30,
    totalStock: 60,
    availableStock: 52,
  },
  {
    id: 'eq-kickboard',
    name: 'Training Kickboard / Float',
    equipmentType: 'rental',
    sizes: ['Standard'],
    defaultRate: 30,
    defaultDeposit: 50,
    totalStock: 25,
    availableStock: 20,
  },
];

export const initialCustomers: Customer[] = [
  {
    id: 'cust-101',
    name: 'Vikram Aditya',
    phone: '+91 98450 11223',
    age: 29,
    notes: 'Regular morning swimmer, prefers lane 3',
    createdAt: '2026-09-12T06:30:00Z',
    totalVisits: 18,
  },
  {
    id: 'cust-102',
    name: 'Priya Sharma',
    phone: '+91 97312 88491',
    age: 26,
    notes: 'Weekend pass holder, rents goggles frequently',
    createdAt: '2026-10-01T10:00:00Z',
    totalVisits: 8,
  },
  {
    id: 'cust-103',
    name: 'Rajesh & Friends',
    phone: '+91 99002 44321',
    age: 34,
    notes: 'Group coordinator for IT professionals club',
    createdAt: '2026-08-15T16:00:00Z',
    totalVisits: 12,
  },
  {
    id: 'cust-104',
    name: 'Sneha Sundaram',
    phone: '+91 96111 77332',
    age: 31,
    notes: 'Aqua-aerobics enthusiast',
    createdAt: '2026-10-20T08:15:00Z',
    totalVisits: 5,
  },
  {
    id: 'cust-105',
    name: 'Amitabh Verma',
    phone: '+91 98860 33445',
    age: 42,
    notes: 'Swimming with son Rohan',
    createdAt: '2026-09-05T17:45:00Z',
    totalVisits: 14,
  },
  {
    id: 'cust-106',
    name: 'Ananya Deshmukh',
    phone: '+91 94480 66778',
    age: 24,
    notes: 'College sports team member',
    createdAt: '2026-10-14T11:20:00Z',
    totalVisits: 7,
  },
  {
    id: 'cust-107',
    name: 'Karthik Raja',
    phone: '+91 98440 99887',
    age: 38,
    notes: 'Corporate group leader',
    createdAt: '2026-07-22T09:10:00Z',
    totalVisits: 22,
  },
];

export function generateInitialDemonstrationData(): {
  sessions: Session[];
  payments: PaymentRecord[];
  rentals: RentalItem[];
} {
  const now = new Date();

  // Helper to get ISO strings offset from now in minutes
  const addMins = (minutes: number) => new Date(now.getTime() + minutes * 60000).toISOString();
  const subMins = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString();
  const subHours = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();
  const subDays = (days: number, hourOffset: number = 0) =>
    new Date(now.getTime() - days * 86400000 + hourOffset * 3600000).toISOString();

  // 1. Session 1: Active individual (35 mins left)
  const sess1: Session = {
    id: 'SESS-2026-101',
    type: 'individual',
    customerId: 'cust-101',
    customerName: 'Vikram Aditya',
    customerPhone: '+91 98450 11223',
    customerAge: 29,
    peopleCount: 1,
    packageId: 'pkg-60',
    packageName: 'Standard Swim (60 Mins)',
    durationMinutes: 60,
    entryTime: subMins(25),
    scheduledExitTime: addMins(35),
    status: 'active',
    swimmingCharges: 100,
    extensionCharges: 0,
    rentalCharges: 50,
    totalCharges: 150,
    paidAmount: 150,
    outstandingBalance: 0,
    paymentStatus: 'paid',
    notes: 'Lane 3 reserved for laps',
    extensions: [],
    rentals: [
      {
        id: 'RNT-2026-01',
        sessionId: 'SESS-2026-101',
        customerId: 'cust-101',
        customerName: 'Vikram Aditya',
        equipmentId: 'eq-costume-men',
        equipmentName: 'Swimming Costume (Men)',
        size: 'L',
        quantity: 1,
        returnedQuantity: 0,
        pricePerItem: 50,
        totalRentalAmount: 50,
        securityDeposit: 100,
        issueTimestamp: subMins(25),
        status: 'active',
      },
    ],
    payments: [
      {
        id: 'TXN-2026-001',
        sessionId: 'SESS-2026-101',
        customerId: 'cust-101',
        customerName: 'Vikram Aditya',
        amount: 150,
        method: 'gpay',
        referenceNumber: 'UPI/6312450091',
        timestamp: subMins(25),
        status: 'success',
        notes: 'Full payment via Google Pay',
      },
    ],
  };

  // 2. Session 2: Expiring soon (3 minutes left!)
  const sess2: Session = {
    id: 'SESS-2026-102',
    type: 'individual',
    customerId: 'cust-102',
    customerName: 'Priya Sharma',
    customerPhone: '+91 97312 88491',
    customerAge: 26,
    peopleCount: 1,
    packageId: 'pkg-60',
    packageName: 'Standard Swim (60 Mins)',
    durationMinutes: 60,
    entryTime: subMins(57),
    scheduledExitTime: addMins(3),
    status: 'expiring',
    swimmingCharges: 100,
    extensionCharges: 0,
    rentalCharges: 70, // costume + towel
    totalCharges: 170,
    paidAmount: 100,
    outstandingBalance: 70,
    paymentStatus: 'partial',
    notes: 'Needs towel return verification',
    extensions: [],
    rentals: [
      {
        id: 'RNT-2026-02',
        sessionId: 'SESS-2026-102',
        customerId: 'cust-102',
        customerName: 'Priya Sharma',
        equipmentId: 'eq-goggles',
        equipmentName: 'Anti-Fog Swimming Goggles',
        size: 'Standard',
        quantity: 1,
        returnedQuantity: 0,
        pricePerItem: 30,
        totalRentalAmount: 30,
        securityDeposit: 50,
        issueTimestamp: subMins(57),
        status: 'active',
      },
      {
        id: 'RNT-2026-03',
        sessionId: 'SESS-2026-102',
        customerId: 'cust-102',
        customerName: 'Priya Sharma',
        equipmentId: 'eq-towel',
        equipmentName: 'Microfiber Quick-Dry Towel',
        size: 'Standard',
        quantity: 1,
        returnedQuantity: 0,
        pricePerItem: 40,
        totalRentalAmount: 40,
        securityDeposit: 50,
        issueTimestamp: subMins(57),
        status: 'active',
      },
    ],
    payments: [
      {
        id: 'TXN-2026-002',
        sessionId: 'SESS-2026-102',
        customerId: 'cust-102',
        customerName: 'Priya Sharma',
        amount: 100,
        method: 'phonepe',
        referenceNumber: 'PNT9871625411',
        timestamp: subMins(57),
        status: 'success',
        notes: 'Advance for swimming entry',
      },
    ],
  };

  // 3. Session 3: Expired session (12 minutes overtime!)
  const sess3: Session = {
    id: 'SESS-2026-103',
    type: 'individual',
    customerId: 'cust-105',
    customerName: 'Amitabh Verma',
    customerPhone: '+91 98860 33445',
    customerAge: 42,
    peopleCount: 2,
    packageId: 'pkg-30',
    packageName: 'Quick Splash (30 Mins)',
    durationMinutes: 30,
    entryTime: subMins(42),
    scheduledExitTime: subMins(12),
    status: 'expired',
    swimmingCharges: 100, // 2 people * 50
    extensionCharges: 0,
    rentalCharges: 0,
    totalCharges: 100,
    paidAmount: 50,
    outstandingBalance: 50,
    paymentStatus: 'partial',
    notes: 'Father & son swim. Overtime alert issued.',
    extensions: [],
    rentals: [],
    payments: [
      {
        id: 'TXN-2026-003',
        sessionId: 'SESS-2026-103',
        customerId: 'cust-105',
        customerName: 'Amitabh Verma',
        amount: 50,
        method: 'cash',
        referenceNumber: 'CASH-REC-103',
        timestamp: subMins(42),
        status: 'success',
        notes: 'Cash paid on counter',
      },
    ],
  };

  // 4. Session 4: Active Group Session (4 people, 40 mins remaining)
  const sess4: Session = {
    id: 'SESS-2026-104',
    type: 'group',
    customerId: 'cust-103',
    customerName: 'Rajesh & Friends',
    customerPhone: '+91 99002 44321',
    groupName: 'Techies Swim Squad',
    peopleCount: 4,
    packageId: 'pkg-60',
    packageName: 'Standard Swim (60 Mins)',
    durationMinutes: 60,
    entryTime: subMins(20),
    scheduledExitTime: addMins(40),
    status: 'active',
    swimmingCharges: 400, // 4 * 100
    extensionCharges: 0,
    rentalCharges: 120, // 4 goggles
    totalCharges: 520,
    paidAmount: 520,
    outstandingBalance: 0,
    paymentStatus: 'paid',
    notes: 'Corporate weekend pass discount applied',
    extensions: [],
    rentals: [
      {
        id: 'RNT-2026-04',
        sessionId: 'SESS-2026-104',
        customerId: 'cust-103',
        customerName: 'Rajesh Sharma',
        equipmentId: 'eq-goggles',
        equipmentName: 'Anti-Fog Swimming Goggles',
        size: 'Standard',
        quantity: 4,
        returnedQuantity: 0,
        pricePerItem: 30,
        totalRentalAmount: 120,
        securityDeposit: 200,
        issueTimestamp: subMins(20),
        status: 'active',
        notes: '4 pairs for the Techies Squad',
      },
    ],
    payments: [
      {
        id: 'TXN-2026-004',
        sessionId: 'SESS-2026-104',
        customerId: 'cust-103',
        customerName: 'Rajesh Sharma',
        amount: 520,
        method: 'paytm',
        referenceNumber: 'PAYTM-66718290',
        timestamp: subMins(20),
        status: 'success',
        notes: 'Full group payment via Paytm QR',
      },
    ],
  };

  // 5. Session 5: Completed session with extension history & returned rental
  const sess5: Session = {
    id: 'SESS-2026-105',
    type: 'individual',
    customerId: 'cust-106',
    customerName: 'Ananya Deshmukh',
    customerPhone: '+91 94480 66778',
    customerAge: 24,
    peopleCount: 1,
    packageId: 'pkg-60',
    packageName: 'Standard Swim (60 Mins)',
    durationMinutes: 90, // extended by 30 mins
    entryTime: subHours(3.5),
    scheduledExitTime: subHours(2),
    actualExitTime: subHours(2),
    status: 'completed',
    swimmingCharges: 100,
    extensionCharges: 50,
    rentalCharges: 50,
    totalCharges: 200,
    paidAmount: 200,
    outstandingBalance: 0,
    paymentStatus: 'paid',
    notes: 'Extended by 30 mins at desk',
    extensions: [
      {
        id: 'EXT-01',
        minutesAdded: 30,
        charge: 50,
        timestamp: subHours(2.5),
        notes: 'Added 30 minutes fitness extension',
      },
    ],
    rentals: [
      {
        id: 'RNT-2026-05',
        sessionId: 'SESS-2026-105',
        customerId: 'cust-106',
        customerName: 'Ananya Deshmukh',
        equipmentId: 'eq-costume-women',
        equipmentName: 'Swimming Costume (Women)',
        size: 'M',
        quantity: 1,
        returnedQuantity: 1,
        pricePerItem: 50,
        totalRentalAmount: 50,
        securityDeposit: 100,
        issueTimestamp: subHours(3.5),
        returnTimestamp: subHours(2),
        status: 'returned',
        notes: 'Costume returned in clean state',
      },
    ],
    payments: [
      {
        id: 'TXN-2026-005',
        sessionId: 'SESS-2026-105',
        customerId: 'cust-106',
        customerName: 'Ananya Deshmukh',
        amount: 150,
        method: 'gpay',
        referenceNumber: 'UPI/8871234091',
        timestamp: subHours(3.5),
        status: 'success',
        notes: 'Entry & costume rental',
      },
      {
        id: 'TXN-2026-006',
        sessionId: 'SESS-2026-105',
        customerId: 'cust-106',
        customerName: 'Ananya Deshmukh',
        amount: 50,
        method: 'cash',
        referenceNumber: 'CASH-REC-105',
        timestamp: subHours(2.5),
        status: 'success',
        notes: 'Cash payment for 30m extension',
      },
    ],
  };

  // 6. Session 6: Completed Group Session earlier today (6 members)
  const sess6: Session = {
    id: 'SESS-2026-106',
    type: 'group',
    customerId: 'cust-107',
    customerName: 'Karthik Raja',
    customerPhone: '+91 98440 99887',
    groupName: 'FinTech Titans Team',
    peopleCount: 6,
    packageId: 'pkg-90',
    packageName: 'Extended Fitness (90 Mins)',
    durationMinutes: 90,
    entryTime: subHours(5),
    scheduledExitTime: subHours(3.5),
    actualExitTime: subHours(3.5),
    status: 'completed',
    swimmingCharges: 900, // 6 * 150
    extensionCharges: 0,
    rentalCharges: 240, // towels & caps
    totalCharges: 1140,
    paidAmount: 1140,
    outstandingBalance: 0,
    paymentStatus: 'paid',
    notes: 'Team swimming outing',
    extensions: [],
    rentals: [
      {
        id: 'RNT-2026-06',
        sessionId: 'SESS-2026-106',
        customerId: 'cust-107',
        customerName: 'Karthik Raja',
        equipmentId: 'eq-towel',
        equipmentName: 'Microfiber Quick-Dry Towel',
        size: 'Large',
        quantity: 6,
        returnedQuantity: 6,
        pricePerItem: 40,
        totalRentalAmount: 240,
        securityDeposit: 300,
        issueTimestamp: subHours(5),
        returnTimestamp: subHours(3.5),
        status: 'returned',
        notes: 'All 6 towels returned safely',
      },
    ],
    payments: [
      {
        id: 'TXN-2026-007',
        sessionId: 'SESS-2026-106',
        customerId: 'cust-107',
        customerName: 'Karthik Raja',
        amount: 1140,
        method: 'other',
        referenceNumber: 'CORP-CARD-8812',
        timestamp: subHours(5),
        status: 'success',
        notes: 'Corporate Card payment',
      },
    ],
  };

  // 7. Session 7: Standalone active rental (e.g. locker/towel without session) or partial return demo
  const standaloneRental: RentalItem = {
    id: 'RNT-2026-07',
    customerId: 'cust-104',
    customerName: 'Sneha Sundaram',
    equipmentId: 'eq-towel',
    equipmentName: 'Microfiber Quick-Dry Towel',
    size: 'Standard',
    quantity: 3,
    returnedQuantity: 1, // PARTIALLY RETURNED
    pricePerItem: 40,
    totalRentalAmount: 120,
    securityDeposit: 150,
    issueTimestamp: subHours(2),
    status: 'partial_returned',
    notes: '1 returned, 2 still in use in sauna/changing area',
  };

  // 8. Completed Session 8 payment demo
  const sess8: Session = {
    id: 'SESS-2026-107',
    type: 'individual',
    customerId: 'cust-104',
    customerName: 'Sneha Sundaram',
    customerPhone: '+91 96111 77332',
    customerAge: 31,
    peopleCount: 1,
    packageId: 'pkg-60',
    packageName: 'Standard Swim (60 Mins)',
    durationMinutes: 60,
    entryTime: subHours(6),
    scheduledExitTime: subHours(5),
    actualExitTime: subHours(5.2),
    status: 'completed',
    swimmingCharges: 100,
    extensionCharges: 0,
    rentalCharges: 0,
    totalCharges: 100,
    paidAmount: 100,
    outstandingBalance: 0,
    paymentStatus: 'paid',
    extensions: [],
    rentals: [],
    payments: [
      {
        id: 'TXN-2026-008',
        sessionId: 'SESS-2026-107',
        customerId: 'cust-104',
        customerName: 'Sneha Sundaram',
        amount: 100,
        method: 'gpay',
        referenceNumber: 'UPI/4412998101',
        timestamp: subHours(6),
        status: 'success',
        notes: 'Initial swim entry',
      },
    ],
  };

  // Add historical completed sessions for past days of current month for rich monthly report
  const historicalSessions: Session[] = [];
  const historicalPayments: PaymentRecord[] = [];

  const pastNames = [
    { name: 'Arjun Nair', phone: '+91 98201 55441' },
    { name: 'Rohan Deshpande', phone: '+91 97112 33445' },
    { name: 'Divya Krishnan', phone: '+91 96118 77665' },
    { name: 'Sanjay Gupta', phone: '+91 98453 22119' },
    { name: 'Meera Nambiar', phone: '+91 99011 44556' },
    { name: 'Harish Babu', phone: '+91 97319 88776' },
    { name: 'Pooja Hegde', phone: '+91 98865 33221' },
    { name: 'Vijay Varma', phone: '+91 94481 22334' },
    { name: 'Sunita Rao', phone: '+91 98457 99001' },
    { name: 'Gautam Singhania', phone: '+91 98205 11228' },
  ];

  // Generate records for previous 7 days
  for (let day = 1; day <= 7; day++) {
    const isGroupDay = day % 2 === 0;
    const swimmerItem = pastNames[(day - 1) % pastNames.length];
    const peopleCount = isGroupDay ? 3 : 1;
    const swimCharge = isGroupDay ? 300 : 100;
    const rentalCharge = isGroupDay ? 90 : 30;
    const totalCharge = swimCharge + rentalCharge;
    const methodChoice = ['gpay', 'phonepe', 'cash', 'paytm', 'other'][day % 5] as PaymentRecord['method'];

    const sessId = `SESS-HIST-0${day}`;
    const txnId = `TXN-HIST-0${day}`;

    const pastSession: Session = {
      id: sessId,
      type: isGroupDay ? 'group' : 'individual',
      customerId: `cust-hist-${day}`,
      customerName: swimmerItem.name,
      customerPhone: swimmerItem.phone,
      groupName: isGroupDay ? `${swimmerItem.name.split(' ')[0]} Swimming Club` : undefined,
      peopleCount,
      packageId: 'pkg-60',
      packageName: 'Standard Swim (60 Mins)',
      durationMinutes: 60,
      entryTime: subDays(day, 2),
      scheduledExitTime: subDays(day, 1),
      actualExitTime: subDays(day, 1),
      status: 'completed',
      swimmingCharges: swimCharge,
      extensionCharges: 0,
      rentalCharges: rentalCharge,
      totalCharges: totalCharge,
      paidAmount: totalCharge,
      outstandingBalance: 0,
      paymentStatus: 'paid',
      notes: `Historical session day -${day}`,
      extensions: [],
      rentals: [
        {
          id: `RNT-HIST-0${day}`,
          sessionId: sessId,
          customerName: swimmerItem.name,
          equipmentId: 'eq-goggles',
          equipmentName: 'Anti-Fog Swimming Goggles',
          quantity: peopleCount,
          returnedQuantity: peopleCount,
          pricePerItem: 30,
          totalRentalAmount: rentalCharge,
          securityDeposit: 50 * peopleCount,
          issueTimestamp: subDays(day, 2),
          returnTimestamp: subDays(day, 1),
          status: 'returned',
        },
      ],
      payments: [
        {
          id: txnId,
          sessionId: sessId,
          customerId: `cust-hist-${day}`,
          customerName: swimmerItem.name,
          amount: totalCharge,
          method: methodChoice,
          referenceNumber: `REF-HIST-${day}`,
          timestamp: subDays(day, 2),
          status: 'success',
          notes: 'Settled in full',
        },
      ],
    };

    historicalSessions.push(pastSession);
    historicalPayments.push(...pastSession.payments);
  }

  const allSessions: Session[] = [sess1, sess2, sess3, sess4, sess5, sess6, sess8, ...historicalSessions];

  // Flatten all payments
  const allPayments: PaymentRecord[] = [
    ...sess1.payments,
    ...sess2.payments,
    ...sess3.payments,
    ...sess4.payments,
    ...sess5.payments,
    ...sess6.payments,
    ...sess8.payments,
    ...historicalPayments,
  ];

  // Flatten all rentals plus standalone rental
  const allRentals: RentalItem[] = [
    ...sess1.rentals,
    ...sess2.rentals,
    ...sess4.rentals,
    ...sess5.rentals,
    ...sess6.rentals,
    standaloneRental,
    ...historicalSessions.flatMap((s) => s.rentals),
  ];

  return {
    sessions: allSessions,
    payments: allPayments,
    rentals: allRentals,
  };
}

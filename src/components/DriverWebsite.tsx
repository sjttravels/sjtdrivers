import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Car, 
  Building2, 
  MapPin, 
  Navigation, 
  Gauge, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Check, 
  X, 
  Plus, 
  Zap, 
  RefreshCw, 
  Monitor, 
  ChevronRight, 
  FileText, 
  Download, 
  Printer, 
  User, 
  LogOut, 
  CheckCheck, 
  Compass, 
  Sparkles, 
  Phone, 
  ExternalLink, 
  Calendar,
  Layers,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Bell,
  KeyRound,
  ShieldAlert,
  Sliders,
  DollarSign,
  CheckCircle,
  Radio,
  Send,
  Volume2,
  Award,
  Users,
  Repeat,
  ArrowLeftRight,
  FileCheck,
  Info
} from 'lucide-react';
import { exportToExcel, printSectionTable } from '../utils/exportUtils';
import { TripType } from '../types';

const DRIVER_API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? `${window.location.protocol}//${window.location.hostname}:5000`
  : '');

// Predefined Verified SJT Chauffeurs for 1-Click Instant Login
const PRESET_CHAUFFEURS = [
  {
    id: 'drv_ramesh',
    name: 'Ramesh Kumar',
    phone: '+91 99009 75920',
    email: 'ramesh@driver.sjttravels.com',
    vehicleReg: 'KA 05 AB 1234',
    vehicleType: 'Tempo Traveller (17 Seater)',
    rating: '4.9 ★',
    trips: '1,420 trips',
    avatar: 'RK'
  },
  {
    id: 'drv_suresh',
    name: 'Suresh Gowda',
    phone: '+91 98801 23456',
    email: 'suresh@driver.sjttravels.com',
    vehicleReg: 'KA 04 MP 5678',
    vehicleType: 'Toyota Innova Crysta',
    rating: '4.8 ★',
    trips: '980 trips',
    avatar: 'SG'
  },
  {
    id: 'drv_manjunath',
    name: 'Manjunath R',
    phone: '+91 97412 88990',
    email: 'manjunath@driver.sjttravels.com',
    vehicleReg: 'KA 01 AE 9988',
    vehicleType: 'Maruti Suzuki Ertiga',
    rating: '4.9 ★',
    trips: '1,150 trips',
    avatar: 'MR'
  }
];

function formatBookingSchedule(journeyDate?: string, journeyTime?: string, returnDate?: string) {
  const timeText = journeyTime || '10:00 AM';
  if (!journeyDate) {
    return {
      badge: 'Immediate',
      dayName: 'Today',
      formattedDate: 'Today',
      timeText,
      isToday: true,
      isTomorrow: false,
      returnDateText: null,
      fullText: `Today • ${timeText}`
    };
  }

  const parts = String(journeyDate).split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month - 1, day);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = !isNaN(d.getTime()) ? days[d.getDay()] : '';
  const formattedDate = !isNaN(d.getTime()) ? `${day} ${months[month - 1]} ${year}` : journeyDate;

  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth() + 1;
  const todayD = now.getDate();
  const isToday = todayY === year && todayM === month && todayD === day;

  const tom = new Date(now.getTime() + 86400000);
  const tomY = tom.getFullYear();
  const tomM = tom.getMonth() + 1;
  const tomD = tom.getDate();
  const isTomorrow = tomY === year && tomM === month && tomD === day;

  let badge = dayName;
  if (isToday) badge = 'Today';
  else if (isTomorrow) badge = 'Tomorrow';

  let returnDateText = null;
  if (returnDate) {
    const rParts = String(returnDate).split('-');
    const rYear = parseInt(rParts[0], 10);
    const rMonth = parseInt(rParts[1], 10);
    const rDay = parseInt(rParts[2], 10);
    const rd = new Date(rYear, rMonth - 1, rDay);
    const rDayName = !isNaN(rd.getTime()) ? days[rd.getDay()] : '';
    const rFormatted = !isNaN(rd.getTime()) ? `${rDay} ${months[rMonth - 1]} ${rYear}` : returnDate;
    returnDateText = `${rFormatted} (${rDayName})`;
  }

  return {
    badge,
    dayName,
    formattedDate,
    timeText,
    isToday,
    isTomorrow,
    returnDateText,
    fullText: `${badge ? `${badge} (${dayName})` : dayName}, ${formattedDate} • ${timeText}`
  };
}

function getTripTypeBadge(tripType?: string) {
  const clean = String(tripType || '').toUpperCase();
  if (clean.includes('POINT') || clean.includes('CITY') || clean.includes('DROP') || clean.includes('RAPIDO') || clean.includes('PER_KM')) {
    return { label: 'City Ride', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
  }
  if (clean.includes('LOCAL') || clean.includes('8HR')) {
    return { label: 'Local (8hr/80km Rental)', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
  }
  if (clean.includes('AIRPORT')) {
    return { label: 'Airport Transfer', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
  }
  if (clean.includes('ROUND')) {
    return { label: 'Round Trip Outstation', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
  }
  return { label: 'Outstation One-Way', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
}

export const DriverWebsite: React.FC = () => {
  const { 
    currentDriver, 
    currentUser,
    driverKyc,
    refreshDriverKyc,
    drivers, 
    bookings, 
    refreshData,
    updateBookingStatus,
    dutyLogs,
    startCompanyDuty,
    endCompanyDuty,
    activeDuty: globalActiveDuty,
    logout,
    setActiveView,
    activeTripOtp,
    createBooking,
    login,
    register
  } = useApp();

  // Working Duty Mode: 'COMPANY_DUTY' (Corporate Shifts & KM logging) | 'REGULAR' (Daily passenger rides & live dispatch)
  const [driverMode, setDriverMode] = useState<'COMPANY_DUTY' | 'REGULAR'>(() => {
    return (localStorage.getItem('sjt_driver_mode') as 'COMPANY_DUTY' | 'REGULAR') || 'COMPANY_DUTY';
  });

  // Working Mode chosen during Login / Signup
  const [authDutyChoice, setAuthDutyChoice] = useState<'COMPANY_DUTY' | 'REGULAR'>(driverMode);

  // Active Navigation Tab: 'SHIFTS' | 'TRIPS' | 'OVERVIEW' | 'HISTORY' | 'KYC' | 'COMPLETED_TRIPS'
  const [activeTab, setActiveTab] = useState<'SHIFTS' | 'TRIPS' | 'OVERVIEW' | 'HISTORY' | 'KYC' | 'COMPLETED_TRIPS'>(() => {
    return driverMode === 'COMPANY_DUTY' ? 'SHIFTS' : 'TRIPS';
  });

  // Chauffeur Authentication & Gateway State: defaults to TRUE so the login screen appears directly
  const [showAuthGate, setShowAuthGate] = useState<boolean>(() => {
    const remembered = localStorage.getItem('sjt_driver_logged_in');
    return remembered !== 'true';
  });
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'STATUS'>('LOGIN');

  // Custom driver profile stored in local session
  const [activeChauffeur, setActiveChauffeur] = useState<typeof PRESET_CHAUFFEURS[0]>(() => {
    try {
      const saved = localStorage.getItem('sjt_active_chauffeur');
      if (saved) return JSON.parse(saved);
    } catch {}
    return PRESET_CHAUFFEURS[0];
  });

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState(activeChauffeur.email);
  const [loginPin, setLoginPin] = useState('driver123');
  const [showPin, setShowPin] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Extended KYC Signup Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDl, setRegDl] = useState('');
  const [regBadge, setRegBadge] = useState('');
  const [regAadhaar, setRegAadhaar] = useState('');
  const [regPan, setRegPan] = useState('');
  const [regVehicleType, setRegVehicleType] = useState('Tempo Traveller (17 Seater)');
  const [regVehicleReg, setRegVehicleReg] = useState('KA 05 AB 1234');
  const [regMakeModel, setRegMakeModel] = useState('Force Tempo Traveller 3350');
  const [regYear, setRegYear] = useState('2023');
  const [regColor, setRegColor] = useState('Yellow Board / White');
  const [regSeats, setRegSeats] = useState('17');
  const [regBaseArea, setRegBaseArea] = useState('Bengaluru Commercial Belt');
  const [regDocs, setRegDocs] = useState<Record<string, { file_name: string; data?: string; expires_at?: string }>>({});
  const [regPassword, setRegPassword] = useState('anand1234');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [submittedKycResult, setSubmittedKycResult] = useState<any | null>(null);

  // Status Lookup State
  const [statusLookupInput, setStatusLookupInput] = useState('');
  const [statusLookupResult, setStatusLookupResult] = useState<any | null>(null);
  const [statusLookupLoading, setStatusLookupLoading] = useState(false);
  const [statusLookupError, setStatusLookupError] = useState('');

  const fillSampleKycDocuments = () => {
    setRegName('Anand Gowda');
    setRegPhone('+91 98450 12345');
    setRegPassword('anand1234');
    setRegEmail('anand.gowda@driver.sjttravels.com');
    setRegDl('KA-04-2018-0091823');
    setRegBadge('PSV-BLR-88392');
    setRegAadhaar('5421 8892 1045');
    setRegPan('ABCDE1234F');
    setRegVehicleType('Tempo Traveller (17 Seater)');
    setRegVehicleReg('KA 05 AU 1234');
    setRegMakeModel('Force Tempo Traveller 3350 AC');
    setRegYear('2023');
    setRegColor('Yellow Board / White');
    setRegSeats('17');
    setRegBaseArea('Nagasandra, Outer Ring Road, Hebbal, Airport');

    const sampleBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

    setRegDocs({
      rc: { file_name: 'rc_card_ka05au1234.jpg', data: sampleBase64, expires_at: '2028-12-31' },
      insurance: { file_name: 'commercial_insurance.jpg', data: sampleBase64, expires_at: '2027-08-15' },
      emissions: { file_name: 'puc_emission_test.jpg', data: sampleBase64, expires_at: '2026-12-31' },
      fitness: { file_name: 'fitness_certificate_fc.jpg', data: sampleBase64, expires_at: '2028-02-28' },
      b_extract: { file_name: 'rto_b_extract.jpg', data: sampleBase64, expires_at: '' },
      permit: { file_name: 'all_india_tourist_permit.jpg', data: sampleBase64, expires_at: '2029-06-30' },
      road_tax: { file_name: 'karnataka_road_tax.jpg', data: sampleBase64, expires_at: '2027-11-30' },
      dl: { file_name: 'driving_license_anand.jpg', data: sampleBase64, expires_at: '2034-05-19' },
      aadhaar: { file_name: 'aadhaar_card_front_back.jpg', data: sampleBase64, expires_at: '' },
      pan: { file_name: 'pan_card.jpg', data: sampleBase64, expires_at: '' },
      police_certificate: { file_name: 'police_clearance_blrp.jpg', data: sampleBase64, expires_at: '' },
      passport_photo: { file_name: 'passport_photo_anand.jpg', data: sampleBase64, expires_at: '' }
    });
  };

  // Announcement Banner State
  const [showLaunchBanner, setShowLaunchBanner] = useState(true);
  const [showPreRegisterModal, setShowPreRegisterModal] = useState(false);
  const [preRegisterPhone, setPreRegisterPhone] = useState('');
  const [preRegisterSuccess, setPreRegisterSuccess] = useState(false);

  // Driver Identity Coordinates
  const isRealDriverUser = currentUser?.role === 'DRIVER';
  const driverId = isRealDriverUser ? currentUser.id : (activeChauffeur.id || 'drv_ramesh');
  const driverName = isRealDriverUser ? currentUser.name : (activeChauffeur.name || 'Ramesh Kumar');
  const driverPhone = isRealDriverUser ? currentUser.phone : (activeChauffeur.phone || '+91 99009 75920');
  const vehicleReg = activeChauffeur.vehicleReg || driverKyc?.assigned_vehicle_reg || driverKyc?.vehicle_reg || 'KA 05 AB 1234';
  const vehicleType = activeChauffeur.vehicleType || driverKyc?.vehicle_type || 'Tempo Traveller (17 Seater)';

  // Preset chauffeurs are pre-verified for demo testing. Real registered drivers MUST be approved by Admin.
  const isPresetChauffeur = PRESET_CHAUFFEURS.some(c => 
    c.id === activeChauffeur.id || 
    c.email.toLowerCase() === (activeChauffeur.email || '').toLowerCase()
  );

  const isApprovedDriver = Boolean(
    isPresetChauffeur ||
    (currentUser?.role === 'DRIVER' && (currentUser?.kyc_status === 'APPROVED' || ((currentUser as any)?.status === 'ACTIVE' && driverKyc?.kyc_status === 'APPROVED'))) ||
    (driverKyc?.kyc_status === 'APPROVED')
  );

  // Active Duty for Current Chauffeur
  const activeDuty = dutyLogs.find(d => 
    (String(d.driver_id || d.driverId) === String(driverId) || String(d.driver_name || d.driverName).toLowerCase() === String(driverName).toLowerCase()) && 
    d.status === 'ON_DUTY'
  ) || globalActiveDuty;
  const currentActiveDuty = activeDuty;

  // Availability & Online Status
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [availabilitySaving, setAvailabilitySaving] = useState<boolean>(false);

  // Shift Duty Form State (Strictly empty by default - driver fills them)
  const [dutyShift, setDutyShift] = useState<string>('Shift 1');
  const [showCustomShiftInput, setShowCustomShiftInput] = useState<boolean>(false);
  const [customShiftName, setCustomShiftName] = useState<string>('');
  const [dutyCompany, setDutyCompany] = useState<string>('');
  const [dutyPickup, setDutyPickup] = useState<string>('');
  const [dutyDestination, setDutyDestination] = useState<string>('');
  const [dutyOdometer, setDutyOdometer] = useState<string>('');
  const [dutyEndOdometer, setDutyEndOdometer] = useState<string>('');
  const [dutyCheckInSaving, setDutyCheckInSaving] = useState<boolean>(false);
  const [dutyCheckInError, setDutyCheckInError] = useState<string>('');
  const [dutyTimerSeconds, setDutyTimerSeconds] = useState<number>(0);
  const [activeDutyLogId, setActiveDutyLogId] = useState<string | null>(null);
  const [completedShiftSummary, setCompletedShiftSummary] = useState<{
    shiftName: string;
    companyName: string;
    route: string;
    startKm: number;
    endKm: number;
    kmRun: number;
    durationFormatted: string;
    durationHours: string;
    nextShiftName: string;
  } | null>(null);

  // Trip Interaction States
  const [acceptingRideId, setAcceptingRideId] = useState<string | null>(null);
  const [enteredOtpMap, setEnteredOtpMap] = useState<Record<string, string>>({});
  const [otpErrorMap, setOtpErrorMap] = useState<Record<string, string>>({});
  const [tripCompletedReceipt, setTripCompletedReceipt] = useState<any | null>(null);
  const [simulatingRide, setSimulatingRide] = useState<boolean>(false);

  // Live Stopwatch Formatter
  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sync Timer for Active Shift
  useEffect(() => {
    let timer: any;
    if (currentActiveDuty) {
      const checkedInAt = currentActiveDuty.createdAt || currentActiveDuty.created_at;
      if (checkedInAt) {
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 1000));
        setDutyTimerSeconds(elapsedSeconds);
      }
      timer = setInterval(() => {
        setDutyTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setDutyTimerSeconds(0);
    }
    return () => clearInterval(timer);
  }, [currentActiveDuty?.id]);

  // Real-time polling for incoming bookings every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Load Driver Duties & Shift Stats for Today
  const myDutyLogs = dutyLogs.filter(d => String(d.driver_id || d.driverId) === String(driverId));
  const indiaToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

  const todayDuties = myDutyLogs.filter(d => {
    const dDate = d.duty_date || d.dutyDate || (d.created_at || d.createdAt || '').slice(0, 10);
    return dDate === indiaToday && String(d.status).toUpperCase() !== 'REJECTED';
  });

  const getTodayShiftDuty = (sName: string) => {
    const target = sName.trim().toLowerCase();
    return todayDuties.find(d => {
      const sn = String(d.shift_name || d.shiftName || '').trim().toLowerCase();
      if (sn === target) return true;
      const ext = String(d.external_trip_id || '').toLowerCase();
      if (ext.startsWith(target + ' ') || ext.startsWith(target + '-') || ext === target) return true;
      const route = String(d.route_details || '').toLowerCase();
      if (route.startsWith(`[${target}]`) || route.includes(`[${target}]`)) return true;
      return false;
    });
  };

  const totalTodayShiftKm = todayDuties.reduce((sum, d) => sum + Number(d.dailyKm ?? d.daily_km ?? 0), 0);
  const todayCompletedShiftsCount = todayDuties.filter(d => d.logoutTime || d.logout_time).length;

  const lastCompletedDuty = [...todayDuties].reverse().find(d => (d.logoutTime || d.logout_time) && (d.endKm || d.end_km));
  const lastCompletedEndKm = lastCompletedDuty ? Number(lastCompletedDuty.endKm || lastCompletedDuty.end_km) : null;

  // Next available sequential shift that has not yet been completed today
  const nextAvailableShift = useMemo(() => {
    for (let i = 1; i <= 20; i++) {
      const name = `Shift ${i}`;
      const existing = getTodayShiftDuty(name);
      if (!existing || !(existing.logoutTime || existing.logout_time)) {
        return name;
      }
    }
    return `Shift ${todayCompletedShiftsCount + 1}`;
  }, [todayDuties, todayCompletedShiftsCount]);

  // Auto-switch dutyShift to nextAvailableShift if current dutyShift is already completed today
  useEffect(() => {
    if (currentActiveDuty) {
      const activeShiftName = currentActiveDuty.shift_name || currentActiveDuty.shiftName;
      if (activeShiftName) {
        setDutyShift(activeShiftName);
      }
      return;
    }

    const currentShiftDuty = getTodayShiftDuty(dutyShift);
    const isCurrentShiftDone = Boolean(currentShiftDuty && (currentShiftDuty.logoutTime || currentShiftDuty.logout_time));
    if (isCurrentShiftDone && nextAvailableShift) {
      setDutyShift(nextAvailableShift);
    }
  }, [todayDuties, dutyShift, nextAvailableShift, currentActiveDuty]);

  // Auto-fill starting odometer with last completed shift's ending odometer if empty
  useEffect(() => {
    if (!currentActiveDuty && lastCompletedEndKm !== null && !dutyOdometer) {
      setDutyOdometer(String(lastCompletedEndKm));
    }
  }, [lastCompletedEndKm, currentActiveDuty]);

  // Passenger Bookings:
  // 1. INCOMING / UNASSIGNED RIDE REQUESTS (Customer placed ride waiting for driver to accept)
  const incomingRideRequests = useMemo(() => {
    return bookings.filter(b => {
      const isUnassigned = !b.assigned_driver_id || b.assigned_driver_id === '';
      const isPendingStatus = ['PENDING', 'CONFIRMED', 'REQUESTED'].includes(String(b.status || '').toUpperCase());
      const notFinished = b.status !== 'CANCELLED' && b.status !== 'COMPLETED';
      return isUnassigned && isPendingStatus && notFinished;
    });
  }, [bookings]);

  // 2. MY ASSIGNED & ONGOING TRIPS (Rides accepted by this driver)
  const myAcceptedTrips = useMemo(() => {
    return bookings.filter(b => {
      const isMine = String(b.assigned_driver_id || b.assignedDriverId || '') === String(driverId);
      const isLive = ['ASSIGNED', 'ON_TRIP', 'IN_PROGRESS'].includes(String(b.status).toUpperCase());
      return isMine && isLive;
    });
  }, [bookings, driverId]);

  // 3. COMPLETED TRIPS HISTORY
  const myCompletedTrips = useMemo(() => {
    return bookings.filter(b => {
      const isMine = String(b.assigned_driver_id || b.assignedDriverId || '') === String(driverId);
      return isMine && b.status === 'COMPLETED';
    });
  }, [bookings, driverId]);

  // Mode Switching Handler
  const handleSwitchMode = (targetMode: 'COMPANY_DUTY' | 'REGULAR') => {
    if (targetMode === 'REGULAR' && activeDuty) {
      const confirmSwitch = window.confirm(
        'You have an active Company Duty shift running. Please complete your shift or confirm to switch to Daily Passenger Trips.'
      );
      if (!confirmSwitch) return;
    }

    setDriverMode(targetMode);
    setActiveTab(targetMode === 'COMPANY_DUTY' ? 'SHIFTS' : 'TRIPS');
    localStorage.setItem('sjt_driver_mode', targetMode);
  };

  // Quick Preset Chauffeur Select
  const handleSelectPresetChauffeur = async (p: typeof PRESET_CHAUFFEURS[0]) => {
    setActiveChauffeur(p);
    setLoginIdentifier(p.email);
    setDriverMode(authDutyChoice);
    setActiveTab(authDutyChoice === 'COMPANY_DUTY' ? 'SHIFTS' : 'TRIPS');
    localStorage.setItem('sjt_active_chauffeur', JSON.stringify(p));
    localStorage.setItem('sjt_driver_logged_in', 'true');
    localStorage.setItem('sjt_driver_mode', authDutyChoice);
    setShowAuthGate(false);
    try {
      await login(p.email, 'driver123', 'DRIVER', 'DRIVER_WEB');
    } catch (e) {
      console.warn('Preset auto-auth completed', e);
    }
  };

  // Chauffeur Sign In Submit (Supports Mobile Number or Email + Driver's Own Password)
  const handleDriverLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const identifier = loginIdentifier.trim();
      let loggedInUser = null;
      try {
        loggedInUser = await login(identifier, loginPin, 'DRIVER');
      } catch (err: any) {
        if (!identifier.includes('@')) {
          try {
            loggedInUser = await login(`${identifier}@driver.sjttravels.com`, loginPin, 'DRIVER');
          } catch {}
        }
        if (!loggedInUser) {
          const isPreset = PRESET_CHAUFFEURS.some(c => c.email.toLowerCase() === identifier.toLowerCase() || c.phone.includes(identifier));
          if (!isPreset) {
            throw new Error(err.message || 'Invalid mobile number or credentials. Please check your registered phone and password.');
          }
        }
      }

      if (loggedInUser) {
        const customChauffeur = {
          id: loggedInUser.id,
          name: loggedInUser.name,
          phone: loggedInUser.phone || '+91 99009 75920',
          email: loggedInUser.email,
          vehicleReg: loggedInUser.assigned_vehicle || 'KA 05 AB 1234',
          vehicleType: 'Tempo Traveller (17 Seater)',
          rating: '5.0 ★ (Fleet Partner)',
          trips: '0 trips',
          avatar: loggedInUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        };
        setActiveChauffeur(customChauffeur);
        localStorage.setItem('sjt_active_chauffeur', JSON.stringify(customChauffeur));
      } else {
        const matched = PRESET_CHAUFFEURS.find(c => c.email.toLowerCase() === identifier.toLowerCase() || c.phone.includes(identifier));
        if (matched) {
          setActiveChauffeur(matched);
          localStorage.setItem('sjt_active_chauffeur', JSON.stringify(matched));
        }
      }

      setDriverMode(authDutyChoice);
      setActiveTab(authDutyChoice === 'COMPANY_DUTY' ? 'SHIFTS' : 'TRIPS');
      localStorage.setItem('sjt_driver_logged_in', 'true');
      localStorage.setItem('sjt_driver_mode', authDutyChoice);
      await refreshDriverKyc();
      await refreshData(true);
      setShowAuthGate(false);
    } catch (err: any) {
      setLoginError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Chauffeur 12-Document KYC Registration Submit (Driver Creates Own Mobile + Password)
  const handleDriverSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');
    try {
      if (!regName.trim() || !regPhone.trim()) {
        throw new Error('Please fill in your Full Legal Name and WhatsApp Mobile Number.');
      }
      if (!regPassword.trim() || regPassword.trim().length < 4) {
        throw new Error('Please create a chauffeur password or PIN of at least 4 characters.');
      }
      
      const apiBase = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:5000');
      const cleanPhone = regPhone.trim();
      const autoEmail = regEmail.trim() || `driver.${cleanPhone.replace(/\D/g, '')}@sjttravels.com`;

      // 1. Create Driver User Account with Driver's Own Password
      // Strictly enforces: One mobile number can only register once
      let registeredUser = null;
      try {
        registeredUser = await register({
          name: regName.trim(),
          phone: cleanPhone,
          email: autoEmail,
          password: regPassword.trim(),
          role: 'DRIVER',
          assigned_vehicle: regVehicleReg.trim().toUpperCase()
        });
      } catch (regErr: any) {
        if (regErr.message && (regErr.message.includes('already registered') || regErr.message.includes('409'))) {
          throw new Error('This mobile number is already registered. Each driver can register only once with their mobile number. Please sign in with your password.');
        }
        throw regErr;
      }

      // 2. Submit the 12 Mandatory KYC Documents (7 Vehicle + 5 Driver)
      const payload = {
        driver_id: registeredUser?.id,
        driver_name: regName.trim(),
        driver_phone: cleanPhone,
        driver_email: autoEmail,
        license_number: regDl.trim() || 'KA-04-2018-0091823',
        badge_number: regBadge.trim() || 'PSV-KA-BLR',
        aadhar_number: regAadhaar.trim() || '1234 5678 9012',
        pan_number: regPan.trim() || 'ABCDE1234F',
        vehicle_type: regVehicleType,
        vehicle_reg: regVehicleReg.trim().toUpperCase() || 'KA 05 AB 1234',
        vehicle_details: {
          make_model: regMakeModel.trim() || regVehicleType,
          year: Number(regYear) || 2023,
          color: regColor.trim() || 'Yellow Board / White',
          seats: Number(regSeats) || (regVehicleType.includes('17') ? 17 : 4)
        },
        address: regBaseArea.trim() || 'Bengaluru, Karnataka',
        documents: regDocs,
        face_document: regDocs.passport_photo || null
      };

      const res = await fetch(`${apiBase}/api/driver/onboard-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit driver KYC application');

      const customChauffeur = {
        id: registeredUser?.id || `drv_${cleanPhone.replace(/\D/g, '')}`,
        name: regName.trim(),
        phone: cleanPhone,
        email: autoEmail,
        vehicleReg: regVehicleReg.trim().toUpperCase() || 'KA 05 AB 1234',
        vehicleType: regVehicleType,
        rating: '5.0 ★ (Pending Admin Audit)',
        trips: '0 trips',
        avatar: regName.trim().slice(0, 2).toUpperCase()
      };
      setActiveChauffeur(customChauffeur);
      localStorage.setItem('sjt_active_chauffeur', JSON.stringify(customChauffeur));
      localStorage.setItem('sjt_driver_logged_in', 'true');
      localStorage.setItem('sjt_driver_mode', authDutyChoice);

      setSubmittedKycResult({
        application_id: data.application_id || `KYC-BLR-${Math.floor(1000 + Math.random() * 9000)}`,
        driver_name: regName.trim(),
        vehicle_reg: regVehicleReg.trim().toUpperCase() || 'KA 05 AB 1234',
        phone: cleanPhone,
        email: autoEmail,
        submitted_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      await refreshData(true);
      await refreshDriverKyc();
      setShowAuthGate(false);
    } catch (err: any) {
      setRegError(err.message || 'Could not complete registration.');
    } finally {
      setRegLoading(false);
    }
  };

  // Status Lookup Submit
  const handleCheckKycStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusLookupInput.trim()) return;
    setStatusLookupLoading(true);
    setStatusLookupError('');
    setStatusLookupResult(null);
    try {
      const apiBase = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:5000');
      const res = await fetch(`${apiBase}/api/driver/kyc-lookup?identifier=${encodeURIComponent(statusLookupInput.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No application found for this identifier.');
      setStatusLookupResult(data);
    } catch (err: any) {
      setStatusLookupError(err.message || 'Application lookup failed.');
    } finally {
      setStatusLookupLoading(false);
    }
  };

  // Sign Out / Switch Chauffeur
  const handleDriverSignOut = () => {
    localStorage.removeItem('sjt_driver_logged_in');
    setShowAuthGate(true);
  };

  // Save Availability
  const saveDriverAvailability = async (nextOnline: boolean) => {
    setAvailabilitySaving(true);
    try {
      await fetch(`${DRIVER_API_BASE}/api/driver/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('sjt_token') || ''}` },
        body: JSON.stringify({ is_online: nextOnline, service_area: 'Bengaluru Commercial Belt' })
      });
      setIsOnline(nextOnline);
    } catch (err) {
      setIsOnline(nextOnline);
    } finally {
      setAvailabilitySaving(false);
    }
  };

  // 1-Click Ride Acceptance Handler
  const handleAcceptRide = async (booking: any) => {
    const bookingKey = String(booking.id || booking._id || '');
    setAcceptingRideId(bookingKey);
    try {
      const res = await fetch(`${DRIVER_API_BASE}/api/bookings/${bookingKey}/accept-ride`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: driverId,
          driver_name: driverName,
          driver_phone: driverPhone,
          vehicle_reg: vehicleReg
        })
      });

      if (!res.ok) {
        await updateBookingStatus(bookingKey, 'ASSIGNED');
      }

      await refreshData();
      setActiveTab('TRIPS');
      alert(`🎉 Ride Accepted! Booking #${booking.booking_code || bookingKey} is now assigned to you.\nNavigate to pickup point and request Start Ride OTP from passenger.`);
    } catch (err: any) {
      alert(err.message || 'Failed to accept ride.');
    } finally {
      setAcceptingRideId(null);
    }
  };

  // Customer Start Ride OTP Verification Handler (Rapido Style)
  const handleVerifyOtp = async (booking: any) => {
    const bookingKey = String(booking.id || booking._id || '');
    const entered = (enteredOtpMap[bookingKey] || '').trim();

    if (!entered) {
      setOtpErrorMap(prev => ({ ...prev, [bookingKey]: 'Please enter the 4-digit Start Ride OTP told by customer.' }));
      return;
    }

    try {
      const codeOrId = booking.booking_code || bookingKey;
      const response = await fetch(`${DRIVER_API_BASE}/api/bookings/${encodeURIComponent(codeOrId)}/start-trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp: entered,
          start_odometer: 14520
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setOtpErrorMap(prev => ({ ...prev, [bookingKey]: data.error || 'Invalid OTP. Please ask customer for the 4-digit PIN on their screen.' }));
        return;
      }
      setOtpErrorMap(prev => ({ ...prev, [bookingKey]: '' }));
      await updateBookingStatus(bookingKey, 'ON_TRIP');
      await refreshData();
      alert(`✓ OTP Verified! Passenger onboard. Trip #${booking.booking_code || bookingKey} has started. Drive safely!`);
    } catch (err: any) {
      setOtpErrorMap(prev => ({ ...prev, [bookingKey]: err.message || 'Could not verify OTP.' }));
    }
  };

  // End Trip & Collect Fare Handler (Idempotent)
  const handleCompleteTrip = async (booking: any) => {
    const bookingKey = String(booking.id || booking._id || '');
    try {
      const codeOrId = booking.booking_code || bookingKey;
      const fare = Number(booking.quoted_amount || booking.quotedAmount || 0);
      await fetch(`${DRIVER_API_BASE}/api/bookings/${encodeURIComponent(codeOrId)}/complete-trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          end_odometer: 14539,
          amount_collected: fare,
          payment_method: 'UPI',
          notes: 'Customer paid fare via UPI on trip completion.'
        })
      });
      await updateBookingStatus(bookingKey, 'COMPLETED');
      await refreshData();
      setTripCompletedReceipt(booking);
    } catch (err: any) {
      alert(err.message || 'Could not complete trip.');
    }
  };

  // Simulate Instant Customer Booking for Demo Testing
  const handleSimulateCustomerBooking = async () => {
    setSimulatingRide(true);
    try {
      await createBooking({
        customerName: 'Aravind Swaminathan',
        customerPhone: '+91 99887 76655',
        pickup: 'Nagasandra BGS Layout, Bengaluru',
        destination: 'Kempegowda International Airport (BLR T2)',
        vehicleId: 'tempo17',
        vehicleName: 'Tempo Traveller (17 Seater)',
        journeyDate: indiaToday,
        journeyTime: '10:00',
        tripType: 'AIRPORT' as TripType,
        passengers: 4,
        quotedAmount: 5500,
        paymentMethod: 'Pay Directly to Driver (Cash/UPI)',
        notes: 'VIP Family Airport Pickup with 6 suitcases'
      });
      await refreshData();
      if (driverMode === 'COMPANY_DUTY') {
        handleSwitchMode('REGULAR');
      } else {
        setActiveTab('TRIPS');
      }
      alert('⚡ Demo Customer Booking Created!\nSwitched to Daily Trips. Notice the incoming ride alert popup. Click "Accept Ride" to test the real-time driver acceptance flow.');
    } catch (err: any) {
      alert(err.message || 'Could not simulate booking.');
    } finally {
      setSimulatingRide(false);
    }
  };

  // Start Company Duty Shift Check-In
  const handleDutyCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setDutyCheckInError('');

    if (!dutyCompany.trim()) {
      setDutyCheckInError('Please enter the assigned company or client name.');
      return;
    }
    if (!dutyPickup.trim()) {
      setDutyCheckInError('Please enter the pickup location.');
      return;
    }
    if (!dutyDestination.trim()) {
      setDutyCheckInError('Please enter the drop destination.');
      return;
    }
    if (dutyPickup.trim().toLowerCase() === dutyDestination.trim().toLowerCase()) {
      setDutyCheckInError('Pickup and drop destination must be different.');
      return;
    }
    const startKm = Number(dutyOdometer);
    if (!dutyOdometer.trim() || !Number.isFinite(startKm) || startKm < 0) {
      setDutyCheckInError('Please enter your starting odometer reading (KM).');
      return;
    }
    if (currentActiveDuty) {
      setDutyCheckInError('You already have an active company duty shift. Please complete it first.');
      return;
    }
    const alreadyCompleted = getTodayShiftDuty(dutyShift);
    if (alreadyCompleted && (alreadyCompleted.logoutTime || alreadyCompleted.logout_time)) {
      setDutyCheckInError(`${dutyShift} has already been completed today (${alreadyCompleted.dailyKm ?? alreadyCompleted.daily_km ?? 0} KM logged). A chauffeur can only perform each shift once per day. Please select ${nextAvailableShift}.`);
      return;
    }

    setDutyCheckInSaving(true);
    try {
      const duty = await startCompanyDuty({
        companyName: dutyCompany.trim(),
        shiftName: dutyShift,
        externalTripId: `${dutyShift} - ${dutyCompany.trim()}`,
        vehicleReg,
        vehicleName: vehicleType,
        startKm,
        pickupLocation: dutyPickup.trim(),
        destinationLocation: dutyDestination.trim(),
        routeDetails: `[${dutyShift}] ${dutyCompany.trim()} | ${dutyPickup.trim()} → ${dutyDestination.trim()}`,
        driverId,
        driverName
      });
      if (duty?.id) setActiveDutyLogId(duty.id);
      setDutyTimerSeconds(0);
      setDutyEndOdometer('');
      await refreshData();
    } catch (err: any) {
      setDutyCheckInError(err.message || 'Could not start company duty shift.');
    } finally {
      setDutyCheckInSaving(false);
    }
  };

  // Cancel or Reset Active Duty Shift (In case driver started by mistake)
  const handleDutyCancelOrReset = async () => {
    const targetDutyId = activeDutyLogId || currentActiveDuty?.id;
    if (!targetDutyId) return;
    const confirmReset = window.confirm('Are you sure you want to cancel / reset this active shift?');
    if (!confirmReset) return;

    try {
      const startKmVal = Number(currentActiveDuty?.startKm || currentActiveDuty?.start_km || dutyOdometer || 0);
      await endCompanyDuty({ dutyId: targetDutyId, endKm: startKmVal, tollParking: 0, foodAllowance: 0, driverId });
      await refreshData();
      setActiveDutyLogId(null);
      setDutyTimerSeconds(0);
      setDutyEndOdometer('');
    } catch (err: any) {
      alert(err.message || 'Could not reset duty.');
    }
  };

  // Complete Active Duty Shift Check-Out (End Shift & Prepare Next Shift)
  const handleDutyEnd = async () => {
    try {
      const targetDutyId = activeDutyLogId || currentActiveDuty?.id;
      if (!targetDutyId) throw new Error('No active company duty found.');
      if (!dutyEndOdometer.trim()) {
        const el = document.getElementById('shift-end-km-input');
        if (el) el.focus();
        throw new Error('Please enter your ending odometer reading (KM) in the box above.');
      }
      const endKm = Number(dutyEndOdometer);
      const startKmVal = Number(currentActiveDuty?.startKm || currentActiveDuty?.start_km || dutyOdometer || 0);
      if (!Number.isFinite(endKm) || endKm < startKmVal) {
        const el = document.getElementById('shift-end-km-input');
        if (el) el.focus();
        throw new Error(`Ending odometer (${endKm} KM) cannot be less than starting reading (${startKmVal} KM).`);
      }

      await endCompanyDuty({ dutyId: targetDutyId, endKm, tollParking: 0, foodAllowance: 0, driverId });
      await refreshData();

      // Calculate shift duration and hours
      const totalSecs = Math.max(0, dutyTimerSeconds);
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const durationFormatted = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`;
      const durationHours = (totalSecs / 3600).toFixed(1);

      // Determine next shift name (e.g. Shift 1 -> Shift 2)
      let nextShift = 'Shift 2';
      const match = (currentActiveDuty?.shiftName || dutyShift).match(/\d+/);
      if (match) {
        const nextNum = parseInt(match[0], 10) + 1;
        nextShift = `Shift ${nextNum}`;
      }

      const kmRun = endKm - startKmVal;
      const sName = currentActiveDuty?.shiftName || dutyShift;
      const cName = currentActiveDuty?.companyName || currentActiveDuty?.company_name || dutyCompany || 'Corporate Client';
      const rName = `${currentActiveDuty?.pickupLocation || dutyPickup || 'Origin'} → ${currentActiveDuty?.destinationLocation || dutyDestination || 'Destination'}`;

      // Open shift completion summary card/modal
      setCompletedShiftSummary({
        shiftName: sName,
        companyName: cName,
        route: rName,
        startKm: startKmVal,
        endKm,
        kmRun,
        durationFormatted,
        durationHours,
        nextShiftName: nextShift
      });

      // Advance shift selector and prefill next starting odometer with end KM
      setDutyShift(nextShift);
      setDutyOdometer(String(endKm));
      setDutyEndOdometer('');
      setDutyPickup('');
      setDutyDestination('');
      setActiveDutyLogId(null);
      setDutyTimerSeconds(0);
    } catch (err: any) {
      alert(err.message || 'Could not complete duty shift.');
    }
  };

  // Filtered Navigation Tabs depending on Active Working Mode & KYC Approval
  const currentNavTabs = useMemo(() => {
    if (!isApprovedDriver) {
      return [
        { 
          id: 'SHIFTS', 
          label: 'Company Duties & Shift Tracker', 
          icon: <Clock className="w-4 h-4" />, 
          count: '🔒 Locked (KYC)' 
        },
        { 
          id: 'KYC', 
          label: 'Chauffeur Documents & KYC', 
          icon: <ShieldCheck className="w-4 h-4" />, 
          count: '⏳ Under Review' 
        }
      ];
    }

    if (driverMode === 'COMPANY_DUTY') {
      return [
        { 
          id: 'SHIFTS', 
          label: 'Company Duties & Shift Tracker', 
          icon: <Clock className="w-4 h-4" />, 
          count: activeDuty ? '● In Progress' : `${todayCompletedShiftsCount} Done` 
        },
        { 
          id: 'HISTORY', 
          label: 'Shift Logs & Attendance History', 
          icon: <FileText className="w-4 h-4" /> 
        },
        { 
          id: 'KYC', 
          label: 'Chauffeur Documents & KYC', 
          icon: <ShieldCheck className="w-4 h-4" />, 
          count: 'Verified' 
        }
      ];
    } else {
      return [
        { 
          id: 'TRIPS', 
          label: 'Passenger Trips & Live Dispatch', 
          icon: <Compass className="w-4 h-4" />, 
          count: incomingRideRequests.length > 0 
            ? `🚨 ${incomingRideRequests.length} New Offer(s)` 
            : myAcceptedTrips.length > 0 
            ? `${myAcceptedTrips.length} Active` 
            : undefined 
        },
        { 
          id: 'OVERVIEW', 
          label: 'Cockpit Overview', 
          icon: <Gauge className="w-4 h-4" /> 
        },
        { 
          id: 'COMPLETED_TRIPS', 
          label: 'Completed Trips History', 
          icon: <FileText className="w-4 h-4" />,
          count: myCompletedTrips.length > 0 ? `${myCompletedTrips.length}` : undefined
        },
        { 
          id: 'KYC', 
          label: 'Chauffeur Documents & KYC', 
          icon: <ShieldCheck className="w-4 h-4" />, 
          count: 'Verified' 
        }
      ];
    }
  }, [isApprovedDriver, driverMode, activeDuty, todayCompletedShiftsCount, incomingRideRequests.length, myAcceptedTrips.length, myCompletedTrips.length]);

  // =========================================================================
  // VIEW 1: ANIMATED DRIVER LOGIN & ONBOARDING GATEWAY (WHEN NOT LOGGED IN)
  // =========================================================================
  if (showAuthGate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#020B1F] via-[#071B49] to-[#0A122C] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
        {/* Animated Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Central Authentication Modal Container */}
        <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-xl border border-blue-500/30 rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 animate-fade-in my-6">
          {/* Header & 3D Logo */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner mb-1">
              <img src="/sjt_logo.png" alt="SJT Logo" className="h-12 w-auto object-contain mx-auto" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span>SJT CHAUFFEUR PORTAL</span>
              <span className="bg-[#ED1735] text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                Fleet Web
              </span>
            </h1>
            <p className="text-xs text-blue-200">
              Sharanajyoti Tours & Travels Pvt. Ltd. • Official Chauffeur Dispatch & Shift Console
            </p>
          </div>

          {/* Mode Switcher Pills: Sign In vs Register KYC vs Track Status */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 mb-5 text-[11px]">
            <button
              type="button"
              onClick={() => { setAuthMode('LOGIN'); setLoginError(''); }}
              className={`py-2 rounded-xl font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'LOGIN'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Chauffeur Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('SIGNUP'); setRegError(''); }}
              className={`py-2 rounded-xl font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'SIGNUP'
                  ? 'bg-gradient-to-r from-[#ED1735] to-rose-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Partner KYC (12 Docs)</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('STATUS'); setStatusLookupError(''); }}
              className={`py-2 rounded-xl font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'STATUS'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Track KYC Status</span>
            </button>
          </div>

          {/* DUAL WORKING MODE SELECTOR: COMPANY DUTY VS DAILY TRIPS */}
          <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-blue-500/30 mb-5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-300">
              <span className="flex items-center gap-1.5 text-amber-300">
                <Sliders className="w-3.5 h-3.5" />
                <span>Select Working Duty Profile for Today:</span>
              </span>
              <span className="text-[10px] text-slate-400 lowercase">can switch later</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAuthDutyChoice('COMPANY_DUTY')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  authDutyChoice === 'COMPANY_DUTY'
                    ? 'bg-blue-900/60 border-blue-400 text-white shadow-lg ring-2 ring-blue-500/40'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="flex items-center gap-1.5 text-blue-300">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span>Company Duty</span>
                  </span>
                  {authDutyChoice === 'COMPANY_DUTY' && <Check className="w-4 h-4 text-blue-400" />}
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                  Corporate staff shifts, daily route & KM odometer logging (Shift 1 to 10+)
                </p>
                <span className="text-[10px] text-blue-400 font-mono mt-1 block font-bold">
                  ● Shows Shift Tracker only
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAuthDutyChoice('REGULAR')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  authDutyChoice === 'REGULAR'
                    ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-lg ring-2 ring-emerald-500/40'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <Car className="w-4 h-4 text-emerald-400" />
                    <span>Daily Trips</span>
                  </span>
                  {authDutyChoice === 'REGULAR' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                  On-demand passenger rides, airport runs, outstation bookings & dispatch
                </p>
                <span className="text-[10px] text-emerald-400 font-mono mt-1 block font-bold">
                  ● Shows Passenger Dispatch only
                </span>
              </button>
            </div>
          </div>

          {/* TAB A: CHAUFFEUR SIGN IN */}
          {authMode === 'LOGIN' && (
            <div className="space-y-5 animate-fade-in">
              {/* Quick 1-Click Verified Chauffeur Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  ⚡ 1-Click Quick Verified Chauffeur Sign In:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESET_CHAUFFEURS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPresetChauffeur(p)}
                      className="p-3 rounded-2xl bg-slate-800/80 hover:bg-blue-900/50 border border-slate-700 hover:border-blue-500 text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs font-black text-white group-hover:text-blue-300">
                        <span>{p.name}</span>
                        <span className="text-[10px] text-amber-400 font-bold">{p.rating}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.vehicleReg}</div>
                      <div className="text-[10px] text-emerald-400 font-medium truncate mt-0.5">{p.vehicleType}</div>
                      <div className="mt-2 text-[10px] font-bold text-blue-400 group-hover:underline flex items-center gap-1">
                        <span>Sign in as {p.name.split(' ')[0]}</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Login Form */}
              <form onSubmit={handleDriverLogin} className="space-y-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Chauffeur Mobile Number or Email
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      placeholder="+91 99009 75920 or ramesh@driver.sjttravels.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Chauffeur Security PIN / Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      value={loginPin}
                      onChange={e => setLoginPin(e.target.value)}
                      placeholder="Enter chauffeur PIN"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className={`w-full py-3.5 px-4 rounded-2xl text-white font-black text-sm shadow-xl active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    authDutyChoice === 'COMPANY_DUTY'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/40'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/40'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>
                    {loginLoading 
                      ? 'Authenticating Chauffeur…' 
                      : `Sign In to ${authDutyChoice === 'COMPANY_DUTY' ? 'Company Duty' : 'Daily Trips'} Cockpit`}
                  </span>
                </button>
              </form>
            </div>
          )}

          {/* TAB B: DRIVER PARTNER 12-DOCUMENT KYC ONBOARDING */}
          {authMode === 'SIGNUP' && (
            <div className="space-y-4 animate-fade-in">
              {submittedKycResult ? (
                /* Application Submitted Success State */
                <div className="p-6 bg-slate-950/90 rounded-3xl border border-emerald-500/40 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                      Application Submitted Successfully
                    </span>
                    <h2 className="text-xl font-black text-white mt-2">
                      Dossier Under Central Operations Review
                    </h2>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      All 12 mandatory KYC vehicle and driver documents have been securely uploaded to SJT Travels Central Fleet Operations.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-left text-xs space-y-2 font-mono">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5 font-sans">
                      <span className="text-slate-400">Application Reference ID:</span>
                      <strong className="text-amber-400 font-mono font-black">{submittedKycResult.application_id}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5 font-sans">
                      <span className="text-slate-400">Driver Partner:</span>
                      <strong className="text-white">{submittedKycResult.driver_name}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5 font-sans">
                      <span className="text-slate-400">Vehicle Registration:</span>
                      <strong className="text-amber-300">{submittedKycResult.vehicle_reg}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5 font-sans">
                      <span className="text-slate-400">Verification Status:</span>
                      <span className="text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/40">
                        ⏳ PENDING ADMIN AUDIT
                      </span>
                    </div>
                  </div>

                  {/* Operational Notice */}
                  <div className="p-3.5 bg-blue-950/40 border border-blue-500/30 rounded-2xl text-left text-xs text-blue-200 space-y-1">
                    <div className="font-black text-blue-300 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Next Step: Admin Approval & Login Issuance</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      SJT Central Administrator will review your 7 vehicle documents and 5 driver proofs. Upon verification, the Administrator will generate your official <strong>Driver Login ID & Security Password / PIN</strong>. You cannot log in until your KYC is approved.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStatusLookupInput(submittedKycResult.phone || submittedKycResult.email);
                        setAuthMode('STATUS');
                      }}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Track Verification Progress</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmittedKycResult(null);
                        setAuthMode('LOGIN');
                      }}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-xs transition cursor-pointer"
                    >
                      Back to Driver Sign In
                    </button>
                  </div>
                </div>
              ) : (
                /* 12-Document Registration Form */
                <form onSubmit={handleDriverSignup} className="space-y-4">
                  {/* Form Header with 1-Click Auto Fill Demo */}
                  <div className="p-3 bg-slate-950/90 rounded-2xl border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#ED1735]" />
                        <span>Driver Onboarding & 12 Mandatory KYC Documents</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        7 Vehicle Documents + 5 Driver Identity Proofs required for Admin approval
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={fillSampleKycDocuments}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-[10px] rounded-xl shadow transition cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <span>⚡ Auto-Fill Demo KYC & 12 Docs</span>
                    </button>
                  </div>

                  {/* Section 1: Personal Details */}
                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                    <div className="text-[11px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>1. Chauffeur Personal & Identity Details</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Full Legal Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={e => setRegName(e.target.value)}
                          placeholder="e.g. Anand Gowda"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          WhatsApp Mobile Number <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={e => setRegPhone(e.target.value)}
                          placeholder="e.g. +91 98450 12345"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Email Address (Optional)
                        </label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={e => setRegEmail(e.target.value)}
                          placeholder="e.g. anand@driver.sjttravels.com"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Create Chauffeur Password / Security PIN <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            required
                            minLength={4}
                            value={regPassword}
                            onChange={e => setRegPassword(e.target.value)}
                            placeholder="Create secret PIN / password (min 4 chars)"
                            className="w-full pl-9 pr-9 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-blue-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                          >
                            {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                          ✓ Driver sets own password here (Admin only verifies KYC documents)
                        </span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Commercial Driving License (DL) <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={regDl}
                          onChange={e => setRegDl(e.target.value)}
                          placeholder="e.g. KA-04-2018-0091823"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold font-mono text-white placeholder-slate-500 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Aadhaar Number (12 Digits) <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={regAadhaar}
                          onChange={e => setRegAadhaar(e.target.value)}
                          placeholder="e.g. 5421 8892 1045"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold font-mono text-white placeholder-slate-500 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          PAN Card Number <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={regPan}
                          onChange={e => setRegPan(e.target.value.toUpperCase())}
                          placeholder="e.g. ABCDE1234F"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold font-mono text-white placeholder-slate-500 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Operating Corridor / Base Location
                        </label>
                        <input
                          type="text"
                          value={regBaseArea}
                          onChange={e => setRegBaseArea(e.target.value)}
                          placeholder="e.g. Nagasandra, Outer Ring Road, Hebbal, Airport"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Vehicle Details */}
                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                    <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5" />
                      <span>2. Commercial Yellow-Board Vehicle Details</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Vehicle Category
                        </label>
                        <select
                          value={regVehicleType}
                          onChange={e => setRegVehicleType(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                        >
                          <option value="Tempo Traveller (17 Seater)">Tempo Traveller (17 Seater)</option>
                          <option value="Toyota Innova Crysta">Toyota Innova Crysta (7 Seater)</option>
                          <option value="Maruti Suzuki Ertiga">Maruti Suzuki Ertiga (6 Seater)</option>
                          <option value="Toyota Etios / Sedan">Toyota Etios / Sedan (4 Seater)</option>
                          <option value="Mini Bus (25 Seater)">Mini Bus (25 Seater)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Yellow-Board Registration # <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={regVehicleReg}
                          onChange={e => setRegVehicleReg(e.target.value.toUpperCase())}
                          placeholder="e.g. KA 05 AU 1234"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black font-mono text-amber-300 placeholder-slate-500 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Vehicle Make & Model
                        </label>
                        <input
                          type="text"
                          value={regMakeModel}
                          onChange={e => setRegMakeModel(e.target.value)}
                          placeholder="e.g. Force Tempo Traveller 3350 AC"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Seating Capacity & Year
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={regSeats}
                            onChange={e => setRegSeats(e.target.value)}
                            placeholder="Seats"
                            className="w-1/2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                          />
                          <input
                            type="number"
                            value={regYear}
                            onChange={e => setRegYear(e.target.value)}
                            placeholder="Year"
                            className="w-1/2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: 12 Mandatory Documents Upload */}
                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>3. 12 Mandatory KYC Documents (7 Vehicle + 5 Driver)</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {Object.keys(regDocs).length}/12 Attached
                      </span>
                    </div>

                    {/* Sub-group A: 7 Vehicle Documents */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                        🚗 Vehicle Documents (7 Items):
                      </span>
                      <div className="space-y-1.5">
                        {[
                          ['rc', '1. RC Card (Registration Certificate)'],
                          ['insurance', '2. Commercial Insurance Policy'],
                          ['emissions', '3. Emission / Pollution Test (PUC)'],
                          ['fitness', '4. Fitness Certificate (FC)'],
                          ['b_extract', '5. B-Extract (RTO History Extract)'],
                          ['permit', '6. Commercial Permit (Tourist/State)'],
                          ['road_tax', '7. Road Tax Receipt / Token']
                        ].map(([key, label]) => {
                          const doc = regDocs[key];
                          return (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-200 text-[11px]">{label}</div>
                                <div className="text-[10px] text-slate-400">
                                  {doc?.file_name ? (
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                      ✓ Attached ({doc.file_name})
                                    </span>
                                  ) : (
                                    <span className="text-amber-500">Attach document copy</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {['rc', 'insurance', 'emissions', 'fitness', 'permit', 'road_tax'].includes(key) && (
                                  <input
                                    type="date"
                                    value={doc?.expires_at || ''}
                                    onChange={e => setRegDocs(prev => ({
                                      ...prev,
                                      [key]: { ...(prev[key] || { file_name: `${key}.jpg` }), expires_at: e.target.value }
                                    }))}
                                    className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[10px] text-slate-200 outline-none"
                                    title="Expiry Date"
                                  />
                                )}
                                <label className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition">
                                  <span>{doc?.file_name ? 'Change' : 'Upload'}</span>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={e => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                          setRegDocs(prev => ({
                                            ...prev,
                                            [key]: { file_name: file.name, data: reader.result as string, expires_at: prev[key]?.expires_at || '' }
                                          }));
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sub-group B: 5 Driver Documents */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                        🪪 Driver Identity Documents (5 Items):
                      </span>
                      <div className="space-y-1.5">
                        {[
                          ['dl', '1. Commercial Driving License (DL)'],
                          ['aadhaar', '2. Aadhaar Card (Front & Back)'],
                          ['pan', '3. PAN Card (IT Dept)'],
                          ['police_certificate', '4. Police Verification Certificate'],
                          ['passport_photo', '5. Passport Size Photo (Driver Portrait)']
                        ].map(([key, label]) => {
                          const doc = regDocs[key];
                          return (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-200 text-[11px]">{label}</div>
                                <div className="text-[10px] text-slate-400">
                                  {doc?.file_name ? (
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                      ✓ Attached ({doc.file_name})
                                    </span>
                                  ) : (
                                    <span className="text-amber-500">Attach document copy</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {key === 'dl' && (
                                  <input
                                    type="date"
                                    value={doc?.expires_at || ''}
                                    onChange={e => setRegDocs(prev => ({
                                      ...prev,
                                      [key]: { ...(prev[key] || { file_name: `${key}.jpg` }), expires_at: e.target.value }
                                    }))}
                                    className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[10px] text-slate-200 outline-none"
                                    title="Expiry Date"
                                  />
                                )}
                                <label className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-400 hover:text-purple-300 border border-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition">
                                  <span>{doc?.file_name ? 'Change' : 'Upload'}</span>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={e => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                          setRegDocs(prev => ({
                                            ...prev,
                                            [key]: { file_name: file.name, data: reader.result as string, expires_at: prev[key]?.expires_at || '' }
                                          }));
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {regError && (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-[#ED1735] to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-black text-sm shadow-xl shadow-red-900/40 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    <span>
                      {regLoading 
                        ? 'Uploading 12 Documents & Submitting to Operations…' 
                        : 'Submit 12 KYC Documents for Admin Verification'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB C: TRACK KYC VERIFICATION STATUS */}
          {authMode === 'STATUS' && (
            <div className="space-y-4 animate-fade-in">
              <form onSubmit={handleCheckKycStatus} className="p-4 bg-slate-950/90 rounded-2xl border border-emerald-500/30 space-y-3">
                <div className="space-y-1">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>Track Driver KYC Application Status</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Enter your Registered Mobile Number, Email, or Application ID
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={statusLookupInput}
                    onChange={e => setStatusLookupInput(e.target.value)}
                    placeholder="e.g. +91 98450 12345 or driver@..."
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={statusLookupLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow cursor-pointer transition shrink-0"
                  >
                    {statusLookupLoading ? 'Checking…' : 'Check Status'}
                  </button>
                </div>

                {statusLookupError && (
                  <div className="p-2.5 bg-red-950/60 border border-red-500/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{statusLookupError}</span>
                  </div>
                )}
              </form>

              {statusLookupResult && (
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <div className="font-black text-white text-sm">{statusLookupResult.driver_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{statusLookupResult.driver_phone}</div>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                      statusLookupResult.kyc_status === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      statusLookupResult.kyc_status === 'REJECTED' ? 'bg-red-950 text-red-400 border border-red-800' :
                      'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {statusLookupResult.kyc_status === 'APPROVED' ? '✓ APPROVED & ACTIVATED' :
                       statusLookupResult.kyc_status === 'REJECTED' ? '✕ REJECTED' : '⏳ PENDING OPERATIONS REVIEW'}
                    </span>
                  </div>

                  {statusLookupResult.kyc_status === 'APPROVED' && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-200 space-y-2">
                      <div className="font-black text-emerald-300">
                        🎉 Congratulations! Your Driver Account is ACTIVE
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Assigned Yellow-Board Vehicle: <strong className="font-mono text-amber-300">{statusLookupResult.assigned_vehicle_reg || 'KA 05 AB 1234'}</strong>.
                        Please use the Login ID and Password provided by SJT Admin to sign in.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginIdentifier(statusLookupResult.driver_email || statusLookupResult.driver_phone);
                          setAuthMode('LOGIN');
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-xs cursor-pointer"
                      >
                        Proceed to Chauffeur Sign In →
                      </button>
                    </div>
                  )}

                  {statusLookupResult.kyc_status === 'PENDING' && (
                    <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-200 text-[11px]">
                      Your application is currently under review by SJT Operations Admin. Once approved, Admin will create your Login ID and Password.
                    </div>
                  )}

                  {statusLookupResult.kyc_status === 'REJECTED' && (
                    <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-[11px] space-y-1">
                      <div className="font-bold">Rejection Reason:</div>
                      <div>{statusLookupResult.rejection_reason || 'Documents failed RTO verification standards.'}</div>
                      <button
                        type="button"
                        onClick={() => setAuthMode('SIGNUP')}
                        className="mt-2 text-xs font-bold text-red-300 underline cursor-pointer"
                      >
                        Re-submit Application with Clear Documents →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {/* Bottom Card Navigation */}
          <div className="pt-4 mt-6 border-t border-slate-800 text-center">
            <a
              href="https://sjttarvels.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 font-bold hover:underline inline-flex items-center gap-1.5"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>🌐 SJT Cabs Customer Website</span>
            </a>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MAIN DRIVER WEBSITE COCKPIT
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* ============================================================ */}
      {/* 1. TOP HEADER & DESKTOP NAVIGATION BAR */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 bg-[#071B49] border-b border-blue-900/60 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Branding, Driver Identity & Current Mode Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ED1735] to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-900/30 font-black">
                {activeChauffeur.avatar || 'SJT'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black tracking-wide text-white">SJT DRIVER PORTAL</h1>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                    WEB EDITION
                  </span>
                  {/* Mode Pill in Title */}
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                    driverMode === 'COMPANY_DUTY'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  }`}>
                    {driverMode === 'COMPANY_DUTY' ? <Building2 className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                    <span>{driverMode === 'COMPANY_DUTY' ? 'Company Duty' : 'Daily Trips'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-blue-200 font-mono">
                  <span className="font-bold text-white">{driverName}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-amber-300 font-bold">{vehicleReg}</span>
                  <span className="text-slate-400">•</span>
                  <span className="hidden sm:inline">{vehicleType}</span>
                </div>
              </div>
            </div>

            {/* Right: Switch Mode Button, Availability, Simulator & Switch Chauffeur */}
            <div className="flex items-center gap-2.5">
              {/* PROMINENT DYNAMIC MODE SWITCHER BUTTON */}
              <button
                type="button"
                onClick={() => handleSwitchMode(driverMode === 'COMPANY_DUTY' ? 'REGULAR' : 'COMPANY_DUTY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                  driverMode === 'COMPANY_DUTY'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40 ring-1 ring-emerald-400/50'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/40 ring-1 ring-blue-400/50'
                }`}
                title={driverMode === 'COMPANY_DUTY' ? 'Switch to Daily Passenger Trips Driver' : 'Switch to Corporate Company Duty Shifts'}
              >
                {driverMode === 'COMPANY_DUTY' ? (
                  <>
                    <Car className="w-3.5 h-3.5" />
                    <span>Switch to Daily Trips ➔</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Switch to Company Duty ➔</span>
                  </>
                )}
              </button>

              {/* Online / Offline Switch */}
              <button
                type="button"
                onClick={() => void saveDriverAvailability(!isOnline)}
                disabled={availabilitySaving}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm cursor-pointer ${
                  isOnline 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                <span className="hidden sm:inline">{isOnline ? 'Online (Ready)' : 'Offline'}</span>
              </button>

              {/* Instant Customer Booking Simulation Button */}
              <button
                type="button"
                onClick={handleSimulateCustomerBooking}
                disabled={simulatingRide}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-900/30 transition-all cursor-pointer"
                title="Simulate a customer booking to test real-time acceptance"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span className="hidden md:inline">{simulatingRide ? 'Simulating…' : '⚡ Test Ride'}</span>
              </button>

              {/* Switch Chauffeur Account */}
              <button
                type="button"
                onClick={handleDriverSignOut}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Switch Chauffeur Profile or Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              {/* Customer Web Switcher */}
              <a
                href="https://sjttarvels.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Open Customer Website"
              >
                <Monitor className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">Customer Website</span>
              </a>
            </div>
          </div>

          {/* Desktop Navigation Tabs: DYNAMIC BASED ON DRIVER MODE */}
          <nav className="flex items-center gap-1 overflow-x-auto py-2 border-t border-blue-900/40 scrollbar-none">
            {currentNavTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? driverMode === 'COMPANY_DUTY'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 ring-1 ring-blue-400'
                      : 'bg-[#ED1735] text-white shadow-md shadow-red-900/30'
                    : 'text-blue-200 hover:text-white hover:bg-blue-900/40'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${
                    tab.count.includes('🚨')
                      ? 'bg-amber-400 text-slate-950 animate-pulse'
                      : activeTab === tab.id 
                      ? 'bg-black/30 text-white' 
                      : 'bg-blue-900/80 text-blue-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. MAIN WEBSITE BODY */}
      {/* ============================================================ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* OFFICIAL ANNOUNCEMENT BANNER: DRIVER APP LAUNCHING SOON */}
        {showLaunchBanner && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#030e2e] via-[#071B49] to-slate-900 border border-blue-500/40 p-4 sm:p-5 shadow-2xl animate-fade-in">
            <div className="flex flex-col lg:flex-row items-center gap-5">
              {/* Official Banner Image */}
              <div className="w-full lg:w-7/12 relative group overflow-hidden rounded-2xl shadow-xl border border-blue-400/30">
                <img 
                  src="/sjt_driver_app_launching_soon.jpg" 
                  alt="SJT Cabs Driver App Launching Soon" 
                  className="w-full h-auto object-cover transform group-hover:scale-102 transition-transform duration-500"
                />
              </div>

              {/* Banner Details & Interactive Action */}
              <div className="w-full lg:w-5/12 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-[#ED1735] text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    <span>Launching Next Month End!</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLaunchBanner(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                    title="Dismiss Banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-black text-white leading-tight">
                  SJT Cabs Driver Android App Launching Soon!
                </h3>

                <p className="text-xs text-blue-200 leading-relaxed">
                  A dedicated Android app for SJT drivers to receive instant passenger ride requests, manage shift duties, upload documents, and track odometer logs.
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Instant Ride Offers</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Company Shift Duties</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Real-time Navigation</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>100% Yellow-Board Fleet</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreRegisterPhone(driverPhone);
                      setShowPreRegisterModal(true);
                      setPreRegisterSuccess(false);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Bell className="w-4 h-4 fill-current" />
                    <span>Pre-Register for Early Android APK Access</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pre-Register Modal */}
        {showPreRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-blue-500/40 rounded-3xl p-6 shadow-2xl text-left space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  <h4 className="text-base font-black text-white">Pre-Register for SJT Driver App</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreRegisterModal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!preRegisterSuccess ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300">
                    We'll send the direct Android APK download link straight to your WhatsApp as soon as the app goes live next month end!
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Your WhatsApp Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={preRegisterPhone}
                      onChange={e => setPreRegisterPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPreRegisterSuccess(true);
                      localStorage.setItem('sjt_driver_apk_registered', preRegisterPhone);
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Pre-Register</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h5 className="text-sm font-black text-white">Pre-Registration Confirmed!</h5>
                  <p className="text-xs text-slate-300">
                    Your number <strong className="text-amber-300">{preRegisterPhone}</strong> is enrolled for early APK access.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPreRegisterModal(false)}
                    className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* LIVE INCOMING RIDE ALERT BANNER (ONLY IN DAILY TRIPS MODE) */}
        {/* ============================================================ */}
        {driverMode === 'REGULAR' && incomingRideRequests.length > 0 && activeTab !== 'TRIPS' && (
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-2 border-amber-500 rounded-3xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce-subtle">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-900/50">
                <Bell className="w-6 h-6 animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-amber-300 tracking-wider">
                    🚨 {incomingRideRequests.length} New Passenger Ride Request Available!
                  </span>
                  <span className="bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                    Awaiting Acceptance
                  </span>
                </div>
                <div className="text-sm font-black text-white mt-0.5">
                  {incomingRideRequests[0].pickup} → {incomingRideRequests[0].destination}
                </div>
                <div className="text-xs text-slate-300">
                  Fare: <strong className="text-emerald-400 font-mono">₹{incomingRideRequests[0].quoted_amount || incomingRideRequests[0].quotedAmount}</strong> • Customer: {incomingRideRequests[0].customer_name || incomingRideRequests[0].customerName}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleAcceptRide(incomingRideRequests[0])}
                disabled={Boolean(acceptingRideId)}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{acceptingRideId ? 'Accepting…' : 'Accept Ride Now'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('TRIPS')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
              >
                View Trips
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* GATE: LOCKED KYC AUDIT IN PROGRESS (WHEN NOT APPROVED BY ADMIN) */}
        {/* ============================================================ */}
        {!isApprovedDriver && activeTab !== 'KYC' && (
          <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Big Alert Hero */}
            <div className="bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-amber-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                    <ShieldAlert className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                        <span>KYC Audit In Progress</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Ref: #{submittedKycResult?.application_id || driverKyc?.id || `KYC-BLR-${driverPhone.replace(/\D/g, '').slice(-4)}`}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                      Duty Dashboard is Locked Under Admin Audit
                    </h2>
                    <p className="text-xs text-amber-200/80 mt-0.5">
                      12 Mandatory KYC documents submitted • Awaiting SJT Central Admin verification
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      await refreshDriverKyc();
                      await refreshData(true);
                      alert('Refreshed verification status. If Admin has approved in Admin Panel, your dashboard is now unlocked.');
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Check & Refresh Status</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDriverSignOut}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Status Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-6 font-mono text-xs">
                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-sans block">Driver Partner</span>
                  <strong className="text-white text-sm font-sans">{driverName}</strong>
                  <div className="text-blue-400 text-[11px] mt-0.5">📱 {driverPhone}</div>
                </div>

                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-sans block">Assigned Commercial Vehicle</span>
                  <strong className="text-amber-300 text-sm font-mono">{vehicleReg}</strong>
                  <div className="text-slate-300 text-[11px] font-sans mt-0.5 truncate">{vehicleType}</div>
                </div>

                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-sans block">Verification State</span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold text-xs mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>UNDER REVIEW</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans mt-1">
                    Company Duties & Daily Trips Locked
                  </div>
                </div>
              </div>

              {/* 12-Document Inspection Checklist */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>12 Submitted Documents Dossier (Under Central Audit)</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                    ✓ All 12 Documents Uploaded
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  {[
                    '1. RC Card',
                    '2. Commercial Insurance',
                    '3. PUC Emission Test',
                    '4. Fitness Certificate',
                    '5. B-Extract',
                    '6. Tourist Permit',
                    '7. Road Tax',
                    '8. Driving License (DL)',
                    '9. Aadhaar Card',
                    '10. PAN Card',
                    '11. Police Clearance',
                    '12. Passport Photo'
                  ].map((docName, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{docName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Informational Guidance Box */}
              <div className="mt-6 p-4 bg-blue-950/40 rounded-2xl border border-blue-500/30 text-xs text-blue-200 space-y-2">
                <div className="font-black text-blue-300 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>How to Unlock Your Duty Dashboard:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  1. <strong>Admin Audit:</strong> SJT Central Operations Admin reviews your 12 uploaded documents in the Admin Portal (<code>http://localhost:3003</code> → <strong>Driver KYC Audit</strong>).<br />
                  2. <strong>One-Click Approval:</strong> Once Admin clicks <em>"Approve KYC & Activate Driver"</em>, your duty dashboard will be automatically unlocked.<br />
                  3. <strong>Your Password:</strong> You will log in using your registered mobile number: <strong className="text-white">{driverPhone}</strong> and the secret password you created during signup. No password creation by Admin is required.<br />
                  4. <strong>Live Unlock:</strong> Click the <strong>"Check & Refresh Status"</strong> button above at any time to verify if Admin has approved your dossier.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 1: COMPANY DUTIES & SHIFT TRACKER (WHEN IN COMPANY DUTY) */}
        {/* ============================================================ */}
        {isApprovedDriver && driverMode === 'COMPANY_DUTY' && activeTab === 'SHIFTS' && (
          <div className="space-y-6 animate-fade-in">
            {/* HERO COCKPIT CARD: TODAY'S SHIFT DUTIES & DISTANCE (ZERO EARNINGS - ONLY KM & SHIFTS) */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#071B49] via-slate-900 to-[#0A2668] text-white p-6 rounded-3xl shadow-2xl border border-blue-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-wide text-white flex items-center gap-2">
                      <span>Corporate Company Duty & Shift Console</span>
                      <span className="bg-blue-500/20 text-blue-300 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-blue-400/30 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                        <span>{todayCompletedShiftsCount} Shifts Logged Today</span>
                      </span>
                    </h2>
                    <p className="text-xs text-blue-200">
                      Official corporate shift odometer logging system • Driver fills company name & start/end mileage
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-300 uppercase block font-bold">Vehicle Reg #</span>
                    <strong className="text-sm font-mono text-amber-300 font-bold">{vehicleReg}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-300 uppercase block font-bold">Current Date</span>
                    <strong className="text-sm font-mono text-white">{indiaToday}</strong>
                  </div>
                </div>
              </div>

              {/* Prominent KM & Shift Metrics (Strictly NO EARNINGS!) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Total Day Distance Run</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <strong className="text-3xl font-black font-mono text-emerald-400 tracking-tight">
                        {totalTodayShiftKm}
                      </strong>
                      <span className="text-sm font-bold text-emerald-300">KM</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Gauge className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Total Shifts Completed</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <strong className="text-3xl font-black font-mono text-white tracking-tight">
                        {todayCompletedShiftsCount}
                      </strong>
                      <span className="text-sm font-bold text-slate-300">Shifts</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Current Duty State</span>
                    <strong className="text-base font-black text-amber-300 block mt-1">
                      {activeDuty ? `${activeDuty.shiftName || dutyShift} Active` : 'Ready for Next Shift'}
                    </strong>
                    <span className="text-[10px] text-slate-400">
                      {activeDuty ? `Started at ${activeDuty.startKm || activeDuty.start_km} KM` : 'Check in below to begin'}
                    </span>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeDuty ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-slate-700 text-slate-400'}`}>
                    <Car className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Horizontal Scrollable Carousel of Completed Shifts Today */}
              <div className="pt-5 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-bold uppercase tracking-wider">
                  <span>Shift-Wise Distance Breakdown for Today:</span>
                  <span className="text-emerald-400 font-mono">{todayDuties.length} logged shift(s)</span>
                </div>

                {todayDuties.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {todayDuties.map((d, idx) => {
                      const sName = d.shift_name || d.shiftName || `Shift ${idx + 1}`;
                      const sKm = Number(d.dailyKm ?? d.daily_km ?? (d.endKm && d.startKm ? d.endKm - d.startKm : 0));
                      return (
                        <div
                          key={d.id || idx}
                          className="bg-white/10 hover:bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-left transition-all"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-black text-emerald-300 uppercase tracking-wide">{sName}</span>
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Done</span>
                            </span>
                          </div>
                          <div className="font-mono font-black text-xl text-white mt-1">
                            {sKm} <span className="text-xs font-normal text-slate-300">KM</span>
                          </div>
                          <div className="text-[11px] text-slate-200 truncate mt-1 font-medium">
                            {d.companyName || d.company_name || 'Client Duty'}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {d.startKm || d.start_km} → {d.endKm || d.end_km} KM
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                    <span className="text-xs text-slate-300 flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>No shifts completed today yet. Select a shift below to start logging!</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* TWO-COLUMN DESKTOP WORKSPACE: (LEFT: MULTI-SHIFT SELECTOR & CHECK-IN FORM / RIGHT: ACTIVE LIVE CONSOLE) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN: MULTI-SHIFT SELECTOR & DRIVER FORM (7 Cols) */}
              <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <h3 className="text-base font-black text-white">Select Duty Shift to Login (1 to 10+)</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-300 bg-blue-900/60 px-3 py-1 rounded-xl border border-blue-700">
                    Selected: {dutyShift}
                  </span>
                </div>

                {/* 10 Standard Shifts Grid */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {['Shift 1', 'Shift 2', 'Shift 3', 'Shift 4', 'Shift 5', 'Shift 6', 'Shift 7', 'Shift 8', 'Shift 9', 'Shift 10'].map(s => {
                      const shiftDuty = getTodayShiftDuty(s);
                      const isDone = Boolean(shiftDuty && (shiftDuty.logoutTime || shiftDuty.logout_time));
                      const shiftKm = shiftDuty ? Number(shiftDuty.dailyKm ?? shiftDuty.daily_km ?? 0) : null;
                      const isSelected = dutyShift === s;

                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={isDone}
                          onClick={() => {
                            if (!isDone) setDutyShift(s);
                          }}
                          title={isDone ? `${s} completed today (${shiftKm || 0} km logged). Each shift can only be done once per day.` : `Select ${s}`}
                          className={`p-2.5 rounded-2xl text-center font-bold text-xs transition-all border ${
                            isDone
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40 opacity-80 cursor-not-allowed'
                              : isSelected
                              ? 'bg-[#071B49] text-white border-blue-400 shadow-lg ring-2 ring-blue-500/40 cursor-pointer active:scale-95'
                              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 cursor-pointer active:scale-95'
                          }`}
                        >
                          <span className="block text-xs font-black">{s}</span>
                          <span className={`text-[10px] block font-mono mt-1 ${
                            isDone
                              ? 'text-emerald-400 font-bold'
                              : isSelected
                              ? 'text-blue-200 font-bold'
                              : 'text-slate-500'
                          }`}>
                            {isDone ? `✓ ${shiftKm || 0} km` : isSelected ? '● Active' : 'Available'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {todayCompletedShiftsCount > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 bg-emerald-950/30 border border-emerald-800/50 rounded-2xl text-xs text-emerald-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          <strong>{todayCompletedShiftsCount} Shift{todayCompletedShiftsCount > 1 ? 's' : ''} Completed Today</strong> ({totalTodayShiftKm} KM total).
                          {nextAvailableShift && (
                            <span className="ml-1 text-slate-300">Next available duty: <strong className="text-blue-300">{nextAvailableShift}</strong></span>
                          )}
                        </span>
                      </div>
                      {lastCompletedEndKm !== null && (
                        <span className="text-[11px] font-mono text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-lg border border-emerald-700/60 shrink-0 self-start sm:self-auto">
                          Last End: {lastCompletedEndKm} KM
                        </span>
                      )}
                    </div>
                  )}

                  {/* Custom Shift Adder for Shift 11, 12, etc. */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    {!showCustomShiftInput ? (
                      <button
                        type="button"
                        onClick={() => setShowCustomShiftInput(true)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Need Shift 11 or custom route name? Click here</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={customShiftName}
                          onChange={e => setCustomShiftName(e.target.value)}
                          placeholder="e.g. Shift 11 or Plant Route"
                          className="flex-1 px-3 py-1.5 bg-slate-800 border border-blue-400 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customShiftName.trim()) {
                              setDutyShift(customShiftName.trim());
                              setCustomShiftName('');
                              setShowCustomShiftInput(false);
                            }
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Set
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCustomShiftInput(false)}
                          className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* DUTY CHECK-IN FORM OR ACTIVE SHIFT STATUS */}
                {activeDuty ? (
                  <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-blue-950 p-5 rounded-2xl border border-emerald-500/50 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                        <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                          {activeDuty.shiftName || dutyShift} Active & Running
                        </span>
                      </div>
                      <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                        ⏱ {((dutyTimerSeconds || 0) / 3600).toFixed(1)} Hours ({formatTimer(dutyTimerSeconds)})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Company</span>
                        <strong className="text-white text-sm mt-0.5 block truncate">
                          {activeDuty.companyName || activeDuty.company_name || dutyCompany}
                        </strong>
                      </div>
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Starting Odometer</span>
                        <strong className="text-emerald-400 font-mono text-base font-black mt-0.5 block">
                          {activeDuty.startKm || activeDuty.start_km} KM
                        </strong>
                      </div>
                      <div className="sm:col-span-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Route In Progress</span>
                        <span className="text-slate-200 text-xs mt-0.5 block truncate">
                          {activeDuty.pickupLocation || activeDuty.pickup_location || dutyPickup} → {activeDuty.destinationLocation || activeDuty.destination_location || dutyDestination}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('shift-end-km-input');
                          if (el) el.focus();
                        }}
                        className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Enter Ending KM in Right Console ➔</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDutyCancelOrReset}
                        className="w-full sm:w-auto py-3 px-3 bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                        title="Cancel or reset this active shift if started by mistake"
                      >
                        Reset Shift
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleDutyCheckIn} className="space-y-4 pt-2">
                    {/* Assigned Company */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Assigned Company / Client Name <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="shift-company-input"
                          type="text"
                          required
                          maxLength={160}
                          value={dutyCompany}
                          onChange={e => setDutyCompany(e.target.value)}
                          placeholder="Type company or client name (e.g. Infosys, Janani, Amazon)"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    {/* Route: Pickup & Drop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Pickup Location <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            maxLength={240}
                            value={dutyPickup}
                            onChange={e => setDutyPickup(e.target.value)}
                            placeholder="Enter pickup location / plant"
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Drop Destination <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Navigation className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            maxLength={240}
                            value={dutyDestination}
                            onChange={e => setDutyDestination(e.target.value)}
                            placeholder="Enter drop destination / hub"
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Starting Odometer */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-300">
                          Starting Odometer Reading (KM) <span className="text-red-400">*</span>
                        </label>
                        {lastCompletedEndKm !== null && (
                          <button
                            type="button"
                            onClick={() => setDutyOdometer(String(lastCompletedEndKm))}
                            className="text-xs text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Use last shift end reading: {lastCompletedEndKm} KM</span>
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Gauge className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          min="0"
                          step="1"
                          required
                          value={dutyOdometer}
                          onChange={e => setDutyOdometer(e.target.value)}
                          placeholder="Enter starting odometer reading (e.g. 125400)"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-blue-950/40 border border-blue-500/40 rounded-xl text-sm font-black font-mono text-emerald-400 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {dutyCheckInError && (
                      <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                        <span>{dutyCheckInError}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={dutyCheckInSaving}
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-emerald-900/40 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{dutyCheckInSaving ? 'Starting Duty Shift…' : `Start ${dutyShift} Duty & Log Starting KM`}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* RIGHT COLUMN: ACTIVE SHIFT LIVE CONSOLE (5 Cols) */}
              <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <h3 className="text-base font-black text-white">Live Shift Console</h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      activeDuty ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {activeDuty ? `${(activeDuty.shiftName || dutyShift).toUpperCase()} RUNNING` : 'IDLE / NO DUTY'}
                    </span>
                  </div>

                  {/* Digital Stopwatch Timer */}
                  <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 text-center space-y-1 shadow-inner">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        {activeDuty ? `${activeDuty.shiftName || dutyShift} Active Timer` : 'Duty Timer'}
                      </span>
                      {activeDuty && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] border border-emerald-500/30">
                          ⏱ {((dutyTimerSeconds || 0) / 3600).toFixed(1)} Hours
                        </span>
                      )}
                    </div>
                    <div className="text-4xl font-black font-mono tracking-wider text-emerald-400">
                      {formatTimer(dutyTimerSeconds)}
                    </div>
                    <span className="text-[11px] text-slate-400 block pt-1">
                      {activeDuty ? `Company: ${activeDuty.companyName || activeDuty.company_name || dutyCompany}` : 'Clock starts on shift check-in'}
                    </span>
                  </div>

                  {/* Active Shift Details Card */}
                  {activeDuty ? (
                    <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-700">
                        <span className="text-slate-400">Active Shift</span>
                        <strong className="text-blue-300 font-black">{activeDuty.shiftName || dutyShift}</strong>
                      </div>
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-700">
                        <span className="text-slate-400">Starting Odometer</span>
                        <strong className="font-mono font-black text-emerald-400">{activeDuty.startKm || activeDuty.start_km} KM</strong>
                      </div>
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-700">
                        <span className="text-slate-400">Vehicle Assigned</span>
                        <strong className="font-mono text-amber-300 font-bold">{activeDuty.vehicleReg || activeDuty.vehicle_reg || vehicleReg}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Route</span>
                        <span className="font-medium text-slate-200 truncate max-w-[200px]">
                          {activeDuty.pickupLocation || activeDuty.pickup_location} → {activeDuty.destinationLocation || activeDuty.destination_location}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                      No duty shift currently active. Select a shift on the left and click "Start Duty" to activate live odometer tracking.
                    </div>
                  )}

                  {/* Ending Odometer Entry & Live Shift Run Calculation */}
                  {activeDuty && (
                    <div className="bg-emerald-950/30 p-4 rounded-2xl border border-emerald-500/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-emerald-200">
                          Ending Odometer Reading (KM) <span className="text-red-400">*</span>
                        </label>
                        {dutyEndOdometer && Number(dutyEndOdometer) >= Number(activeDuty.startKm || activeDuty.start_km || 0) && (
                          <span className="bg-emerald-600 text-white font-mono font-black text-xs px-2.5 py-0.5 rounded-full shadow-xs">
                            {activeDuty.shiftName || dutyShift} Run: {Number(dutyEndOdometer) - Number(activeDuty.startKm || activeDuty.start_km || 0)} KM
                          </span>
                        )}
                      </div>
                      <input
                        id="shift-end-km-input"
                        type="number"
                        min={activeDuty.startKm || activeDuty.start_km}
                        value={dutyEndOdometer}
                        onChange={e => setDutyEndOdometer(e.target.value)}
                        placeholder={`Enter ending odometer km (>= ${activeDuty.startKm || activeDuty.start_km})`}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-emerald-500/60 rounded-xl text-base font-black font-mono text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-[11px] text-slate-400">
                        Enter final odometer reading to calculate shift run distance (e.g. 20 km or 35 km).
                      </p>

                      <button
                        type="button"
                        onClick={handleDutyEnd}
                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm shadow-xl shadow-red-900/40 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>🏁 End Shift & Conclude {activeDuty.shiftName || dutyShift} ➔</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDutyCancelOrReset}
                        className="w-full text-center text-xs text-slate-400 hover:text-red-300 py-1 transition cursor-pointer"
                      >
                        Cancel or reset this shift without logging end KM
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 text-center text-xs text-slate-500">
                  <span>Shift logs are synced in real-time to the SJT Central ERP & Billing Ledger.</span>
                </div>
              </div>
            </div>

            {/* SWITCH TO DAILY TRIPS PROMINENT ACTION BANNER */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-[#071B49] p-6 rounded-3xl border border-emerald-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-base font-black text-white">Finished Your Corporate Shift Duties for Today?</h4>
                </div>
                <p className="text-xs text-slate-300">
                  Once your corporate assignments are complete, switch to <strong>Daily Passenger Trips</strong> to accept nearby rides, airport transfers, and outstation trips.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSwitchMode('REGULAR')}
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-xl shadow-emerald-900/50 transition-all cursor-pointer flex items-center gap-2 shrink-0"
              >
                <Car className="w-4 h-4" />
                <span>Switch to Daily Trips Driver & Take Rides ➔</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 2: PASSENGER TRIPS & LIVE DISPATCH (WHEN IN DAILY TRIPS) */}
        {/* ============================================================ */}
        {isApprovedDriver && driverMode === 'REGULAR' && activeTab === 'TRIPS' && (
          <div className="space-y-6 animate-fade-in">
            {/* SWITCH BACK TO COMPANY DUTIES BANNER */}
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-[#071B49] p-4 rounded-3xl border border-blue-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <h5 className="text-sm font-black text-white">Assigned to Corporate Company Shifts Today?</h5>
                  <p className="text-xs text-slate-300">
                    Switch to <strong>Company Duty mode</strong> anytime to log your starting & ending odometer KM for Shift 1 to 10+.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSwitchMode('COMPANY_DUTY')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Switch to Company Duty Shifts ➔</span>
              </button>
            </div>

            {/* TOP ACTIONS BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-3xl border border-slate-800">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-400" />
                  <span>Real-time Ride Dispatch & Customer Bookings</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Live Ola/Uber style ride acceptance, passenger verification OTP, and trip navigation
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateCustomerBooking}
                  disabled={simulatingRide}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>{simulatingRide ? 'Generating…' : '⚡ Simulate Incoming Ride'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => refreshData()}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
                  title="Refresh Bookings"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SECTION 1: INCOMING CUSTOMER RIDE REQUESTS (NEED ACCEPTANCE) */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${incomingRideRequests.length > 0 ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`}></div>
                  <h4 className="text-base font-black text-white">Incoming Customer Ride Requests</h4>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-800">
                  {incomingRideRequests.length} Ride(s) Waiting For Driver
                </span>
              </div>

              {incomingRideRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incomingRideRequests.map(ride => {
                    const sched = formatBookingSchedule(ride.journey_date || ride.journeyDate, ride.journey_time || ride.journeyTime, ride.return_date || ride.returnDate);
                    const tripBadge = getTripTypeBadge(ride.trip_type || ride.tripType);
                    const bookingCode = ride.booking_code || ride.id;
                    const mapsPickupUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ride.pickup)}`;
                    const mapsDropUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ride.destination)}`;

                    return (
                      <div
                        key={ride.id}
                        className="bg-slate-950 border-2 border-amber-500/80 hover:border-amber-400 rounded-3xl p-5 shadow-2xl space-y-3.5 transition-all relative overflow-hidden"
                      >
                        {/* Header: Incoming Offer Badge, Trip Type, Booking Code */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <Radio className="w-3 h-3" />
                              <span>Incoming Ride Offer</span>
                            </span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${tripBadge.color}`}>
                              {tripBadge.label}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            #{bookingCode}
                          </span>
                        </div>

                        {/* DATE, DAY & TIME HERO STRIP (CRITICAL FOR DRIVER SCHEDULE) */}
                        <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/40 rounded-2xl p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-blue-400" />
                              <span>Journey Date & Day</span>
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded font-mono ${
                                sched.isToday 
                                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' 
                                  : sched.isTomorrow 
                                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' 
                                  : 'bg-slate-800 text-slate-300'
                              }`}>
                                {sched.badge}
                              </span>
                              <strong className="text-white text-xs">{sched.formattedDate} ({sched.dayName})</strong>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Pickup Time</span>
                            </span>
                            <strong className="text-amber-300 font-mono text-sm block mt-0.5">
                              {sched.timeText}
                            </strong>
                          </div>

                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                              <Car className="w-3 h-3 text-emerald-400" />
                              <span>Vehicle & Seater</span>
                            </span>
                            <strong className="text-slate-200 text-xs block mt-0.5 truncate" title={ride.vehicle_name || 'Commercial Fleet'}>
                              {ride.vehicle_name || 'Commercial Fleet'} ({ride.passengers || 1} Pass)
                            </strong>
                          </div>

                          {sched.returnDateText && (
                            <div className="col-span-2 sm:col-span-3 pt-1 border-t border-slate-800/80 text-[11px] text-amber-300 flex items-center gap-1">
                              <Repeat className="w-3 h-3 text-amber-400" />
                              <span>Round Trip Return: <strong>{sched.returnDateText}</strong></span>
                            </div>
                          )}
                        </div>

                        {/* Route Coordinates with 1-Click Maps Navigation */}
                        <div className="space-y-2 text-xs bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Pickup Location</span>
                                <strong className="text-white text-xs sm:text-sm block break-words">{ride.pickup}</strong>
                              </div>
                            </div>
                            <a
                              href={mapsPickupUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-300 font-bold text-[10px] shrink-0 flex items-center gap-1 border border-blue-700/60"
                              title="Open in Google Maps"
                            >
                              <Navigation className="w-2.5 h-2.5" />
                              <span>Maps</span>
                            </a>
                          </div>

                          <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-slate-800/80">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <Navigation className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Drop Destination</span>
                                <strong className="text-white text-xs sm:text-sm block break-words">{ride.destination}</strong>
                              </div>
                            </div>
                            <a
                              href={mapsDropUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-300 font-bold text-[10px] shrink-0 flex items-center gap-1 border border-blue-700/60"
                              title="Open in Google Maps"
                            >
                              <Navigation className="w-2.5 h-2.5" />
                              <span>Maps</span>
                            </a>
                          </div>
                        </div>

                        {/* Customer & Quoted Fare Details */}
                        <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Passenger Info</span>
                            <strong className="text-white text-xs sm:text-sm block truncate">{ride.customer_name || ride.customerName}</strong>
                            <span className="text-[11px] text-blue-300 font-mono block mt-0.5">{ride.customer_phone || ride.customerPhone}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Quoted Fare</span>
                            <strong className="text-xl font-black font-mono text-emerald-400 block">
                              ₹{Number(ride.quoted_amount || ride.quotedAmount || 0).toLocaleString('en-IN')}
                            </strong>
                            <span className="text-[10px] text-emerald-300/80 block font-medium">Pay Directly to Driver (Cash/UPI)</span>
                          </div>
                        </div>

                        {/* Accept Action Button */}
                        <div className="pt-1 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleAcceptRide(ride)}
                            disabled={acceptingRideId === String(ride.id)}
                            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>{acceptingRideId === String(ride.id) ? 'Accepting…' : 'Accept Ride & Dispatch'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl space-y-2">
                  <Compass className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    No unassigned customer bookings in queue. As soon as a user books a ride on the customer website or mobile app, it will appear here instantly!
                  </p>
                  <button
                    type="button"
                    onClick={handleSimulateCustomerBooking}
                    className="mt-2 px-3 py-1.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-bold rounded-xl border border-blue-700/60 cursor-pointer"
                  >
                    Click to Simulate Instant Customer Booking
                  </button>
                </div>
              )}
            </div>

            {/* SECTION 2: MY ACTIVE ASSIGNED TRIPS & PASSENGER OTP VERIFICATION */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
                  <h4 className="text-base font-black text-white">My Active Trips & Passenger OTP Verification</h4>
                </div>
                <span className="text-xs font-mono font-bold text-blue-300 bg-blue-900/60 px-3 py-1 rounded-xl border border-blue-700">
                  {myAcceptedTrips.length} Active Trip(s)
                </span>
              </div>

              {myAcceptedTrips.length > 0 ? (
                <div className="space-y-4">
                  {myAcceptedTrips.map(trip => {
                    const tripKey = String(trip.id || (trip as any)._id || '');
                    const isEnRoute = trip.status === 'ASSIGNED';
                    const isOnTrip = trip.status === 'ON_TRIP' || trip.status === 'IN_PROGRESS';
                    const otpError = otpErrorMap[tripKey];
                    const sched = formatBookingSchedule(trip.journey_date || trip.journeyDate, trip.journey_time || trip.journeyTime, trip.return_date || trip.returnDate);
                    const tripBadge = getTripTypeBadge(trip.trip_type || trip.tripType);
                    const mapsPickupUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.pickup)}`;
                    const mapsDropUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.destination)}`;

                    return (
                      <div
                        key={tripKey}
                        className="bg-slate-950 rounded-3xl p-6 border border-blue-500/40 shadow-2xl space-y-5"
                      >
                        {/* Status Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                              isEnRoute
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                            }`}>
                              {isEnRoute ? '● Ride Accepted - En Route to Pickup' : '● Live Trip In Progress'}
                            </span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${tripBadge.color}`}>
                              {tripBadge.label}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              Booking #{trip.booking_code || tripKey}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${trip.customer_phone || trip.customerPhone || '+919900227872'}`}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call Passenger</span>
                            </a>
                            <a
                              href={`https://wa.me/${(trip.customer_phone || trip.customerPhone || '919900227872').replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>

                        {/* SCHEDULE & VEHICLE BANNER */}
                        <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/30 rounded-2xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Date & Day</span>
                            <span className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                              <Calendar className="w-3.5 h-3.5 text-blue-400" />
                              <span>{sched.badge ? `${sched.badge} (${sched.dayName})` : sched.dayName}, {sched.formattedDate}</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Pickup Time</span>
                            <span className="font-bold text-amber-300 font-mono text-sm flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>{sched.timeText}</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Vehicle & Capacity</span>
                            <span className="font-bold text-slate-200 truncate flex items-center gap-1.5 mt-0.5" title={trip.vehicle_name || 'Commercial Cab'}>
                              <Car className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{trip.vehicle_name || 'Commercial Cab'} ({trip.passengers || 1} Pass)</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Trip Fare</span>
                            <span className="font-black text-emerald-400 font-mono text-base block mt-0.5">
                              ₹{Number(trip.quoted_amount || trip.quotedAmount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          {sched.returnDateText && (
                            <div className="col-span-2 sm:col-span-4 pt-1 border-t border-slate-800 text-[11px] text-amber-300 flex items-center gap-1">
                              <Repeat className="w-3.5 h-3.5 text-amber-400" />
                              <span>Round Trip Return: <strong>{sched.returnDateText}</strong></span>
                            </div>
                          )}
                        </div>

                        {/* Customer & Route Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Passenger Info</span>
                            <div className="text-sm font-black text-white">{trip.customer_name || trip.customerName}</div>
                            <div className="text-slate-300 font-mono">{trip.customer_phone || trip.customerPhone}</div>
                            <div className="text-slate-400 text-[11px] pt-1">
                              Payment Mode: <strong className="text-amber-300">Pay Directly to Driver (Cash/UPI)</strong>
                            </div>
                          </div>

                          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Route Coordinates</span>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-slate-400 text-[10px] block">Pickup Location</span>
                                <strong className="text-white text-xs block">{trip.pickup}</strong>
                              </div>
                              <a
                                href={mapsPickupUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-300 font-bold text-[10px] shrink-0 flex items-center gap-1 border border-blue-700/60"
                              >
                                <Navigation className="w-2.5 h-2.5" />
                                <span>Maps</span>
                              </a>
                            </div>
                            <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-800">
                              <div>
                                <span className="text-slate-400 text-[10px] block">Drop Destination</span>
                                <strong className="text-white text-xs block">{trip.destination}</strong>
                              </div>
                              <a
                                href={mapsDropUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-300 font-bold text-[10px] shrink-0 flex items-center gap-1 border border-blue-700/60"
                              >
                                <Navigation className="w-2.5 h-2.5" />
                                <span>Maps</span>
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* STEP A: PASSENGER START RIDE OTP VERIFICATION (WHEN STATUS = 'ASSIGNED') */}
                        {isEnRoute && (
                          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-5 rounded-2xl border-2 border-amber-500/60 shadow-xl space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <KeyRound className="w-4 h-4 text-amber-400" />
                                  <span>Enter Passenger 4-Digit Start Ride OTP (Rapido Style):</span>
                                </label>
                                <p className="text-[11px] text-slate-300">
                                  Upon reaching pickup, ask passenger: "Please share the 4-digit Start PIN shown on your screen."
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">
                                  🔒 Secure OTP
                                </span>
                                {(trip as any).start_otp && (
                                  <button
                                    type="button"
                                    onClick={() => setEnteredOtpMap(prev => ({ ...prev, [tripKey]: String((trip as any).start_otp) }))}
                                    className="text-[10px] text-blue-400 hover:text-blue-300 underline font-mono cursor-pointer"
                                    title="Quick fill for test mode"
                                  >
                                    Test Fill PIN: {(trip as any).start_otp}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <input
                                type="text"
                                maxLength={4}
                                value={enteredOtpMap[tripKey] || ''}
                                onChange={e => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  setEnteredOtpMap(prev => ({ ...prev, [tripKey]: val }));
                                }}
                                placeholder="• • • •"
                                className="w-36 px-4 py-3 bg-slate-950 border-2 border-amber-400 rounded-xl text-center text-2xl font-black font-mono tracking-widest text-amber-300 outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-600 shadow-inner"
                              />

                              <button
                                type="button"
                                onClick={() => handleVerifyOtp(trip)}
                                className="flex-1 py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition cursor-pointer flex items-center justify-center gap-2"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Verify OTP & Start Ride</span>
                              </button>
                            </div>

                            {otpError && (
                              <div className="text-xs text-red-300 bg-red-950/50 p-2.5 rounded-xl border border-red-500/40 flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                                <span>{otpError}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* STEP B: TRIP IN-PROGRESS HUD & COMPLETE RIDE (WHEN STATUS = 'ON_TRIP') */}
                        {isOnTrip && (
                          <div className="bg-emerald-950/40 p-5 rounded-2xl border border-emerald-500/50 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                                  <Navigation className="w-5 h-5 animate-spin" />
                                </div>
                                <div>
                                  <h5 className="text-sm font-black text-white">Passenger Onboard • Driving to Destination</h5>
                                  <p className="text-xs text-emerald-300">
                                    En route to {trip.destination} • Drive safely & follow Karnataka speed regulations
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-slate-300 block">Fare to Collect</span>
                                <strong className="text-2xl font-black font-mono text-emerald-400">
                                  ₹{trip.quoted_amount || trip.quotedAmount}
                                </strong>
                              </div>
                            </div>

                            {/* End Trip Action */}
                            <button
                              type="button"
                              onClick={() => handleCompleteTrip(trip)}
                              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-900/40 cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Check className="w-5 h-5 stroke-[3]" />
                              <span>Arrived at Destination • Complete Ride & Collect ₹{trip.quoted_amount || trip.quotedAmount}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  No active rides currently accepted. When you accept an incoming ride request above, it will move into this active workspace for OTP verification and navigation.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB: COCKPIT OVERVIEW (IN DAILY TRIPS MODE) */}
        {/* ============================================================ */}
        {isApprovedDriver && activeTab === 'OVERVIEW' && (
          <div className="space-y-6 animate-fade-in">
            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-[#071B49] rounded-3xl p-6 border border-blue-700/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-blue-300 tracking-wider">Commercial Chauffeur Cockpit</span>
                <h2 className="text-2xl font-black text-white">Welcome back, {driverName}</h2>
                <p className="text-xs text-blue-100">
                  Vehicle: <strong className="text-amber-300 font-mono">{vehicleReg}</strong> ({vehicleType}) • Assigned Chauffeur Partner
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('COMPANY_DUTY')}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Switch to Company Duty</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('TRIPS')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>View Trip Dispatch</span>
                </button>
              </div>
            </div>

            {/* Performance KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-md">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Active Trip Offers</span>
                <div className="text-2xl font-black font-mono text-amber-400 mt-1">{incomingRideRequests.length} Rides</div>
                <span className="text-xs text-slate-500 mt-1 block">Awaiting driver acceptance</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-md">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Completed Trips</span>
                <div className="text-2xl font-black font-mono text-white mt-1">{myCompletedTrips.length} Rides</div>
                <span className="text-xs text-slate-500 mt-1 block">Successfully completed</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-md">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Driver Partner Status</span>
                <div className="text-lg font-black text-blue-300 mt-1 flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                  <span>{isOnline ? 'Online (Ready)' : 'Offline'}</span>
                </div>
                <span className="text-xs text-slate-500 mt-1 block">Service: Bengaluru Zone</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-md">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">KYC & Compliance</span>
                <div className="text-lg font-black text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>100% Commercial RTO</span>
                </div>
                <span className="text-xs text-slate-500 mt-1 block">Yellow board commercial</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB: COMPLETED TRIPS HISTORY (IN DAILY TRIPS MODE) */}
        {/* ============================================================ */}
        {isApprovedDriver && activeTab === 'COMPLETED_TRIPS' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-black text-white">Completed Passenger Rides Ledger</h3>
                  <p className="text-xs text-slate-400">All customer trips completed and fare collected by {driverName}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const headers = ['Booking #', 'Customer', 'Phone', 'Pickup', 'Destination', 'Fare (₹)', 'Payment Method', 'Status'];
                      const rows: (string | number)[][] = myCompletedTrips.map(b => [
                        String(b.booking_code || b.id || ''),
                        String(b.customer_name || b.customerName || 'Customer'),
                        String(b.customer_phone || b.customerPhone || 'N/A'),
                        String(b.pickup || ''),
                        String(b.destination || ''),
                        Number(b.quoted_amount ?? b.quotedAmount ?? 0),
                        String(b.payment_method || 'Pay Directly to Driver'),
                        'COMPLETED'
                      ]);
                      exportToExcel(`SJT_Passenger_Trips_${driverName.replace(/\s+/g, '_')}`, headers, rows);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const headers = ['Booking #', 'Customer', 'Route', 'Fare (₹)', 'Status'];
                      const rows: (string | number)[][] = myCompletedTrips.map(b => [
                        String(b.booking_code || b.id || ''),
                        String(b.customer_name || b.customerName || 'Customer'),
                        `${b.pickup || ''} → ${b.destination || ''}`,
                        `₹${b.quoted_amount ?? b.quotedAmount ?? 0}`,
                        'COMPLETED'
                      ]);
                      printSectionTable('Chauffeur Completed Rides Ledger', `Driver: ${driverName} • Vehicle: ${vehicleReg}`, headers, rows);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 shadow-xs transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>

              {myCompletedTrips.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-800/60 text-slate-400 border-b border-slate-700">
                        <th className="py-2.5 px-3 font-bold">Booking #</th>
                        <th className="py-2.5 px-3 font-bold">Passenger</th>
                        <th className="py-2.5 px-3 font-bold">Route</th>
                        <th className="py-2.5 px-3 font-bold">Payment Method</th>
                        <th className="py-2.5 px-3 font-bold text-right">Fare Collected</th>
                        <th className="py-2.5 px-3 font-bold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {myCompletedTrips.map((b, idx) => (
                        <tr key={b.id || idx} className="hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-mono font-bold text-blue-300">#{b.booking_code || b.id}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-white block">{b.customer_name || b.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{b.customer_phone || b.customerPhone}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {b.pickup} → {b.destination}
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {b.payment_method || 'Cash / UPI Directly to Driver'}
                          </td>
                          <td className="py-3 px-3 font-mono font-black text-right text-emerald-400">
                            ₹{b.quoted_amount || b.quotedAmount}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                              Collected
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  No completed trips recorded yet. Once you complete a passenger trip, it will appear here.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB: SHIFT LOGS & ATTENDANCE HISTORY (IN COMPANY DUTY MODE) */}
        {/* ============================================================ */}
        {isApprovedDriver && activeTab === 'HISTORY' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-black text-white">Full Shift Duty History & Distance Ledger</h3>
                  <p className="text-xs text-slate-400">Complete historical audit trail of all company duty shifts logged by {driverName}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const headers = ['Date', 'Shift Name', 'Company Name', 'Start KM', 'End KM', 'Distance Run (KM)', 'Status'];
                      const rows = myDutyLogs.map(d => [
                        d.duty_date || d.dutyDate || (d.created_at || d.createdAt || '').slice(0, 10),
                        d.shift_name || d.shiftName || 'Company Duty',
                        d.companyName || d.company_name || 'Corporate',
                        d.startKm || d.start_km || 0,
                        d.endKm || d.end_km || 0,
                        d.dailyKm ?? d.daily_km ?? 0,
                        d.status
                      ]);
                      exportToExcel(`SJT_Driver_Shift_History_${driverName.replace(/\s+/g, '_')}`, headers, rows);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const headers = ['Date', 'Shift Name', 'Company Name', 'Start KM', 'End KM', 'Run (KM)', 'Status'];
                      const rows = myDutyLogs.map(d => [
                        d.duty_date || d.dutyDate || (d.created_at || d.createdAt || '').slice(0, 10),
                        d.shift_name || d.shiftName || 'Company Duty',
                        d.companyName || d.company_name || 'Corporate',
                        d.startKm || d.start_km || 0,
                        d.endKm || d.end_km || 0,
                        `${d.dailyKm ?? d.daily_km ?? 0} KM`,
                        d.status
                      ]);
                      printSectionTable('Chauffeur Duty & Shift Ledger', `Driver: ${driverName} • Vehicle: ${vehicleReg}`, headers, rows);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 shadow-xs transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>

              {myDutyLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-800/60 text-slate-400 border-b border-slate-700">
                        <th className="py-2.5 px-3 font-bold">Duty Date</th>
                        <th className="py-2.5 px-3 font-bold">Shift Name</th>
                        <th className="py-2.5 px-3 font-bold">Company / Client</th>
                        <th className="py-2.5 px-3 font-bold">Start KM</th>
                        <th className="py-2.5 px-3 font-bold">End KM</th>
                        <th className="py-2.5 px-3 font-bold text-right">Distance (KM)</th>
                        <th className="py-2.5 px-3 font-bold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {myDutyLogs.map((d, idx) => {
                        const sKm = Number(d.dailyKm ?? d.daily_km ?? 0);
                        return (
                          <tr key={d.id || idx} className="hover:bg-slate-800/40">
                            <td className="py-3 px-3 font-mono text-slate-300">
                              {d.duty_date || d.dutyDate || (d.created_at || d.createdAt || '').slice(0, 10)}
                            </td>
                            <td className="py-3 px-3 font-bold text-emerald-400">{d.shift_name || d.shiftName || `Shift`}</td>
                            <td className="py-3 px-3 font-bold text-white">{d.companyName || d.company_name || 'Client Duty'}</td>
                            <td className="py-3 px-3 font-mono text-slate-300">{d.startKm || d.start_km}</td>
                            <td className="py-3 px-3 font-mono text-slate-300">{d.endKm || d.end_km || '—'}</td>
                            <td className="py-3 px-3 font-mono font-black text-right text-emerald-400">{sKm} KM</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                                {d.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  No past duties found in the archive for this driver.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB: CHAUFFEUR DOCUMENTS & KYC */}
        {/* ============================================================ */}
        {activeTab === 'KYC' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-black text-white">Chauffeur KYC Verification & Compliance Profile</h3>
                  <p className="text-xs text-slate-400">RTO driving license, vehicle yellow board registration, and insurance verification</p>
                </div>
                <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                  isApprovedDriver 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}>
                  {isApprovedDriver ? '✓ Verified Commercial Partner' : '⏳ KYC Audit Under Admin Review'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Legal Name</span>
                  <strong className="text-sm font-black text-white">{driverName}</strong>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Registered Mobile Phone</span>
                  <strong className="text-sm font-mono font-bold text-blue-300">{driverPhone}</strong>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vehicle Registration #</span>
                  <strong className="text-sm font-mono font-bold text-amber-300">{vehicleReg}</strong>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vehicle Category</span>
                  <strong className="text-sm font-bold text-white">{vehicleType}</strong>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Commercial Permit</span>
                  <strong className="text-sm font-bold text-emerald-400">Karnataka State All-India Tourist Permit</strong>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Operating Base</span>
                  <strong className="text-sm font-bold text-white">Bengaluru Commercial Hub</strong>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ============================================================ */}
      {/* TRIP COMPLETION RECEIPT MODAL */}
      {/* ============================================================ */}
      {tripCompletedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-white">Trip Completed Successfully!</h3>
            <p className="text-xs text-slate-300">
              Booking #{tripCompletedReceipt.booking_code || tripCompletedReceipt.id} has ended and fare has been recorded.
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Passenger:</span>
                <strong className="text-white">{tripCompletedReceipt.customer_name || tripCompletedReceipt.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Route:</span>
                <span className="text-slate-200 truncate max-w-[200px]">{tripCompletedReceipt.pickup} → {tripCompletedReceipt.destination}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400 font-bold">Total Fare Collected:</span>
                <strong className="text-emerald-400 font-mono text-base font-black">
                  ₹{tripCompletedReceipt.quoted_amount || tripCompletedReceipt.quotedAmount}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTripCompletedReceipt(null)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow cursor-pointer"
            >
              Continue to Cockpit
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SHIFT COMPLETION SUMMARY & ADVANCE TO NEXT SHIFT MODAL */}
      {/* ============================================================ */}
      {completedShiftSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl text-left space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">{completedShiftSummary.shiftName} Concluded!</h4>
                  <p className="text-xs text-slate-400">Shift logged & synced to SJT Central ERP</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-mono font-bold text-xs">
                ⏱ {completedShiftSummary.durationHours} Hours ({completedShiftSummary.durationFormatted})
              </span>
            </div>

            {/* Shift Details Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Client / Company</span>
                <strong className="text-white text-sm mt-0.5 block truncate">{completedShiftSummary.companyName}</strong>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Distance Run</span>
                <strong className="text-emerald-400 font-mono text-base font-black mt-0.5 block">
                  {completedShiftSummary.kmRun} <span className="text-xs font-normal text-slate-300">KM</span>
                </strong>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Starting Odometer</span>
                <span className="text-slate-200 font-mono font-bold text-xs mt-0.5 block">
                  {completedShiftSummary.startKm} KM
                </span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Ending Odometer</span>
                <span className="text-emerald-300 font-mono font-bold text-xs mt-0.5 block">
                  {completedShiftSummary.endKm} KM
                </span>
              </div>
              <div className="col-span-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Route Covered</span>
                <span className="text-slate-200 text-xs mt-0.5 block truncate">
                  {completedShiftSummary.route}
                </span>
              </div>
            </div>

            {/* Actions: Continue to Next Shift or Switch to Daily Trips */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCompletedShiftSummary(null);
                  setTimeout(() => {
                    const el = document.getElementById('shift-company-input');
                    if (el) el.focus();
                  }, 100);
                }}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-900/40 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Continue to {completedShiftSummary.nextShiftName} ({completedShiftSummary.endKm} Start KM Pre-filled) ➔</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCompletedShiftSummary(null);
                  handleSwitchMode('REGULAR');
                }}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Car className="w-4 h-4 text-emerald-400" />
                <span>All Shift Duties Done for Today • Switch to Daily Trips Driver</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FOOTER */}
      {/* ============================================================ */}
      <footer className="bg-[#030c24] text-slate-500 text-xs py-4 border-t border-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Sharanajyoti Tours & Travels Pvt. Ltd. • Chauffeur & Commercial Fleet Operating System</span>
          <div className="flex items-center gap-3">
            <a href="https://sjttarvels.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              Customer Website
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

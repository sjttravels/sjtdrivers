import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';

const DRIVER_API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:5000`
  : 'http://localhost:5000');
import { 
  Car, 
  MapPin, 
  Play, 
  Building, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Phone, 
  Calendar, 
  AlertCircle,
  FileText,
  BadgeCheck,
  Eye,
  EyeOff,
  Check,
  X,
  Smartphone,
  Maximize2,
  Minimize2,
  ArrowRight,
  ArrowLeft,
  User as UserIcon,
  Bell,
  Navigation,
  Compass,
  Briefcase,
  Wallet,
  Wifi,
  Battery,
  Signal,
  RotateCcw,
  MessageSquare,
  Lock,
  ChevronRight,
  Send,
  Camera,
  Layers,
  Sparkles,
  Building2,
  Gauge,
  Zap,
  Plus,
  CheckCheck,
  Globe
} from 'lucide-react';

export type DriverAppSlide = 
  | 1  // Splash Screen
  | 2  // Onboarding
  | 3  // Driver Login
  | 4  // Sign Up Screen
  | 5  // Select Driver Type
  | 6  // Dashboard
  | 7  // Duty Check-in (Company Duty Flow)
  | 8  // Duty Active
  | 9  // Incoming Request
  | 10 // Trip Accepted
  | 11 // Trip Details
  | 12 // Navigate to Pickup
  | 13 // Trip Started
  | 14 // During Trip
  | 15 // End Trip
  | 16 // Attendance & History
  | 17; // Driver profile, documents and face verification

const DRIVER_SLIDE_LABELS: Record<DriverAppSlide, string> = {
  1: 'Splash Screen',
  2: 'Onboarding',
  3: 'Login Screen',
  4: 'Sign Up Screen',
  5: 'Select Driver Type',
  6: 'Dashboard',
  7: 'Duty Check-in (Company Duty)',
  8: 'Duty Active',
  9: 'Incoming Request',
  10: 'Trip Accepted',
  11: 'Trip Details',
  12: 'Navigate to Pickup',
  13: 'Trip Started',
  14: 'During Trip',
  15: 'End Trip',
  16: 'Attendance & History',
  17: 'Driver Verification'
};

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
    return { label: 'City Ride', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  }
  if (clean.includes('LOCAL') || clean.includes('8HR')) {
    return { label: 'Local (8hr/80km Rental)', color: 'bg-blue-100 text-blue-800 border-blue-300' };
  }
  if (clean.includes('AIRPORT')) {
    return { label: 'Airport Transfer', color: 'bg-purple-100 text-purple-800 border-purple-300' };
  }
  if (clean.includes('ROUND')) {
    return { label: 'Round Trip Outstation', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  }
  return { label: 'Outstation One-Way', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
}

export const DriverPortal: React.FC = () => {
  const { 
    currentDriver, 
    currentUser,
    driverKyc,
    refreshDriverKyc,
    submitDriverKyc,
    setCurrentDriverId, 
    drivers, 
    bookings, 
    refreshData,
    updateBookingStatus,
    assignDriverToBooking,
    dutyLogs,
    startCompanyDuty,
    endCompanyDuty,
    activeDuty,
    login,
    register,
    createTransaction,
    logout,
    setActiveView,
    standaloneMode,
    activeTripOtp
  } = useApp();

  // Slide navigation state (1 to 16)
  const [currentSlide, setCurrentSlide] = useState<DriverAppSlide>(standaloneMode && currentUser?.role !== 'DRIVER' ? 3 : 6);
  const [bezelMode, setBezelMode] = useState<boolean>(true);
  const [showDriverSlidePicker, setShowDriverSlidePicker] = useState<boolean>(false);
  const [driverEnteredOtp, setDriverEnteredOtp] = useState<string>('');

  // Driver Identity state
  const [driverName, setDriverName] = useState(currentDriver?.name || 'Ramesh Kumar');
  const [driverPhone, setDriverPhone] = useState(currentDriver?.phone || '+91 98765 43210');
  const [vehicleReg, setVehicleReg] = useState('KA 05 AB 1234');
  const [vehicleType, setVehicleType] = useState('Tempo Traveller (17 Seater)');
  const [isOnline, setIsOnline] = useState(false);
  const [serviceArea, setServiceArea] = useState('');
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);

  // Driver Login & Sign Up Forms
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpVehicleNo, setSignUpVehicleNo] = useState('');
  const [signUpVehicleType, setSignUpVehicleType] = useState('Tempo Traveller');
  const [signUpLoginId, setSignUpLoginId] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [driverAddress, setDriverAddress] = useState('');
  const [driverExperience, setDriverExperience] = useState('');
  const [driverLicenseNumber, setDriverLicenseNumber] = useState('');
  const [driverAadhaarNumber, setDriverAadhaarNumber] = useState('');
  const [driverPanNumber, setDriverPanNumber] = useState('');
  const [documentFiles, setDocumentFiles] = useState<Record<string, { name: string; data: string; expires_at?: string }>>({});
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});
  const [onboardingError, setOnboardingError] = useState('');
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [dutyOdometer, setDutyOdometer] = useState('');
  const [dutyEndOdometer, setDutyEndOdometer] = useState('');
  const [dutyCheckInError, setDutyCheckInError] = useState('');
  const [dutyCheckInSaving, setDutyCheckInSaving] = useState(false);

  // Driver Type Selection: Regular Trips vs Company Duty
  const [driverTypeChoice, setDriverTypeChoice] = useState<'REGULAR' | 'COMPANY_DUTY'>('REGULAR');
  useEffect(() => {
    if (currentUser?.role !== 'DRIVER') return;
    const savedMode = localStorage.getItem(`sjt_driver_mode_${currentUser.id}`);
    const preferredMode = savedMode === 'COMPANY_DUTY' || currentUser.duty_mode === 'COMPANY_DUTY' ? 'COMPANY_DUTY' : 'REGULAR';
    setDriverTypeChoice(activeDuty ? 'COMPANY_DUTY' : preferredMode);
  }, [currentUser?.id, currentUser?.role, currentUser?.duty_mode, activeDuty?.id]);

  // Company Duty Check-in / Active Duty State & Multi-Shift System (Supports Shift 1 to 10+)
  const [dutyShift, setDutyShift] = useState<string>('Shift 1');
  const [showCustomShiftInput, setShowCustomShiftInput] = useState<boolean>(false);
  const [customShiftName, setCustomShiftName] = useState<string>('');
  
  // Real Driver Input States (Clean & Empty by default - driver fills them)
  const [dutyCompany, setDutyCompany] = useState('');
  const [dutyTripId, setDutyTripId] = useState('');
  const [dutyPickup, setDutyPickup] = useState('');
  const [dutyDestination, setDutyDestination] = useState('');
  const [dutyRoute, setDutyRoute] = useState('');
  const [dutyStartKm, setDutyStartKm] = useState('');
  const [dutyTimerSeconds, setDutyTimerSeconds] = useState(0);

  // Ride Request & Live Trip State
  const [requestCountdown, setRequestCountdown] = useState(30);
  const [requestTripId, setRequestTripId] = useState('');
  const [customerName, setCustomerName] = useState('Aravind K');
  const [customerPhone, setCustomerPhone] = useState('+91 98765 43210');
  const [fromLocation, setFromLocation] = useState('Bengaluru (MG Road)');
  const [toLocation, setToLocation] = useState('Mysuru Palace, Mysuru');
  const [tripFare, setTripFare] = useState(5500);
  const [tripDate, setTripDate] = useState('');
  const [tripTime, setTripTime] = useState('');
  const [tripReturnDate, setTripReturnDate] = useState('');
  const [tripType, setTripType] = useState('');
  const [tripPassengers, setTripPassengers] = useState(4);
  const [tripVehicleName, setTripVehicleName] = useState('Commercial Cab');
  const [odometerStart, setOdometerStart] = useState('125450');
  const [odometerEnd, setOdometerEnd] = useState('125596');
  const [tripTimerSeconds, setTripTimerSeconds] = useState(12);

  // Attendance & History Tab
  const [historyTab, setHistoryTab] = useState<'DAILY_LOG' | 'TRIP_HISTORY'>('DAILY_LOG');
  const driverId = currentUser?.role === 'DRIVER' ? currentUser.id : (currentDriver?.id || currentDriver?._id || currentUser?.id);
  const signedInDriver = drivers.find(driver => String(driver.id || driver._id) === String(driverId)) || (String(currentDriver?.id || currentDriver?._id) === String(driverId) ? currentDriver : null);
  const myDutyLogs = dutyLogs.filter(d => String(d.driver_id || d.driverId) === String(driverId));
  const indiaToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const currentMonth = indiaToday.slice(0, 7);
  const myMonthDuties = myDutyLogs.filter(d => String(d.duty_date || d.dutyDate || d.created_at || d.createdAt || '').startsWith(currentMonth) && String(d.status).toUpperCase() !== 'REJECTED');
  const attendanceDays = new Set(myMonthDuties.map(d => d.duty_date || d.dutyDate || (d.created_at || d.createdAt || '').slice(0, 10)).filter(Boolean)).size;
  const completedMonthDuties = myMonthDuties.filter(d => (d.logoutTime || d.logout_time) && ['SUBMITTED', 'VERIFIED', 'VERIFIED_BY_ADMIN'].includes(String(d.status).toUpperCase()));
  const monthKm = completedMonthDuties.reduce((sum, d) => sum + Number(d.dailyKm ?? d.daily_km ?? 0), 0);
  const todayDutyKm = myDutyLogs.filter(d => String(d.duty_date || d.dutyDate || d.created_at || d.createdAt || '').startsWith(indiaToday)).reduce((sum, d) => sum + Number(d.dailyKm ?? d.daily_km ?? 0), 0);
  
  // Multi-Shift Duty Logs & KM Aggregations for Today (Supports Multiple Shifts: Shift 1 to 10+)
  const todayDuties = myDutyLogs.filter(d => {
    const dDate = d.duty_date || d.dutyDate || (d.created_at || d.createdAt || '').slice(0, 10);
    return dDate === indiaToday && String(d.status).toUpperCase() !== 'REJECTED';
  });

  // Helper to find a specific shift log from today with exact matching
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

  const todayShift1 = getTodayShiftDuty('shift 1');
  const todayShift2 = getTodayShiftDuty('shift 2');
  const todayShift3 = getTodayShiftDuty('shift 3');
  const totalTodayShiftKm = todayDuties.reduce((sum, d) => sum + Number(d.dailyKm ?? d.daily_km ?? 0), 0);
  const todayCompletedShiftsCount = todayDuties.filter(d => d.logoutTime || d.logout_time).length;

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

  // Retrieve the latest ending odometer reading from today's completed duties
  const lastCompletedDuty = [...todayDuties].reverse().find(d => (d.logoutTime || d.logout_time) && (d.endKm || d.end_km));
  const lastCompletedEndKm = lastCompletedDuty ? Number(lastCompletedDuty.endKm || lastCompletedDuty.end_km) : null;

  // Auto-switch dutyShift to nextAvailableShift if current dutyShift is already completed today
  useEffect(() => {
    if (activeDuty) {
      const activeShiftName = activeDuty.shift_name || activeDuty.shiftName;
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
  }, [todayDuties, dutyShift, nextAvailableShift, activeDuty]);

  // Auto-fill starting odometer with last completed shift's ending odometer if empty
  useEffect(() => {
    if (!activeDuty && lastCompletedEndKm !== null && !dutyOdometer) {
      setDutyOdometer(String(lastCompletedEndKm));
      setDutyStartKm(String(lastCompletedEndKm));
    }
  }, [lastCompletedEndKm, activeDuty]);
  const myBookings = bookings.filter(b => String(b.assigned_driver_id || b.assignedDriverId || '') === String(driverId));
  const pendingDailyTrip = myBookings.find(b => String(b.status).toUpperCase() === 'ASSIGNED') || availableRides[0] || null;
  const newRequestCount = myBookings.filter(b => ['ASSIGNED', 'CONFIRMED'].includes(String(b.status).toUpperCase())).length + availableRides.length;
  const ongoingTripCount = myBookings.filter(b => ['ON_TRIP', 'IN_PROGRESS'].includes(String(b.status).toUpperCase())).length;
  const todayTripEarnings = myBookings.filter(b => String(b.journey_date || b.journeyDate || b.created_at || '').startsWith(indiaToday) && String(b.status).toUpperCase() === 'COMPLETED').reduce((sum, b) => sum + Number((b as any).driver_payout || (b as any).driverPayout || 0), 0);
  const salarySettings = signedInDriver?.monthlySalarySettings;
  const monthlyAllowances = myMonthDuties.reduce((sum, duty) => sum + Number(duty.allowances || 0), 0);
  const estimatedMonthlyPay = Number(salarySettings?.baseSalary || 0) + attendanceDays * 250 + Math.round(monthKm * Number(salarySettings?.perKmRate || 0)) + completedMonthDuties.length * Number(salarySettings?.perDutyAllowance || 0) + monthlyAllowances;
  const displayTime = (value?: string) => value ? value : 'Not recorded';
  const canTakeDailyTrips = currentUser?.role === 'DRIVER' && driverTypeChoice === 'REGULAR' && !activeDuty && isOnline;
  const handleDriverModeSwitch = () => {
    if (activeDuty) return;
    const nextMode = driverTypeChoice === 'REGULAR' ? 'COMPANY_DUTY' : 'REGULAR';
    setDriverTypeChoice(nextMode);
    if (nextMode === 'COMPANY_DUTY' && isOnline) void saveDriverAvailability(false);
    if (currentUser?.id) localStorage.setItem(`sjt_driver_mode_${currentUser.id}`, nextMode);
  };

  useEffect(() => {
    if (currentUser?.role !== 'DRIVER') return;
    let active = true;
    fetch(`${DRIVER_API_BASE}/api/driver/availability`, { headers: { Authorization: `Bearer ${localStorage.getItem('sjt_token') || ''}` } })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Availability could not be loaded.');
        if (active) { setIsOnline(Boolean(data.is_online)); setServiceArea(data.service_area || ''); }
      })
      .catch(error => console.error('Driver availability load failed:', error));
    return () => { active = false; };
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (activeDuty && isOnline) setIsOnline(false);
  }, [activeDuty?.id, isOnline]);

  useEffect(() => {
    if (currentUser?.role !== 'DRIVER' || !isOnline || activeDuty || driverTypeChoice !== 'REGULAR') {
      setAvailableRides([]);
      return;
    }
    let active = true;
    const loadOffers = async () => {
      try {
        const response = await fetch(`${DRIVER_API_BASE}/api/driver/available-bookings`, { headers: { Authorization: `Bearer ${localStorage.getItem('sjt_token') || ''}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Nearby requests could not be loaded.');
        if (active) setAvailableRides(Array.isArray(data) ? data : []);
      } catch (error) {
        if (active) console.error('Driver ride request refresh failed:', error);
      }
    };
    void loadOffers();
    const timer = window.setInterval(loadOffers, 12000);
    return () => { active = false; window.clearInterval(timer); };
  }, [currentUser?.id, currentUser?.role, isOnline, activeDuty?.id, driverTypeChoice]);

  const saveDriverAvailability = async (nextOnline: boolean) => {
    setAvailabilitySaving(true);
    try {
      const response = await fetch(`${DRIVER_API_BASE}/api/driver/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('sjt_token') || ''}` },
        body: JSON.stringify({ is_online: nextOnline, service_area: serviceArea })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update your availability.');
      setIsOnline(Boolean(data.is_online));
      setServiceArea(data.service_area || '');
      if (!data.is_online) setAvailableRides([]);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not update your availability.');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  // Countdown timer for Slide 9 (Incoming Request)
  useEffect(() => {
    let timer: any;
    if (currentSlide === 9 && requestCountdown > 0) {
      timer = setInterval(() => {
        setRequestCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentSlide, requestCountdown]);

  // Live timer for Slide 8 (Company Duty Active)
  useEffect(() => {
    let timer: any;
    if (currentSlide === 8) {
      const checkedInAt = activeDuty?.createdAt || activeDuty?.created_at;
      if (checkedInAt) {
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 1000));
        setDutyTimerSeconds(elapsedSeconds);
      }
      timer = setInterval(() => {
        setDutyTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentSlide, activeDuty?.createdAt, activeDuty?.created_at]);

  // Live timer for Slide 13 (Trip Started)
  useEffect(() => {
    let timer: any;
    if (currentSlide === 13) {
      timer = setInterval(() => {
        setTripTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentSlide]);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [activeDutyLogId, setActiveDutyLogId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.role !== 'DRIVER') return;
    setDriverName(currentUser.name);
    setDriverPhone(currentUser.phone);
    setVehicleReg(driverKyc?.vehicle_reg || currentUser.assigned_vehicle || '');
    setVehicleType(driverKyc?.vehicle_type || '');
    const refresh = () => refreshDriverKyc().catch(() => undefined);
    refresh();
    const timer = window.setInterval(refresh, 10000);
    return () => window.clearInterval(timer);
  }, [currentUser?.id, currentUser?.role, driverKyc?.vehicle_reg, driverKyc?.vehicle_type]);

  const readSelectedFile = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read file.'));
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });

  const handleDocumentSelect = async (key: string, file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setOnboardingError('Each document must be 5 MB or smaller.'); return; }
    if (!(file.type === 'application/pdf' || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) { setOnboardingError('Upload a JPG, PNG, WebP or PDF document.'); return; }
    try {
      const data = await readSelectedFile(file);
      setDocumentFiles(prev => ({ ...prev, [key]: { ...prev[key], name: file.name, data } }));
      setOnboardingError('');
    } catch (error) {
      setOnboardingError(error instanceof Error ? error.message : 'Could not read this file.');
    }
  };

  const handleSubmitOnboarding = async () => {
    setOnboardingSaving(true);
    setOnboardingError('');
    try {
      const email = currentUser?.email;
      if (!email) throw new Error('Sign in to submit your documents.');
      const requiredFields: Array<[string, string]> = [
        ['Residential address', driverAddress],
        ['Driving licence number', driverLicenseNumber],
        ['Aadhaar number', driverAadhaarNumber],
        ['PAN number', driverPanNumber],
        ['Vehicle registration number', signUpVehicleNo],
        ['Vehicle type', signUpVehicleType]
      ];
      const missingField = requiredFields.find(([, value]) => !value.trim());
      if (missingField) throw new Error(`Enter your ${missingField[0].toLocaleLowerCase()}.`);
      if (!driverExperience.trim() || !Number.isInteger(Number(driverExperience)) || Number(driverExperience) < 0) throw new Error('Enter your driving experience in whole years.');
      const documentKeys = ['rc', 'insurance', 'emissions', 'fitness', 'b_extract', 'permit', 'road_tax', 'dl', 'aadhaar', 'pan'];
      const missingDocument = documentKeys.find(key => !documentFiles[key]?.data && !driverKyc?.documents?.[key]?.storage_key);
      if (missingDocument) throw new Error(`Upload your ${missingDocument.replace('_', ' ')} document.`);
      if (!documentFiles.face?.data && !driverKyc?.face_document?.storage_key) throw new Error('Upload a fresh face verification selfie.');
      const expiryKeys = ['rc', 'insurance', 'emissions', 'fitness', 'permit', 'road_tax', 'dl'];
      const missingExpiry = expiryKeys.find(key => !(expiryDates[key] || driverKyc?.documents?.[key]?.expires_at));
      if (missingExpiry) throw new Error(`Enter the expiry date for your ${missingExpiry.replace('_', ' ')}.`);
      const documents = Object.fromEntries(documentKeys.map(key => [key, {
        ...(documentFiles[key] || {}),
        ...(expiryDates[key] ? { expires_at: expiryDates[key] } : driverKyc?.documents?.[key]?.expires_at ? { expires_at: driverKyc.documents[key].expires_at } : {})
      }]));
      await submitDriverKyc({
        driver_name: currentUser?.name || signUpName,
        driver_phone: currentUser?.phone || signUpPhone,
        driver_email: email,
        license_number: driverLicenseNumber,
        aadhar_number: driverAadhaarNumber,
        pan_number: driverPanNumber,
        vehicle_preference: signUpVehicleType,
        vehicle_type: signUpVehicleType,
        vehicle_reg: signUpVehicleNo,
        address: driverAddress,
        experience_years: Number(driverExperience),
        documents: documents as any,
        face_document: documentFiles.face || {}
      } as any);
      setCurrentSlide(17);
    } catch (error) {
      setOnboardingError(error instanceof Error ? error.message : 'Could not submit your verification documents.');
    } finally {
      setOnboardingSaving(false);
    }
  };

  const handleDutyCheckIn = async () => {
    setDutyCheckInError('');
    if (currentUser?.role !== 'DRIVER') { setDutyCheckInError('Sign in with your driver account before checking in.'); return; }
    if (driverKyc?.kyc_status !== 'APPROVED') { setDutyCheckInError('Company duty check-in is available after admin approval of your driver documents.'); return; }
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
    if (dutyPickup.trim().toLocaleLowerCase() === dutyDestination.trim().toLocaleLowerCase()) {
      setDutyCheckInError('Pickup and destination must be different places.');
      return;
    }
    const startKm = Number(dutyOdometer);
    if (!dutyOdometer.trim() || !Number.isFinite(startKm) || startKm < 0) { 
      setDutyCheckInError('Enter your current starting odometer reading (KM).'); 
      return; 
    }
    if (activeDuty) { setDutyCheckInError('You already have an active company duty. Check out before starting another.'); return; }
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
        vehicleReg: driverKyc?.assigned_vehicle_reg || vehicleReg,
        vehicleName: vehicleType || '',
        startKm,
        pickupLocation: dutyPickup.trim(),
        destinationLocation: dutyDestination.trim(),
        routeDetails: `[${dutyShift}] ${dutyCompany.trim()} | ${dutyPickup.trim()} → ${dutyDestination.trim()}`,
      });
      if (duty?.id) setActiveDutyLogId(duty.id);
      setDutyStartKm(String(startKm));
      setDutyTimerSeconds(0);
      setDutyEndOdometer('');
    } catch (err) {
      setDutyCheckInError(err instanceof Error ? err.message : 'Could not start company duty.');
      return;
    } finally {
      setDutyCheckInSaving(false);
    }
    setCurrentSlide(8); // Duty Active
  };

  const handleDutyEnd = async () => {
    try {
      const targetDutyId = activeDutyLogId || activeDuty?.id;
      const endKm = Number(dutyEndOdometer);
      if (!targetDutyId) throw new Error('No active company duty was found.');
      if (!Number.isFinite(endKm) || endKm < Number(activeDuty?.startKm || dutyStartKm)) throw new Error('Enter an ending odometer at or above the starting reading.');
      await endCompanyDuty({ dutyId: targetDutyId, endKm, tollParking: 0, foodAllowance: 0 });
      await refreshData();
      
      // Auto advance to next sequential shift (Shift 1 -> Shift 2 -> Shift 3 ... -> Shift 10)
      const match = dutyShift.match(/\d+/);
      if (match) {
        const nextNum = parseInt(match[0], 10) + 1;
        setDutyShift(`Shift ${nextNum}`);
      } else {
        setDutyShift('Shift 2');
      }

      // Auto-set the starting odometer of the next shift to this shift's ending reading
      setDutyOdometer(String(endKm));
      setDutyStartKm(String(endKm));
      setDutyEndOdometer('');
      setDutyPickup('');
      setDutyDestination('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not check out of company duty.');
      return;
    }
    setCurrentSlide(7); // Show updated shift summary in company duty view
  };

  const handleDeclineRide = async () => {
    if (pendingDailyTrip?.id) {
      try {
        await fetch(`${DRIVER_API_BASE}/api/driver/available-bookings/${pendingDailyTrip.id}/decline`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('sjt_token') || ''}` }
        });
        setAvailableRides(prev => prev.filter(r => r.id !== pendingDailyTrip.id));
      } catch (e) {
        console.warn('Decline ride error:', e);
      }
    }
    setCurrentSlide(6);
  };

  const handleAcceptRide = async () => {
    if (!canTakeDailyTrips) { alert('Check out of company duty and switch to Daily Trips before accepting a ride.'); return; }
    try {
      const dId = String(driverId || '');
      const targetBooking = pendingDailyTrip;
      if (!targetBooking?.id || !dId) throw new Error('There is no available request for this driver.');
      let acceptedBooking: any = targetBooking;
      if (targetBooking.dispatch_status === 'OFFER') {
        const response = await fetch(`${DRIVER_API_BASE}/api/driver/available-bookings/${targetBooking.id}/accept`, {
          method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('sjt_token') || ''}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'This ride is no longer available.');
        acceptedBooking = data.booking;
      } else {
        if (String(targetBooking.assigned_driver_id || targetBooking.assignedDriverId) !== dId) throw new Error('This trip is not assigned to your driver account.');
        await updateBookingStatus(targetBooking.id, 'ASSIGNED');
      }
      await refreshData(true);
      setRequestTripId(acceptedBooking.booking_code || acceptedBooking.bookingCode || '');
      setCustomerName(acceptedBooking.customer_name || acceptedBooking.customerName || 'Customer');
      setCustomerPhone(acceptedBooking.customer_phone || acceptedBooking.customerPhone || '');
      setFromLocation(acceptedBooking.pickup);
      setToLocation(acceptedBooking.destination);
      setTripFare(Number(acceptedBooking.quoted_amount || acceptedBooking.quotedAmount || 0));
      setVehicleReg(acceptedBooking.vehicle_reg || currentDriver?.assignedVehicleReg || '');
      setTripDate(acceptedBooking.journey_date || acceptedBooking.journeyDate || '');
      setTripTime(acceptedBooking.journey_time || acceptedBooking.journeyTime || '');
      setTripReturnDate(acceptedBooking.return_date || acceptedBooking.returnDate || '');
      setTripType(acceptedBooking.trip_type || acceptedBooking.tripType || '');
      setTripPassengers(Number(acceptedBooking.passengers) || 4);
      setTripVehicleName(acceptedBooking.vehicle_name || acceptedBooking.vehicleName || 'Commercial Cab');
    } catch (e) {
      console.error('Could not accept ride:', e);
      alert(e instanceof Error ? e.message : 'Could not accept this ride. Refresh and try again.');
      return;
    }
    setCurrentSlide(10); // Trip Accepted
  };

  const handleStartTrip = async () => {
    if (!canTakeDailyTrips) { alert('Daily trips are unavailable while company duty is active or Daily Trips mode is off.'); return; }
    if (!driverEnteredOtp.trim()) {
      alert('Please enter the 4-digit Start Ride OTP told by the customer.');
      return;
    }
    try {
      const targetBooking = bookings.find((b: any) => (b.booking_code || b.bookingCode) === requestTripId);
      const codeOrId = targetBooking?.booking_code || targetBooking?.id || requestTripId;
      const res = await fetch(`${DRIVER_API_BASE}/api/bookings/${encodeURIComponent(codeOrId)}/start-trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: driverEnteredOtp.trim(), start_odometer: Number(odometerStart) || 125450 })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Invalid OTP! Please ask the customer for the 4-digit PIN shown on their screen.');
        return;
      }
      if (targetBooking?.id) {
        await updateBookingStatus(targetBooking.id, 'ON_TRIP');
      }
      alert('✓ Start Ride OTP Verified! Passenger onboard.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not start this trip.');
      return;
    }
    setCurrentSlide(13); // Trip Started
  };

  const handleCompleteTrip = async () => {
    try {
      const targetBooking = bookings.find((b: any) => (b.booking_code || b.bookingCode) === requestTripId);
      if (targetBooking?.id) {
        await updateBookingStatus(targetBooking.id, 'COMPLETED');
        await fetch(`${DRIVER_API_BASE}/api/bookings/${encodeURIComponent(requestTripId)}/complete-trip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            end_odometer: Number(odometerEnd) || 125596,
            amount_collected: tripFare,
            payment_method: 'CASH',
            notes: `Customer trip completed: ${fromLocation} to ${toLocation}`
          })
        }).catch(err => console.warn('complete-trip API sync warn:', err));
      } else throw new Error('The assigned booking could not be found. Refresh and try again.');
      // Record payout in Accounts
      await createTransaction({
        type: 'PAY_OUT',
        category: 'DRIVER_DUTY_SETTLEMENT',
        title: `Trip Settlement: ${driverName} (${requestTripId})`,
        amount: 4500,
        payment_mode: 'UPI',
        reference_no: `SETTLE-${Math.floor(100000 + Math.random() * 900000)}`,
        party_name: driverName,
        party_type: 'DRIVER',
        related_booking_code: requestTripId,
        date: new Date().toISOString().split('T')[0],
        status: 'COMPLETED',
        notes: `Outstation trip completion: ${fromLocation} to ${toLocation} (146 km)`
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not complete this trip.');
      return;
    }
    setCurrentSlide(16); // Attendance & History
  };

  return (
    <div className="py-6 px-3 min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-start font-sans">
      {/* If Showcase Mode: Show Top Header & Slide Quick Switcher */}
      {!standaloneMode && (
        <div className="w-full max-w-5xl mb-4 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 border-b border-slate-700/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Driver App Flow • 16 Slides
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Fast Commercial Dispatch Engine</span>
                </div>
                <h1 className="text-lg font-black text-white">
                  SJT Chauffeur & Driver Network App
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveView('DRIVER_WEB')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-700/30 border border-emerald-400/40"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Driver Website (Desktop)</span>
              </button>
              <button
                onClick={() => setBezelMode(!bezelMode)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors flex items-center gap-1.5 border border-slate-600"
              >
                {bezelMode ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                <span>{bezelMode ? 'Full Width' : 'Phone Frame'}</span>
              </button>
              <button
                onClick={() => setActiveView('CUSTOMER_MOBILE')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                User App (14 Slides)
              </button>
              <button
                onClick={() => setActiveView('CUSTOMER_WEB')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white transition-colors"
              >
                Website Booking
              </button>
              <button
                onClick={() => setActiveView('ADMIN_PANEL')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Admin Accounts
              </button>
            </div>
          </div>

          {/* 16 Slides Navigation Stepper Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                Active Driver Slide: <strong className="text-emerald-400">Slide {currentSlide}: {DRIVER_SLIDE_LABELS[currentSlide]}</strong>
              </span>
              <span className="text-[11px] text-emerald-300">
                Click any slide number below to jump directly to any driver screen
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-slate-700">
              {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] as DriverAppSlide[]).map((slide) => (
                <button
                  key={slide}
                  onClick={() => {
                    setCurrentSlide(slide);
                    if (slide === 9) setRequestCountdown(30);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                    currentSlide === slide
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 scale-105'
                      : 'bg-slate-800/90 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
                    {slide}
                  </span>
                  <span className="hidden sm:inline">{DRIVER_SLIDE_LABELS[slide].split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Standalone Driver Header Bar */}
      {standaloneMode && (
        <div className="w-full max-w-[420px] mb-3 flex items-center justify-between text-xs px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-white block text-xs tracking-tight">SJT CHAUFFEUR NETWORK</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Driver Duty & KYC Portal • Live
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBezelMode(!bezelMode)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer"
            >
              {bezelMode ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              <span>{bezelMode ? 'Full Width' : 'Phone Frame'}</span>
            </button>
            <button
              onClick={() => setShowDriverSlidePicker(!showDriverSlidePicker)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
              title="Click to jump to any screen"
            >
              Screen {currentSlide}/16 ▾
            </button>
          </div>
        </div>
      )}

      {/* Standalone Collapsible Screen Navigator */}
      {standaloneMode && showDriverSlidePicker && (
        <div className="w-full max-w-[420px] mb-3 p-2.5 bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5 px-1">
            <span>Direct Screen Selector:</span>
            <button onClick={() => setShowDriverSlidePicker(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-1">
            {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] as DriverAppSlide[]).map((slide) => (
              <button
                key={slide}
                onClick={() => {
                  setCurrentSlide(slide);
                  setShowDriverSlidePicker(false);
                }}
                className={`p-1.5 rounded-xl text-[10px] font-bold text-left truncate flex items-center gap-1.5 border transition-all ${
                  currentSlide === slide
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-black/30 flex items-center justify-center text-[9px] shrink-0 font-mono">
                  {slide}
                </span>
                <span className="truncate">{DRIVER_SLIDE_LABELS[slide]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Mobile Device Container */}
      <div 
        className={`transition-all duration-300 w-full ${
          bezelMode ? 'max-w-[420px]' : 'max-w-2xl'
        }`}
      >
        <div className="relative bg-black rounded-[46px] p-3 shadow-2xl border-4 border-slate-700 shadow-emerald-950/40">
          {/* Top Dynamic Island / Speaker Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-between px-3">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-950/80"></div>
          </div>

          {/* Screen Content Wrapper */}
          <div className="bg-[#F8FAFC] text-slate-900 rounded-[38px] overflow-hidden min-h-[720px] max-h-[820px] flex flex-col relative shadow-inner select-none font-sans">
            {/* Status Bar */}
            <div className="bg-transparent px-6 pt-3 pb-1 flex items-center justify-between text-xs text-slate-700 font-semibold z-40 select-none">
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <Signal className="w-3.5 h-3.5" />
                <Wifi className="w-3.5 h-3.5" />
                <Battery className="w-4 h-4" />
              </div>
            </div>

            {currentUser?.role === 'DRIVER' && driverKyc?.kyc_status !== 'APPROVED' && (
              <div className="absolute inset-0 top-8 z-[100] bg-white p-6 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4"><ShieldCheck className="w-8 h-8" /></div>
                <h2 className="text-xl font-black text-[#071B49]">{driverKyc?.kyc_status === 'REJECTED' ? 'Documents need an update' : driverKyc?.kyc_status === 'PENDING' ? 'Admin review in progress' : 'Complete driver verification'}</h2>
                <p className="text-sm text-slate-600 mt-2">Daily trips and company duties unlock after an admin approves every required document and your face photo.</p>
                {driverKyc?.rejection_reason && <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{driverKyc.rejection_reason}</p>}
                <button onClick={() => setCurrentSlide(17)} className="mt-5 w-full py-3 rounded-xl bg-blue-600 text-white font-bold">{driverKyc?.kyc_status === 'PENDING' ? 'Review submitted documents' : 'Complete / replace documents'}</button>
                <button onClick={() => { logout(); setCurrentSlide(3); }} className="mt-3 text-sm text-slate-500 underline">Log out</button>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 1: SPLASH SCREEN */}
            {/* ============================================================ */}
            {currentSlide === 1 && (
              <div 
                onClick={() => setCurrentSlide(2)}
                className="flex-1 flex flex-col items-center justify-between p-6 text-center cursor-pointer relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-emerald-50/20"
              >
                <div className="pt-8">
                  <img src="/sjt_logo.png" alt="SJT Logo" className="h-16 object-contain mx-auto mb-2 drop-shadow" />
                  <h1 className="font-black text-xl tracking-tight text-[#071B49]">
                    Drive with Us, Grow Together
                  </h1>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">
                    SJT Tours & Travels Commercial Driver Partner
                  </p>
                </div>

                {/* Fleet Image */}
                <div className="my-auto w-full max-w-sm rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                  <img src="/tempo17.jpg" alt="SJT Fleet" className="w-full h-48 object-cover" />
                </div>

                {/* 3 Badges at Bottom: Flexible Trips | Good Earnings | Trusted Company */}
                <div className="w-full space-y-3 pb-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Flexible Trips', icon: '⚡' },
                      { label: 'Good Earnings', icon: '💰' },
                      { label: 'Trusted Company', icon: '🛡️' }
                    ].map((badge, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                        <span className="text-base mb-0.5">{badge.icon}</span>
                        <span className="text-[10px] font-black text-slate-700 leading-tight">{badge.label}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setCurrentSlide(2)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#0066FF] hover:bg-blue-600 active:scale-98 text-white font-black text-xs shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200/80 rounded-full text-[11px] font-bold text-slate-700">
                      <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
                      <span>Splash Screen</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 2: ONBOARDING */}
            {/* ============================================================ */}
            {currentSlide === 2 && (
              <div className="flex-1 flex flex-col justify-between p-6 bg-white overflow-y-auto">
                <div className="flex items-center justify-between">
                  <button onClick={() => setCurrentSlide(1)} className="p-1 rounded-full hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                  </button>
                  <button onClick={() => setCurrentSlide(6)} className="text-xs font-bold text-blue-600 hover:underline">
                    Skip
                  </button>
                </div>

                <div className="space-y-4 my-auto">
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-100">
                    <img src="/minibus.jpg" alt="Driver Network" className="w-full h-44 object-cover" />
                  </div>

                  <div className="space-y-1 text-center">
                    <h2 className="text-xl font-black text-[#071B49]">Be a Part of SJT Driver Network</h2>
                    <p className="text-[11px] text-blue-600 font-bold">
                      Regular Trips | Company Duty | Outstation | Airport Transfers
                    </p>
                  </div>

                  {/* Bullet Points with Checkmarks */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                    {[
                      'Get Daily Regular & Corporate Trip Requests',
                      'Earn with Flexible Schedules & Daily Bata',
                      'Transparent Fuel & Distance Reimbursements',
                      'Drive with Karnataka\'s Most Trusted Brand'
                    ].map((point, idx) => (
                      <div key={idx} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className="font-semibold text-slate-700 text-[11px]">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pb-2">
                  <button
                    onClick={() => setCurrentSlide(3)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#0066FF] hover:bg-blue-600 active:scale-98 text-white font-black text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-700">
                      <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
                      <span>Onboarding</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 3: DRIVER LOGIN */}
            {/* ============================================================ */}
            {currentSlide === 3 && (
              <div className="flex-1 flex flex-col justify-between p-6 bg-white overflow-y-auto">
                <button onClick={() => setCurrentSlide(2)} className="p-1 rounded-full hover:bg-slate-100 self-start">
                  <ArrowLeft className="w-5 h-5 text-slate-700" />
                </button>

                <div className="my-auto space-y-4">
                  <div className="text-center">
                    <img src="/sjt_logo.png" alt="SJT Logo" className="h-12 object-contain mx-auto mb-1.5" />
                    <h2 className="text-xl font-black text-[#071B49]">Driver Login</h2>
                    <p className="text-xs text-slate-500">Continue to your driver account</p>
                  </div>

                  <div className="space-y-3">
                    {/* Duty Profile Selector: Daily Trip vs Company Duties */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Select Duty Profile / Working Mode
                      </label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setDriverTypeChoice('REGULAR')}
                          className={`py-2 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            driverTypeChoice === 'REGULAR'
                              ? 'bg-[#071B49] text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Car className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Daily Trips</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDriverTypeChoice('COMPANY_DUTY')}
                          className={`py-2 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            driverTypeChoice === 'COMPANY_DUTY'
                              ? 'bg-[#071B49] text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Building className="w-3.5 h-3.5 text-blue-400" />
                          <span>Company Duty</span>
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 pl-1">
                        {driverTypeChoice === 'REGULAR' 
                          ? '🚗 On-demand customer trips, outstation, airport transfers'
                          : '🏢 Corporate staff attachment, daily shift & KM odometer logs'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Login ID / Email / Phone</label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={loginId}
                          onChange={(e) => setLoginId(e.target.value)}
                          placeholder="Email or Registered Mobile"
                          className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter password"
                          className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-0"
                        />
                        <span>Remember Me</span>
                      </label>
                      <button type="button" className="font-bold text-blue-600 hover:underline">
                        Forgot Password?
                      </button>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          const email = loginId.includes('@') ? loginId.trim() : `${loginId.trim()}@driver.sjttravels.com`;
                          const user = await login(email, loginPassword);
                          setDriverName(user.name);
                          setDriverPhone(user.phone);
                          if (user.role !== 'DRIVER') throw new Error('Use a registered driver account to sign in here.');
                          if (user.kyc_status === 'APPROVED') setCurrentSlide(driverTypeChoice === 'COMPANY_DUTY' ? 7 : 6);
                          else setCurrentSlide(17);
                        } catch (error) {
                          alert(error instanceof Error ? error.message : 'Could not sign in.');
                        }
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-[#0066FF] hover:bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-500/20 active:scale-98 transition-all cursor-pointer"
                    >
                      Login as {driverTypeChoice === 'REGULAR' ? 'Daily Trips Driver' : 'Company Duties Driver'}
                    </button>

                  </div>

                  <div className="text-center text-xs text-slate-500 pt-1">
                    New Driver?{' '}
                    <button
                      onClick={() => setCurrentSlide(4)}
                      className="font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Create Account
                    </button>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Login Screen ({driverTypeChoice === 'REGULAR' ? 'Daily Trips' : 'Company Duty'})</span>
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 4: SIGN UP SCREEN */}
            {/* ============================================================ */}
            {currentSlide === 4 && (
              <div className="flex-1 flex flex-col justify-between p-6 bg-white overflow-y-auto">
                <button onClick={() => setCurrentSlide(3)} className="p-1 rounded-full hover:bg-slate-100 self-start">
                  <ArrowLeft className="w-5 h-5 text-slate-700" />
                </button>

                <div className="my-auto space-y-3.5">
                  <div className="text-center">
                    <img src="/sjt_logo.png" alt="SJT Logo" className="h-10 object-contain mx-auto mb-1" />
                    <h2 className="text-xl font-black text-[#071B49]">Create Driver Account</h2>
                    <p className="text-xs text-slate-500">Join our verified driver network</p>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <input
                        type="text"
                        required
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        required
                        value={signUpPhone}
                        onChange={(e) => setSignUpPhone(e.target.value)}
                        placeholder="Phone Number"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        value={signUpVehicleNo}
                        onChange={(e) => setSignUpVehicleNo(e.target.value)}
                        placeholder="Vehicle Registration No (e.g. KA 05 AB 1234)"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium font-mono"
                      />
                    </div>
                    <div>
                      <select
                        value={signUpVehicleType}
                        onChange={(e) => setSignUpVehicleType(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                      >
                        <option value="Tempo Traveller">Tempo Traveller (12 / 17 Seater)</option>
                        <option value="Mini Bus">Mini Bus (25 Seater)</option>
                        <option value="Toyota Innova Crysta">Toyota Innova Crysta</option>
                        <option value="Sedan">Sedan (Toyota Etios)</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        value={signUpLoginId}
                        onChange={(e) => setSignUpLoginId(e.target.value)}
                        placeholder="Create Login ID"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Create Password"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                      />
                    </div>

                    {/* Choose Working Mode (Daily Trips vs Company Duty) */}
                    <div className="pt-1">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Choose Driver Duty Profile
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setDriverTypeChoice('REGULAR')}
                          className={`p-2 rounded-lg text-left transition-all cursor-pointer ${
                            driverTypeChoice === 'REGULAR'
                              ? 'bg-[#071B49] text-white shadow-sm'
                              : 'bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-1 text-[11px] font-black">
                            <Car className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Daily Trips</span>
                          </div>
                          <span className={`text-[9px] block mt-0.5 leading-tight ${driverTypeChoice === 'REGULAR' ? 'text-slate-300' : 'text-slate-500'}`}>
                            Customer on-demand trips & outstation
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDriverTypeChoice('COMPANY_DUTY')}
                          className={`p-2 rounded-lg text-left transition-all cursor-pointer ${
                            driverTypeChoice === 'COMPANY_DUTY'
                              ? 'bg-[#071B49] text-white shadow-sm'
                              : 'bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-1 text-[11px] font-black">
                            <Building className="w-3.5 h-3.5 text-blue-400" />
                            <span>Company Duty</span>
                          </div>
                          <span className={`text-[9px] block mt-0.5 leading-tight ${driverTypeChoice === 'COMPANY_DUTY' ? 'text-slate-300' : 'text-slate-500'}`}>
                            Corporate attachment & odometer shifts
                          </span>
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          if (!signUpName.trim() || !signUpPhone.trim() || !signUpLoginId.trim()) throw new Error('Enter your full name, phone number, and login ID.');
                          if (signUpPassword.length < 8) throw new Error('Choose a password with at least 8 characters.');
                          const email = signUpLoginId.includes('@') ? signUpLoginId.trim() : `${signUpLoginId.trim()}@driver.sjttravels.com`;
                          await register({ email, login_id: signUpLoginId.trim(), password: signUpPassword, name: signUpName.trim(), phone: signUpPhone.trim(), role: 'DRIVER' });
                          setDriverName(signUpName.trim());
                          setDriverPhone(signUpPhone.trim());
                          setCurrentSlide(17);
                        } catch (error) {
                          alert(error instanceof Error ? error.message : 'Could not create your driver account.');
                        }
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-[#0066FF] hover:bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-500/20 active:scale-98 transition-all mt-1 cursor-pointer"
                    >
                      Sign Up & Launch {driverTypeChoice === 'REGULAR' ? 'Daily Trips' : 'Company Duty'}
                    </button>
                  </div>

                  <div className="text-center text-xs text-slate-500">
                    Already have an account?{' '}
                    <button
                      onClick={() => setCurrentSlide(3)}
                      className="font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Login
                    </button>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">4</span>
                    <span>Sign Up Screen</span>
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 5: SELECT DRIVER TYPE */}
            {/* ============================================================ */}
            {currentSlide === 5 && (
              <div className="flex-1 flex flex-col justify-between p-6 bg-white overflow-y-auto">
                <button onClick={() => setCurrentSlide(3)} className="p-1 rounded-full hover:bg-slate-100 self-start">
                  <ArrowLeft className="w-5 h-5 text-slate-700" />
                </button>

                <div className="my-auto space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-black text-[#071B49]">Select Driver Type</h2>
                    <p className="text-xs text-slate-500">Choose your preferred working mode</p>
                  </div>

                  {/* Option 1: Regular Trips */}
                  <div
                    onClick={() => setDriverTypeChoice('REGULAR')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      driverTypeChoice === 'REGULAR'
                        ? 'border-blue-600 bg-blue-50/50 shadow-md'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Car className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-sm text-[#071B49]">Regular Trips</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          Accept customer bookings (Outstation, Local, Airport transfers etc.) with on-demand requests.
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                        driverTypeChoice === 'REGULAR' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                      }`}>
                        {driverTypeChoice === 'REGULAR' && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Company Duty */}
                  <div
                    onClick={() => setDriverTypeChoice('COMPANY_DUTY')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      driverTypeChoice === 'COMPANY_DUTY'
                        ? 'border-blue-600 bg-blue-50/50 shadow-md'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Building className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-sm text-[#071B49]">Company Duty</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          Work on company assigned duties (Daily / Monthly staff shuttle, corporate contracts).
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                        driverTypeChoice === 'COMPANY_DUTY' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                      }`}>
                        {driverTypeChoice === 'COMPANY_DUTY' && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (driverTypeChoice === 'COMPANY_DUTY') setCurrentSlide(7);
                      else setCurrentSlide(6);
                    }}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#0066FF] hover:bg-blue-600 text-white font-black text-xs shadow-lg shadow-blue-500/20 active:scale-98 transition-all"
                  >
                    Continue
                  </button>
                </div>

                <div className="text-center pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">5</span>
                    <span>Select Driver Type</span>
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 6: DASHBOARD */}
            {/* ============================================================ */}
            {currentSlide === 6 && (
              <div className="flex-1 flex flex-col justify-between bg-white overflow-y-auto">
                {/* Header */}
                <div className="px-5 pt-3 pb-2 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border shadow-sm">
                      RK
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-slate-800 leading-tight">Hello {driverName}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">KA 05 AB 1234 • Tempo Traveller</span>
                    </div>
                  </div>

                  {/* Online / Offline Switch */}
                  <button
                    onClick={() => void saveDriverAvailability(!isOnline)}
                    disabled={availabilitySaving}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                      isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                    <span>{isOnline ? 'Online' : 'Offline'}</span>
                  </button>
                </div>

                <div className="p-4 space-y-3 overflow-y-auto">
                  {currentUser?.role === 'DRIVER' && driverTypeChoice === 'REGULAR' && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700">Your passenger pickup areas</label>
                      <input value={serviceArea} onChange={event => setServiceArea(event.target.value)} placeholder="e.g. Yelahanka; Hebbal; Bengaluru" maxLength={240} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500" />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500">Use area names separated by semicolons.</span>
                        <button type="button" disabled={availabilitySaving} onClick={() => void saveDriverAvailability(isOnline)} className="shrink-0 rounded-lg bg-[#071B49] px-3 py-2 text-[10px] font-bold text-white disabled:opacity-60">{availabilitySaving ? 'Saving…' : isOnline ? 'Save Areas' : 'Go Online'}</button>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-600">{availableRides.length ? `${availableRides.length} open ride request${availableRides.length === 1 ? '' : 's'} in your area` : isOnline ? 'No open rides match your area right now.' : 'Go online to receive matching ride requests.'}</p>
                    </div>
                  )}

                  {/* Active Duty Profile Mode Banner with Quick Toggle */}
                  <div className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs shadow-xs ${
                    driverTypeChoice === 'REGULAR'
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-blue-50/70 border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shadow-xs ${
                        driverTypeChoice === 'REGULAR' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {driverTypeChoice === 'REGULAR' ? <Car className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-black text-slate-800 leading-tight flex items-center gap-1.5">
                          <span>{driverTypeChoice === 'REGULAR' ? 'Daily Trips Driver' : 'Company Duties Driver'}</span>
                          <span className="bg-white/80 px-1.5 py-0.2 rounded text-[9px] font-bold text-slate-600 border border-slate-200 font-mono">
                            ACTIVE
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {driverTypeChoice === 'REGULAR' ? 'On-Demand Ola/Uber Passenger Trips' : 'Corporate Attachment & Odometer Shift'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDriverModeSwitch}
                      disabled={Boolean(activeDuty)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-[10px] font-bold text-slate-700 shadow-xs cursor-pointer active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                      title={activeDuty ? 'Check out of company duty before switching to Daily Trips' : 'Switch between Daily Trips and Company Duties'}
                    >
                      {activeDuty ? 'Duty Active' : driverTypeChoice === 'REGULAR' ? 'Company Mode' : 'Daily Trips'}
                    </button>
                  </div>

                  {/* Top 3 Stat Cards matching Mockup 2 */}
                  <div className={`grid ${canTakeDailyTrips ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                    {canTakeDailyTrips && <div 
                      onClick={() => setCurrentSlide(9)}
                      className="bg-red-50 hover:bg-red-100/80 p-2.5 rounded-2xl border border-red-200 text-center cursor-pointer transition-all active:scale-95"
                    >
                      <span className="text-xl font-black text-red-600 font-mono block">{newRequestCount}</span>
                      <span className="text-[10px] font-bold text-red-700 leading-tight">New Requests</span>
                    </div>}

                    <div 
                      onClick={() => setCurrentSlide(activeDuty ? 8 : ongoingTripCount ? 13 : 9)}
                      className="bg-blue-50 hover:bg-blue-100/80 p-2.5 rounded-2xl border border-blue-200 text-center cursor-pointer transition-all active:scale-95"
                    >
                      <span className="text-xl font-black text-blue-600 font-mono block">{activeDuty ? 1 : ongoingTripCount}</span>
                      <span className="text-[10px] font-bold text-blue-700 leading-tight">{activeDuty ? 'Company Duty' : 'Ongoing Trip'}</span>
                    </div>

                    {driverTypeChoice === 'COMPANY_DUTY' ? (
                      <div 
                        onClick={() => setCurrentSlide(7)}
                        className="bg-emerald-50 hover:bg-emerald-100/80 p-2.5 rounded-2xl border border-emerald-200 text-center cursor-pointer transition-all active:scale-95 shadow-xs"
                      >
                        <span className="text-lg font-black text-emerald-600 font-mono block">{totalTodayShiftKm} KM</span>
                        <span className="text-[10px] font-bold text-emerald-800 leading-tight">Today's Run · {todayCompletedShiftsCount} Shifts</span>
                      </div>
                    ) : (
                      <div 
                        onClick={() => setCurrentSlide(16)}
                        className="bg-emerald-50 hover:bg-emerald-100/80 p-2.5 rounded-2xl border border-emerald-200 text-center cursor-pointer transition-all active:scale-95"
                      >
                        <span className="text-lg font-black text-emerald-600 font-mono block">₹{todayTripEarnings.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] font-bold text-emerald-700 leading-tight">Trip Earnings · {todayDutyKm} duty km</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Icons: [Trip History, Attendance, Shift Duties] */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setCurrentSlide(16)}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center gap-1.5 transition-all"
                    >
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="text-[10px] font-bold text-slate-700">Trip History</span>
                    </button>
                    <button
                      onClick={() => setCurrentSlide(16)}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center gap-1.5 transition-all"
                    >
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      <span className="text-[10px] font-bold text-slate-700">Attendance</span>
                    </button>
                    <button
                      onClick={() => setCurrentSlide(7)}
                      className="p-3 bg-emerald-50/70 hover:bg-emerald-100/70 rounded-2xl border border-emerald-200 flex flex-col items-center gap-1.5 transition-all"
                    >
                      <Gauge className="w-5 h-5 text-emerald-600" />
                      <span className="text-[10px] font-bold text-emerald-800">Shift Duties</span>
                    </button>
                  </div>

                  {/* Promo Card: "Be On Time" */}
                  <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-blue-300">Driver Incentive</span>
                      <h4 className="font-black text-sm">Be On Time</h4>
                      <p className="text-[11px] text-blue-100">Accept trips promptly and earn daily bonus allowance</p>
                    </div>
                    <img src="/tempo17.jpg" alt="Tempo" className="w-16 h-14 rounded-xl object-cover shrink-0 border border-white/20" />
                  </div>

                  {/* Active Duty Shortcut */}
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-3.5 rounded-2xl border border-emerald-200 flex items-center justify-between shadow-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-emerald-700">Company Duties & Shifts</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                          {todayCompletedShiftsCount} Shifts Done
                        </span>
                      </div>
                      <h4 className="font-black text-xs text-slate-800">
                        {activeDuty ? `${activeDuty.companyName || activeDuty.company_name} (${activeDuty.shiftName || dutyShift})` : 'Multi-Shift Company Duty'}
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        {activeDuty ? `Running: started at ${activeDuty.startKm || activeDuty.start_km} KM` : `Today: ${totalTodayShiftKm} KM Run • Up to 10+ shifts`}
                      </span>
                    </div>
                    <button
                      onClick={() => setCurrentSlide(activeDuty ? 8 : 7)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>{activeDuty ? 'Active Duty' : 'Start Shift'}</span>
                    </button>
                  </div>
                </div>

                {/* Bottom App Navigation */}
                <div className="border-t border-slate-100 bg-white px-6 py-2.5 flex items-center justify-between text-slate-500">
                  <button className="flex flex-col items-center gap-0.5 text-blue-600 font-bold">
                    <Compass className="w-4 h-4" />
                    <span className="text-[9px]">Home</span>
                  </button>
                  <button onClick={() => setCurrentSlide(9)} className="flex flex-col items-center gap-0.5 hover:text-blue-600">
                    <Car className="w-4 h-4" />
                    <span className="text-[9px]">Trips</span>
                  </button>
                  <button onClick={() => setCurrentSlide(16)} className="flex flex-col items-center gap-0.5 hover:text-blue-600">
                    <Wallet className="w-4 h-4" />
                    <span className="text-[9px]">Earnings</span>
                  </button>
                  <button className="flex flex-col items-center gap-0.5 hover:text-blue-600">
                    <UserIcon className="w-4 h-4" />
                    <span className="text-[9px]">Profile</span>
                  </button>
                </div>

                <div className="text-center pb-2 bg-white">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-700">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">6</span>
                    <span>Dashboard</span>
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 7: COMPANY DUTY CHECK-IN (MULTI-SHIFT DUTY FLOW) */}
            {/* ============================================================ */}
            {currentSlide === 7 && (
              <div className="flex-1 flex flex-col justify-between p-4 bg-white overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentSlide(6)} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
                      <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <div>
                      <h2 className="text-base font-black text-[#071B49]">Company Duty & Shifts</h2>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date())}
                      </span>
                    </div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Shift KM Tracker</span>
                  </span>
                </div>

                <div className="space-y-3.5">
                  {/* 1. HERO COCKPIT: TODAY'S SHIFT DUTIES & KM SUMMARY (ZERO EARNINGS - ONLY KM & SHIFTS) */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#071B49] via-slate-900 to-[#0A2668] text-white p-4 rounded-3xl shadow-xl border border-blue-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-emerald-400" />
                        <span>Today's Shift Duties & KM Summary</span>
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        <span>{todayCompletedShiftsCount} Completed</span>
                      </span>
                    </div>

                    {/* Dual Prominent Stat Boxes */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
                        <span className="text-[10px] font-bold text-slate-300 uppercase block tracking-wider">Total Day Run</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <strong className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                            {totalTodayShiftKm}
                          </strong>
                          <span className="text-xs font-bold text-emerald-300">KM</span>
                        </div>
                      </div>

                      <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
                        <span className="text-[10px] font-bold text-slate-300 uppercase block tracking-wider">Shifts Done</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <strong className="text-2xl font-black font-mono text-white tracking-tight">
                            {todayCompletedShiftsCount}
                          </strong>
                          <span className="text-xs font-bold text-slate-300">Shifts</span>
                        </div>
                      </div>
                    </div>

                    {/* Horizontal Scrollable Cards of Completed Shifts */}
                    {todayDuties.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                          <span>Completed Shift KM Breakdown:</span>
                          <span className="text-emerald-400 font-mono">{todayDuties.length} logged</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                          {todayDuties.map((d, idx) => {
                            const sName = d.shift_name || d.shiftName || `Shift ${idx + 1}`;
                            const sKm = Number(d.dailyKm ?? d.daily_km ?? (d.endKm && d.startKm ? d.endKm - d.startKm : 0));
                            return (
                              <div
                                key={d.id || idx}
                                className="min-w-[125px] bg-white/10 hover:bg-white/15 backdrop-blur-sm p-2 rounded-xl border border-white/15 text-left shrink-0 transition-all"
                              >
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-black text-emerald-300 uppercase">{sName}</span>
                                  <span className="text-[9px] text-emerald-400 font-bold">✓ Done</span>
                                </div>
                                <div className="font-mono font-black text-sm text-white mt-1">
                                  {sKm} <span className="text-[10px] font-normal text-slate-300">KM</span>
                                </div>
                                <div className="text-[9px] text-slate-300 truncate mt-0.5 font-medium">
                                  {d.companyName || d.company_name || 'Client Duty'}
                                </div>
                                <div className="text-[8px] font-mono text-slate-400 mt-0.5">
                                  {d.startKm || d.start_km} → {d.endKm || d.end_km}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-center">
                        <span className="text-[11px] text-slate-300 flex items-center justify-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>No shifts completed today yet. Select a shift below to start!</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 2. MULTI-SHIFT SELECTION (SHIFTS 1 TO 10 + CUSTOM) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Select Duty Shift to Login (1 to 10+)</span>
                      </label>
                      <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        Active: {dutyShift}
                      </span>
                    </div>

                    {/* 10 Standard Shifts Grid (2 rows of 5) */}
                    <div className="grid grid-cols-5 gap-1.5">
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
                              if (!isDone) {
                                setDutyShift(s);
                                setDutyTripId(`${s} - Corporate Duty`);
                              }
                            }}
                            title={isDone ? `${s} completed today (${shiftKm || 0} km logged). Each shift can only be done once per day.` : `Select ${s}`}
                            className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all border ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 opacity-80 cursor-not-allowed'
                                : isSelected
                                ? 'bg-[#071B49] text-white border-[#071B49] shadow-md ring-2 ring-blue-500/30 cursor-pointer active:scale-95'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer active:scale-95'
                            }`}
                          >
                            <span className="block text-[11px] leading-tight">{s}</span>
                            <span className={`text-[9px] block font-mono mt-0.5 ${
                              isDone
                                ? 'text-emerald-700 font-bold'
                                : isSelected
                                ? 'text-blue-200 font-bold'
                                : 'text-slate-400 font-medium'
                            }`}>
                              {isDone ? `✓ ${shiftKm || 0}k` : isSelected ? '● Active' : 'Ready'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {todayCompletedShiftsCount > 0 && (
                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[10px] text-emerald-800">
                        <span>
                          <strong>{todayCompletedShiftsCount} Shift{todayCompletedShiftsCount > 1 ? 's' : ''} Done Today</strong> ({totalTodayShiftKm} km). Next: <strong className="text-blue-700">{nextAvailableShift}</strong>
                        </span>
                        {lastCompletedEndKm !== null && (
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                            End: {lastCompletedEndKm} km
                          </span>
                        )}
                      </div>
                    )}

                    {/* Custom Shift Option (Allows Shift 11, Shift 12, etc.) */}
                    <div className="pt-1 flex items-center justify-between text-xs">
                      {!showCustomShiftInput ? (
                        <button
                          type="button"
                          onClick={() => setShowCustomShiftInput(true)}
                          className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Need Shift 11 or custom shift name? Click here</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 w-full pt-1">
                          <input
                            type="text"
                            value={customShiftName}
                            onChange={e => setCustomShiftName(e.target.value)}
                            placeholder="e.g. Shift 11 or Special Plant Duty"
                            className="flex-1 px-3 py-1.5 bg-slate-50 border border-blue-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white"
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
                            className="px-3 py-1.5 bg-[#071B49] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                          >
                            Set
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCustomShiftInput(false)}
                            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. ASSIGNED COMPANY / CLIENT (NO PRE-FILLED, DRIVER ENTERS REAL NAME) */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Assigned Company / Client Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={160}
                        required
                        value={dutyCompany}
                        onChange={e => setDutyCompany(e.target.value)}
                        placeholder="Type company or client name (e.g. Infosys, Janani, Amazon)"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {/* 4. ROUTE: PICKUP & DROP (NO PRE-FILLED, DRIVER ENTERS REAL ROUTE) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Pickup Location <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          maxLength={240}
                          required
                          value={dutyPickup}
                          onChange={e => setDutyPickup(e.target.value)}
                          placeholder="Enter pickup location / plant"
                          className="w-full pl-8 pr-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Drop Destination <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Navigation className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          maxLength={240}
                          required
                          value={dutyDestination}
                          onChange={e => setDutyDestination(e.target.value)}
                          placeholder="Enter drop destination / hub"
                          className="w-full pl-8 pr-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. STARTING ODOMETER (KM) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold text-slate-600">
                        Starting Odometer Reading (KM) <span className="text-red-500">*</span>
                      </label>
                      {lastCompletedEndKm !== null && (
                        <button
                          type="button"
                          onClick={() => setDutyOdometer(String(lastCompletedEndKm))}
                          className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Zap className="w-3 h-3 text-emerald-600" />
                          <span>Use last end: {lastCompletedEndKm} KM</span>
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Gauge className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={dutyOdometer}
                        onChange={e => setDutyOdometer(e.target.value)}
                        placeholder="Enter starting odometer reading (e.g. 125400)"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-blue-50/50 border border-blue-300 rounded-xl text-sm font-black font-mono text-[#071B49] outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {dutyCheckInError && (
                    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2 text-left text-xs font-semibold text-red-700 flex items-center gap-1.5 animate-shake">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{dutyCheckInError}</span>
                    </p>
                  )}

                  {/* 6. START SHIFT BUTTON */}
                  <button
                    onClick={handleDutyCheckIn}
                    disabled={dutyCheckInSaving}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-60 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>{dutyCheckInSaving ? 'Starting Shift Duty…' : `Start ${dutyShift} Duty & Login`}</span>
                  </button>
                </div>

                <div className="text-center pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">7</span>
                    <span>Shift Login ({dutyShift})</span>
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 8: DUTY ACTIVE (LIVE SHIFT IN PROGRESS) */}
            {/* ============================================================ */}
            {currentSlide === 8 && (
              <div className="flex-1 flex flex-col justify-between p-4 bg-white overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => setCurrentSlide(7)} className="p-1 rounded-full hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                  </button>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 flex items-center gap-1.5 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{dutyShift.toUpperCase()} IN PROGRESS</span>
                  </span>
                </div>

                <div className="space-y-3 text-center">
                  {/* Large Running Timer */}
                  <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      {dutyShift} Live Timer
                    </span>
                    <div className="text-4xl font-black font-mono tracking-wider text-emerald-400">
                      {formatTimer(dutyTimerSeconds)}
                    </div>
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      Company: {activeDuty?.companyName || activeDuty?.company_name || dutyCompany}
                    </span>
                  </div>

                  {/* Active Shift Details */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left space-y-1.5 text-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span className="text-slate-500">Active Shift</span>
                      <strong className="text-blue-900 font-black">{dutyShift}</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span className="text-slate-500">Starting Odometer</span>
                      <strong className="font-mono font-black text-slate-900">{activeDuty?.startKm || activeDuty?.start_km || dutyStartKm} KM</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span className="text-slate-500">Vehicle Reg</span>
                      <strong className="font-mono text-[#ED1735] font-bold">{activeDuty?.vehicleReg || activeDuty?.vehicle_reg || vehicleReg}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Route</span>
                      <span className="text-right text-slate-800 font-medium truncate max-w-[180px]">{dutyPickup} → {dutyDestination}</span>
                    </div>
                  </div>

                  {/* End Shift Odometer Entry & Live Shift KM calculation */}
                  <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800">
                        Ending Odometer (KM)
                      </label>
                      {dutyEndOdometer && Number(dutyEndOdometer) >= Number(activeDuty?.startKm || dutyStartKm || 0) && (
                        <span className="bg-emerald-600 text-white font-mono font-black text-xs px-2 py-0.5 rounded-full shadow-xs">
                          {dutyShift} Run: {Number(dutyEndOdometer) - Number(activeDuty?.startKm || dutyStartKm || 0)} KM
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min={activeDuty?.startKm || dutyStartKm}
                      value={dutyEndOdometer}
                      onChange={e => setDutyEndOdometer(e.target.value)}
                      placeholder="Enter ending odometer km (e.g. 125420)"
                      className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-base font-black font-mono text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500">
                      Enter ending km to calculate exact distance run for {dutyShift} (e.g. 20 km or 35 km).
                    </p>
                  </div>

                  {/* Action Buttons: Red "End Shift & Log KM" */}
                  <div className="pt-1">
                    <button
                      onClick={handleDutyEnd}
                      className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-500/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Complete {dutyShift} & Log KM</span>
                    </button>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">8</span>
                    <span>{dutyShift} Active</span>
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 9: INCOMING REQUEST (NEW RIDE REQUEST) */}
            {/* ============================================================ */}
            {currentSlide === 9 && (
              <div className="flex-1 flex flex-col justify-between p-5 bg-white overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setCurrentSlide(6)} className="p-1 rounded-full hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                  </button>
                  <h2 className="text-base font-black text-[#071B49]">New Ride Request</h2>
                </div>

                <div className="my-auto space-y-4">
                  {canTakeDailyTrips ? (
                    <>
                    {pendingDailyTrip ? (
                      <>
                  {/* Trip Card matching Mockup 2 */}
                  {(() => {
                    const reqSched = formatBookingSchedule(
                      pendingDailyTrip?.journeyDate || pendingDailyTrip?.journey_date,
                      pendingDailyTrip?.journeyTime || pendingDailyTrip?.journey_time,
                      pendingDailyTrip?.returnDate || pendingDailyTrip?.return_date
                    );
                    const reqBadge = getTripTypeBadge(pendingDailyTrip?.tripType || pendingDailyTrip?.trip_type);

                    return (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-blue-600">Trip ID: {pendingDailyTrip?.bookingCode || pendingDailyTrip?.booking_code || 'No assigned booking'}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${reqBadge.color}`}>
                            {reqBadge.label}
                          </span>
                        </div>

                        {/* Hero Schedule Strip: Day of Week, Date & Pickup Time */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl p-3 space-y-1 text-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Scheduled Date & Time</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${reqSched.isToday ? 'bg-emerald-100 text-emerald-800' : reqSched.isTomorrow ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                              {reqSched.badge}
                            </span>
                          </div>
                          <div className="text-sm font-black text-[#071B49] flex items-center gap-1.5">
                            <span>📅 {reqSched.dayName ? `${reqSched.dayName}, ` : ''}{reqSched.formattedDate}</span>
                          </div>
                          <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5 pt-0.5">
                            <span>⏰ Pickup Time:</span>
                            <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono text-blue-700">{reqSched.timeText}</span>
                          </div>
                          {reqSched.returnDateText && (
                            <div className="text-[11px] font-semibold text-purple-700 flex items-center gap-1 pt-0.5">
                              <span>🔄 Return:</span>
                              <span>{reqSched.returnDateText}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <img src="/tempo17.jpg" alt="Vehicle" className="w-14 h-12 rounded-xl object-cover shrink-0" />
                          <div>
                            <h4 className="font-black text-xs text-slate-800">{pendingDailyTrip?.vehicleName || pendingDailyTrip?.vehicle_name || 'Vehicle not assigned'}</h4>
                            <span className="text-[11px] text-slate-500 font-semibold block">👥 {pendingDailyTrip?.passengers || 4} Passengers</span>
                          </div>
                        </div>

                        {/* Route Details with Google Maps */}
                        <div className="space-y-2 text-xs pt-2 border-t border-slate-200">
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-start gap-2 min-w-0">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="text-slate-500 block text-[10px] uppercase font-bold">Pickup:</span>
                                <strong className="text-slate-800 break-words leading-tight">{pendingDailyTrip?.pickup || 'Pickup not assigned'}</strong>
                              </div>
                            </div>
                            {pendingDailyTrip?.pickup && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pendingDailyTrip.pickup)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 font-extrabold text-[10px] shrink-0 inline-flex items-center gap-1"
                              >
                                <Navigation className="w-2.5 h-2.5" />
                                Pickup Map
                              </a>
                            )}
                          </div>
                          <div className="flex items-start justify-between gap-1.5 pt-1 border-t border-slate-100">
                            <div className="flex items-start gap-2 min-w-0">
                              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="text-slate-500 block text-[10px] uppercase font-bold">Drop:</span>
                                <strong className="text-slate-800 break-words leading-tight">{pendingDailyTrip?.destination || 'Destination not assigned'}</strong>
                              </div>
                            </div>
                            {pendingDailyTrip?.destination && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pendingDailyTrip.destination)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] shrink-0 inline-flex items-center gap-1"
                              >
                                <Navigation className="w-2.5 h-2.5" />
                                Drop Map
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Fare */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-500 block">Total Customer Fare</span>
                            <span className="text-[10px] text-emerald-600 font-semibold">Pay Directly to Driver (Cash/UPI)</span>
                          </div>
                          <span className="text-lg font-black text-blue-600 font-mono">₹{Number(pendingDailyTrip?.quotedAmount || pendingDailyTrip?.quoted_amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Accept (30s) / Reject Action Buttons matching Mockup 2 */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={handleDeclineRide}
                      disabled={!pendingDailyTrip}
                      className="py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md shadow-red-500/20 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={handleAcceptRide}
                      disabled={!pendingDailyTrip}
                      className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>Accept</span>
                      <span className="w-5 h-5 rounded-full bg-black/20 text-white text-[10px] flex items-center justify-center font-mono">
                        {requestCountdown}s
                      </span>
                    </button>
                  </div>
                      </>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                        <Car className="mx-auto h-8 w-8 text-slate-400" />
                        <h3 className="mt-3 text-sm font-black text-[#071B49]">No ride requests in your area</h3>
                        <p className="mt-1 text-xs text-slate-500">Go online and set your service area. Matching bookings will appear here for you to accept.</p>
                      </div>
                    )}
                    </>
                  ) : (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center shadow-sm">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white"><Building className="h-6 w-6" /></div>
                      <h3 className="text-sm font-black text-[#071B49]">{activeDuty ? 'Company duty is in progress' : !isOnline ? 'You are offline' : 'Daily trip requests are paused'}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">{activeDuty ? `Complete check-out for ${activeDuty.companyName || activeDuty.company_name || 'your company duty'} before taking passenger trips.` : !isOnline ? 'Go online to receive assigned daily trip requests.' : 'Switch to Daily Trips mode to view passenger bookings.'}</p>
                      {activeDuty ? (
                        <button onClick={() => setCurrentSlide(8)} className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow">Continue Company Duty</button>
                      ) : !isOnline ? (
                        <button onClick={() => void saveDriverAvailability(true)} className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow">Go Online</button>
                      ) : (
                        <button onClick={handleDriverModeSwitch} className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-xs font-black text-white shadow">Switch to Daily Trips</button>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-center pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">9</span>
                    <span>Incoming Request</span>
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 10: TRIP ACCEPTED */}
            {/* ============================================================ */}
            {currentSlide === 10 && (
              <div className="flex-1 flex flex-col justify-between p-6 bg-white text-center">
                <div className="my-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-emerald-600">Trip Accepted!</h2>
                    <span className="text-xs font-mono font-bold text-slate-500">Trip ID: {requestTripId}</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Trip Type</span>
                      <span className="font-bold text-blue-700">{getTripTypeBadge(tripType).label}</span>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Route</span>
                      <strong className="text-slate-800 break-words max-w-[200px] text-right">{fromLocation} → {toLocation}</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Customer</span>
                      <strong className="text-slate-800">{customerName}</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Schedule</span>
                      <strong className="text-slate-800 font-bold">📅 {tripDate ? formatBookingSchedule(tripDate, tripTime, tripReturnDate).fullText : 'Immediate Pickup'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Total Fare</span>
                      <strong className="font-mono text-emerald-600">₹{tripFare.toLocaleString('en-IN')} (Pay to Driver)</strong>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => setCurrentSlide(11)}
                      className="w-full py-3 px-4 rounded-xl bg-[#0066FF] hover:bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-500/20 active:scale-98 transition-all"
                    >
                      View Trip
                    </button>
                    <a
                      href={customerPhone ? `tel:${customerPhone}` : '#'}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 block"
                    >
                      Contact Customer ({customerPhone || 'Call'})
                    </a>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">10</span>
                    <span>Trip Accepted</span>
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 11: TRIP DETAILS */}
            {/* ============================================================ */}
            {currentSlide === 11 && (
              <div className="flex-1 flex flex-col justify-between p-5 bg-white overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => setCurrentSlide(10)} className="p-1 rounded-full hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                  </button>
                  <h2 className="text-base font-black text-[#071B49]">Trip Details</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Accepted
                  </span>
                </div>

                <div className="my-auto space-y-4">
                  {/* Customer Info Card */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm border shadow-sm">
                        {customerName.slice(0, 2).toUpperCase() || 'CU'}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Customer</span>
                        <h4 className="font-black text-xs text-slate-800">{customerName}</h4>
                        <span className="text-[11px] text-slate-500 font-mono">{customerPhone}</span>
                      </div>
                    </div>
                    <a href={customerPhone ? `tel:${customerPhone}` : '#'} className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Trip Details Info */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-500">Trip ID</span>
                      <strong className="font-mono text-blue-600">{requestTripId}</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-500">Trip Category</span>
                      <span className="font-bold text-blue-700">{getTripTypeBadge(tripType).label}</span>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-500">From</span>
                      <strong className="text-slate-800 break-words max-w-[200px] text-right">{fromLocation}</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-500">To</span>
                      <strong className="text-slate-800 break-words max-w-[200px] text-right">{toLocation}</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-500">Schedule</span>
                      <strong className="text-slate-800 font-bold">📅 {tripDate ? formatBookingSchedule(tripDate, tripTime, tripReturnDate).fullText : 'Today'}</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-500">Vehicle & Capacity</span>
                      <strong className="text-slate-800">{tripVehicleName} ({tripPassengers} Pass)</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Total Fare</span>
                      <strong className="font-mono text-emerald-600">₹{tripFare.toLocaleString('en-IN')} (Pay to Driver)</strong>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fromLocation)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Pickup Map</span>
                      </a>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(toLocation)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-black text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-1"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Drop Map</span>
                      </a>
                    </div>
                    <button
                      onClick={() => setCurrentSlide(12)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-[#0066FF] hover:bg-blue-600 text-white font-black text-xs shadow-lg shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Start Trip / Navigate to Pickup</span>
                    </button>
                    <button
                      onClick={() => setCurrentSlide(6)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50"
                    >
                      Cancel Trip
                    </button>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">11</span>
                    <span>Trip Details</span>
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 12: NAVIGATE TO PICKUP */}
            {/* ============================================================ */}
            {currentSlide === 12 && (
              <div className="flex-1 flex flex-col justify-between bg-slate-100 relative overflow-hidden">
                <div className="p-4 flex items-center justify-between absolute top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md shadow-sm">
                  <button onClick={() => setCurrentSlide(11)} className="p-1 rounded-full hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                  </button>
                  <h2 className="text-sm font-black text-[#071B49]">To Pickup Location</h2>
                  <div className="w-5"></div>
                </div>

                {/* Map Graphic Preview */}
                <div className="flex-1 w-full relative bg-[#E2E8F0] flex items-center justify-center overflow-hidden">
                  <svg className="w-full h-full opacity-60">
                    <rect width="100%" height="100%" fill="#F1F5F9" />
                    <path d="M 60 120 L 160 220 L 300 240 L 320 380" fill="none" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                  {/* ETA floating chip */}
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-bold">12 mins • 3.5 km</span>
                  </div>
                </div>

                {/* Bottom Sheet for Pickup */}
                <div className="bg-white rounded-t-3xl p-5 shadow-2xl border-t border-slate-200 space-y-3 z-30">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Pickup</span>
                      <h4 className="font-black text-xs text-slate-800">{fromLocation}</h4>
                      <span className="text-[11px] text-slate-500">{customerName} ({customerPhone})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`tel:${customerPhone}`} className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
                        <Phone className="w-4 h-4" />
                      </a>
                      <button onClick={() => alert('Chat opened')} className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Direct Google Maps Navigation */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fromLocation)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>🗺️ Open Turn-by-Turn in Google Maps</span>
                  </a>

                  {/* Customer Start Ride OTP Verification (Rapido Style) */}
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-300 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-900 font-black flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Passenger Start OTP:</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          maxLength={4}
                          value={driverEnteredOtp}
                          onChange={(e) => setDriverEnteredOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="• • • •"
                          className="w-20 text-center font-mono font-black text-sm text-slate-900 bg-white border-2 border-amber-400 px-2 py-1 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setDriverEnteredOtp(activeTripOtp)}
                          className="text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold px-1.5 py-1 rounded cursor-pointer"
                          title="Quick fill for test mode"
                        >
                          Test Fill
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-800">
                      Ask passenger for the 4-digit PIN shown on their phone to verify & unlock trip (Rapido style).
                    </p>
                  </div>

                  {/* Odometer Start Input */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Odometer Start (KM):</span>
                    <input
                      type="text"
                      value={odometerStart}
                      onChange={(e) => setOdometerStart(e.target.value)}
                      className="w-28 text-right font-mono font-bold text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded"
                    />
                  </div>

                  <button
                    onClick={handleStartTrip}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Arrived & Start Trip</span>
                  </button>

                  <div className="text-center pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-700">
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">12</span>
                      <span>Navigate to Pickup</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 13: TRIP STARTED */}
            {/* ============================================================ */}
            {currentSlide === 13 && (
              <div className="flex-1 flex flex-col justify-between p-5 bg-white text-center overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => setCurrentSlide(12)} className="p-1 rounded-full hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                  </button>
                  <h2 className="text-base font-black text-[#071B49]">Trip Started</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 animate-pulse">
                    In Progress
                  </span>
                </div>

                <div className="my-auto space-y-4">
                  {/* Live Trip Running Counter matching Mockup 2: 00:00:12 */}
                  <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Active Trip Duration
                    </span>
                    <div className="text-3xl font-black font-mono tracking-wider text-emerald-400">
                      {formatTimer(tripTimerSeconds)}
                    </div>
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      Trip ID: {requestTripId}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-500">Pickup Time</span>
                      <strong className="text-slate-800">{tripTime || 'Immediate'}</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-500">Route</span>
                      <strong className="text-slate-800 text-right break-words max-w-[200px]">{fromLocation} → {toLocation}</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-500">Vehicle & Capacity</span>
                      <strong className="text-slate-800">{tripVehicleName} ({tripPassengers} Pass)</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Odometer Start</span>
                      <strong className="font-mono text-slate-900">{odometerStart} km</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={() => setCurrentSlide(14)}
                      className="py-3 px-3 rounded-2xl bg-[#0066FF] hover:bg-blue-600 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>On the Way Map</span>
                    </button>
                    <button
                      onClick={() => setCurrentSlide(15)}
                      className="py-3 px-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>End Trip</span>
                    </button>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">13</span>
                    <span>Trip Started</span>
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 14: DURING TRIP / ON THE WAY */}
            {/* ============================================================ */}
            {currentSlide === 14 && (
              <div className="flex-1 flex flex-col justify-between bg-slate-100 relative overflow-hidden">
                <div className="p-4 flex items-center justify-between absolute top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md shadow-sm">
                  <button onClick={() => setCurrentSlide(13)} className="p-1 rounded-full hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                  </button>
                  <h2 className="text-sm font-black text-[#071B49]">On the Way</h2>
                  <div className="w-5"></div>
                </div>

                {/* Map Graphic Preview */}
                <div className="flex-1 w-full relative bg-[#E2E8F0] flex items-center justify-center overflow-hidden">
                  <svg className="w-full h-full opacity-60">
                    <rect width="100%" height="100%" fill="#F1F5F9" />
                    <path d="M 40 400 Q 180 300 240 180 T 360 80" fill="none" stroke="#0066FF" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                  {/* Highway Banner */}
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-blue-900 text-white px-5 py-2 rounded-full shadow-lg text-center">
                    <span className="text-[10px] text-blue-200 block uppercase font-bold">To Mysuru</span>
                    <strong className="text-xs">145 km • 3h 20m</strong>
                  </div>
                </div>

                {/* Bottom Card matching Mockup 2 */}
                <div className="bg-white rounded-t-3xl p-5 shadow-2xl border-t border-slate-200 space-y-3 z-30">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Next Stop</span>
                      <h4 className="font-black text-sm text-slate-800">Mysuru Palace</h4>
                      <span className="text-xs text-blue-600 font-bold">ETA 10:35 AM</span>
                    </div>

                    <a href="tel:+919876543210" className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCurrentSlide(11)}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                    >
                      Trip Details
                    </button>
                    <button
                      onClick={() => setCurrentSlide(15)}
                      className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow"
                    >
                      Arrived / End Trip
                    </button>
                  </div>

                  <div className="text-center pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-700">
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">14</span>
                      <span>During Trip</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 15: END TRIP */}
            {/* ============================================================ */}
            {currentSlide === 15 && (
              <div className="flex-1 flex flex-col justify-between p-6 bg-white text-center overflow-y-auto">
                <div className="my-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-emerald-600">Trip Completed!</h2>
                    <span className="text-xs font-mono font-bold text-slate-500">Trip ID: {requestTripId}</span>
                  </div>

                  {/* Summary Details matching Mockup 2 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-500">End Time</span>
                      <strong className="text-slate-800">10:45 AM</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-500">Total Duration</span>
                      <strong className="text-slate-800 font-mono">3h 30m</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-500">Total Distance</span>
                      <strong className="text-slate-800 font-mono">146 km</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Odometer End</span>
                      <div className="flex items-center gap-1 font-mono">
                        <input
                          type="text"
                          value={odometerEnd}
                          onChange={(e) => setOdometerEnd(e.target.value)}
                          className="w-24 text-right font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded"
                        />
                        <span>km</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCompleteTrip}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#0066FF] hover:bg-blue-600 text-white font-black text-xs shadow-lg shadow-blue-500/20 active:scale-98 transition-all"
                  >
                    Submit Trip
                  </button>
                </div>

                <div className="text-center pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">15</span>
                    <span>End Trip</span>
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 16: ATTENDANCE & HISTORY */}
            {/* ============================================================ */}
            {currentSlide === 16 && (
              <div className="flex-1 flex flex-col justify-between bg-white overflow-y-auto">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentSlide(6)} className="p-1 rounded-full hover:bg-slate-100">
                      <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <h2 className="text-base font-black text-[#071B49]">My Activity</h2>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' }).format(new Date())}</span>
                </div>

                <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                  {/* Tabs: Daily Log / Trip History */}
                  <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
                    <button
                      onClick={() => setHistoryTab('DAILY_LOG')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${
                        historyTab === 'DAILY_LOG' ? 'bg-[#0066FF] text-white shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Daily Log
                    </button>
                    <button
                      onClick={() => setHistoryTab('TRIP_HISTORY')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${
                        historyTab === 'TRIP_HISTORY' ? 'bg-[#0066FF] text-white shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Trip History
                    </button>
                  </div>

                  {historyTab === 'DAILY_LOG' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="rounded-xl bg-blue-50 p-3"><strong className="block text-lg text-blue-700">{attendanceDays}</strong><span className="text-[10px] text-slate-600">Attendance days</span></div>
                        <div className="rounded-xl bg-emerald-50 p-3"><strong className="block text-lg text-emerald-700">{monthKm.toLocaleString('en-IN')}</strong><span className="text-[10px] text-slate-600">Month km</span></div>
                        <div className="rounded-xl bg-indigo-50 p-3"><strong className="block text-lg text-indigo-700">{completedMonthDuties.length}</strong><span className="text-[10px] text-slate-600">Completed duties</span></div>
                        <div className="rounded-xl bg-amber-50 p-3"><strong className="block text-lg text-amber-700">₹{estimatedMonthlyPay.toLocaleString('en-IN')}</strong><span className="text-[10px] text-slate-600">Estimated pay*</span></div>
                      </div>
                      <p className="text-[10px] text-slate-500">*Based on saved shifts and your current salary settings; admin confirms the final payroll.</p>
                      {myDutyLogs.length ? myDutyLogs.map((duty, index) => {
                        const login = duty.loginTime || duty.login_time;
                        const logout = duty.logoutTime || duty.logout_time;
                        const distance = Number(duty.dailyKm ?? duty.daily_km ?? 0);
                        return <article key={duty.id || duty._id || `${duty.duty_code}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs">
                          <div className="flex justify-between gap-2"><strong className="text-slate-800">{duty.companyName || duty.company_name || 'Company duty'}</strong><span className="font-bold text-blue-700">{duty.status}</span></div>
                          <p className="mt-1 text-slate-600">{duty.pickupLocation || duty.pickup_location || 'Pickup not recorded'} → {duty.destinationLocation || duty.destination_location || 'Destination not recorded'}</p>
                          <p className="mt-1 text-slate-500">Shift {duty.externalTripId || duty.external_trip_id || duty.duty_code || '—'} · {duty.vehicleReg || duty.vehicle_reg || 'Vehicle not recorded'}</p>
                          <div className="mt-2 flex justify-between text-slate-500"><span>In {displayTime(login)}</span><span>Out {displayTime(logout)}</span></div>
                          <p className="mt-1 font-bold text-slate-700">{logout ? `${distance.toLocaleString('en-IN')} km completed` : 'Shift in progress'} · Odometer {duty.startKm ?? duty.start_km ?? '—'}{duty.endKm ?? duty.end_km ? ` → ${duty.endKm ?? duty.end_km}` : ''}</p>
                          {(duty.routeDetails || duty.route_details) && <p className="mt-1 text-slate-500">Route notes: {duty.routeDetails || duty.route_details}</p>}
                        </article>;
                      }) : <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">No company duty check-ins have been recorded for this driver yet.</div>}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {myBookings.length ? myBookings.map((booking, index) => {
                        const bSched = formatBookingSchedule(
                          booking.journey_date || booking.journeyDate,
                          booking.journey_time || booking.journeyTime,
                          booking.return_date || booking.returnDate
                        );
                        const bBadge = getTripTypeBadge(booking.trip_type || booking.tripType);
                        const bFare = Number(booking.quoted_amount || booking.quotedAmount || 0);

                        return (
                          <article key={booking.id || index} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-2 shadow-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-bold text-blue-700">{booking.booking_code || booking.bookingCode || 'Passenger trip'}</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${bBadge.color}`}>
                                  {bBadge.label}
                                </span>
                                <span className="font-black text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                                  {booking.status}
                                </span>
                              </div>
                            </div>

                            {/* Schedule & Timing Hero */}
                            <div className="bg-white p-2 rounded-xl border border-slate-200/80 space-y-0.5">
                              <div className="text-[11px] font-black text-[#071B49]">
                                📅 {bSched.dayName ? `${bSched.dayName}, ` : ''}{bSched.formattedDate} • ⏰ {bSched.timeText}
                              </div>
                              {bSched.returnDateText && (
                                <div className="text-[10px] font-semibold text-purple-700">
                                  🔄 Return: {bSched.returnDateText}
                                </div>
                              )}
                            </div>

                            <div className="text-slate-700 font-medium space-y-1">
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="break-words">{booking.pickup}</span>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                                <span className="break-words">{booking.destination}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-slate-500 text-[11px]">
                              <span>{booking.vehicle_name || booking.vehicleName || (booking as any).vehicle_category || 'Commercial Cab'} ({booking.passengers || 4} Pass)</span>
                              <strong className="font-mono font-black text-emerald-700 text-xs">₹{bFare.toLocaleString('en-IN')}</strong>
                            </div>
                          </article>
                        );
                      }) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                          No passenger trips are assigned to your account yet.
                        </div>
                      )}
                    </div>
                  )}                </div>

                {/* Bottom App Navigation */}
                <div className="border-t border-slate-100 bg-white px-6 py-2.5 flex items-center justify-between text-slate-500">
                  <button onClick={() => setCurrentSlide(6)} className="flex flex-col items-center gap-0.5 hover:text-blue-600">
                    <Compass className="w-4 h-4" />
                    <span className="text-[9px]">Home</span>
                  </button>
                  <button onClick={() => setCurrentSlide(9)} className="flex flex-col items-center gap-0.5 hover:text-blue-600">
                    <Car className="w-4 h-4" />
                    <span className="text-[9px]">Trips</span>
                  </button>
                  <button className="flex flex-col items-center gap-0.5 text-blue-600 font-bold">
                    <Wallet className="w-4 h-4" />
                    <span className="text-[9px]">Earnings</span>
                  </button>
                  <button className="flex flex-col items-center gap-0.5 hover:text-blue-600">
                    <UserIcon className="w-4 h-4" />
                    <span className="text-[9px]">Profile</span>
                  </button>
                </div>

                <div className="text-center pb-2 bg-white">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-700">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">16</span>
                    <span>Attendance & History</span>
                  </span>
                </div>
              </div>
            )}

            {currentSlide === 17 && (
              <div className="flex-1 bg-white overflow-y-auto p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div><h2 className="text-lg font-black text-[#071B49]">Driver verification</h2><p className="text-xs text-slate-500">Enter your details and upload clear documents for admin review.</p></div>
                  {currentUser?.role === 'DRIVER' && <button onClick={() => { logout(); setCurrentSlide(3); }} className="text-xs font-bold text-slate-500">Log out</button>}
                </div>
                {driverKyc && <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900"><strong>Status: {driverKyc.kyc_status}</strong>{driverKyc.rejection_reason && <p className="mt-1 text-red-700">{driverKyc.rejection_reason}</p>}</div>}
                {onboardingError && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{onboardingError}</div>}
                <section className="space-y-2">
                  <h3 className="text-xs uppercase tracking-wide font-black text-slate-500">Driver and vehicle details</h3>
                  <input value={driverAddress} onChange={e => setDriverAddress(e.target.value)} placeholder="Full residential address" className="w-full rounded-xl border p-3 text-sm" />
                  <div className="grid grid-cols-2 gap-2"><input value={driverLicenseNumber} onChange={e => setDriverLicenseNumber(e.target.value)} placeholder="Driving licence number" className="min-w-0 rounded-xl border p-3 text-sm" /><input value={driverAadhaarNumber} onChange={e => setDriverAadhaarNumber(e.target.value)} placeholder="Aadhaar number" className="min-w-0 rounded-xl border p-3 text-sm" /></div>
                  <div className="grid grid-cols-2 gap-2"><input value={driverPanNumber} onChange={e => setDriverPanNumber(e.target.value)} placeholder="PAN number" className="min-w-0 rounded-xl border p-3 text-sm" /><input type="number" min="0" value={driverExperience} onChange={e => setDriverExperience(e.target.value)} placeholder="Driving experience (years)" className="min-w-0 rounded-xl border p-3 text-sm" /></div>
                  <input value={signUpVehicleNo} onChange={e => setSignUpVehicleNo(e.target.value)} placeholder="Vehicle registration number" className="w-full rounded-xl border p-3 text-sm font-mono" />
                  <select value={signUpVehicleType} onChange={e => setSignUpVehicleType(e.target.value)} className="w-full rounded-xl border p-3 text-sm"><option>Tempo Traveller</option><option>Mini Bus</option><option>Toyota Innova Crysta</option><option>Sedan</option></select>
                </section>
                <section className="space-y-2">
                  <h3 className="text-xs uppercase tracking-wide font-black text-slate-500">Vehicle documents</h3>
                  {[
                    ['rc', 'RC Card', true], ['insurance', 'Insurance', true], ['emissions', 'Emissions / PUC certificate', true], ['fitness', 'Fitness certificate', true], ['b_extract', 'B-Extract', false], ['permit', 'Permit', true], ['road_tax', 'Road tax receipt', true]
                  ].map(([key, label, expiry]) => {
                    const id = String(key); const prior = driverKyc?.documents?.[id];
                    return <div key={id} className="rounded-xl border border-slate-200 p-3 space-y-2"><div className="flex justify-between gap-2"><strong className="text-sm">{label}</strong><span className="text-[10px] text-slate-500">{documentFiles[id]?.name || prior?.status || 'Required'}</span></div><input type="file" accept="image/*,application/pdf" onChange={e => handleDocumentSelect(id, e.target.files?.[0])} className="w-full text-xs" />{expiry && <label className="block text-[11px] text-slate-500">Expiry date <input type="date" value={expiryDates[id] || ''} onChange={e => setExpiryDates(prev => ({ ...prev, [id]: e.target.value }))} className="ml-2 rounded-lg border p-1.5" /></label>}{prior?.rejection_reason && <p className="text-xs text-red-700">Admin: {prior.rejection_reason}</p>}</div>;
                  })}
                </section>
                <section className="space-y-2">
                  <h3 className="text-xs uppercase tracking-wide font-black text-slate-500">Driver documents</h3>
                  {[
                    ['dl', 'Driving licence', true], ['aadhaar', 'Aadhaar card', false], ['pan', 'PAN card', false]
                  ].map(([key, label, expiry]) => {
                    const id = String(key); const prior = driverKyc?.documents?.[id];
                    return <div key={id} className="rounded-xl border border-slate-200 p-3 space-y-2"><div className="flex justify-between gap-2"><strong className="text-sm">{label}</strong><span className="text-[10px] text-slate-500">{documentFiles[id]?.name || prior?.status || 'Required'}</span></div><input type="file" accept="image/*,application/pdf" onChange={e => handleDocumentSelect(id, e.target.files?.[0])} className="w-full text-xs" />{expiry && <label className="block text-[11px] text-slate-500">Expiry date <input type="date" value={expiryDates[id] || ''} onChange={e => setExpiryDates(prev => ({ ...prev, [id]: e.target.value }))} className="ml-2 rounded-lg border p-1.5" /></label>}{prior?.rejection_reason && <p className="text-xs text-red-700">Admin: {prior.rejection_reason}</p>}</div>;
                  })}
                </section>
                <section className="rounded-xl border border-slate-200 p-3 space-y-2"><h3 className="text-sm font-bold">Face verification photo</h3><p className="text-[11px] text-slate-500">Capture a fresh, well-lit selfie. This photo is reviewed by an admin; upload alone does not prove liveness or identity.</p><input type="file" accept="image/*" capture="user" onChange={e => handleDocumentSelect('face', e.target.files?.[0])} className="w-full text-xs" /><span className="text-[10px] text-slate-500">{documentFiles.face?.name || driverKyc?.face_document?.status || 'Required'}</span>{driverKyc?.face_document?.rejection_reason && <p className="text-xs text-red-700">Admin: {driverKyc.face_document.rejection_reason}</p>}</section>
                <button disabled={onboardingSaving || currentUser?.role !== 'DRIVER'} onClick={handleSubmitOnboarding} className="w-full py-3 rounded-xl bg-blue-600 disabled:bg-slate-400 text-white font-black text-sm">{onboardingSaving ? 'Submitting securely…' : 'Submit documents for admin approval'}</button>
                {currentUser?.role !== 'DRIVER' && <p className="text-center text-xs text-slate-500">Create or sign in to a driver account first. Your files are only submitted after authentication.</p>}
              </div>
            )}

            {/* Bottom Home Indicator Bar */}
            <div className="w-32 h-1 bg-slate-900/30 rounded-full mx-auto my-2 shrink-0"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DriverPortal;

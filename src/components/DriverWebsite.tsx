import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Info,
  Camera,
  Upload,
  Image as ImageIcon,
  Home
} from 'lucide-react';
import { exportToExcel, printSectionTable } from '../utils/exportUtils';
import { TripType, DriverKycApplication } from '../types';
import { getDefaultInductionDocuments } from '../utils/documentSamples';
import { parseLocationDetails } from '../utils/locationUtils';
import { getBookingTripMetrics } from '../services/distanceService';

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
    avatar: 'RK',
    onboardedType: 'COMPANY_DUTY' as const
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
    avatar: 'SG',
    onboardedType: 'REGULAR' as const // Inducted strictly for Daily Trips (Locked from Company Duty)
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
    avatar: 'MR',
    onboardedType: 'COMPANY_DUTY' as const
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
    kycRequests,
    refreshDriverKyc,
    submitDriverKyc,
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

  // Driver Onboarding Type: 'COMPANY_DUTY' (Corporate Chauffeur) | 'REGULAR' (Daily Trips Only)
  const [driverOnboardedType, setDriverOnboardedType] = useState<'COMPANY_DUTY' | 'REGULAR'>(() => {
    const saved = localStorage.getItem('sjt_driver_onboarded_type') as 'COMPANY_DUTY' | 'REGULAR';
    if (saved === 'REGULAR' || saved === 'COMPANY_DUTY') return saved;
    try {
      const savedChauffeur = localStorage.getItem('sjt_active_chauffeur');
      if (savedChauffeur) {
        const parsed = JSON.parse(savedChauffeur);
        if (parsed.onboardedType) return parsed.onboardedType;
      }
    } catch {}
    return 'COMPANY_DUTY';
  });

  // Duty Alert & Access Restriction Modal State
  const [dutyAlertModal, setDutyAlertModal] = useState<{
    isOpen: boolean;
    type: 'DAILY_TRIPS_LOCKED' | 'CORPORATE_SHIFT_PENDING' | 'ACTIVE_SHIFT_RUNNING';
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

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
  const [activeChauffeur, setActiveChauffeur] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('sjt_active_chauffeur');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: '',
      name: '',
      phone: '',
      email: '',
      vehicleReg: '',
      vehicleType: '',
      rating: '5.0 ★',
      trips: '0 trips',
      avatar: 'SC',
      onboardedType: 'COMPANY_DUTY'
    };
  });

  // Login Form State (Strictly empty - driver enters their own credentials)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Extended KYC & Induction Signup Form State (Starts clean with zero pre-filled dummy data)
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDl, setRegDl] = useState('');
  const [regAadhaar, setRegAadhaar] = useState('');
  const [regPan, setRegPan] = useState('');
  const [regVehicleType, setRegVehicleType] = useState('Tempo Traveller (17 Seater)');
  const [regVehicleReg, setRegVehicleReg] = useState('');
  const [regMakeModel, setRegMakeModel] = useState('');
  const [regYear, setRegYear] = useState('');
  const [regColor, setRegColor] = useState('');
  const [regSeats, setRegSeats] = useState('');
  const [regBaseArea, setRegBaseArea] = useState('');
  const [regDocs, setRegDocs] = useState<Record<string, { file_name: string; data?: string; expires_at?: string; status?: 'APPROVED' | 'PENDING' | 'REJECTED' }>>({});
  const [previewingImage, setPreviewingImage] = useState<{ title: string; url: string } | null>(null);
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [submittedKycResult, setSubmittedKycResult] = useState<any | null>(null);

  const handleFileUpload = (docKey: string, file: File) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8 MB limit. Please select a smaller photo or document.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUri = reader.result;
        setRegDocs(prev => ({
          ...prev,
          [docKey]: {
            file_name: file.name,
            data: dataUri,
            status: 'PENDING'
          }
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (docKey: string) => {
    setRegDocs(prev => {
      const next = { ...prev };
      delete next[docKey];
      return next;
    });
  };

  const renderDocUploadField = (
    docKey: string, 
    title: string, 
    sampleFileName: string, 
    hint?: string,
    required = false
  ) => {
    const currentDoc = regDocs[docKey];
    return (
      <div className="mt-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="font-bold text-slate-300 text-[11px] flex items-center gap-1.5 min-w-0">
            <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="break-words">{title}</span>
            {required && <span className="text-red-400 shrink-0">*</span>}
          </span>
          {currentDoc?.data ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30 flex items-center gap-1 shrink-0">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span>Uploaded ✓</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 shrink-0">
              {hint || 'Image Required'}
            </span>
          )}
        </div>
        
        {currentDoc?.data ? (
          <div className="flex items-center gap-2.5 p-1.5 bg-slate-900 rounded-lg border border-slate-700/60">
            <div 
              onClick={() => setPreviewingImage({ title, url: currentDoc.data! })}
              className="w-14 h-12 rounded-lg overflow-hidden bg-slate-800 border border-slate-600 shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 transition relative group"
              title="Click to zoom image"
            >
              <img src={currentDoc.data} alt={title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <Eye className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[11px] text-white truncate">{currentDoc.file_name || sampleFileName}</div>
              <div className="text-[10px] text-emerald-400 font-semibold">Document Attached</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewingImage({ title, url: currentDoc.data! })}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3 h-3" />
                <span>View</span>
              </button>
              <label className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer transition">
                <span>Change</span>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  className="hidden" 
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(docKey, f);
                  }} 
                />
              </label>
              <button
                type="button"
                onClick={() => handleRemoveDoc(docKey)}
                className="p-1 hover:bg-red-950/60 text-red-400 hover:text-red-300 rounded transition cursor-pointer"
                title="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed border-slate-700 hover:border-blue-500/60 bg-slate-900/60 hover:bg-slate-900 cursor-pointer transition text-center group">
            <Camera className="w-5 h-5 text-slate-400 group-hover:text-blue-400 mb-1 transition" />
            <span className="text-[11px] font-bold text-slate-300 group-hover:text-white">
              Upload or Take Photo of {title}
            </span>
            <span className="text-[9px] text-slate-500 mt-0.5">
              Supports JPG, PNG, WebP or PDF (Max 8 MB)
            </span>
            <input 
              type="file" 
              accept="image/*,application/pdf" 
              className="hidden" 
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(docKey, f);
              }} 
            />
          </label>
        )}
      </div>
    );
  };

  // Extended Driver Induction Form fields (All strictly start empty so driver enters their own details)
  const [regVendorName, setRegVendorName] = useState('');
  const [regFatherName, setRegFatherName] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regEducation, setRegEducation] = useState('');
  const [regTotalExp, setRegTotalExp] = useState('');
  const [regInductedDate, setRegInductedDate] = useState('');
  const [regFingerprintAck, setRegFingerprintAck] = useState(false);
  const [regSignatureAck, setRegSignatureAck] = useState(false);

  // Driver Document Details with Dates
  const [regDlIssueDate, setRegDlIssueDate] = useState('');
  const [regDlExpiryDate, setRegDlExpiryDate] = useState('');
  const [regGovtIdType, setRegGovtIdType] = useState('Aadhaar');
  const [regGovtIdIssueDate, setRegGovtIdIssueDate] = useState('');
  const [regGovtIdExpiryDate, setRegGovtIdExpiryDate] = useState('');
  const [regPoliceIssueDate, setRegPoliceIssueDate] = useState('');
  const [regPoliceExpiryDate, setRegPoliceExpiryDate] = useState('');
  const [regMedicalIssueDate, setRegMedicalIssueDate] = useState('');
  const [regMedicalExpiryDate, setRegMedicalExpiryDate] = useState('');
  const [regBgvAgency, setRegBgvAgency] = useState('');

  // Duties & References (Empty defaults - driver fills their own work schedule & references)
  const [regDutiesPerDay, setRegDutiesPerDay] = useState('');
  const [regCompaniesServing, setRegCompaniesServing] = useState('');
  const [regEmergencyContactName, setRegEmergencyContactName] = useState('');
  const [regEmergencyContactPhone, setRegEmergencyContactPhone] = useState('');
  const [regRef1Name, setRegRef1Name] = useState('');
  const [regRef1Phone, setRegRef1Phone] = useState('');
  const [regRef2Name, setRegRef2Name] = useState('');
  const [regRef2Phone, setRegRef2Phone] = useState('');

  // Vehicle Induction Form fields
  const [regOwnership, setRegOwnership] = useState<'ATTACHED' | 'OWNED'>('ATTACHED');
  const [regFuelType, setRegFuelType] = useState<'Diesel' | 'Petrol' | 'CNG' | 'EV'>('Diesel');
  const [regRcIssueDate, setRegRcIssueDate] = useState('');
  const [regRcExpiryDate, setRegRcExpiryDate] = useState('');
  const [regInsuranceIssueDate, setRegInsuranceIssueDate] = useState('');
  const [regInsuranceExpiryDate, setRegInsuranceExpiryDate] = useState('');
  const [regFcIssueDate, setRegFcIssueDate] = useState('');
  const [regFcExpiryDate, setRegFcExpiryDate] = useState('');
  const [regPermitIssueDate, setRegPermitIssueDate] = useState('');
  const [regPermitExpiryDate, setRegPermitExpiryDate] = useState('');
  const [regTaxIssueDate, setRegTaxIssueDate] = useState('');
  const [regTaxExpiryDate, setRegTaxExpiryDate] = useState('');
  const [regEmissionIssueDate, setRegEmissionIssueDate] = useState('');
  const [regEmissionExpiryDate, setRegEmissionExpiryDate] = useState('');

  // Safety Accessories Checklist (9 items with YES/NO)
  const [regAccessories, setRegAccessories] = useState<Record<string, boolean>>({
    fire_ext: true,
    first_aid_kit: true,
    co_sticker: true,
    torch: true,
    umbrella: true,
    music_system: true,
    mobile_handsfree: true,
    fixed_gps: true,
    fixed_panic_button: true
  });

  // Vehicle Condition Checklist (9 items with WORKING / ACCEPTED YES/NO)
  const [regVehicleCondition, setRegVehicleCondition] = useState<Record<string, boolean>>({
    head_lights: true,
    indicators: true,
    body_rattle: true,
    tyres: true,
    spare_wheel: true,
    interior_cleanliness: true,
    seats_condition: true,
    seat_belts: true,
    tool_kit: true
  });

  // Status Lookup State
  const [statusLookupInput, setStatusLookupInput] = useState('');
  const [statusLookupResult, setStatusLookupResult] = useState<any | null>(null);
  const [statusLookupLoading, setStatusLookupLoading] = useState(false);
  const [statusLookupError, setStatusLookupError] = useState('');

  // Announcement Banner State
  const [showLaunchBanner, setShowLaunchBanner] = useState(true);
  const [showPreRegisterModal, setShowPreRegisterModal] = useState(false);
  const [preRegisterPhone, setPreRegisterPhone] = useState('');
  const [preRegisterSuccess, setPreRegisterSuccess] = useState(false);

  // Driver Identity Coordinates
  const isRealDriverUser = currentUser?.role === 'DRIVER';
  const driverId = isRealDriverUser ? currentUser.id : (activeChauffeur?.id || '');
  const driverName = isRealDriverUser ? currentUser.name : (activeChauffeur?.name || 'SJT Driver');
  const driverPhone = isRealDriverUser ? currentUser.phone : (activeChauffeur?.phone || '');
  const vehicleReg = (isRealDriverUser ? (currentUser.assigned_vehicle || (currentUser as any)?.vehicle_reg || driverKyc?.assigned_vehicle_reg || driverKyc?.vehicle_reg) : activeChauffeur?.vehicleReg) || (driverKyc?.assigned_vehicle_reg || driverKyc?.vehicle_reg || '');
  const vehicleType = (isRealDriverUser ? (driverKyc?.vehicle_type || (currentUser as any)?.vehicle_type) : activeChauffeur?.vehicleType) || (driverKyc?.vehicle_type || 'Commercial Fleet');

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

  // Availability & Online Status (Driver must explicitly click Online to receive bookings)
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sjt_driver_is_online') === 'true';
    } catch {
      return false;
    }
  });
  const [availabilitySaving, setAvailabilitySaving] = useState<boolean>(false);

  // Big Rapido / Porter Style Incoming Offer Popup States
  const [activeOfferPopupRide, setActiveOfferPopupRide] = useState<any | null>(null);
  const [dismissedOfferIds, setDismissedOfferIds] = useState<Set<string>>(new Set());
  const [offerCountdown, setOfferCountdown] = useState<number>(30);

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
    // Purge legacy dummy bookings from localStorage on mount
    try {
      const raw = localStorage.getItem('sjt_bookings_list');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((b: any) =>
            b && !String(b.id || '').startsWith('bkg_') &&
            !['SJT-544066', 'SJT-987128', 'SJT-766173'].includes(b.bookingCode || b.booking_code) &&
            !['Aravind Swaminathan', 'Test Passenger', 'Overlapping Customer', 'Vinay Kumar', 'Priya Sharma', 'Antigravity Test Customer'].includes(b.customerName || b.customer_name)
          );
          localStorage.setItem('sjt_bookings_list', JSON.stringify(cleaned));
        }
      }
    } catch { }

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
    // When driver is OFFLINE, strictly hide all bookings
    if (!isOnline) return [];

    return bookings.filter(b => {
      // Exclude legacy mock / dummy records
      if (String(b.id || '').startsWith('bkg_')) return false;
      const code = b.booking_code || b.bookingCode || '';
      if (['SJT-544066', 'SJT-987128', 'SJT-766173'].includes(code)) return false;
      const name = b.customer_name || b.customerName || '';
      if (['Aravind Swaminathan', 'Test Passenger', 'Overlapping Customer', 'Vinay Kumar', 'Priya Sharma', 'Antigravity Test Customer'].includes(name)) return false;

      const isUnassigned = !b.assigned_driver_id || b.assigned_driver_id === '';
      const isPendingStatus = ['PENDING', 'CONFIRMED', 'REQUESTED'].includes(String(b.status || '').toUpperCase());
      const notFinished = b.status !== 'CANCELLED' && b.status !== 'COMPLETED';
      return isUnassigned && isPendingStatus && notFinished;
    });
  }, [bookings, isOnline]);

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
    // 1. Trying to switch to COMPANY_DUTY
    if (targetMode === 'COMPANY_DUTY') {
      if (driverOnboardedType === 'REGULAR') {
        // Daily Trips driver CANNOT switch to Company Duty without corporate induction dossier
        setDutyAlertModal({
          isOpen: true,
          type: 'DAILY_TRIPS_LOCKED',
          title: 'Corporate Company Duty Locked',
          message: 'You are currently onboarded for Daily Passenger Trips only. Corporate company duties require complete Corporate Fleet Induction KYC, JCPenney/SJT client badges, and 18-point vehicle clearance.',
          actionLabel: 'View Corporate KYC Dossier',
          onAction: () => {
            setActiveTab('KYC');
            setDutyAlertModal(null);
          }
        });
        return;
      }
      setDriverMode('COMPANY_DUTY');
      setActiveTab('SHIFTS');
      localStorage.setItem('sjt_driver_mode', 'COMPANY_DUTY');
      return;
    }

    // 2. Trying to switch to REGULAR (Daily Trips)
    if (targetMode === 'REGULAR') {
      if (activeDuty) {
        setDutyAlertModal({
          isOpen: true,
          type: 'ACTIVE_SHIFT_RUNNING',
          title: 'Active Corporate Shift in Progress',
          message: `You are currently on active shift: ${activeDuty.companyName || activeDuty.company_name || 'Corporate Duty'} (${activeDuty.shiftName || 'Shift'}). Please complete and check out of your active shift before switching to Daily Passenger Trips.`,
          actionLabel: 'Go to Shift Console',
          onAction: () => {
            setActiveTab('SHIFTS');
            setDutyAlertModal(null);
          }
        });
        return;
      }

      if (todayCompletedShiftsCount === 0) {
        setDutyAlertModal({
          isOpen: true,
          type: 'CORPORATE_SHIFT_PENDING',
          title: 'Corporate Duty Shift Pending',
          message: 'As an onboarded Corporate Company Duty Driver, you have assigned corporate shifts today. Complete your assigned company duty shifts before switching to Daily Passenger Trips.',
          actionLabel: 'Start Shift 1 Duty Now',
          onAction: () => {
            setActiveTab('SHIFTS');
            setDutyAlertModal(null);
          }
        });
        return;
      }

      // All assigned corporate shifts completed! Switch to Daily Trips allowed!
      setDriverMode('REGULAR');
      setActiveTab('TRIPS');
      localStorage.setItem('sjt_driver_mode', 'REGULAR');
    }
  };

  // Quick Preset Chauffeur Select
  const handleSelectPresetChauffeur = async (p: typeof PRESET_CHAUFFEURS[0]) => {
    setActiveChauffeur(p);
    setLoginIdentifier(p.email);
    const chosenOnboardType = (p as any).onboardedType || authDutyChoice || 'COMPANY_DUTY';
    setDriverOnboardedType(chosenOnboardType);
    setDriverMode(chosenOnboardType);
    setActiveTab(chosenOnboardType === 'COMPANY_DUTY' ? 'SHIFTS' : 'TRIPS');
    localStorage.setItem('sjt_active_chauffeur', JSON.stringify(p));
    localStorage.setItem('sjt_driver_logged_in', 'true');
    localStorage.setItem('sjt_driver_mode', chosenOnboardType);
    localStorage.setItem('sjt_driver_onboarded_type', chosenOnboardType);
    setShowAuthGate(false);
    try {
      await login(p.email, 'driver123', 'DRIVER', 'DRIVER_WEB');
    } catch (e) {
      console.warn('Preset auto-auth completed', e);
    }
  };

  // Driver Sign In Submit (Supports Mobile Number or Email + Driver's Own Password)
  const handleDriverLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const identifier = loginIdentifier.trim();
      let loggedInUser: any = null;
      try {
        loggedInUser = await login(identifier, loginPin, 'DRIVER');
      } catch (err: any) {
        if (!identifier.includes('@')) {
          try {
            loggedInUser = await login(`${identifier}@driver.sjttravels.com`, loginPin, 'DRIVER');
          } catch {}
        }
        if (!loggedInUser) {
          throw new Error(err?.message || 'Invalid mobile number or credentials. Please check your registered phone and password.');
        }
      }

      const latestKyc = await refreshDriverKyc().catch(() => null);
      const rawDutyMode = String(
        loggedInUser?.duty_mode ||
        (latestKyc as any)?.duty_mode ||
        (latestKyc as any)?.vehicle_details?.duty_mode ||
        ''
      ).toUpperCase();

      let chosenOnboardType: 'COMPANY_DUTY' | 'REGULAR' = 'COMPANY_DUTY';
      if (rawDutyMode === 'REGULAR' || rawDutyMode === 'DAILY_TRIPS') {
        chosenOnboardType = 'REGULAR';
      } else if (rawDutyMode === 'COMPANY_DUTY') {
        chosenOnboardType = 'COMPANY_DUTY';
      } else {
        try {
          const savedList = JSON.parse(localStorage.getItem('sjt_registered_drivers') || '[]');
          const idDigits = identifier.replace(/\D/g, '').slice(-10);
          const regMatch = savedList.find((d: any) =>
            (idDigits.length >= 10 && String(d.phone || '').replace(/\D/g, '').endsWith(idDigits)) ||
            String(d.email || '').toLowerCase() === identifier.toLowerCase()
          );
          if (regMatch?.onboardedType === 'REGULAR') chosenOnboardType = 'REGULAR';
        } catch {}
      }

      if (loggedInUser) {
        const customDriver = {
          id: loggedInUser.id,
          name: loggedInUser.name,
          phone: loggedInUser.phone || identifier,
          email: loggedInUser.email,
          vehicleReg: loggedInUser.assigned_vehicle || latestKyc?.assigned_vehicle_reg || latestKyc?.vehicle_reg || '',
          vehicleType: (loggedInUser as any).vehicle_type || latestKyc?.vehicle_type || 'Commercial Fleet',
          rating: '5.0 ★ (Fleet Partner)',
          trips: '0 trips',
          avatar: loggedInUser.name ? loggedInUser.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'SD',
          onboardedType: chosenOnboardType
        };
        setActiveChauffeur(customDriver);
        localStorage.setItem('sjt_active_chauffeur', JSON.stringify(customDriver));
      }

      setDriverOnboardedType(chosenOnboardType);
      setDriverMode(chosenOnboardType);
      setActiveTab(chosenOnboardType === 'COMPANY_DUTY' ? 'SHIFTS' : 'TRIPS');
      localStorage.setItem('sjt_driver_logged_in', 'true');
      localStorage.setItem('sjt_driver_mode', chosenOnboardType);
      localStorage.setItem('sjt_driver_onboarded_type', chosenOnboardType);
      await refreshData(true);
      setShowAuthGate(false);
    } catch (err: any) {
      setLoginError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Driver Partner Induction Registration Submit (Driver & Vehicle Forms)
  const handleDriverSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');
    try {
      if (!regName.trim() || !regPhone.trim()) {
        throw new Error('Please fill in your Full Legal Name and WhatsApp Mobile Number.');
      }
      if (!regPassword.trim() || regPassword.trim().length < 4) {
        throw new Error('Please create a driver password or PIN of at least 4 characters.');
      }
      
      const cleanPhone = regPhone.trim();
      const autoEmail = regEmail.trim() || `driver.${cleanPhone.replace(/\D/g, '')}@sjttravels.com`;

      // 1. Create Driver User Account with Driver's Own Password
      let registeredUser = null;
      try {
        registeredUser = await register({
          name: regName.trim(),
          phone: cleanPhone,
          email: autoEmail,
          password: regPassword.trim(),
          role: 'DRIVER',
          assigned_vehicle: regVehicleReg.trim().toUpperCase(),
          duty_mode: authDutyChoice
        });
      } catch (regErr: any) {
        if (regErr.message && (regErr.message.includes('already registered') || regErr.message.includes('409'))) {
          throw new Error('This mobile number is already registered. Each driver can register only once with their mobile number. Please login with your password.');
        }
        console.warn('Register API warning, proceeding with resilient induction:', regErr);
      }

      // 2. Submit Complete Driver Induction + Vehicle Induction Dossier
      const inductionPayload: Partial<DriverKycApplication> = {
        id: `ind_${Date.now()}`,
        driver_id: registeredUser?.id || `drv_${cleanPhone.replace(/\D/g, '')}`,
        vendor_name: regVendorName.trim() || 'SJT Logistics Partner',
        driver_name: regName.trim(),
        father_name: regFatherName.trim(),
        dob: regDob,
        education: regEducation,
        experience_years: Number(regTotalExp) || 0,
        inducted_date: regInductedDate || new Date().toISOString().split('T')[0],
        driver_phone: cleanPhone,
        driver_email: autoEmail,
        license_number: regDl.trim(),
        license_issue_date: regDlIssueDate,
        license_expiry_date: regDlExpiryDate,
        govt_id_type: regGovtIdType,
        govt_id_number: regGovtIdType === 'Aadhaar' ? regAadhaar.trim() : regPan.trim(),
        govt_id_issue_date: regGovtIdIssueDate,
        govt_id_expiry_date: regGovtIdExpiryDate,
        aadhar_number: regAadhaar.trim(),
        pan_number: regPan.trim(),
        police_verification_date: regPoliceIssueDate,
        police_verification_expiry: regPoliceExpiryDate,
        medical_cert_date: regMedicalIssueDate,
        medical_cert_expiry: regMedicalExpiryDate,
        bgv_agency_name: regBgvAgency.trim(),
        duties_per_day: regDutiesPerDay.trim(),
        companies_serving: regCompaniesServing.trim(),
        emergency_contact_name: regEmergencyContactName.trim(),
        emergency_contact_phone: regEmergencyContactPhone.trim(),
        reference_1_name: regRef1Name.trim(),
        reference_1_phone: regRef1Phone.trim(),
        reference_2_name: regRef2Name.trim(),
        reference_2_phone: regRef2Phone.trim(),
        fingerprint_acknowledged: regFingerprintAck,
        driver_signature_acknowledged: regSignatureAck,
        inspected_by: 'SJT Safety & Compliance Inspector',
        approved_by: 'Master Operations Admin',
        vehicle_vendor_name: regVendorName.trim() || 'SJT Fleet Partner',
        vehicle_reg: regVehicleReg.trim().toUpperCase(),
        vehicle_type: regVehicleType,
        vehicle_model: regMakeModel.trim(),
        seating_capacity: Number(regSeats) || 4,
        vehicle_ownership: regOwnership,
        fuel_type: regFuelType,
        rc_number: regVehicleReg.trim().toUpperCase(),
        rc_issue_date: regRcIssueDate,
        rc_expiry_date: regRcExpiryDate,
        insurance_issue_date: regInsuranceIssueDate,
        insurance_expiry_date: regInsuranceExpiryDate,
        fc_issue_date: regFcIssueDate,
        fc_expiry_date: regFcExpiryDate,
        permit_issue_date: regPermitIssueDate,
        permit_expiry_date: regPermitExpiryDate,
        tax_issue_date: regTaxIssueDate,
        tax_expiry_date: regTaxExpiryDate,
        emission_issue_date: regEmissionIssueDate,
        emission_expiry_date: regEmissionExpiryDate,
        accessories: regAccessories as any,
        vehicle_condition: regVehicleCondition as any,
        address: regBaseArea.trim() || 'Bengaluru, Karnataka',
        documents: regDocs as any,
        face_document: regDocs.passport_photo || null,
        duty_mode: authDutyChoice,
        kyc_status: 'PENDING',
        submitted_at: new Date().toLocaleString('en-IN')
      };

      const savedKyc = await submitDriverKyc(inductionPayload);

      const customDriver = {
        id: registeredUser?.id || `drv_${cleanPhone.replace(/\D/g, '')}`,
        name: regName.trim(),
        phone: cleanPhone,
        email: autoEmail,
        vehicleReg: regVehicleReg.trim().toUpperCase(),
        vehicleType: regVehicleType,
        rating: '5.0 ★ (Pending Admin Audit)',
        trips: '0 trips',
        avatar: regName.trim().split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'SD',
        onboardedType: authDutyChoice
      };

      // Save to registered drivers list for offline/local resilience
      try {
        const existingList = JSON.parse(localStorage.getItem('sjt_registered_drivers') || '[]');
        const updatedList = [
          ...existingList.filter((d: any) => d.phone !== cleanPhone && d.id !== customDriver.id),
          {
            ...customDriver,
            vehicle_reg: regVehicleReg.trim().toUpperCase(),
            vehicle_type: regVehicleType,
            password: regPassword.trim()
          }
        ];
        localStorage.setItem('sjt_registered_drivers', JSON.stringify(updatedList));
      } catch {}

      setActiveChauffeur(customDriver);
      localStorage.setItem('sjt_active_chauffeur', JSON.stringify(customDriver));
      localStorage.setItem('sjt_driver_logged_in', 'true');
      setDriverOnboardedType(authDutyChoice);
      localStorage.setItem('sjt_driver_onboarded_type', authDutyChoice);
      localStorage.setItem('sjt_driver_mode', authDutyChoice);

      setSubmittedKycResult({
        application_id: savedKyc?.id || `IND-BLR-${Math.floor(1000 + Math.random() * 9000)}`,
        driver_name: regName.trim(),
        vehicle_reg: regVehicleReg.trim().toUpperCase(),
        vehicle_type: regVehicleType,
        phone: cleanPhone,
        email: autoEmail,
        companies: regCompaniesServing,
        submitted_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setShowAuthGate(false);
      await refreshData(true);
      await refreshDriverKyc().catch(() => null);
    } catch (err: any) {
      setRegError(err.message || 'Could not complete registration.');
    } finally {
      setRegLoading(false);
    }
  };

  // Status Lookup Submit (Queries backend API + falls back to synced context / local records)
  const handleCheckKycStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = statusLookupInput.trim();
    if (!query) return;
    setStatusLookupLoading(true);
    setStatusLookupError('');
    setStatusLookupResult(null);

    const findLocalMatch = () => {
      const qLower = query.toLowerCase();
      const qDigits = query.replace(/\D/g, '');
      const localStored: any[] = [];
      try {
        const listRaw = localStorage.getItem('sjt_kyc_list');
        if (listRaw) localStored.push(...JSON.parse(listRaw));
        const singleRaw = localStorage.getItem('sjt_driver_kyc');
        if (singleRaw) localStored.push(JSON.parse(singleRaw));
      } catch {}
      const candidates = [...(kycRequests || []), ...localStored].filter(Boolean);
      return candidates.find(k => {
        const kDigits = String(k.driver_phone || '').replace(/\D/g, '');
        const phoneMatch = qDigits.length >= 10 && kDigits.length >= 10 && kDigits.slice(-10) === qDigits.slice(-10);
        return (
          String(k.driver_email || '').toLowerCase() === qLower ||
          (qDigits && kDigits === qDigits) ||
          phoneMatch ||
          String(k.license_number || '').toLowerCase() === qLower ||
          String(k.id || '').toLowerCase() === qLower
        );
      }) || null;
    };

    try {
      const apiBase = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:5000');
      const res = await fetch(`${apiBase}/api/driver/kyc-lookup?identifier=${encodeURIComponent(query)}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data && data.kyc_status) {
        setStatusLookupResult(data);
        return;
      }
      const localHit = findLocalMatch();
      if (localHit) {
        setStatusLookupResult(localHit);
        return;
      }
      throw new Error(data.error || 'No KYC application found for this mobile number, email, or application ID.');
    } catch (err: any) {
      const localHit = findLocalMatch();
      if (localHit) {
        setStatusLookupResult(localHit);
      } else {
        setStatusLookupError(err.message || 'No KYC application found for this identifier.');
      }
    } finally {
      setStatusLookupLoading(false);
    }
  };

  // Sign Out / Switch Driver
  const handleDriverSignOut = () => {
    localStorage.removeItem('sjt_driver_logged_in');
    setShowAuthGate(true);
  };

  // Save Availability
  const saveDriverAvailability = async (nextOnline: boolean) => {
    setAvailabilitySaving(true);
    try {
      try { localStorage.setItem('sjt_driver_is_online', String(nextOnline)); } catch (_) {}
      await fetch(`${DRIVER_API_BASE}/api/driver/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('sjt_token') || ''}` },
        body: JSON.stringify({ is_online: nextOnline, service_area: 'Bengaluru Commercial Belt' })
      });
      setIsOnline(nextOnline);
      if (!nextOnline) {
        setActiveOfferPopupRide(null);
      } else {
        // Trigger fresh sync of bookings when coming online
        refreshData(true);
      }
    } catch (err) {
      setIsOnline(nextOnline);
      if (!nextOnline) {
        setActiveOfferPopupRide(null);
      }
    } finally {
      setAvailabilitySaving(false);
    }
  };

  // Web Audio Chime synthesizer for Rapido/Porter style dispatch alert
  const playDispatchAlertTone = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playTone(659.25, 0.0, 0.15); // E5
      playTone(880.00, 0.15, 0.35); // A5
    } catch (_) {}
  }, []);

  // Monitor incoming offers and trigger Rapido/Porter style alert when Online
  useEffect(() => {
    if (!isOnline || driverMode !== 'REGULAR') {
      if (activeOfferPopupRide) setActiveOfferPopupRide(null);
      return;
    }

    const nextOffer = incomingRideRequests.find(r => !dismissedOfferIds.has(String(r.id || r.booking_code)));
    if (nextOffer) {
      if (!activeOfferPopupRide || (activeOfferPopupRide.id !== nextOffer.id && activeOfferPopupRide.booking_code !== nextOffer.booking_code)) {
        setActiveOfferPopupRide(nextOffer);
        setOfferCountdown(30);
        playDispatchAlertTone();
      }
    } else {
      setActiveOfferPopupRide(null);
    }
  }, [isOnline, driverMode, incomingRideRequests, dismissedOfferIds, playDispatchAlertTone, activeOfferPopupRide]);

  // Offer countdown timer (30s)
  useEffect(() => {
    if (!activeOfferPopupRide) return;
    const interval = setInterval(() => {
      setOfferCountdown(prev => {
        if (prev <= 1) {
          setDismissedOfferIds(old => new Set(old).add(String(activeOfferPopupRide.id || activeOfferPopupRide.booking_code)));
          setActiveOfferPopupRide(null);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeOfferPopupRide]);

  const handlePopupAccept = async () => {
    if (!activeOfferPopupRide) return;
    const rideToAccept = activeOfferPopupRide;
    setActiveOfferPopupRide(null);
    await handleAcceptRide(rideToAccept);
  };

  const handlePopupDecline = () => {
    if (!activeOfferPopupRide) return;
    setDismissedOfferIds(old => new Set(old).add(String(activeOfferPopupRide.id || activeOfferPopupRide.booking_code)));
    setActiveOfferPopupRide(null);
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
      setDutyCheckInError(`${dutyShift} has already been completed today (${alreadyCompleted.dailyKm ?? alreadyCompleted.daily_km ?? 0} KM logged). A driver can only perform each shift once per day. Please select ${nextAvailableShift}.`);
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
          label: 'Driver Documents & KYC', 
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
          label: 'Driver Documents & KYC', 
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
          label: 'Driver Documents & KYC', 
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
      <div className="min-h-screen bg-gradient-to-br from-[#020B1F] via-[#071B49] to-[#0A122C] text-slate-100 flex flex-col justify-center items-center p-3 sm:p-6 relative overflow-x-hidden font-sans">
        {/* Animated Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Central Authentication Modal Container */}
        <div className={`w-full ${authMode === 'SIGNUP' ? 'max-w-2xl' : 'max-w-xl'} bg-slate-900/90 backdrop-blur-xl border border-blue-500/30 rounded-3xl shadow-2xl p-4 sm:p-8 relative z-10 animate-fade-in my-4 sm:my-6`}>
          {/* Header & 3D Logo */}
          <div className="text-center space-y-2 mb-5 sm:mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner mb-1">
              <img src="/sjt_logo.png" alt="SJT Logo" className="h-12 w-auto object-contain mx-auto" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex flex-wrap items-center justify-center gap-2">
              <span>SJT DRIVER PORTAL</span>
              <span className="bg-[#ED1735] text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                Fleet Web
              </span>
            </h1>
            <p className="text-xs text-blue-200">
              Sharanajyoti Tours & Travels Pvt. Ltd. • Official Driver Dispatch & Shift Console
            </p>
          </div>

          {/* Mode Switcher Pills: Driver Login vs Partner Induction vs Track KYC Status */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 mb-5 text-[11px] sm:text-xs">
            <button
              type="button"
              onClick={() => { setAuthMode('LOGIN'); setLoginError(''); }}
              className={`py-2.5 px-2 rounded-xl font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center leading-tight ${
                authMode === 'LOGIN'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>Driver Login</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('SIGNUP'); setRegError(''); }}
              className={`py-2.5 px-2 rounded-xl font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center leading-tight ${
                authMode === 'SIGNUP'
                  ? 'bg-gradient-to-r from-[#ED1735] to-rose-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span>Partner Induction</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('STATUS'); setStatusLookupError(''); }}
              className={`py-2.5 px-2 rounded-xl font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center leading-tight ${
                authMode === 'STATUS'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Track KYC Status</span>
            </button>
          </div>

          {/* TAB A: DRIVER LOGIN */}
          {authMode === 'LOGIN' && (
            <div className="space-y-5 animate-fade-in">
              {/* Driver Credentials Login Form */}
              <form onSubmit={handleDriverLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Driver Mobile Number or Email
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      placeholder="Enter registered mobile number or email"
                      className="w-full pl-9 pr-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Driver Security PIN / Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      value={loginPin}
                      onChange={e => setLoginPin(e.target.value)}
                      placeholder="Enter driver password / PIN"
                      className="w-full pl-9 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
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
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-900/40 text-white font-black text-sm active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{loginLoading ? 'Logging in…' : 'Login'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB B: DRIVER PARTNER KYC ONBOARDING */}
          {authMode === 'SIGNUP' && (
            <div className="space-y-4 animate-fade-in">
              {submittedKycResult ? (
                /* Application Submitted Success State */
                <div className="p-5 sm:p-6 bg-slate-950/90 rounded-3xl border border-emerald-500/40 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                      Induction Dossier Submitted Successfully
                    </span>
                    <h2 className="text-xl font-black text-white mt-2">
                      Dossier Under Central Operations Review
                    </h2>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      Driver Induction Form and Vehicle Induction Form have been recorded for JCPenney & SJT Travels commercial fleet operations.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-left text-xs space-y-2 font-mono">
                    <div className="flex justify-between gap-2 border-b border-slate-800 pb-1.5 font-sans">
                      <span className="text-slate-400">Application Reference ID:</span>
                      <strong className="text-amber-400 font-mono font-black break-all text-right">{submittedKycResult.application_id}</strong>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-slate-800 pb-1.5 font-sans">
                      <span className="text-slate-400">Driver Partner:</span>
                      <strong className="text-white text-right">{submittedKycResult.driver_name}</strong>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-slate-800 pb-1.5 font-sans">
                      <span className="text-slate-400">Vehicle Registration:</span>
                      <strong className="text-amber-300 text-right">{submittedKycResult.vehicle_reg}</strong>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-slate-800 pb-1.5 font-sans">
                      <span className="text-slate-400">Fleet Category:</span>
                      <strong className="text-blue-300 text-right">{submittedKycResult.vehicle_type}</strong>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-slate-800 pb-1.5 font-sans">
                      <span className="text-slate-400">Corporate Duty Serving:</span>
                      <strong className="text-purple-300 text-right">{submittedKycResult.companies || 'SJT Fleet'}</strong>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-slate-800 pb-1.5 font-sans">
                      <span className="text-slate-400">Safety & Vehicle Inspection:</span>
                      <span className="text-emerald-400 font-bold text-right">✓ 9 Accessories & 9 Condition Checks Passed</span>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-slate-800 pb-1.5 font-sans">
                      <span className="text-slate-400">Audit Status:</span>
                      <span className="text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/40">
                        ⏳ PENDING CENTRAL OPERATIONS AUDIT
                      </span>
                    </div>
                  </div>

                  {/* Operational Notice */}
                  <div className="p-3.5 bg-blue-950/40 border border-blue-500/30 rounded-2xl text-left text-xs text-blue-200 space-y-1">
                    <div className="font-black text-blue-300 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Next Step: Admin Approval & Immediate Login</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      SJT Central Operations Admin reviews both induction forms. Upon approval, you can immediately log in using your registered mobile number and the secret password you created during induction.
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
                      Back to Driver Login
                    </button>
                  </div>
                </div>
              ) : (
                /* Complete Driver & Vehicle Induction Form */
                <form onSubmit={handleDriverSignup} className="space-y-4">
                  {/* DUTY PROFILE SELECTOR — SHOWN ONLY DURING PARTNER INDUCTION */}
                  <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-blue-500/30 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-black uppercase tracking-wider text-slate-300">
                      <span className="flex items-center gap-1.5 text-amber-300">
                        <Sliders className="w-3.5 h-3.5 shrink-0" />
                        <span>Select Working Duty Profile:</span>
                      </span>
                      <span className="text-[10px] text-slate-400 lowercase">during onboarding</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                            <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                            <span>Company Duty</span>
                          </span>
                          {authDutyChoice === 'COMPANY_DUTY' && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1.5 leading-snug">
                          Corporate staff shifts, daily route & KM odometer logging (Shift 1 to 10+)
                        </p>
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
                            <Car className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Daily Trips</span>
                          </span>
                          {authDutyChoice === 'REGULAR' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-emerald-200/90 mt-1.5 leading-relaxed font-semibold">
                          Local Trips • Outstation • Airport • Tourists • Packages • RAC
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Official Induction Dossier Header */}
                  <div className="p-3 bg-slate-950/90 rounded-2xl border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#ED1735] shrink-0" />
                        <span>Driver & Vehicle Induction Dossier (JCPenney / SJT Standards)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Driver Details + Vehicle Details + Document Validity Dates + 18-Point Physical Safety Checklist
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-lg shrink-0 self-start sm:self-center">
                      Official KYC Dossier
                    </span>
                  </div>

                  {/* ======================================================== */}
                  {/* FORM 1: DRIVER INDUCTION FORM (JCPenney / SJT) */}
                  {/* ======================================================== */}
                  <div className="p-3.5 sm:p-4 bg-slate-950/80 rounded-2xl border border-blue-500/30 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800 pb-2">
                      <div className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>FORM 1: DRIVER INDUCTION FORM (JCPenney / SJT)</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">Personal Details & Statutory Docs</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Vendor Name (Transporter Partner) <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={regVendorName}
                          onChange={e => setRegVendorName(e.target.value)}
                          placeholder="Vendor / Transporter Name or Self"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Driver Name (Full Legal Name) <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={e => setRegName(e.target.value)}
                          placeholder="Full Name as per DL / Aadhaar"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Father's Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={regFatherName}
                          onChange={e => setRegFatherName(e.target.value)}
                          placeholder="Father's Full Name"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Date of Birth (DOB) <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={regDob}
                          onChange={e => setRegDob(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Education Qualification <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={regEducation}
                          onChange={e => setRegEducation(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                        >
                          <option value="SSLC / 10th Standard">SSLC / 10th Standard</option>
                          <option value="Pre-University (PUC / 12th Pass)">Pre-University (PUC / 12th Pass)</option>
                          <option value="Diploma / ITI">Diploma / ITI</option>
                          <option value="Graduate (BA / B.Com / B.Sc)">Graduate (BA / B.Com / B.Sc)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Total Driving Experience (Years) <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          value={regTotalExp}
                          onChange={e => setRegTotalExp(e.target.value)}
                          placeholder="e.g. 10"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Inducted Date <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={regInductedDate}
                          onChange={e => setRegInductedDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
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
                          Create Driver Password / Security PIN <span className="text-red-400">*</span>
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
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Residential Address / Base Corridor
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

                    {/* Driver Document Details Table (DL, Govt ID, Police, Medical, BGV — PSV Badge Removed) */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                      <div className="text-[11px] font-black text-blue-300 uppercase tracking-wider flex flex-wrap items-center justify-between gap-1">
                        <span>Driver Document Details (Issued Date & Expiry Date):</span>
                        <span className="text-[10px] text-slate-400 font-normal">Physical Document Verification</span>
                      </div>

                      <div className="space-y-2.5">
                        {/* 0. Driver Passport Photo */}
                        <div className="p-2.5 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 text-xs">
                          {renderDocUploadField('passport_photo', 'Driver Passport Size Photo / Uniform Selfie', 'driver_photo.jpg', 'Upload clear face photo in uniform', true)}
                        </div>

                        {/* 1. Driving Licence */}
                        <div className="p-2.5 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="font-bold text-slate-200">1. Driving Licence (DL)</span>
                            <input
                              type="text"
                              value={regDl}
                              onChange={e => setRegDl(e.target.value)}
                              placeholder="DL # (e.g. KA-04-2018-0091823)"
                              className="w-full sm:w-56 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-amber-300"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-400 block mb-0.5">Issued Date:</span>
                              <input
                                type="date"
                                value={regDlIssueDate}
                                onChange={e => setRegDlIssueDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Expiry Date:</span>
                              <input
                                type="date"
                                value={regDlExpiryDate}
                                onChange={e => setRegDlExpiryDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800">
                            {renderDocUploadField('dl', 'Driving Licence (Front Image)', 'dl_front.jpg', 'Upload DL front', true)}
                            {renderDocUploadField('dl_back', 'Driving Licence (Back Image)', 'dl_back.jpg', 'Upload DL back')}
                          </div>
                        </div>

                        {/* 2. Government ID Proof */}
                        <div className="p-2.5 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                              <span className="font-bold text-slate-200 shrink-0">2. Government ID:</span>
                              <select
                                value={regGovtIdType}
                                onChange={e => setRegGovtIdType(e.target.value)}
                                className="w-full sm:w-auto px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-white min-w-0"
                              >
                                <option value="Aadhaar">Aadhaar Card (UIDAI)</option>
                                <option value="PAN">PAN Card (Income Tax)</option>
                                <option value="Voter ID">Voter ID (Election Comm)</option>
                              </select>
                            </div>
                            <input
                              type="text"
                              value={regGovtIdType === 'Aadhaar' ? regAadhaar : (regGovtIdType === 'PAN' ? regPan : regAadhaar)}
                              onChange={e => {
                                if (regGovtIdType === 'Aadhaar') setRegAadhaar(e.target.value);
                                else if (regGovtIdType === 'PAN') setRegPan(e.target.value.toUpperCase());
                                else setRegAadhaar(e.target.value);
                              }}
                              placeholder="ID Card Number"
                              className="w-full sm:w-52 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-400 block mb-0.5">Issued Date:</span>
                              <input
                                type="date"
                                value={regGovtIdIssueDate}
                                onChange={e => setRegGovtIdIssueDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Expiry Date:</span>
                              <input
                                type="date"
                                value={regGovtIdExpiryDate}
                                onChange={e => setRegGovtIdExpiryDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-800">
                            {renderDocUploadField('aadhaar', `${regGovtIdType} Document Image`, 'govt_id.jpg', 'Upload ID card photo', true)}
                          </div>
                        </div>

                        {/* 3. Police Verification Certificate */}
                        <div className="p-2.5 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                          <span className="font-bold text-slate-200 text-xs block">3. Police Verification Certificate</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-400 block mb-0.5">Issued Date:</span>
                              <input
                                type="date"
                                value={regPoliceIssueDate}
                                onChange={e => setRegPoliceIssueDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Expiry Date:</span>
                              <input
                                type="date"
                                value={regPoliceExpiryDate}
                                onChange={e => setRegPoliceExpiryDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                          </div>
                          {renderDocUploadField('police_certificate', 'Police Verification Certificate', 'police_clearance.jpg', 'Upload police clearance', true)}
                        </div>

                        {/* 4. Medical Fitness Certificate */}
                        <div className="p-2.5 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                          <span className="font-bold text-slate-200 text-xs block">4. Medical Fitness Certificate (Form 1-A)</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-400 block mb-0.5">Issued Date:</span>
                              <input
                                type="date"
                                value={regMedicalIssueDate}
                                onChange={e => setRegMedicalIssueDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Expiry Date:</span>
                              <input
                                type="date"
                                value={regMedicalExpiryDate}
                                onChange={e => setRegMedicalExpiryDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                          </div>
                          {renderDocUploadField('medical_certificate', 'Medical Fitness Certificate (Form 1-A)', 'medical_cert.jpg', 'Upload Form 1-A', true)}
                        </div>

                        {/* 5. Background Verification Agency */}
                        <div className="p-2.5 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                          <span className="font-bold text-slate-200 text-xs block">5. Background Verification (BGV) Agency Name</span>
                          <input
                            type="text"
                            value={regBgvAgency}
                            onChange={e => setRegBgvAgency(e.target.value)}
                            placeholder="Agency Name (e.g. AuthBridge / First Advantage / SJT Internal Ops)"
                            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Biometric Fingerprint & Signature acknowledgment */}
                      <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl space-y-2 text-xs">
                        <label className="flex items-start sm:items-center gap-2 text-slate-200 cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={regFingerprintAck}
                            onChange={e => setRegFingerprintAck(e.target.checked)}
                            className="w-4 h-4 text-emerald-500 rounded shrink-0 mt-0.5 sm:mt-0"
                          />
                          <span>✓ Biometric Hand Finger Prints (Right / Left) biometric consent verified & recorded</span>
                        </label>
                        <label className="flex items-start sm:items-center gap-2 text-slate-200 cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={regSignatureAck}
                            onChange={e => setRegSignatureAck(e.target.checked)}
                            className="w-4 h-4 text-emerald-500 rounded shrink-0 mt-0.5 sm:mt-0"
                          />
                          <span>✓ Driver Signature & legal undertaking accepted for corporate duties</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* FORM 2: VEHICLE INDUCTION FORM (JCPenney / SJT) */}
                  {/* ======================================================== */}
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-amber-400" />
                        <span>FORM 2: VEHICLE INDUCTION FORM (JCPenney / SJT)</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">Fleet Registration & RTO Validity</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Yellow-Board Registration # <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={regVehicleReg}
                          onChange={e => setRegVehicleReg(e.target.value.toUpperCase())}
                          placeholder="e.g. KA 05 AU 1234"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black font-mono text-amber-300 placeholder-slate-500 outline-none focus:border-blue-500"
                        />
                      </div>
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
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Ownership Status <span className="text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRegOwnership('ATTACHED')}
                            className={`py-2 rounded-xl text-xs font-bold border transition ${
                              regOwnership === 'ATTACHED'
                                ? 'bg-amber-600 border-amber-500 text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-300'
                            }`}
                          >
                            ATTACHED
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegOwnership('OWNED')}
                            className={`py-2 rounded-xl text-xs font-bold border transition ${
                              regOwnership === 'OWNED'
                                ? 'bg-amber-600 border-amber-500 text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-300'
                            }`}
                          >
                            OWNED
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Fuel Type <span className="text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-4 gap-1">
                          {(['Diesel', 'Petrol', 'CNG', 'EV'] as const).map(f => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setRegFuelType(f)}
                              className={`py-2 rounded-lg text-[10px] font-bold border transition ${
                                regFuelType === f
                                  ? 'bg-blue-600 border-blue-500 text-white'
                                  : 'bg-slate-800 border-slate-700 text-slate-300'
                              }`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Document Details Table (RC, Insurance, FC, Permit, Tax, PUC) */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <div className="text-[11px] font-black text-amber-300 uppercase tracking-wider">
                        Vehicle Statutory Documents (Issued & Expiry Dates):
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 text-xs">
                        {/* RC */}
                        <div className="p-2.5 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                          <span className="font-bold text-slate-200 text-xs block">1. Registration Copy (RC Details)</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-400 block mb-0.5">Issued:</span>
                              <input
                                type="date"
                                value={regRcIssueDate}
                                onChange={e => setRegRcIssueDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Expiry:</span>
                              <input
                                type="date"
                                value={regRcExpiryDate}
                                onChange={e => setRegRcExpiryDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                          </div>
                          {renderDocUploadField('rc', 'Registration Copy (RC Book)', 'rc_book.jpg', 'Upload RC', true)}
                        </div>

                        {/* Insurance */}
                        <div className="p-2.5 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                          <span className="font-bold text-slate-200 text-xs block">2. Commercial Vehicle Insurance</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-400 block mb-0.5">Issued:</span>
                              <input
                                type="date"
                                value={regInsuranceIssueDate}
                                onChange={e => setRegInsuranceIssueDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Expiry:</span>
                              <input
                                type="date"
                                value={regInsuranceExpiryDate}
                                onChange={e => setRegInsuranceExpiryDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                          </div>
                          {renderDocUploadField('insurance', 'Commercial Vehicle Insurance', 'insurance.jpg', 'Upload policy', true)}
                        </div>

                        {/* FC */}
                        <div className="p-2.5 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                          <span className="font-bold text-slate-200 text-xs block">3. Fitness Certificate (FC)</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-400 block mb-0.5">Issued:</span>
                              <input
                                type="date"
                                value={regFcIssueDate}
                                onChange={e => setRegFcIssueDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Expiry:</span>
                              <input
                                type="date"
                                value={regFcExpiryDate}
                                onChange={e => setRegFcExpiryDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                          </div>
                          {renderDocUploadField('fitness', 'Fitness Certificate (FC - Form 38)', 'fc_certificate.jpg', 'Upload FC', true)}
                        </div>

                        {/* Permit */}
                        <div className="p-2.5 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                          <span className="font-bold text-slate-200 text-xs block">4. Commercial Permit (Tourist/State)</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-400 block mb-0.5">Issued:</span>
                              <input
                                type="date"
                                value={regPermitIssueDate}
                                onChange={e => setRegPermitIssueDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Expiry:</span>
                              <input
                                type="date"
                                value={regPermitExpiryDate}
                                onChange={e => setRegPermitExpiryDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                          </div>
                          {renderDocUploadField('permit', 'Commercial Permit (Form 46)', 'commercial_permit.jpg', 'Upload permit', true)}
                        </div>

                        {/* Road Tax */}
                        <div className="p-2.5 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                          <span className="font-bold text-slate-200 text-xs block">5. Karnataka Road Tax</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-400 block mb-0.5">Issued:</span>
                              <input
                                type="date"
                                value={regTaxIssueDate}
                                onChange={e => setRegTaxIssueDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Expiry:</span>
                              <input
                                type="date"
                                value={regTaxExpiryDate}
                                onChange={e => setRegTaxExpiryDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                          </div>
                          {renderDocUploadField('road_tax', 'Karnataka Road Tax Receipt', 'tax_receipt.jpg', 'Upload tax receipt', true)}
                        </div>

                        {/* Emission Test */}
                        <div className="p-2.5 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                          <span className="font-bold text-slate-200 text-xs block">6. Emission Test (PUC)</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-400 block mb-0.5">Issued:</span>
                              <input
                                type="date"
                                value={regEmissionIssueDate}
                                onChange={e => setRegEmissionIssueDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Expiry:</span>
                              <input
                                type="date"
                                value={regEmissionExpiryDate}
                                onChange={e => setRegEmissionExpiryDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                              />
                            </div>
                          </div>
                          {renderDocUploadField('emissions', 'Pollution Test Certificate (PUC)', 'emission_puc.jpg', 'Upload PUC', true)}
                        </div>

                        {/* Vehicle Photo */}
                        <div className="p-2.5 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                          <span className="font-bold text-slate-200 text-xs block">7. Vehicle Exterior & Yellow Plate Photo</span>
                          {renderDocUploadField('vehicle_photo', 'Yellow-Board Vehicle Front & Plate Photo', 'vehicle_plate.jpg', 'Upload exterior photo', true)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* FORM 3: MANDATORY ACCESSORIES & VEHICLE CONDITION */}
                  {/* ======================================================== */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Left: ACCESSORIES (9 ITEMS) */}
                    <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-emerald-500/30 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <div className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>MANDATORY ACCESSORIES (YES / NO)</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold">9 Items</span>
                      </div>

                      <div className="space-y-1.5">
                        {[
                          ['fire_ext', 'FIRE EXT (Fire Extinguisher)'],
                          ['first_aid_kit', 'FIRST AID KIT (Sterilized Medical Box)'],
                          ['co_sticker', 'CO. STICKER (SJT / Corporate Logo)'],
                          ['torch', 'TORCH (Emergency Flashlight)'],
                          ['umbrella', 'UMBRELLA (Driver Umbrella)'],
                          ['music_system', 'MUSIC SYSTEM (Working Audio)'],
                          ['mobile_handsfree', 'MOBILE HANDSFREE HEAR PHONE / Mount'],
                          ['fixed_gps', 'FIXED GPS (Vehicle Location Tracker)'],
                          ['fixed_panic_button', 'FIXED PANIC BUTTON (SOS Button)']
                        ].map(([k, label]) => (
                          <div key={k} className="flex items-center justify-between p-1.5 bg-slate-900 rounded-lg text-xs">
                            <span className="text-[11px] font-bold text-slate-300 truncate">{label}</span>
                            <div className="flex gap-1 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => setRegAccessories(prev => ({ ...prev, [k]: true }))}
                                className={`px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer ${
                                  regAccessories[k] ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                YES
                              </button>
                              <button
                                type="button"
                                onClick={() => setRegAccessories(prev => ({ ...prev, [k]: false }))}
                                className={`px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer ${
                                  !regAccessories[k] ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                NO
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: VEHICLE CONDITION (9 ITEMS) */}
                    <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-emerald-500/30 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <div className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>VEHICLE CONDITION (WORKING / ACCEPTED)</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold">9 Points</span>
                      </div>

                      <div className="space-y-1.5">
                        {[
                          ['head_lights', 'HEAD LIGHTS (Working / Clean)'],
                          ['indicators', 'INDICATORS (Front & Rear Working)'],
                          ['body_rattle', 'BODY RATTLE (Zero Body Noise)'],
                          ['tyres', 'TYRES (Good Tread Depth)'],
                          ['spare_wheel', 'SPARE WHEEL (Stepney Inflated)'],
                          ['interior_cleanliness', 'INTERIOR / CLEANLINESS (Sanitized)'],
                          ['seats_condition', 'SEATS CONDITION (Intact Cushions)'],
                          ['seat_belts', 'SEAT BELTS (All Functional)'],
                          ['tool_kit', 'TOOL KIT (Jack & Spanner)']
                        ].map(([k, label]) => (
                          <div key={k} className="flex items-center justify-between p-1.5 bg-slate-900 rounded-lg text-xs">
                            <span className="text-[11px] font-bold text-slate-300 truncate">{label}</span>
                            <div className="flex gap-1 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => setRegVehicleCondition(prev => ({ ...prev, [k]: true }))}
                                className={`px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer ${
                                  regVehicleCondition[k] ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                WORKING / ACCEPTED
                              </button>
                              <button
                                type="button"
                                onClick={() => setRegVehicleCondition(prev => ({ ...prev, [k]: false }))}
                                className={`px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer ${
                                  !regVehicleCondition[k] ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                DEFECTIVE
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* FORM 4: DUTIES & PROFESSIONAL REFERENCES */}
                  {/* ======================================================== */}
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-purple-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-purple-400" />
                        <span>DUTIES & CORPORATE REFERENCES (JCPenney / SJT)</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">Operations Schedule</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          No. of Duties Doing Per Day
                        </label>
                        <input
                          type="text"
                          value={regDutiesPerDay}
                          onChange={e => setRegDutiesPerDay(e.target.value)}
                          placeholder="e.g. 1 Shift, 2 Shifts, or General Shift"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Companies Serving For
                        </label>
                        <input
                          type="text"
                          value={regCompaniesServing}
                          onChange={e => setRegCompaniesServing(e.target.value)}
                          placeholder="e.g. Corporate Client / Tech Park / SJT Fleet"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Emergency Contact Person Name
                        </label>
                        <input
                          type="text"
                          value={regEmergencyContactName}
                          onChange={e => setRegEmergencyContactName(e.target.value)}
                          placeholder="Spouse / Parent / Family Contact Name"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Emergency Contact Number
                        </label>
                        <input
                          type="tel"
                          value={regEmergencyContactPhone}
                          onChange={e => setRegEmergencyContactPhone(e.target.value)}
                          placeholder="10-digit emergency mobile number"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Reference 1 Name & Phone
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={regRef1Name}
                            onChange={e => setRegRef1Name(e.target.value)}
                            placeholder="Reference 1 Name"
                            className="w-1/2 px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                          />
                          <input
                            type="tel"
                            value={regRef1Phone}
                            onChange={e => setRegRef1Phone(e.target.value)}
                            placeholder="Mobile No."
                            className="w-1/2 px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Reference 2 Name & Phone
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={regRef2Name}
                            onChange={e => setRegRef2Name(e.target.value)}
                            placeholder="Reference 2 Name"
                            className="w-1/2 px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                          />
                          <input
                            type="tel"
                            value={regRef2Phone}
                            onChange={e => setRegRef2Phone(e.target.value)}
                            placeholder="Mobile No."
                            className="w-1/2 px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                          />
                        </div>
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
                    className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-[#ED1735] via-red-600 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-black text-sm shadow-xl shadow-red-900/40 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Award className="w-5 h-5" />
                    <span>
                      {regLoading 
                        ? 'Recording Induction Dossier & Submitting to Operations…' 
                        : 'Submit Complete Induction Dossier (Driver & Vehicle Forms)'}
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
                    <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Track Driver KYC Application Status</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Enter your Registered Mobile Number, Email, or Application ID to view live KYC updates
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={statusLookupInput}
                    onChange={e => setStatusLookupInput(e.target.value)}
                    placeholder="Enter mobile number, email, or Application ID"
                    className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={statusLookupLoading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow cursor-pointer transition shrink-0"
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
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="min-w-0">
                      <div className="font-black text-white text-sm truncate">{statusLookupResult.driver_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {statusLookupResult.driver_phone} {statusLookupResult.id ? `• Ref: #${String(statusLookupResult.id).slice(0, 12)}` : ''}
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 ${
                      statusLookupResult.kyc_status === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      statusLookupResult.kyc_status === 'REJECTED' ? 'bg-red-950 text-red-400 border border-red-800' :
                      'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {statusLookupResult.kyc_status === 'APPROVED' ? '✓ APPROVED & ACTIVATED' :
                       statusLookupResult.kyc_status === 'REJECTED' ? '✕ REJECTED' : '⏳ PENDING OPERATIONS REVIEW'}
                    </span>
                  </div>

                  {/* Live KYC Step Updates */}
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-center bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-emerald-400 font-bold">
                      <div>1. Submitted</div>
                      <div className="text-[9px] text-slate-400 font-normal mt-0.5">✓ Received</div>
                    </div>
                    <div className={statusLookupResult.kyc_status === 'PENDING' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                      <div>2. Admin Audit</div>
                      <div className="text-[9px] text-slate-400 font-normal mt-0.5">
                        {statusLookupResult.kyc_status === 'PENDING' ? '⏳ In Review' : '✓ Reviewed'}
                      </div>
                    </div>
                    <div className={
                      statusLookupResult.kyc_status === 'APPROVED' ? 'text-emerald-400 font-bold' :
                      statusLookupResult.kyc_status === 'REJECTED' ? 'text-red-400 font-bold' :
                      'text-slate-500 font-bold'
                    }>
                      <div>3. Activation</div>
                      <div className="text-[9px] text-slate-400 font-normal mt-0.5">
                        {statusLookupResult.kyc_status === 'APPROVED' ? '✓ Active' : statusLookupResult.kyc_status === 'REJECTED' ? '✕ Action Needed' : 'Waiting'}
                      </div>
                    </div>
                  </div>

                  {statusLookupResult.kyc_status === 'APPROVED' && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-200 space-y-2">
                      <div className="font-black text-emerald-300">
                        🎉 Congratulations! Your Driver Account is ACTIVE
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Assigned Yellow-Board Vehicle: <strong className="font-mono text-amber-300">{statusLookupResult.assigned_vehicle_reg || statusLookupResult.vehicle_reg || 'Verified by Admin'}</strong>.
                        Please sign in using your registered mobile number and password.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginIdentifier(statusLookupResult.driver_phone || statusLookupResult.driver_email);
                          setAuthMode('LOGIN');
                        }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs cursor-pointer transition"
                      >
                        Proceed to Driver Login →
                      </button>
                    </div>
                  )}

                  {statusLookupResult.kyc_status === 'PENDING' && (
                    <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-200 text-[11px] space-y-1">
                      <div className="font-bold text-amber-300">⏳ Verification In Progress</div>
                      <div>Your documents and vehicle induction application are currently under review by SJT Operations Admin. Once approved, you can log in directly using your mobile number and password.</div>
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

          {/* Bottom Card Navigation: Driver Sign In / Partner Induction Button */}
          <div className="pt-4 mt-6 border-t border-slate-800 text-center">
            {authMode === 'SIGNUP' ? (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setLoginError('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs text-blue-300 hover:text-white font-black transition cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-blue-400" />
                <span>Already Registered? Go to Driver Login</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('SIGNUP');
                  setRegError('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#ED1735]/20 to-rose-600/20 hover:from-[#ED1735]/30 hover:to-rose-600/30 border border-rose-500/40 text-xs text-rose-200 hover:text-white font-black transition cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Driver Sign In • Partner Induction (Upload Documents)</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MAIN DRIVER WEBSITE COCKPIT
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      {/* ============================================================ */}
      {/* 1. TOP HEADER & DESKTOP NAVIGATION BAR (RESPONSIVE & ZERO-OVERFLOW) */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 bg-[#071B49] border-b border-blue-900/60 shadow-xl w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Top Row: Responsive Layout (Zero horizontal overflow on mobile) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 sm:py-0 sm:h-16 gap-2">
            {/* Top Bar for Mobile / Left Section for Desktop */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#ED1735] to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-900/30 font-black text-xs sm:text-sm shrink-0">
                  {driverName ? driverName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : (activeChauffeur.avatar || 'SC')}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h1 className="text-xs sm:text-base font-black tracking-wide text-white truncate">SJT DRIVERS</h1>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 shrink-0">
                      WEB
                    </span>
                    {/* Mode Pill in Title */}
                    <span className={`text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0 ${
                      driverMode === 'COMPANY_DUTY'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    }`}>
                      {driverMode === 'COMPANY_DUTY' ? <Building2 className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                      <span>{driverMode === 'COMPANY_DUTY' ? 'Company Duty' : 'Daily Trips'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-blue-200 font-mono truncate">
                    <span className="font-bold text-white truncate">{driverName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-amber-300 font-bold shrink-0">{vehicleReg}</span>
                    <span className="text-slate-400 hidden sm:inline">•</span>
                    <span className="hidden sm:inline text-slate-300">{vehicleType}</span>
                  </div>
                </div>
              </div>

              {/* Mobile Right: Quick Action Buttons (Sync, Logout) */}
              <div className="flex sm:hidden items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => refreshData()}
                  className="p-1.5 rounded-lg bg-slate-800 text-blue-400 border border-slate-700 active:scale-95"
                  title="Sync bookings"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDriverSignOut}
                  className="p-1.5 rounded-lg bg-slate-800 text-rose-400 border border-slate-700 active:scale-95"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Actions: Switch Mode & Availability (Full-width row on mobile, right side on desktop) */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              {/* Dynamic Mode Switcher Button */}
              <button
                type="button"
                onClick={() => handleSwitchMode(driverMode === 'COMPANY_DUTY' ? 'REGULAR' : 'COMPANY_DUTY')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-95 ${
                  driverMode === 'COMPANY_DUTY'
                    ? todayCompletedShiftsCount > 0
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white shadow-emerald-900/40 ring-1 ring-emerald-400/50'
                      : 'bg-gradient-to-r from-slate-800 to-blue-900/80 hover:from-slate-700 text-blue-200 border border-blue-500/30'
                    : driverOnboardedType === 'REGULAR'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white shadow-blue-900/40 ring-1 ring-blue-400/50'
                }`}
                title={driverMode === 'COMPANY_DUTY' ? 'Switch to Daily Passenger Trips Driver' : 'Switch to Corporate Company Duty Shifts'}
              >
                {driverMode === 'COMPANY_DUTY' ? (
                  <>
                    <Car className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {activeDuty 
                        ? 'Shift Active (Check Out First)' 
                        : todayCompletedShiftsCount > 0 
                        ? '✨ All Shifts Done • Daily Trips ➔' 
                        : '🔒 Shift 1 Pending • Daily Trips'}
                    </span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {driverOnboardedType === 'REGULAR'
                        ? '🔒 Company Duty (KYC Required)'
                        : 'Switch to Company Duty ➔'}
                    </span>
                  </>
                )}
              </button>

              {/* Online / Offline Switch */}
              <button
                type="button"
                onClick={() => void saveDriverAvailability(!isOnline)}
                disabled={availabilitySaving}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm cursor-pointer shrink-0 active:scale-95 ${
                  isOnline 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </button>

              {/* Desktop-only action buttons */}
              <button
                type="button"
                onClick={() => refreshData()}
                className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Sync with server for live customer bookings"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">Sync</span>
              </button>

              <button
                type="button"
                onClick={handleDriverSignOut}
                className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer items-center gap-1"
                title="Switch Driver Profile or Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>

              <a
                href="https://sjttarvels.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer items-center gap-1"
                title="Open Customer Website"
              >
                <Monitor className="w-3.5 h-3.5 text-blue-400" />
                <span>Customer Web</span>
              </a>
            </div>
          </div>

          {/* Desktop Navigation Tabs: DYNAMIC BASED ON DRIVER MODE */}
          <nav className="flex items-center gap-1 overflow-x-auto py-2 border-t border-blue-900/40 scrollbar-none w-full max-w-full">
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
                  onClick={() => refreshData()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 shadow transition-all cursor-pointer"
                  title="Check for new customer rides"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                  <span>Refresh Queue</span>
                </button>
              </div>
            </div>

            {/* SECTION 1: INCOMING CUSTOMER RIDE REQUESTS (NEED ACCEPTANCE) */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${!isOnline ? 'bg-slate-600' : incomingRideRequests.length > 0 ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></div>
                  <h4 className="text-base font-black text-white">Incoming Customer Ride Requests</h4>
                </div>
                <span className={`text-xs font-mono font-bold px-3 py-1 rounded-xl border ${
                  !isOnline 
                    ? 'text-slate-400 bg-slate-800 border-slate-700' 
                    : incomingRideRequests.length > 0 
                      ? 'text-amber-300 bg-amber-950/80 border-amber-800' 
                      : 'text-emerald-300 bg-emerald-950/80 border-emerald-800'
                }`}>
                  {!isOnline ? 'Offline' : `${incomingRideRequests.length} Ride(s) Waiting For Driver`}
                </span>
              </div>

              {incomingRideRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incomingRideRequests.map(ride => {
                    const sched = formatBookingSchedule(ride.journey_date || ride.journeyDate, ride.journey_time || ride.journeyTime, ride.return_date || ride.returnDate);
                    const tripBadge = getTripTypeBadge(ride.trip_type || ride.tripType);
                    const bookingCode = ride.booking_code || ride.id;
                    const loc = parseLocationDetails(ride);

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

                        {/* Route Coordinates with 1-Click Maps Navigation & Exact Doorstep Address */}
                        <div className="space-y-2.5 text-xs bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                          {/* Pickup Locality & GPS Navigation */}
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Pickup Locality</span>
                                  <strong className="text-white text-xs sm:text-sm block break-words">{loc.cleanPickup || ride.pickup}</strong>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={loc.mapsDirUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] flex items-center gap-1 shadow-md shadow-emerald-900/50"
                                  title="Start Turn-by-Turn GPS Navigation to Doorstep"
                                >
                                  <Compass className="w-3 h-3" />
                                  <span>Navigate</span>
                                </a>
                                <a
                                  href={loc.mapsPinUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-300 font-bold text-[10px] flex items-center gap-1 border border-blue-700/60"
                                  title="View Pin on Google Maps"
                                >
                                  <Navigation className="w-2.5 h-2.5" />
                                  <span>Pin</span>
                                </a>
                              </div>
                            </div>

                            {/* Exact Doorstep / Home Address Box (Ola Cabs Style) */}
                            {loc.exactAddress ? (
                              <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-2.5 flex items-start gap-2">
                                <Home className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <span className="text-[10px] uppercase font-black text-emerald-300 block tracking-wide">
                                    🏠 Exact Doorstep / Home Address:
                                  </span>
                                  <strong className="text-white text-xs block font-semibold leading-relaxed break-words">
                                    {loc.exactAddress}
                                  </strong>
                                </div>
                              </div>
                            ) : null}

                            {/* High-Accuracy GPS Badge */}
                            {loc.pickupLat && loc.pickupLng && (
                              <div className="flex items-center gap-1.5 text-[10px] text-blue-300 font-mono bg-blue-950/40 border border-blue-800/40 px-2 py-0.5 rounded-lg">
                                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>GPS Pin: {loc.pickupLat.toFixed(5)}°N, {loc.pickupLng.toFixed(5)}°E (Doorstep Accurate)</span>
                              </div>
                            )}
                          </div>

                          {/* Distance & Route Connector Bar */}
                          {(() => {
                            const metrics = getBookingTripMetrics(ride);
                            return (
                              <div className="flex items-center justify-between py-1 px-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                                <span className="flex items-center gap-1.5 text-amber-300 font-bold font-mono">
                                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                  <span>{metrics.distanceDisplay}</span>
                                </span>
                                <span className="text-slate-300 font-medium">{metrics.durationText}</span>
                                <span className="text-[10px] text-slate-400 truncate max-w-[150px]">via {metrics.routeVia}</span>
                              </div>
                            );
                          })()}

                          {/* Drop Destination */}
                          <div className="flex items-start justify-between gap-2 pt-2 border-t border-slate-800/80">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <Navigation className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Drop Destination</span>
                                <strong className="text-white text-xs sm:text-sm block break-words">{ride.destination}</strong>
                              </div>
                            </div>
                            <a
                              href={loc.mapsDropUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-300 font-bold text-[10px] shrink-0 flex items-center gap-1 border border-blue-700/60"
                              title="Open Destination in Google Maps"
                            >
                              <Navigation className="w-2.5 h-2.5" />
                              <span>Maps</span>
                            </a>
                          </div>
                        </div>

                        {/* Booking KM & Economics Strip for Driver */}
                        {(() => {
                          const metrics = getBookingTripMetrics(ride);
                          return (
                            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/40 p-2.5 rounded-2xl border border-amber-500/30 flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black font-mono text-xs">
                                  🛣️ {metrics.distanceDisplay}
                                </span>
                                <div className="min-w-0">
                                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Estimated Drive</span>
                                  <span className="text-xs font-bold text-slate-200 block truncate">{metrics.durationText} • {metrics.routeVia}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[10px] text-slate-400 block font-bold uppercase">Rate Yield</span>
                                <span className="text-xs font-black text-emerald-400 font-mono">{metrics.perKmRateText}</span>
                              </div>
                            </div>
                          );
                        })()}

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
              ) : !isOnline ? (
                /* OFFLINE BANNER: Driver must click Online to see and accept bookings */
                <div className="p-8 text-center bg-slate-950/70 border border-slate-800 rounded-3xl space-y-3 animate-fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
                    <Radio className="w-7 h-7 opacity-60" />
                  </div>
                  <div>
                    <h5 className="text-base font-black text-white">You are Currently OFFLINE</h5>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Passenger bookings and airport/city ride requests are hidden while offline. Tap below to go online and receive real-time ride offers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void saveDriverAvailability(true)}
                    disabled={availabilitySaving}
                    className="mt-3 px-8 py-3.5 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-950/60 transition-all cursor-pointer inline-flex items-center gap-2 transform hover:scale-105 active:scale-95"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping"></span>
                    <span>GO ONLINE & RECEIVE RIDES</span>
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center animate-pulse">
                    <Radio className="w-5 h-5" />
                  </div>
                  <h5 className="text-xs font-bold text-emerald-400">ONLINE & READY FOR RIDES</h5>
                  <p className="text-xs text-slate-400">
                    Radar active. Waiting for passengers to book trips in your area. As soon as a ride is placed, you will receive an instant dispatch alert!
                  </p>
                  <button
                    type="button"
                    onClick={() => refreshData()}
                    className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                    <span>Check for Customer Requests</span>
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
                    const loc = parseLocationDetails(trip);

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

                        {/* Booking KM & Route Banner */}
                        {(() => {
                          const metrics = getBookingTripMetrics(trip);
                          return (
                            <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-black text-xs">
                                  🛣️ {metrics.distanceDisplay}
                                </span>
                                <span className="text-slate-300 font-bold">{metrics.durationText}</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-400 truncate">via {metrics.routeVia}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Rate Yield:</span>
                                <span className="text-emerald-400 font-mono font-bold">{metrics.perKmRateText}</span>
                              </div>
                            </div>
                          );
                        })()}

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

                          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Route & Doorstep Location</span>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-slate-400 text-[10px] block">Pickup Locality</span>
                                <strong className="text-white text-xs block">{loc.cleanPickup || trip.pickup}</strong>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={loc.mapsDirUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] flex items-center gap-1 shadow"
                                  title="Turn-by-Turn GPS Navigation"
                                >
                                  <Compass className="w-2.5 h-2.5" />
                                  <span>Navigate</span>
                                </a>
                                <a
                                  href={loc.mapsPinUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-300 font-bold text-[10px] shrink-0 flex items-center gap-1 border border-blue-700/60"
                                  title="View Pin on Google Maps"
                                >
                                  <Navigation className="w-2.5 h-2.5" />
                                  <span>Pin</span>
                                </a>
                              </div>
                            </div>

                            {/* Exact Doorstep / Home Address Box */}
                            {loc.exactAddress ? (
                              <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-2.5 flex items-start gap-2">
                                <Home className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <span className="text-[10px] uppercase font-black text-emerald-300 block">
                                    🏠 Exact Doorstep / Home Address:
                                  </span>
                                  <strong className="text-white text-xs block font-semibold leading-relaxed break-words">
                                    {loc.exactAddress}
                                  </strong>
                                </div>
                              </div>
                            ) : null}

                            {/* GPS Pin Badge */}
                            {loc.pickupLat && loc.pickupLng && (
                              <div className="flex items-center gap-1.5 text-[10px] text-blue-300 font-mono bg-blue-950/40 border border-blue-800/40 px-2 py-0.5 rounded-lg">
                                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>GPS Pin: {loc.pickupLat.toFixed(5)}°N, {loc.pickupLng.toFixed(5)}°E</span>
                              </div>
                            )}

                            <div className="flex items-start justify-between gap-2 pt-2 border-t border-slate-800">
                              <div>
                                <span className="text-slate-400 text-[10px] block">Drop Destination</span>
                                <strong className="text-white text-xs block">{trip.destination}</strong>
                              </div>
                              <a
                                href={loc.mapsDropUrl}
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

                        {/* HERO 1-CLICK TURN-BY-TURN DOORSTEP NAVIGATION (WHEN EN ROUTE) */}
                        {isEnRoute && (
                          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-4 rounded-2xl border-2 border-emerald-500/70 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider flex items-center gap-1.5">
                                <Compass className="w-3.5 h-3.5 animate-spin" />
                                <span>Ola/Uber Style Doorstep GPS Navigation</span>
                              </span>
                              <strong className="text-white text-sm block">
                                {loc.exactAddress ? `Doorstep Address: ${loc.exactAddress}` : `Locality: ${loc.cleanPickup || trip.pickup}`}
                              </strong>
                              {loc.pickupLat && loc.pickupLng && (
                                <span className="text-[11px] text-emerald-300 font-mono block">
                                  GPS Pin: {loc.pickupLat.toFixed(5)}°N, {loc.pickupLng.toFixed(5)}°E (High Precision Doorstep Coordinates)
                                </span>
                              )}
                            </div>
                            <a
                              href={loc.mapsDirUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all shrink-0 cursor-pointer"
                            >
                              <Navigation className="w-4 h-4" />
                              <span>Start Turn-by-Turn GPS Navigation</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}

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
                <span className="text-xs uppercase font-bold text-blue-300 tracking-wider">Commercial Driver Cockpit</span>
                <h2 className="text-2xl font-black text-white">Welcome back, {driverName}</h2>
                <p className="text-xs text-blue-100">
                  Vehicle: <strong className="text-amber-300 font-mono">{vehicleReg}</strong> ({vehicleType}) • Assigned Driver Partner
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
                      printSectionTable('Driver Completed Rides Ledger', `Driver: ${driverName} • Vehicle: ${vehicleReg}`, headers, rows);
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
                      printSectionTable('Driver Duty & Shift Ledger', `Driver: ${driverName} • Vehicle: ${vehicleReg}`, headers, rows);
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
                  <h3 className="text-base font-black text-white">Driver KYC Verification & Compliance Profile</h3>
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
      {/* DOCUMENT PREVIEW MODAL */}
      {/* ============================================================ */}
      {previewingImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewingImage(null)}
        >
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-black text-white">{previewingImage.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingImage(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center bg-slate-950 rounded-2xl p-3 border border-slate-800 min-h-[300px] max-h-[70vh] overflow-auto">
              {previewingImage.url.startsWith('data:image') || previewingImage.url.endsWith('.jpg') || previewingImage.url.endsWith('.png') ? (
                <img src={previewingImage.url} alt={previewingImage.title} className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-lg" />
              ) : (
                <iframe src={previewingImage.url} title={previewingImage.title} className="w-full h-[60vh] border rounded-xl bg-white" />
              )}
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPreviewingImage(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BIG RAPIDO / PORTER STYLE INCOMING RIDE REQUEST POPUP (WHEN ONLINE) */}
      {/* ============================================================ */}
      {activeOfferPopupRide && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
          <div className="max-w-lg w-full bg-slate-900 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.35)] relative overflow-hidden text-white space-y-4">
            {/* Top Animated Progress Countdown Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-1000 ease-linear"
                style={{ width: `${(offerCountdown / 30) * 100}%` }}
              />
            </div>

            {/* Header: Alert Pulsing Badge & Countdown Timer */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping"></span>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>New Ride Offer • Auto-Dispatch</span>
                </span>
              </div>
              <div className="flex items-center gap-1 bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono font-black text-xs px-2.5 py-1 rounded-xl">
                <Clock className="w-3.5 h-3.5" />
                <span>{offerCountdown}s</span>
              </div>
            </div>

            {/* Big Quoted Fare Hero */}
            <div className="bg-gradient-to-br from-emerald-950/60 via-slate-950 to-slate-900 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Driver Earnings (Cash / UPI)
                </span>
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight mt-0.5">
                  ₹{Number(activeOfferPopupRide.quoted_amount || activeOfferPopupRide.quotedAmount || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-emerald-300/80 font-medium">Pay directly to you on trip completion</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 block mb-1">
                  {activeOfferPopupRide.trip_type || activeOfferPopupRide.tripType || 'Daily Trip'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  #{activeOfferPopupRide.booking_code || activeOfferPopupRide.bookingCode || activeOfferPopupRide.id?.slice(0, 8)}
                </span>
              </div>
            </div>

            {/* Trip Distance & Economics Analysis Strip (KM, Est. Time, Route & Driver Rate Yield) */}
            {(() => {
              const metrics = getBookingTripMetrics(activeOfferPopupRide);
              return (
                <div className="bg-slate-950/90 rounded-2xl p-3 border border-amber-500/30 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">🛣️ Trip Distance</span>
                    <span className="text-base sm:text-lg font-black text-amber-400 font-mono block mt-0.5">{metrics.distanceDisplay}</span>
                    <span className="text-[9px] text-slate-500 block truncate">Accurate Road KM</span>
                  </div>
                  <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">⏱️ Est. Drive Time</span>
                    <span className="text-base sm:text-lg font-black text-blue-400 font-mono block mt-0.5">{metrics.durationText}</span>
                    <span className="text-[9px] text-slate-400 block truncate">{metrics.routeVia}</span>
                  </div>
                  <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">💰 Driver Yield</span>
                    <span className="text-base sm:text-lg font-black text-emerald-400 font-mono block mt-0.5">{metrics.perKmRateText}</span>
                    <span className="text-[9px] text-emerald-400/80 font-bold block truncate">Gross Net / KM</span>
                  </div>
                </div>
              );
            })()}

            {/* Route: Pickup Doorstep & Drop */}
            {(() => {
              const loc = parseLocationDetails(activeOfferPopupRide);
              return (
                <div className="bg-slate-950/90 rounded-2xl p-3.5 border border-slate-800 space-y-3 text-xs">
                  {/* Pickup */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Navigation className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Pickup Location</div>
                      <div className="text-sm font-black text-white truncate">{loc.cleanPickup || activeOfferPopupRide.pickup}</div>
                      {loc.exactAddress && (
                        <div className="mt-1 text-xs text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-xl p-2 font-medium flex items-start gap-1.5">
                          <Home className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-amber-200">Exact Doorstep / Flat:</strong> {loc.exactAddress}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Distance & Route Connector Bar */}
                  {(() => {
                    const metrics = getBookingTripMetrics(activeOfferPopupRide);
                    return (
                      <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
                        <span className="flex items-center gap-1.5 text-amber-300 font-bold font-mono">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          <span>{metrics.distanceDisplay}</span>
                        </span>
                        <span className="text-slate-300 font-medium">{metrics.durationText}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[160px]">via {metrics.routeVia}</span>
                      </div>
                    );
                  })()}

                  {/* Drop */}
                  <div className="flex items-start gap-2.5 pt-2 border-t border-slate-800/80">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Drop Destination</div>
                      <div className="text-sm font-black text-white truncate">{activeOfferPopupRide.destination}</div>
                    </div>
                  </div>

                  {/* Passenger & Vehicle Info */}
                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Passenger:</span>
                      <span className="font-bold text-white">{activeOfferPopupRide.customer_name || activeOfferPopupRide.customerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Vehicle:</span>
                      <span className="font-bold text-white truncate block">{activeOfferPopupRide.vehicle_name || activeOfferPopupRide.vehicleName || 'Commercial Fleet'}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Two Big Action Buttons */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handlePopupDecline}
                className="py-3.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl border border-slate-700 cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Pass</span>
              </button>
              <button
                type="button"
                onClick={handlePopupAccept}
                disabled={Boolean(acceptingRideId)}
                className="col-span-2 py-3.5 px-5 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-950/60 transition-all cursor-pointer flex items-center justify-center gap-2 transform active:scale-95"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>{acceptingRideId ? 'Accepting...' : 'ACCEPT RIDE NOW'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DUTY PROFILE ACCESS RESTRICTION / SHIFT PENDING MODAL */}
      {/* ============================================================ */}
      {dutyAlertModal && dutyAlertModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={() => setDutyAlertModal(null)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-4 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                dutyAlertModal.type === 'DAILY_TRIPS_LOCKED'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {dutyAlertModal.type === 'DAILY_TRIPS_LOCKED' ? (
                  <Lock className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">{dutyAlertModal.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{dutyAlertModal.message}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>SJT Operations Dispatch Rule</span>
              </div>
              <p>
                {dutyAlertModal.type === 'DAILY_TRIPS_LOCKED'
                  ? 'Drivers inducted for Daily Trips cannot accept corporate client duties without complete KYC dossier & MNC client approval.'
                  : 'Corporate drivers must complete scheduled company shifts today before being released for on-demand public ride bookings.'}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {dutyAlertModal.actionLabel && (
                <button
                  type="button"
                  onClick={dutyAlertModal.onAction}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white rounded-xl text-xs font-black shadow-lg cursor-pointer transition-all active:scale-95"
                >
                  {dutyAlertModal.actionLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => setDutyAlertModal(null)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
              >
                Close
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
          <span>© 2026 Sharanajyoti Tours & Travels Pvt. Ltd. • Driver & Commercial Fleet Operating System</span>
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

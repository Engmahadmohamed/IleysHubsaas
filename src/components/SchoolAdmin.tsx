import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAlert } from '../context/AlertContext';
import { 
  Student, Teacher, Subject, Room, AttendanceRecord, FeeRecord, SalaryRecord, Exam, ClassSession
} from '../types';
import { 
  Users, BookOpen, GraduationCap, School, Calendar, DollarSign, Award, CheckCircle2, 
  Plus, Edit2, Trash2, Send, Download, Upload, Eye, Check, AlertCircle, RefreshCw, 
  MapPin, Clock, Search, Printer, MoreHorizontal, LayoutDashboard, ChevronRight, X, KeyRound, Menu,
  Share2, Link2, Copy, Settings, ShieldCheck, User, AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import StudentDetail from './StudentDetail';
import TeacherDetail from './TeacherDetail';
import SubjectDetail from './SubjectDetail';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function SchoolAdmin() {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useAlert();
  const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const { 
    currentUser, currentOrg, loading, students, teachers, subjects, rooms, classSessions,
    attendanceRecords, feeRecords, salaryRecords, exams, examResults, users,
    addStudent, updateStudent, deleteStudent, bulkImportStudents,
    addTeacher, updateTeacher, deleteTeacher,
    addSubject, updateSubject, deleteSubject,
    addClassSession, updateClassSession, deleteClassSession,
    addRoom, updateRoom, deleteRoom,
    saveAttendance, approveFeePayment, updateFeePaymentStatus, addFeePayment, approveSalaryPayment,
    createExam, updateExam, deleteExam, submitMarks, approveExamResults, logout, changePassword, sendPasswordReset,
    updateUserProfile, registerUser, deleteStaffMember, selectActiveOrg
  } = useApp();

  const isQuranSchool = currentOrg?.type === 'quran' || currentUser?.role === 'quranadmin';
  const [quranModeWithoutTeachers, setQuranModeWithoutTeachers] = useState<boolean>(false);

  // Bottom Nav & Main Tabs driven by React Router parameters
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const isStaff = currentUser?.role === 'schoolstaff';
  
  const hasPermission = (permissionKey: string) => {
    if (currentUser?.role === 'schooladmin' || currentUser?.role === 'quranadmin' || currentUser?.role === 'superadmin') return true;
    if (currentUser?.role === 'teacher') {
      return permissionKey === 'Dashboard' || permissionKey === 'Exams';
    }
    if (isStaff) {
      return currentUser?.permissions?.includes(permissionKey) || false;
    }
    return false;
  };

  const activeTab = (tab || (isStaff ? 'students' : 'dashboard')) as 'dashboard' | 'students' | 'teachers' | 'subjects' | 'class-sessions' | 'rooms' | 'attendance' | 'fees' | 'salaries' | 'exams' | 'reports' | 'staff' | 'settings';

  const setActiveTab = (newTab: string) => {
    navigate(`/portal/${newTab}`);
  };

  // Redirect staff to students page if on unauthorized tabs
  useEffect(() => {
    if (isStaff) {
      const allowedTabs = ['students', 'subjects', 'class-sessions', 'rooms', 'attendance', 'fees', 'exams', 'settings'];
      if (!allowedTabs.includes(activeTab)) {
        navigate('/portal/students', { replace: true });
      }
    }
  }, [isStaff, activeTab, navigate]);

  // Redirect teachers to dashboard if on unauthorized tabs
  useEffect(() => {
    if (currentUser?.role === 'teacher') {
      const allowedTabs = ['dashboard', 'exams'];
      if (!allowedTabs.includes(activeTab)) {
        navigate('/portal/dashboard', { replace: true });
      }
    }
  }, [currentUser?.role, activeTab, navigate]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detail view checks based on route path
  const isStudentDetail = location.pathname.includes('/portal/students/') && !location.pathname.endsWith('/students') && currentUser?.role !== 'teacher';
  const isTeacherDetail = location.pathname.includes('/portal/teachers/') && !location.pathname.endsWith('/teachers') && currentUser?.role !== 'teacher';
  const isSubjectDetail = location.pathname.includes('/portal/subjects/') && !location.pathname.endsWith('/subjects') && currentUser?.role !== 'teacher';

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [activeModal, setActiveModal] = useState<'addStudent' | 'addTeacher' | 'addSubject' | 'addClassSession' | 'addRoom' | 'addExam' | 'takeAttendance' | 'enterMarks' | 'invoice' | 'receivePayment' | 'viewReceipt' | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);

  // Password change state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Settings view states
  const [adminName, setAdminName] = useState(currentUser?.fullName || '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);

  const [settingsNewPassword, setSettingsNewPassword] = useState('');
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState('');
  const [settingsPasswordLoading, setSettingsPasswordLoading] = useState(false);
  const [settingsPasswordError, setSettingsPasswordError] = useState<string | null>(null);
  const [settingsPasswordSuccess, setSettingsPasswordSuccess] = useState<string | null>(null);

  // Staff management states
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffDesignation, setStaffDesignation] = useState('');
  const [staffPermissions, setStaffPermissions] = useState<string[]>([
    'Dashboard', 'Students', 'Teachers', 'Attendance', 'Fees', 'Exams', 'Reports'
  ]); // Default subset
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);

  const toggleStaffPermission = (key: string) => {
    setStaffPermissions(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]);
  };

  const ALL_PERMISSIONS = [
    { key: 'Dashboard',       label: 'Dashboard' },
    { key: 'Students',        label: 'Students' },
    { key: 'Teachers',        label: 'Teachers' },
    { key: 'Subjects',        label: 'Subjects' },
    { key: 'Class Sessions',  label: 'Class Sessions' },
    { key: 'Class Rooms',     label: 'Class Rooms' },
    { key: 'Attendance',      label: 'Attendance (Xaadirinta)' },
    { key: 'Fees',            label: 'Student Fees' },
    { key: 'Teacher Salary',  label: 'Teacher Salary' },
    { key: 'Exams',           label: 'Examinations' },
    { key: 'Reports',         label: 'Reports / PDF Exports' },
  ];

  useEffect(() => {
    if (currentUser?.fullName) {
      setAdminName(currentUser.fullName);
    }
  }, [currentUser]);

  // Forms Fields State
  const [studentForm, setStudentForm] = useState({
    fullName: '', studentPhone: '', parentPhone: '', address: '', gender: 'male' as 'male' | 'female', dob: '', fee: 50, subjects: [] as string[], classSessions: [] as string[], roomId: ''
  });
  const [teacherForm, setTeacherForm] = useState({
    fullName: '', email: '', phone: '', salary: 400, subjects: [] as string[], rooms: [] as string[], password: '', address: ''
  });
  const [subjectForm, setSubjectForm] = useState({
    name: '', teacherId: '', roomId: '', startTime: '08:00', endTime: '09:30', capacity: 30, days: [] as string[]
  });
  const [roomForm, setRoomForm] = useState({
    roomNumber: '', capacity: 25, building: 'Main Hall', status: 'available' as 'available' | 'occupied' | 'maintenance'
  });
  const [selectedClassSession, setSelectedClassSession] = useState<ClassSession | null>(null);
  const [classSessionForm, setClassSessionForm] = useState({
    classCode: '', subjectId: '', teacherId: '', roomId: '', startTime: '13:00', endTime: '14:00', days: [] as string[], capacity: 30, status: 'active' as 'active' | 'completed'
  });
  const [examForm, setExamForm] = useState({
    title: '', type: 'class' as 'school' | 'class', subjectId: '', targetClass: '', sessionId: ''
  });
  const [editingExam, setEditingExam] = useState<any | null>(null);
  const [editExamForm, setEditExamForm] = useState({
    title: '', type: 'class' as 'school' | 'class', subjectId: '', targetClass: '', sessionId: ''
  });
  const [sharingExam, setSharingExam] = useState<any | null>(null);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [shareSearchQuery, setShareSearchQuery] = useState('');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const getSharingExamResults = () => {
    if (!sharingExam) return [];
    const record = examResults.find(r => r.examId === sharingExam.id);
    if (!record) return [];
    return record.results || [];
  };

  const getSharingStudentsList = () => {
    const results = getSharingExamResults();
    return results.map((r: any) => {
      const student = orgStudents.find(s => s.id === r.studentId);
      return {
        id: r.studentId,
        name: r.studentName || (student ? student.fullName : 'Unknown'),
        visibleId: student ? student.studentId : '',
        marks: r.marks,
        grade: r.grade,
        link: student ? `${window.location.origin}/results?studentId=${student.studentId}` : ''
      };
    }).filter(item => {
      if (!shareSearchQuery) return true;
      const q = shareSearchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.visibleId.toLowerCase().includes(q);
    });
  };

  // Tuition payment state
  const [paymentStudentId, setPaymentStudentId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(50);
  const [paymentMonth, setPaymentMonth] = useState(() => {
    const now = new Date();
    return now.toLocaleString('en-US', { month: 'long' }) + ' ' + now.getFullYear();
  });
  const [pendingSearch, setPendingSearch] = useState('');
  const [paidSearch, setPaidSearch] = useState('');
  const [feeSubTab, setFeeSubTab] = useState<'pending' | 'overdue' | 'paid'>('pending');
  const [salarySubTab, setSalarySubTab] = useState<'pending' | 'paid'>('pending');
  const [salarySearch, setSalarySearch] = useState('');
  const [salaryExportType, setSalaryExportType] = useState<'pending' | 'paid' | 'all'>('all');

  // Bulk Import state
  const [bulkInput, setBulkInput] = useState('');
  const [bulkResult, setBulkResult] = useState<{ successCount: number; errors: string[] } | null>(null);
  const [bulkSubjectId, setBulkSubjectId] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Student Filters State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentFilterRoomId, setStudentFilterRoomId] = useState('');
  const [studentFilterSubjectId, setStudentFilterSubjectId] = useState('');

  // Attendance states
  const [attRoomId, setAttRoomId] = useState('');
  const [attSubjectId, setAttSubjectId] = useState('');
  const [attSessionId, setAttSessionId] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attRecords, setAttRecords] = useState<{ [studentId: string]: 'present' | 'absent' | 'late' }>({});
  const [attSaved, setAttSaved] = useState(false);
  const [teacherActiveSession, setTeacherActiveSession] = useState<any | null>(null);
  const [attendanceSubTab, setAttendanceSubTab] = useState<'take' | 'absentee' | 'records' | 'history'>('take');
  const [historyFilterMonth, setHistoryFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [streakFilter, setStreakFilter] = useState<'all' | 'weekly' | 'monthly'>('weekly');

  // Marks Entry states
  const [marksData, setMarksData] = useState<{ [studentId: string]: number }>({});
  const [examTeacherSessionId, setExamTeacherSessionId] = useState<string | null>(null);
  
  // Excel File Reference
  const marksFileInputRef = useRef<HTMLInputElement>(null);

  // Error Messages
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadedAttRef = useRef<string>('');

  // Load existing attendance record if revisiting
  useEffect(() => {
    if (activeTab === 'attendance' && (attSessionId || attSubjectId) && attDate) {
      const existingAtt = attendanceRecords.filter(a => a.organizationId === currentOrg?.id).find(a => 
        a.date === attDate && 
        (attSessionId ? a.sessionId === attSessionId : a.subjectId === attSubjectId)
      );

      // Use the actual document ID if it exists, otherwise use a placeholder.
      // This solves the race condition: if attendance loads late from Firebase, 
      // the key changes from placeholder to the real ID, triggering a UI update.
      const key = existingAtt ? existingAtt.id : `${attSessionId || attSubjectId}-${attDate}`;
      
      // Only overwrite if it's a new class/date selection, or if a saved record just loaded
      if (loadedAttRef.current !== key) {
        if (existingAtt) {
          const prefilledRecords: { [studentId: string]: 'present' | 'absent' | 'late' } = {};
          existingAtt.records.forEach(r => {
            prefilledRecords[r.studentId] = r.status;
          });
          setAttRecords(prefilledRecords);
          setAttSaved(true); // Already has a saved record — show "saved" state
        } else {
          setAttRecords({});
          setAttSaved(false); // Fresh class — start clean
        }
        loadedAttRef.current = key;
      }
    }
  }, [attSessionId, attSubjectId, attDate, activeTab, attendanceRecords, currentOrg?.id]);

  const orgId = currentOrg?.id || '';

  // Filter lists by tenant OrganizationId
  const allOrgStudents = students.filter(s => s.organizationId === orgId);
  const allOrgTeachers = teachers.filter(t => t.organizationId === orgId);
  const allOrgSubjects = subjects.filter(sub => sub.organizationId === orgId);
  const allOrgRooms = rooms.filter(rm => rm.organizationId === orgId);
  const allOrgExams = exams.filter(ex => ex.organizationId === orgId);
  const allOrgFees = feeRecords.filter(f => f.organizationId === orgId);
  const allOrgSalaries = salaryRecords.filter(s => s.organizationId === orgId);
  const allOrgAttendance = attendanceRecords.filter(a => a.organizationId === orgId);
  const allOrgClassSessions = (classSessions || []).filter(cs => cs.organizationId === orgId);

  // Teacher specific security boundaries
  const isTeacher = currentUser?.role === 'teacher';
  const matchingTeacher = allOrgTeachers.find(t => 
    t.id === currentUser?.teacherId || 
    t.id === currentUser?.uid || 
    (currentUser?.email && t.email?.toLowerCase() === currentUser?.email?.toLowerCase()) ||
    (currentUser?.teacherId && t.id === currentUser?.teacherId)
  );
  
  // Teacher class sessions - if teacher found, filter by teacherId; if not found, show all org sessions
  const teacherClassSessions = matchingTeacher
    ? allOrgClassSessions.filter(cs => 
        cs.teacherId === matchingTeacher.id ||
        cs.teacherId === currentUser?.teacherId
      )
    : isTeacher 
      ? allOrgClassSessions // Fallback: show all org sessions so teacher can still work
      : [];
  const orgClassSessions = isTeacher ? teacherClassSessions : allOrgClassSessions;
  const teacherSubjects = allOrgSubjects.filter(sub => 
    sub.teacherId === matchingTeacher?.id || 
    sub.teacherId === currentUser?.teacherId ||
    (matchingTeacher?.subjects && matchingTeacher.subjects.includes(sub.id))
  );
  const teacherSubjectIds = teacherSubjects.map(s => s.id);
  
  // Boundary scoped lists
  const orgStudents = isTeacher 
    ? allOrgStudents.filter(std => {
        if (!std.classSessions || std.classSessions.length === 0) return false;
        const teacherCsIds = teacherClassSessions.map(cs => cs.id);
        return std.classSessions.some(csId => teacherCsIds.includes(csId));
      })
    : allOrgStudents;
  const orgTeachers = allOrgTeachers; // Teachers list still accessible for lookups
  const orgSubjects = isTeacher ? teacherSubjects : allOrgSubjects;
  const teacherRoomIds = [
    ...teacherSubjects.map(s => s.roomId),
    ...(matchingTeacher?.rooms || [])
  ].filter(Boolean);
  const orgRooms = isTeacher
    ? allOrgRooms.filter(rm => teacherRoomIds.includes(rm.id) || teacherRoomIds.includes(rm.roomNumber))
    : allOrgRooms;

  // Filter students based on state filters
  const filteredStudents = orgStudents.filter(student => {
    // 1. Search Query
    if (studentSearchQuery.trim()) {
      const q = studentSearchQuery.toLowerCase();
      const matchName = (student.fullName || '').toLowerCase().includes(q);
      const matchId = (student.studentId || '').toLowerCase().includes(q);
      const matchPhone = student.studentPhone?.toLowerCase().includes(q);
      const matchParent = student.parentPhone?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchPhone && !matchParent) {
        return false;
      }
    }

    // 2. Subject Filter (which also represents subject/time slot)
    if (studentFilterSubjectId) {
      if (!student.subjects.includes(studentFilterSubjectId)) {
        return false;
      }
    }

    // 3. Room Filter
    if (studentFilterRoomId) {
      // Find if student has any subject that is assigned to this roomId
      const hasSubjectInRoom = student.subjects.some(subId => {
        const sub = orgSubjects.find(s => s.id === subId);
        return sub && sub.roomId === studentFilterRoomId;
      });
      if (!hasSubjectInRoom) {
        return false;
      }
    }

    return true;
  });
  const orgExams = isTeacher 
    ? allOrgExams.filter(ex => ex.type === 'school' || (ex.subjectId && teacherSubjectIds.includes(ex.subjectId)))
    : allOrgExams;
  const isFeeExpired = (fee: FeeRecord) => {
    return false;
  };

  const validStudentIds = new Set(orgStudents.map(s => s.id));
  const orgFees = isTeacher ? [] : allOrgFees.filter(f => validStudentIds.has(f.studentId)); // Hide financial data from teachers and orphans
  
  const studentDebts = useMemo(() => {
    const debts: Record<string, FeeRecord[]> = {};
    orgFees.filter(f => f.status === 'pending' || f.status === 'unpaid').forEach(f => {
      if (!debts[f.studentId]) debts[f.studentId] = [];
      debts[f.studentId].push(f);
    });
    return debts;
  }, [orgFees]);

  const currentMonthStr = useMemo(() => new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), []);

  const pendingFeeRecords = useMemo(() => {
    // Strictly pending: only owes for the CURRENT month (no past months)
    return Object.values(studentDebts)
      .filter(fees => fees.every(f => f.month === currentMonthStr))
      .flatMap(fees => fees);
  }, [studentDebts, currentMonthStr]);

  const overdueStudentsList = useMemo(() => {
    // Overdue / Deymaha: owes for ANY past month
    return Object.values(studentDebts)
      .filter(fees => fees.some(f => f.month !== currentMonthStr));
  }, [studentDebts, currentMonthStr]);

  const orgSalaries = isTeacher ? allOrgSalaries.filter(sal => sal.teacherId === matchingTeacher?.id) : allOrgSalaries.filter(sal => orgTeachers.some(t => t.id === sal.teacherId)); // Teachers only see their own salary status, admins see all active teachers
  const orgAttendance = isTeacher
    ? allOrgAttendance.filter(a => teacherSubjectIds.includes(a.subjectId))
    : allOrgAttendance;

  // Metrics
  const totalStudents = orgStudents.length;
  const totalTeachers = orgTeachers.length;
  const totalSubjects = orgSubjects.length;
  const collectedFees = orgFees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
  const pendingFees = orgFees.filter(f => f.status === 'pending' || f.status === 'unpaid').reduce((sum, f) => sum + f.amount, 0);
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayAttendance = orgAttendance.filter(a => a.date === todayDateStr);
  const presentCount = todayAttendance.reduce((acc, curr) => 
    acc + curr.records.filter(r => r.status === 'present' || r.status === 'late').length, 0
  );
  const totalMarked = todayAttendance.reduce((acc, curr) => acc + curr.records.length, 0);
  const attendancePercentage = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.email) {
      setPasswordError('Lama heli karo email-ka isticmaalaha.');
      return;
    }
    setPasswordLoading(true);
    setPasswordError(null);
    try {
      await sendPasswordReset(currentUser.email);
      setIsPasswordModalOpen(false);
      setSuccessMessage(`Email-ka bedelaada ereyga sirta ah si guul leh ayaa loogu diray: ${currentUser.email}! Fadlan eeg sanduuqaaga fariimaha (Inbox).`);
    } catch (err: any) {
      setPasswordError(err.message || 'Ku guuldareystay dirista email-ka.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setNameLoading(true);
    setNameError(null);
    setNameSuccess(null);
    try {
      await updateUserProfile(currentUser.uid, { fullName: adminName });
      setNameSuccess('Magacaaga si guul leh ayaa loo bedelay! (Name updated successfully!)');
    } catch (err: any) {
      setNameError(err.message || 'Ku guuldareystay bedelaada magaca.');
    } finally {
      setNameLoading(false);
    }
  };

  const handleSettingsPasswordReset = async () => {
    setSettingsPasswordLoading(true);
    setSettingsPasswordError(null);
    setSettingsPasswordSuccess(null);
    try {
      if (!currentUser?.email) throw new Error('Cilad ayaa dhacday, fadlan dib u gal system-ka.');
      await sendPasswordReset(currentUser.email);
      setSettingsPasswordSuccess('Code-ka iyo Link-ga lagu bedelo password-ka waxaan u dirnay email-kaaga (' + currentUser.email + '). Fadlan hubi Inbox-ka ama Spam-ka!');
    } catch (err: any) {
      setSettingsPasswordError(err.message || 'Ku guuldareystay diritaanka email-ka bedelaada password-ka.');
    } finally {
      setSettingsPasswordLoading(false);
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffLoading(true);
    setStaffError(null);
    setStaffSuccess(null);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(staffEmail)) {
        throw new Error('Fadlan gali email sax ah. (Please enter a valid email.)');
      }

      if (staffPassword.length < 6) {
        throw new Error('Ereyga sirta ah waa inuu ahaado ugu yaraan 6 xaraf. (Password must be at least 6 characters.)');
      }

      await registerUser({
        email: staffEmail,
        password: staffPassword,
        fullName: staffName,
        role: 'schoolstaff',
        organizationId: orgId,
        staffDesignation: staffDesignation,
        permissions: staffPermissions,
        active: true
      });

      setStaffSuccess(`Staff-ka ${staffName} si guul leh ayaa loo diiwaan geliyey!`);
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffDesignation('');
      setStaffPermissions(['Students', 'Teachers', 'Attendance', 'Exams', 'Fees', 'Edit Students', 'Import Excel', 'Print Reports']);
    } catch (err: any) {
      console.error('Error registering staff:', err);
      setStaffError(err.message || 'Ku guuldareystay diiwaan gelinta staff-ka.');
    } finally {
      setStaffLoading(false);
    }
  };

  const toggleStaffActive = async (uid: string, currentActive: boolean) => {
    setStaffError(null);
    setStaffSuccess(null);
    try {
      await updateUserProfile(uid, { active: !currentActive });
      setStaffSuccess('Xaalada shaqo ee staff-ka si guul leh ayaa loo bedelay!');
    } catch (err: any) {
      console.error('Failed to toggle staff active status:', err);
      setStaffError(err.message || 'Ku guuldareystay bedelaada xaalada staff-ka.');
    }
  };

  const [staffDeleteConfirm, setStaffDeleteConfirm] = useState<{ uid: string; name: string } | null>(null);

  const handleDeleteStaff = async () => {
    if (!staffDeleteConfirm) return;
    setStaffError(null);
    setStaffSuccess(null);
    try {
      await deleteStaffMember(staffDeleteConfirm.uid);
      setStaffSuccess('Staff-ka si guul leh ayaa loo tirtiray!');
      setStaffDeleteConfirm(null);
    } catch (err: any) {
      console.error('Failed to delete staff member:', err);
      setStaffError(err.message || 'Ku guuldareystay tirtirida staff-ka.');
    }
  };

  // Edit Permissions Modal State
  const [editingStaff, setEditingStaff] = useState<{ uid: string; name: string; permissions: string[] } | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);

  const openEditPermissions = (staff: { uid: string; fullName: string; permissions?: string[] }) => {
    setEditingStaff({ uid: staff.uid, name: staff.fullName, permissions: staff.permissions || [] });
    setEditPerms(staff.permissions || []);
  };

  const toggleEditPerm = (key: string) => {
    setEditPerms(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]);
  };

  const handleSaveStaffPermissions = async () => {
    if (!editingStaff) return;
    setStaffError(null);
    setStaffSuccess(null);
    try {
      await updateUserProfile(editingStaff.uid, { permissions: editPerms });
      setStaffSuccess(`${editingStaff.name} permissions-koodii si guul leh ayaa loo cusboonaysiiyay!`);
      setEditingStaff(null);
    } catch (err: any) {
      console.error('Failed to update staff permissions:', err);
      setStaffError(err.message || 'Ku guuldareystay cusboonaysiinta permissions-ka.');
    }
  };


  // Actions
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    let derivedSubjects: string[] = [];
    
    if (isQuranSchool) {
      if (!studentForm.roomId) {
        setFormError('Fadlan dooro qolka (Select a room)');
        return;
      }
    } else {
      if (!studentForm.classSessions || studentForm.classSessions.length === 0) {
        setFormError('Fadlan dooro ugu yaraan hal Class Session oo uu ardaygu dhiganayo.');
        return;
      }

      // Validate overlapping schedule for the selected class sessions of this student
      const selectedSessions = allOrgClassSessions.filter(cs => studentForm.classSessions.includes(cs.id));
      for (let i = 0; i < selectedSessions.length; i++) {
        for (let j = i + 1; j < selectedSessions.length; j++) {
          const cs1 = selectedSessions[i];
          const cs2 = selectedSessions[j];
          
          // Overlap: same day and overlapping hours
          const daysOverlap = cs1.days.some(d => cs2.days.includes(d));
          const timeOverlap = cs1.startTime < cs2.endTime && cs2.startTime < cs1.endTime;

          if (daysOverlap && timeOverlap) {
            setFormError(`Isku-dhac: Ma dooran kartid labo fasal oo isku waqti ah. "${cs1.classCode}" (${cs1.startTime} - ${cs1.endTime}) iyo "${cs2.classCode}" (${cs2.startTime} - ${cs2.endTime}) way isku dhacayaan.`);
            return;
          }
        }
      }
      derivedSubjects = Array.from(new Set(selectedSessions.map(cs => cs.subjectId).filter(Boolean)));
    }

    if (selectedStudent) {
      updateStudent(selectedStudent.id, {
        ...studentForm,
        subjects: derivedSubjects,
      });
      showAlert('Ardayga xogihiisa waa la cusbooneysiiyay (Student updated).', 'success');
      setSelectedStudent(null);
    } else {
      addStudent({
        ...studentForm,
        subjects: derivedSubjects,
        organizationId: orgId,
        profilePhoto: `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentForm.fullName.replace(/\s+/g, '')}`
      });
      showAlert('Arday cusub ayaa la diiwaangeliyay (Student added).', 'success');
    }
    setActiveModal(null);
  };

  const handleAddTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Subjects are optional initially, but if selected, we check for overlap
    const selectedSubjectsList = orgSubjects.filter(s => teacherForm.subjects.includes(s.id));
    for (let i = 0; i < selectedSubjectsList.length; i++) {
      for (let j = i + 1; j < selectedSubjectsList.length; j++) {
        const s1 = selectedSubjectsList[i];
        const s2 = selectedSubjectsList[j];
        
        // Check days overlap
        const daysOverlap = !s1.days || !s2.days || 
          s1.days.length === 0 || s2.days.length === 0 || 
          s1.days.some(d => s2.days?.includes(d));

        // Check time overlap: (start1 < end2) && (start2 < end1)
        const timeOverlap = s1.startTime < s2.endTime && s2.startTime < s1.endTime;

        if (timeOverlap && daysOverlap) {
          setFormError(`Conflict: "${s1.name}" (${s1.startTime} - ${s1.endTime}) and "${s2.name}" (${s2.startTime} - ${s2.endTime}) overlap in schedules. A teacher cannot teach two subjects at the same time.`);
          return;
        }
      }
    }

    if (selectedTeacher) {
      updateTeacher(selectedTeacher.id, teacherForm);
      setSuccessMessage('Macluumaadka macallinka waa la bedelay si guul leh.');
      setSelectedTeacher(null);
    } else {
      addTeacher({
        ...teacherForm,
        timeSchedule: [{ day: 'Monday', startTime: '08:00', endTime: '12:00' }],
        organizationId: orgId
      });
      setSuccessMessage('Teacher profile created and credentials registered.');
    }
    setActiveModal(null);
  };

  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubject) {
      const errorMsg = await updateSubject(selectedSubject.id, {
        ...subjectForm,
        organizationId: orgId
      });
      if (errorMsg) {
        setFormError(errorMsg);
      } else {
        setSuccessMessage('Maaddada waa la bedelay si guul leh.');
        setSelectedSubject(null);
        setActiveModal(null);
      }
    } else {
      const errorMsg = await addSubject({
        ...subjectForm,
        organizationId: orgId
      });
      if (errorMsg) {
        setFormError(errorMsg);
      } else {
        setSuccessMessage('Subject created successfully without schedule conflicts.');
        setActiveModal(null);
      }
    }
  };

  const handleAddClassSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!classSessionForm.classCode.trim()) {
      setFormError('Fadlan qor Class Code-ka (e.g. EL26).');
      return;
    }
    if (!classSessionForm.subjectId) {
      setFormError('Fadlan dooro Maaddada.');
      return;
    }
    if (!classSessionForm.teacherId) {
      setFormError('Fadlan dooro Macallinka.');
      return;
    }
    if (!classSessionForm.roomId) {
      setFormError('Fadlan dooro Qolka.');
      return;
    }
    if (classSessionForm.days.length === 0) {
      setFormError('Fadlan dooro ugu yaraan hal maalin.');
      return;
    }
    if (classSessionForm.startTime >= classSessionForm.endTime) {
      setFormError('Saacadda dhammaadka waa in ay ka dambayso saacadda bilaabashada.');
      return;
    }

    if (selectedClassSession) {
      const errorMsg = await updateClassSession(selectedClassSession.id, {
        ...classSessionForm,
        organizationId: orgId
      });
      if (errorMsg) {
        setFormError(errorMsg);
      } else {
        setSuccessMessage('Class Session-ka waa la bedelay si guul leh.');
        setSelectedClassSession(null);
        setActiveModal(null);
      }
    } else {
      const errorMsg = await addClassSession({
        ...classSessionForm,
        studentsCount: 0,
        organizationId: orgId
      });
      if (errorMsg) {
        setFormError(errorMsg);
      } else {
        setSuccessMessage('Class Session-ka si guul leh ayaa loo abuuray.');
        setActiveModal(null);
      }
    }
  };

  const handleAddRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoom) {
      updateRoom(selectedRoom.id, roomForm);
      setSuccessMessage('Qolka waa la bedelay (Room updated successfully).');
      setSelectedRoom(null);
    } else {
      addRoom({
        ...roomForm,
        organizationId: orgId
      });
      setSuccessMessage('Qolka waa la diiwaan-geliyey (Room registered successfully).');
    }
    setActiveModal(null);
  };

  const handleAddExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalExamData = {
      ...examForm,
      subjectId: examForm.type === 'school' ? 'all' : examForm.subjectId,
      targetClass: examForm.type === 'school' ? 'All Rooms / Whole School' : examForm.targetClass,
    };
    createExam({
      ...finalExamData,
      organizationId: orgId,
      published: false
    });
    setSuccessMessage('Exam created successfully.');
    setActiveModal(null);
  };

  const handleEditExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;
    const finalExamData = {
      ...editExamForm,
      subjectId: editExamForm.type === 'school' ? 'all' : editExamForm.subjectId,
      targetClass: editExamForm.type === 'school' ? 'All Rooms / Whole School' : editExamForm.targetClass,
    };
    updateExam(editingExam.id, finalExamData);
    setSuccessMessage('Exam session updated successfully.');
    setEditingExam(null);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setBulkInput(text);
        setSuccessMessage('Liiska ardayda (CSV) waa la soo akhriyay!');
      };
      reader.readAsText(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          const csv = XLSX.utils.sheet_to_csv(worksheet);
          setBulkInput(csv);
          setSuccessMessage('Faylka Excel-ka ee ardayda waa la akhriyay si guul leh!');
        } catch (err) {
          console.error(err);
          showAlert('Khalad ayaa dhacay xilligii la akhrinayay faylka Excel. Fadlan isticmaal template-ka saxda ah.', 'error');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      showAlert('Fadlan soo geli feyl ah .csv ama .xlsx (Excel)', 'error');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleExcelMarksUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExam) return;
    const examId = selectedExam.id;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        
        const newMarksData: { [studentId: string]: number } = {};
        let validMarksCount = 0;

        data.forEach(row => {
          // Flexible matching for Student ID/Name and Marks
          const sid = row['Student ID'] || row['ID'] || row['StudentId'] || row['studentId'];
          const marksRaw = row['Marks'] || row['Score'] || row['Mark'] || row['Grade'];
          
          if (sid && marksRaw !== undefined) {
            const marks = Number(marksRaw) || 0;
            const student = allOrgStudents.find(s => s.id === String(sid).trim() || s.studentId === String(sid).trim());
            
            if (student) {
              newMarksData[student.id] = marks;
              validMarksCount++;
            }
          }
        });

        if (validMarksCount > 0) {
          const defaults: any = {};
          let targetStudents = allOrgStudents;
          
          if (examTeacherSessionId) {
            targetStudents = allOrgStudents.filter(s => s.classSessions?.includes(examTeacherSessionId));
          } else if (selectedExam.type !== 'school') {
            targetStudents = allOrgStudents.filter(s => 
              (selectedExam.sessionId && s.classSessions?.includes(selectedExam.sessionId)) || 
              (selectedExam.subjectId && s.subjects?.includes(selectedExam.subjectId))
            );
          }

          targetStudents.forEach(s => {
            defaults[s.id] = newMarksData[s.id] !== undefined ? newMarksData[s.id] : 0;
          });

          setMarksData(defaults);
          setActiveModal('enterMarks');
          setSuccessMessage(`Si guul leh ayaa loo soo akhriyey ${validMarksCount} dhibcood. Fadlan hubi oo taabo 'Submit Scores'.`);
        } else {
          setFormError('No valid marks found in the Excel file. Please check column headers (Student ID, Marks).');
        }
      } catch (err) {
        console.error('Error importing marks:', err);
        setFormError('Failed to parse Excel file. Please ensure it is a valid format.');
      }
      
      // Reset input
      if (marksFileInputRef.current) {
        marksFileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = (ex: any, specificSessionId?: string) => {
    const headers = [['Student ID', 'Student Name', 'Marks']];
    let targetStudents = allOrgStudents;
    if (specificSessionId) {
      targetStudents = allOrgStudents.filter(s => s.classSessions?.includes(specificSessionId));
    } else if (ex.type !== 'school') {
      targetStudents = allOrgStudents.filter(s => 
        (ex.sessionId && s.classSessions?.includes(ex.sessionId)) || 
        (ex.subjectId && s.subjects?.includes(ex.subjectId))
      );
    }
    const rows = targetStudents.map(s => [s.studentId || s.id, s.fullName, '']);
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    ws['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Marks Template');
    XLSX.writeFile(wb, `${ex.title.replace(/\s+/g, '_')}_Template.xlsx`);
  };

  const downloadExcelTemplate = () => {
    const headers = [[t('settings.fullName'), 'Student Phone', 'Parent Phone', 'Address', 'Gender', 'Date of Birth (YYYY-MM-DD)', 'Monthly Fee']];
    const exampleRow = [
      ['Zakaria Farah', '+252615111111', '+252615999991', 'Wadajir', 'male', '2012-05-15', '50'],
      ['Amina Mohamed', '+252615222222', '+252615999992', 'Hodan', 'female', '2013-08-20', '45']
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...exampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students Template');
    XLSX.writeFile(wb, 'student_import_template.xlsx');
  };

  const handleBulkImport = () => {
    setBulkResult(null);
    if (!bulkInput.trim()) return;

    // Convert CSV lines, skipping header if present
    const lines = bulkInput.split('\n');
    const importData: any[] = [];
    
    lines.forEach((line, index) => {
      // Skip CSV/Excel headers if detected
      if (index === 0 && (line.toLowerCase().includes('name') || line.toLowerCase().includes('phone') || line.toLowerCase().includes('gender'))) {
        return;
      }
      
      const parts = line.split(',');
      if (parts.length >= 1 && parts[0].trim()) {
        importData.push({
          fullName: parts[0].trim(),
          studentPhone: parts[1]?.trim() || '',
          parentPhone: parts[2]?.trim() || '',
          address: parts[3]?.trim() || '',
          gender: parts[4]?.trim() || 'male',
          dob: parts[5]?.trim() || '2015-01-01',
          fee: Number(parts[6]?.trim()) || 45,
          subjects: bulkSubjectId ? [bulkSubjectId] : []
        });
      }
    });

    const result = bulkImportStudents(importData);
    setBulkResult(result);
    setBulkInput('');
    if (result.successCount > 0) {
      setSuccessMessage(`Si guul leh ayaa loo galiyay ${result.successCount} arday.`);
    }
  };

  const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error('Network response was not ok');
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Could not load image from URL, using fallback", e);
      throw e;
    }
  };

  const generateStudentEnrollmentPDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let pageNumber = 1;

      const drawHeaderAndFooter = (page: number) => {
        // Top black thin accent line
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(15, 12, 180, 4, 'F');

        // Academy details
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
doc.text((currentOrg?.name || '').toUpperCase(), 15, 23);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Official Academic Institution • Student Administration Registry`, 15, 27);

        // Report Type (Right aligned)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("STUDENT ENROLLMENT REGISTRY", 195, 23, { align: 'right' });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 195, 27, { align: 'right' });

        // Divider
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.5);
        doc.line(15, 30, 195, 30);

        // Footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(`Page ${page}`, 105, 285, { align: 'center' });
        doc.text(`${currentOrg?.name || 'School'} Management System • Secure Academic Report`, 15, 285);
      };

      // Summary Stats block on the first page
      drawHeaderAndFooter(1);

      let y = 38;
      
      // Summary Metrics
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(15, y, 180, 15, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.rect(15, y, 180, 15, 'D');

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("TOTAL ENROLLED", 20, y + 6);
      doc.text("MALE / ARDAY", 80, y + 6);
      doc.text("FEMALE / ARDAYAD", 140, y + 6);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      
      const mCount = students.filter(s => s.gender === 'male').length;
      const fCount = students.filter(s => s.gender === 'female').length;
      doc.text(`${students.length} Students`, 20, y + 11);
      doc.text(`${mCount}`, 80, y + 11);
      doc.text(`${fCount}`, 140, y + 11);

      y += 22;

      // Table Headers
      const headers = ["S/N", "STUDENT ID", "FULL NAME", "PHONE", "PARENT PHONE", "MONTHLY FEE", "PHOTO"];
      const colPositions = [15, 25, 50, 100, 130, 160, 183];

      const drawTableHeader = (curY: number) => {
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(15, curY, 180, 8, 'F');
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        
        for (let i = 0; i < headers.length; i++) {
          doc.text(headers[i], colPositions[i] + (i === 0 ? 1 : 0), curY + 5.5);
        }
      };

      drawTableHeader(y);
      y += 8;

      for (let i = 0; i < students.length; i++) {
        const student = students[i];

        if (y > 265) {
          doc.addPage();
          pageNumber++;
          y = 38;
          drawHeaderAndFooter(pageNumber);
          drawTableHeader(y);
          y += 8;
        }

        // Row zebra background
        if (i % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(15, y, 180, 10, 'F');
        }
        
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);

        // Values
        doc.text(String(i + 1), colPositions[0] + 1, y + 6);
        doc.setFont("helvetica", "bold");
        doc.text(student.studentId || `STU-${1000 + i}`, colPositions[1], y + 6);
        doc.setFont("helvetica", "normal");
        doc.text(student.fullName, colPositions[2], y + 6);
        doc.text(student.studentPhone || 'N/A', colPositions[3], y + 6);
        doc.text(student.parentPhone || 'N/A', colPositions[4], y + 6);
        doc.text(`$${student.fee || 0}`, colPositions[5], y + 6);

        // Photo references / Avatar placeholder box
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(241, 245, 249);
        doc.rect(colPositions[6], y + 1.5, 7, 7, 'FD');
        doc.setFontSize(5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(148, 163, 184);
        doc.text("PHOTO", colPositions[6] + 0.8, y + 5.5);

        if (student.profilePhoto) {
          try {
            if (student.profilePhoto.startsWith('data:image')) {
              doc.addImage(student.profilePhoto, 'JPEG', colPositions[6], y + 1.5, 7, 7);
            }
          } catch (err) {
            console.warn("Could not embed image", err);
          }
        }

        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);

        // Bottom border row
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.3);
        doc.line(15, y + 10, 195, y + 10);

        y += 10;
      }

      // Replace page placeholders
      for (let j = 1; j <= pageNumber; j++) {
        doc.setPage(j);
        doc.setFillColor(255, 255, 255);
        doc.rect(95, 280, 20, 8, 'F');
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${j} of ${pageNumber}`, 105, 285, { align: 'center' });
      }

      doc.save('student_enrollment_registry.pdf');
    } catch (error) {
      console.error("Error generating student enrollment PDF:", error);
      showAlert("Cillad ayaa dhacday intii la samaynayay Student Enrollment PDF.", 'error');
    }
  };

  const generateFeeBillingsStatementPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let pageNumber = 1;

      const drawHeaderAndFooter = (page: number) => {
        // Top black thin accent line
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(15, 12, 180, 4, 'F');

        // Academy details
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
doc.text((currentOrg?.name || '').toUpperCase(), 15, 23);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Official Academic Institution • Tuition & Finance Department`, 15, 27);

        // Report Type (Right aligned)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("FEE BILLINGS STATEMENT", 195, 23, { align: 'right' });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 195, 27, { align: 'right' });

        // Divider
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.5);
        doc.line(15, 30, 195, 30);

        // Footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(`Page ${page}`, 105, 285, { align: 'center' });
        doc.text(`${currentOrg?.name || 'School'} Management System • Financial Statement`, 15, 285);
      };

      drawHeaderAndFooter(1);

      let y = 38;

      // Calculate stats
      const totalInvoiced = feeRecords.reduce((sum, f) => sum + (f.amount || 0), 0);
      const totalPaid = feeRecords.filter(f => f.status === 'paid').reduce((sum, f) => sum + (f.amount || 0), 0);
      const totalUnpaid = feeRecords.filter(f => f.status === 'pending' || f.status === 'unpaid').reduce((sum, f) => sum + (f.amount || 0), 0);

      // Summary Cards Block (3 Columns)
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, y, 56, 18, 'FD');
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("TOTAL INVOICED", 19, y + 5);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`$${totalInvoiced.toLocaleString()}`, 19, y + 13);

      doc.setFillColor(240, 253, 244); // green-50
      doc.setDrawColor(187, 247, 208); // green-200
      doc.rect(77, y, 56, 18, 'FD');
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(21, 128, 61); // green-700
      doc.text("TOTAL COLLECTED (PAID)", 81, y + 5);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(21, 128, 61);
      doc.text(`$${totalPaid.toLocaleString()}`, 81, y + 13);

      doc.setFillColor(254, 242, 242); // red-50
      doc.setDrawColor(254, 202, 202); // red-200
      doc.rect(139, y, 56, 18, 'FD');
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(185, 28, 28); // red-700
      doc.text("TOTAL OUTSTANDING", 143, y + 5);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(185, 28, 28);
      doc.text(`$${totalUnpaid.toLocaleString()}`, 143, y + 13);

      y += 26;

      // Table Headers
      const headers = ["S/N", "STUDENT NAME", "MONTH", "INVOICE NO", "AMOUNT", "STATUS", "DATE PAID"];
      const colPositions = [15, 25, 75, 105, 133, 155, 175];

      const drawTableHeader = (curY: number) => {
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(15, curY, 180, 8, 'F');
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        for (let i = 0; i < headers.length; i++) {
          doc.text(headers[i], colPositions[i] + (i === 0 ? 1 : 0), curY + 5.5);
        }
      };

      drawTableHeader(y);
      y += 8;

      for (let i = 0; i < feeRecords.length; i++) {
        const fee = feeRecords[i];

        if (y > 265) {
          doc.addPage();
          pageNumber++;
          y = 38;
          drawHeaderAndFooter(pageNumber);
          drawTableHeader(y);
          y += 8;
        }

        if (i % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(15, y, 180, 10, 'F');
        }

        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);

        doc.text(String(i + 1), colPositions[0] + 1, y + 6);
        doc.setFont("helvetica", "semibold");
        doc.text(fee.studentName, colPositions[1], y + 6);
        doc.setFont("helvetica", "normal");
        doc.text(fee.month, colPositions[2], y + 6);
        doc.text(fee.invoiceNumber, colPositions[3], y + 6);
        doc.text(`$${fee.amount}`, colPositions[4], y + 6);

        if (fee.status === 'paid') {
          doc.setTextColor(21, 128, 61); // green-700
          doc.setFont("helvetica", "bold");
          doc.text("PAID", colPositions[5], y + 6);
        } else {
          doc.setTextColor(185, 28, 28); // red-700
          doc.setFont("helvetica", "bold");
          doc.text("UNPAID", colPositions[5], y + 6);
        }

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        const paidDate = fee.paidAt ? new Date(fee.paidAt).toLocaleDateString() : '-';
        doc.text(paidDate, colPositions[6], y + 6);

        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.3);
        doc.line(15, y + 10, 195, y + 10);

        y += 10;
      }

      for (let j = 1; j <= pageNumber; j++) {
        doc.setPage(j);
        doc.setFillColor(255, 255, 255);
        doc.rect(95, 280, 20, 8, 'F');
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${j} of ${pageNumber}`, 105, 285, { align: 'center' });
      }

      doc.save('fee_billings_statement.pdf');
    } catch (error) {
      console.error("Error generating fee billings PDF:", error);
      showAlert("Cillad ayaa dhacday intii la samaynayay Fee Billings Statement.", 'error');
    }
  };

  const generateAcademicGradesSummaryPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let pageNumber = 1;

      const drawHeaderAndFooter = (page: number) => {
        // Top black thin accent line
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(15, 12, 180, 4, 'F');

        // Academy details
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
doc.text((currentOrg?.name || '').toUpperCase(), 15, 23);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Official Academic Institution • Office of the Registrar`, 15, 27);

        // Report Type (Right aligned)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("ACADEMIC GRADES SUMMARY", 195, 23, { align: 'right' });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 195, 27, { align: 'right' });

        // Divider
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.5);
        doc.line(15, 30, 195, 30);

        // Footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(`Page ${page}`, 105, 285, { align: 'center' });
        doc.text(`${currentOrg?.name || 'School'} Management System • Academic Registry Report`, 15, 285);
      };

      drawHeaderAndFooter(1);

      let y = 38;

      if (!examResults || examResults.length === 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("No academic grades or exam results published yet.", 20, y + 10);
        doc.save('academic_grades_summary.pdf');
        return;
      }

      const totalExams = examResults.length;
      let totalMarksSum = 0;
      let totalGradesCount = 0;
      examResults.forEach(er => {
        if (er.results) {
          er.results.forEach((r: any) => {
            totalMarksSum += r.marks || 0;
            totalGradesCount++;
          });
        }
      });
      const overallAverage = totalGradesCount > 0 ? (totalMarksSum / totalGradesCount).toFixed(1) : 'N/A';

      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, y, 85, 18, 'FD');
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("TOTAL EXAMS RECORDED", 20, y + 5);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${totalExams} Sessions`, 20, y + 13);

      doc.setFillColor(240, 253, 244); // green-50
      doc.setDrawColor(187, 247, 208); // green-200
      doc.rect(110, y, 85, 18, 'FD');
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(21, 128, 61); // green-700
      doc.text("OVERALL GRADE AVERAGE", 115, y + 5);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(21, 128, 61);
      doc.text(`${overallAverage}%`, 115, y + 13);

      y += 28;

      for (let eIdx = 0; eIdx < examResults.length; eIdx++) {
        const er = examResults[eIdx];

        if (y > 240) {
          doc.addPage();
          pageNumber++;
          y = 38;
          drawHeaderAndFooter(pageNumber);
        }

        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(15, y, 180, 8, 'F');
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(er.examTitle?.toUpperCase() || 'EXAM SESSION', 18, y + 5.5);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text(`Avg Score: ${er.average || 0}%`, 192, y + 5.5, { align: 'right' });

        y += 10;

        const scoreHeaders = ["S/N", "STUDENT ID / CODE", "STUDENT NAME", "MARKS SECURED", "GRADE RATING"];
        const scoreColPositions = [15, 25, 75, 135, 165];

        doc.setFillColor(71, 85, 105); // slate-600
        doc.rect(15, y, 180, 6.5, 'F');
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        for (let h = 0; h < scoreHeaders.length; h++) {
          doc.text(scoreHeaders[h], scoreColPositions[h] + (h === 0 ? 1 : 0), y + 4.5);
        }
        y += 6.5;

        const results = er.results || [];
        if (results.length === 0) {
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(120, 120, 120);
          doc.text("No student scores submitted for this exam yet.", 20, y + 5);
          y += 8;
        } else {
          for (let rIdx = 0; rIdx < results.length; rIdx++) {
            const resItem = results[rIdx];

            if (y > 265) {
              doc.addPage();
              pageNumber++;
              y = 38;
              drawHeaderAndFooter(pageNumber);
              
              doc.setFillColor(71, 85, 105);
              doc.rect(15, y, 180, 6.5, 'F');
              doc.setFontSize(7.5);
              doc.setFont("helvetica", "bold");
              doc.setTextColor(255, 255, 255);
              for (let h = 0; h < scoreHeaders.length; h++) {
                doc.text(scoreHeaders[h], scoreColPositions[h] + (h === 0 ? 1 : 0), y + 4.5);
              }
              y += 6.5;
            }

            if (rIdx % 2 === 0) {
              doc.setFillColor(252, 252, 252);
              doc.rect(15, y, 180, 8, 'F');
            }

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(15, 23, 42);

            doc.text(String(rIdx + 1), scoreColPositions[0] + 1, y + 5);
            
            const matchingStu = students.find(s => s.id === resItem.studentId || s.fullName === resItem.studentName);
            doc.setFont("helvetica", "semibold");
            doc.text(matchingStu?.studentId || `STU-ID`, scoreColPositions[1], y + 5);
            doc.setFont("helvetica", "normal");
            doc.text(resItem.studentName, scoreColPositions[2], y + 5);
            
            const marksVal = resItem.marks || 0;
            if (marksVal >= 80) {
              doc.setTextColor(21, 128, 61); // green-700
              doc.setFont("helvetica", "bold");
            } else if (marksVal < 50) {
              doc.setTextColor(185, 28, 28); // red-700
              doc.setFont("helvetica", "bold");
            }
            doc.text(`${marksVal}%`, scoreColPositions[3], y + 5);

            doc.setFont("helvetica", "bold");
            doc.text(resItem.grade || '-', scoreColPositions[4], y + 5);

            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "normal");

            doc.setDrawColor(241, 245, 249);
            doc.setLineWidth(0.2);
            doc.line(15, y + 8, 195, y + 8);

            y += 8;
          }
        }

        y += 8;
      }

      for (let j = 1; j <= pageNumber; j++) {
        doc.setPage(j);
        doc.setFillColor(255, 255, 255);
        doc.rect(95, 280, 20, 8, 'F');
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${j} of ${pageNumber}`, 105, 285, { align: 'center' });
      }
    } catch (error) {
      console.error("Error generating grades PDF:", error);
      showAlert("Cillad ayaa dhacday intii la samaynayay Academic Grades Summary PDF.", 'error');
    }
  };

  const generateReceiptPDF = async (fee: FeeRecord): Promise<jsPDF> => {
    // ID Card size: 85.6mm x 130mm (slightly bigger than standard ID card)
    const W = 85.6;
    const H = 130;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [W, H]
    });

    const cx = W / 2; // center X

    // ── BACKGROUND ──
    doc.setFillColor(250, 251, 253);
    doc.rect(0, 0, W, H, 'F');

    // ── TOP HEADER GRADIENT BAND ──
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, W, 26, 'F');

    // Accent stripe
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 26, W, 2, 'F');

    // Org Name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const orgNameText = (currentOrg?.name || '').toUpperCase();
    doc.text(orgNameText, cx, 12, { align: 'center', maxWidth: W - 8 });

    // Sub-title
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text('OFFICIAL TUITION RECEIPT / INVOICE', cx, 20, { align: 'center' });

    // ── PAID OR CANCELLED BADGE ──
    const isCancelled = fee.status === 'cancelled';
    if (isCancelled) {
      doc.setFillColor(239, 68, 68); // red-500
      doc.roundedRect(cx - 18, 30, 36, 7, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.text('✕  CANCELLED / LAGA NOQDAY', cx, 34.8, { align: 'center' });
    } else {
      doc.setFillColor(16, 185, 129); // emerald-500
      doc.roundedRect(cx - 14, 30, 28, 7, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.text('✓  APPROVED & PAID', cx, 34.8, { align: 'center' });
    }

    // ── AMOUNT BOX ──
    doc.setFillColor(240, 253, 244); // green-50
    doc.setDrawColor(167, 243, 208); // green-200
    doc.roundedRect(6, 41, W - 12, 14, 2, 2, 'FD');
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 128, 61);
    doc.text('CADADKA LA BIXIYAY / AMOUNT PAID', cx, 46, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(`$${fee.amount}`, cx, 53, { align: 'center' });

    // ── DIVIDER ──
    doc.setDrawColor(226, 232, 240);
    doc.line(6, 59, W - 6, 59);

    // ── DETAILS ROWS ──
    const labelColor: [number, number, number] = [148, 163, 184];
    const valueColor: [number, number, number] = [15, 23, 42];
    const rowH = 7.5;
    
    // Calculate exact payment date & time
    const paymentDateStr = fee.paidAt 
      ? new Date(fee.paidAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) 
      : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    // Calculate expiration date (end of the billed month)
    let expireDateStr = 'N/A';
    try {
      const parsedMonth = new Date(fee.month);
      if (!isNaN(parsedMonth.getTime())) {
        const expDate = new Date(parsedMonth.getFullYear(), parsedMonth.getMonth() + 1, 0);
        expireDateStr = expDate.toLocaleDateString('en-US', { dateStyle: 'medium' });
      }
    } catch(e) {}

    const studentObj = allOrgStudents.find(s => s.id === fee.studentId || s.fullName === fee.studentName);
    const rows: { label: string; value: string }[] = [
      { label: 'ARDAYGA / STUDENT', value: fee.studentName },
      { label: 'STUDENT ID / AQOONSIGA', value: studentObj?.studentId || fee.studentId || 'N/A' },
      { label: 'INVOICE NO / RISIIDH', value: fee.invoiceNumber },
      { label: 'BISHA / MONTH', value: fee.month },
      { label: 'TAARIIKHDA / DATE', value: paymentDateStr },
      { label: 'KU EGYAHAY / VALID UNTIL', value: expireDateStr },
    ];

    rows.forEach((row, i) => {
      const y = 63 + i * rowH;
      doc.setFontSize(4.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...labelColor);
      doc.text(row.label, 8, y);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...valueColor);
      doc.text(String(row.value), W - 8, y, { align: 'right', maxWidth: 45 });
      if (i < rows.length - 1) {
        doc.setDrawColor(241, 245, 249);
        doc.line(8, y + 3, W - 8, y + 3);
      }
    });

    // ── DIVIDER ──
    doc.setDrawColor(226, 232, 240);
    doc.line(6, 96, W - 6, 96);

    // ── QR CODE ──
    const verifyUrl = `${window.location.origin}/verify-receipt?o=${encodeURIComponent(currentOrg?.id || '')}&f=${encodeURIComponent(fee.id || '')}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}`;
    const qrSize = 22;
    const qrX = cx - qrSize / 2;
    const qrY = 99;

    try {
      const qrBase64 = await getBase64ImageFromUrl(qrUrl);
      doc.addImage(qrBase64, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch (e) {
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.rect(qrX, qrY, qrSize, qrSize, 'FD');
      doc.setFontSize(5);
      doc.setTextColor(148, 163, 184);
      doc.text('[ QR ]', cx, qrY + qrSize / 2, { align: 'center' });
    }

    // QR label
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Scan to verify online', cx, qrY + qrSize + 3, { align: 'center' });

    // ── BOTTOM FOOTER ──
    doc.setFillColor(15, 23, 42);
    doc.rect(0, H - 10, W, 10, 'F');
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Mahadsanid · Thank you for your payment', cx, H - 5.5, { align: 'center' });
    doc.setTextColor(16, 185, 129);
    doc.text((currentOrg?.name || '') + ' · Secure Digital Receipt', cx, H - 2, { align: 'center' });

    return doc;
  };

  // Helper: Open WhatsApp Link with a short, beautiful verification link
  const sendWhatsAppReceipt = (fee: FeeRecord) => {
    try {
      const student = orgStudents.find(s => s.id === fee.studentId);
      const phone = student?.studentPhone || student?.parentPhone || '+252615000000';

      // Short clean link: only org ID + fee doc ID
      const verifyUrl = `${window.location.origin}/verify-receipt?o=${encodeURIComponent(currentOrg?.id || '')}&f=${encodeURIComponent(fee.id || '')}`;

      const whatsappMessage =
        `Salaam ${fee.studentName}! 🎓\n\n` +
        `Waxaad heli kartaa risiidhkaaga rasmiga ah ee bishii *${fee.month}* halkan:\n\n` +
        `🔗 ${verifyUrl}\n\n` +
        `💳 Lacagta la bixiyay: *$${fee.amount}*\n` +
        `📅 Taariikhda: ${fee.paidAt ? new Date(fee.paidAt).toLocaleDateString() : new Date().toLocaleDateString()}\n\n` +
        `Mahadsanid! — ${currentOrg?.name || ''}`;

      const encodedText = encodeURIComponent(whatsappMessage);
      window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
    } catch (err) {
      console.error("Error sending WhatsApp receipt:", err);
      showAlert("Cillad ayaa dhacday intii WhatsApp-ka la furayay.", 'error');
    }
  };

  const downloadUnpaidInvoicePDF = (fee: FeeRecord) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 1. Header (Black & White Minimalist Design)
      doc.setFillColor(0, 0, 0); // Pure black top header accent
      doc.rect(15, 15, 180, 5, 'F');

      // Title & Academy Info
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text((currentOrg?.name || '').toUpperCase(), 15, 32);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Official Academic Institution • Tuition & Fees Billing Department", 15, 38);

      // Document Type Name (Right aligned)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("UNPAID INVOICE", 195, 32, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice No: ${fee.invoiceNumber}`, 195, 38, { align: 'right' });

      // Thick separator line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.6);
      doc.line(15, 43, 195, 43);

      // 2. Billing & Invoice Information (2-Column Grid)
      // Left Column: Client info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("BILL TO (ARDAYGA):", 15, 53);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(fee.studentName, 15, 59);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const student = orgStudents.find(s => s.id === fee.studentId);
      doc.text(`ID: ${student?.studentId || 'N/A'}`, 15, 64);
      doc.text(`Phone: ${student?.studentPhone || student?.parentPhone || 'N/A'}`, 15, 69);
      doc.text(`Address: ${student?.address || 'N/A'}`, 15, 74);

      // Right Column: Invoice metadata
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("INVOICE DETAILS:", 115, 53);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Billing Month: ${fee.month}`, 115, 59);
      doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, 115, 64);
      doc.text(`Due Date: 25th of ${fee.month}`, 115, 69);
      
      // Invoice Status Box (Grayscale)
      doc.setFillColor(240, 240, 240);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.rect(115, 73, 80, 8, 'FD');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text("STATUS: UNPAID / MA BIXININ", 119, 78.5);

      // Separator
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(15, 87, 195, 87);

      // 3. Table of Fees (Beautiful Minimalist Design - NO COLORS)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("FEES BREAKDOWN / FAAHFAAHINTA LACAGTA", 15, 95);

      // Header row
      const tableTopY = 100;
      doc.setFillColor(245, 245, 245); // Light grey fill
      doc.rect(15, tableTopY, 180, 8, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(15, tableTopY, 195, tableTopY); // Top line
      doc.line(15, tableTopY + 8, 195, tableTopY + 8); // Bottom line

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text("S.No", 18, tableTopY + 5.5);
      doc.text("Description (Faahfaahin)", 32, tableTopY + 5.5);
      doc.text("Qty", 125, tableTopY + 5.5);
      doc.text("Unit Price", 145, tableTopY + 5.5);
      doc.text("Total Amount", 172, tableTopY + 5.5);

      // Row 1 (Tuition fee item)
      const rowY = tableTopY + 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text("1", 19, rowY);
      doc.text(`Monthly Academic Tuition Fee (${fee.month})`, 32, rowY);
      doc.text("1", 127, rowY);
      doc.text(`$${fee.amount.toFixed(2)}`, 145, rowY);
      doc.text(`$${fee.amount.toFixed(2)}`, 172, rowY);

      // Row separator
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.25);
      doc.line(15, rowY + 5, 195, rowY + 5);

      // 4. Totals Block (Grayscale summary)
      const totalsY = rowY + 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Subtotal:", 140, totalsY);
      doc.text(`$${fee.amount.toFixed(2)}`, 172, totalsY);

      doc.text("Tax / Other charges:", 140, totalsY + 6);
      doc.text("$0.00", 172, totalsY + 6);

      // Total Due line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(135, totalsY + 9, 195, totalsY + 9);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(0, 0, 0);
      doc.text("TOTAL DUE:", 135, totalsY + 14);
      doc.text(`$${fee.amount.toFixed(2)}`, 172, totalsY + 14);

      // Double underline below total
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.line(135, totalsY + 16, 195, totalsY + 16);
      doc.line(135, totalsY + 16.6, 195, totalsY + 16.6);

      // 5. Terms & Signature Blocks (Grayscale footer area)
      // Left notice box
      const noteY = totalsY + 30;
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, noteY, 105, 30);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text("IMPORTANT NOTICE / OGEEYSIIS:", 19, noteY + 6);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);
      doc.text("• Fadlan ku bixi khidmada ka hor taariikhda xaddidan.", 19, noteY + 12);
      doc.text("• Invoice-kan waa mid rasmi ah oo ka soo baxay maamulka.", 19, noteY + 17);
      doc.text("• Please settle this payment immediately to keep student active.", 19, noteY + 22);

      // Right Signature block
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text("Issued by (Maamulka):", 135, noteY + 6);
      
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(135, noteY + 22, 195, noteY + 22); // Signature line
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text("Authorized Signature & Stamp", 165, noteY + 26, { align: 'center' });

      // Footer disclaimer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text("Thank you for your continuous support and cooperation.", 105, 275, { align: 'center' });

      doc.save(`Invoice_Pending_${fee.studentName.replace(/\s+/g, '_')}_${fee.month.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Unpaid Invoice PDF Generation failed:", err);
      showAlert("Cillad ayaa dhacday intii PDF-ka la samaynayey.", 'error');
    }
  };

  const downloadAllPendingFeesPDF = () => {
    try {
      const pendingList = orgFees
        .filter(f => f.status === 'pending' || f.status === 'unpaid')
        .filter(f => f.studentName.toLowerCase().includes(pendingSearch.toLowerCase()));

      if (pendingList.length === 0) {
        showAlert("Ma jiraan arday lacag laga rabo oo ku jira liiska hadda.", 'info');
        return;
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Page configuration
      let pageNumber = 1;
      const totalPagesPlaceholder = "{total_pages}";
      
      const drawHeaderAndFooter = (page: number) => {
        // Top black thin accent line
        doc.setFillColor(0, 0, 0);
        doc.rect(15, 12, 180, 4, 'F');

        // Academy details
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
doc.text((currentOrg?.name || '').toUpperCase(), 15, 23);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Official Academic Institution • Financial Department Report", 15, 27);

        // Report Type (Right aligned)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text("PENDING FEES REPORT", 195, 23, { align: 'right' });
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 195, 27, { align: 'right' });

        // Double thin line divider
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.line(15, 31, 195, 31);
        doc.setLineWidth(0.1);
        doc.line(15, 32, 195, 32);

        // Footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text("CONFIDENTIAL - FOR INTERNAL ADMINISTRATION ONLY", 15, 285);
        doc.text(`Page ${page} of ${totalPagesPlaceholder}`, 195, 285, { align: 'right' });
      };

      // Draw first page header
      drawHeaderAndFooter(pageNumber);

      // Metadata section (Summary Info)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("SUMMARY OVERVIEW:", 15, 39);

      // Draw small summary table (Grayscale/No Colors)
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.rect(15, 41, 180, 12);
      doc.line(75, 41, 75, 53);
      doc.line(135, 41, 135, 53);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text("Report Scope:", 18, 45);
      doc.text("Total Outstanding Students:", 78, 45);
      doc.text("Total Outstanding Balance:", 138, 45);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text(pendingSearch ? "Filtered Search List" : "All Outstanding Accounts", 18, 50);
      doc.text(`${pendingList.length} Students`, 78, 50);
      
      const totalAmount = pendingList.reduce((sum, f) => sum + f.amount, 0);
      doc.text(`$${totalAmount.toFixed(2)}`, 138, 50);

      // Table Header Row helper
      const drawTableHeader = (y: number) => {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, y, 180, 7, 'F');
        
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.line(15, y, 195, y);
        doc.line(15, y + 7, 195, y + 7);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        
        doc.text("S.No", 17, y + 4.5);
        doc.text("Student Name", 27, y + 4.5);
        doc.text("Student ID", 77, y + 4.5);
        doc.text("Contact Phone", 97, y + 4.5);
        doc.text("Fee Month", 127, y + 4.5);
        doc.text("Amount", 157, y + 4.5);
        doc.text("Status", 177, y + 4.5);
      };

      let currentY = 62;
      drawTableHeader(currentY);
      currentY += 7;

      // Draw rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      
      pendingList.forEach((fee, index) => {
        const rowHeight = 7;
        // Check if page overflow
        if (currentY + rowHeight > 270) {
          pageNumber++;
          doc.addPage();
          drawHeaderAndFooter(pageNumber);
          currentY = 40;
          drawTableHeader(currentY);
          currentY += 7;
        }

        const student = orgStudents.find(s => s.id === fee.studentId);
        const sNo = (index + 1).toString();
        const studentName = fee.studentName;
        const studentId = student?.studentId || 'N/A';
        const phone = student?.studentPhone || student?.parentPhone || 'N/A';
        const feeMonth = fee.month;
        const amountStr = `$${fee.amount.toFixed(2)}`;
        const statusStr = isFeeExpired(fee) ? "Expired" : "Unpaid";

        // Draw row borders (subtle gray)
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.15);
        doc.line(15, currentY + rowHeight, 195, currentY + rowHeight);

        // Render text
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        doc.text(sNo, 17, currentY + 4.5);
        doc.text(studentName, 27, currentY + 4.5);
        doc.text(studentId, 77, currentY + 4.5);
        doc.text(phone, 97, currentY + 4.5);
        doc.text(feeMonth, 127, currentY + 4.5);
        doc.text(amountStr, 157, currentY + 4.5);
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(statusStr, 177, currentY + 4.5);

        currentY += rowHeight;
      });

      // Table Footer / Grand Total Row
      const footerRowHeight = 8;
      if (currentY + footerRowHeight > 270) {
        pageNumber++;
        doc.addPage();
        drawHeaderAndFooter(pageNumber);
        currentY = 40;
      }

      // Draw bold line for total
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.35);
      doc.line(15, currentY, 195, currentY);
      
      doc.setFillColor(248, 248, 248);
      doc.rect(15, currentY, 180, footerRowHeight, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text("GRAND TOTAL:", 127, currentY + 5.5);
      doc.text(`$${totalAmount.toFixed(2)}`, 157, currentY + 5.5);

      doc.line(15, currentY + footerRowHeight, 195, currentY + footerRowHeight);
      
      // Double line on the bottom of grand total
      doc.line(15, currentY + footerRowHeight + 0.6, 195, currentY + footerRowHeight + 0.6);

      // Replace total pages placeholder on all pages
      const pagesCount = pageNumber;
      for (let i = 1; i <= pagesCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        // Clear old page string area
        doc.setFillColor(255, 255, 255);
        doc.rect(170, 281, 28, 6, 'F');
        doc.text(`Page ${i} of ${pagesCount}`, 195, 285, { align: 'right' });
      }

      doc.save(`Pending_Fees_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Failed to generate combined pending fees PDF:", err);
      showAlert("Cillad ayaa dhacday intii la samaynayey PDF-ka.", 'error');
    }
  };

  const printReceipt = async (fee: FeeRecord) => {
    try {
      const doc = await generateReceiptPDF(fee);
      doc.save(`Risiidh_${fee.invoiceNumber}.pdf`);
    } catch (err) {
      console.error("PDF printing error:", err);
      showAlert("Cillad ayaa dhacday intii PDF-ka la diyaarinayay.", 'error');
    }
  };

  const downloadSalaryReceiptPDF = (sal: SalaryRecord) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 1. Header (Black & White Minimalist Design)
      doc.setFillColor(0, 0, 0); // Pure black top header accent
      doc.rect(15, 15, 180, 5, 'F');

      // Title & Academy Info
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text((currentOrg?.name || '').toUpperCase(), 15, 32);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Official Academic Institution • Human Resources & Payroll Office", 15, 38);

      // Document Type Name (Right aligned)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("SALARY RECEIPT VOUCHER", 195, 32, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Voucher No: SAL-${sal.id.substring(0, 8).toUpperCase()}`, 195, 38, { align: 'right' });

      // Thick separator line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.6);
      doc.line(15, 43, 195, 43);

      // 2. Teacher & Payout Information (2-Column Grid)
      // Left Column: Employee info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("EMPLOYEE / MACALINKA:", 15, 53);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(sal.teacherName, 15, 59);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const teacherObj = orgTeachers.find(t => t.id === sal.teacherId);
      doc.text(`ID/Email: ${teacherObj?.email || 'N/A'}`, 15, 64);
      doc.text(`Phone: ${teacherObj?.phone || 'N/A'}`, 15, 69);

      // Right Column: Payout details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("PAYROLL DETAILS:", 115, 53);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Salary Month: ${sal.month}`, 115, 59);
      const paidDateStr = sal.paidAt ? new Date(sal.paidAt).toLocaleDateString() : new Date().toLocaleDateString();
      doc.text(`Payout Date: ${paidDateStr}`, 115, 64);
      doc.text(`Payment Status: PAID / BIXIYAY`, 115, 69);
      
      // Status Box (Grayscale)
      doc.setFillColor(240, 240, 240);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.rect(115, 73, 80, 8, 'FD');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text("STATUS: FULLY PAID & APPROVED", 119, 78.5);

      // Separator
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(15, 87, 195, 87);

      // 3. Table of Salary Breakdown
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("COMPENSATION DETAILS / FAAHFAAHINTA MISHAARKA", 15, 95);

      // Header row
      const tableTopY = 100;
      doc.setFillColor(245, 245, 245); // Light grey fill
      doc.rect(15, tableTopY, 180, 8, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(15, tableTopY, 195, tableTopY); // Top line
      doc.line(15, tableTopY + 8, 195, tableTopY + 8); // Bottom line

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text("S.No", 18, tableTopY + 5.5);
      doc.text("Description (Faahfaahinta Howsha)", 32, tableTopY + 5.5);
      doc.text("Frequency", 125, tableTopY + 5.5);
      doc.text("Rate / Month", 145, tableTopY + 5.5);
      doc.text("Gross Amount", 172, tableTopY + 5.5);

      // Row 1 (Salary compensation)
      const rowY = tableTopY + 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text("1", 19, rowY);
      doc.text(`Monthly Base Salary Compensation (${sal.month})`, 32, rowY);
      doc.text("1 Month", 127, rowY);
      doc.text(`$${sal.amount.toFixed(2)}`, 145, rowY);
      doc.text(`$${sal.amount.toFixed(2)}`, 172, rowY);

      // Row separator
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.25);
      doc.line(15, rowY + 5, 195, rowY + 5);

      // 4. Totals Block (Grayscale summary)
      const totalsY = rowY + 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Gross Salary Earnings:", 135, totalsY);
      doc.text(`$${sal.amount.toFixed(2)}`, 172, totalsY);

      doc.text("Total Deductions / Taxes:", 135, totalsY + 6);
      doc.text("$0.00", 172, totalsY + 6);

      // Total Paid line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(135, totalsY + 9, 195, totalsY + 9);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(0, 0, 0);
      doc.text("NET SALARY PAID:", 135, totalsY + 14);
      doc.text(`$${sal.amount.toFixed(2)}`, 172, totalsY + 14);

      // Double underline below total
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.line(135, totalsY + 16, 195, totalsY + 16);
      doc.line(135, totalsY + 16.6, 195, totalsY + 16.6);

      // 5. Signature Blocks
      const noteY = totalsY + 30;
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, noteY, 180, 32);

      // Left signature line
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(22, noteY + 18, 95, noteY + 18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text("Teacher's Signature (Macalinka)", 58, noteY + 23, { align: 'center' });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text("I acknowledge receipt of this salary in full.", 58, noteY + 27, { align: 'center' });

      // Right signature line
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(115, noteY + 18, 188, noteY + 18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text("Finance Officer Signature & Stamp", 151, noteY + 23, { align: 'center' });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text("Authorized on behalf of administration.", 151, noteY + 27, { align: 'center' });

      // Footer disclaimer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text("Thank you for your dedication and valuable educational services to our students.", 105, 275, { align: 'center' });

      doc.save(`Salary_Receipt_${sal.teacherName.replace(/\s+/g, '_')}_${sal.month.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Salary PDF receipt generation failed:", err);
      showAlert("Cillad ayaa dhacday intii PDF-ka la samaynayey.", 'error');
    }
  };

  const downloadSalaryReportsPDF = () => {
    try {
      const selectedType = salaryExportType; // 'pending' | 'paid' | 'all'
      
      const filteredList = orgSalaries
        .filter(sal => {
          if (selectedType === 'pending') return sal.status === 'pending';
          if (selectedType === 'paid') return sal.status === 'paid';
          return true; // 'all'
        })
        .filter(sal => sal.teacherName.toLowerCase().includes(salarySearch.toLowerCase()));

      if (filteredList.length === 0) {
        showAlert("Ma jiraan macalimiin ku jira liiska hadda la rabo in la dhoofiyo.", 'info');
        return;
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let pageNumber = 1;
      const totalPagesPlaceholder = "{total_pages}";

      const drawHeaderAndFooter = (page: number) => {
        // Top black thin accent line
        doc.setFillColor(0, 0, 0);
        doc.rect(15, 12, 180, 4, 'F');

        // Academy details
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
doc.text((currentOrg?.name || '').toUpperCase(), 15, 23);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Official Academic Institution • Human Resources & Payroll Office", 15, 27);

        // Report Type (Right aligned)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        let reportTitle = "ALL TEACHER PAYROLL REPORT";
        if (selectedType === 'pending') reportTitle = "PENDING SALARY PAYOUTS REPORT";
        if (selectedType === 'paid') reportTitle = "COMPLETED SALARY PAYOUTS REPORT";
        
        doc.text(reportTitle, 195, 23, { align: 'right' });
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 195, 27, { align: 'right' });

        // Double thin line divider
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.line(15, 31, 195, 31);
        doc.setLineWidth(0.1);
        doc.line(15, 32, 195, 32);

        // Footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text("CONFIDENTIAL - ACADEMIC PAYROLL RECORDS", 15, 285);
        doc.text(`Page ${page} of ${totalPagesPlaceholder}`, 195, 285, { align: 'right' });
      };

      // Draw first page header
      drawHeaderAndFooter(pageNumber);

      // Metadata summary box
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("PAYROLL REPORT SUMMARY:", 15, 39);

      // Draw summary box borders
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.rect(15, 41, 180, 12);
      doc.line(75, 41, 75, 53);
      doc.line(135, 41, 135, 53);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text("Payroll Filter Type:", 18, 45);
      doc.text("Total Teacher Records:", 78, 45);
      doc.text("Total Aggregated Amount:", 138, 45);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text(selectedType.toUpperCase(), 18, 50);
      doc.text(`${filteredList.length} Teachers`, 78, 50);
      
      const totalAmount = filteredList.reduce((sum, s) => sum + s.amount, 0);
      doc.text(`$${totalAmount.toFixed(2)}`, 138, 50);

      // Table Header Row helper
      const drawTableHeader = (y: number) => {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, y, 180, 7, 'F');
        
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.line(15, y, 195, y);
        doc.line(15, y + 7, 195, y + 7);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        
        doc.text("S.No", 17, y + 4.5);
        doc.text("Teacher Name", 27, y + 4.5);
        doc.text("ID / Email", 77, y + 4.5);
        doc.text("Compensation Period", 117, y + 4.5);
        doc.text("Gross Amount", 152, y + 4.5);
        doc.text("Payout Status", 175, y + 4.5);
      };

      let currentY = 62;
      drawTableHeader(currentY);
      currentY += 7;

      // Draw rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      filteredList.forEach((sal, index) => {
        const rowHeight = 7;
        // Check if page overflow
        if (currentY + rowHeight > 270) {
          pageNumber++;
          doc.addPage();
          drawHeaderAndFooter(pageNumber);
          currentY = 40;
          drawTableHeader(currentY);
          currentY += 7;
        }

        const teacherObj = orgTeachers.find(t => t.id === sal.teacherId);
        const sNo = (index + 1).toString();
        const teacherName = sal.teacherName;
        const email = teacherObj?.email || 'N/A';
        const period = sal.month;
        const amountStr = `$${sal.amount.toFixed(2)}`;
        const statusStr = sal.status.toUpperCase();

        // Draw row borders (subtle gray)
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.15);
        doc.line(15, currentY + rowHeight, 195, currentY + rowHeight);

        // Render text
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        doc.text(sNo, 17, currentY + 4.5);
        doc.text(teacherName, 27, currentY + 4.5);
        doc.text(email, 77, currentY + 4.5);
        doc.text(period, 117, currentY + 4.5);
        doc.text(amountStr, 152, currentY + 4.5);
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(statusStr, 175, currentY + 4.5);

        currentY += rowHeight;
      });

      // Table Footer / Grand Total Row
      const footerRowHeight = 8;
      if (currentY + footerRowHeight > 270) {
        pageNumber++;
        doc.addPage();
        drawHeaderAndFooter(pageNumber);
        currentY = 40;
      }

      // Draw bold line for total
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.35);
      doc.line(15, currentY, 195, currentY);
      
      doc.setFillColor(248, 248, 248);
      doc.rect(15, currentY, 180, footerRowHeight, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text("AGGREGATED TOTAL PAYOUT:", 100, currentY + 5.5);
      doc.text(`$${totalAmount.toFixed(2)}`, 152, currentY + 5.5);

      doc.line(15, currentY + footerRowHeight, 195, currentY + footerRowHeight);
      doc.line(15, currentY + footerRowHeight + 0.6, 195, currentY + footerRowHeight + 0.6);

      // Replace total pages placeholder on all pages
      const pagesCount = pageNumber;
      for (let i = 1; i <= pagesCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        // Clear old page string area
        doc.setFillColor(255, 255, 255);
        doc.rect(170, 281, 28, 6, 'F');
        doc.text(`Page ${i} of ${pagesCount}`, 195, 285, { align: 'right' });
      }

      doc.save(`Payroll_Report_${selectedType}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Failed to generate payroll report PDF:", err);
      showAlert("Cillad ayaa dhacday intii la samaynayey PDF-ka.", 'error');
    }
  };

  const sendAttendanceAlert = (student: Student) => {
    const text = encodeURIComponent(
      `Dear Parent, we noticed that your student ${student.fullName} was marked ABSENT today. Please contact us for details.`
    );
    window.open(`https://wa.me/${student.parentPhone}?text=${text}`, '_blank');
  };

  const renderTeacherMyClassesFlow = () => {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        {!teacherActiveSession ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Teacher Dashboard</h2>
              <p className="text-xs text-slate-500 mt-1">Ku soo dhowaad dashboard-ka macalinka.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">Today's Classes</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold">
                  {orgClassSessions.length} Classes
                </span>
              </div>

              {orgClassSessions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm font-medium">
                  Ma jiraan fasallo laguu xilsaaray maanta. (No classes assigned to you today).
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {orgClassSessions.map((cs, idx) => {
                    const sub = allOrgSubjects.find(s => s.id === cs.subjectId);
                    const roomObj = allOrgRooms.find(r => r.id === cs.roomId);
                    const roomName = roomObj ? `Room ${roomObj.roomNumber}` : (cs.roomId || 'Room A');
                    const classStudentCount = allOrgStudents.filter(std =>
                      std.classSessions?.includes(cs.id) || std.subjects?.includes(cs.subjectId)
                    ).length;
                    return (
                      <div key={cs.id} className="py-5 first:pt-0 last:pb-0 flex flex-col justify-between items-start gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-indigo-600 tracking-wider uppercase font-mono">
                            {cs.startTime} - {cs.endTime}
                          </p>
                          <h4 className="text-base font-bold text-slate-900">
                            {sub?.name || cs.subjectId || 'Class Subject'}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            {roomName} &bull; {classStudentCount} ardayda
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setTeacherActiveSession(cs);
                            const initialRecords: Record<string, 'present' | 'absent'> = {};
                            const enrolledStudents = orgStudents.filter(std => 
                              std.classSessions?.includes(cs.id) || 
                              std.subjects?.includes(cs.subjectId)
                            );
                            enrolledStudents.forEach(s => {
                              initialRecords[s.id] = 'present';
                            });
                            setAttRecords(initialRecords);
                          }}
                          className="w-full sm:w-auto px-5 py-2.5 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                        >
                          Take Attendance
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (() => {
          const cs = teacherActiveSession;
          const sub = allOrgSubjects.find(s => s.id === cs.subjectId);
          const roomObj = allOrgRooms.find(r => r.id === cs.roomId);
          const roomName = roomObj ? `Room ${roomObj.roomNumber}` : (cs.roomId || 'Room A');
          const enrolledStudents = allOrgStudents.filter(std => 
            std.classSessions?.includes(cs.id) || 
            std.subjects?.includes(cs.subjectId)
          );

          return (
            <div className="space-y-6">
              <button 
                onClick={() => setTeacherActiveSession(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                ← Back to Today's Classes
              </button>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow space-y-6">
                <div className="space-y-1.5 pb-4 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900">{sub?.name || 'Class Subject'}</h3>
                  <p className="text-sm font-semibold text-slate-700">{cs.startTime} - {cs.endTime}</p>
                  <p className="text-xs text-slate-500 font-semibold">{roomName}</p>
                </div>

                <div className="space-y-4">
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                    {enrolledStudents.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-white">
                        Arday diiwaangashan looma helin fasalkan (No enrolled students found).
                      </div>
                    ) : (
                      enrolledStudents.map(student => {
                        const isPresent = (attRecords[student.id] || 'present') === 'present';
                        return (
                          <div
                            key={student.id}
                            className="p-4 flex items-center justify-between hover:bg-slate-100/50 transition-all bg-white"
                          >
                            <span className="text-sm font-semibold text-slate-900">
                              {student.fullName}
                            </span>
                            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  setAttRecords(prev => ({ ...prev, [student.id]: 'present' }));
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAttRecords(prev => ({ ...prev, [student.id]: 'absent' }));
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${!isPresent ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                              >
                                Absent
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const recordsArray = enrolledStudents.map(s => ({
                        studentId: s.id,
                        fullName: s.fullName,
                        status: attRecords[s.id] || 'present'
                      }));
                      saveAttendance({
                        date: attDate,
                        roomId: cs.roomId || 'rm-unknown',
                        subjectId: cs.subjectId || 'general',
                        sessionId: cs.id,
                        teacherId: matchingTeacher?.id || currentUser?.teacherId || 'teacher',
                        records: recordsArray,
                        organizationId: orgId
                      });
                      setSuccessMessage('Attendance recorded successfully.');
                      setTeacherActiveSession(null);
                    }}
                    className="flex-1 py-3 bg-black hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-sm cursor-pointer text-center"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderTeacherExamFlow = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Submit Exam Marks</h2>
              <p className="text-sm text-slate-500 mt-1">Select a class and exam to enter grades</p>
            </div>
            {examTeacherSessionId && (
              <button 
                onClick={() => setExamTeacherSessionId(null)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold transition-colors border border-slate-200 w-fit"
              >
                ← Back to Classes
              </button>
            )}
          </div>
        </div>

        {!examTeacherSessionId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orgClassSessions.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">Ma jiraan fasallo laguu xilsaaray (No classes assigned to you).</p>
              </div>
            ) : (
              orgClassSessions.map((cs) => {
                const sub = allOrgSubjects.find(s => s.id === cs.subjectId);
                const roomObj = allOrgRooms.find(r => r.id === cs.roomId);
                const roomName = roomObj ? `Room ${roomObj.roomNumber}` : (cs.roomId || 'Room A');
                const studentCount = allOrgStudents.filter(s => s.classSessions?.includes(cs.id)).length;

                return (
                  <div 
                    key={cs.id} 
                    onClick={() => setExamTeacherSessionId(cs.id)}
                    className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow hover:border-indigo-500 hover:ring-2 hover:ring-indigo-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold font-mono border border-indigo-100">
                        {cs.startTime} - {cs.endTime}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                        <Users size={14} /> {studentCount}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{sub?.name || cs.subjectId}</h4>
                    <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                      <BookOpen size={14} /> {roomName}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {(() => {
              const cs = orgClassSessions.find(c => c.id === examTeacherSessionId);
              if (!cs) return null;
              
              const classExams = orgExams.filter(e => e.sessionId === cs.id || e.type === 'school');

              return (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Available Exams for this Class</h3>
                  
                  {classExams.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-medium bg-slate-50 rounded-xl">
                      Ma jiraan imtixaano loo qorsheeyay fasalkan.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {classExams.map(ex => (
                        <div key={ex.id} className="p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-slate-900 text-base">{ex.title}</h4>
                              <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                ex.type === 'school' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {ex.type === 'school' ? 'School Exam' : 'Subject Exam'}
                              </span>
                            </div>
                            {ex.published && (
                              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-md">
                                <Check size={12} /> Published
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                setSelectedExam(ex);
                                const defaults: any = {};
                                const classStudents = allOrgStudents.filter(s => s.classSessions?.includes(cs.id));
                                classStudents.forEach(s => {
                                  defaults[s.id] = 0; 
                                });
                                setMarksData(defaults);
                                setActiveModal('enterMarks');
                              }}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm flex justify-center items-center gap-2"
                            >
                              <Edit2 size={16} /> Enter Marks
                            </button>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  setSelectedExam(ex);
                                  if (marksFileInputRef.current) marksFileInputRef.current.click();
                                }}
                                className="bg-white hover:bg-emerald-50 text-emerald-700 font-bold py-2 rounded-xl text-xs transition-colors border border-emerald-200 flex justify-center items-center gap-1.5 shadow-sm"
                              >
                                <Upload size={14} /> Upload Excel
                              </button>
                              <button
                                onClick={() => handleDownloadTemplate(ex, cs.id)}
                                className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-xl text-xs transition-colors border border-slate-200 flex justify-center items-center gap-1.5 shadow-sm"
                              >
                                <Download size={14} /> Template
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  // --- Main Render ---
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#fcfcfd] pb-20 md:pb-8">
        <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-30 card-shadow text-slate-900">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="animate-pulse flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-200 rounded-xl"></div>
              <div>
                <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                <div className="h-2.5 bg-slate-100 rounded w-24"></div>
              </div>
            </div>
            <div className="animate-pulse flex gap-2">
              <div className="h-8 bg-slate-100 rounded-lg w-20"></div>
              <div className="h-8 bg-slate-200 rounded-lg w-20"></div>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto w-full px-4 mt-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="hidden lg:block lg:col-span-3 bg-white p-4 rounded-2xl border border-gray-100 card-shadow h-[600px]">
            <div className="animate-pulse space-y-3">
              <div className="h-2.5 bg-slate-200 rounded w-1/2 mb-5"></div>
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-xl w-full"></div>
              ))}
            </div>
          </aside>
          <main className="lg:col-span-9 bg-white rounded-2xl border border-gray-100 card-shadow p-6 min-h-[600px]">
            <div className="animate-pulse space-y-6">
              <div className="flex justify-between items-center">
                <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                <div className="h-10 bg-slate-200 rounded-xl w-32"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>
                ))}
              </div>
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl w-full"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfd] pb-20 md:pb-8">
      {/* Upper Navigation Header */}
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-30 card-shadow text-slate-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {currentOrg?.logoUrl ? (
              <img src={currentOrg.logoUrl} alt={currentOrg.name} referrerPolicy="no-referrer" className="w-9 h-9 object-cover rounded-xl border border-slate-100 shadow-xs shrink-0" />
            ) : (
              <div className="w-9 h-9 bg-black text-white rounded-xl flex items-center justify-center shrink-0">
                <School size={18} />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-sans font-bold tracking-tight text-slate-900 truncate">{currentOrg?.name || 'Smart Management System'}</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate">
                {isQuranSchool ? `Quran Center Console ${quranModeWithoutTeachers ? '(No Teachers Mode)' : '(Standard Mode)'}` : 'School Admin Console'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher />
            {currentUser?.role === 'superadmin' && (
              <button onClick={() => { selectActiveOrg(null); navigate('/superadmin'); }} className="hidden md:flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold shrink-0">
                ← Super Admin
              </button>
            )}
            {!isTeacher && (
              <button onClick={() => navigate('/portal/settings')} className="hidden md:flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                <Settings size={14} /> Settings
              </button>
            )}
            <button onClick={logout} className="hidden md:block bg-black hover:bg-slate-800 text-xs text-white font-semibold px-3 py-1.5 rounded-lg border border-transparent cursor-pointer transition-colors shadow-sm">
              Log Out
            </button>
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden flex items-center gap-1.5 bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Menu
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-4 mt-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar (Desktop Only) */}
        <aside className="hidden lg:block lg:col-span-3 bg-white p-4 rounded-2xl border border-gray-100 card-shadow h-fit space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            {isTeacher ? t('header.schoolAdmin') : 'Management Modules'}
          </p>
          {hasPermission('Dashboard') && (
            <NavLink 
              to="/portal/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isActive ? 'active-nav' : 'text-slate-600 hover:bg-slate-50 sidebar-item'}`}
            >
              <LayoutDashboard size={18} /> {t('sidebar.dashboard')}
            </NavLink>
          )}
              {hasPermission('Students') && (
                <NavLink 
                  to="/portal/students"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isActive || location.pathname.includes('/portal/students/') ? 'active-nav' : 'text-slate-600 hover:bg-slate-50 sidebar-item'}`}
                >
                  <GraduationCap size={18} /> {t('sidebar.students')} ({totalStudents})
                </NavLink>
              )}
              {hasPermission('Teachers') && !quranModeWithoutTeachers && (
                <NavLink 
                  to="/portal/teachers"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isActive || location.pathname.includes('/portal/teachers/') ? 'active-nav' : 'text-slate-600 hover:bg-slate-50 sidebar-item'}`}
                >
                  <Users size={18} /> {t('sidebar.teachers')} ({totalTeachers})
                </NavLink>
              )}
              {hasPermission('School Settings') && (
                <>
                  {!isQuranSchool && (
                    <>
                      <NavLink 
                        to="/portal/subjects"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) => `w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isActive || location.pathname.includes('/portal/subjects/') ? 'active-nav' : 'text-slate-600 hover:bg-slate-50 sidebar-item'}`}
                      >
                        <BookOpen size={18} /> {t('sidebar.subjects')} ({totalSubjects})
                      </NavLink>
                      <NavLink 
                        to="/portal/class-sessions"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) => `w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isActive || location.pathname.includes('/portal/class-sessions/') ? 'active-nav' : 'text-slate-600 hover:bg-slate-50 sidebar-item'}`}
                      >
                        <Clock size={18} /> {t('sidebar.classes')} ({orgClassSessions.length})
                      </NavLink>
                    </>
                  )}
                  <NavLink 
                    to="/portal/rooms"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) => `w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isActive ? 'active-nav' : 'text-slate-600 hover:bg-slate-50 sidebar-item'}`}
                  >
                    <School size={18} /> {t('sidebar.classes')}
                  </NavLink>
                </>
              )}
              {hasPermission('Attendance') && (
                <NavLink 
                  to="/portal/attendance"
                  onClick={() => { setAttendanceSubTab('take'); setIsMobileMenuOpen(false); }}
                  className={({ isActive }) => `w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isActive ? 'active-nav' : 'text-slate-600 hover:bg-slate-50 sidebar-item'}`}
                >
                  <Calendar size={18} /> {t('sidebar.attendance')}
                </NavLink>
              )}
              {hasPermission('Fees') && (
                <NavLink 
                  to="/portal/fees"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isActive ? 'active-nav' : 'text-slate-600 hover:bg-slate-50 sidebar-item'}`}
                >
                  <DollarSign size={18} /> {t('sidebar.fees')}
                </NavLink>
              )}
              {hasPermission('Teacher Salary') && !quranModeWithoutTeachers && (
                <NavLink 
                  to="/portal/salaries"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isActive ? 'active-nav' : 'text-slate-600 hover:bg-slate-50 sidebar-item'}`}
                >
                  <DollarSign size={18} /> {t('sidebar.salary')}
                </NavLink>
              )}
              {hasPermission('Exams') && !isQuranSchool && (
                <NavLink 
                  to="/portal/exams"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isActive ? 'active-nav' : 'text-slate-600 hover:bg-slate-50 sidebar-item'}`}
                >
                  <Award size={18} /> {t('sidebar.exams')}
                </NavLink>
              )}

              {(hasPermission('Print Reports') || hasPermission('View Financial Reports')) && (
                <NavLink 
                  to="/portal/reports"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isActive ? 'active-nav' : 'text-slate-600 hover:bg-slate-50 sidebar-item'}`}
                >
                  <CheckCircle2 size={18} /> {t('sidebar.reports')}
                </NavLink>
              )}
              {hasPermission('User Management') && (
                <NavLink 
                  to="/portal/staff"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isActive ? 'active-nav' : 'text-slate-600 hover:bg-slate-50 sidebar-item'}`}
                >
                  <Users size={18} /> {t('sidebar.staff')}
                </NavLink>
              )}
              {hasPermission('School Settings') && (
                <NavLink 
                  to="/portal/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isActive ? 'active-nav' : 'text-slate-600 hover:bg-slate-50 sidebar-item'}`}
                >
                  <Settings size={18} /> {t('sidebar.settings')}
                </NavLink>
              )}
        </aside>

        {/* Center Panel Content */}
        <main className="col-span-1 lg:col-span-9 space-y-6">
          {isStudentDetail ? (
            <StudentDetail />
          ) : isTeacherDetail ? (
            <TeacherDetail />
          ) : isSubjectDetail ? (
            <SubjectDetail />
          ) : (
            <>
              {/* Tab 1: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {isTeacher ? (
                    renderTeacherMyClassesFlow()
                  ) : (
                    <div className="space-y-6">
                      {/* Dashboard metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-2xl shadow-[0_8px_30px_-4px_rgba(99,102,241,0.4)] text-white border border-indigo-400">
                          <span className="text-white opacity-90"><Users size={20} /></span>
                          <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-2">{t('dashboard.totalStudents')}</p>
                          <p className="text-3xl font-bold mt-1 text-white">{totalStudents}</p>
                        </div>

                        {!quranModeWithoutTeachers && (
                          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl shadow-[0_8px_30px_-4px_rgba(59,130,246,0.4)] text-white border border-blue-400">
                            <span className="text-white opacity-90"><GraduationCap size={20} /></span>
                            <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-2">{t('dashboard.totalTeachers')}</p>
                            <p className="text-3xl font-bold mt-1 text-white">{totalTeachers}</p>
                          </div>
                        )}

                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl shadow-[0_8px_30px_-4px_rgba(16,185,129,0.4)] text-white border border-emerald-400">
                          <span className="text-white opacity-90"><DollarSign size={20} /></span>
                          <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-2">{t('fees.paid')}</p>
                          <p className="text-3xl font-bold mt-1 text-white">${collectedFees}</p>
                        </div>

                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-5 rounded-2xl shadow-[0_8px_30px_-4px_rgba(245,158,11,0.4)] text-white border border-amber-400">
                          <span className="text-white opacity-90"><DollarSign size={20} /></span>
                          <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-2">{t('fees.pending')}</p>
                          <p className="text-3xl font-bold mt-1 text-white">${pendingFees}</p>
                        </div>
                      </div>

                      {/* Quick Action Drawer Grid */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Quick Actions</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <button 
                            onClick={() => {
                              setSelectedStudent(null);
                              setStudentForm({ fullName: '', studentPhone: '', parentPhone: '', address: '', gender: 'male', dob: '', fee: 50, subjects: [], classSessions: [] });
                              setFormError(null);
                              setActiveModal('addStudent');
                            }}
                            className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-200/60 transition-all flex flex-col items-start gap-1 cursor-pointer"
                          >
                            <Plus size={18} className="text-slate-900" />
                            <span className="text-xs font-bold text-slate-800">Add Student</span>
                          </button>
                          {!quranModeWithoutTeachers && (
                            <button 
                              onClick={() => {
                                setTeacherForm({ fullName: '', email: '', phone: '', salary: 400, subjects: [], rooms: [], password: '', address: '' });
                                setActiveModal('addTeacher');
                              }}
                              className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-200/60 transition-all flex flex-col items-start gap-1 cursor-pointer"
                            >
                              <Plus size={18} className="text-slate-900" />
                              <span className="text-xs font-bold text-slate-800">Add Teacher</span>
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setSubjectForm({ name: '', teacherId: '', roomId: '', startTime: '08:00', endTime: '09:30', capacity: 30, days: [] as string[] });
                              setActiveModal('addSubject');
                            }}
                            className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-200/60 transition-all flex flex-col items-start gap-1 cursor-pointer"
                          >
                            <Plus size={18} className="text-slate-900" />
                            <span className="text-xs font-bold text-slate-800">New Subject</span>
                          </button>
                          <button 
                            onClick={() => setActiveTab('attendance')}
                            className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-200/60 transition-all flex flex-col items-start gap-1 cursor-pointer"
                          >
                            <CheckCircle2 size={18} className="text-slate-900" />
                            <span className="text-xs font-bold text-slate-800">Take Attendance</span>
                          </button>
                        </div>
                      </div>

                      {/* Attendance & Exams Summary list */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Recent Attendance */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Activity</h3>
                            <span className="text-xs font-bold text-slate-900">{attendancePercentage}% Present Today</span>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {todayAttendance.length === 0 ? (
                              <p className="text-xs text-slate-400 py-4">No attendance marked today.</p>
                            ) : (
                              todayAttendance.slice(0, 5).map(att => {
                                const sub = orgSubjects.find(s => s.id === att.subjectId);
                                const present = att.records.filter(r => r.status === 'present').length;
                                return (
                                  <div 
                                    key={att.id} 
                                    onClick={() => {
                                      setActiveTab('attendance');
                                      setAttendanceSubTab('take');
                                      setAttDate(att.date);
                                      setAttSubjectId(att.subjectId);
                                      setAttSessionId(att.sessionId || '');
                                    }}
                                    className="py-2.5 px-2 -mx-2 flex items-center justify-between rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                                  >
                                    <div>
                                      <p className="text-xs font-bold text-slate-800">{sub?.name || 'Class Session'}</p>
                                      <p className="text-[10px] text-slate-400">{att.date}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-xs font-semibold text-slate-600">
                                        {present} / {att.records.length} Present
                                      </span>
                                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded mt-0.5 shadow-sm">
                                        Xaadirin La Qaaday
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Upcoming Exams list */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow space-y-4">
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Exams</h3>
                          <div className="divide-y divide-slate-100">
                            {orgExams.length === 0 ? (
                              <p className="text-xs text-slate-400 py-4">No exams scheduled.</p>
                            ) : (
                              orgExams.map(ex => (
                                <div key={ex.id} className="py-2.5 flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{ex.title}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {ex.type === 'school' 
                                        ? 'Whole School • All Rooms' 
                                        : `${orgSubjects.find(s => s.id === ex.subjectId)?.name || 'Subject'} • Room ${ex.targetClass}`}
                                    </p>
                                  </div>
                                  <span className={`status-badge ${
                                    ex.published ? 'bg-success' : 'bg-warning'
                                  }`}>
                                    {ex.published ? 'Published' : 'Pending'}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

          {/* Tab 2: STUDENTS */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Registered Students</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentForm({ fullName: '', studentPhone: '', parentPhone: '', address: '', gender: 'male', dob: '', fee: 50, subjects: [], classSessions: [] });
                      setFormError(null);
                      setActiveModal('addStudent');
                    }}
                    className="flex items-center gap-1.5 bg-black hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus size={16} /> Register Student
                  </button>
                  <button 
                    onClick={() => setActiveModal('invoice')} // Show Bulk Import trigger
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <Upload size={16} /> {t('common.upload')}
                  </button>
                </div>
              </div>

              {/* Student Filtering Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-100 card-shadow">
                {/* Search query input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder={t('students.searchPlaceholder')}
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black font-medium transition-colors"
                  />
                  {studentSearchQuery && (
                    <button
                      onClick={() => setStudentSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Filter by Room dropdown */}
                <div>
                  <select
                    value={studentFilterRoomId}
                    onChange={(e) => setStudentFilterRoomId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black font-medium text-slate-700 transition-colors"
                  >
                    <option value="">All Rooms</option>
                    {orgRooms.map(room => (
                      <option key={room.id} value={room.id}>
                        Qolka: {room.roomNumber} ({room.building})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter by Subject / Time Slot dropdown */}
                <div>
                  <select
                    value={studentFilterSubjectId}
                    onChange={(e) => setStudentFilterSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black font-medium text-slate-700 transition-colors"
                  >
                    <option value="">Dhamaan Maaddooyinka & Saacadaha</option>
                    {orgSubjects.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.startTime} - {sub.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table / Responsive Card View */}
              <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-[#fcfcfd] border-b border-gray-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                        <th className="p-4">Student Name & ID</th>
                        <th className="p-4">Contact Info</th>
                        <th className="p-4">{isQuranSchool ? 'Assigned Room' : 'Assigned Schedule & Room'}</th>
                        <th className="p-4">Monthly Fee</th>
                        {!isTeacher && <th className="p-4 text-right">{t('common.action')}</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orgStudents.length === 0 ? (
                        <tr>
                          <td colSpan={isTeacher ? 4 : 5} className="text-center py-12 text-slate-400">
                            No students registered.
                          </td>
                        </tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={isTeacher ? 4 : 5} className="text-center py-12 text-slate-400">
                            Ma jiraan arday buuxisay shuruudaha raadinta aad dooratay.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map(student => (
                          <tr key={student.id} className="hover:bg-slate-50/50">
                            <td className="p-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                                  {(student.fullName || '').substring(0, 2)}
                                </div>
                                <div>
                                  <Link to={`/portal/students/${student.id}`} className="font-semibold text-slate-900 hover:text-indigo-600 hover:underline transition-colors">
                                    {student.fullName}
                                  </Link>
                                  <p className="text-[10px] font-bold text-slate-500">{student.studentId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-xs text-slate-500">
                              <p>Student: {student.studentPhone || 'N/A'}</p>
                              <p>Parent: {student.parentPhone || 'N/A'}</p>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {(() => {
                                  if (isQuranSchool) {
                                    return (
                                      <span className="text-slate-700 text-xs font-semibold">
                                        {student.roomId ? (orgRooms.find(r => r.id === student.roomId)?.roomNumber || 'Unknown Room') : 'No Room Assigned'}
                                      </span>
                                    );
                                  }
                                  if (student.classSessions && student.classSessions.length > 0) {
                                    return student.classSessions.map(csId => {
                                      const cs = allOrgClassSessions.find(c => c.id === csId);
                                      if (!cs) return null;
                                      const sub = orgSubjects.find(s => s.id === cs.subjectId);
                                      const rm = orgRooms.find(r => r.id === cs.roomId);
                                      return (
                                        <span key={csId} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-lg font-medium">
                                          {sub?.name || cs.classCode} ({rm ? rm.roomNumber : 'No Room'} @ {cs.startTime}-{cs.endTime})
                                        </span>
                                      );
                                    });
                                  }
                                  if (student.subjects.length === 0) {
                                    return <span className="text-slate-400 text-xs">No subjects assigned</span>;
                                  }
                                  return student.subjects.map(subId => {
                                    const sub = orgSubjects.find(s => s.id === subId);
                                    const rm = sub ? orgRooms.find(r => r.id === sub.roomId) : null;
                                    if (!sub) return null;
                                    return (
                                      <span key={subId} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-lg font-medium">
                                        {sub.name} ({rm ? rm.roomNumber : 'No Room'} @ {sub.startTime}-{sub.endTime})
                                      </span>
                                    );
                                  });
                                })()}
                              </div>
                            </td>
                            <td className="p-4 font-bold text-slate-800">
                              ${student.fee}/mo
                            </td>
                            {!isTeacher && (
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                 <button 
                                   onClick={() => {
                                     setSelectedStudent(student);
                                     setStudentForm({
                                       fullName: student.fullName,
                                       studentPhone: student.studentPhone || '',
                                       parentPhone: student.parentPhone || '',
                                       address: student.address || '',
                                       gender: student.gender,
                                       dob: student.dob || '',
                                       fee: student.fee,
                                       subjects: student.subjects,
                                       classSessions: student.classSessions || [],
                                       roomId: student.roomId || ''
                                     });
                                     setActiveModal('addStudent');
                                   }}
                                   className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-black rounded-lg cursor-pointer transition-colors"
                                   title="Bedel ardayga"
                                 >
                                   <Edit2 size={15} />
                                 </button>
                                 <button 
                                   onClick={() => deleteStudent(student.id)}
                                   className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                                   title="Tirtir ardayga"
                                 >
                                   <Trash2 size={15} />
                                 </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: TEACHERS */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Instructors / Teachers</h2>
                <button 
                  onClick={() => {
                    setSelectedTeacher(null);
                    setFormError(null);
                    setTeacherForm({ fullName: '', email: '', phone: '', salary: 400, subjects: [], rooms: [], password: '', address: '' });
                    setActiveModal('addTeacher');
                  }}
                  className="flex items-center gap-1.5 bg-black hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  <Plus size={16} /> New Teacher
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-[#fcfcfd] border-b border-gray-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                        <th className="p-4">Teacher Name</th>
                        <th className="p-4">Email / Phone</th>
                        <th className="p-4">Password</th>
                        <th className="p-4">Monthly Salary</th>
                        <th className="p-4 text-right">{t('common.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orgTeachers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-slate-400">
                            No teachers registered.
                          </td>
                        </tr>
                      ) : (
                        orgTeachers.map(teacher => (
                          <tr key={teacher.id} className="hover:bg-slate-50/50">
                            <td className="p-4 font-semibold text-slate-900"><Link to={`/portal/teachers/${teacher.id}`} className="hover:text-indigo-600 hover:underline transition-colors">{teacher.fullName}</Link></td>
                            <td className="p-4 text-xs text-slate-500">
                              <p>{teacher.email}</p>
                              <p>{teacher.phone}</p>
                            </td>
                            <td className="p-4 text-xs font-mono font-semibold text-slate-700 bg-slate-50/50 rounded-lg px-2 py-1">
                              {teacher.password || '123456'}
                            </td>
                            <td className="p-4 font-bold text-slate-900">${teacher.salary}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button 
                                  onClick={() => {
                                    setSelectedTeacher(teacher);
                                    setFormError(null);
                                    setTeacherForm({
                                      fullName: teacher.fullName,
                                      email: teacher.email,
                                      phone: teacher.phone,
                                      salary: teacher.salary,
                                      subjects: teacher.subjects || [],
                                      rooms: teacher.rooms || [],
                                      password: teacher.password || '',
                                      address: teacher.address || ''
                                    });
                                    setActiveModal('addTeacher');
                                  }}
                                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-black rounded-lg cursor-pointer transition-colors"
                                  title="Bedel macallinka"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button 
                                  onClick={() => deleteTeacher(teacher.id)}
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                                  title="Tirtir macallinka"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: SUBJECTS */}
          {activeTab === 'subjects' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Academic Subjects</h2>
                <button 
                  onClick={() => {
                    setSelectedSubject(null);
                    setFormError(null);
                    setSubjectForm({ name: '', teacherId: '', roomId: '', startTime: '08:00', endTime: '09:30', capacity: 30, days: [] as string[] });
                    setActiveModal('addSubject');
                  }}
                  className="flex items-center gap-1.5 bg-black hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  <Plus size={16} /> Create Subject
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                     <thead>
                       <tr className="bg-[#fcfcfd] border-b border-gray-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                         <th className="p-4">Magaca Maaddada</th>
                         <th className="p-4">Capacity</th>
                         <th className="p-4 text-right">{t('common.action')}</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {orgSubjects.length === 0 ? (
                         <tr>
                           <td colSpan={3} className="text-center py-12 text-slate-400">
                             <div className="flex flex-col items-center gap-2">
                               <BookOpen size={32} className="text-slate-200" />
                               <p className="text-xs font-semibold">Wali maaddo la ma aburin. Guji &quot;Create Subject&quot;.</p>
                             </div>
                           </td>
                         </tr>
                       ) : (
                         orgSubjects.map(sub => {
                           return (
                             <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="p-4">
                                 <div className="flex items-center gap-3 min-w-0">
                                   <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                     <BookOpen size={14} />
                                   </div>
                                   <span className="font-bold text-slate-800">{sub.name}</span>
                                 </div>
                               </td>
                               <td className="p-4 text-slate-600 font-semibold">{sub.capacity ?? 30} Arday</td>
                               <td className="p-4 text-right">
                                 <div className="flex items-center justify-end gap-1">
                                   <button 
                                     onClick={() => {
                                       setSelectedSubject(sub);
                                       setFormError(null);
                                       setSubjectForm({
                                         name: sub.name,
                                         teacherId: sub.teacherId || '',
                                         roomId: sub.roomId || '',
                                         startTime: sub.startTime || '08:00',
                                         endTime: sub.endTime || '09:30',
                                         capacity: sub.capacity || 30,
                                         days: sub.days || [],
                                       });
                                       setActiveModal('addSubject');
                                     }}
                                     className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-black rounded-lg cursor-pointer transition-colors"
                                     title="Bedel maaddada"
                                   >
                                     <Edit2 size={15} />
                                   </button>
                                   <button 
                                     onClick={async () => {
                                       if (await showConfirm('Ma hubtaa inaad tirtirto maaddadan?')) {
                                         deleteSubject(sub.id);
                                         setSuccessMessage('Maaddada waa la tirtiray.');
                                       }
                                     }}
                                     className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                                     title="Tirtir maaddada"
                                   >
                                     <Trash2 size={15} />
                                   </button>
                                 </div>
                               </td>
                             </tr>
                           );
                         })
                       )}
                     </tbody>
                   </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4.5: CLASS SESSIONS */}
          {activeTab === 'class-sessions' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Jadwalka Fasalada (Class Sessions Schedule)</h2>
                  <p className="text-xs text-slate-500 mt-1">Create class sessions with unique codes (e.g. EL26), ku xir maaddo, macallin, iyo qol gaar ah.</p>
                </div>
                {!isTeacher && (
                  <button 
                    onClick={() => {
                      setSelectedClassSession(null);
                      setClassSessionForm({
                        classCode: '',
                        subjectId: '',
                        teacherId: '',
                        roomId: '',
                        startTime: '13:00',
                        endTime: '14:00',
                        days: [],
                        capacity: 30,
                        status: 'active'
                      });
                      setFormError(null);
                      setActiveModal('addClassSession');
                    }}
                    className="flex items-center gap-1.5 bg-black hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus size={15} /> New Class Session
                  </button>
                )}
              </div>

              {/* Grid of sessions */}
              {orgClassSessions.length === 0 ? (
                <div className="p-16 text-center bg-white rounded-3xl border border-gray-100 card-shadow">
                  <Clock size={40} className="mx-auto text-slate-300 mb-3 animate-pulse" />
                  <p className="text-sm font-bold text-slate-700">Ma qaabayn wax Class Sessions ah hadda (No class sessions created yet).</p>
                  <p className="text-xs text-slate-400 mt-1">Guji "New Class Session" si aad u abuurto.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {orgClassSessions.map(cs => {
                    const sub = allOrgSubjects.find(s => s.id === cs.subjectId);
                    const rm = allOrgRooms.find(r => r.id === cs.roomId);
                    const teacher = allOrgTeachers.find(t => t.id === cs.teacherId);
                    const enrolledCount = allOrgStudents.filter(std => 
                      std.classSessions?.includes(cs.id) || 
                      ((!std.classSessions || std.classSessions.length === 0) && std.subjects.includes(cs.subjectId))
                    ).length;
                    const percentFilled = Math.min(100, Math.round((enrolledCount / (cs.capacity || 30)) * 100));

                    return (
                      <div key={cs.id} className="bg-white border border-slate-100 p-5 rounded-3xl card-shadow flex flex-col justify-between space-y-4 hover:border-black/10 hover:shadow-md transition-all relative overflow-hidden group">
                        {/* Status tag */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${cs.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${cs.status === 'active' ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {cs.status}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-wider font-mono">
                              {cs.classCode}
                            </span>
                            <h3 className="text-base font-bold text-slate-900 mt-2.5 leading-tight">{sub?.name || 'Maaddo kale'}</h3>
                          </div>

                          <div className="space-y-2 text-xs text-slate-500">
                            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                              <User size={14} className="text-slate-400 shrink-0" />
                              <span className="truncate">Instructor: <strong className="text-slate-700">{teacher ? teacher.fullName : 'No Instructor'}</strong></span>
                            </div>
                            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                              <School size={14} className="text-slate-400 shrink-0" />
                              <span>Room: <strong className="text-slate-700">{rm ? `${rm.roomNumber} (${rm.building})` : 'Virtual/None'}</strong></span>
                            </div>
                            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                              <Clock size={14} className="text-slate-400 shrink-0" />
                              <span>Time: <strong className="text-slate-700">{cs.startTime} - {cs.endTime}</strong></span>
                            </div>
                            <div className="pt-1.5 flex flex-wrap gap-1">
                              {cs.days.map(d => (
                                <span key={d} className="text-[9px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md uppercase tracking-wide">
                                  {d.slice(0, 3)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-50">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                            <span>CAPACITY UTILIZATION</span>
                            <span className="text-slate-700">{enrolledCount} / {cs.capacity} Students ({percentFilled}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${percentFilled >= 100 ? 'bg-red-500' : percentFilled >= 80 ? 'bg-amber-500' : 'bg-indigo-600'}`} 
                              style={{ width: `${percentFilled}%` }} 
                            />
                          </div>
                        </div>

                        {/* Edit / Delete / Take Attendance actions */}
                        {!isTeacher && (
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                            <button
                              onClick={() => {
                                setAttSessionId(cs.id);
                                setAttSubjectId(cs.subjectId);
                                setAttRoomId(cs.roomId);
                                setActiveTab('attendance');
                                setAttendanceSubTab('take');
                              }}
                              className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200/50 text-center cursor-pointer"
                            >
                              Attendance
                            </button>
                            <button
                              onClick={() => {
                                setSelectedClassSession(cs);
                                setClassSessionForm({
                                  classCode: cs.classCode,
                                  subjectId: cs.subjectId,
                                  teacherId: cs.teacherId,
                                  roomId: cs.roomId,
                                  startTime: cs.startTime,
                                  endTime: cs.endTime,
                                  days: cs.days,
                                  capacity: cs.capacity || 30,
                                  status: cs.status || 'active'
                                });
                                setFormError(null);
                                setActiveModal('addClassSession');
                              }}
                              className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer transition-colors"
                              title="Wax ka bedel"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={async () => {
                          if (await showConfirm('Ma hubtaa inaad tirtirto Class Session-kan?')) {
                                  deleteClassSession(cs.id);
                                  setSuccessMessage('Class Session deleted successfully.');
                                }
                              }}
                              className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl cursor-pointer transition-colors"
                              title="Tirtir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: CLASS ROOMS */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Physical Rooms</h2>
                <button 
                  onClick={() => {
                    setSelectedRoom(null);
                    setRoomForm({ roomNumber: '', capacity: 25, building: 'Main Hall', status: 'available' });
                    setActiveModal('addRoom');
                  }}
                  className="flex items-center gap-1.5 bg-black hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  <Plus size={16} /> New Room
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {orgRooms.map(rm => (
                  <div key={rm.id} className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow relative group">
                    <h3 className="text-lg font-bold text-slate-950 pr-16">{rm.roomNumber}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{rm.building}</p>
                    
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setSelectedRoom(rm);
                          setRoomForm({
                            roomNumber: rm.roomNumber,
                            capacity: rm.capacity,
                            building: rm.building,
                            status: rm.status
                          });
                          setActiveModal('addRoom');
                        }}
                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-black rounded-lg cursor-pointer transition-colors"
                        title="Wax ka bedel Qolka (Edit Room)"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={async () => {
                          if (await showConfirm('Ma hubaal inaad rabto inaad tirtirto qolkan? (Are you sure you want to delete this room?)')) {
                            deleteRoom(rm.id);
                            setSuccessMessage('Qolka waa la tirtiray (Room deleted successfully).');
                          }
                        }}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                        title="Tirtir Qolka (Delete Room)"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xs font-semibold text-slate-500">Max Cap: {rm.capacity} students</span>
                      <span className={`status-badge ${
                        rm.status === 'available' ? 'bg-success' :
                        rm.status === 'occupied' ? 'bg-warning' : 'bg-danger'
                      }`}>
                        {rm.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Tab 6: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {/* Header with pill-shaped sub-nav tab switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-xl"><Calendar size={20} /></span>
                    Maareynta Maqnaanshaha (Attendance & Absentee)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Diiwaangeli xaadirinta maalin laha ah, eeg ardayda maqan ama xiriirka u maqan.</p>
                </div>

                {/* Sub-tabs: TAKE | ABSENTEE | RECORDS */}
                {!isTeacher && (
                  <div className="flex items-center bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 self-start sm:self-auto shadow-inner">
                    <button
                      onClick={() => setAttendanceSubTab('take')}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        attendanceSubTab === 'take' 
                          ? 'bg-white text-indigo-950 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      TAKE
                    </button>
                    <button
                      onClick={() => setAttendanceSubTab('absentee')}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        attendanceSubTab === 'absentee' 
                          ? 'bg-white text-indigo-950 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ABSENTEE
                    </button>
                    <button
                      onClick={() => setAttendanceSubTab('records')}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        attendanceSubTab === 'records' 
                          ? 'bg-white text-indigo-950 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      RECORDS
                    </button>
                    <button
                      onClick={() => setAttendanceSubTab('history')}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        attendanceSubTab === 'history' 
                          ? 'bg-white text-indigo-950 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      HISTORY
                    </button>
                  </div>
                )}
              </div>

              {/* Render SUB-TAB: TAKE ATTENDANCE */}
              {(attendanceSubTab === 'take' || isTeacher) && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow space-y-4">
                  {isTeacher ? (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Dooro Xiisadda iyo Qolka aad Xaajirineyso (Select Class & Room)</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Fadlan guji qolka/maadada aad rabto inaad hadda ka qaado xaadirinta.</p>
                        </div>
                        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                          <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Date:</label>
                          <input 
                            type="date" 
                            value={attDate} 
                            onChange={(e) => setAttDate(e.target.value)}
                            className="p-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-black" 
                          />
                        </div>
                      </div>

                      {orgClassSessions.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
                          <p className="text-sm">Ma jiraan Class Sessions laguu xilsaaray hadda.</p>
                          <p className="text-xs text-slate-400 mt-1">La xiriir maamulka dugsiga si laguu qoro casharrada.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {orgClassSessions.map((cs) => {
                            const sub = allOrgSubjects.find(s => s.id === cs.subjectId);
                            const roomObj = allOrgRooms.find(r => r.id === cs.roomId);
                            const studentCount = allOrgStudents.filter(std => 
                              std.classSessions?.includes(cs.id)
                            ).length;
                            const isSelected = attSessionId === cs.id;

                            return (
                              <button
                                key={cs.id}
                                type="button"
                                onClick={() => {
                                  setAttSessionId(cs.id);
                                  setAttSubjectId(cs.subjectId);
                                  setAttRoomId(cs.roomId);
                                  setAttSaved(false);
                                }}
                                className={`text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-full relative overflow-hidden group ${
                                  isSelected 
                                    ? 'bg-indigo-950 border-indigo-950 text-white shadow-md' 
                                    : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 text-slate-800'
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500 rounded-bl-xl flex items-center justify-center text-white">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                                <div className="space-y-3 w-full">
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-md ${
                                          isSelected ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-50 text-indigo-700 font-semibold'
                                        }`}>
                                          {cs.classCode}
                                        </span>
                                        <span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-md ${
                                          isSelected ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                          {cs.startTime} - {cs.endTime}
                                        </span>
                                      </div>
                                      <h4 className="font-bold text-base leading-tight mt-1">{sub?.name || 'Maaddo'}</h4>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5 pt-1">
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className={isSelected ? 'text-indigo-200' : 'text-slate-400 font-medium'}>Room:</span>
                                      <span className="font-bold">{roomObj?.roomNumber || 'N/A'}</span>
                                      {roomObj?.building && (
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-indigo-900 text-indigo-300' : 'bg-slate-100 text-slate-500'}`}>
                                          {roomObj.building}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className={isSelected ? 'text-indigo-200' : 'text-slate-400 font-medium'}>Maalmaha (Days):</span>
                                      <span className="font-bold font-mono text-[10px]">{cs.days.join(', ')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className={isSelected ? 'text-indigo-200' : 'text-slate-400 font-medium'}>Ardayda (Students):</span>
                                      <span className="font-bold">{studentCount} arday</span>
                                    </div>
                                  </div>
                                </div>

                                <div className={`mt-4 pt-3 border-t w-full flex items-center justify-between text-xs font-semibold ${
                                  isSelected ? 'border-indigo-900 text-emerald-400' : 'border-slate-100 text-indigo-600 group-hover:text-indigo-800'
                                }`}>
                                  <span>{isSelected ? 'Hadda Xaajiri (Currently Selecting)' : 'Guji si aad u Xaajiriso (Click to Take)'}</span>
                                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Class Session</label>
                        <select 
                          value={attSessionId} 
                          onChange={(e) => {
                            const csId = e.target.value;
                            setAttSessionId(csId);
                            if (csId) {
                              const found = allOrgClassSessions.find(cs => cs.id === csId);
                              if (found) {
                                setAttSubjectId(found.subjectId);
                                setAttRoomId(found.roomId);
                              }
                            } else {
                              setAttSubjectId('');
                              setAttRoomId('');
                            }
                          }}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                        >
                          <option value="">-- Manual/Choose Class Session --</option>
                          {orgClassSessions.map(cs => {
                            const sub = allOrgSubjects.find(s => s.id === cs.subjectId);
                            return (
                              <option key={cs.id} value={cs.id}>{cs.classCode} - {sub?.name || 'Session'}</option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Room</label>
                        <select 
                          value={attRoomId} 
                          onChange={(e) => {
                            setAttRoomId(e.target.value);
                            setAttSessionId('');
                          }}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                        >
                          <option value="">-- Choose Room --</option>
                          {orgRooms.map(rm => <option key={rm.id} value={rm.id}>{rm.roomNumber}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Instructor</label>
                        <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold truncate">
                          {attSubjectId ? (orgTeachers.find(t => t.id === orgSubjects.find(s => s.id === attSubjectId)?.teacherId)?.fullName || 'Assigned Instructor') : 'Select Class Session first'}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">{t('common.date')}</label>
                        <input 
                          type="date" 
                          value={attDate} 
                          onChange={(e) => setAttDate(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                        />
                      </div>
                    </div>
                  )}

                  {/* Students Attendance Status List */}
                  {attSubjectId && (
                    <div className="border border-gray-100 rounded-xl overflow-hidden mt-6">
                      <div className="bg-[#fcfcfd] p-3 font-semibold text-xs uppercase text-slate-500 grid grid-cols-12 items-center">
                        <div className="col-span-4 sm:col-span-6">{t('common.name')}</div>
                        <div className="col-span-8 sm:col-span-6 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const targetStudents = orgStudents.filter(std => 
                                attSessionId ? std.classSessions?.includes(attSessionId) : std.subjects.includes(attSubjectId)
                              );
                              const newRecords = { ...attRecords };
                              targetStudents.forEach(s => newRecords[s.id] = 'present');
                              setAttRecords(newRecords);
                            }}
                            className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded cursor-pointer"
                          >
                            All Present
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const targetStudents = orgStudents.filter(std => 
                                attSessionId ? std.classSessions?.includes(attSessionId) : std.subjects.includes(attSubjectId)
                              );
                              const newRecords = { ...attRecords };
                              targetStudents.forEach(s => newRecords[s.id] = 'absent');
                              setAttRecords(newRecords);
                            }}
                            className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded cursor-pointer"
                          >
                            All Absent
                          </button>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {(() => {
                          const filtered = orgStudents.filter(std => 
                            attSessionId 
                              ? std.classSessions?.includes(attSessionId)
                              : std.subjects.includes(attSubjectId)
                          );
                          if (filtered.length === 0) {
                            return (
                              <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                                Arday diiwaangashan looma helin fasalkan (No enrolled students found for this class/subject).
                              </div>
                            );
                          }
                          return filtered.map(student => (
                            <div key={student.id} className="p-3.5 grid grid-cols-12 items-center hover:bg-slate-50/40">
                              <div className="col-span-6 font-medium text-slate-800">{student.fullName}</div>
                              <div className="col-span-6 flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setAttRecords({ ...attRecords, [student.id]: 'present' })}
                                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    (attRecords[student.id] || 'present') === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAttRecords({ ...attRecords, [student.id]: 'absent' });
                                  }}
                                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    attRecords[student.id] === 'absent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  }`}
                                >
                                  Absent
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAttRecords({ ...attRecords, [student.id]: 'late' })}
                                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    attRecords[student.id] === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  }`}
                                >
                                  Late
                                </button>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>

                      {/* Saved Banner — shown after teacher clicks Save */}
                      {attSaved && (
                        <div className="mx-4 mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-emerald-800">Xaadirinta Waa La Keydsaday!</p>
                              <p className="text-[10px] text-emerald-600">Waxaad wax ka beddeli kartaa kadibna dib u keydi kartaa.</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setAttSaved(false)}
                            className="flex items-center gap-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                          >
                            ✏️ Wax ka Beddel
                          </button>
                        </div>
                      )}

                      <div className="p-4 bg-[#fcfcfd] text-right flex items-center justify-between gap-3">
                        {attSaved && (
                          <span className="text-[10px] text-slate-400 font-semibold">Waxaad wax ka bedesay? Dib u keydi.</span>
                        )}
                        <button
                          onClick={() => {
                            const targetStudents = orgStudents.filter(std => 
                              attSessionId 
                                ? std.classSessions?.includes(attSessionId)
                                : std.subjects.includes(attSubjectId)
                            );
                            const recordsArray = targetStudents.map(s => ({
                              studentId: s.id,
                              fullName: s.fullName,
                              status: attRecords[s.id] || 'present'
                            }));
                            const existingAtt = attendanceRecords.filter(a => a.organizationId === currentOrg?.id).find(a => 
                              a.date === attDate && 
                              (attSessionId ? a.sessionId === attSessionId : a.subjectId === attSubjectId)
                            );
                            saveAttendance({
                              ...(existingAtt ? { id: existingAtt.id, createdAt: existingAtt.createdAt } : {}),
                              date: attDate,
                              roomId: attRoomId || 'rm-1',
                              subjectId: attSubjectId,
                              sessionId: attSessionId || undefined,
                              teacherId: matchingTeacher?.id || orgSubjects.find(s => s.id === attSubjectId)?.teacherId || 't-101',
                              records: recordsArray,
                              organizationId: orgId
                            });
                            setAttSaved(true);
                            setSuccessMessage(attSaved ? 'Xaadirinta Waa La Cusboonaysiiyay!' : 'Attendance taken and parents notified on WhatsApp.');
                          }}
                          className={`font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-sm cursor-pointer ${
                            attSaved
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-black hover:bg-slate-800 text-white'
                          }`}
                        >
                          {attSaved ? '🔄 Cusboonaysii (Update)' : 'Save & Dispatch Notifications'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Render SUB-TAB: ABSENTEE (DAILY ABSENT REPORT) */}
              {attendanceSubTab === 'absentee' && !isTeacher && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{t('attendance.dailyAbsentees')} (Daily Absentee List)</h3>
                      <p className="text-xs text-slate-400">Warbixinta ardayda maqnayd taariikhda la doortay oo faahfaahsan.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-500">Taariikhda:</span>
                        <input 
                          type="date"
                          value={attDate}
                          onChange={(e) => setAttDate(e.target.value)}
                          className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                        />
                      </div>
                      <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 bg-black hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        <Printer size={15} /> Print Report
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const selectedDateAttendance = orgAttendance.filter(a => a.date === attDate);
                    const absentList = selectedDateAttendance.flatMap(record => {
                      const sub = orgSubjects.find(s => s.id === record.subjectId);
                      const rm = orgRooms.find(r => r.id === record.roomId);
                      const teacher = orgTeachers.find(t => t.id === record.teacherId);
                      
                      return record.records
                        .filter(item => item.status === 'absent')
                        .map(item => ({
                          id: `${record.id}-${item.studentId}`,
                          studentId: item.studentId,
                          studentName: item.fullName,
                          subjectId: record.subjectId,
                          subjectName: sub ? sub.name : 'Unknown Subject',
                          startTime: sub ? sub.startTime : 'N/A',
                          endTime: sub ? sub.endTime : 'N/A',
                          roomNumber: rm ? rm.roomNumber : 'N/A',
                          building: rm ? rm.building : 'N/A',
                          teacherName: teacher ? teacher.fullName : 'N/A',
                          parentPhone: orgStudents.find(s => s.id === item.studentId)?.parentPhone || 'N/A'
                        }));
                    });

                    // Unique absent students count
                    const uniqueAbsentStudents = Array.from(new Set(absentList.map(a => a.studentId))).length;
                    
                    // Class with most absentees
                    const classCountMap: { [key: string]: number } = {};
                    absentList.forEach(a => {
                      classCountMap[a.subjectName] = (classCountMap[a.subjectName] || 0) + 1;
                    });
                    let mostMissedClass = 'N/A';
                    let maxMissedCount = 0;
                    Object.entries(classCountMap).forEach(([className, count]) => {
                      if (count > maxMissedCount) {
                        maxMissedCount = count;
                        mostMissedClass = className;
                      }
                    });

                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white p-5 rounded-2xl border border-slate-100 card-shadow flex items-center gap-4">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl flex-shrink-0">
                              <Users size={24} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Maqnaanshaha Guud (Total Absentees)</p>
                              <h4 className="text-2xl font-black text-slate-900 mt-0.5">{absentList.length} <span className="text-xs text-slate-400 font-bold">diiwaan</span></h4>
                            </div>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-100 card-shadow flex items-center gap-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl flex-shrink-0">
                              <GraduationCap size={24} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ardayda Maqan ee Unique ah</p>
                              <h4 className="text-2xl font-black text-slate-900 mt-0.5">{uniqueAbsentStudents} <span className="text-xs text-slate-400 font-bold">ardey</span></h4>
                            </div>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-100 card-shadow flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl flex-shrink-0">
                              <School size={24} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fasalka Maqnaanshaha ugu badan</p>
                              <h4 className="text-sm font-bold text-slate-900 mt-1 truncate max-w-[200px]" title={mostMissedClass}>
                                {mostMissedClass !== 'N/A' ? `${mostMissedClass} (${maxMissedCount} maqan)` : 'N/A'}
                              </h4>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
                            <div>
                              <h3 className="text-base font-bold text-slate-950 font-sans tracking-tight">Diiwaanka Ardayda Maqan (Detail List)</h3>
                              <p className="text-xs text-slate-400">Ardayda ka maqan xiisadaha kala duwan iyo qolalka ay ka maqnaayeen.</p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100/50 text-rose-700 px-3 py-1.5 rounded-xl font-bold text-xs self-start sm:self-auto">
                              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                              Maalinta: {attDate}
                            </div>
                          </div>

                          {absentList.length === 0 ? (
                            <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                              <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                              <p className="text-sm font-bold text-slate-600">Ma jiraan arday maqan maalintan.</p>
                              <p className="text-xs text-slate-400 mt-1">Dhamaan ardayda qaybaha kala duwan ee fasalada waa la calaamadeeyay inay joogaan ama lama diiwaangelin wali.</p>
                            </div>
                          ) : (
                            <div className="overflow-hidden border border-slate-100 rounded-xl">
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                      <th className="p-3.5">{t('common.name')}</th>
                                      <th className="p-3.5">Maaddada / Time Slot</th>
                                      <th className="p-3.5">Class Room / Building</th>
                                      <th className="p-3.5">{t('sidebar.teachers')}</th>
                                      <th className="p-3.5">Mobile-ka Waalidka</th>
                                      <th className="p-3.5 text-right">{t('common.action')}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {absentList.map(item => (
                                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-3.5 font-bold text-slate-900">{item.studentName}</td>
                                        <td className="p-3.5">
                                          <div className="font-semibold text-indigo-900">{item.subjectName}</div>
                                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                            <Clock size={11} /> {item.startTime} - {item.endTime}
                                          </div>
                                        </td>
                                        <td className="p-3.5">
                                          <div className="font-medium text-slate-700 flex items-center gap-1">
                                            <School size={12} className="text-slate-400" /> Room: {item.roomNumber}
                                          </div>
                                          <div className="text-[10px] text-slate-400 mt-0.5">{item.building}</div>
                                        </td>
                                        <td className="p-3.5 font-medium text-slate-600">{item.teacherName}</td>
                                        <td className="p-3.5 font-semibold text-slate-800">{item.parentPhone}</td>
                                        <td className="p-3.5 text-right">
                                          <a
                                            href={`https://wa.me/${item.parentPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Ku: Waalidka Ardayga ${item.studentName},\nWaxaan halkaan kugula socodsiineynaa in ilmahaagu uu ka maqnaa maadada ${item.subjectName} ee saacadu tahay ${item.startTime} - ${item.endTime} qolka ${item.roomNumber} maanta oo ah ${attDate}.`)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition-colors"
                                          >
                                            <Send size={11} /> WhatsApp Waalidka
                                          </a>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Render SUB-TAB: RECORDS (CONSECUTIVE ABSENCES) */}
              {attendanceSubTab === 'records' && !isTeacher && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Consecutive Absences</h3>
                      <p className="text-xs text-slate-400">La soco ardayda joogtada u maqan toddobaadkii ama bishii oo dhan.</p>
                    </div>

                    {/* Streak Filters */}
                    <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                      <button
                        onClick={() => setStreakFilter('weekly')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          streakFilter === 'weekly' || streakFilter === 'all' ? 'bg-rose-600 text-white animate-pulse' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Toddobaad (Weekly 5+)
                      </button>
                      <button
                        onClick={() => setStreakFilter('monthly')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          streakFilter === 'monthly' ? 'bg-red-700 text-white animate-pulse' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Bil (Monthly 20+)
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const streakList = orgStudents.map(student => {
                      const studentChecks = orgAttendance
                        .map(record => {
                          const checkItem = record.records.find(r => r.studentId === student.id);
                          if (!checkItem) return null;
                          return {
                            date: record.date,
                            subjectId: record.subjectId,
                            status: checkItem.status,
                            createdAt: record.createdAt || '',
                          };
                        })
                        .filter((item): item is NonNullable<typeof item> => item !== null)
                        .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

                      // Calculate active streak (consecutive absences backwards from latest check)
                      let activeStreak = 0;
                      for (let i = studentChecks.length - 1; i >= 0; i--) {
                        if (studentChecks[i].status === 'absent') {
                          activeStreak++;
                        } else {
                          break;
                        }
                      }

                      // Calculate historical max streak
                      let maxStreak = 0;
                      let tempStreak = 0;
                      for (let i = 0; i < studentChecks.length; i++) {
                        if (studentChecks[i].status === 'absent') {
                          tempStreak++;
                          if (tempStreak > maxStreak) {
                            maxStreak = tempStreak;
                          }
                        } else {
                          tempStreak = 0;
                        }
                      }

                      // Missed details for this student
                      const recentMissed = studentChecks
                        .filter(c => c.status === 'absent')
                        .slice(-10)
                        .map(c => {
                          const sub = orgSubjects.find(s => s.id === c.subjectId);
                          return {
                            date: c.date,
                            subjectName: sub ? sub.name : 'Unknown Subject',
                            time: sub ? `${sub.startTime} - ${sub.endTime}` : 'N/A'
                          };
                        });

                      return {
                        student,
                        activeStreak,
                        maxStreak,
                        totalAbsentCount: studentChecks.filter(c => c.status === 'absent').length,
                        totalChecks: studentChecks.length,
                        recentMissed,
                        lastAbsentDate: studentChecks.filter(c => c.status === 'absent').pop()?.date || 'N/A'
                      };
                    })
                    // Only include students who have a full week of consecutive absences (5+ days streak)
                    .filter(item => item.maxStreak >= 5)
                    .filter(item => {
                      if (streakFilter === 'monthly') return item.maxStreak >= 20;
                      return true;
                    })
                    .sort((a, b) => b.activeStreak - a.activeStreak || b.maxStreak - a.maxStreak);

                    const countWeekly = streakList.filter(item => item.maxStreak >= 5 && item.maxStreak < 20).length;
                    const countMonthly = streakList.filter(item => item.maxStreak >= 20).length;

                    return (
                      <>
                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-5 rounded-2xl border border-slate-100 card-shadow flex items-center gap-4">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl flex-shrink-0 animate-pulse">
                              <AlertCircle size={24} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Xiriirka Toddobaadka (Weekly Streaks)</p>
                              <h4 className="text-xl font-black text-slate-900 mt-0.5">{countWeekly} <span className="text-xs text-slate-400 font-bold">ardey</span></h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">Ardayda maqan 5+ jeer oo xiriir ah.</p>
                            </div>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-100 card-shadow flex items-center gap-4">
                            <div className="p-3 bg-red-50 text-red-700 rounded-xl flex-shrink-0 animate-pulse">
                              <AlertCircle size={24} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Xiriirka Bisha (Monthly Streaks)</p>
                              <h4 className="text-xl font-black text-slate-900 mt-0.5">{countMonthly} <span className="text-xs text-slate-400 font-bold">ardey</span></h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">Ardayda maqan 20+ jeer oo xiriir ah.</p>
                            </div>
                          </div>
                        </div>

                        {/* List of consecutive absentees */}
                        <div className="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
                          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900">Ardayda ka Maqan Dugsiga (Streak Records)</h4>
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{streakList.length} Arday</span>
                          </div>

                          {streakList.length === 0 ? (
                            <div className="text-center py-16 px-4">
                              <AlertCircle className="mx-auto text-slate-300 mb-3" size={40} />
                              <p className="text-sm font-bold text-slate-600">Ma jiraan arday buuxisay shuruudan.</p>
                              <p className="text-xs text-slate-400 mt-1">Dhamaan ardayda dugsigu waxay leeyihiin xaadiris caadi ah oo aan maqnaansho xiriir ah lahayn.</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-slate-100">
                              {streakList.map(item => {
                                // Decide status badge
                                let badgeColor = 'bg-amber-50 text-amber-700 border-amber-100';
                                let streakText = `Maqnaansho Xiriir: ${item.maxStreak} jeer`;
                                
                                if (item.maxStreak >= 20) {
                                  badgeColor = 'bg-red-50 text-red-700 border-red-200 animate-pulse';
                                  streakText = `Maqan Bil Xiriir ah (20+ Days)`;
                                } else if (item.maxStreak >= 5) {
                                  badgeColor = 'bg-rose-50 text-rose-700 border-rose-100';
                                  streakText = `Maqan Toddobaad Xiriir ah (5+ Days)`;
                                }

                                // WhatsApp message template in Somali
                                let messageText = `Ku: Waalidka Ardayga ${item.student.fullName},\n\nWaxaan halkaan kugula socodsiineynaa in ilmahaagu uu si xiriir ah (joogto ah) uga maqnaa fasallada muddo ${item.activeStreak} jeer oo xiriir ah dugsiga. Maqnaanshahan joogtada ah wuxuu saameyn weyn ku yeelanayaa waxbarashadiisa.\n\nFadlan si degdeg ah ula soo xiriir xafiiska maamulka dugsiga si aan arrintan ugala hadalno. Mahadsanid.`;
                                if (item.maxStreak >= 20) {
                                  messageText = `Ku: Waalidka Ardayga ${item.student.fullName},\n\nOgeysiis Muhiim ah: Waxaan halkaan kugula socodsiineynaa in ilmahaagu uu si xiriir ah (joogto ah) uga maqnaa fasallada muddo kabadan HAL BIL (${item.activeStreak} jeer oo xiriir ah). Tani waxay khatar gelineysaa sii joogistiisa dugsiga.\n\nFadlan maalin kasta oo ku xigta si degdeg ah ula soo xiriir xafiiska dugsiga.`;
                                }

                                return (
                                  <div key={item.student.id} className="p-5 hover:bg-slate-50/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-2 max-w-xl">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200">
                                          {(item.student.fullName || '').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                          <h5 className="text-sm font-bold text-slate-900">{item.student.fullName}</h5>
                                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                                            <span>ID: {item.student.studentId}</span>
                                            <span>•</span>
                                            {(() => {
                                              const sRooms = item.student.subjects
                                                ?.map(subId => {
                                                  const sub = subjects.find(s => s.id === subId);
                                                  return sub ? orgRooms.find(r => r.id === sub.roomId)?.roomNumber : null;
                                                })
                                                .filter((num): num is string => !!num) || [];
                                              const uniqueRooms = Array.from(new Set(sRooms));
                                              return <span>Qolka: {uniqueRooms.length > 0 ? uniqueRooms.join(', ') : 'N/A'}</span>;
                                            })()}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap gap-2 pt-1">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${badgeColor}`}>
                                          <AlertCircle size={12} />
                                          {streakText}
                                        </span>
                                        <span className="bg-slate-50 text-slate-600 border border-slate-200/60 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                          Wadarta Maqnaanshaha: {item.totalAbsentCount} ka mid ah {item.totalChecks}
                                        </span>
                                        <span className="bg-slate-50 text-slate-600 border border-slate-200/60 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                          Ugu dambeysay: {item.lastAbsentDate}
                                        </span>
                                      </div>

                                      {/* Expanded list of missed items */}
                                      {item.recentMissed.length > 0 && (
                                        <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 text-[10px] text-slate-500 space-y-1">
                                          <div className="font-bold text-slate-600">Xiisadaha ugu dambeeyay ee laga maqnaaday:</div>
                                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 max-h-20 overflow-y-auto pr-1">
                                            {item.recentMissed.map((m, idx) => (
                                              <div key={idx} className="flex justify-between border-b border-slate-100/50 pb-0.5">
                                                <span className="font-semibold text-slate-700">{m.subjectName}</span>
                                                <span className="font-mono text-[9px]">{m.date} ({m.time})</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex flex-row md:flex-col items-end gap-2 justify-between md:justify-center border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                                      <div className="text-left md:text-right">
                                        <div className="text-[10px] text-slate-400 font-semibold">Mobile-ka Waalidka</div>
                                        <div className="text-xs font-bold text-slate-700">{item.student.parentPhone || 'N/A'}</div>
                                      </div>
                                      <a
                                        href={`https://wa.me/${(item.student.parentPhone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(messageText)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
                                      >
                                        <Send size={12} /> WhatsApp Waalidka
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Render SUB-TAB: HISTORY (ALL LOGS) */}
              {attendanceSubTab === 'history' && !isTeacher && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Diiwaanka Xaadirinta (Attendance History Logs)</h3>
                      <p className="text-xs text-slate-400">Halkaan waxaad ka arki kartaa dhammaan xaadirintii lasoo qaaday taariikh ahaan.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-xs font-bold text-slate-500">Bisha:</span>
                      <input 
                        type="month"
                        value={historyFilterMonth}
                        onChange={(e) => setHistoryFilterMonth(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {(() => {
                    const filteredHistory = orgAttendance
                      .filter(record => record.date.startsWith(historyFilterMonth))
                      .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''));

                    if (filteredHistory.length === 0) {
                      return (
                        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200">
                          <Calendar className="mx-auto text-slate-300 mb-3" size={40} />
                          <p className="text-sm font-bold text-slate-600">Wax xaadirin ah lagama qaadin bishaan.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <th className="p-4">{t('common.date')}</th>
                                <th className="p-4">Fasalka / Maadada</th>
                                <th className="p-4">Total Present</th>
                                <th className="p-4">Total Absent</th>
                                <th className="p-4 text-right">{t('common.action')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {filteredHistory.map(record => {
                                const sub = orgSubjects.find(s => s.id === record.subjectId);
                                const presentCount = record.records.filter(r => r.status === 'present').length;
                                const absentCount = record.records.filter(r => r.status === 'absent').length;

                                return (
                                  <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="p-4">
                                      <div className="font-bold text-slate-900">{record.date}</div>
                                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">{new Date(record.createdAt || record.date).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="p-4">
                                      <div className="font-bold text-indigo-900">{sub?.name || 'Class Session'}</div>
                                    </td>
                                    <td className="p-4">
                                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-bold text-[11px]">
                                        {presentCount} Jooga
                                      </span>
                                    </td>
                                    <td className="p-4">
                                      <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg font-bold text-[11px]">
                                        {absentCount} Maqan
                                      </span>
                                    </td>
                                    <td className="p-4 text-right">
                                      <button
                                        onClick={() => {
                                          setActiveTab('attendance');
                                          setAttendanceSubTab('take');
                                          setAttDate(record.date);
                                          setAttSubjectId(record.subjectId);
                                          setAttSessionId(record.sessionId || '');
                                        }}
                                        className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all shadow-sm cursor-pointer"
                                      >
                                        <Eye size={12} /> Eeg Xaadirinta
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Tab 7: FEES */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Student Tuition Fees & Collections</h2>
                  <p className="text-xs text-slate-500 mt-1">Sisteemka maamulka lacag bixinta ee bisha barakaysan.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/check-fee/${currentOrg?.id}`;
                      navigator.clipboard.writeText(link);
                      alert('Linkiga hubinta lacagta waa la copy-gareeyay: ' + link);
                    }}
                    className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm border border-emerald-200 cursor-pointer"
                  >
                    <Share2 size={15} /> Copy Checking Link
                  </button>
                  <button
                    onClick={() => {
                      setPaymentStudentId('');
                      setPaymentAmount(50);
                      setPaymentMonth('June 2026');
                      setActiveModal('receivePayment');
                    }}
                    className="flex items-center gap-1.5 bg-black hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    <Plus size={15} /> Receive Tuition Payment
                  </button>
                </div>
              </div>

              {/* Stat Summaries */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {hasPermission('View Total Income') && (
                  <>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 card-shadow">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Collected</span>
                      <span className="text-xl lg:text-2xl font-extrabold text-green-600 block mt-1">
                        ${orgFees.filter(f => f.status === 'paid' || f.status === 'approved').reduce((sum, f) => sum + (Number(f.amount) || 0), 0)}
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 card-shadow">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending / Outstanding</span>
                      <span className="text-xl lg:text-2xl font-extrabold text-red-500 block mt-1">
                        ${orgFees.filter(f => f.status === 'unpaid' || f.status === 'pending').reduce((sum, f) => sum + (Number(f.amount) || 0), 0)}
                      </span>
                    </div>
                  </>
                )}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 card-shadow">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paid Invoices</span>
                  <span className="text-xl lg:text-2xl font-extrabold text-slate-800 block mt-1">
                    {orgFees.filter(f => (f.status === 'paid' || f.status === 'approved') && !studentDebts[f.studentId]).length}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 card-shadow">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unpaid Invoices</span>
                  <span className="text-xl lg:text-2xl font-extrabold text-slate-800 block mt-1">
                    {orgFees.filter(f => f.status === 'unpaid' || f.status === 'pending').length}
                  </span>
                </div>
              </div>

              {/* Segmented Control Switcher */}
              <div className="flex justify-center sm:justify-start">
                <div className="bg-slate-100 p-1 rounded-2xl flex w-full max-w-lg border border-slate-200/40">
                  <button
                    onClick={() => setFeeSubTab('pending')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      feeSubTab === 'pending'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Clock size={14} className={feeSubTab === 'pending' ? 'text-amber-500' : ''} />
                    <span>{t('fees.pending')} ({pendingFeeRecords.length})</span>
                  </button>
                  <button
                    onClick={() => setFeeSubTab('overdue')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      feeSubTab === 'overdue'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <AlertTriangle size={14} className={feeSubTab === 'overdue' ? 'text-white' : 'text-rose-500'} />
                    <span>Overdue ({overdueStudentsList.length})</span>
                  </button>
                  <button
                    onClick={() => setFeeSubTab('paid')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      feeSubTab === 'paid'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <CheckCircle2 size={14} className={feeSubTab === 'paid' ? 'text-green-500' : ''} />
                    <span>Paid ({orgFees.filter(f => (f.status === 'paid' || f.status === 'approved') && !studentDebts[f.studentId]).length})</span>
                  </button>
                </div>
              </div>

              {/* Unified Section Card based on selection */}
              {feeSubTab === 'pending' ? (
                <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{t('fees.pending')}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Ardayda aan weli bixin ama laga dhacay khidmada waxbarashada.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        onClick={downloadAllPendingFeesPDF}
                        className="text-[11px] bg-slate-900 hover:bg-black text-white font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-slate-950 shadow-sm"
                        title="Download All Unpaid Student Fees Report (PDF)"
                      >
                        <Download size={12} />
                        <span>{t('fees.downloadAll')}</span>
                      </button>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
                        <input
                          type="text"
                          placeholder="Raadi arday..."
                          value={pendingSearch}
                          onChange={(e) => setPendingSearch(e.target.value)}
                          className="p-1.5 pl-8 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none w-44"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#fcfcfd] border-b border-gray-50 text-slate-500 font-semibold uppercase tracking-wider">
                          <th className="p-3">{t('common.name')}</th>
                          <th className="p-3">Outstanding Amount</th>
                          <th className="p-3">Due Date</th>
                          <th className="p-3">{t('common.status')}</th>
                          <th className="p-3 text-right">{t('common.action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pendingFeeRecords
                          .filter(f => (f.status === 'pending' || f.status === 'unpaid') && f.studentName.toLowerCase().includes(pendingSearch.toLowerCase()))
                          .map(fee => {
                            const expired = isFeeExpired(fee);
                            return (
                              <tr key={fee.id} className="hover:bg-slate-50/40">
                                <td className="p-3 font-semibold text-slate-900">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                                    <span>{fee.studentName}</span>
                                    {expired && (
                                      <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-red-50 text-red-700 uppercase tracking-wider border border-red-100 inline-block w-max">
                                        Expired / Dhacay
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 font-bold text-slate-800">${fee.amount}</td>
                                <td className="p-3 text-slate-400">
                                  {expired ? `Paid on ${fee.paidAt ? new Date(fee.paidAt).toLocaleDateString() : 'N/A'}` : `25th of ${fee.month}`}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${expired ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                    {expired ? 'Expired' : 'Unpaid'}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="inline-flex gap-2 items-center justify-end">
                                    <button
                                      onClick={() => downloadUnpaidInvoicePDF(fee)}
                                      className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                                      title="Soo degso Invoice PDF (Grayscale / No Colors)"
                                    >
                                      <Download size={11} />
                                      <span>Invoice PDF</span>
                                    </button>
                                    <button
                                      onClick={async () => {
                                        await updateFeePaymentStatus(fee.id, 'paid');
                                        showAlert(`Lacagta $${fee.amount} ee ${fee.studentName} waa la qabtay si guul leh!`, 'success');
                                        // Auto-send WhatsApp receipt link
                                        const student = orgStudents.find(s => s.id === fee.studentId);
                                        const phone = (student?.studentPhone || student?.parentPhone || '').replace(/[^0-9]/g, '');
                                        if (phone) {
                                          const verifyUrl = `${window.location.origin}/verify-receipt?o=${encodeURIComponent(currentOrg?.id || '')}&f=${encodeURIComponent(fee.id || '')}`;
                                          const msg =
                                            `Salaam ${fee.studentName}! 🎓\n\n` +
                                            `Lacagtaada bishii *${fee.month}* waa la qabtay ✅\n\n` +
                                            `📄 Risiidhkaaga rasmi ah soo daji halkan:\n${verifyUrl}\n\n` +
                                            `💳 Lacagta: *$${fee.amount}*\n` +
                                            `📅 Taariikhda: ${new Date().toLocaleDateString()}\n\n` +
                                            `Mahadsanid! — ${currentOrg?.name || ''}`;
                                          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                        }
                                      }}
                                      className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <Send size={10} />
                                      Approve
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        {pendingFeeRecords.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 text-xs font-medium">
                              Dhammaan fees-ka pending waa eber.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : feeSubTab === 'overdue' ? (
                <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-rose-100 bg-rose-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-rose-900">{t('fees.overdue')}</h3>
                      <p className="text-[10px] text-rose-500/80 mt-0.5">Ardayda lagu leeyahay 2 bilood ama ka badan.</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#fcfcfd] border-b border-gray-50 text-slate-500 font-semibold uppercase tracking-wider">
                          <th className="p-3">{t('common.name')}</th>
                          <th className="p-3">Months Owed</th>
                          <th className="p-3">Total Debt</th>
                          <th className="p-3 text-right">{t('common.action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {overdueStudentsList.map(fees => {
                          const student = orgStudents.find(s => s.id === fees[0].studentId);
                          const totalDebt = fees.reduce((sum, f) => sum + f.amount, 0);
                          return (
                            <tr key={fees[0].studentId} className="hover:bg-rose-50/30 transition-colors">
                              <td className="p-3 font-semibold text-slate-900">{student?.fullName || fees[0].studentName}</td>
                              <td className="p-3 font-bold text-rose-600">{fees.length} bilood</td>
                              <td className="p-3 font-black text-rose-700">${totalDebt}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => {
                                    setPaymentStudentId(fees[0].studentId);
                                    setPaymentAmount(fees[0].amount);
                                    setPaymentMonth(fees[0].month);
                                    setActiveModal('receivePayment');
                                  }}
                                  className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  Bixi (Pay)
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {overdueStudentsList.length === 0 && (
                          <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-medium">Ma jiraan deymo! (No overdue accounts)</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{t('fees.paid')}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Ardayda si guul leh u bixisay khidmada.</p>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
                      <input
                        type="text"
                        placeholder="Raadi arday ama inv..."
                        value={paidSearch}
                        onChange={(e) => setPaidSearch(e.target.value)}
                        className="p-1.5 pl-8 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none w-44"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#fcfcfd] border-b border-gray-50 text-slate-500 font-semibold uppercase tracking-wider">
                          <th className="p-3">Payment Date</th>
                          <th className="p-3">{t('common.name')}</th>
                          <th className="p-3">Amount Paid</th>
                          <th className="p-3">Receipt Number</th>
                          <th className="p-3 text-right">{t('common.action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orgFees
                          .filter(f => (f.status === 'paid' || f.status === 'approved') && !studentDebts[f.studentId])
                          .filter(f => f.studentName.toLowerCase().includes(paidSearch.toLowerCase()) || f.invoiceNumber.toLowerCase().includes(paidSearch.toLowerCase()))
                          .map(fee => (
                            <tr key={fee.id} className="hover:bg-slate-50/40">
                              <td className="p-3 text-slate-500">{fee.paidAt ? new Date(fee.paidAt).toLocaleDateString() : '-'}</td>
                              <td className="p-3 font-semibold text-slate-900">{fee.studentName}</td>
                              <td className="p-3 font-bold text-green-600">${fee.amount}</td>
                              <td className="p-3 font-mono text-slate-500 text-[10px]">{fee.invoiceNumber}</td>
                              <td className="p-3 text-right">
                                <div className="inline-flex gap-2 items-center justify-end">
                                  <button
                                    onClick={() => {
                                      setSelectedFee(fee);
                                      setActiveModal('viewReceipt');
                                    }}
                                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Invoice PDF
                                  </button>
                                  <button
                                    onClick={() => sendWhatsAppReceipt(fee)}
                                    className="p-1 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
                                    title="Send WhatsApp Receipt"
                                  >
                                    <Send size={13} />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (await showConfirm('Ma hubaal inaad rabto inaad kansasho risiidhkan (Cancel this receipt)?')) {
                                        await updateFeePaymentStatus(fee.id, 'cancelled');
                                        setSuccessMessage('Risiidhka waa la kansalay si rasmi ah.');
                                      }
                                    }}
                                    className="text-[10px] bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                    title="Cancel Receipt"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        {orgFees.filter(f => (f.status === 'paid' || f.status === 'approved') && !studentDebts[f.studentId]).length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 text-xs font-medium">
                              Weli ma jiro wax lacag ah oo la bixiyay bishan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 8: SALARIES */}
          {activeTab === 'salaries' && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Teacher Payroll / Salary</h2>
                  <p className="text-xs text-slate-400 mt-1">Manage teacher salaries (bixinta iyo risiidhada).</p>
                </div>

                {/* Export Salary Reports Segmented Control */}
                <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2">Export Report:</div>
                  <div className="inline-flex rounded-xl bg-slate-100 p-1">
                    <button
                      onClick={() => setSalaryExportType('pending')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        salaryExportType === 'pending'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setSalaryExportType('paid')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        salaryExportType === 'paid'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Paid
                    </button>
                    <button
                      onClick={() => setSalaryExportType('all')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        salaryExportType === 'all'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All
                    </button>
                  </div>
                  <button
                    onClick={downloadSalaryReportsPDF}
                    className="flex items-center gap-1.5 bg-black hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer border border-slate-950"
                  >
                    <Download size={12} />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>

              {/* Segmented Sub-tabs for Pending / Paid Salaries */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-3">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                  <button
                    onClick={() => setSalarySubTab('pending')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      salarySubTab === 'pending'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Clock size={14} className={salarySubTab === 'pending' ? 'text-amber-500' : ''} />
                    <span>Pending Salaries ({orgSalaries.filter(s => s.status === 'pending').length})</span>
                  </button>
                  <button
                    onClick={() => setSalarySubTab('paid')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      salarySubTab === 'paid'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <CheckCircle2 size={14} className={salarySubTab === 'paid' ? 'text-green-500' : ''} />
                    <span>Paid Salaries ({orgSalaries.filter(s => s.status === 'paid').length})</span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
                  <input
                    type="text"
                    placeholder={t('teachers.searchPlaceholder')}
                    value={salarySearch}
                    onChange={(e) => setSalarySearch(e.target.value)}
                    className="p-1.5 pl-8 text-xs bg-white border border-slate-200 rounded-xl focus:border-black focus:outline-none w-44 shadow-sm"
                  />
                </div>
              </div>

              {/* Table wrapper */}
              <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-[#fcfcfd] border-b border-gray-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                        <th className="p-4">Teacher Name</th>
                        <th className="p-4">Month</th>
                        <th className="p-4">Salary Amount</th>
                        <th className="p-4">Payout Status</th>
                        <th className="p-4 text-right">{t('common.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orgSalaries
                        .filter(s => s.status === salarySubTab)
                        .filter(s => s.teacherName.toLowerCase().includes(salarySearch.toLowerCase()))
                        .map(sal => (
                          <tr key={sal.id} className="hover:bg-slate-50/50">
                            <td className="p-4 font-semibold text-slate-900">
                              <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                                <span className={`w-2 h-2 rounded-full ${sal.status === 'paid' ? 'bg-green-400' : 'bg-amber-400'}`} />
                                <span>{sal.teacherName}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-500 text-xs">{sal.month}</td>
                            <td className="p-4 font-bold text-slate-800">${sal.amount}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                sal.status === 'paid'
                                  ? 'bg-green-50 text-green-700 border border-green-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {sal.status === 'paid' ? 'Paid / Bixiyay' : 'Pending / Dhiman'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="inline-flex gap-2 items-center justify-end">
                                {sal.status === 'pending' ? (
                                  <button
                                    onClick={() => {
                                      approveSalaryPayment(sal.id);
                                      setSuccessMessage('Salary payout approved successfully.');
                                    }}
                                    className="bg-black hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all shadow-sm border border-slate-950"
                                  >
                                    Approve Payout
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => downloadSalaryReceiptPDF(sal)}
                                    className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                    title="Soo degso Risiidhka Mishaarka (Grayscale / No Colors)"
                                  >
                                    <Download size={11} />
                                    <span>Salary Receipt PDF</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      {orgSalaries.filter(s => s.status === salarySubTab).length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 text-xs font-medium">
                            {salarySubTab === 'pending'
                              ? 'Dhammaan mishaaraadka macalimiinta waa la bixiyay!'
                              : 'Weli ma jiro wax mishaar ah oo la bixiyay bishan.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 9: EXAMS */}
          {activeTab === 'exams' && (
            <div className="space-y-6">
              {isTeacher ? (
                renderTeacherExamFlow()
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 card-shadow">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Examinations</h2>
                      <p className="text-sm text-slate-500 mt-1">Manage school and subject exams, and approve results.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setExamForm({ title: '', type: 'class', subjectId: '', targetClass: '', sessionId: '' });
                        setActiveModal('addExam');
                      }}
                      className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg w-full md:w-auto"
                    >
                      <Plus size={18} /> Create Exam
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Exams</p>
                        <p className="text-2xl font-black text-slate-900">{orgExams.length}</p>
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Published</p>
                        <p className="text-2xl font-black text-slate-900">{orgExams.filter(e => e.published).length}</p>
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <AlertCircle size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</p>
                        <p className="text-2xl font-black text-slate-900">{orgExams.filter(e => !e.published).length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900">All Exam Sessions</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {orgExams.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-medium">No exams created yet.</div>
                      ) : (
                        orgExams.map(ex => (
                          <div key={ex.id} className="p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h4 className="text-lg font-bold text-slate-900">{ex.title}</h4>
                                {ex.published ? (
                                  <span className="status-badge bg-success">
                                    <Check size={14} /> Published
                                  </span>
                                ) : (
                                  <span className="status-badge bg-warning">
                                    <AlertCircle size={14} /> Draft
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 font-medium">
                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                  ex.type === 'school' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                                }`}>
                                  {ex.type === 'school' ? 'Whole School' : 'Subject Exam'}
                                </span>
                                {ex.type === 'class' && (
                                  <>
                                    <span className="flex items-center gap-1.5"><BookOpen size={14}/> {orgSubjects.find(s => s.id === ex.subjectId)?.name || 'Unknown'}</span>
                                    <span className="flex items-center gap-1.5"><Users size={14}/> {ex.targetClass}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedExam(ex);
                                  const defaults: any = {};
                                  orgStudents.forEach(s => { defaults[s.id] = 0; });
                                  setMarksData(defaults);
                                  setActiveModal('enterMarks');
                                }}
                                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm rounded-xl transition-colors flex items-center gap-2"
                              >
                                <Edit2 size={16} /> Enter Marks
                              </button>
                              
                              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                                <button
                                  onClick={() => {
                                    setSelectedExam(ex);
                                    if (marksFileInputRef.current) marksFileInputRef.current.click();
                                  }}
                                  className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Upload Excel"
                                >
                                  <Upload size={16} />
                                </button>
                                <button
                                  onClick={() => handleDownloadTemplate(ex)}
                                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Download Template"
                                >
                                  <Download size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingExam(ex);
                                    setEditExamForm({
                                      title: ex.title, type: ex.type, subjectId: ex.subjectId || '', targetClass: ex.targetClass || '', sessionId: ex.sessionId || ''
                                    });
                                  }}
                                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit Exam"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (await showConfirm('Ma hubtaa in aad tirtirto imtixaankan?')) {
                                      deleteExam(ex.id);
                                      setSuccessMessage('Exam deleted successfully.');
                                    }
                                  }}
                                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Exam"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              {!ex.published ? (
                                <button
                                  onClick={() => {
                                    approveExamResults(ex.id);
                                    setSuccessMessage('Exam results approved and published to the student portal!');
                                    setSharingExam(ex);
                                  }}
                                  className="px-4 py-2 bg-black hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
                                >
                                  Approve
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSharingExam(ex)}
                                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2"
                                >
                                  <Share2 size={16} /> Share
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">System Reports</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow space-y-2 text-center">
                  <div className="mx-auto w-10 h-10 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center">
                    <GraduationCap size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Student Enrollment PDF</h4>
                  <p className="text-xs text-slate-400">Export student list with photo references and ID records.</p>
                  <button 
                    onClick={() => {
                      generateStudentEnrollmentPDF();
                    }}
                    className="w-full text-xs font-semibold bg-black hover:bg-slate-800 text-white py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Export Statement
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow space-y-2 text-center">
                  <div className="mx-auto w-10 h-10 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Fee Billings Statement</h4>
                  <p className="text-xs text-slate-400">Summarized collection report including paid/unpaid totals.</p>
                  <button 
                    onClick={() => {
                      generateFeeBillingsStatementPDF();
                    }}
                    className="w-full text-xs font-semibold bg-black hover:bg-slate-800 text-white py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Generate Report
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow space-y-2 text-center">
                  <div className="mx-auto w-10 h-10 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center">
                    <Award size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Academic Grades Summary</h4>
                  <p className="text-xs text-slate-400">Exams scores, averages, and student performance lists.</p>
                  <button 
                    onClick={() => {
                      generateAcademicGradesSummaryPDF();
                    }}
                    className="w-full text-xs font-semibold bg-black hover:bg-slate-800 text-white py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    View Grades PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab: STAFF MANAGEMENT */}
          {activeTab === 'staff' && hasPermission('User Management') && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 card-shadow">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Staff Management</h2>
                  <p className="text-xs text-slate-500">Diiwaan geli oo maamul shaqaalaha dugsiga oo leh xuquuq xaddidan</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 bg-white p-5 rounded-2xl border border-gray-100 card-shadow space-y-4 h-fit">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Diiwaan Geli Staff Cusub</h4>
                  
                  {staffError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs font-semibold">
                      {staffError}
                    </div>
                  )}

                  {staffSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs font-semibold">
                      {staffSuccess}
                    </div>
                  )}

                  <form onSubmit={handleStaffSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">{t('settings.fullName')}</label>
                      <input 
                        type="text" 
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="Maxamed Cali"
                        required
                        className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Email Sax Ah (Email)</label>
                      <input 
                        type="email" 
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        placeholder="staff@dugsi.com"
                        required
                        className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                      <input 
                        type="password" 
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="Ugu yaraan 6 xaraf"
                        required
                        minLength={6}
                        className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Xilka (Designation)</label>
                      <input 
                        type="text" 
                        value={staffDesignation}
                        onChange={(e) => setStaffDesignation(e.target.value)}
                        placeholder="Accountant, Manager..."
                        required
                        className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                      />
                    </div>

                    {/* Permissions Checkboxes */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 mt-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Permissions</label>
                      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {ALL_PERMISSIONS.map(perm => (
                          <label key={perm.key} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-colors col-span-1">
                            <input
                              type="checkbox"
                              checked={staffPermissions.includes(perm.key)}
                              onChange={() => toggleStaffPermission(perm.key)}
                              className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black"
                            />
                            <span className="text-[11px] font-semibold text-slate-700">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={staffLoading}
                      className="w-full text-xs font-semibold bg-black hover:bg-slate-800 text-white py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:bg-slate-400 mt-4"
                    >
                      {staffLoading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                      <span>Diiwaan Geli Staff-ka</span>
                    </button>
                  </form>
                </div>

                <div className="xl:col-span-2 space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                       <h4 className="text-sm font-bold text-slate-900">{t('staff.registered')}</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-white border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                            <th className="p-4">Magaca & Xilka</th>
                            <th className="p-4">Email</th>
                            <th className="p-4 hidden sm:table-cell">Permissions</th>
                            <th className="p-4">Xaalada</th>
                            <th className="p-4 text-right">Waxqabad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.filter(usr => usr.organizationId === orgId && usr.role === 'schoolstaff').length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                                Ma jiro wax staff ah oo diiwaan gashan hadda.
                              </td>
                            </tr>
                          ) : (
                            users.filter(usr => usr.organizationId === orgId && usr.role === 'schoolstaff').map(staff => (
                              <tr key={staff.uid} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 font-semibold text-slate-800">
                                  <div>{staff.fullName}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">{staff.staffDesignation || 'Staff'}</div>
                                </td>
                                <td className="p-4 text-slate-500">{staff.email}</td>
                                <td className="p-4 hidden sm:table-cell max-w-[200px]">
                                  <div className="flex flex-wrap gap-1">
                                    {staff.permissions?.slice(0, 3).map(p => (
                                      <span key={p} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">{p}</span>
                                    ))}
                                    {(staff.permissions?.length || 0) > 3 && (
                                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">+{(staff.permissions?.length || 0) - 3}</span>
                                    )}
                                    {(!staff.permissions || staff.permissions.length === 0) && (
                                      <span className="text-slate-400 italic">No permissions</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${staff.active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                    {staff.active !== false ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => openEditPermissions(staff)}
                                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => toggleStaffActive(staff.uid, staff.active !== false)}
                                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                        staff.active !== false 
                                          ? 'bg-orange-50 hover:bg-orange-100 text-orange-600' 
                                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                                      }`}
                                    >
                                      {staff.active !== false ? 'Dami' : 'Daar'}
                                    </button>

                                    <button
                                      onClick={() => setStaffDeleteConfirm({ uid: staff.uid, name: staff.fullName })}
                                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                                    >
                                      Tirtir
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Permissions Modal */}
              {editingStaff && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                  <button
                    type="button"
                    aria-label="Close"
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => setEditingStaff(null)}
                  />
                  <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-slate-200">
                    {/* Header */}
                    <div className="bg-slate-900 text-white px-6 py-4">
                      <h3 className="text-base font-bold">Edit Permissions</h3>
                      <p className="text-xs text-slate-300 mt-0.5">{editingStaff.name}</p>
                    </div>

                    {/* Permissions Grid */}
                    <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Tick-garee kuwa aad rabto</p>
                      {ALL_PERMISSIONS.map(perm => (
                        <label
                          key={perm.key}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            editPerms.includes(perm.key)
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={editPerms.includes(perm.key)}
                            onChange={() => toggleEditPerm(perm.key)}
                            className="w-4 h-4 rounded accent-emerald-600"
                          />
                          <span className={`text-sm font-semibold ${editPerms.includes(perm.key) ? 'text-emerald-800' : 'text-slate-600'}`}>
                            {perm.label}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-400">
                        {editPerms.length} / {ALL_PERMISSIONS.length} la xushay
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingStaff(null)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          Ka noqo
                        </button>
                        <button
                          onClick={handleSaveStaffPermissions}
                          className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          Kaydi ✓
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Confirmation Popup Modal */}
              {staffDeleteConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                  <button
                    type="button"
                    aria-label="Close"
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => setStaffDeleteConfirm(null)}
                  />
                  <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-red-200">
                    {/* Icon */}
                    <div className="flex justify-center pt-8 pb-2">
                      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="px-6 pb-6 text-center">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Ma hubtaa?</h3>
                      <p className="text-sm text-slate-500">
                        Ma hubtaa Staff <span className="font-bold text-slate-800">{staffDeleteConfirm.name}</span> inaa delete gareyno?
                      </p>
                      <p className="text-xs text-red-400 mt-2">Tallaabadaan dib looma celinayo.</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 px-6 pb-6">
                      <button
                        onClick={() => setStaffDeleteConfirm(null)}
                        className="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
                      >
                        Maya
                      </button>
                      <button
                        onClick={handleDeleteStaff}
                        className="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-all cursor-pointer"
                      >
                        Haa, Tirtir
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 11: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('settings.title')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Qaybta Macluumaadka Guud (General Info - Name Change) */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Users size={20} className="text-black" />
                    <h3 className="text-sm font-sans font-bold text-slate-900">Change Name</h3>
                  </div>

                  {nameError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs font-semibold">
                      {nameError}
                    </div>
                  )}

                  {nameSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs font-semibold">
                      {nameSuccess}
                    </div>
                  )}

                  <form onSubmit={handleNameSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Magacaaga Buuxa ({t('settings.fullName')})</label>
                      <input 
                        type="text" 
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Gali magacaaga oo buuxa"
                        required
                        className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={nameLoading}
                      className="w-full text-xs font-semibold bg-black hover:bg-slate-800 text-white py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:bg-slate-400"
                    >
                      {nameLoading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                      <span>{t('settings.updateProfile')}</span>
                    </button>
                  </form>
                </div>

                {/* Qaybta Ereyga Sirta ah (Password Reset Email Form) */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 card-shadow space-y-4 overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <KeyRound size={20} className="text-black" />
                    <h3 className="text-sm font-sans font-bold text-slate-900">{t('settings.changePassword')}</h3>
                  </div>

                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    {t('settings.securityNotice')}
                  </p>

                  {settingsPasswordError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs font-semibold">
                      {settingsPasswordError}
                    </div>
                  )}

                  {settingsPasswordSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs font-semibold">
                      {settingsPasswordSuccess}
                    </div>
                  )}

                  <div className="p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <User size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t('settings.emailToSend')}</p>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={currentUser?.email || 'N/A'}>
                          {currentUser?.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={handleSettingsPasswordReset}
                      disabled={settingsPasswordLoading}
                      className="text-xs font-semibold bg-black hover:bg-slate-800 text-white px-5 py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:bg-slate-400 w-full lg:w-auto shrink-0"
                    >
                      {settingsPasswordLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                      <span className="whitespace-nowrap">{t('settings.sendCode')}</span>
                    </button>
                  </div>
                </div>
              </div>


            </div>
          )}
          </>)}
        </main>
      </div>

      {/* Mobile Burger Navigation */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                aria-label="Close navigation menu"
                className="absolute inset-0 bg-black/45 backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              <div className="absolute top-0 right-0 h-full w-[85vw] max-w-sm bg-white shadow-2xl border-l border-slate-200 flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-bold">Navigation</p>
                    <h3 className="text-base font-bold text-slate-900">School Admin Menu</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                    aria-label="Close menu"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <button
                    onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${activeTab === 'dashboard' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                  >
                    <LayoutDashboard size={18} />
                    <span className="font-semibold">{t('sidebar.dashboard')}</span>
                  </button>

                  {hasPermission('Students') && (
                    <button
                      onClick={() => { setActiveTab('students'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${activeTab === 'students' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <GraduationCap size={18} />
                      <span className="font-semibold">{t('sidebar.students')}</span>
                    </button>
                  )}

                  {hasPermission('Teachers') && !quranModeWithoutTeachers && (
                    <button
                      onClick={() => { setActiveTab('teachers'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${activeTab === 'teachers' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <Users size={18} />
                      <span className="font-semibold">{t('sidebar.teachers')}</span>
                    </button>
                  )}

                  {hasPermission('School Settings') && (
                    <button
                      onClick={() => { setActiveTab('subjects'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${activeTab === 'subjects' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <BookOpen size={18} />
                      <span className="font-semibold">{t('sidebar.subjects')}</span>
                    </button>
                  )}

                  {hasPermission('School Settings') && (
                    <button
                      onClick={() => { setActiveTab('class-sessions'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${activeTab === 'class-sessions' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <Clock size={18} />
                      <span className="font-semibold">{t('sidebar.classes')}</span>
                    </button>
                  )}

                  {hasPermission('School Settings') && (
                    <button
                      onClick={() => { setActiveTab('rooms'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${activeTab === 'rooms' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <School size={18} />
                      <span className="font-semibold">{t('sidebar.classes')}</span>
                    </button>
                  )}

                  {hasPermission('Attendance') && (
                    <button
                      onClick={() => { setActiveTab('attendance'); setAttendanceSubTab('take'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${activeTab === 'attendance' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <Calendar size={18} />
                      <span className="font-semibold">{t('sidebar.attendance')}</span>
                    </button>
                  )}

                  {hasPermission('Fees') && (
                    <button
                      onClick={() => { setActiveTab('fees'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${activeTab === 'fees' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <DollarSign size={18} />
                      <span className="font-semibold">{t('sidebar.fees')}</span>
                    </button>
                  )}

                  {hasPermission('Teacher Salary') && !quranModeWithoutTeachers && (
                    <button
                      onClick={() => { setActiveTab('salaries'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${activeTab === 'salaries' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <DollarSign size={18} />
                      <span className="font-semibold">Salary Payouts</span>
                    </button>
                  )}

                  {(hasPermission('Exams') || isTeacher) && (
                    <button
                      onClick={() => { setActiveTab('exams'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${activeTab === 'exams' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <Award size={18} />
                      <span className="font-semibold">{isTeacher ? 'Submit Exam Marks' : 'Exams'}</span>
                    </button>
                  )}

                  {(hasPermission('Print Reports') || hasPermission('View Financial Reports')) && (
                    <button
                      onClick={() => { setActiveTab('reports'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${activeTab === 'reports' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <CheckCircle2 size={18} />
                      <span className="font-semibold">Reports & PDF</span>
                    </button>
                  )}

                  {hasPermission('User Management') && (
                    <button
                      onClick={() => { setActiveTab('staff'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${activeTab === 'staff' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <Users size={18} />
                      <span className="font-semibold">{t('sidebar.staff')}</span>
                    </button>
                  )}

                  {hasPermission('School Settings') && (
                    <button
                      onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${activeTab === 'settings' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <Settings size={18} />
                      <span className="font-semibold">{t('sidebar.settings')}</span>
                    </button>
                  )}

                  <div className="pt-2 border-t border-slate-100 mt-2">
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                      className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-3 rounded-2xl border border-red-200 transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

      {activeModal === 'viewReceipt' && selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100/80 flex flex-col space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Tuition Fee Invoice & Receipt
              </h3>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setSelectedFee(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Invoicing Content */}
            <div id="receipt-invoice-print-area" className="p-5 border border-slate-200/80 rounded-2xl space-y-4 bg-slate-50/50">
              <div className="text-center border-b border-slate-200 pb-3">
                <h4 className="text-base font-black tracking-tight text-slate-900 uppercase">
                  {currentOrg?.name || ''}
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                  OFFICIAL TUITION INVOICE / RECEIPT
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Ardayga / Student</span>
                  <span className="font-semibold text-slate-800 block">{selectedFee.studentName}</span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">ID: {allOrgStudents.find(s => s.id === selectedFee.studentId || s.fullName === selectedFee.studentName)?.studentId || selectedFee.studentId}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Receipt / Invoice No</span>
                  <span className="font-mono text-slate-700 font-semibold">{selectedFee.invoiceNumber}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Taariikhda / Paid Date</span>
                  <span className="font-semibold text-slate-800">
                    {selectedFee.paidAt ? new Date(selectedFee.paidAt).toLocaleDateString() : new Date().toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Bisha / Month</span>
                  <span className="font-semibold text-slate-800">{selectedFee.month}</span>
                </div>
                <div className="col-span-2 bg-white p-3 rounded-xl border border-slate-200/60 flex justify-between items-center">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Cadadka / Amount Paid</span>
                    <span className="text-lg font-black text-green-600">${selectedFee.amount}</span>
                  </div>
                  <div className="bg-green-50 text-green-700 font-bold px-2.5 py-1 rounded-lg border border-green-100 uppercase text-[9px]">
                    Approved & Paid
                  </div>
                </div>
              </div>

              {/* Expiring QR Code Section */}
              {(() => {
                const paidDateObj = selectedFee.paidAt ? new Date(selectedFee.paidAt) : new Date();
                const expiryDateObj = new Date(paidDateObj);
                expiryDateObj.setDate(expiryDateObj.getDate() + 30);
                const expiryFormatted = `${expiryDateObj.getDate()}/${expiryDateObj.getMonth() + 1}/${expiryDateObj.getFullYear()}`;
                const studentObj = orgStudents.find(s => s.id === selectedFee.studentId);
                const studentIdParam = studentObj?.studentId || selectedFee.studentId;
                const verifyUrl = `${window.location.origin}/verify-receipt?o=${encodeURIComponent(currentOrg?.id || '')}&f=${encodeURIComponent(selectedFee.id || '')}`;
                
                return (
                  <div className="border-t border-dashed border-slate-200 pt-3 flex flex-col items-center text-center space-y-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`}
                      alt="Verification QR Code"
                      className="w-28 h-28 border border-slate-200 p-1.5 bg-white rounded-lg"
                    />
                    <div className="bg-red-50 text-red-600 border border-red-100 p-2.5 rounded-xl text-[10px] font-bold max-w-sm leading-relaxed">
                      ⚠️ QR CODE EXPIRES: {expiryFormatted} (30 Days Validity)
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
              <button
                onClick={() => printReceipt(selectedFee)}
                className="flex items-center gap-1.5 bg-black hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                <Printer size={14} /> {t('common.print')}
              </button>
              <button
                onClick={() => sendWhatsAppReceipt(selectedFee)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                <Send size={14} /> WhatsApp Receipt
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setSelectedFee(null);
                }}
                className="px-3.5 py-2 text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer text-xs font-semibold"
              >
                Xir (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Add Student */}
      {activeModal === 'addStudent' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[1.5rem] max-w-lg w-full p-5 shadow-2xl border border-gray-100/80 flex flex-col space-y-3">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              {selectedStudent ? 'Wax ka bedel Profile-ka Ardayga (Edit Student)' : 'Register Student Profile'}
            </h3>
            <form onSubmit={handleAddStudentSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">{t('settings.fullName')}</label>
                  <input
                    type="text" required
                    value={studentForm.fullName}
                    onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none text-xs font-semibold"
                  />
                </div>
                {!isQuranSchool && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">{t('common.gender')}</label>
                    <select
                      value={studentForm.gender}
                      onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as any })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none text-xs font-semibold"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Student Mobile Phone</label>
                  <input
                    type="text" placeholder="+252615xxxxxx"
                    value={studentForm.studentPhone}
                    onChange={(e) => setStudentForm({ ...studentForm, studentPhone: e.target.value.replace(/[^0-9+ ]/g, '') })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Parent Mobile (WhatsApp)</label>
                  <input
                    type="text" required placeholder="+252615000000"
                    value={studentForm.parentPhone}
                    onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value.replace(/[^0-9+ ]/g, '') })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              {!isQuranSchool && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Address Location</label>
                  <input
                    type="text" required
                    value={studentForm.address}
                    onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none text-xs font-semibold"
                  />
                </div>
              )}

              {formError && (
                <div className="p-2 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-[10px] font-bold text-red-700 leading-relaxed">{formError}</p>
                </div>
              )}

              <div className="border-t border-b border-slate-100 py-2 my-1 space-y-2">
                {isQuranSchool ? (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dooro Qolka (Select Room) *</label>
                    <select
                      value={studentForm.roomId || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, roomId: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none text-xs font-semibold"
                    >
                      <option value="">Fadlan dooro qol...</option>
                      {allOrgRooms.map(r => (
                        <option key={r.id} value={r.id}>{r.roomNumber} (Qaadaa: {r.capacity})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dooro Class Sessions *</label>
                    <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 max-h-48 overflow-y-auto scrollbar-thin">
                    {allOrgSubjects.length === 0 ? (
                      <p className="text-slate-400 text-[10px]">No subjects or class sessions created yet.</p>
                    ) : (
                      allOrgSubjects.map(sub => {
                        const sessions = allOrgClassSessions.filter(cs => cs.subjectId === sub.id && cs.status === 'active');
                        if (sessions.length === 0) return null;
                        
                        return (
                          <div key={sub.id} className="space-y-1 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                            <span className="font-bold text-slate-900 text-[11px] block">{sub.name}</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {sessions.map(cs => {
                                const isChecked = studentForm.classSessions?.includes(cs.id);
                                const rm = allOrgRooms.find(r => r.id === cs.roomId);
                                const teacher = allOrgTeachers.find(t => t.id === cs.teacherId);
                                return (
                                  <label key={cs.id} className={`flex items-start gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                                    isChecked ? 'border-black bg-black/5 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'
                                  }`}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        let updated = [...(studentForm.classSessions || [])];
                                        if (e.target.checked) {
                                          updated.push(cs.id);
                                        } else {
                                          updated = updated.filter(id => id !== cs.id);
                                        }
                                        setStudentForm({ ...studentForm, classSessions: updated });
                                        setFormError(null);
                                      }}
                                      className="mt-0.5 rounded border-slate-300 text-black focus:ring-black cursor-pointer"
                                    />
                                    <div className="space-y-0.5">
                                      <span className="font-bold text-slate-800 block leading-tight text-[11px]">
                                        {cs.classCode}
                                      </span>
                                      <span className="text-[9px] text-slate-500 font-medium block">
                                        Macallin: {teacher ? teacher.fullName : 'No Teacher'}
                                      </span>
                                      <span className="text-[9px] text-indigo-600 font-mono font-bold block">
                                        Qolka: {rm ? rm.roomNumber : 'N/A'} | {cs.startTime} - {cs.endTime}
                                      </span>
                                      <span className="text-[8px] text-slate-400 font-bold uppercase block leading-tight">
                                        Maalmaha: {cs.days.join(', ')}
                                      </span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                    </div>
                  </div>
                )}
                
                {/* Overlap Warning Component */}
                {(() => {
                  if (isQuranSchool) return null;
                  const selectedSessions = allOrgClassSessions.filter(cs => studentForm.classSessions?.includes(cs.id));
                  let overlapText = '';
                  for (let i = 0; i < selectedSessions.length; i++) {
                    for (let j = i + 1; j < selectedSessions.length; j++) {
                      const cs1 = selectedSessions[i];
                      const cs2 = selectedSessions[j];
                      const daysOverlap = cs1.days.some(d => cs2.days.includes(d));
                      const timeOverlap = cs1.startTime < cs2.endTime && cs2.startTime < cs1.endTime;
                      if (daysOverlap && timeOverlap) {
                        overlapText = `Digtooni: "${cs1.classCode}" iyo "${cs2.classCode}" way isku dhacayaan waqtiga.`;
                        break;
                      }
                    }
                  }
                  if (overlapText) {
                    return (
                      <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl">
                        <p className="text-[10px] font-bold text-amber-700 leading-relaxed">{overlapText}</p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Monthly Tuition Fee ($)</label>
                  <input
                    type="number" required min="0"
                    value={studentForm.fee}
                    onChange={(e) => setStudentForm({ ...studentForm, fee: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => { setActiveModal(null); setSelectedStudent(null); }} className="px-3.5 py-1.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all font-semibold cursor-pointer text-xs">Cancel</button>
                <button type="submit" className="bg-black hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer text-xs">
                  {selectedStudent ? 'Save Changes' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'invoice' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100/80 flex flex-col space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Upload className="text-slate-700" size={18} />
              Geli Liiska Ardayda Badan (Excel / CSV)
            </h3>
            
            <div className="space-y-4 text-xs">
              {/* Step 1: Select Subject, Room, Time */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-2.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tallaabada 1aad: Dooro Maaddada (Subject)</span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dooro Maaddada loo diiwaangelinayo</label>
                  <select
                    value={bulkSubjectId}
                    onChange={(e) => setBulkSubjectId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-black focus:outline-none text-xs font-semibold"
                  >
                    <option value="">-- Dooro Maaddada --</option>
                    {orgSubjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                {bulkSubjectId && (
                  <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">{t('common.room')}</span>
                      <span className="text-[11px] font-semibold text-slate-800">
                        {(() => {
                          const sub = orgSubjects.find(s => s.id === bulkSubjectId);
                          return orgRooms.find(r => r.id === sub?.roomId)?.roomNumber || 'N/A';
                        })()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">Schedule</span>
                      <span className="text-[11px] font-semibold text-slate-800">
                        {(() => {
                          const sub = orgSubjects.find(s => s.id === bulkSubjectId);
                          return sub ? `${sub.startTime} - ${sub.endTime}` : 'N/A';
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Download Excel/CSV Template */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                <div className="max-w-[70%]">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tallaabada 2aad: Soo degso Template-ka Excel</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">La soo deg faylka tusaalaha ah si aad u buuxiso xogta ardayda.</p>
                </div>
                <button
                  type="button"
                  onClick={downloadExcelTemplate}
                  className="bg-black hover:bg-slate-800 text-white text-xs px-3.5 py-2 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} /> Download Excel
                </button>
              </div>

              {/* Step 3: Drag & Drop File Upload */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed p-6 rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 ${
                  isDragOver ? 'border-black bg-slate-50' : 'border-slate-200 hover:border-slate-400 bg-white'
                }`}
                onClick={() => document.getElementById('excel-file-input')?.click()}
              >
                <Upload className="text-slate-400" size={32} />
                <div>
                  <p className="font-semibold text-slate-700">Halkan ku soo tuur faylka Excel (.xlsx) ama CSV</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">Ama guji si aad computer-kaaga uga soo doorato</p>
                </div>
                <input 
                  type="file" 
                  id="excel-file-input" 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </div>

              {/* Step 4: Preview and Paste */}
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tallaabada 4aad: Fiiri Xogta la soo akhriyey (ama ku dheji CSV)</span>
                <p className="text-[10px] text-slate-400">Qaabka: <code>FullName, StudentPhone, ParentPhone, Address, Gender, DOB, MonthlyFee</code></p>
                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="Example:&#10;Zakaria Farah, +252615111111, +252615999991, Wadajir, male, 2012-05-15, 50"
                  className="w-full h-20 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:outline-none focus:border-black"
                />
              </div>

              {bulkResult && (
                <div className="p-3 bg-emerald-50 rounded-xl space-y-1 border border-emerald-100">
                  <p className="font-bold text-emerald-800">Guul: Waxaa la soo geliyay {bulkResult.successCount} arday.</p>
                  {bulkResult.errors.map((err, idx) => (
                    <p key={idx} className="text-red-700 font-medium text-[10px]">- {err}</p>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => { setActiveModal(null); setBulkResult(null); }} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all font-semibold cursor-pointer">Xir (Close)</button>
                <button type="button" onClick={handleBulkImport} className="bg-black hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer">Xaqiiji & Keydi (Save)</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Add Teacher */}
      {activeModal === 'addTeacher' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100/80 flex flex-col space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              {selectedTeacher ? 'Wax ka bedel Profile-ka Macallinka (Edit Teacher)' : 'Create Teacher Profile'}
            </h3>
            {formError && (
              <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-100 font-medium">{formError}</p>
            )}
            <form onSubmit={handleAddTeacherSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">{t('settings.fullName')}</label>
                  <input
                    type="text" required
                    value={teacherForm.fullName}
                    onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Email (Login ID)</label>
                  <input
                    type="email" required
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Contact Phone</label>
                  <input
                    type="text" required
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value.replace(/[^0-9+ ]/g, '') })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Monthly Salary ($)</label>
                  <input
                    type="number" required min="0"
                    value={teacherForm.salary}
                    onChange={(e) => setTeacherForm({ ...teacherForm, salary: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Home Address (Cinwaanka Guriga)</label>
                <input
                  type="text" required
                  placeholder="Tusaale: Hodan, Mogadishu"
                  value={teacherForm.address || ''}
                  onChange={(e) => setTeacherForm({ ...teacherForm, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Password</label>
                <input
                  type="text" required
                  placeholder="Tusaale: 123456"
                  value={teacherForm.password}
                  onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none font-mono"
                />
              </div>

              {/* Multi-select Subjects Checkboxes or Single Room Select */}
              {!isQuranSchool ? (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Maddooyinka uu dhigo (Subjects) *Waajib ah</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 max-h-40 overflow-y-auto">
                    {orgSubjects.length === 0 ? (
                      <p className="text-slate-400 text-xs col-span-2">Fadlan marka hore sameey maddooyin (No subjects created yet).</p>
                    ) : (
                      (() => {
                        const availableSubjects = orgSubjects.filter(sub => {
                          const isChecked = teacherForm.subjects.includes(sub.id);
                          if (isChecked) return true;

                          // Check if claimed by another teacher's subjects array
                          const isClaimedByAnotherTeacher = orgTeachers.some(t => 
                            (!selectedTeacher || t.id !== selectedTeacher.id) && 
                            t.subjects && 
                            t.subjects.includes(sub.id)
                          );

                          // Check if subject's teacherId is set to another teacher
                          const isTeacherIdSetToAnother = sub.teacherId && 
                            (!selectedTeacher || sub.teacherId !== selectedTeacher.id);

                          return !isClaimedByAnotherTeacher && !isTeacherIdSetToAnother;
                        });

                        if (availableSubjects.length === 0) {
                          return <p className="text-slate-400 text-xs col-span-2">Maaddo banaan oo la dooran karo ma jirto (No available subjects found or all are assigned to other teachers).</p>;
                        }

                        return availableSubjects.map(sub => {
                          const isChecked = teacherForm.subjects.includes(sub.id);
                          
                          return (
                            <label key={sub.id} className={`flex items-start gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                              isChecked ? 'border-black bg-black/5' : 'border-slate-100 hover:border-slate-300 bg-white'
                            }`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  let updated = [...teacherForm.subjects];
                                  if (e.target.checked) {
                                    updated.push(sub.id);
                                  } else {
                                    updated = updated.filter(id => id !== sub.id);
                                  }
                                  setTeacherForm({ ...teacherForm, subjects: updated });
                                }}
                                className="mt-0.5 rounded border-slate-300 text-black focus:ring-black"
                              />
                              <div>
                                <span className="font-semibold text-slate-800 block leading-tight">{sub.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Maaddada Asaasiga ah (Core Subject)
                                </span>
                              </div>
                            </label>
                          );
                        });
                      })()
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Qolka Macallinka (Room) *Waajib ah</label>
                  <select 
                    required
                    value={teacherForm.rooms[0] || ''}
                    onChange={(e) => setTeacherForm({ ...teacherForm, rooms: [e.target.value] })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                  >
                    <option value="">-- Dooro Qolka --</option>
                    {orgRooms.map(r => {
                      const isClaimedByAnotherTeacher = orgTeachers.some(t => 
                        (!selectedTeacher || t.id !== selectedTeacher.id) && 
                        t.rooms && t.rooms.includes(r.id)
                      );
                      
                      return (
                        <option key={r.id} value={r.id} disabled={isClaimedByAnotherTeacher}>
                          {r.roomNumber} (Qaada: {r.capacity}) {isClaimedByAnotherTeacher ? ' - Horey ayaa loo qaatay' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => { setActiveModal(null); setSelectedTeacher(null); setFormError(null); }} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="bg-black hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer">
                  {selectedTeacher ? 'Xaqiiji Bedelaada (Save Changes)' : 'Save Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Add Subject */}
      {activeModal === 'addSubject' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100/80 flex flex-col space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              {selectedSubject ? 'Wax ka bedel Maaddada (Edit Subject)' : 'Create Academic Subject'}
            </h3>
            {formError && (
              <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-100">{formError}</p>
            )}
            <form onSubmit={handleAddSubjectSubmit} className="space-y-4 text-xs">
              {/* Info hint */}
              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">i</div>
                <div>
                  <p className="font-bold text-blue-800 text-[11px]">Subject is a code only</p>
                  <p className="text-blue-600 text-[10px] mt-0.5">Waqtiga, Qolka, iyo Macallinka waxaad ku xiri doontaa markii aad abuureysid <strong>Class Session</strong>.</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Subject Name *</label>
                <input
                  type="text" required
                  placeholder="Tusaale: English Language, Mathematics, Quran..."
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tirada Ardayda ugu Badan (Max Capacity)</label>
                <input
                  type="number" required min={1} max={500}
                  value={subjectForm.capacity}
                  onChange={(e) => setSubjectForm({ ...subjectForm, capacity: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => { setActiveModal(null); setSelectedSubject(null); setFormError(null); }} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="bg-black hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer">
                  {selectedSubject ? 'Xaqiiji Bedelaada (Save Changes)' : 'Kaydi Maaddada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {activeModal === 'receivePayment' && (() => {
        const now = new Date();
        const selectedStudentObj = orgStudents.find(s => s.id === paymentStudentId);
        const studentUnpaidFees = orgFees.filter(f => f.studentId === paymentStudentId && (f.status === 'pending' || f.status === 'unpaid')).sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());
        const monthOptions = studentUnpaidFees.length > 0 ? studentUnpaidFees.map(f => f.month) : Array.from({ length: 12 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - 6 + i, 1);
          return d.toLocaleString('en-US', { month: 'long' }) + ' ' + d.getFullYear();
        });
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Finance</p>
                    <h3 className="text-base font-extrabold tracking-tight">Qaado Lacagta Waxbarashada</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Receive Student Tuition Payment</p>
                  </div>
                  <button type="button" onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!paymentStudentId) { showAlert('Fadlan dooro ardayga!', 'error'); return; }
                  const feeRecord = await addFeePayment(paymentStudentId, paymentAmount, paymentMonth);
                  if (feeRecord) {
                    setSelectedFee(feeRecord);
                    setSuccessMessage('Lacag bixinta waa la duubay oo waa la oggolaaday!');
                    // Auto-send WhatsApp receipt link immediately
                    const student = orgStudents.find(s => s.id === paymentStudentId);
                    const phone = (student?.studentPhone || student?.parentPhone || '').replace(/[^0-9]/g, '');
                    if (phone) {
                      const verifyUrl = `${window.location.origin}/verify-receipt?o=${encodeURIComponent(currentOrg?.id || '')}&f=${encodeURIComponent(feeRecord.id || '')}`;
                      const msg =
                        `Salaam ${feeRecord.studentName}! 🎓\n\n` +
                        `Lacagtaada bishii *${feeRecord.month}* waa la qabtay ✅\n\n` +
                        `📄 Risiidhkaaga rasmi ah soo daji halkan:\n${verifyUrl}\n\n` +
                        `💳 Lacagta: *$${feeRecord.amount}*\n` +
                        `📅 Taariikhda: ${new Date().toLocaleDateString()}\n\n` +
                        `Mahadsanid! — ${currentOrg?.name || ''}`;
                      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                    }
                    setActiveModal('viewReceipt');
                  } else {
                    showAlert('Cillad ayaa dhacday intii lacag bixinta la kaydinayey.', 'error');
                  }
                }}
                className="p-5 space-y-4 text-slate-800"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ardayga / Student</label>
                  <select
                    required
                    value={paymentStudentId}
                    onChange={(e) => {
                      const sid = e.target.value;
                      setPaymentStudentId(sid);
                      const st = orgStudents.find(s => s.id === sid);
                      if (st) setPaymentAmount(st.fee || 50);
                    }}
                    className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-slate-900 focus:outline-none text-sm font-semibold text-slate-800 cursor-pointer transition-colors"
                  >
                    <option value="">— Dooro Ardayga —</option>
                    {orgStudents.slice().sort((a, b) => a.fullName.localeCompare(b.fullName)).map(student => (
                      <option key={student.id} value={student.id}>
                        {student.fullName}{student.studentId ? ` · ${student.studentId}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedStudentObj && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                      {selectedStudentObj.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{selectedStudentObj.fullName}</p>
                      <p className="text-[10px] text-slate-500">
                        {selectedStudentObj.studentId && <span className="font-mono">ID: {selectedStudentObj.studentId} · </span>}
                        Fee caadiga: <span className="font-bold text-emerald-700">${selectedStudentObj.fee || 50}/bishii</span>
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cadadka / Amount ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                      <input
                        type="number" required min="1"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-slate-900 focus:outline-none text-sm font-bold text-slate-800 transition-colors"
                      />
                    </div>
                    {selectedStudentObj?.fee && Number(paymentAmount) !== Number(selectedStudentObj.fee) && (
                      <p className="text-[10px] text-amber-600 font-semibold mt-1">⚠ Fee caadiga: ${selectedStudentObj.fee}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bisha / Month</label>
                    <select
                      required value={paymentMonth}
                      onChange={(e) => setPaymentMonth(e.target.value)}
                      className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-slate-900 focus:outline-none text-sm font-semibold text-slate-800 cursor-pointer transition-colors"
                    >
                      {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                {paymentStudentId && (
                  <div className="bg-slate-900 rounded-2xl p-4 text-white">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Koobaridda / Summary</p>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-400">Ardayga</span>
                      <span className="font-bold truncate max-w-[60%]">{selectedStudentObj?.fullName || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-400">Bisha</span>
                      <span className="font-bold">{paymentMonth}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-700 pt-2 mt-2">
                      <span className="text-slate-400 text-xs">Lacagta La Bixinayaa</span>
                      <span className="text-xl font-black text-emerald-400">${paymentAmount}</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setActiveModal(null)}
                    className="flex-1 py-3 text-slate-600 hover:bg-slate-100 rounded-2xl cursor-pointer font-bold text-sm transition-colors border border-slate-200">
                    Iska daa
                  </button>
                  <button type="submit" disabled={!paymentStudentId}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl cursor-pointer transition-all shadow-md">
                    ✓ Approve & Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal - Create/Edit Class Session */}
      {activeModal === 'addClassSession' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100/80 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {selectedClassSession ? 'Wax ka bedel Class Session' : 'Abuur Class Session Cusub'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddClassSessionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Class Code *</label>
                  <input
                    type="text" required placeholder="e.g. EL26"
                    value={classSessionForm.classCode}
                    onChange={(e) => setClassSessionForm({ ...classSessionForm, classCode: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Max Capacity *</label>
                  <input
                    type="number" required min={5} max={100}
                    value={classSessionForm.capacity}
                    onChange={(e) => setClassSessionForm({ ...classSessionForm, capacity: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Select Subject *</label>
                <select
                  value={classSessionForm.subjectId}
                  onChange={(e) => {
                    const sId = e.target.value;
                    const sub = allOrgSubjects.find(s => s.id === sId);
                    setClassSessionForm({
                      ...classSessionForm,
                      subjectId: sId,
                      teacherId: sub?.teacherId || '',
                      roomId: sub?.roomId || '',
                      days: sub?.days || []
                    });
                  }}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none font-semibold text-slate-700"
                >
                  <option value="">-- Dooro Maaddada --</option>
                  {allOrgSubjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Assigned Teacher *</label>
                  <select
                    value={classSessionForm.teacherId}
                    onChange={(e) => setClassSessionForm({ ...classSessionForm, teacherId: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none font-semibold text-slate-700"
                  >
                    <option value="">-- Choose Teacher --</option>
                    {allOrgTeachers.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Assigned Room *</label>
                  <select
                    value={classSessionForm.roomId}
                    onChange={(e) => setClassSessionForm({ ...classSessionForm, roomId: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none font-semibold text-slate-700"
                  >
                    <option value="">-- Choose Room --</option>
                    {allOrgRooms.map(r => (
                      <option key={r.id} value={r.id}>{r.roomNumber} ({r.building})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start Time *</label>
                  <input
                    type="time" required
                    value={classSessionForm.startTime}
                    onChange={(e) => setClassSessionForm({ ...classSessionForm, startTime: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">End Time *</label>
                  <input
                    type="time" required
                    value={classSessionForm.endTime}
                    onChange={(e) => setClassSessionForm({ ...classSessionForm, endTime: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Maalmaha (Select Days) *</label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEK_DAYS.map(day => {
                    const isSelected = classSessionForm.days.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          let updated = [...classSessionForm.days];
                          if (isSelected) {
                            updated = updated.filter(d => d !== day);
                          } else {
                            updated.push(day);
                          }
                          setClassSessionForm({ ...classSessionForm, days: updated });
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected ? 'bg-black text-white border-black shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedClassSession && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Session Status *</label>
                  <select
                    value={classSessionForm.status}
                    onChange={(e: any) => setClassSessionForm({ ...classSessionForm, status: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none font-semibold text-slate-700"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}

              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-2xl">
                  <p className="text-[11px] font-bold text-red-700 leading-relaxed">{formError}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer">
                  {selectedClassSession ? 'Update Session' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Add/Edit Room */}
      {activeModal === 'addRoom' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100/80 flex flex-col space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              {selectedRoom ? 'Wax ka bedel Qolka Class-ka (Edit Class Room)' : 'Register Class Room'}
            </h3>
            <form onSubmit={handleAddRoomSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Room Name/Number</label>
                  <input
                    type="text" required placeholder="e.g. Room 102"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Building Area</label>
                  <input
                    type="text" required placeholder="e.g. Science Block"
                    value={roomForm.building}
                    onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Seating Capacity</label>
                  <input
                    type="number" required min="1"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">{t('common.status')}</label>
                  <select
                    value={roomForm.status}
                    onChange={(e: any) => setRoomForm({ ...roomForm, status: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => { setActiveModal(null); setSelectedRoom(null); }} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="bg-black hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer">
                  {selectedRoom ? 'Xaqiiji Bedelaada (Save Changes)' : 'Register Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Create Exam */}
      {activeModal === 'addExam' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100/80 flex flex-col space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Plan {t('exams.newExam')}</h3>
            <form onSubmit={handleAddExamSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Exam Title</label>
                <input
                  type="text" required placeholder="e.g. Mid-Term Biology Exam"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={examForm.type === 'school' ? 'col-span-2' : ''}>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Exam Scope Type</label>
                  <select
                    value={examForm.type}
                    onChange={(e: any) => {
                      const newType = e.target.value;
                      setExamForm({
                        ...examForm,
                        type: newType,
                        subjectId: '',
                        targetClass: newType === 'school' ? 'All Rooms / Whole School' : ''
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                  >
                    <option value="school">Whole School</option>
                    <option value="class">Class Room Specific</option>
                  </select>
                </div>
                {examForm.type === 'class' && (
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Associated Class Session (Fasalka) *</label>
                    <select
                      value={examForm.sessionId || ''}
                      onChange={(e) => {
                        const csId = e.target.value;
                        const cs = allOrgClassSessions.find(c => c.id === csId);
                        const rm = cs ? allOrgRooms.find(r => r.id === cs.roomId) : null;
                        setExamForm({
                          ...examForm,
                          sessionId: csId,
                          subjectId: cs ? cs.subjectId : '',
                          targetClass: rm ? rm.roomNumber : ''
                        });
                      }}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                    >
                      <option value="">-- Choose Class Session --</option>
                      {orgClassSessions.map(cs => {
                        const sub = allOrgSubjects.find(s => s.id === cs.subjectId);
                        return (
                          <option key={cs.id} value={cs.id}>
                            {cs.classCode} - {sub?.name || 'Class'} ({cs.startTime} - {cs.endTime})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="bg-black hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer">Create Exam</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Edit Exam */}
      {editingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100/80 flex flex-col space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Edit Exam Session</h3>
            <form onSubmit={handleEditExamSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Exam Title</label>
                <input
                  type="text" required placeholder="e.g. Mid-Term Biology Exam"
                  value={editExamForm.title}
                  onChange={(e) => setEditExamForm({ ...editExamForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={editExamForm.type === 'school' ? 'col-span-2' : ''}>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Exam Scope Type</label>
                  <select
                    value={editExamForm.type}
                    onChange={(e: any) => {
                      const newType = e.target.value;
                      setEditExamForm({
                        ...editExamForm,
                        type: newType,
                        subjectId: '',
                        targetClass: newType === 'school' ? 'All Rooms / Whole School' : ''
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                  >
                    <option value="school">Whole School</option>
                    <option value="class">Class Room Specific</option>
                  </select>
                </div>
                {editExamForm.type === 'class' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Associated Subject</label>
                    <select
                      value={editExamForm.subjectId}
                      onChange={(e) => {
                        const sId = e.target.value;
                        const selectedSubject = orgSubjects.find(s => s.id === sId);
                        const associatedRoom = selectedSubject ? orgRooms.find(r => r.id === selectedSubject.roomId) : null;
                        setEditExamForm({
                          ...editExamForm,
                          subjectId: sId,
                          targetClass: associatedRoom ? associatedRoom.roomNumber : ''
                        });
                      }}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                    >
                      <option value="">-- Choose Subject --</option>
                      {orgSubjects.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.startTime} - {sub.endTime})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {editExamForm.type === 'class' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Target Exam Room</label>
                  <select
                    value={editExamForm.targetClass}
                    onChange={(e) => setEditExamForm({ ...editExamForm, targetClass: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none"
                  >
                    <option value="">-- Choose Room --</option>
                    {(() => {
                      const selectedSubject = orgSubjects.find(s => s.id === editExamForm.subjectId);
                      const allowedRooms = selectedSubject 
                        ? orgRooms.filter(r => r.id === selectedSubject.roomId) 
                        : [];
                      return allowedRooms.map(r => (
                        <option key={r.id} value={r.roomNumber}>
                          {r.roomNumber}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setEditingExam(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="bg-black hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Premium Enter Marks */}
      {activeModal === 'enterMarks' && selectedExam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl border border-slate-100 flex flex-col h-[85vh] max-h-[800px] overflow-hidden relative text-slate-900"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-10 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                  <Edit2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">Enter Marks</h3>
                  <p className="text-sm text-slate-500 font-medium">{selectedExam.title}</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-6 scrollbar-thin">
              {(() => {
                const targetStudents = examTeacherSessionId
                  ? allOrgStudents.filter(s => s.classSessions?.includes(examTeacherSessionId))
                  : (selectedExam.type === 'school' 
                      ? allOrgStudents 
                      : allOrgStudents.filter(s => 
                          (selectedExam.sessionId && s.classSessions?.includes(selectedExam.sessionId)) || 
                          (selectedExam.subjectId && s.subjects?.includes(selectedExam.subjectId))
                        ));
                
                if (targetStudents.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <Users size={48} className="mb-4 opacity-50" />
                      <p className="text-lg font-bold text-slate-500">No Students Found</p>
                      <p className="text-sm">There are no students registered in this class.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3 max-w-3xl mx-auto">
                    {targetStudents.map(student => {
                      const marks = marksData[student.id] || 0;
                      let grade = 'F';
                      let gColor = 'text-red-600 bg-red-50 border-red-200';
                      if (marks >= 90) { grade = 'A+'; gColor = 'text-emerald-700 bg-emerald-50 border-emerald-200'; }
                      else if (marks >= 80) { grade = 'A'; gColor = 'text-teal-700 bg-teal-50 border-teal-200'; }
                      else if (marks >= 70) { grade = 'B'; gColor = 'text-blue-700 bg-blue-50 border-blue-200'; }
                      else if (marks >= 60) { grade = 'C'; gColor = 'text-indigo-700 bg-indigo-50 border-indigo-200'; }
                      else if (marks >= 50) { grade = 'D'; gColor = 'text-orange-700 bg-orange-50 border-orange-200'; }

                      return (
                        <div key={student.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 hover:border-indigo-300 transition-colors">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                              {student.fullName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-slate-900 leading-tight">{student.fullName}</h4>
                              <p className="text-xs font-mono text-slate-500 font-semibold">{student.studentId || student.id}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg border ${gColor}`}>
                              {grade}
                            </div>
                            <div className="relative">
                              <input
                                type="number" min="0" max="100"
                                value={marks || ''}
                                onChange={(e) => setMarksData({ ...marksData, [student.id]: Number(e.target.value) })}
                                className="w-24 pl-4 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-center focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800"
                                placeholder="0"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-500">
                {(() => {
                  const values = Object.values(marksData) as number[];
                  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
                  return <span>Class Average: <strong className="text-indigo-600 text-lg">{avg}%</strong></span>;
                })()}
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setActiveModal(null)} className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-all cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const targetStudents = examTeacherSessionId
                      ? allOrgStudents.filter(s => s.classSessions?.includes(examTeacherSessionId))
                      : (selectedExam.type === 'school' 
                          ? allOrgStudents 
                          : allOrgStudents.filter(s => 
                              (selectedExam.sessionId && s.classSessions?.includes(selectedExam.sessionId)) || 
                              (selectedExam.subjectId && s.subjects?.includes(selectedExam.subjectId))
                            ));

                    const resultsArray = targetStudents.map(s => {
                      const marks = marksData[s.id] || 0;
                      let grade = 'F';
                      if (marks >= 90) grade = 'A+';
                      else if (marks >= 80) grade = 'A';
                      else if (marks >= 70) grade = 'B';
                      else if (marks >= 60) grade = 'C';
                      else if (marks >= 50) grade = 'D';

                      return {
                        studentId: s.id,
                        studentName: s.fullName,
                        marks,
                        grade
                      };
                    });
                    const total = resultsArray.reduce((sum, r) => sum + r.marks, 0);
                    const avg = resultsArray.length > 0 ? total / resultsArray.length : 0;
                    submitMarks(selectedExam.id, resultsArray, Math.round(avg * 10) / 10);
                    setSuccessMessage('Exam results saved and awaiting admin approval.');
                    setActiveModal(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  Submit Scores
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {sharingExam && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2rem] max-w-2xl w-full p-6 md:p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden relative text-slate-900"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setSharingExam(null);
                  setShareSearchQuery('');
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm shrink-0">
                  <Share2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">La Wadaag Natiijada Imtixaanka</h3>
                  <p className="text-xs text-slate-500 font-semibold">Exam-ka: <strong className="text-slate-700">{sharingExam.title}</strong></p>
                </div>
              </div>

              <div className="space-y-6 overflow-y-auto flex-1 pr-1.5 scrollbar-thin">
                {/* 1. General Link */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Portal-ka Guud (General Results Search)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Kani waa link-ga guud ee portal-ka natiijooyinka. Ardaydu waxay geli karaan ID-gooda gaarka ah si ay u arkaan natiijooyinkooda.
                  </p>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl font-mono text-xs text-slate-700 select-all overflow-x-auto whitespace-nowrap">
                      {window.location.origin + '/results'}
                    </div>
                    <button
                      onClick={() => handleCopy(window.location.origin + '/results', 'general')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                        copiedStates['general']
                          ? 'bg-emerald-600 text-white'
                          : 'bg-black hover:bg-slate-800 text-white shadow-sm'
                      }`}
                    >
                      {copiedStates['general'] ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedStates['general'] ? 'Copied!' : 'Copy Portal Link'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Individual Student Links */}
                <div>
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Natiijooyinka Shaqsiga ah ee Ardayda (Direct Student Links)</h4>
                    <input
                      type="text"
                      placeholder="Raadi Arday (Search student...)"
                      value={shareSearchQuery}
                      onChange={(e) => setShareSearchQuery(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-black max-w-xs font-medium"
                    />
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                    {(() => {
                      const list = getSharingStudentsList();
                      if (list.length === 0) {
                        return (
                          <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                            <Users className="mx-auto text-slate-300 mb-2" size={24} />
                            <p className="text-xs text-slate-500 font-medium">Wax natiijo ah oo la helay ma jiraan.</p>
                          </div>
                        );
                      }
                      return list.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-3.5 bg-white border border-slate-150 rounded-xl hover:border-slate-300 transition-colors gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                            <div className="flex gap-2 text-[11px] text-slate-500 mt-0.5 font-medium">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">ID: {item.visibleId || 'N/A'}</span>
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Marks: {item.marks}%</span>
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Grade: {item.grade}</span>
                            </div>
                          </div>
                          {item.link ? (
                            <button
                              onClick={() => handleCopy(item.link, item.id)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0 ${
                                copiedStates[item.id]
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {copiedStates[item.id] ? <Check size={12} /> : <Link2 size={12} />}
                              <span>{copiedStates[item.id] ? 'Copied!' : 'Copy Link'}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-red-500 font-medium italic">No ID available</span>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSharingExam(null);
                    setShareSearchQuery('');
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Xidh (Close)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Center-Aligned Animated Success Popup Card */}
      <AnimatePresence>
        {successMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", duration: 0.45, bounce: 0.25 }}
              className="bg-white rounded-[2rem] max-w-sm w-full p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-slate-100 flex flex-col items-center text-center space-y-5 relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
              
              {/* Close Button */}
              <button
                onClick={() => setSuccessMessage(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Icon Container with Pulsing & Spring */}
              <motion.div
                initial={{ scale: 0.5, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.05, stiffness: 220, damping: 14 }}
                className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border-4 border-emerald-100/60 shadow-sm"
              >
                <CheckCircle2 size={36} className="stroke-[2.5]" />
              </motion.div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-slate-900 tracking-tight">done</h4>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed px-1">
                  {successMessage}
                </p>
              </div>

              {/* Confirm Action Button */}
              <button
                onClick={() => setSuccessMessage(null)}
                className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md hover:shadow-lg active:translate-y-0 cursor-pointer"
              >
                okey
              </button>

              {/* Progress Indicator for Auto-Dismiss */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100/80 overflow-hidden">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 4, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <input 
        type="file" 
        ref={marksFileInputRef}
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
        onChange={handleExcelMarksUpload} 
      />
    </div>
  );
}
















import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, Organization, Student, Teacher, Subject, Room, 
  AttendanceRecord, FeeRecord, SalaryRecord, Exam, ExamResultRecord, ClassSession
} from '../types';
import { db, auth, createSecondaryAuthUser, handleFirestoreError, OperationType } from '../firebase';
import { 
  doc, setDoc, updateDoc, deleteDoc, collection, collectionGroup, onSnapshot, getDoc, getDocs, query, where, limit
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword, sendPasswordResetEmail, onAuthStateChanged 
} from 'firebase/auth';

const memoryStorage: { [key: string]: string } = {};
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`localStorage.getItem failed for key "${key}":`, e);
    }
    return memoryStorage[key] || null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn(`localStorage.setItem failed for key "${key}":`, e);
    }
    memoryStorage[key] = value;
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`localStorage.removeItem failed for key "${key}":`, e);
    }
    delete memoryStorage[key];
  }
};

interface AppContextType {
  // Mode Selection
  isFirebaseMode: boolean;
  setFirebaseMode: (val: boolean) => void;

  // Active User / Tenant
  currentUser: UserProfile | null;
  currentOrg: Organization | null;
  loading: boolean;
  error: string | null;
  suspendedUser: UserProfile | { email: string; fullName?: string } | null;
  setSuspendedUser: (user: UserProfile | { email: string; fullName?: string } | null) => void;

  // Global Lists
  organizations: Organization[];
  users: UserProfile[];
  students: Student[];
  teachers: Teacher[];
  subjects: Subject[];
  rooms: Room[];
  classSessions: ClassSession[];
  attendanceRecords: AttendanceRecord[];
  feeRecords: FeeRecord[];
  salaryRecords: SalaryRecord[];
  exams: Exam[];
  examResults: ExamResultRecord[];

  // Auth Operations
  login: (email: string, pass: string) => Promise<UserProfile>;
  logout: () => void;
  registerUser: (user: Partial<UserProfile>) => void;
  changePassword: (newPassword: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserProfile: (uid: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteStaffMember: (uid: string) => Promise<void>;

  // Core Operations
  addOrganization: (org: Omit<Organization, 'id' | 'createdAt'>, adminPassword?: string) => Promise<void>;
  updateOrganization: (id: string, updates: Partial<Organization>) => void;
  deleteOrganization: (id: string) => void;

  addStudent: (student: Omit<Student, 'id' | 'studentId' | 'createdAt'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  bulkImportStudents: (studentsData: any[]) => { successCount: number; errors: string[] };

  addTeacher: (teacher: Omit<Teacher, 'id' | 'createdAt'>) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;

  addSubject: (subject: Omit<Subject, 'id'>) => Promise<string | null>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<string | null>;
  deleteSubject: (id: string) => void;

  addClassSession: (session: Omit<ClassSession, 'id' | 'createdAt'>) => Promise<string | null>;
  updateClassSession: (id: string, updates: Partial<ClassSession>) => Promise<string | null>;
  deleteClassSession: (id: string) => void;

  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;

  saveAttendance: (record: Omit<AttendanceRecord, 'id' | 'createdAt'>) => void;
  approveFeePayment: (id: string) => void;
  updateFeePaymentStatus: (id: string, status: 'unpaid' | 'approved' | 'cancelled') => Promise<void>;
  addFeePayment: (studentId: string, amount: number, month: string) => Promise<FeeRecord | null>;
  approveSalaryPayment: (id: string) => void;

  createExam: (exam: Omit<Exam, 'id' | 'createdAt'>) => void;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  submitMarks: (examId: string, results: any[], average: number) => void;
  approveExamResults: (examId: string) => void;
  searchStudentResults: (studentId: string) => Promise<{ student: Student; results: any[]; subjects: Subject[] } | null>;
  searchStudentFees: (studentId: string, orgId: string) => Promise<{ student: Student; fees: FeeRecord[] } | null>;
  selectActiveOrg: (org: Organization | null) => void;
  seedSampleData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper for generating custom human-friendly IDs
const generateId = (prefix: string, index: number) => {
  return `${prefix}-${1000 + index}`;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirebaseMode, setFirebaseMode] = useState<boolean>(true); // Exclusively Firebase mode
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = safeStorage.getItem('ileys_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(() => {
    const saved = safeStorage.getItem('ileys_org');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [suspendedUser, setSuspendedUser] = useState<UserProfile | { email: string; fullName?: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      safeStorage.setItem('ileys_user', JSON.stringify(currentUser));
    } else {
      safeStorage.removeItem('ileys_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentOrg) {
      safeStorage.setItem('ileys_org', JSON.stringify(currentOrg));
    } else {
      safeStorage.removeItem('ileys_org');
    }
  }, [currentOrg]);

  // States for Database Collections
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examResults, setExamResults] = useState<ExamResultRecord[]>([]);

  // 1. Listen to Authentication State changes & Load User Profile
  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth is not initialized. Skipping auth listener.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            let profile = userDocSnap.data() as UserProfile;
            
            if (profile.role === 'teacher' && !profile.teacherId) {
              try {
                const teachersRef = collection(db, 'organizations', profile.organizationId, 'teachers');
                const q = query(teachersRef, where('email', '==', profile.email));
                const querySnap = await getDocs(q);
                if (!querySnap.empty) {
                  const teacherId = querySnap.docs[0].id;
                  profile = { ...profile, teacherId };
                  await setDoc(userDocRef, profile, { merge: true });
                }
              } catch (err) {
                console.error('Failed to resolve teacherId for teacher:', err);
              }
            }
            if (profile.active === false) {
              console.warn('Suspended user detected, signing out:', profile.email);
              setSuspendedUser(profile);
              await signOut(auth);
              setCurrentUser(null);
              setCurrentOrg(null);
              setLoading(false);
              return;
            }
            setCurrentUser(profile);
            
            if (profile.role !== 'superadmin') {
              const orgDocSnap = await getDoc(doc(db, 'organizations', profile.organizationId));
              if (orgDocSnap.exists()) {
                setCurrentOrg(orgDocSnap.data() as Organization);
              }
            } else {
              setCurrentOrg(null);
            }
          } else {
            // Fallback for Super Admin and Demo matching emails
            const trimmedEmail = firebaseUser.email?.toLowerCase() || '';
            const isSuperAdminEmail = trimmedEmail === 'mahadmohamed@gmail.com' || 
                                      trimmedEmail === 'mahadmohamedone@gmail.com' || 
                                      trimmedEmail === 'alimahad402@gmail.com' ||
                                      trimmedEmail === 'mahadmoh178@gmail.com';
            const isDemoEmail = trimmedEmail === 'mahad@ileysacademy.com' || 
                                trimmedEmail === 'sahra@ileysacademy.com';

            if (isSuperAdminEmail) {
              const superUser: UserProfile = {
                uid: firebaseUser.uid,
                email: trimmedEmail,
                fullName: 'Mahad Mohamed (Super Admin)',
                role: 'superadmin',
                organizationId: 'all',
                active: true,
                createdAt: new Date().toISOString()
              };
              await setDoc(userDocRef, superUser);
              setCurrentUser(superUser);
              setCurrentOrg(null);
            } else if (isDemoEmail) {
              const staticId = trimmedEmail === 'mahad@ileysacademy.com' ? 't-101' : 't-102';
              let finalProfile: UserProfile | null = null;
              
              try {
                const staticDocRef = doc(db, 'users', staticId);
                const staticDocSnap = await getDoc(staticDocRef);
                if (staticDocSnap.exists()) {
                  const staticData = staticDocSnap.data() as UserProfile;
                  finalProfile = {
                    ...staticData,
                    uid: firebaseUser.uid,
                    createdAt: staticData.createdAt || new Date().toISOString()
                  };
                }
              } catch (lookupErr) {
                console.error('Failed to lookup static user profile during fallback:', lookupErr);
              }

              if (!finalProfile) {
                // Pre-create dynamic default profile for demo users if unseeded
                finalProfile = {
                  uid: firebaseUser.uid,
                  email: trimmedEmail,
                  fullName: trimmedEmail === 'mahad@ileysacademy.com' ? 'Mahad Mohamed' : 'Sahra Yusuf',
                  role: 'teacher',
                  organizationId: 'ileys-academy',
                  teacherId: staticId,
                  active: true,
                  createdAt: new Date().toISOString()
                };
              }

              await setDoc(userDocRef, finalProfile);
              setCurrentUser(finalProfile);

              const orgDocSnap = await getDoc(doc(db, 'organizations', finalProfile.organizationId));
              if (orgDocSnap.exists()) {
                setCurrentOrg(orgDocSnap.data() as Organization);
              } else {
                // Ensure a default org is set in-state if the organization doesn't exist either
                setCurrentOrg({
                  id: 'ileys-academy',
                  name: 'Ileys Academy Secondary',
                  ownerName: 'Mahad Mohamed',
                  email: 'mahad@ileysacademy.com',
                  location: 'Mogadishu, Somalia',
                  monthlySubscription: 150,
                  logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80',
                  type: 'both',
                  status: 'active',
                  createdAt: new Date().toISOString()
                });
              }
            } else {
              // No profile exists, and NOT a super admin: sign out immediately.
              console.warn('Unauthorized login attempt (no registered Firestore profile found):', trimmedEmail);
              await signOut(auth);
              setCurrentUser(null);
              setCurrentOrg(null);
              setError('Akaount-kani kama diiwaan gashan IleysHub. Fadlan la xiriir maamulaha.');
            }
          }
        } catch (err: any) {
          console.error('Error loading user profile:', err);
          setError(err.message || String(err));
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setCurrentOrg(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Guest Mode: Load global public data for unauthenticated searches (Result Portal)
  // We no longer listen to entire collections on snapshot, saving client bandwidth,
  // preventing permission errors, and adhering to strict Firebase security policies.
  useEffect(() => {
    if (currentUser) return;
    // Guest mode doesn't need heavy background listeners. 
    // Queries are executed on-demand in searchStudentResults.
  }, [currentUser]);

  // 3. Authenticated Mode: Listen to tenant-scoped collections in real-time
  useEffect(() => {
    if (!currentUser || !db) {
      if (currentUser && !db) {
        console.error("Firestore DB is not initialized. Realtime listeners skipped.");
      }
      return;
    }

    const orgId = currentUser.organizationId;
    const isSuper = currentUser.role === 'superadmin';

    let unsubOrgs = () => {};
    let unsubUsers = () => {};
    let unsubStudents = () => {};
    let unsubTeachers = () => {};
    let unsubSubjects = () => {};
    let unsubRooms = () => {};
    let unsubAttendance = () => {};
    let unsubFees = () => {};
    let unsubSalaries = () => {};
    let unsubExams = () => {};
    let unsubResults = () => {};
    let unsubClassSessions = () => {};

    if (isSuper) {
      unsubOrgs = onSnapshot(collection(db, 'organizations'), (snap) => {
        const list: Organization[] = [];
        snap.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as Organization);
        });
        setOrganizations(list);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'organizations'));

      unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const list: UserProfile[] = [];
        snap.forEach((doc) => {
          list.push({ ...doc.data(), uid: doc.id } as UserProfile);
        });
        setUsers(list);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

      unsubStudents = onSnapshot(collectionGroup(db, 'students'), (snap) => {
        const list: Student[] = [];
        snap.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as Student);
        });
        setStudents(list);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'collectionGroup:students'));

      unsubTeachers = onSnapshot(collectionGroup(db, 'teachers'), (snap) => {
        const list: Teacher[] = [];
        snap.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as Teacher);
        });
        setTeachers(list);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'collectionGroup:teachers'));

      unsubClassSessions = onSnapshot(collectionGroup(db, 'class_sessions'), (snap) => {
        const list: ClassSession[] = [];
        snap.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as ClassSession);
        });
        setClassSessions(list);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'collectionGroup:class_sessions'));

    } else {
      unsubOrgs = onSnapshot(doc(db, 'organizations', orgId), (docSnap) => {
        if (docSnap.exists()) {
          const org = { ...docSnap.data(), id: docSnap.id } as Organization;
          setOrganizations([org]);
          setCurrentOrg(org);
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, `organizations/${orgId}`));

      unsubUsers = onSnapshot(query(collection(db, 'users'), where('organizationId', '==', orgId)), (snap) => {
        const list: UserProfile[] = [];
        snap.forEach((doc) => {
          list.push({ ...doc.data(), uid: doc.id } as UserProfile);
        });
        setUsers(list);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

      unsubStudents = onSnapshot(collection(db, 'organizations', orgId, 'students'), (snap) => {
        const list: Student[] = [];
        snap.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as Student);
        });
        setStudents(list);
      }, (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/students`));

      unsubTeachers = onSnapshot(collection(db, 'organizations', orgId, 'teachers'), (snap) => {
        const list: Teacher[] = [];
        snap.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as Teacher);
        });
        setTeachers(list);
      }, (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/teachers`));

      if (currentUser.role === 'teacher') {
        if (currentUser.teacherId) {
          unsubSubjects = onSnapshot(
            query(collection(db, 'organizations', orgId, 'subjects'), where('teacherId', '==', currentUser.teacherId)),
            (snap) => {
              const list: Subject[] = [];
              snap.forEach((doc) => {
                list.push({ ...doc.data(), id: doc.id } as Subject);
              });
              setSubjects(list);
            },
            (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/subjects`)
          );
        }
      } else {
        unsubSubjects = onSnapshot(collection(db, 'organizations', orgId, 'subjects'), (snap) => {
          const list: Subject[] = [];
          snap.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as Subject);
          });
          setSubjects(list);
        }, (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/subjects`));
      }

      unsubRooms = onSnapshot(collection(db, 'organizations', orgId, 'rooms'), (snap) => {
        const list: Room[] = [];
        snap.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as Room);
        });
        setRooms(list);
      }, (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/rooms`));

      if (currentUser.role === 'teacher') {
        if (currentUser.teacherId) {
          unsubAttendance = onSnapshot(
            query(collection(db, 'organizations', orgId, 'attendance'), where('teacherId', '==', currentUser.teacherId)),
            (snap) => {
              const list: AttendanceRecord[] = [];
              snap.forEach((doc) => {
                list.push({ ...doc.data(), id: doc.id } as AttendanceRecord);
              });
              setAttendanceRecords(list);
            },
            (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/attendance`)
          );
        }
      } else {
        unsubAttendance = onSnapshot(collection(db, 'organizations', orgId, 'attendance'), (snap) => {
          const list: AttendanceRecord[] = [];
          snap.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as AttendanceRecord);
          });
          setAttendanceRecords(list);
        }, (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/attendance`));
      }

      // 1. Fee records (all roles except teacher have access)
      if (currentUser.role !== 'teacher') {
        unsubFees = onSnapshot(collection(db, 'organizations', orgId, 'fees'), (snap) => {
          const list: FeeRecord[] = [];
          snap.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as FeeRecord);
          });
          setFeeRecords(list);
        }, (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/fees`));
      } else {
        setFeeRecords([]);
      }

      // 2. Salary records
      if (currentUser.role !== 'teacher' && currentUser.role !== 'schoolstaff') {
        unsubSalaries = onSnapshot(collection(db, 'organizations', orgId, 'salary'), (snap) => {
          const list: SalaryRecord[] = [];
          snap.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as SalaryRecord);
          });
          setSalaryRecords(list);
        }, (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/salary`));
      } else if (currentUser.role === 'teacher' && currentUser.teacherId) {
        unsubSalaries = onSnapshot(
          query(collection(db, 'organizations', orgId, 'salary'), where('teacherId', '==', currentUser.teacherId)),
          (snap) => {
            const list: SalaryRecord[] = [];
            snap.forEach((doc) => {
              list.push({ ...doc.data(), id: doc.id } as SalaryRecord);
            });
            setSalaryRecords(list);
          },
          (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/salary`)
        );
      } else {
        setSalaryRecords([]);
      }

      unsubExams = onSnapshot(collection(db, 'organizations', orgId, 'exam_sessions'), (snap) => {
        const list: Exam[] = [];
        snap.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as Exam);
        });
        setExams(list);
      }, (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/exam_sessions`));

      unsubResults = onSnapshot(collection(db, 'organizations', orgId, 'exam_results'), (snap) => {
        const list: ExamResultRecord[] = [];
        snap.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as ExamResultRecord);
        });
        setExamResults(list);
      }, (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/exam_results`));

      unsubClassSessions = onSnapshot(collection(db, 'organizations', orgId, 'class_sessions'), (snap) => {
        const list: ClassSession[] = [];
        snap.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as ClassSession);
        });
        setClassSessions(list);
      }, (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/class_sessions`));
    }

    return () => {
      unsubOrgs();
      unsubUsers();
      unsubStudents();
      unsubTeachers();
      unsubSubjects();
      unsubRooms();
      unsubClassSessions();
      unsubAttendance();
      unsubFees();
      unsubSalaries();
      unsubExams();
      unsubResults();
    };
  }, [currentUser]);

  // Persistent changes helper function
  const saveStateToLocalStorage = (key: string, data: any) => {
    safeStorage.setItem(key, JSON.stringify(data));
  };

  // Auth Operations
  const login = async (email: string, pass: string): Promise<UserProfile> => {
    setLoading(true);
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    try {
      // 1. Try signing into Firebase Authentication
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
      } catch (authErr: any) {
        // If login fails, check if we should auto-create the account
        const isSuperAdminEmail = trimmedEmail === 'mahadmohamed@gmail.com' || 
                                  trimmedEmail === 'mahadmohamedone@gmail.com' || 
                                  trimmedEmail === 'alimahad402@gmail.com' ||
                                  trimmedEmail === 'mahadmoh178@gmail.com';
        const isDemoEmail = trimmedEmail === 'mahad@ileysacademy.com' || 
                            trimmedEmail === 'sahra@ileysacademy.com';

        // If it's a superadmin email, or a pre-seeded demo user
        if (isSuperAdminEmail || isDemoEmail) {
          console.log('User not found in Firebase Auth but is SuperAdmin/Demo account. Registering on-the-fly...');
          try {
            userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
          } catch (regErr: any) {
            console.error('On-the-fly registration failed:', regErr);
            throw authErr; // throw original login error if registration fails
          }
        } else {
          throw authErr; // throw original login error
        }
      }

      const firebaseUser = userCredential.user;

      // 2. Fetch User Profile from Firestore users collection
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const profile = userDocSnap.data() as UserProfile;
        if (!profile.active) {
          setSuspendedUser(profile);
          await signOut(auth);
          throw new Error('This account is suspended. Inactive users cannot login.');
        }

        const orgId = profile.organizationId;
        if (profile.role !== 'superadmin' && orgId) {
          // Fetch Organization status to verify if active
          const orgDocSnap = await getDoc(doc(db, 'organizations', orgId));
          if (orgDocSnap.exists()) {
            const org = orgDocSnap.data() as Organization;
            if (org.status !== 'active') {
              setSuspendedUser({
                email: profile.email,
                fullName: `${profile.fullName} (${org.name})`,
                role: profile.role,
                organizationId: profile.organizationId,
                active: false,
                uid: profile.uid
              });
              await signOut(auth);
              throw new Error(`Login blocked: Organization ${org.name} is ${org.status}.`);
            }
            setCurrentOrg(org);
          }
        } else {
          setCurrentOrg(null);
        }

        setCurrentUser(profile);
        setLoading(false);
        return profile;
      } else {
        // Fallback for Super Admin matching emails if doc does not exist
        if (trimmedEmail === 'mahadmohamed@gmail.com' || trimmedEmail === 'mahadmohamedone@gmail.com' || trimmedEmail === 'alimahad402@gmail.com' || trimmedEmail === 'mahadmoh178@gmail.com') {
          const superUser: UserProfile = {
            uid: firebaseUser.uid,
            email: trimmedEmail,
            fullName: 'Mahad Mohamed (Super Admin)',
            role: 'superadmin',
            organizationId: 'all',
            active: true,
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, superUser);
          setCurrentUser(superUser);
          setCurrentOrg(null);
          setLoading(false);
          return superUser;
        }

        // No registered Firestore profile found, and not superadmin: reject login.
        await signOut(auth);
        setCurrentUser(null);
        setCurrentOrg(null);
        setLoading(false);
        const errMsg = 'Akaount-kani kama diiwaan gashan IleysHub. Fadlan la xiriir maamulaha.';
        setError(errMsg);
        throw new Error(errMsg);
      }
    } catch (firebaseErr: any) {
      setLoading(false);
      let SomaliMsg = 'Cilad ayaa dhacday (Error). Fadlan hubi internet-kaaga ama dib u isku day.';
      if (firebaseErr?.code?.startsWith('auth/') || firebaseErr?.message?.includes('auth/')) {
        SomaliMsg = 'Akoonkan majiro ama xogtiisa (password/email) ayaa qaldan. Fadlan hubi xogtaada ama la xiriir maamulka.';
      }
      setError(SomaliMsg);
      throw new Error(SomaliMsg);
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    setCurrentOrg(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Firebase Auth sign out error:', err);
    }
  };

  const registerUser = async (profile: Partial<UserProfile>) => {
    const email = profile.email || '';
    const pass = profile.password || '123456';
    let uid = `u-${Date.now()}`;
    try {
      console.log('Registering user in Firebase Auth:', email);
      uid = await createSecondaryAuthUser(email, pass);
    } catch (err) {
      console.warn('Firebase Auth creation failed, using generated doc ID:', err);
    }

    const newUser: UserProfile = {
      uid,
      email,
      fullName: profile.fullName || '',
      role: profile.role || 'teacher',
      organizationId: profile.organizationId || '',
      password: pass,
      active: true,
      createdAt: new Date().toISOString(),
      // Include optional fields if provided
      ...(profile.staffDesignation ? { staffDesignation: profile.staffDesignation } : {}),
      ...(profile.permissions ? { permissions: profile.permissions } : {}),
    };

    try {
      await setDoc(doc(db, 'users', uid), newUser);
      console.log('Successfully saved user profile to Firestore:', uid);
    } catch (err) {
      console.error('Failed to save user profile to Firestore:', err);
    }
  };

  const changePassword = async (newPassword: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('No user is currently logged in.');
    }

    setLoading(true);
    try {
      if (auth.currentUser) {
        console.log('Updating password in Firebase Authentication...');
        await updatePassword(auth.currentUser, newPassword);
      }

      const updatedProfile = { ...currentUser, password: newPassword };
      setCurrentUser(updatedProfile);

      await setDoc(doc(db, 'users', currentUser.uid), {
        ...updatedProfile,
        password: newPassword
      }, { merge: true });
      console.log('Successfully synced new password to Firestore for user:', currentUser.uid);

    } catch (err: any) {
      console.error('Password change failed:', err);
      throw new Error(err.message || 'Ku guuldareystay bedelaada ereyga sirta ah.');
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    setLoading(true);
    try {
      console.log('Sending password reset email to:', email);
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent successfully!');
    } catch (err: any) {
      console.error('Password reset email failure:', err);
      throw new Error(err.message || 'Ku guuldareystay diritaanka email-ka bedelaada ereyga sirta ah.');
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
    setLoading(true);
    try {
      if (currentUser && currentUser.uid === uid) {
        const updatedProfile = { ...currentUser, ...updates };
        setCurrentUser(updatedProfile);
      }
      
      if (db) {
        await setDoc(doc(db, 'users', uid), updates, { merge: true });
        console.log('Successfully updated user profile in Firestore:', uid);
      } else {
        // Fallback for local memory storage (users list update)
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...updates } : u));
      }
    } catch (err: any) {
      console.error('Failed to update user profile:', err);
      throw new Error(err.message || 'Ku guuldareystay bedelaada xogta.');
    } finally {
      setLoading(false);
    }
  };

  const deleteStaffMember = async (uid: string): Promise<void> => {
    setLoading(true);
    try {
      if (db) {
        await deleteDoc(doc(db, 'users', uid));
        setUsers(prev => prev.filter(u => u.uid !== uid));
        console.log('Successfully deleted staff member:', uid);
      } else {
        setUsers(prev => prev.filter(u => u.uid !== uid));
      }
    } catch (err: any) {
      console.error('Failed to delete staff member:', err);
      throw new Error(err.message || 'Ku guuldareystay tirtirida staff-ka.');
    } finally {
      setLoading(false);
    }
  };

  // Organization Operations
  const addOrganization = async (orgData: Omit<Organization, 'id' | 'createdAt'>, adminPassword?: string) => {
    const adminEmail = orgData.email.trim().toLowerCase();
    const adminName = orgData.ownerName;
    const adminRole = orgData.type === 'quran' ? 'quranadmin' : 'schooladmin';
    const pwd = adminPassword || '123456';

    let authUid = `u-${Date.now()}`;
    try {
      console.log('Registering tenant admin in Firebase Authentication:', adminEmail);
      authUid = await createSecondaryAuthUser(adminEmail, pwd);
      console.log('Successfully created Firebase Auth user. UID:', authUid);
    } catch (authErr: any) {
      console.error('Firebase Auth creation failed:', authErr);
      throw new Error(`Authentication registration failed: ${authErr.message || authErr}`);
    }

    const orgId = `org-${Date.now()}`;
    const newOrg: Organization = {
      ...orgData,
      id: orgId,
      createdAt: new Date().toISOString()
    };

    const adminUser: UserProfile = {
      uid: authUid,
      email: adminEmail,
      fullName: adminName,
      role: adminRole,
      organizationId: orgId,
      active: true,
      password: pwd,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'organizations', orgId), newOrg);
      await setDoc(doc(db, 'users', adminUser.uid), adminUser);
      console.log('Successfully saved organization and admin profile to Firestore');
    } catch (err) {
      console.error('Failed to sync organization or admin user to Firestore:', err);
    }
  };

  const updateOrganization = async (id: string, updates: Partial<Organization>) => {
    try {
      await setDoc(doc(db, 'organizations', id), updates, { merge: true });
      console.log('Successfully synced organization updates to Firestore:', id);
    } catch (err) {
      console.error('Failed to sync organization update to Firestore:', err);
    }
  };

  const deleteOrganization = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'organizations', id));
      console.log('Successfully deleted organization from Firestore:', id);
    } catch (err) {
      console.error('Failed to delete organization from Firestore:', err);
    }
  };

  // Student Operations
  const addStudent = async (studentData: Omit<Student, 'id' | 'studentId' | 'createdAt'>) => {
    const orgId = studentData.organizationId;
    const stuCount = students.filter(s => s.organizationId === orgId).length;
    const id = `std-${Date.now()}`;
    const newStudent: Student = {
      ...studentData,
      id,
      studentId: generateId('STU', stuCount + 1),
      createdAt: new Date().toISOString()
    };

    const feeId = `fee-${Date.now()}`;
    const newFee: FeeRecord = {
      id: feeId,
      studentId: id,
      studentName: newStudent.fullName,
      amount: newStudent.fee,
      status: 'unpaid',
      invoiceNumber: `INV-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      organizationId: orgId
    };

    try {
      await setDoc(doc(db, 'organizations', orgId, 'students', id), newStudent);
      await setDoc(doc(db, 'organizations', orgId, 'fees', feeId), newFee);
      console.log('Successfully saved student and fee record to Firestore');
    } catch (err) {
      console.error('Firestore student save error:', err);
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    const orgId = currentUser?.organizationId || updates.organizationId;
    if (!orgId) return;
    try {
      await setDoc(doc(db, 'organizations', orgId, 'students', id), updates, { merge: true });
      console.log('Successfully updated student in Firestore');
    } catch (err) {
      console.error('Firestore student update error:', err);
    }
  };

  const deleteStudent = async (id: string) => {
    const orgId = currentUser?.organizationId;
    if (!orgId) return;
    try {
      await deleteDoc(doc(db, 'organizations', orgId, 'students', id));
      console.log('Successfully deleted student from Firestore');
    } catch (err) {
      console.error('Firestore student delete error:', err);
    }
  };

  const bulkImportStudents = (studentsData: any[]) => {
    const orgId = currentUser?.organizationId || '';
    if (!orgId) return { successCount: 0, errors: ['No active organization context found.'] };

    let successCount = 0;
    const errors: string[] = [];

    studentsData.forEach(async (row, i) => {
      if (!row.fullName) {
        errors.push(`Row ${i + 1}: Name is required`);
        return;
      }
      const stuCount = students.filter(s => s.organizationId === orgId).length + successCount;
      const id = `std-${Date.now()}-${i}`;
      const newStu: Student = {
        id,
        studentId: generateId('STU', stuCount + 1),
        fullName: row.fullName,
        studentPhone: row.studentPhone || '',
        parentPhone: row.parentPhone || '',
        address: row.address || '',
        gender: (row.gender?.toLowerCase() === 'female') ? 'female' : 'male',
        dob: row.dob || '2015-01-01',
        subjects: row.subjects || [],
        fee: Number(row.fee) || 40,
        organizationId: orgId,
        createdAt: new Date().toISOString()
      };

      const feeId = `fee-${Date.now()}-${i}`;
      const newFee: FeeRecord = {
        id: feeId,
        studentId: id,
        studentName: newStu.fullName,
        amount: newStu.fee,
        status: 'unpaid',
        invoiceNumber: `INV-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        organizationId: orgId
      };

      try {
        await setDoc(doc(db, 'organizations', orgId, 'students', id), newStu);
        await setDoc(doc(db, 'organizations', orgId, 'fees', feeId), newFee);
      } catch (err) {
        console.error('Firestore bulk import error:', err);
      }

      successCount++;
    });

    return { successCount, errors };
  };

  // Teacher Operations
  const addTeacher = async (teacherData: Omit<Teacher, 'id' | 'createdAt'>) => {
    const orgId = teacherData.organizationId;
    const id = `t-${Date.now()}`;
    const newTeacher: Teacher = {
      ...teacherData,
      id,
      createdAt: new Date().toISOString()
    };

    const salaryId = `sal-${Date.now()}`;
    const newSalary: SalaryRecord = {
      id: salaryId,
      teacherId: id,
      teacherName: newTeacher.fullName,
      amount: newTeacher.salary,
      status: 'pending',
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      organizationId: orgId
    };

    try {
      await setDoc(doc(db, 'organizations', orgId, 'teachers', id), newTeacher);
      await setDoc(doc(db, 'organizations', orgId, 'salary', salaryId), newSalary);

      // Now sync subjects!
      if (teacherData.subjects && teacherData.subjects.length > 0) {
        for (const subId of teacherData.subjects) {
          await setDoc(doc(db, 'organizations', orgId, 'subjects', subId), {
            teacherId: id,
            teacherName: teacherData.fullName
          }, { merge: true });
        }
      }

      await registerUser({
        email: teacherData.email,
        fullName: teacherData.fullName,
        role: 'teacher',
        organizationId: orgId,
        password: teacherData.password
      });
      console.log('Successfully saved teacher and pending salary to Firestore');
    } catch (err) {
      console.error('Firestore teacher save error:', err);
    }
  };

  const updateTeacher = async (id: string, updates: Partial<Teacher>) => {
    const orgId = currentUser?.organizationId || updates.organizationId;
    if (!orgId) return;
    try {
      await setDoc(doc(db, 'organizations', orgId, 'teachers', id), updates, { merge: true });
      
      // Now sync subjects!
      if (updates.subjects) {
        // Find existing subjects assigned to this teacher to clear them if they were removed
        const assignedSubjects = subjects.filter(s => s.teacherId === id && s.organizationId === orgId);
        for (const sub of assignedSubjects) {
          if (!updates.subjects.includes(sub.id)) {
            // Remove teacher from subject
            await setDoc(doc(db, 'organizations', orgId, 'subjects', sub.id), {
              teacherId: '',
              teacherName: ''
            }, { merge: true });
          }
        }

        // Set teacher on selected subjects
        for (const subId of updates.subjects) {
          await setDoc(doc(db, 'organizations', orgId, 'subjects', subId), {
            teacherId: id,
            teacherName: updates.fullName || ''
          }, { merge: true });
        }
      }

      console.log('Successfully updated teacher in Firestore');
    } catch (err) {
      console.error('Firestore teacher update error:', err);
    }
  };

  const deleteTeacher = async (id: string) => {
    const orgId = currentUser?.organizationId;
    if (!orgId) return;
    try {
      await deleteDoc(doc(db, 'organizations', orgId, 'teachers', id));
      console.log('Successfully deleted teacher from Firestore');
    } catch (err) {
      console.error('Firestore teacher delete error:', err);
    }
  };

  // Subject Operations
  const addSubject = async (subjectData: Omit<Subject, 'id'>): Promise<string | null> => {
    const orgId = subjectData.organizationId;
    if (subjectData.roomId) {
      const overlap = subjects.find(s => {
        const timeOverlap = subjectData.startTime < s.endTime && s.startTime < subjectData.endTime;
        const daysOverlap = !subjectData.days || !s.days || 
          subjectData.days.length === 0 || s.days.length === 0 ||
          subjectData.days.some(d => s.days?.includes(d));
        return s.organizationId === orgId && s.roomId === subjectData.roomId && timeOverlap && daysOverlap;
      });
      if (overlap) {
        return `Fariin Isku-dhac: Qolkan waxaa horey u deganaa maaddada "${overlap.name}" inta u dhaxeysa ${overlap.startTime} - ${overlap.endTime}. Labo maaddo isku qol iyo isku saacad/wakhti ma noqon karaan.`;
      }
    }

    if (subjectData.teacherId) {
      const teacherOverlap = subjects.find(s => {
        const timeOverlap = subjectData.startTime < s.endTime && s.startTime < subjectData.endTime;
        const daysOverlap = !subjectData.days || !s.days || 
          subjectData.days.length === 0 || s.days.length === 0 ||
          subjectData.days.some(d => s.days?.includes(d));
        return s.organizationId === orgId && s.teacherId === subjectData.teacherId && timeOverlap && daysOverlap;
      });
      if (teacherOverlap) {
        return `Fariin Isku-dhac: Macallinkan waxaa horey loogu qoray maaddada "${teacherOverlap.name}" inta u dhaxeysa ${teacherOverlap.startTime} - ${teacherOverlap.endTime}. Macallinku ma dhigi karo labo maaddo oo isku saacad/wakhti ah.`;
      }
    }

    const id = `sub-${Date.now()}`;
    const newSub: Subject = {
      ...subjectData,
      id
    };

    try {
      await setDoc(doc(db, 'organizations', orgId, 'subjects', id), newSub);
      console.log('Successfully added subject to Firestore');
    } catch (err) {
      console.error('Firestore subject save error:', err);
    }
    return null;
  };

  const updateSubject = async (id: string, updates: Partial<Subject>): Promise<string | null> => {
    const current = subjects.find(s => s.id === id);
    if (!current) return 'Subject not found';
    const orgId = current.organizationId;

    const merged = { ...current, ...updates };

    if (merged.roomId) {
      const overlap = subjects.find(s => {
        const timeOverlap = merged.startTime < s.endTime && s.startTime < merged.endTime;
        const daysOverlap = !merged.days || !s.days || 
          merged.days.length === 0 || s.days.length === 0 ||
          merged.days.some(d => s.days?.includes(d));
        return s.id !== id && s.organizationId === orgId && s.roomId === merged.roomId && timeOverlap && daysOverlap;
      });
      if (overlap) {
        return `Fariin Isku-dhac: Qolkan waxaa horey u deganaa maaddada "${overlap.name}" inta u dhaxeysa ${overlap.startTime} - ${overlap.endTime}. Labo maaddo isku qol iyo isku saacad/wakhti ma noqon karaan.`;
      }
    }

    if (merged.teacherId) {
      const teacherOverlap = subjects.find(s => {
        const timeOverlap = merged.startTime < s.endTime && s.startTime < merged.endTime;
        const daysOverlap = !merged.days || !s.days || 
          merged.days.length === 0 || s.days.length === 0 ||
          merged.days.some(d => s.days?.includes(d));
        return s.id !== id && s.organizationId === orgId && s.teacherId === merged.teacherId && timeOverlap && daysOverlap;
      });
      if (teacherOverlap) {
        return `Fariin Isku-dhac: Macallinkan waxaa horey loogu qoray maaddada "${teacherOverlap.name}" inta u dhaxeysa ${teacherOverlap.startTime} - ${teacherOverlap.endTime}. Macallinku ma dhigi karo labo maaddo oo isku saacad/wakhti ah.`;
      }
    }

    try {
      await setDoc(doc(db, 'organizations', orgId, 'subjects', id), merged);
      const relatedSessions = classSessions.filter(cs => cs.organizationId === orgId && cs.subjectId === id);
      for (const cs of relatedSessions) {
        await setDoc(doc(db, 'organizations', orgId, 'class_sessions', cs.id), {
          days: merged.days || []
        }, { merge: true });
      }
      console.log('Successfully updated subject in Firestore');
    } catch (err) {
      console.error('Firestore subject update error:', err);
    }
    return null;
  };

  const deleteSubject = async (id: string) => {
    const current = subjects.find(s => s.id === id);
    if (!current) return;
    try {
      await deleteDoc(doc(db, 'organizations', current.organizationId, 'subjects', id));
      console.log('Successfully deleted subject from Firestore');
    } catch (err) {
      console.error('Firestore subject delete error:', err);
    }
  };

  // Class Session Operations
  const addClassSession = async (sessionData: Omit<ClassSession, 'id' | 'createdAt'>): Promise<string | null> => {
    const orgId = sessionData.organizationId;
    if (!orgId) return 'Suhba la’aan: Fadlan dooro dugsi';

    // 1. Room overlap check
    if (sessionData.roomId) {
      const roomOverlap = classSessions.find(s => 
        s.organizationId === orgId &&
        s.status === 'active' &&
        s.roomId === sessionData.roomId &&
        s.days.some(d => sessionData.days.includes(d)) &&
        sessionData.startTime < s.endTime && s.startTime < sessionData.endTime
      );
      if (roomOverlap) {
        return `Fariin Isku-dhac: Qolkan waxaa ku jira Class Session kale "${roomOverlap.classCode}" isla maalmahaas iyo saacadahaas (${roomOverlap.startTime} - ${roomOverlap.endTime}). Labo fasal isku qol iyo isku saacad ma noqon karaan.`;
      }
    }

    // 2. Teacher overlap check
    if (sessionData.teacherId) {
      const teacherOverlap = classSessions.find(s => 
        s.organizationId === orgId &&
        s.status === 'active' &&
        s.teacherId === sessionData.teacherId &&
        s.days.some(d => sessionData.days.includes(d)) &&
        sessionData.startTime < s.endTime && s.startTime < sessionData.endTime
      );
      if (teacherOverlap) {
        return `Fariin Isku-dhac: Macallinkan wuxuu leeyahay Class Session kale "${teacherOverlap.classCode}" isla maalmahaas iyo saacadahaas (${teacherOverlap.startTime} - ${teacherOverlap.endTime}). Macallinku isku saacad labo fasal ma dhigi karo.`;
      }
    }

    const subjectDays = sessionData.subjectId ? (subjects.find(s => s.id === sessionData.subjectId)?.days || sessionData.days) : sessionData.days;
    const id = `cs-${Date.now()}`;
    const newSession: ClassSession = {
      ...sessionData,
      days: subjectDays,
      id,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'organizations', orgId, 'class_sessions', id), newSession);
      console.log('Successfully added class session to Firestore');
      return null;
    } catch (err) {
      console.error('Firestore class session save error:', err);
      return 'Cilad baa dhacday intii la kaydinayey fasalka';
    }
  };

  const updateClassSession = async (id: string, updates: Partial<ClassSession>): Promise<string | null> => {
    const current = classSessions.find(s => s.id === id);
    if (!current) return 'Class Session not found';
    const orgId = current.organizationId;

    const merged = { ...current, ...updates };

    // 1. Room overlap check
    if (merged.roomId) {
      const roomOverlap = classSessions.find(s => 
        s.id !== id &&
        s.organizationId === orgId &&
        s.status === 'active' &&
        s.roomId === merged.roomId &&
        s.days.some(d => merged.days.includes(d)) &&
        merged.startTime < s.endTime && s.startTime < merged.endTime
      );
      if (roomOverlap) {
        return `Fariin Isku-dhac: Qolkan waxaa ku jira Class Session kale "${roomOverlap.classCode}" isla maalmahaas iyo saacadahaas (${roomOverlap.startTime} - ${roomOverlap.endTime}). Labo fasal isku qol iyo isku saacad ma noqon karaan.`;
      }
    }

    // 2. Teacher overlap check
    if (merged.teacherId) {
      const teacherOverlap = classSessions.find(s => 
        s.id !== id &&
        s.organizationId === orgId &&
        s.status === 'active' &&
        s.teacherId === merged.teacherId &&
        s.days.some(d => merged.days.includes(d)) &&
        merged.startTime < s.endTime && s.startTime < merged.endTime
      );
      if (teacherOverlap) {
        return `Fariin Isku-dhac: Macallinkan wuxuu leeyahay Class Session kale "${teacherOverlap.classCode}" isla maalmahaas iyo saacadahaas (${teacherOverlap.startTime} - ${teacherOverlap.endTime}). Macallinku isku saacad labo fasal ma dhigi karo.`;
      }
    }

    try {
      await setDoc(doc(db, 'organizations', orgId, 'class_sessions', id), merged);
      console.log('Successfully updated class session in Firestore');
      return null;
    } catch (err) {
      console.error('Firestore class session update error:', err);
      return 'Cilad baa dhacday intii la cusboonaysiinayey fasalka';
    }
  };

  const deleteClassSession = async (id: string) => {
    const current = classSessions.find(s => s.id === id);
    if (!current) return;
    try {
      await deleteDoc(doc(db, 'organizations', current.organizationId, 'class_sessions', id));
      console.log('Successfully deleted class session from Firestore');
    } catch (err) {
      console.error('Firestore class session delete error:', err);
    }
  };

  // Room Operations
  const addRoom = async (roomData: Omit<Room, 'id'>) => {
    const orgId = roomData.organizationId;
    const id = `rm-${Date.now()}`;
    const newRoom: Room = { ...roomData, id };
    try {
      await setDoc(doc(db, 'organizations', orgId, 'rooms', id), newRoom);
      console.log('Successfully added room to Firestore');
    } catch (err) {
      console.error('Firestore room save error:', err);
    }
  };

  const updateRoom = async (id: string, updates: Partial<Room>) => {
    const orgId = currentUser?.organizationId || updates.organizationId;
    if (!orgId) return;
    try {
      await setDoc(doc(db, 'organizations', orgId, 'rooms', id), updates, { merge: true });
      console.log('Successfully updated room in Firestore');
    } catch (err) {
      console.error('Firestore room update error:', err);
    }
  };

  const deleteRoom = async (id: string) => {
    const orgId = currentUser?.organizationId;
    if (!orgId) return;
    try {
      await deleteDoc(doc(db, 'organizations', orgId, 'rooms', id));
      console.log('Successfully deleted room from Firestore');
    } catch (err) {
      console.error('Firestore room delete error:', err);
    }
  };

  // Attendance Record Operations
  const saveAttendance = async (record: Omit<AttendanceRecord, 'id' | 'createdAt'>) => {
    const orgId = record.organizationId;
    const id = `att-${Date.now()}`;
    const newRecord: AttendanceRecord = {
      ...record,
      id,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'organizations', orgId, 'attendance', id), newRecord);
      console.log('Successfully saved attendance to Firestore');
    } catch (err) {
      console.error('Firestore attendance save error:', err);
    }
  };

  // Fee Operations
  const approveFeePayment = async (id: string) => {
    const record = feeRecords.find(f => f.id === id);
    if (!record) return;
    try {
      await setDoc(doc(db, 'organizations', record.organizationId, 'fees', id), {
        status: 'approved',
        paidAt: new Date().toISOString()
      }, { merge: true });
      console.log('Successfully approved fee payment in Firestore');
    } catch (err) {
      console.error('Firestore fee approve error:', err);
    }
  };

  const updateFeePaymentStatus = async (id: string, status: 'unpaid' | 'approved' | 'cancelled') => {
    const record = feeRecords.find(f => f.id === id);
    if (!record) return;
    try {
      await setDoc(doc(db, 'organizations', record.organizationId, 'fees', id), {
        status,
        paidAt: status !== 'unpaid' ? new Date().toISOString() : null
      }, { merge: true });

      if (status === 'cancelled') {
        const newFeeId = `fee-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newFee: FeeRecord = {
          id: newFeeId,
          studentId: record.studentId,
          studentName: record.studentName,
          amount: record.amount,
          status: 'unpaid',
          invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
          month: record.month,
          organizationId: record.organizationId
        };
        await setDoc(doc(db, 'organizations', record.organizationId, 'fees', newFeeId), newFee);
      }

      console.log('Successfully updated fee payment status in Firestore');
    } catch (err) {
      console.error('Firestore fee status update error:', err);
    }
  };

  const addFeePayment = async (studentId: string, amount: number, month: string): Promise<FeeRecord | null> => {
    const orgId = currentUser?.organizationId;
    if (!orgId) return null;
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const existingRecord = feeRecords.find(f => f.studentId === studentId && f.month === month);
    const feeId = existingRecord?.id || `fee-${Date.now()}`;
    const invoiceNumber = existingRecord?.invoiceNumber || `INV-2026-${Math.floor(Math.random() * 9000 + 1000)}`;

    const newFee: FeeRecord = {
      id: feeId,
      studentId: student.id,
      studentName: student.fullName,
      amount: amount,
      status: 'approved',
      invoiceNumber: invoiceNumber,
      month: month,
      organizationId: orgId,
      paidAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'organizations', orgId, 'fees', feeId), newFee);
      console.log('Successfully saved fee payment in Firestore');
      return newFee;
    } catch (err) {
      console.error('Firestore fee payment save error:', err);
      return null;
    }
  };

  // Salary Operations
  const approveSalaryPayment = async (id: string) => {
    const record = salaryRecords.find(s => s.id === id);
    if (!record) return;
    try {
      await setDoc(doc(db, 'organizations', record.organizationId, 'salary', id), {
        status: 'paid',
        paidAt: new Date().toISOString().split('T')[0]
      }, { merge: true });
      console.log('Successfully approved salary payment in Firestore');
    } catch (err) {
      console.error('Firestore salary approve error:', err);
    }
  };

  // Exams & Marks Entry
  const createExam = async (examData: Omit<Exam, 'id' | 'createdAt'>) => {
    const orgId = examData.organizationId;
    const id = `ex-${Date.now()}`;
    const newExam: Exam = {
      ...examData,
      id,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'organizations', orgId, 'exam_sessions', id), newExam);
      console.log('Successfully created exam in Firestore');
    } catch (err) {
      console.error('Firestore exam save error:', err);
    }
  };

  const submitMarks = async (examId: string, resultsList: any[], average: number) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    const orgId = exam.organizationId;

    const existingIndex = examResults.findIndex(r => r.examId === examId);
    const id = existingIndex >= 0 ? examResults[existingIndex].id : `res-${Date.now()}`;

    const newRecord: ExamResultRecord = {
      id,
      examId,
      examTitle: exam.title,
      subjectId: exam.subjectId,
      organizationId: orgId,
      results: resultsList,
      average,
      published: false,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'organizations', orgId, 'exam_results', id), newRecord);
      console.log('Successfully submitted marks to Firestore');
    } catch (err) {
      console.error('Firestore marks submission error:', err);
    }
  };

  const approveExamResults = async (examId: string) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    const orgId = exam.organizationId;

    const resultRecord = examResults.find(r => r.examId === examId);

    try {
      await setDoc(doc(db, 'organizations', orgId, 'exam_sessions', examId), { published: true }, { merge: true });
      if (resultRecord) {
        await setDoc(doc(db, 'organizations', orgId, 'exam_results', resultRecord.id), { published: true }, { merge: true });
      }
      console.log('Successfully approved and published exam results in Firestore');
    } catch (err) {
      console.error('Firestore exam approval error:', err);
    }
  };

  const updateExam = async (id: string, updates: Partial<Exam>) => {
    const exam = exams.find(e => e.id === id);
    if (!exam) return;
    const orgId = exam.organizationId;
    try {
      await setDoc(doc(db, 'organizations', orgId, 'exam_sessions', id), updates, { merge: true });
      console.log('Successfully updated exam in Firestore');
    } catch (err) {
      console.error('Firestore exam update error:', err);
    }
  };

  const deleteExam = async (id: string) => {
    const exam = exams.find(e => e.id === id);
    if (!exam) return;
    const orgId = exam.organizationId;
    try {
      await deleteDoc(doc(db, 'organizations', orgId, 'exam_sessions', id));
      const resultRecord = examResults.find(r => r.examId === id);
      if (resultRecord) {
        await deleteDoc(doc(db, 'organizations', orgId, 'exam_results', resultRecord.id));
      }
      console.log('Successfully deleted exam and its results from Firestore');
    } catch (err) {
      console.error('Firestore exam delete error:', err);
    }
  };

  // Secure on-demand Student Transcript search for the Public Portal
  const searchStudentFees = async (studentId: string, orgId: string): Promise<{ student: Student; fees: FeeRecord[] } | null> => {
    try {
      setLoading(true);
      setError(null);
      const cleanId = studentId.trim().toUpperCase();
      
      const studentsQuery = query(
        collectionGroup(db, 'students'),
        where('studentId', '==', cleanId),
        where('organizationId', '==', orgId),
        limit(1)
      );
      
      const studentSnap = await getDocs(studentsQuery);
      if (studentSnap.empty) {
        return null;
      }
      
      const studentDoc = studentSnap.docs[0];
      const student = { ...studentDoc.data(), id: studentDoc.id } as Student;
      
      const feesQuery = query(
        collection(db, 'organizations', orgId, 'fees'),
        where('studentId', '==', student.id)
      );
      const feesSnap = await getDocs(feesQuery);
      const feesList: FeeRecord[] = [];
      feesSnap.forEach((doc) => {
        feesList.push({ ...doc.data(), id: doc.id } as FeeRecord);
      });
      
      // Sort fees by month/year descending
      feesList.sort((a, b) => new Date(b.year, b.month - 1).getTime() - new Date(a.year, a.month - 1).getTime());
      
      return { student, fees: feesList };
    } catch (err: any) {
      console.error('Error fetching student fees:', err);
      handleFirestoreError(err, OperationType.LIST, 'student_fees');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchStudentResults = async (studentId: string): Promise<{ student: Student; results: any[]; subjects: Subject[] } | null> => {
    try {
      setLoading(true);
      setError(null);
      const cleanId = studentId.trim().toUpperCase();
      
      const studentsQuery = query(
        collectionGroup(db, 'students'),
        where('studentId', '==', cleanId),
        limit(1)
      );
      
      const studentSnap = await getDocs(studentsQuery);
      if (studentSnap.empty) {
        return null;
      }
      
      const studentDoc = studentSnap.docs[0];
      const student = { ...studentDoc.data(), id: studentDoc.id } as Student;
      const orgId = student.organizationId;
      
      const resultsQuery = query(
        collection(db, 'organizations', orgId, 'exam_results'),
        where('published', '==', true)
      );
      const resultsSnap = await getDocs(resultsQuery);
      const resultsList: ExamResultRecord[] = [];
      resultsSnap.forEach((doc) => {
        resultsList.push({ ...doc.data(), id: doc.id } as ExamResultRecord);
      });
      
      const subjectsSnap = await getDocs(collection(db, 'organizations', orgId, 'subjects'));
      const subjectsList: Subject[] = [];
      subjectsSnap.forEach((doc) => {
        subjectsList.push({ ...doc.data(), id: doc.id } as Subject);
      });
      
      const matchedResults: any[] = [];
      resultsList.forEach(record => {
        if (record.published) {
          if (record.subjectId && !student.subjects.includes(record.subjectId)) {
            return;
          }
          const studentScore = record.results.find(res => res.studentId === student.id);
          if (studentScore) {
            const subject = subjectsList.find(s => s.id === record.subjectId);
            matchedResults.push({
              examTitle: record.examTitle,
              subjectName: subject ? subject.name : 'General Exam',
              marks: studentScore.marks,
              grade: studentScore.grade,
              average: record.average,
            });
          }
        }
      });
      
      return {
        student,
        results: matchedResults,
        subjects: subjectsList
      };
    } catch (err: any) {
      console.error('Error during student results search:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const selectActiveOrg = (org: Organization | null) => {
    setCurrentOrg(org);
    if (org) {
      safeStorage.setItem('ileys_org', JSON.stringify(org));
    } else {
      safeStorage.removeItem('ileys_org');
    }
  };

  const seedSampleData = async () => {
    setLoading(true);
    try {
      const orgId = 'ileys-academy';
      const newOrg: Organization = {
        id: orgId,
        name: 'Ileys Academy Secondary',
        ownerName: 'Mahad Mohamed',
        email: 'mahad@ileysacademy.com',
        location: 'Mogadishu, Somalia',
        monthlySubscription: 150,
        logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80',
        type: 'both',
        status: 'active',
        createdAt: new Date().toISOString()
      };
      
      // Write Org doc
      await setDoc(doc(db, 'organizations', orgId), newOrg);
      
      // Create some teachers
      const teachersList = [
        { id: 't-101', fullName: 'Mahad Mohamed', email: 'mahad@ileysacademy.com', phone: '+252 61 555 1111', gender: 'male', qualification: 'Master of Education', status: 'active', salary: 450, subjects: ['sub-101', 'sub-103'], createdAt: new Date().toISOString(), organizationId: orgId },
        { id: 't-102', fullName: 'Sahra Yusuf', email: 'sahra@ileysacademy.com', phone: '+252 61 555 2222', gender: 'female', qualification: 'BSc in Mathematics', status: 'active', salary: 400, subjects: ['sub-102'], createdAt: new Date().toISOString(), organizationId: orgId }
      ];
      for (const t of teachersList) {
        await setDoc(doc(db, 'organizations', orgId, 'teachers', t.id), t);
      }
      
      // Create corresponding user profiles so they can log in if they want to test
      for (const t of teachersList) {
        await setDoc(doc(db, 'users', t.id), {
          uid: t.id,
          email: t.email,
          fullName: t.fullName,
          role: 'teacher',
          organizationId: orgId,
          teacherId: t.id,
          active: true,
          createdAt: new Date().toISOString()
        });
      }

      // Create some subjects
      const subjectsList = [
        { id: 'sub-101', name: 'Islamic Studies & Tarbiyah', gradeLevel: 'Form 1', teacherId: 't-101', teacherName: 'Mahad Mohamed', schedule: 'Sabti - Arbaco (8:00 AM)', organizationId: orgId },
        { id: 'sub-102', name: 'Mathematics', gradeLevel: 'Form 1', teacherId: 't-102', teacherName: 'Sahra Yusuf', schedule: 'Sabti - Arbaco (9:30 AM)', organizationId: orgId },
        { id: 'sub-103', name: 'Somali Language & Lit', gradeLevel: 'Form 1', teacherId: 't-101', teacherName: 'Mahad Mohamed', schedule: 'Sabti - Arbaco (11:00 AM)', organizationId: orgId }
      ];
      for (const s of subjectsList) {
        await setDoc(doc(db, 'organizations', orgId, 'subjects', s.id), s);
      }

      // Create some rooms
      const roomsList = [
        { id: 'r-101', name: 'Class Form 1A', capacity: 40, type: 'classroom', notes: 'Main building first floor', organizationId: orgId },
        { id: 'r-102', name: 'Class Form 1B', capacity: 35, type: 'classroom', notes: 'Main building second floor', organizationId: orgId }
      ];
      for (const r of roomsList) {
        await setDoc(doc(db, 'organizations', orgId, 'rooms', r.id), r);
      }

      // Create some students
      const studentsList = [
        { id: 's-1001', studentId: 'S1001', fullName: 'Abdirahman Ali Barre', email: 'abdirahman@example.com', phone: '+252 61 777 0001', parentPhone: '+252 61 888 0001', gender: 'male', dob: '2010-05-12', address: 'Wadajir, Mogadishu', enrollmentDate: new Date().toISOString().split('T')[0], status: 'active', monthlyFee: 25, gradeLevel: 'Form 1', roomId: 'r-101', roomName: 'Class Form 1A', subjects: ['sub-101', 'sub-102', 'sub-103'], classSessions: ['cs-101', 'cs-102'], photoUrl: '', organizationId: orgId, createdAt: new Date().toISOString() },
        { id: 's-1002', studentId: 'S1002', fullName: 'Fartun Mohamed Warsame', email: 'fartun@example.com', phone: '+252 61 777 0002', parentPhone: '+252 61 888 0002', gender: 'female', dob: '2011-02-20', address: 'Hodan, Mogadishu', enrollmentDate: new Date().toISOString().split('T')[0], status: 'active', monthlyFee: 25, gradeLevel: 'Form 1', roomId: 'r-101', roomName: 'Class Form 1A', subjects: ['sub-101', 'sub-102', 'sub-103'], classSessions: ['cs-101', 'cs-102'], photoUrl: '', organizationId: orgId, createdAt: new Date().toISOString() },
        { id: 's-1003', studentId: 'S1003', fullName: 'Ahmed Hassan Duale', email: 'ahmed@example.com', phone: '+252 61 777 0003', parentPhone: '+252 61 888 0003', gender: 'male', dob: '2009-11-05', address: 'Howlwadaag, Mogadishu', enrollmentDate: new Date().toISOString().split('T')[0], status: 'active', monthlyFee: 30, gradeLevel: 'Form 1', roomId: 'r-102', roomName: 'Class Form 1B', subjects: ['sub-101', 'sub-102'], classSessions: ['cs-101'], photoUrl: '', organizationId: orgId, createdAt: new Date().toISOString() }
      ];
      for (const s of studentsList) {
        await setDoc(doc(db, 'organizations', orgId, 'students', s.id), s);
      }

      // Create some initial Class Sessions
      const classSessionsList = [
        {
          id: 'cs-101',
          classCode: 'EL26',
          subjectId: 'sub-102',
          teacherId: 't-102',
          roomId: 'r-101',
          startTime: '13:00',
          endTime: '14:00',
          days: ['Mon', 'Wed', 'Fri'],
          capacity: 30,
          status: 'active',
          studentsCount: 3,
          organizationId: orgId,
          createdAt: new Date().toISOString()
        },
        {
          id: 'cs-102',
          classCode: 'CP26',
          subjectId: 'sub-101',
          teacherId: 't-101',
          roomId: 'r-101',
          startTime: '14:00',
          endTime: '15:00',
          days: ['Mon', 'Wed', 'Fri'],
          capacity: 30,
          status: 'active',
          studentsCount: 2,
          organizationId: orgId,
          createdAt: new Date().toISOString()
        }
      ];
      for (const cs of classSessionsList) {
        await setDoc(doc(db, 'organizations', orgId, 'class_sessions', cs.id), cs);
      }

      // Create some initial fee records
      const feeList = [
        { id: 'fee-101', studentId: 's-1001', studentName: 'Abdirahman Ali Barre', invoiceNumber: 'INV-1001', amount: 25, month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), status: 'approved', paidAt: new Date().toISOString(), transactionId: 'TXN-982183', paymentMethod: 'evc_plus', organizationId: orgId },
        { id: 'fee-102', studentId: 's-1002', studentName: 'Fartun Mohamed Warsame', invoiceNumber: 'INV-1002', amount: 25, month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), status: 'approved', paidAt: new Date().toISOString(), transactionId: 'TXN-982184', paymentMethod: 'e_dahab', organizationId: orgId },
        { id: 'fee-103', studentId: 's-1003', studentName: 'Ahmed Hassan Duale', invoiceNumber: 'INV-1003', amount: 30, month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), status: 'unpaid', organizationId: orgId }
      ];
      for (const f of feeList) {
        await setDoc(doc(db, 'organizations', orgId, 'fees', f.id), f);
      }

    } catch (err) {
      console.error('Failed to seed sample data:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  // Auto-sync missing fees for active students
  useEffect(() => {
    if (!currentUser?.organizationId || students.length === 0 || feeRecords.length === 0) return;
    
    const orgId = currentUser.organizationId;
    const timer = setTimeout(() => {
      let syncedCount = 0;
      
      const generateMonthStrings = (startDate: Date, endDate: Date) => {
        const months = [];
        const current = new Date(startDate);
        current.setDate(1); // avoid edge cases
        while (current <= endDate) {
          months.push(current.toLocaleString('default', { month: 'long', year: 'numeric' }));
          current.setMonth(current.getMonth() + 1);
        }
        return months;
      };
      
      const now = new Date();

      students.forEach(student => {
        const startDate = student.createdAt ? new Date(student.createdAt) : now;
        const monthsToBill = generateMonthStrings(startDate, now);
        
        monthsToBill.forEach(monthStr => {
          const hasFeeForMonth = feeRecords.some(f => f.studentId === student.id && f.month === monthStr && f.status !== 'cancelled');
          if (!hasFeeForMonth) {
            const feeId = `fee-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            const newFee: FeeRecord = {
              id: feeId,
              studentId: student.id,
              studentName: student.fullName,
              amount: student.fee,
              status: 'unpaid',
              invoiceNumber: `INV-${now.getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
              month: monthStr,
              organizationId: orgId
            };
            setDoc(doc(db, 'organizations', orgId, 'fees', feeId), newFee).catch(console.error);
            syncedCount++;
          }
        });
      });
      if (syncedCount > 0) {
        console.log(`Auto-generated ${syncedCount} missing monthly fee records for active students.`);
      }
    }, 5000); // 5 second debounce to wait for all snapshots to settle
    
    return () => clearTimeout(timer);
  }, [students, feeRecords, currentUser?.organizationId]);


  return (
    <AppContext.Provider value={{
      isFirebaseMode,
      setFirebaseMode,
      currentUser,
      currentOrg,
      loading,
      error,
      suspendedUser,
      setSuspendedUser,
      organizations,
      users,
      students,
      teachers,
      subjects,
      rooms,
      classSessions,
      attendanceRecords,
      feeRecords,
      salaryRecords,
      exams,
      examResults,
      login,
      logout,
      registerUser,
      changePassword,
      sendPasswordReset,
      updateUserProfile,
      deleteStaffMember,
      addOrganization,
      updateOrganization,
      deleteOrganization,
      addStudent,
      updateStudent,
      deleteStudent,
      bulkImportStudents,
      addTeacher,
      updateTeacher,
      deleteTeacher,
      addSubject,
      updateSubject,
      deleteSubject,
      addClassSession,
      updateClassSession,
      deleteClassSession,
      addRoom,
      updateRoom,
      deleteRoom,
      saveAttendance,
      approveFeePayment,
      updateFeePaymentStatus,
      addFeePayment,
      approveSalaryPayment,
      createExam,
      updateExam,
      deleteExam,
      submitMarks,
      approveExamResults,
      searchStudentResults,
      selectActiveOrg,
      seedSampleData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};



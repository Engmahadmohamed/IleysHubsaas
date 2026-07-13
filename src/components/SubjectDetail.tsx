import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, BookOpen, User, School, Clock, 
  Users, Award, CalendarCheck, MapPin, Building2
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SubjectDetail() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { subjects, teachers, rooms, students } = useApp();

  const subject = subjects.find(s => s.id === subjectId);

  if (!subject) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white rounded-2xl border border-gray-100 card-shadow">
        <BookOpen className="mx-auto text-slate-300 mb-4 animate-bounce" size={48} />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Subject Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">Magaalada ama aqoonsiga maaddada aad raadinayso ma jiro.</p>
        <button 
          onClick={() => navigate('/portal/subjects')}
          className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white rounded-xl text-sm font-semibold cursor-pointer"
        >
          Ku laabo Liiska Maaddooyinka
        </button>
      </div>
    );
  }

  // Resolve dependencies
  const teacher = teachers.find(t => t.id === subject.teacherId);
  const room = rooms.find(r => r.id === subject.roomId || r.roomNumber === subject.roomId);
  
  // Find all students taking this subject
  const registeredStudents = students.filter(student => student.subjects?.includes(subject.id));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <Link 
          to="/portal/subjects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} /> Back to Subject List (Maaddooyinka)
        </Link>
        <span className="text-xs font-mono font-bold px-3 py-1 bg-gray-100 rounded-full text-slate-600">
          SUBJECT ID: {subject.id}
        </span>
      </div>

      {/* Profile Header Grid */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 card-shadow grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-3 flex justify-center">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-500">
            <BookOpen size={54} />
          </div>
        </div>
        
        <div className="md:col-span-9 space-y-4 text-center md:text-left">
          <div>
            <h1 className="text-2xl md:text-3xl font-sans font-extrabold text-slate-900 tracking-tight">{subject.name}</h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center justify-center md:justify-start gap-1">
              <Clock size={14} /> Schedule: {subject.startTime} - {subject.endTime}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Class Room (Fasalka)</span>
              <span className="text-sm font-bold text-slate-800">{room ? `Room ${room.roomNumber}` : 'Room Unassigned'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Student Capacity</span>
              <span className="text-sm font-bold text-slate-800">{subject.capacity || 30} Seats</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Days (Maalmaha)</span>
              <span className="text-xs font-bold text-slate-800 block truncate" title={subject.days?.join(', ') || 'N/A'}>
                {subject.days && subject.days.length > 0 ? subject.days.join(', ') : 'Not Specified'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Subject Fee</span>
              <span className="text-sm font-bold text-emerald-600">${subject.fee ?? 50}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl col-span-2 sm:col-span-1">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Registered Students</span>
              <span className="text-sm font-bold text-indigo-600">{registeredStudents.length} Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assigned Teacher & Building details */}
        <div className="lg:col-span-4 space-y-6">
          {/* Assigned Faculty */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow space-y-4">
            <h3 className="font-sans font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-indigo-500" /> Assigned Faculty (Macallinka)
            </h3>
            
            {teacher ? (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  {teacher.profilePhoto ? (
                    <img 
                      src={teacher.profilePhoto} 
                      alt={teacher.fullName}
                      className="w-12 h-12 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border">
                      <User size={20} />
                    </div>
                  )}
                  <div>
                    <Link to={`/portal/teachers/${teacher.id}`} className="font-bold text-sm text-slate-800 hover:underline block">{teacher.fullName}</Link>
                    <span className="text-[10px] text-slate-400 font-medium block">{teacher.email}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 pt-2 border-t border-slate-50">
                  <p>Macallinka ayaa mas'uul ka ah casharka, diyaarinta imtixaanada iyo gelinta dhibcaha fasalkan.</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-xs py-2">No teacher assigned to this subject.</p>
            )}
          </div>

          {/* Location Summary */}
          {room && (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow space-y-4">
              <h3 className="font-sans font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <Building2 size={16} className="text-slate-500" /> Location Details
              </h3>
              
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Building Zone:</span>
                  <span className="font-bold text-slate-700">{room.building || 'Main Block'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Class Room #:</span>
                  <span className="font-bold text-slate-700">{room.roomNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Class Status:</span>
                  <span className={`font-bold capitalize ${room.status === 'available' ? 'text-green-600' : 'text-amber-500'}`}>{room.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Registered Students */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow space-y-4">
            <h3 className="font-sans font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-violet-500" /> Registered Class Roster ({registeredStudents.length})
            </h3>

            {registeredStudents.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs">
                Weli wax arday ah kuma diiwaan-gashna maadadan.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {registeredStudents.map(student => (
                  <Link 
                    key={student.id} 
                    to={`/portal/students/${student.id}`}
                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-300 rounded-xl transition-all flex items-center gap-3 group"
                  >
                    {student.profilePhoto ? (
                      <img 
                        src={student.profilePhoto} 
                        alt={student.fullName}
                        className="w-10 h-10 rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold">
                        {student.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-0.5 truncate">
                      <span className="font-bold text-xs text-slate-800 group-hover:text-black block truncate">{student.fullName}</span>
                      <span className="block text-[9px] text-slate-400 font-mono tracking-wider font-semibold">{student.studentId}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

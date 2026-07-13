import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, Users, Calendar, DollarSign, BookOpen, 
  User, Mail, Phone, Shield, Clock, School
} from 'lucide-react';
import { motion } from 'motion/react';

export default function TeacherDetail() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const { teachers, subjects, rooms, salaryRecords, classSessions } = useApp();

  const teacher = teachers.find(t => t.id === teacherId);

  if (!teacher) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white rounded-2xl border border-gray-100 card-shadow">
        <Users className="mx-auto text-slate-300 mb-4 animate-bounce" size={48} />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Teacher Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">Magaalada ama aqoonsiga macallinka aad raadinayso ma jiro.</p>
        <button 
          onClick={() => navigate('/portal/teachers')}
          className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white rounded-xl text-sm font-semibold cursor-pointer"
        >
          Ku laabo Liiska Macallimiinta
        </button>
      </div>
    );
  }

  // Related subjects, sessions and salaries
  const teacherSessions = (classSessions || []).filter(cs => cs.teacherId === teacher.id);
  const teacherSubjects = subjects.filter(sub => sub.teacherId === teacher.id);
  const teacherSalaries = salaryRecords.filter(s => s.teacherId === teacher.id);
  const totalPaidSalary = teacherSalaries.filter(s => s.status === 'paid').reduce((acc, s) => acc + s.amount, 0);
  const pendingSalaries = teacherSalaries.filter(s => s.status === 'pending').length;

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
          to="/portal/teachers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} /> Back to Teacher Directory (Macallimiinta)
        </Link>
        <span className="text-xs font-mono font-bold px-3 py-1 bg-gray-100 rounded-full text-slate-600">
          SYSTEM ID: {teacher.id}
        </span>
      </div>

      {/* Profile Header Grid */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 card-shadow grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-3 flex justify-center">
          {teacher.profilePhoto ? (
            <img 
              src={teacher.profilePhoto} 
              alt={teacher.fullName}
              className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border border-slate-100 shadow-inner"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
              <User size={54} />
            </div>
          )}
        </div>
        
        <div className="md:col-span-9 space-y-4 text-center md:text-left">
          <div>
            <h1 className="text-2xl md:text-3xl font-sans font-extrabold text-slate-900 tracking-tight">{teacher.fullName}</h1>
            <p className="text-sm text-indigo-600 font-bold tracking-wide uppercase mt-1">Professional Faculty Member</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Email Address</span>
              <span className="text-xs font-semibold text-slate-700 truncate block">{teacher.email}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Phone Number</span>
              <span className="text-sm font-semibold text-slate-700 block">{teacher.phone || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Home Address</span>
              <span className="text-xs font-semibold text-slate-700 truncate block" title={teacher.address || 'N/A'}>{teacher.address || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Contractual Monthly Salary</span>
              <span className="text-sm font-bold text-emerald-600">${teacher.salary || 0}/Month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Payroll & Operations summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Stats Panel */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow space-y-4">
            <h3 className="font-sans font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} className="text-blue-500" /> Payroll Summary
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-semibold text-slate-500">Earned To Date</span>
                <span className="text-sm font-bold text-green-600">${totalPaidSalary}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-semibold text-slate-500">Pending Approvals</span>
                <span className={`text-sm font-bold ${pendingSalaries > 0 ? 'text-red-500 animate-pulse' : 'text-green-600'}`}>
                  {pendingSalaries} Months(s)
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-semibold text-slate-500">Subjects Assigned</span>
                <span className="text-sm font-bold text-slate-700">{teacherSubjects.length}</span>
              </div>
            </div>
          </div>

          {/* Time Schedules */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow space-y-4">
            <h3 className="font-sans font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} className="text-slate-500" /> Weekly Time Slots
            </h3>
            
            {(!teacher.timeSchedule || teacher.timeSchedule.length === 0) ? (
              <p className="text-slate-400 text-xs">No active schedule registered yet.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {teacher.timeSchedule.map((slot, index) => (
                  <div key={index} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700">{slot.day}</span>
                    <span className="font-mono text-slate-500">{slot.startTime} - {slot.endTime}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Teaching Loads & Salary Ledger */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Class Sessions */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={16} className="text-violet-500" /> Assigned Class Sessions ({teacherSessions.length})
              </h3>
              <span className="text-xs text-slate-400">Jadwalka xiisadaha uu dhigo</span>
            </div>

            {teacherSessions.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs">
                Macallinkan looma dhiibin wax Class Session ah weli (No class sessions assigned).
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teacherSessions.map(cs => {
                  const sub = subjects.find(s => s.id === cs.subjectId);
                  const rm = (rooms || []).find(r => r.id === cs.roomId);
                  return (
                    <div 
                      key={cs.id} 
                      className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col justify-between hover:border-black transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md uppercase font-mono">
                            {cs.classCode}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            {cs.days.join(', ')}
                          </span>
                        </div>
                        <span className="font-bold text-sm text-slate-900 block pt-1">{sub?.name || 'Maaddo'}</span>
                        <p className="text-[10px] text-indigo-600 font-mono font-semibold">
                          {rm ? `Qolka: ${rm.roomNumber}` : 'Virtual/No Room'} | {cs.startTime} - {cs.endTime}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Salary Records History */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow space-y-4">
            <h3 className="font-sans font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-500" /> Salary Disbursals Ledger
            </h3>
            
            {teacherSalaries.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs">
                No salary logs found for this teacher.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5">ID #</th>
                      <th>Month</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Paid At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {teacherSalaries.map(sal => (
                      <tr key={sal.id} className="text-slate-700">
                        <td className="py-3 font-mono font-bold text-slate-950">{sal.id.substring(0, 8).toUpperCase()}</td>
                        <td className="font-medium">{sal.month}</td>
                        <td className="font-bold text-slate-950">${sal.amount}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sal.status === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'}`}>
                            {sal.status === 'paid' ? 'Disbursed' : 'Pending'}
                          </span>
                        </td>
                        <td className="text-slate-400">{sal.paidAt ? new Date(sal.paidAt).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

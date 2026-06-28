import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, GraduationCap, Calendar, DollarSign, BookOpen, 
  User, MapPin, Phone, MessageSquare, Clock, Award, Shield
} from 'lucide-react';
import { motion } from 'motion/react';

export default function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { students, subjects, attendanceRecords, feeRecords, exams, examResults, classSessions, teachers, rooms } = useApp();

  const student = students.find(s => s.id === studentId || s.studentId === studentId);

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white rounded-2xl border border-gray-100 card-shadow">
        <GraduationCap className="mx-auto text-slate-300 mb-4 animate-bounce" size={48} />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Ardayga Lama Helin (Student Not Found)</h2>
        <p className="text-slate-500 text-sm mb-6">Magaalada ama aqoonsiga ardayga aad raadinayso ma jiro.</p>
        <button 
          onClick={() => navigate('/portal/students')}
          className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white rounded-xl text-sm font-semibold cursor-pointer"
        >
          Ku laabo Liiska Ardayda
        </button>
      </div>
    );
  }

  // Calculate stats
  const studentSessions = (classSessions || []).filter(cs => student.classSessions?.includes(cs.id));
  const studentSubjects = subjects.filter(sub => student.subjects?.includes(sub.id));
  
  // Fee records for student
  const studentFees = feeRecords.filter(f => f.studentId === student.id);
  const paidFeesCount = studentFees.filter(f => f.status === 'paid' || f.status === 'approved').length;
  const unpaidFeesCount = studentFees.filter(f => f.status === 'unpaid').length;
  const totalPaidAmount = studentFees.filter(f => f.status === 'paid' || f.status === 'approved').reduce((acc, f) => acc + f.amount, 0);

  // Attendance stats
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLate = 0;
  attendanceRecords.forEach(record => {
    const recordItem = record.records?.find(r => r.studentId === student.id);
    if (recordItem) {
      if (recordItem.status === 'present') totalPresent++;
      else if (recordItem.status === 'absent') totalAbsent++;
      else if (recordItem.status === 'late') totalLate++;
    }
  });
  const totalAttendanceDays = totalPresent + totalAbsent + totalLate;
  const attendanceRate = totalAttendanceDays > 0 ? Math.round((totalPresent / totalAttendanceDays) * 100) : 100;

  // Exam results
  const studentResults = examResults.map(er => {
    const resultItem = er.results?.find(r => r.studentId === student.id);
    if (resultItem) {
      return {
        examTitle: er.examTitle,
        marks: resultItem.marks,
        grade: resultItem.grade,
        date: er.createdAt ? new Date(er.createdAt).toLocaleDateString() : 'N/A'
      };
    }
    return null;
  }).filter(Boolean);

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
          to="/portal/students"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} /> Back to Student Directory (Ardayda)
        </Link>
        <span className="text-xs font-mono font-bold px-3 py-1 bg-gray-100 rounded-full text-slate-600">
          SYSTEM ID: {student.id}
        </span>
      </div>

      {/* Profile Header Grid */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 card-shadow grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-3 flex justify-center">
          {student.profilePhoto ? (
            <img 
              src={student.profilePhoto} 
              alt={student.fullName}
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
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-sans font-extrabold text-slate-900 tracking-tight">{student.fullName}</h1>
              <span className="inline-block md:inline w-fit mx-auto md:mx-0 px-2.5 py-0.5 bg-black text-white text-[10px] font-mono font-bold rounded-md uppercase">
                {student.studentId}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 flex items-center justify-center md:justify-start gap-1">
              <MapPin size={14} /> {student.address || 'Ciwaan looma helin'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Gender (Galada)</span>
              <span className="text-sm font-semibold capitalize text-slate-700">{student.gender === 'male' ? 'Muxuu' : 'Muxuud'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Date of Birth (Dhalasho)</span>
              <span className="text-sm font-semibold text-slate-700">{student.dob || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl col-span-2 sm:col-span-1">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Monthly Tuition Fee</span>
              <span className="text-sm font-bold text-green-600">${student.fee || 0}/Month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stats & Contacts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Stats Panel */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow space-y-4">
            <h3 className="font-sans font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} className="text-blue-500" /> Academic Dashboard
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-semibold text-slate-500">Attendance Rate</span>
                <span className={`text-sm font-bold ${attendanceRate >= 80 ? 'text-green-600' : 'text-orange-500'}`}>
                  {attendanceRate}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-semibold text-slate-500">Registered Subjects</span>
                <span className="text-sm font-bold text-slate-700">{studentSubjects.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-semibold text-slate-500">Unpaid Invoices</span>
                <span className={`text-sm font-bold ${unpaidFeesCount > 0 ? 'text-red-500 animate-pulse' : 'text-green-600'}`}>
                  {unpaidFeesCount} Month(s)
                </span>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow space-y-4">
            <h3 className="font-sans font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Phone size={16} className="text-slate-500" /> Contacts & Emergency
            </h3>
            
            <div className="space-y-4 text-xs font-medium text-slate-600">
              <div className="flex items-start gap-3">
                <Phone size={16} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Student Mobile</span>
                  <a href={`tel:${student.studentPhone}`} className="text-sm font-bold text-slate-800 hover:underline">{student.studentPhone || 'N/A'}</a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageSquare size={16} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Parent / Guardian Mobile</span>
                  <a href={`tel:${student.parentPhone}`} className="text-sm font-bold text-slate-800 hover:underline">{student.parentPhone || 'N/A'}</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Content lists */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Class Sessions */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={16} className="text-violet-500" /> Registered Class Sessions ({studentSessions.length})
              </h3>
              <span className="text-xs text-slate-400">Ardayga fasalada uu dhigto</span>
            </div>

            {studentSessions.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs">
                Class Sessions looma diiwaan-gelin ardaygan (No class sessions enrolled).
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {studentSessions.map(cs => {
                  const sub = subjects.find(s => s.id === cs.subjectId);
                  const rm = (rooms || []).find(r => r.id === cs.roomId);
                  const teacher = (teachers || []).find(t => t.id === cs.teacherId);
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
                        <p className="text-[10px] text-slate-500 font-medium">
                          Macallin: <strong className="text-slate-700">{teacher ? teacher.fullName : 'N/A'}</strong>
                        </p>
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

          {/* Fee Ledger History */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow space-y-4">
            <h3 className="font-sans font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-500" /> Tuition Fee Log (Taariikhda Lacag-bixinta)
            </h3>
            
            {studentFees.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs">
                Wax lacag ah oo loo xisaabiyay lama helin.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5">Invoice #</th>
                      <th>Month</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Paid At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {studentFees.map(fee => (
                      <tr key={fee.id} className="text-slate-700">
                        <td className="py-3 font-mono font-bold text-slate-900">{fee.invoiceNumber}</td>
                        <td className="font-medium">{fee.month}</td>
                        <td className="font-bold text-slate-900">${fee.amount}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            (fee.status === 'paid' || fee.status === 'approved') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {(fee.status === 'paid' || fee.status === 'approved') ? 'Approved' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="text-slate-400">{fee.paidAt ? new Date(fee.paidAt).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Exam Grades Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow space-y-4">
            <h3 className="font-sans font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Award size={16} className="text-amber-500" /> Exam Transcripts & Grades (Natiijooyinka Imtixaanka)
            </h3>

            {studentResults.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs">
                Ardaygan weli ma jiro wax imtixaan ah oo loo galiyay.
              </div>
            ) : (
              <div className="space-y-3">
                {studentResults.map((res: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400">{res.date}</span>
                      <span className="text-sm font-bold text-slate-800">{res.examTitle}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-medium">Marks: {res.marks}</span>
                      <span className="text-base font-extrabold text-slate-950 font-mono">Grade: {res.grade}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

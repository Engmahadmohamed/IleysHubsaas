import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, CreditCard, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useParams } from 'react-router-dom';

export default function FeeCheckingPortal() {
  const { orgId } = useParams();
  const { searchStudentFees } = useApp();
  
  const [studentIdInput, setStudentIdInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [foundStudent, setFoundStudent] = useState<any | null>(null);
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setFoundStudent(null);
    setStudentFees([]);

    const cleanId = studentIdInput.trim().toUpperCase();
    if (!cleanId) {
      setSearchError('Fadlan geli ID-ga saxda ah ee ardayga.');
      return;
    }
    if (!orgId) {
      setSearchError('Iskuulka lama aqoonsan. Fadlan hubi link-ga aad soo gashay.');
      return;
    }

    try {
      setSearching(true);
      const data = await searchStudentFees(cleanId, orgId);
      if (!data) {
        setSearchError(`Ardaygan kuma jiro iskuulkan. Fadlan iska hubi ID-ga "${cleanId}".`);
        return;
      }
      setFoundStudent(data.student);
      setStudentFees(data.fees || []);
    } catch (err: any) {
      console.error('Error during student search:', err);
      setSearchError('Xog raadinta waa uu guuldareystay. Fadlan dib isku day.');
    } finally {
      setSearching(false);
    }
  };

  const getMonthsString = (fees: any[]) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return fees.map(f => `${monthNames[f.month - 1]} ${f.year}`).join(', ');
  };

  const pendingFees = studentFees.filter(f => f.status === 'pending');
  const totalPendingAmount = pendingFees.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 pb-12">
      {/* Header Banner */}
      <div className="bg-emerald-900 text-white py-12 px-4 border-b border-emerald-800 text-center relative overflow-hidden">
        {/* Background decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="currentColor" strokeWidth="2" fill="none"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)"/>
          </svg>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-800/80 border border-emerald-700/50 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 tracking-wider uppercase">
            <CheckCircle size={14} className="text-emerald-300" /> Secure Fee Checking Portal
          </div>
          <h1 className="text-3xl md:text-4xl font-sans font-bold tracking-tight text-white">Hubinta Lacagaha (Fees)</h1>
          <p className="mt-2 text-emerald-100/80 max-w-lg mx-auto text-sm">
            Si fudud ugu hubi xaaladda lacag bixinta ardayga asagoo la isticmaalayo Student ID-giisa khaaska ah.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6">
        {/* Search Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8 card-shadow relative z-20">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={20} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value.toUpperCase())}
                  placeholder="Geli Student ID-ga (Tusaale: SII00001)"
                  className="w-full pl-11 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono uppercase text-lg"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={searching || !studentIdInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 md:w-auto w-full text-lg shadow-lg shadow-emerald-500/30"
              >
                {searching ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Search size={20} /> Raadi
                  </>
                )}
              </button>
            </div>
          </form>

          {searchError && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Baadi-goobka waa guuldareystay</p>
                <p className="text-sm mt-0.5 text-red-500">{searchError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Area */}
        {foundStudent && (
          <div className="mt-8 space-y-6 animate-fade-in">
            {/* Student Profile Summary */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 card-shadow flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-3xl font-bold shrink-0 shadow-inner">
                {foundStudent.fullName.charAt(0)}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-900">{foundStudent.fullName}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-semibold font-mono border border-slate-200">
                    {foundStudent.studentId}
                  </span>
                </div>
              </div>
            </div>

            {/* Fee Status Summary Card */}
            <div className={`rounded-2xl p-6 border card-shadow ${
              pendingFees.length > 0 
                ? 'bg-rose-50 border-rose-200' 
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  pendingFees.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {pendingFees.length > 0 ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${
                    pendingFees.length > 0 ? 'text-rose-900' : 'text-emerald-900'
                  }`}>
                    {pendingFees.length > 0 ? 'Waa Lagugu Leeyahay Lacag' : 'Wax Lacag Ah Laguguma Laha'}
                  </h3>
                  
                  {pendingFees.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-rose-700 font-medium">
                        Wadarta guud ee lagugu leeyahay waa: <span className="text-2xl font-black">${totalPendingAmount}</span>
                      </p>
                      <p className="text-sm text-rose-600/80 mt-1">
                        Bilaha la rabo: {getMonthsString(pendingFees)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-emerald-700 font-medium mt-1">
                      Ardaygan dhammaan bilaha la soo dhaafay si buuxda ayuu u bixiyay lacagihii laga rabay.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Fee History */}
            {studentFees.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Calendar size={18} className="text-slate-400" />
                    Taariikhda Bixinta Lacagaha
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                  {studentFees.map(fee => {
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthName = monthNames[fee.month - 1];
                    const isPaid = fee.status === 'paid' || fee.status === 'approved';
                    
                    return (
                      <div key={fee.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-sm ${
                            isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            <span className="text-xs uppercase">{monthName}</span>
                            <span>{fee.year}</span>
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">Fee Invoice</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">#{fee.id.slice(0, 8)}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className="font-black text-slate-900">${fee.amount}</p>
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                              isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {isPaid ? 'La Bixiyay' : 'Waa Dhiman'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

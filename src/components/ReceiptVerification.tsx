import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ShieldCheck, Calendar, Award, GraduationCap, ArrowLeft, Download, Loader2, ShieldAlert, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAlert } from '../context/AlertContext';

interface FeeData {
  studentName: string;
  studentId?: string;
  invoiceNumber: string;
  amount: number | string;
  month: string;
  status: string;
  paidAt?: string;
  organizationId?: string;
}

export default function ReceiptVerification() {
  const { showAlert } = useAlert();
  const [searchParams] = useSearchParams();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feeData, setFeeData] = useState<FeeData | null>(null);
  const [orgName, setOrgName] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [debtCount, setDebtCount] = useState<number>(0);

  // New short-link params
  const orgId = searchParams.get('o') || '';
  const feeId = searchParams.get('f') || '';

  // Legacy params (fallback for old links)
  const legacyInvoice = searchParams.get('i') || searchParams.get('invoice') || '';
  const legacyStudent = searchParams.get('s') || searchParams.get('student') || '';
  const legacyStudentId = searchParams.get('sid') || '';
  const legacyAmount = searchParams.get('a') || searchParams.get('amount') || '0';
  const legacyMonth = searchParams.get('m') || searchParams.get('month') || 'N/A';
  const legacyOrgName = searchParams.get('o_name') || searchParams.get('org') || '';
  const legacyDateParam = searchParams.get('d') || searchParams.get('date');

  const isShortLink = !!(orgId && feeId);
  const isLegacyLink = !!legacyInvoice;

  useEffect(() => {
    if (isShortLink) {
      setIsLoading(true);
      const fetchFee = async () => {
        try {
          // Fetch org name
          const orgSnap = await getDoc(doc(db, 'organizations', orgId));
          if (orgSnap.exists()) {
            setOrgName(orgSnap.data().name || '');
          }

          // Fetch fee
          const feeSnap = await getDoc(doc(db, 'organizations', orgId, 'fees', feeId));
          if (feeSnap.exists()) {
            const data = feeSnap.data() as FeeData;
            setFeeData(data);
            
            if (data.studentId) {
              try {
                const debtsQuery = query(
                  collection(db, 'organizations', orgId, 'fees'),
                  where('studentId', '==', data.studentId),
                  where('status', 'in', ['pending', 'unpaid'])
                );
                const debtsSnap = await getDocs(debtsQuery);
                setDebtCount(debtsSnap.docs.length);
              } catch(e) {
                console.error("Failed to fetch debts", e);
              }
            }
          } else {
            setFetchError('Risiidhkaan lama helin nidaamka. Fadlan hubi linkiga.');
          }
        } catch (err: any) {
          console.error('Error fetching receipt:', err);
          setFetchError('Cilad ayaa dhacday inta la soo dejinayay xogta. Fadlan dib u isku day.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchFee();
    } else if (isLegacyLink) {
      // Populate from URL params (old link format)
      setFeeData({
        studentName: legacyStudent,
        studentId: legacyStudentId,
        invoiceNumber: legacyInvoice,
        amount: legacyAmount,
        month: legacyMonth,
        status: 'paid',
        paidAt: legacyDateParam ? new Date(legacyDateParam).toISOString() : new Date().toISOString(),
      });
      if (legacyOrgName) setOrgName(legacyOrgName);
    }
  }, [orgId, feeId]);

  const fee = feeData;
  
  // Calculate exact payment date & time
  const paymentDateStr = fee?.paidAt 
    ? new Date(fee.paidAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) 
    : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  // Calculate expiration date
  let expireDateStr = 'N/A';
  try {
    if (fee?.month) {
      const parsedMonth = new Date(fee.month);
      if (!isNaN(parsedMonth.getTime())) {
        const expDate = new Date(parsedMonth.getFullYear(), parsedMonth.getMonth() + 1, 0);
        expireDateStr = expDate.toLocaleDateString('en-US', { dateStyle: 'medium' });
      }
    }
  } catch(e) {}

  const isPaid = fee?.status === 'paid';
  const isCancelled = fee?.status === 'cancelled';

  const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error('Network error');
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleDownloadPDF = async () => {
    if (!fee) return;
    setIsDownloading(true);
    try {
      const W = 85.6;
      const H = 130;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, H] });
      const cx = W / 2;

      // Background
      doc.setFillColor(250, 251, 253);
      doc.rect(0, 0, W, H, 'F');

      // Header dark band
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, W, 26, 'F');
      // Accent stripe
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 26, W, 2, 'F');

      // Org Name
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(orgName.toUpperCase(), cx, 12, { align: 'center', maxWidth: W - 8 });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(148, 163, 184);
      doc.text('OFFICIAL TUITION RECEIPT / INVOICE', cx, 20, { align: 'center' });

      // ── PAID OR CANCELLED BADGE ──
      if (isCancelled) {
        doc.setFillColor(239, 68, 68); // red-500
        doc.roundedRect(cx - 18, 30, 36, 7, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.text('✕  CANCELLED / LAGA NOQDAY', cx, 34.8, { align: 'center' });
      } else if (isPaid) {
        doc.setFillColor(16, 185, 129); // emerald-500
        doc.roundedRect(cx - 14, 30, 28, 7, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.text('✓  APPROVED & PAID', cx, 34.8, { align: 'center' });
      } else {
        doc.setFillColor(239, 68, 68);
        doc.roundedRect(cx - 14, 30, 28, 7, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.text('⚠ UNPAID / PENDING', cx, 34.8, { align: 'center' });
      }

      // Amount box
      if (isCancelled || !isPaid) {
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(254, 202, 202);
      } else {
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(167, 243, 208);
      }
      doc.roundedRect(6, 41, W - 12, 14, 2, 2, 'FD');
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isPaid && !isCancelled ? 21 : 185, isPaid && !isCancelled ? 128 : 28, isPaid && !isCancelled ? 61 : 26);
      doc.text('CADADKA LA BIXIYAY / AMOUNT PAID', cx, 46, { align: 'center' });
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isPaid && !isCancelled ? 5 : 220, isPaid && !isCancelled ? 150 : 38, isPaid && !isCancelled ? 105 : 38);
      doc.text(`$${fee.amount}`, cx, 53, { align: 'center' });

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(6, 59, W - 6, 59);

      // Details rows
      const labelC: [number, number, number] = [148, 163, 184];
      const valC: [number, number, number] = [15, 23, 42];
      const rowH = 7.5;
      const rows = [
        { label: 'ARDAYGA / STUDENT', value: fee.studentName },
        { label: 'INVOICE NO / RISIIDH', value: fee.invoiceNumber },
        { label: 'BISHA / MONTH', value: fee.month },
        { label: 'TAARIIKHDA / DATE', value: paymentDateStr },
        { label: 'KU EGYAHAY / VALID UNTIL', value: expireDateStr },
      ];

      rows.forEach((row, i) => {
        const y = 63 + i * rowH;
        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...labelC);
        doc.text(row.label, 8, y);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...valC);
        doc.text(String(row.value), W - 8, y, { align: 'right', maxWidth: 45 });
        if (i < rows.length - 1) {
          doc.setDrawColor(241, 245, 249);
          doc.line(8, y + 3, W - 8, y + 3);
        }
      });

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(6, 96, W - 6, 96);

      // QR Code
      const verifyUrl = window.location.href;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}`;
      const qrSize = 22;
      const qrX = cx - qrSize / 2;
      const qrY = 99;

      try {
        const qrBase64 = await getBase64ImageFromUrl(qrUrl);
        doc.addImage(qrBase64, 'PNG', qrX, qrY, qrSize, qrSize);
      } catch {
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

      // Footer
      doc.setFillColor(15, 23, 42);
      doc.rect(0, H - 10, W, 10, 'F');
      doc.setFontSize(4.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Mahadsanid · Thank you for your payment', cx, H - 5.5, { align: 'center' });
      doc.setTextColor(16, 185, 129);
      doc.text(`${orgName} · Secure Digital Receipt`, cx, H - 2, { align: 'center' });

      doc.save(`Risiidh_${fee.invoiceNumber || 'receipt'}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      showAlert('Cillad ayaa dhacday intii PDF-ka la soo dejinayay.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={36} className="animate-spin text-emerald-600 mx-auto" />
          <p className="text-slate-500 text-sm font-medium">Xogta risiidhka waa la soo dejinayaa...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-3xl border border-rose-100 shadow-xl overflow-hidden">
          <div className="bg-rose-600 p-6 text-center text-white">
            <ShieldAlert size={36} className="mx-auto mb-2" />
            <h2 className="text-lg font-extrabold">Risiidhka Lama Helin</h2>
            <p className="text-xs text-rose-100 mt-1">Receipt Not Found</p>
          </div>
          <div className="p-6 text-center space-y-3">
            <div className="p-3 bg-rose-50 rounded-xl flex items-start gap-2 text-left">
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 font-medium">{fetchError}</p>
            </div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-all">
              <ArrowLeft size={14} /> Go to System Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No params at all
  if (!fee) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl p-6 text-center space-y-3">
          <ShieldAlert size={36} className="text-slate-400 mx-auto" />
          <p className="text-slate-600 font-semibold">Linkiga waa khalad ah ama waa faaruq.</p>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-all">
            <ArrowLeft size={14} /> Go to System Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/30 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-sm w-full bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        {isCancelled ? (
          <div className="bg-gradient-to-br from-rose-600 to-red-700 p-6 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="absolute top-4 left-4 opacity-70"><ShieldAlert size={22} /></div>
            <div className="mx-auto w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3 border border-white/30">
              <span className="text-3xl font-black">✕</span>
            </div>
            <span className="inline-block bg-white/20 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-white/20 mb-2">
              Laga Noqday / Cancelled
            </span>
            <h2 className="text-lg font-extrabold tracking-tight">Risiidhkan waa la kansalay</h2>
            <p className="text-xs text-rose-100 mt-1">This receipt is no longer valid.</p>
          </div>
        ) : isPaid ? (
          <div className={`bg-gradient-to-br ${debtCount > 0 ? 'from-amber-500 to-yellow-600' : 'from-emerald-600 to-teal-600'} p-6 text-center text-white relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="absolute top-4 left-4 opacity-70"><ShieldCheck size={22} /></div>
            <div className="mx-auto w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3 border border-white/30">
              <CheckCircle size={28} className="text-white" />
            </div>
            <span className="inline-block bg-white/20 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-white/20 mb-2">
              ✓ Secure Verification
            </span>
            <h2 className="text-lg font-extrabold tracking-tight">Waa la Xaqiijiyey</h2>
            <p className={`text-xs ${debtCount > 0 ? 'text-amber-100' : 'text-emerald-100/90'} mt-1`}>Validated by {orgName}</p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-rose-600 to-red-700 p-6 text-center text-white relative">
            <div className="absolute top-4 left-4 opacity-70"><ShieldAlert size={22} /></div>
            <div className="mx-auto w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3 border border-white/30">
              <ShieldAlert size={28} className="text-white" />
            </div>
            <span className="inline-block bg-white/20 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-white/20 mb-2">
              ⚠ UNPAID
            </span>
            <h2 className="text-lg font-extrabold tracking-tight">Lacag La'aanta / Unpaid</h2>
            <p className="text-xs text-rose-100 mt-1">This invoice has not been paid yet.</p>
          </div>
        )}

        <div className="p-5 space-y-4">
          {debtCount > 0 && isPaid && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex gap-3 text-sm font-semibold shadow-sm shadow-amber-500/10">
              <AlertCircle className="shrink-0 text-amber-500" size={20} />
              <div>
                <p className="font-extrabold text-amber-900 mb-0.5">Digniin Deyneed!</p>
                <p className="text-xs text-amber-700">Waad bixisay bishaan, balse waxaa lagugu leeyahay <strong className="font-black text-amber-900">{debtCount} bilood</strong> oo kale.</p>
              </div>
            </div>
          )}
          {/* Org */}
          <div className="text-center">
            <div className="inline-flex p-2 bg-slate-50 rounded-xl border border-slate-100 mb-1">
              <GraduationCap size={18} className="text-slate-700" />
            </div>
            <h3 className="text-sm font-extrabold tracking-tight text-slate-900 uppercase">{orgName}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Official Receipt / Risiidh Rasmi ah</p>
          </div>

          {/* Amount big display */}
          <div className={`rounded-2xl p-4 text-center border ${isPaid && !isCancelled ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Cadadka La Bixiyay / Amount</p>
            <p className={`text-3xl font-black ${isPaid && !isCancelled ? 'text-emerald-600' : 'text-rose-500 line-through'}`}>${fee.amount}</p>
            {isCancelled && <span className="inline-block mt-1 bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">✕ CANCELLED</span>}
            {isPaid && !isCancelled && <span className="inline-block mt-1 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">✓ PAID</span>}
          </div>

          {/* Details */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            {[
              { label: 'Student / Ardayga', value: fee.studentName },
              ...(fee.studentId ? [{ label: 'Student ID / Aqoonsiga', value: fee.studentId }] : []),
              { label: 'Invoice No / Risiidh', value: fee.invoiceNumber },
              { label: 'Billing Month / Bisha', value: fee.month },
              { label: 'Paid Date / Taariikhda', value: paymentDateStr },
              { label: 'Valid Until / Ku egyahay', value: expireDateStr },
            ].map((item, i, arr) => (
              <div key={i} className={`flex justify-between items-center text-xs ${i < arr.length - 1 ? 'pb-3 border-b border-slate-200/60' : ''}`}>
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">{item.label}</span>
                <span className="text-slate-800 font-bold text-right max-w-[55%]">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Trust indicator */}
          <div className={`p-3 rounded-2xl flex items-start gap-2.5 border ${isCancelled ? 'bg-rose-50 border-rose-100' : isPaid ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
            {isCancelled
              ? <ShieldAlert className="text-rose-600 shrink-0 mt-0.5" size={16} />
              : isPaid
                ? <Award className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                : <AlertCircle className="text-slate-400 shrink-0 mt-0.5" size={16} />}
            <div>
              <h4 className={`text-xs font-bold ${isCancelled ? 'text-rose-800' : isPaid ? 'text-emerald-800' : 'text-slate-700'}`}>
                {isCancelled ? 'Invalid Document' : isPaid ? 'Verified Secure Document' : 'Invoice Pending Payment'}
              </h4>
              <p className={`text-[10px] leading-relaxed mt-0.5 ${isCancelled ? 'text-rose-600' : isPaid ? 'text-emerald-600' : 'text-slate-500'}`}>
                {isCancelled
                  ? 'Risiidhkani waxuu noqday mid la kansalay (void). Lacagtiisa dib baa loogu laabtay ama qalad baa ku jiray.'
                  : isPaid
                    ? 'Risiidhkani wuxuu la xiriiraa nidaamka si ammaan ah. Wax is-beddel ah oo aan la ogeysiinin lama aqbali doono.'
                    : 'Invoice-kani weli lacag laguma bixin. Fadlan la xiriir maamulka.'}
              </p>
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 ${isPaid ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-700 hover:bg-slate-800'} text-white font-bold text-xs rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
          >
            {isDownloading ? (
              <><Loader2 size={15} className="animate-spin" /><span>Hadday ku soo degaysaa...</span></>
            ) : (
              <><Download size={15} /><span>Soo Degso Risiidhka PDF ah</span></>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 font-bold transition-all">
            <ArrowLeft size={13} /> Go to System Login
          </Link>
        </div>
      </div>

      <p className="mt-4 text-[10px] text-slate-400 font-medium">🔒 Powered by {orgName} · Secure Academic Management</p>
    </div>
  );
}



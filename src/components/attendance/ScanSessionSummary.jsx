import useOfflineAttendance from "../../hooks/useOfflineAttendance";

function Summary({ attendance, successfulScans }) {
  const verified = attendance.records.filter(record => record.sync_status === "VERIFIED").length;
  const stats = [
    ...(successfulScans == null ? [] : [["Scan online berhasil", successfulScans]]),
    ["Luring tersinkron", verified],
    ["Luring belum terkirim", attendance.pendingCount],
    ["Luring perlu diperiksa", attendance.reviewCount],
  ];
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 text-left">
    <h2 className="font-bold">Ringkasan Sesi Pemindaian</h2>
    <p className="mt-1 text-xs leading-5 text-slate-500">{successfulScans != null && "Scan online dihitung sejak pemindai dibuka. "}Data luring mencakup seluruh antrean pada perangkat ini, termasuk hari sebelumnya.</p>
    <dl aria-live="polite" className="mt-3 grid grid-cols-2 gap-2">
      {stats.map(([label, count]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-xl font-bold">{count}</dd></div>)}
    </dl>
    <p className="mt-3 text-xs leading-5 text-slate-500">Data belum terkirim belum dikonfirmasi oleh server. Jumlah online dan luring ditampilkan terpisah agar tidak dihitung ganda.</p>
  </section>;
}

function ConnectedSummary({ successfulScans }) {
  const attendance = useOfflineAttendance();
  return <Summary attendance={attendance} successfulScans={successfulScans} />;
}

export default function ScanSessionSummary({ attendance, successfulScans }) {
  return attendance ? <Summary attendance={attendance} successfulScans={successfulScans} /> : <ConnectedSummary successfulScans={successfulScans} />;
}

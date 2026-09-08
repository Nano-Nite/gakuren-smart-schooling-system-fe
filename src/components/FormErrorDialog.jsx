export default function FormErrorDialog({ open, message, onClose }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <section role="alertdialog" aria-modal="true" aria-labelledby="form-error-title" className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl">
      <h2 id="form-error-title" className="text-lg font-bold text-slate-900">Gagal menyimpan data</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onClose} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Kembali ke formulir</button>
      </div>
    </section>
  </div>;
}

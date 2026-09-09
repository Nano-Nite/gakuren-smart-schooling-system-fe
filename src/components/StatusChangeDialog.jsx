import ConfirmDialog from "./ConfirmDialog";
import { deactivationConsequences } from "../utils/userStatus";

export default function StatusChangeDialog({ item, entityLabel, action = "deactivate", submitting = false, error, onConfirm, onCancel }) {
  const activating = action === "activate";
  const verb = activating ? "Aktifkan" : "Nonaktifkan";
  return <ConfirmDialog
    open={Boolean(item)}
    title={`${verb} ${entityLabel}?`}
    description={<>Anda akan {activating ? "mengaktifkan" : "menonaktifkan"} <strong className="font-semibold text-slate-800 dark:text-slate-100">{item?.name}</strong>. {activating ? "Status data akan menjadi aktif." : "Data tetap tersimpan dengan status nonaktif."}</>}
    information={activating ? [
      "Setelah pengaktifan berhasil, status data menjadi Aktif dan data kembali muncul pada daftar dengan filter Aktif.",
      "Data yang tersimpan dapat dikelola kembali sesuai izin akses Anda.",
      ...(entityLabel === "kelas" ? ["Periksa kembali penugasan wali kelas dan keanggotaan siswa, lalu atur sesuai kebutuhan kelas."] : []),
    ] : []}
    consequences={activating ? [] : [
      ...(entityLabel === "kelas" ? [
        "Jika kelas memiliki wali kelas, penonaktifan yang disetujui akan mencabut posisi Wali Kelas dari guru tersebut. Guru dapat ditugaskan sebagai wali kelas di kelas lain.",
        "Setelah penonaktifan disetujui, seluruh siswa di kelas ini akan dikeluarkan dari keanggotaan kelas. Data siswa tetap tersimpan dan perlu ditempatkan kembali ke kelas yang sesuai.",
      ] : []),
      ...deactivationConsequences,
    ]}
    confirmLabel={submitting ? activating ? "Mengaktifkan..." : "Menonaktifkan..." : `Ya, ${verb.toLowerCase()}`}
    tone={activating ? "success" : "danger"}
    error={error}
    submitting={submitting}
    onConfirm={onConfirm}
    onCancel={onCancel}
  />;
}

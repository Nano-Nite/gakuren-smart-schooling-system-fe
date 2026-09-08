import ConfirmDialog from "./ConfirmDialog";
import { deactivationConsequences } from "../utils/userStatus";

export default function StatusChangeDialog({ item, entityLabel, action = "deactivate", submitting = false, error, onConfirm, onCancel }) {
  const activating = action === "activate";
  const verb = activating ? "Aktifkan" : "Nonaktifkan";
  return <ConfirmDialog
    open={Boolean(item)}
    title={`${verb} ${entityLabel}?`}
    description={<>Anda akan {activating ? "mengaktifkan" : "menonaktifkan"} <strong className="font-semibold text-slate-800 dark:text-slate-100">{item?.name}</strong>. {activating ? "Status data akan menjadi aktif." : "Data tetap tersimpan dengan status nonaktif."}</>}
    consequences={activating ? [] : deactivationConsequences}
    confirmLabel={submitting ? activating ? "Mengaktifkan..." : "Menonaktifkan..." : `Ya, ${verb.toLowerCase()}`}
    tone={activating ? "success" : "danger"}
    error={error}
    submitting={submitting}
    onConfirm={onConfirm}
    onCancel={onCancel}
  />;
}

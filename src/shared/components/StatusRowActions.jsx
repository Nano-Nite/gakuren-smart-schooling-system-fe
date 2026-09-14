import { isNewUserStatus, isStatusMutationBlocked } from "../utils/userStatus";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";

export default function StatusRowActions({ item, label, canUpdate, canDelete, onEdit, onDelete, onActivate }) {
  const stopAndRun = callback => event => {
    event.stopPropagation();
    callback?.(item);
  };

  if (item.status === "Nonaktif") {
    return canUpdate && <button title={`Aktifkan ${label}`} aria-label={`Aktifkan ${item.name}`} onClick={stopAndRun(onActivate)} className="inline-flex items-center gap-1.5 rounded border border-emerald-200 px-2 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50"><CheckCircle2 className="h-4 w-4" />Aktifkan</button>;
  }

  const pending = isStatusMutationBlocked(item.status);
  const blockedReason = isNewUserStatus(item.status) ? "Pengguna baru tidak dapat diedit atau dinonaktifkan" : "Aksi dinonaktifkan selama menunggu persetujuan";
  return <>
    {canUpdate && <button disabled={pending} title={pending ? blockedReason : `Edit ${label}`} aria-label={`Edit ${item.name}`} onClick={stopAndRun(onEdit)} className="rounded border border-slate-200 p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"><Pencil className="h-4 w-4" /></button>}
    {canDelete && <button disabled={pending} title={pending ? blockedReason : `Nonaktifkan ${label}`} aria-label={`Nonaktifkan ${item.name}`} onClick={stopAndRun(onDelete)} className="rounded border border-rose-200 p-1.5 text-rose-500 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"><Trash2 className="h-4 w-4" /></button>}
  </>;
}

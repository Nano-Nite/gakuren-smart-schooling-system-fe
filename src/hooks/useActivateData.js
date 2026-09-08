import { useRef, useState } from "react";
import { authenticatedRequest } from "../utils/api";
import { getActiveStatusUuid } from "../utils/activeStatus";

export default function useActivateData(endpoint, onSuccess, buildPayload = (item, status) => ({ uuid: item.id, status })) {
  const lock = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const activate = async item => {
    if (!item || lock.current) return;
    lock.current = true;
    setSubmitting(true);
    setError("");
    try {
      const status = await getActiveStatusUuid();
      const body = await buildPayload(item, status);
      const response = await authenticatedRequest(endpoint, { method: "PATCH", body });
      onSuccess(response);
    } catch (requestError) { setError(requestError.message || "Gagal mengaktifkan data. Silakan coba lagi."); }
    finally { lock.current = false; setSubmitting(false); }
  };
  return { activate, submitting, error, clearError: () => setError("") };
}

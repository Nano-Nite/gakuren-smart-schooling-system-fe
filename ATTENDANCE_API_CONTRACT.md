# Attendance QR API contract

The QR attendance UI intentionally contains no mock-success fallback. The backend remains the source of truth and must provide these authenticated, tenant-scoped endpoints:

- `GET /v1/attendance/locations` — returns locations with `uuid`, `name`, and optionally `geofence_radius_meter`.
- `GET /v1/attendance/sessions/active` — returns the current active session, `null`, or HTTP 404 when none exists. The session must include its original `qr_token` so refresh restores the same QR.
- `POST /v1/attendance/sessions` — accepts `attendance_type`, `location_uuid`, `target_type`, `valid_from`, and `valid_until`; returns `session_uuid`, `session_code`, signed `qr_token`, location, validity, and status.
- `POST /v1/attendance/sessions/{session_uuid}/close` — closes an active session.
- `GET /v1/attendance/sessions/{session_uuid}/attendances` — returns an array (or `{ items, summary }`) of attendance records. This endpoint is polled every five seconds while the session is active.
- `POST /v1/attendance/scan` — accepts only `qr_token`, `latitude`, `longitude`, and `accuracy`. User identity must be derived from the bearer token, and geofence status must be decided by the backend.
- `GET /v1/attendance/identity-credential` — returns the signed user identity credential (`credential_id`, `qr_token`, `issued_at`, `version`) that the PWA caches for offline display.
- `GET /v1/attendance/offline-config` — returns the tenant-scoped `school_uuid`, verification `public_key` (SPKI PEM or JWK), `algorithm`, `credential_version`, locations, and attendance rules. It must never return private-key material.
- `GET /v1/attendance/trusted-device` — returns the currently registered office device with `device_uuid`, `device_name`, `school_uuid`, `location_uuid`, and `trusted`. An unregistered browser must receive a non-success response; the frontend never invents a device identity offline.
- `POST /v1/attendance/offline-sync` — accepts `{ records: [...] }`, revalidates every locally verified credential, and returns per-record results containing `local_id` and final `status` (`VERIFIED`, `FLAGGED`, or `REJECTED`). The endpoint must be idempotent on `local_id`.
- `POST /v1/attendance/offline-sync` request shape is `{ device_uuid, records }`; each record contains `local_uuid`, signed credential reference/token, attendance type, trusted-device location, provisional status, and trusted-device timestamp. Responses must echo `local_uuid`.

Domain errors should expose one of these machine-readable codes: `SESSION_EXPIRED`, `SESSION_CLOSED`, `INVALID_QR`, `ALREADY_ATTENDED`, or `OUTSIDE_GEOFENCE`.

Required create permission: `attendance.qr.create`. The UI temporarily also recognizes the existing resource-style `qrcode.create` permission for compatibility.

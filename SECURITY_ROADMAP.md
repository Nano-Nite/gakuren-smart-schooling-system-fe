# Gakuren Authentication and Offline Storage Roadmap

Planned for a future update:

- [ ] Move the refresh token to a backend-issued `HttpOnly`, `Secure`, and appropriately configured `SameSite` cookie.
- [ ] Keep the short-lived access token in application memory instead of browser storage.
- [ ] Add automatic token/session refresh during application startup.
- [ ] Move offline data and non-sensitive user/menu information to IndexedDB.
- [ ] Derive `tenant_uuid` from the authenticated server session where possible instead of trusting a client-provided tenant header.

## Cross-origin deployment note

If the frontend and API are hosted on different sites, cookie authentication may require:

- `SameSite=None; Secure` on the authentication cookie.
- Explicit credential-enabled CORS configuration on the backend.
- `credentials: "include"` on relevant frontend requests.

If they are hosted on the same site, prefer `SameSite=Lax` or `SameSite=Strict` where the application flow permits it.

Client-cached permissions are for interface behavior only. The backend must continue to authorize every protected request independently.

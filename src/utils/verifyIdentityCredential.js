const base64UrlBytes = value => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "="));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
};

const parseJsonPart = value => JSON.parse(new TextDecoder().decode(base64UrlBytes(value)));
const pemBytes = value => base64UrlBytes(value.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, ""));

const algorithms = {
  RS256: { import: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, verify: { name: "RSASSA-PKCS1-v1_5" } },
  PS256: { import: { name: "RSA-PSS", hash: "SHA-256" }, verify: { name: "RSA-PSS", saltLength: 32 } },
  ES256: { import: { name: "ECDSA", namedCurve: "P-256" }, verify: { name: "ECDSA", hash: "SHA-256" } },
  EdDSA: { import: { name: "Ed25519" }, verify: { name: "Ed25519" } },
};

const importVerificationKey = async (publicKey, algorithm) => {
  if (!publicKey) throw new Error("Public key verifikasi belum tersedia di perangkat kantor.");
  const format = typeof publicKey === "object" ? "jwk" : "spki";
  const keyData = format === "jwk" ? publicKey : pemBytes(publicKey);
  return crypto.subtle.importKey(format, keyData, algorithm.import, false, ["verify"]);
};

export async function verifyIdentityCredential(rawToken, config) {
  const token = rawToken.trim().replace(/^gkr_identity_/, "");
  const parts = token.split(".");
  if (parts.length !== 3) throw Object.assign(new Error("Sistem tidak mengenali QR ini."), { code: "INVALID_QR" });
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  let header;
  let payload;
  try { header = parseJsonPart(encodedHeader); payload = parseJsonPart(encodedPayload); } catch { throw Object.assign(new Error("Sistem tidak mengenali QR ini."), { code: "INVALID_QR" }); }
  const algorithm = algorithms[header.alg];
  if (!algorithm || header.alg === "none") throw Object.assign(new Error("QR tidak memiliki tanda tangan Gakuren yang valid."), { code: "INVALID_SIGNATURE" });
  if (config.algorithm && config.algorithm !== header.alg) throw new Error("Algoritma credential tidak sesuai konfigurasi sekolah.");
  const publicKey = config.public_key_jwk || config.public_key;
  let key;
  try { key = await importVerificationKey(publicKey, algorithm); }
  catch { throw Object.assign(new Error("Credential tidak dapat diverifikasi secara offline."), { code: "CREDENTIAL_NOT_CACHED" }); }
  let valid = false;
  try { valid = await crypto.subtle.verify(algorithm.verify, key, base64UrlBytes(encodedSignature), new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)); } catch { valid = false; }
  if (!valid) throw Object.assign(new Error("QR tidak memiliki tanda tangan Gakuren yang valid."), { code: "INVALID_SIGNATURE" });
  if (!payload.credential_id || !payload.user_uuid || !payload.school_uuid) throw new Error("Identity credential tidak lengkap.");
  if (payload.school_uuid !== config.school_uuid) throw Object.assign(new Error("QR berasal dari sekolah yang berbeda."), { code: "WRONG_SCHOOL" });
  const version = payload.credential_version ?? payload.version;
  if (config.credential_version != null && version !== config.credential_version) throw new Error("Versi identity credential tidak didukung.");
  const now = Math.floor(Date.now() / 1000);
  if (payload.nbf && now < payload.nbf) throw new Error("Identity credential belum berlaku.");
  if (payload.exp && now >= payload.exp) throw new Error("Identity credential telah kedaluwarsa.");
  return payload;
}

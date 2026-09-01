const DB_NAME = "gakuren-attendance-offline";
const DB_VERSION = 2;
const CREDENTIALS = "identityCredentials";
const CONFIGS = "offlineConfigs";
const ATTENDANCES = "pendingAttendances";
const TRUSTED_DEVICES = "trustedDevices";
const SYNC_METADATA = "syncMetadata";

const openDatabase = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onerror = () => reject(request.error);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(CREDENTIALS)) database.createObjectStore(CREDENTIALS, { keyPath: "owner_uuid" });
    if (!database.objectStoreNames.contains(CONFIGS)) database.createObjectStore(CONFIGS, { keyPath: "school_uuid" });
    if (!database.objectStoreNames.contains(ATTENDANCES)) {
      const store = database.createObjectStore(ATTENDANCES, { keyPath: "local_uuid" });
      store.createIndex("sync_status", "sync_status", { unique: false });
      store.createIndex("deduplication_key", "deduplication_key", { unique: true });
      store.createIndex("user_uuid", "user_uuid", { unique: false });
      store.createIndex("attendance_date", "attendance_date", { unique: false });
      store.createIndex("attendance_type", "attendance_type", { unique: false });
      store.createIndex("created_at", "created_at", { unique: false });
    } else {
      const store = request.transaction.objectStore(ATTENDANCES);
      if (!store.indexNames.contains("sync_status")) store.createIndex("sync_status", "sync_status", { unique: false });
      if (!store.indexNames.contains("user_uuid")) store.createIndex("user_uuid", "user_uuid", { unique: false });
      if (!store.indexNames.contains("attendance_date")) store.createIndex("attendance_date", "attendance_date", { unique: false });
      if (!store.indexNames.contains("attendance_type")) store.createIndex("attendance_type", "attendance_type", { unique: false });
      if (!store.indexNames.contains("created_at")) store.createIndex("created_at", "created_at", { unique: false });
      store.openCursor().onsuccess = event => {
        const cursor = event.target.result;
        if (!cursor) return;
        const value = cursor.value;
        if (!value.sync_status && value.status) cursor.update({ ...value, sync_status: value.status });
        cursor.continue();
      };
    }
    if (!database.objectStoreNames.contains(TRUSTED_DEVICES)) database.createObjectStore(TRUSTED_DEVICES, { keyPath: "device_uuid" });
    if (!database.objectStoreNames.contains(SYNC_METADATA)) database.createObjectStore(SYNC_METADATA, { keyPath: "key" });
  };
  request.onsuccess = () => resolve(request.result);
});

const requestResult = request => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const inStore = async (storeName, mode, operation) => {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(storeName, mode);
    const result = await operation(transaction.objectStore(storeName));
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("Transaksi penyimpanan dibatalkan."));
    });
    return result;
  } finally {
    database.close();
  }
};

const put = (store, value) => requestResult(store.put(value));

export const offlineAttendanceStore = {
  saveIdentityCredential(ownerUuid, credential) {
    return inStore(CREDENTIALS, "readwrite", store => put(store, { ...credential, owner_uuid: ownerUuid, cached_at: new Date().toISOString() }));
  },
  getIdentityCredential(ownerUuid) {
    return inStore(CREDENTIALS, "readonly", store => requestResult(store.get(ownerUuid)));
  },
  saveOfflineConfig(config) {
    return inStore(CONFIGS, "readwrite", store => put(store, { ...config, cached_at: new Date().toISOString() }));
  },
  saveTrustedDevice(device) {
    return inStore(TRUSTED_DEVICES, "readwrite", store => put(store, { ...device, cached_at: new Date().toISOString() }));
  },
  getTrustedDevice(schoolUuid) {
    return inStore(TRUSTED_DEVICES, "readonly", store => requestResult(store.getAll()).then(items => items.find(item => !schoolUuid || item.school_uuid === schoolUuid)));
  },
  getOfflineConfig(schoolUuid) {
    return inStore(CONFIGS, "readonly", store => schoolUuid ? requestResult(store.get(schoolUuid)) : requestResult(store.getAll()).then(items => items[0]));
  },
  async addPendingAttendance(record) {
    try {
      await inStore(ATTENDANCES, "readwrite", store => put(store, record));
      return record;
    } catch (error) {
      if (error?.name === "ConstraintError") throw Object.assign(new Error("Kehadiran user sudah tercatat."), { code: "ALREADY_ATTENDED" });
      throw error;
    }
  },
  getPendingAttendances() {
    return inStore(ATTENDANCES, "readonly", store => requestResult(store.index("sync_status").getAll("PENDING_SYNC")));
  },
  getAllAttendances() {
    return inStore(ATTENDANCES, "readonly", store => requestResult(store.getAll()).then(items => items.sort((a, b) => String(b.recorded_at || b.created_at).localeCompare(String(a.recorded_at || a.created_at)))));
  },
  getAttendanceByDeduplicationKey(key) {
    return inStore(ATTENDANCES, "readonly", store => requestResult(store.index("deduplication_key").get(key)));
  },
  updateAttendance(localUuid, changes) {
    return inStore(ATTENDANCES, "readwrite", async store => {
      const current = await requestResult(store.get(localUuid));
      if (!current) return null;
      const updated = { ...current, ...changes };
      await put(store, updated);
      return updated;
    });
  },
  setSyncMetadata(key, value) {
    return inStore(SYNC_METADATA, "readwrite", store => put(store, { key, ...value, updated_at: new Date().toISOString() }));
  },
  getSyncMetadata(key) {
    return inStore(SYNC_METADATA, "readonly", store => requestResult(store.get(key)));
  },
};

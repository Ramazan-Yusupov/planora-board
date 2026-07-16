const DATABASE_NAME = "drawtool-workspace";
// Version 3 adds workspaceMeta. The runtime repair below also upgrades a
// malformed database that reports a current version but has a missing store.
const DATABASE_VERSION = 3;
const PROJECTS_STORE = "projects";
const WORKSPACE_META_STORE = "workspaceMeta";

type StoreName = typeof PROJECTS_STORE | typeof WORKSPACE_META_STORE;

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionToPromise(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function ensureStores(database: IDBDatabase) {
  if (!database.objectStoreNames.contains(PROJECTS_STORE)) {
    const store = database.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
    store.createIndex("updatedAt", "updatedAt");
  }

  if (!database.objectStoreNames.contains(WORKSPACE_META_STORE)) {
    database.createObjectStore(WORKSPACE_META_STORE, { keyPath: "key" });
  }
}

function hasRequiredStores(database: IDBDatabase) {
  return [PROJECTS_STORE, WORKSPACE_META_STORE].every((storeName) =>
    database.objectStoreNames.contains(storeName),
  );
}

function openDatabase(version?: number) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = version === undefined
      ? window.indexedDB.open(DATABASE_NAME)
      : window.indexedDB.open(DATABASE_NAME, version);

    request.onupgradeneeded = () => {
      ensureStores(request.result);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open IndexedDB"));
    request.onblocked = () => reject(new Error("Закройте другие вкладки DrawTool и повторите попытку."));
  });
}

/**
 * Opens the local database and repairs old builds that used the same IndexedDB
 * version without creating the workspaceMeta store. Existing project data is
 * preserved; only the missing metadata store is added during the upgrade.
 */
export async function openDrawToolDatabase() {
  if (typeof window === "undefined" || !window.indexedDB) {
    throw new Error("IndexedDB is unavailable");
  }

  // Open the installed database first. This prevents a future repaired schema
  // (with a version higher than DATABASE_VERSION) from throwing VersionError.
  let database = await openDatabase();

  if (database.version < DATABASE_VERSION) {
    database.close();
    database = await openDatabase(DATABASE_VERSION);
  }

  if (!hasRequiredStores(database)) {
    const repairVersion = database.version + 1;
    database.close();
    database = await openDatabase(repairVersion);
  }

  if (!hasRequiredStores(database)) {
    database.close();
    throw new Error("Не удалось подготовить локальное хранилище DrawTool.");
  }

  database.onversionchange = () => database.close();
  return database;
}

async function getRecord<T>(storeName: StoreName, key: IDBValidKey) {
  const database = await openDrawToolDatabase();
  const transaction = database.transaction(storeName, "readonly");
  const request = transaction.objectStore(storeName).get(key);

  try {
    return (await requestToPromise(request)) as T | undefined;
  } finally {
    database.close();
  }
}

async function getAllRecords<T>(storeName: StoreName) {
  const database = await openDrawToolDatabase();
  const transaction = database.transaction(storeName, "readonly");
  const request = transaction.objectStore(storeName).getAll();

  try {
    return (await requestToPromise(request)) as T[];
  } finally {
    database.close();
  }
}

async function putRecord<T>(storeName: StoreName, record: T) {
  const database = await openDrawToolDatabase();
  const transaction = database.transaction(storeName, "readwrite");
  transaction.objectStore(storeName).put(record);

  try {
    await transactionToPromise(transaction);
  } finally {
    database.close();
  }
}

async function deleteRecord(storeName: StoreName, key: IDBValidKey) {
  const database = await openDrawToolDatabase();
  const transaction = database.transaction(storeName, "readwrite");
  transaction.objectStore(storeName).delete(key);

  try {
    await transactionToPromise(transaction);
  } finally {
    database.close();
  }
}

export async function replaceIndexedRecords<T>(storeName: StoreName, records: T[]) {
  const database = await openDrawToolDatabase();
  const transaction = database.transaction(storeName, "readwrite");
  const store = transaction.objectStore(storeName);
  store.clear();
  records.forEach((record) => store.put(record));

  try {
    await transactionToPromise(transaction);
  } finally {
    database.close();
  }
}

export function getIndexedRecord<T>(key: IDBValidKey) {
  return getRecord<T>(PROJECTS_STORE, key);
}

export function getAllIndexedRecords<T>() {
  return getAllRecords<T>(PROJECTS_STORE);
}

export function putIndexedRecord<T>(record: T) {
  return putRecord(PROJECTS_STORE, record);
}

export function deleteIndexedRecord(key: IDBValidKey) {
  return deleteRecord(PROJECTS_STORE, key);
}

export function replaceIndexedProjectRecords<T>(records: T[]) {
  return replaceIndexedRecords(PROJECTS_STORE, records);
}

export function getWorkspaceMetaRecord<T>(key: IDBValidKey) {
  return getRecord<T>(WORKSPACE_META_STORE, key);
}

export function putWorkspaceMetaRecord<T>(record: T) {
  return putRecord(WORKSPACE_META_STORE, record);
}

export function deleteWorkspaceMetaRecord(key: IDBValidKey) {
  return deleteRecord(WORKSPACE_META_STORE, key);
}


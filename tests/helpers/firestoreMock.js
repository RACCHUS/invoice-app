// In-memory stand-in for the subset of firebase/firestore used by the services.
export const store = new Map();
let nextId = 1;
let clock = 1;

const table = name => {
  if (!store.has(name)) store.set(name, new Map());
  return store.get(name);
};

const failures = new Map();
// Makes the next call to the named operation (e.g. 'deleteDoc') reject with the given error.
export const failNext = (operation, error) => failures.set(operation, error);
const maybeFail = operation => {
  const error = failures.get(operation);
  if (!error) return;
  failures.delete(operation);
  throw error;
};

export const resetStore = () => { store.clear(); failures.clear(); nextId = 1; clock = 1; };
export const getFirestore = () => ({});
export const db = {};
export const serverTimestamp = () => ({ seconds: clock++ });
export const collection = (_db, name) => ({ kind: 'collection', name });
export const doc = (parent, name, id) => parent.kind === 'collection'
  ? { kind: 'doc', collection: parent.name, id: `auto-${nextId++}` }
  : { kind: 'doc', collection: name, id };
export const where = (field, op, value) => ({ field, op, value });
export const query = (col, ...filters) => ({ ...col, filters });

const snapshot = (ref, data) => ({ id: ref.id, exists: () => data !== undefined, data: () => data && structuredClone(data) });

export async function getDocs(q) {
  const docs = [...table(q.name).entries()]
    .filter(([, data]) => (q.filters || []).every(f => data[f.field] === f.value))
    .map(([id, data]) => snapshot({ id }, data));
  return { docs, forEach: fn => docs.forEach(fn) };
}
export const getDoc = async ref => snapshot(ref, table(ref.collection).get(ref.id));
export const setDoc = async (ref, data, options = {}) => {
  const current = options.merge ? table(ref.collection).get(ref.id) || {} : {};
  table(ref.collection).set(ref.id, structuredClone({ ...current, ...data }));
};
export const updateDoc = async (ref, data) => {
  if (!table(ref.collection).has(ref.id)) throw new Error(`No document ${ref.collection}/${ref.id}`);
  await setDoc(ref, data, { merge: true });
};
export const addDoc = async (col, data) => {
  const ref = doc(col);
  await setDoc(ref, data);
  return ref;
};
export const deleteDoc = async ref => { maybeFail('deleteDoc'); table(ref.collection).delete(ref.id); };
export const writeBatch = () => {
  const ops = [];
  return {
    set: (ref, data, options) => ops.push(() => setDoc(ref, data, options)),
    update: (ref, data) => ops.push(() => updateDoc(ref, data)),
    commit: async () => { for (const op of ops) await op(); }
  };
};

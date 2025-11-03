// helper para stringify seguro (convierte Firestore Timestamp a ISO)
const safeStringify = (obj: any) =>
  JSON.stringify(
    obj,
    (_k, v) => {
      // Firestore Timestamp
      if (v && typeof v?.toDate === "function") return v.toDate().toISOString();
      return v;
    },
    2
  );

export const logDeep = (label: string, obj: any) => {
  // quita el if (__DEV__) si quieres ver logs también en producción
  if (typeof __DEV__ === "undefined" || __DEV__) {
    console.log(label, safeStringify(obj));
  }
};

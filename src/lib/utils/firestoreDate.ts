// utils/firestoreDate.ts
export const toDateSafe = (v: any): Date => {
  if (v?.toDate) return v.toDate() as Date
  if (v instanceof Date) return v
  return new Date()
}

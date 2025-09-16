// Conexion con Backend
import Constants from "expo-constants"
export const PROCESS_URL =
  (Constants.expoConfig?.extra?.PROCESS_URL as string) ??
  process.env.EXPO_PUBLIC_PROCESS_URL ??
  "https://094ffdeddede.ngrok-free.app"


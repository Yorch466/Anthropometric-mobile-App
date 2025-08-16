// src/lib/googleSignIn.ts
import * as WebBrowser from "expo-web-browser";
import {
  AuthRequest,
  ResponseType,
  makeRedirectUri,
} from "expo-auth-session";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

/**
 * Inicia sesión con Google (Expo Auth Session v6, sin hooks)
 * Requiere EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID en el entorno
 */
export async function signInWithGoogle() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!clientId) throw new Error("Falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID");

  const redirectUri = makeRedirectUri({ preferLocalhost: false });
  // const nonce = generateRandom(16);

  // Construye la request OIDC (con id_token)
  const request = new AuthRequest({
    clientId,
    responseType: ResponseType.IdToken,
    scopes: ["openid", "email", "profile"],
    redirectUri,
    // extraParams: { nonce },
  });

  // IMPORTANTE: prepara la URL de autorización
  await request.makeAuthUrlAsync({ authorizationEndpoint: GOOGLE_AUTH_ENDPOINT });

  // Abre el navegador (usa el proxy de Expo para simplificar en dev)
  const result = await request.promptAsync(
    // { useProxy: true, redirectUri },
    { authorizationEndpoint: GOOGLE_AUTH_ENDPOINT }
  );

  if (result.type !== "success" || !result.params?.id_token) {
    throw new Error("Google sign-in cancelado o sin id_token");
  }

  const idToken = String(result.params.id_token);
  const cred = GoogleAuthProvider.credential(idToken);
  return await signInWithCredential(auth, cred);
}

import { FirebaseError } from "firebase/app";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/admin-restricted-operation": "Este provedor de login está desativado no Firebase Console.",
  "auth/email-already-in-use": "Este e-mail já está em uso.",
  "auth/invalid-credential": "E-mail ou senha inválidos.",
  "auth/invalid-email": "Informe um e-mail válido.",
  "auth/operation-not-allowed": "Este método de login não está ativado no Firebase Console.",
  "auth/popup-closed-by-user": "Login com Google cancelado.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
  "auth/unauthorized-domain": "Este domínio não está autorizado no Firebase Authentication.",
  "auth/user-not-found": "Usuário não encontrado.",
  "auth/weak-password": "A senha precisa ser mais forte.",
  "storage/canceled": "Upload cancelado.",
};

export function getFirebaseErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    return AUTH_ERROR_MESSAGES[error.code] ?? error.message;
  }

  if (error instanceof Error) return error.message;

  return "Algo inesperado aconteceu.";
}

import type { Metadata } from "next";
import { AuthForm } from "@/components/shared/auth-form";

export const metadata: Metadata = {
  title: "Recuperar senha",
};

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex w-full max-w-md justify-center">
      <AuthForm mode="reset" />
    </div>
  );
}

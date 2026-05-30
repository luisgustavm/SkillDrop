import type { Metadata } from "next";
import { AuthForm } from "@/components/shared/auth-form";

export const metadata: Metadata = {
  title: "Registro",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto flex w-full max-w-md justify-center">
      <AuthForm mode="register" />
    </div>
  );
}

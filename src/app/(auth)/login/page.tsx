import type { Metadata } from "next";
import { AuthForm } from "@/components/shared/auth-form";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md justify-center">
      <AuthForm mode="login" />
    </div>
  );
}

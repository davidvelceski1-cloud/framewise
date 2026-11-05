import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="hero-gradient -mt-[68px] flex min-h-[86vh] items-center justify-center px-6 pt-[100px]">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase-browser";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthAlert } from "@/components/auth/auth-alert";
import { GoogleButton } from "@/components/auth/google-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <AuthCard title="Welcome back" description="Sign in to your account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <AuthAlert type="error" message={error} />}

        <div>
          <Label htmlFor="email" required>Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" required>Password</Label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            type="checkbox"
            className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
            {...register("rememberMe")}
          />
          <label htmlFor="rememberMe" className="text-sm text-surface-600">
            Remember me
          </label>
        </div>

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-surface-200" />
        <span className="text-xs text-surface-400">or</span>
        <div className="h-px flex-1 bg-surface-200" />
      </div>

      <GoogleButton />

      <p className="mt-6 text-center text-sm text-surface-500">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="font-medium text-primary-600 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}

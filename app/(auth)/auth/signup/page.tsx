"use client";

import { useState } from "react";
import Link from "next/link";
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

const schema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <AuthCard title="Check your email" description="We sent you a confirmation link">
        <AuthAlert
          type="success"
          message="A verification email has been sent. Click the link to activate your account."
        />
        <p className="mt-6 text-center text-sm text-surface-500">
          Already verified?{" "}
          <Link href="/auth/login" className="font-medium text-primary-600 hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create an account" description="Start tracking your trades today">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <AuthAlert type="error" message={error} />}

        <div>
          <Label htmlFor="fullName" required>Full name</Label>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="John Smith"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </div>

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
          <Label htmlFor="password" required>Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            error={errors.password?.message}
            {...register("password")}
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword" required>Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-surface-200" />
        <span className="text-xs text-surface-400">or</span>
        <div className="h-px flex-1 bg-surface-200" />
      </div>

      <GoogleButton />

      <p className="mt-6 text-center text-sm text-surface-500">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-primary-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

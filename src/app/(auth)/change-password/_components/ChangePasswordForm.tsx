"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    password: z.string().min(6, "Min 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof schema>;

export default function ChangePasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const emailRef = useRef<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const storedEmail = localStorage.getItem("reset-email");

    if (!storedEmail) {
      toast.error("Please verify your email first.");
      router.replace("/forgot-password");
      return;
    }

    emailRef.current = storedEmail;
  }, [router]);

  const onSubmit = async (values: ChangePasswordValues) => {
    if (!emailRef.current) {
      toast.error("Missing reset email. Please start again.");
      router.push("/forgot-password");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: emailRef.current,
            password: values.password,
          }),
        }
      );

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      localStorage.removeItem("reset-email");
      toast.success("Password changed!");
      router.push("/signin");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    }
  };

  const inputClassName =
    "h-11 rounded-md border border-[#D1D5DB] bg-white px-4 pr-12 text-[14px] text-[#0A0A0B] placeholder:text-[#6B7280] focus-visible:border-[#0B5280] focus-visible:ring-0";

  return (
    <div className="w-full max-w-[480px] rounded-xl bg-white px-10 py-12 shadow-sm">
      <div className="text-center">
        <h1 className="text-[40px] font-semibold leading-[150%] text-[#0B5280]">
          Change Password
        </h1>
        <p className="mt-1 text-[14px] font-normal text-[#6B7280]">
          Enter your email to reset your password
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div>
          <Label
            htmlFor="password"
            className="text-[14px] font-medium text-[#0A0A0B]"
          >
            Create New Password
          </Label>
          <div className="relative mt-2">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              className={inputClassName}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-4 flex items-center text-[#6B7280] transition hover:text-[#0A0A0B]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p className="mt-1 text-sm text-red-500">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div>
          <Label
            htmlFor="confirmPassword"
            className="text-[14px] font-medium text-[#0A0A0B]"
          >
            Confirm New Password
          </Label>
          <div className="relative mt-2">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              className={inputClassName}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute inset-y-0 right-4 flex items-center text-[#6B7280] transition hover:text-[#0A0A0B]"
              aria-label={
                showConfirmPassword ? "Hide confirm password" : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword ? (
            <p className="mt-1 text-sm text-red-500">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-md bg-[#0B5280] text-[16px] font-semibold text-white hover:bg-[#094570]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Change Password"
          )}
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Invalid email"),
});

type ForgotPasswordValues = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/user/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: values.email }),
        }
      );

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      localStorage.setItem("reset-email", values.email);
      toast.success("OTP sent!");
      router.push("/verify-otp");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send OTP"
      );
    }
  };

  return (
    <div className="w-full max-w-[480px] rounded-xl bg-white px-10 py-12 shadow-sm">
      <div className="text-center">
        <h1 className="text-[40px] font-semibold leading-[150%] text-[#0B5280]">
          Forgot Password
        </h1>
        <p className="mt-1 text-[14px] font-normal text-[#6B7280]">
          Enter your email to receive your password
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div>
          <Label
            htmlFor="email"
            className="text-[14px] font-medium text-[#0A0A0B]"
          >
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="hello@example.com"
            className="mt-2 h-11 rounded-md border border-[#D1D5DB] bg-white px-4 text-[14px] text-[#0A0A0B] placeholder:text-[#6B7280] focus-visible:border-[#0B5280] focus-visible:ring-0"
            {...register("email")}
          />
          {errors.email ? (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
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
              Sending...
            </>
          ) : (
            "Send OTP"
          )}
        </Button>
      </form>
    </div>
  );
}

"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const schema = z.object({
  otp: z
    .string()
    .length(6, "Enter the full 6-digit OTP")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

type VerifyOtpValues = z.infer<typeof schema>;

export default function VerifyOtpForm() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const emailRef = useRef<string>("");

  const {
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    const storedEmail = localStorage.getItem("reset-email");

    if (!storedEmail) {
      toast.error("Please enter your email first.");
      router.replace("/forgot-password");
      return;
    }

    emailRef.current = storedEmail;
  }, [router]);

  const syncOtp = (nextDigits: string[]) => {
    setDigits(nextDigits);
    setValue("otp", nextDigits.join(""), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleDigitChange = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = nextValue;
    syncOtp(nextDigits);

    if (nextValue && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (value: string) => {
    const pastedDigits = value.replace(/\D/g, "").slice(0, 6).split("");
    if (!pastedDigits.length) return;

    const nextDigits = Array(6)
      .fill("")
      .map((_, index) => pastedDigits[index] || "");

    syncOtp(nextDigits);

    const nextFocusIndex = Math.min(pastedDigits.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const resendOtp = async () => {
    if (!emailRef.current) {
      toast.error("Missing reset email. Please start again.");
      router.push("/forgot-password");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/user/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: emailRef.current }),
        }
      );

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      toast.success("OTP resent!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to resend OTP"
      );
    }
  };

  const onSubmit = async (values: VerifyOtpValues) => {
    if (!emailRef.current) {
      toast.error("Missing reset email. Please start again.");
      router.push("/forgot-password");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/user/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: emailRef.current,
            otp: values.otp,
          }),
        }
      );

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      toast.success("Email verified successfully");
      router.push("/change-password");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "OTP verification failed"
      );
    }
  };

  return (
    <div className="w-full max-w-[480px] rounded-xl bg-white px-10 py-12 shadow-sm">
      <div className="text-center">
        <h1 className="text-[40px] font-semibold leading-[150%] text-[#0B5280]">
          Verify Email
        </h1>
        <p className="mt-1 text-[14px] font-normal text-[#6B7280]">
          Enter OTP to verify your email address
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <div className="flex justify-center gap-3">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(event) =>
                  handleDigitChange(index, event.target.value)
                }
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={(event) => {
                  event.preventDefault();
                  handlePaste(event.clipboardData.getData("text"));
                }}
                className="h-12 w-12 rounded-md border border-[#D1D5DB] text-center text-xl font-semibold text-[#0A0A0B] outline-none transition focus:border-[#0B5280]"
              />
            ))}
          </div>

          {errors.otp ? (
            <p className="mt-2 text-center text-sm text-red-500">
              {errors.otp.message}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4 text-[14px]">
          <div className="flex items-center gap-2 text-[#16A34A]">
            <CheckCircle2 className="size-4" />
            <span>Valid</span>
          </div>

          <button
            type="button"
            onClick={resendOtp}
            className="font-medium text-[#0B5280] transition hover:text-[#094570]"
          >
            Didn&apos;t get a code? Resend
          </button>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-md bg-[#0B5280] text-[16px] font-semibold text-white hover:bg-[#094570]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
      </form>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
  rememberMe: z.boolean().optional(),
});

type SignInValues = z.infer<typeof schema>;

export default function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe") ?? false;

  const onSubmit = async (values: SignInValues) => {
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid credentials");
      return;
    }

    toast.success("Logged in successfully");
    router.push("/");
  };

  const inputClassName =
    "mt-2 h-11 rounded-md border border-[#D1D5DB] bg-white px-4 text-[14px] text-[#0A0A0B] placeholder:text-[#6B7280] focus-visible:border-[#0B5280] focus-visible:ring-0";

  return (
    <div className="w-full max-w-[480px] rounded-xl bg-white px-10 py-12 shadow-sm">
      <div className="text-center">
        <h1 className="text-[40px] font-semibold leading-[150%] text-[#0B5280]">
          Welcome
        </h1>
        <p className="mt-1 text-[14px] font-normal text-[#6B7280]">
          Sign in to oversee accounts, listings, and updates
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
            className={inputClassName}
            {...register("email")}
          />
          {errors.email ? (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          ) : null}
        </div>

        <div>
          <Label
            htmlFor="password"
            className="text-[14px] font-medium text-[#0A0A0B]"
          >
            Password
          </Label>
          <div className="relative mt-2">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="h-11 rounded-md border border-[#D1D5DB] bg-white px-4 pr-12 text-[14px] text-[#0A0A0B] placeholder:text-[#6B7280] focus-visible:border-[#0B5280] focus-visible:ring-0"
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

        <div className="flex items-center justify-between gap-4 pt-1">
          <label className="flex items-center gap-2 text-[14px] font-medium text-[#0A0A0B]">
            <Checkbox
              checked={rememberMe}
              onCheckedChange={(checked) =>
                setValue("rememberMe", checked === true, {
                  shouldDirty: true,
                })
              }
              className="size-4 rounded-[4px] border-[#D1D5DB] data-[state=checked]:border-[#0B5280] data-[state=checked]:bg-[#0B5280]"
            />
            Remember me
          </label>

          <Link
            href="/forgot-password"
            className="text-[14px] font-medium text-[#0B5280] transition hover:text-[#094570]"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-md bg-[#0B5280] text-[16px] font-semibold text-white hover:bg-[#094570]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Logging In...
            </>
          ) : (
            "Log In"
          )}
        </Button>
      </form>
    </div>
  );
}

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, UploadCloud } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z
  .object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    country: z.string().min(2, 'Country is required'),
    email: z.string().email('Invalid email'),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    password: z.string().min(6, 'Min 6 characters'),
    confirmPassword: z.string().min(6, 'Min 6 characters'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignUpValues = z.infer<typeof schema>

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api/v1'

export default function SignUpForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [profilePicture, setProfilePicture] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      country: '',
      email: '',
      phoneNumber: '',
      address: '',
      password: '',
      confirmPassword: '',
    },
  })

  const inputClassName = useMemo(
    () =>
      'mt-2 h-11 rounded-md border border-[#D1D5DB] bg-white px-4 text-[14px] text-[#0A0A0B] placeholder:text-[#6B7280] focus-visible:border-[#0B5280] focus-visible:ring-0',
    [],
  )

  const onSubmit = async (values: SignUpValues) => {
    try {
      const formData = new FormData()
      formData.append('role', 'admin')
      formData.append('firstName', values.firstName.trim())
      formData.append('lastName', values.lastName.trim())
      formData.append('country', values.country.trim())
      formData.append('email', values.email.trim())
      formData.append('password', values.password)

      if (values.phoneNumber?.trim()) {
        formData.append('phoneNumber', values.phoneNumber.trim())
      }

      if (values.address?.trim()) {
        formData.append('address', values.address.trim())
      }

      if (profilePicture) {
        formData.append('profilePicture', profilePicture)
      }

      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        body: formData,
      })

      const result = (await response.json()) as { message?: string }

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create admin account')
      }

      toast.success('Admin account created successfully')
      router.push('/signin')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create account')
    }
  }

  return (
    <div className="w-full max-w-[860px] rounded-2xl border border-[#D9E4EC] bg-white px-6 py-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:px-10">
      <div className="text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-[#0B5280]">
          Admin Access
        </p>
        <h1 className="mt-3 text-[38px] font-semibold leading-tight text-[#0A0A0B]">
          Create your dashboard account
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-[#6B7280]">
          Register a new admin user using the backend auth API.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="firstName" className="text-[14px] font-medium text-[#0A0A0B]">
              First Name
            </Label>
            <Input id="firstName" placeholder="First name" className={inputClassName} {...register('firstName')} />
            {errors.firstName ? <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p> : null}
          </div>

          <div>
            <Label htmlFor="lastName" className="text-[14px] font-medium text-[#0A0A0B]">
              Last Name
            </Label>
            <Input id="lastName" placeholder="Last name" className={inputClassName} {...register('lastName')} />
            {errors.lastName ? <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p> : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="country" className="text-[14px] font-medium text-[#0A0A0B]">
              Country
            </Label>
            <Input id="country" placeholder="Country" className={inputClassName} {...register('country')} />
            {errors.country ? <p className="mt-1 text-sm text-red-500">{errors.country.message}</p> : null}
          </div>

          <div>
            <Label htmlFor="phoneNumber" className="text-[14px] font-medium text-[#0A0A0B]">
              Phone Number
            </Label>
            <Input id="phoneNumber" placeholder="Phone number" className={inputClassName} {...register('phoneNumber')} />
          </div>
        </div>

        <div>
          <Label htmlFor="address" className="text-[14px] font-medium text-[#0A0A0B]">
            Address
          </Label>
          <Input id="address" placeholder="Address" className={inputClassName} {...register('address')} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="email" className="text-[14px] font-medium text-[#0A0A0B]">
              Email Address
            </Label>
            <Input id="email" type="email" placeholder="hello@example.com" className={inputClassName} {...register('email')} />
            {errors.email ? <p className="mt-1 text-sm text-red-500">{errors.email.message}</p> : null}
          </div>

          <div>
            <Label htmlFor="profilePicture" className="text-[14px] font-medium text-[#0A0A0B]">
              Profile Picture
            </Label>
            <label
              htmlFor="profilePicture"
              className="mt-2 flex h-11 cursor-pointer items-center justify-between rounded-md border border-dashed border-[#C7D2DF] bg-[#F8FBFD] px-4 text-[14px] text-[#6B7280] transition hover:border-[#0B5280] hover:text-[#0B5280]"
            >
              <span className="truncate">{profilePicture?.name || 'Upload a profile image'}</span>
              <UploadCloud className="size-4 shrink-0" />
            </label>
            <input
              id="profilePicture"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={event => setProfilePicture(event.target.files?.[0] || null)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="password" className="text-[14px] font-medium text-[#0A0A0B]">
              Password
            </Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create password"
                className="h-11 rounded-md border border-[#D1D5DB] bg-white px-4 pr-12 text-[14px] text-[#0A0A0B] placeholder:text-[#6B7280] focus-visible:border-[#0B5280] focus-visible:ring-0"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(current => !current)}
                className="absolute inset-y-0 right-4 flex items-center text-[#6B7280] transition hover:text-[#0A0A0B]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {errors.password ? <p className="mt-1 text-sm text-red-500">{errors.password.message}</p> : null}
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-[14px] font-medium text-[#0A0A0B]">
              Confirm Password
            </Label>
            <div className="relative mt-2">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                className="h-11 rounded-md border border-[#D1D5DB] bg-white px-4 pr-12 text-[14px] text-[#0A0A0B] placeholder:text-[#6B7280] focus-visible:border-[#0B5280] focus-visible:ring-0"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(current => !current)}
                className="absolute inset-y-0 right-4 flex items-center text-[#6B7280] transition hover:text-[#0A0A0B]"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {errors.confirmPassword ? (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            ) : null}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-md bg-[#0B5280] text-[16px] font-semibold text-white hover:bg-[#094570]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>

        <p className="text-center text-[14px] text-[#6B7280]">
          Already have an account?{' '}
          <Link href="/signin" className="font-semibold text-[#0B5280] transition hover:text-[#094570]">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}

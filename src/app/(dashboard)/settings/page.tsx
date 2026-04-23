'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Camera, FileText, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { ProfileFormSkeleton } from '../_components/SkeletonBlocks'

type SessionUser = {
  accessToken?: string | null
}

type ProfileData = {
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  country?: string
  address?: string
  profilePicture?: string
}

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL

export default function SettingsPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const accessToken = user?.accessToken

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    country: '',
    address: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileImage, setProfileImage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (!accessToken) return

    const loadProfile = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${baseUrl}/user/profile`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        const result = (await response.json()) as { message?: string; data?: ProfileData }

        if (!response.ok) {
          throw new Error(result.message || 'Failed to load profile')
        }

        const data = result.data || {}
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          country: data.country || '',
          address: data.address || '',
        })
        setProfileImage(data.profilePicture || '')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [accessToken])

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(current => ({ ...current, [field]: value }))
  }

  const handleImageChange = (file: File | null) => {
    setSelectedFile(file)

    if (!file) {
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setProfileImage(previewUrl)
  }

  const handleSave = async () => {
    if (!accessToken) return

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('firstName', form.firstName)
      formData.append('lastName', form.lastName)
      formData.append('email', form.email)
      formData.append('phoneNumber', form.phoneNumber)
      formData.append('country', form.country)
      formData.append('address', form.address)

      if (selectedFile) {
        formData.append('profilePicture', selectedFile)
      }

      const response = await fetch(`${baseUrl}/user/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })

      const result = (await response.json()) as { message?: string; data?: ProfileData }

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile')
      }

      if (result.data?.profilePicture) {
        setProfileImage(result.data.profilePicture)
      }

      setSelectedFile(null)
      window.dispatchEvent(new Event('profile-updated'))
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#ECF7FD] p-8">
      <div className="rounded-sm bg-white px-4 py-3 shadow-sm">
        <h1 className="text-[18px] font-medium text-[#0A0A0B]">Settings</h1>
      </div>

      <div className="mt-5 flex justify-end">
        <Link
          href="/settings/change-password"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[#2F6FB3] px-4 text-[15px] font-medium text-white transition hover:bg-[#0B5280]"
        >
          <KeyRound className="size-4" />
          Change password
        </Link>
      </div>

      <section className="mt-3 rounded-xl bg-white px-5 py-5 shadow-sm">
        <h2 className="text-center text-[20px] font-semibold text-[#333333]">Personal Information</h2>

        {loading ? (
          <ProfileFormSkeleton />
        ) : (
          <>
            <div className="mt-6 flex flex-col items-center gap-4 border-b border-[#E5E7EB] pb-6">
              <div className="relative">
                <div className="h-[110px] w-[110px] overflow-hidden rounded-full border-4 border-[#ECF7FD] bg-[#D9E7F3]">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt="Profile picture"
                      width={110}
                      height={110}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[28px] font-semibold text-[#0B5280]">
                      {(form.firstName?.[0] || form.email?.[0] || 'A').toUpperCase()}
                    </div>
                  )}
                </div>

                <label
                  htmlFor="profile-picture"
                  className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#2F6FB3] text-white shadow-lg transition hover:bg-[#0B5280]"
                >
                  <Camera className="size-5" />
                </label>
              </div>

              <div className="text-center">
                <p className="text-[18px] font-semibold text-[#0A0A0B]">
                  {[form.firstName, form.lastName].filter(Boolean).join(' ') || 'Admin Profile'}
                </p>
                <p className="mt-1 text-[14px] text-[#6B7280]">Upload a profile picture for your dashboard header</p>
              </div>

              <input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={event => handleImageChange(event.target.files?.[0] || null)}
                className="hidden"
              />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#4B5563]">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={event => handleChange('firstName', event.target.value)}
                  className="h-11 w-full rounded-md border border-[#4B5563] px-4 text-[14px] outline-none focus:border-[#0B5280]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#4B5563]">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={event => handleChange('lastName', event.target.value)}
                  className="h-11 w-full rounded-md border border-[#4B5563] px-4 text-[14px] outline-none focus:border-[#0B5280]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#4B5563]">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={event => handleChange('email', event.target.value)}
                  className="h-11 w-full rounded-md border border-[#4B5563] px-4 text-[14px] outline-none focus:border-[#0B5280]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#4B5563]">Phone</label>
                <input
                  type="text"
                  value={form.phoneNumber}
                  onChange={event => handleChange('phoneNumber', event.target.value)}
                  className="h-11 w-full rounded-md border border-[#4B5563] px-4 text-[14px] outline-none focus:border-[#0B5280]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#4B5563]">Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={event => handleChange('country', event.target.value)}
                  className="h-11 w-full rounded-md border border-[#4B5563] px-4 text-[14px] outline-none focus:border-[#0B5280]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#4B5563]">City/State</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={event => handleChange('address', event.target.value)}
                  className="h-11 w-full rounded-md border border-[#4B5563] px-4 text-[14px] outline-none focus:border-[#0B5280]"
                />
              </div>
            </div>
          </>
        )}
      </section>

      <button
        type="button"
        onClick={handleSave}
        disabled={loading || saving}
        className="mt-8 inline-flex h-14 w-full items-center justify-center gap-3 rounded-md bg-[#2F6FB3] text-[18px] font-semibold text-white transition hover:bg-[#0B5280] disabled:opacity-60"
      >
        <FileText className="size-5" />
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}

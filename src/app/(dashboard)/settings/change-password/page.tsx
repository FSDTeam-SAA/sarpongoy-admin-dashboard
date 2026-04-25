'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { PasswordCardSkeleton } from '../../_components/SkeletonBlocks'

type SessionUser = {
  name?: string | null
  email?: string | null
  accessToken?: string | null
}

type ProfileData = {
  firstName?: string
  lastName?: string
  profilePicture?: string
}

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL

export default function ChangePasswordSettingsPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const accessToken = user?.accessToken

  const [profileName, setProfileName] = useState('Admin')
  const [profileImage, setProfileImage] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!accessToken) return

    const loadProfile = async () => {
      try {
        setLoadingProfile(true)
        const response = await fetch(`${baseUrl}/user/profile`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        const result = (await response.json()) as { data?: ProfileData; message?: string }

        if (!response.ok) {
          throw new Error(result.message || 'Failed to load profile')
        }

        const fullName = [result.data?.firstName, result.data?.lastName].filter(Boolean).join(' ')
        setProfileName(fullName || user?.name || user?.email || 'Admin')
        setProfileImage(result.data?.profilePicture || '')
      } catch {
        setProfileName(user?.name || user?.email || 'Admin')
        setProfileImage('')
      } finally {
        setLoadingProfile(false)
      }
    }

    loadProfile()
  }, [accessToken, user?.email, user?.name])

  const handleSave = async () => {
    if (!accessToken) return

    if (!form.currentPassword || !form.newPassword || !form.confirmNewPassword) {
      toast.error('Please fill all password fields')
      return
    }

    if (form.newPassword !== form.confirmNewPassword) {
      toast.error('New passwords do not match')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`${baseUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      })

      const result = (await response.json()) as { message?: string }

      if (!response.ok) {
        throw new Error(result.message || 'Failed to change password')
      }

      toast.success('Password changed successfully')
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#ECF7FD] p-8">
      <div className="rounded-sm bg-white px-4 py-3 shadow-sm">
        <h1 className="text-[18px] font-medium text-[#0A0A0B]">Settings</h1>
      </div>

      {loadingProfile ? (
        <div className="mt-6">
          <PasswordCardSkeleton />
        </div>
      ) : (
        <>
      <section className="mt-6 rounded-xl border border-[#B9C6D2] bg-[#ECF7FD] px-4 py-3">
        <div className="flex items-center gap-4">
          {profileImage ? (
            <Image
              src={profileImage}
              alt="profile"
              width={72}
              height={72}
              className="h-[72px] w-[72px] rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white text-[24px] font-semibold text-[#0B5280] shadow-sm">
              {(profileName[0] || 'A').toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-[20px] font-semibold text-[#0A0A0B]">{profileName}</h2>
            <p className="text-[16px] text-[#0A0A0B]">@admin</p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-[#B9C6D2] bg-[#ECF7FD] px-4 py-4">
        <h2 className="text-[18px] font-semibold text-[#0A0A0B]">Change password</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-[14px] font-medium text-[#0A0A0B]">Current Password</label>
            <div className="relative">
              <input
                type={showPasswords.currentPassword ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={event => setForm(current => ({ ...current, currentPassword: event.target.value }))}
                className="h-12 w-full rounded-md border border-[#3B82F6] bg-transparent px-4 pr-12 text-[16px] outline-none placeholder:text-[15px]"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords(current => ({ ...current, currentPassword: !current.currentPassword }))
                }
                className="absolute inset-y-0 right-4 flex items-center text-[#6B7280] transition hover:text-[#0A0A0B]"
                aria-label={showPasswords.currentPassword ? 'Hide current password' : 'Show current password'}
              >
                {showPasswords.currentPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[14px] font-medium text-[#0A0A0B]">New Password</label>
            <div className="relative">
              <input
                type={showPasswords.newPassword ? 'text' : 'password'}
                value={form.newPassword}
                onChange={event => setForm(current => ({ ...current, newPassword: event.target.value }))}
                className="h-12 w-full rounded-md border border-[#3B82F6] bg-transparent px-4 pr-12 text-[16px] outline-none placeholder:text-[15px]"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(current => ({ ...current, newPassword: !current.newPassword }))}
                className="absolute inset-y-0 right-4 flex items-center text-[#6B7280] transition hover:text-[#0A0A0B]"
                aria-label={showPasswords.newPassword ? 'Hide new password' : 'Show new password'}
              >
                {showPasswords.newPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[14px] font-medium text-[#0A0A0B]">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPasswords.confirmNewPassword ? 'text' : 'password'}
                value={form.confirmNewPassword}
                onChange={event => setForm(current => ({ ...current, confirmNewPassword: event.target.value }))}
                className="h-12 w-full rounded-md border border-[#3B82F6] bg-transparent px-4 pr-12 text-[16px] outline-none placeholder:text-[15px]"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords(current => ({
                    ...current,
                    confirmNewPassword: !current.confirmNewPassword,
                  }))
                }
                className="absolute inset-y-0 right-4 flex items-center text-[#6B7280] transition hover:text-[#0A0A0B]"
                aria-label={
                  showPasswords.confirmNewPassword ? 'Hide confirm new password' : 'Show confirm new password'
                }
              >
                {showPasswords.confirmNewPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#2F6FB3] px-6 text-[15px] font-medium text-white transition hover:bg-[#0B5280] disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>
        </>
      )}
    </div>
  )
}

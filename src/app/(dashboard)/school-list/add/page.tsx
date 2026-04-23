'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

type SessionUser = {
  accessToken?: string | null
}

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL

export default function AddSchoolPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const accessToken = user?.accessToken

  const [schoolName, setSchoolName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!accessToken) return
    if (!schoolName.trim()) {
      toast.error('Please enter school name')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`${baseUrl}/school`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: schoolName.trim() }),
      })

      const result = (await response.json()) as { message?: string }

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create school')
      }

      toast.success('School created successfully')
      router.push('/school-list')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create school')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#ECF7FD] px-8 py-10">
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <section className="w-full max-w-[860px] rounded-lg bg-white px-14 py-16 shadow-sm">
          <h1 className="text-center text-[24px] font-semibold text-[#5A5A5A]">Add School</h1>

          <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-[620px]">
            <div>
              <label htmlFor="schoolName" className="block text-[13px] font-medium text-[#5A5A5A]">
                Enter School Name
              </label>
              <input
                id="schoolName"
                type="text"
                value={schoolName}
                onChange={event => setSchoolName(event.target.value)}
                placeholder="Write here"
                className="mt-2 h-11 w-full rounded-sm border border-[#D1D5DB] px-4 text-[14px] text-[#0A0A0B] outline-none transition focus:border-[#0B5280]"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-10 inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm bg-[#0B5280] text-[16px] font-semibold text-white transition hover:bg-[#094570] disabled:opacity-60"
            >
              {saving ? 'Adding...' : 'Add'}
              <Plus className="size-4" />
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

'use client'

import { Loader2, Plus } from 'lucide-react'
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
  const [subscribePrice, setSubscribePrice] = useState('')
  const [ndaFile, setNdaFile] = useState<File | null>(null)
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
      const formData = new FormData()
      formData.append('name', schoolName.trim())

      if (subscribePrice.trim()) {
        formData.append('subscribePrice', subscribePrice)
      }

      if (ndaFile) {
        formData.append('NDA', ndaFile)
      }

      const response = await fetch(`${baseUrl}/school`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })

      const result = (await response.json()) as {
        message?: string
        data?: {
          _id?: string
          name?: string
          subscribePrice?: number
          NDA?: string
        }
      }
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create school')
      }

      toast.success('School created successfully')
      router.push('/school-list')
    } catch (error) {
      const message =
        (error instanceof Error ? error.message : 'Failed to create school')
      toast.error(message)
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
                name="name"
                type="text"
                value={schoolName}
                onChange={event => setSchoolName(event.target.value)}
                placeholder="Write here"
                className="mt-2 h-11 w-full rounded-sm border border-[#D1D5DB] px-4 text-[14px] text-[#0A0A0B] outline-none transition focus:border-[#0B5280]"
              />
            </div>

            <div className="mt-6">
              <label htmlFor="subscribePrice" className="block text-[13px] font-medium text-[#5A5A5A]">
                Subscribe Price (Optional)
              </label>
              <input
                id="subscribePrice"
                name="subscribePrice"
                type="number"
                min="0"
                step="1"
                value={subscribePrice}
                onChange={event => setSubscribePrice(event.target.value)}
                placeholder="Write here"
                className="mt-2 h-11 w-full rounded-sm border border-[#D1D5DB] px-4 text-[14px] text-[#0A0A0B] outline-none transition focus:border-[#0B5280]"
              />
            </div>

            <div className="mt-6">
              <label htmlFor="ndaFile" className="block text-[13px] font-medium text-[#5A5A5A]">
                NDA File (Optional)
              </label>
              <input
                id="ndaFile"
                name="NDA"
                type="file"
                accept="image/*,.xls,.xlsx,.pdf,application/pdf"
                onChange={event => setNdaFile(event.target.files?.[0] || null)}
                className="mt-2 block w-full rounded-sm border border-[#D1D5DB] px-4 py-3 text-[14px] text-[#0A0A0B] outline-none transition file:mr-4 file:rounded-sm file:border-0 file:bg-[#0B5280] file:px-4 file:py-2 file:text-white hover:border-[#0B5280]"
              />
              {ndaFile ? (
                <p className="mt-2 text-[12px] text-[#6B7280]">Selected: {ndaFile.name}</p>
              ) : null}
              <p className="mt-2 text-[12px] text-[#6B7280]">
                Upload the school NDA file when available.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-10 inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm bg-[#0B5280] text-[16px] font-semibold text-white transition hover:bg-[#094570] disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  Add
                  <Plus className="size-4" />
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

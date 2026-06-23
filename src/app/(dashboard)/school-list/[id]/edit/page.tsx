'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

type SessionUser = {
  accessToken?: string | null
}

type SchoolDetails = {
  _id: string
  name: string
  subscribePrice?: number
  NDA?: string
  termConfig?: {
    firstTermDueDate?: string
    secondTermDueDate?: string
    thirdTermDueDate?: string
    fullPaymentDueDate?: string
  }
}

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(Number(value || 0))

const isUrl = (value?: string) => Boolean(value && /^(https?:|blob:|data:)\S+/i.test(value.trim()))

const getNdaLabel = (nda?: string) => {
  if (!nda?.trim()) return 'No school contract uploaded yet.'
  if (isUrl(nda)) return 'View current school contract'
  return 'School contract on file'
}

const toDateInputValue = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export default function EditSchoolPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const accessToken = user?.accessToken

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [school, setSchool] = useState<SchoolDetails | null>(null)
  const [schoolName, setSchoolName] = useState('')
  const [subscribePrice, setSubscribePrice] = useState('')
  const [ndaFile, setNdaFile] = useState<File | null>(null)
  const [termDates, setTermDates] = useState({
    firstTermDueDate: '',
    secondTermDueDate: '',
    thirdTermDueDate: '',
    fullPaymentDueDate: '',
  })

  useEffect(() => {
    if (!params?.id || !accessToken) return

    const loadSchool = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${baseUrl}/school/${params.id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        const result = (await response.json()) as { message?: string; data?: SchoolDetails }
        if (!response.ok) {
          throw new Error(result.message || 'Failed to load school')
        }

        const data = result.data || null
        setSchool(data)
        setSchoolName(data?.name || '')
        setSubscribePrice(data?.subscribePrice !== undefined ? String(data.subscribePrice) : '')
        setTermDates({
          firstTermDueDate: toDateInputValue(data?.termConfig?.firstTermDueDate),
          secondTermDueDate: toDateInputValue(data?.termConfig?.secondTermDueDate),
          thirdTermDueDate: toDateInputValue(data?.termConfig?.thirdTermDueDate),
          fullPaymentDueDate: toDateInputValue(data?.termConfig?.fullPaymentDueDate),
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load school')
      } finally {
        setLoading(false)
      }
    }

    loadSchool()
  }, [accessToken, params?.id])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!accessToken || !params?.id) return
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

      Object.entries(termDates).forEach(([key, value]) => {
        if (value) formData.append(key, value)
      })

      const response = await fetch(`${baseUrl}/school/${params.id}`, {
        method: 'PUT',
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
        throw new Error(result.message || 'Failed to update school')
      }

      toast.success('School updated successfully')
      router.push('/school-list')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update school')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#ECF7FD] px-8 py-10">
      <div className="mx-auto max-w-[860px]">
        <div className="mb-4">
          <Link
            href="/school-list"
            className="inline-flex items-center text-[14px] font-medium text-[#0B5280] transition hover:text-[#094570]"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to School List
          </Link>
        </div>

        <section className="rounded-lg bg-white px-14 py-16 shadow-sm">
          <h1 className="text-center text-[24px] font-semibold text-[#5A5A5A]">Edit School</h1>

          {loading ? (
            <div className="mt-10 text-center text-[14px] text-[#6B7280]">Loading school...</div>
          ) : (
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
                  Per-student Charge (Optional)
                </label>
                <input
                  id="subscribePrice"
                  name="subscribePrice"
                  type="number"
                  min="0"
                  step="1"
                  value={subscribePrice}
                  onChange={event => setSubscribePrice(event.target.value)}
                  className="mt-2 h-11 w-full rounded-sm border border-[#D1D5DB] px-4 text-[14px] text-[#0A0A0B] outline-none transition focus:border-[#0B5280]"
                />
              </div>

              <div className="mt-6 rounded-sm border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[13px] text-[#4B5563]">
                <p className="font-medium text-[#111827]">Current School Contract</p>
                {school?.NDA ? (
                  isUrl(school.NDA) ? (
                    <a
                      href={school.NDA}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex text-[#0B5280] transition hover:text-[#094570]"
                    >
                      {getNdaLabel(school.NDA)}
                    </a>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap">
                      {getNdaLabel(school.NDA)}
                    </p>
                  )
                ) : (
                  <p className="mt-1 text-[#6B7280]">No school contract uploaded yet.</p>
                )}
                <p className="mt-2 text-[12px] text-[#6B7280]">
                  Upload a new file only if you want to replace the existing school contract.
                </p>
              </div>

              <div className="mt-6">
                <label htmlFor="ndaFile" className="block text-[13px] font-medium text-[#5A5A5A]">
                  Replace School Contract File (Optional)
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
              </div>

              <div className="mt-6 rounded-sm border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                <p className="text-[14px] font-semibold text-[#111827]">Term Due Dates</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {[
                    ['firstTermDueDate', 'First Term Due Date'],
                    ['secondTermDueDate', 'Second Term Due Date'],
                    ['thirdTermDueDate', 'Third Term Due Date'],
                    ['fullPaymentDueDate', 'Full Payment Due Date'],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label htmlFor={key} className="block text-[13px] font-medium text-[#5A5A5A]">
                        {label}
                      </label>
                      <input
                        id={key}
                        type="date"
                        value={termDates[key as keyof typeof termDates]}
                        onChange={event =>
                          setTermDates(current => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-sm border border-[#D1D5DB] px-4 text-[14px] text-[#0A0A0B] outline-none transition focus:border-[#0B5280]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 rounded-md bg-[#F8FAFC] px-4 py-3 text-[13px] text-[#4B5563]">
                Last saved price: {formatCurrency(school?.subscribePrice)}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-10 inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm bg-[#0B5280] text-[16px] font-semibold text-white transition hover:bg-[#094570] disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Changes
                    <Save className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}

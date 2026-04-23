'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, CalendarDays, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { TableSkeleton } from '../../_components/SkeletonBlocks'

type SessionUser = {
  accessToken?: string | null
}

type StudentEntry =
  | string
  | {
      _id?: string
      schoolName?: string
      lastName?: string
      firstName?: string
      studentId?: string
      gradeLevel?: string
    }

type UserDetails = {
  _id: string
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  bio?: string
  totalStudent?: number
  schoolLogo?: string
  uploadeSignature?: string
  subscriptionExpiry?: string
  schoolName?: string | null
  studentList?: StudentEntry[]
}

type SchoolDetails = {
  _id?: string
  name?: string
}

type PaymentItem = {
  amount?: number
  status?: string
}

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL

export default function RegisterDetailsPage() {
  const params = useParams<{ id: string }>()
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const accessToken = user?.accessToken

  const [details, setDetails] = useState<UserDetails | null>(null)
  const [school, setSchool] = useState<SchoolDetails | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [totalPaid, setTotalPaid] = useState(0)
  const [paymentCount, setPaymentCount] = useState(0)

  useEffect(() => {
    if (!accessToken || !params.id) return

    const loadDetails = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${baseUrl}/user/${params.id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        const result = (await response.json()) as { data?: UserDetails; message?: string }

        if (!response.ok) {
          throw new Error(result.message || 'Failed to load school information')
        }

        const profile = result.data || null
        setDetails(profile)
        setLogoPreview(profile?.schoolLogo || '')

        if (profile?.schoolName) {
          const schoolResponse = await fetch(`${baseUrl}/school/${profile.schoolName}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })

          const schoolResult = (await schoolResponse.json()) as { data?: SchoolDetails }
          if (schoolResponse.ok) {
            setSchool(schoolResult.data || null)
          }
        }

        if (profile?.email) {
          const paymentResponse = await fetch(
            `${baseUrl}/payment?searchTerm=${encodeURIComponent(profile.email)}&status=completed&limit=100`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          )

          const paymentResult = (await paymentResponse.json()) as { data?: PaymentItem[] }
          const paymentData = paymentResult.data || []
          setTotalPaid(paymentData.reduce((sum, item) => sum + (item.amount || 0), 0))
          setPaymentCount(paymentData.length)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load school information')
      } finally {
        setLoading(false)
      }
    }

    loadDetails()
  }, [accessToken, params.id])

  const studentRows = useMemo(() => {
    return (details?.studentList || []).filter(
      (item): item is Exclude<StudentEntry, string> => typeof item === 'object' && item !== null,
    )
  }, [details?.studentList])

  const handleFileChange = (file: File | null) => {
    setLogoFile(file)
    if (!file) return
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleFieldChange = (field: keyof UserDetails, value: string) => {
    setDetails(current => (current ? { ...current, [field]: value } : current))
  }

  const handleSave = async () => {
    if (!accessToken || !details?._id) return

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('firstName', details.firstName || '')
      formData.append('lastName', details.lastName || '')
      formData.append('email', details.email || '')
      formData.append('phoneNumber', details.phoneNumber || '')
      formData.append('bio', details.bio || '')
      formData.append('totalStudent', String(details.totalStudent || 0))

      if (logoFile) {
        formData.append('schoolLogo', logoFile)
      }

      const response = await fetch(`${baseUrl}/user/${details._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })

      const result = (await response.json()) as { data?: UserDetails; message?: string }

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update school information')
      }

      setDetails(result.data || details)
      setLogoFile(null)
      if (result.data?.schoolLogo) {
        setLogoPreview(result.data.schoolLogo)
      }
      toast.success('School information updated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update school information')
    } finally {
      setSaving(false)
    }
  }

  const schoolTitle = school?.name || [details?.firstName, details?.lastName].filter(Boolean).join(' ') || 'School'

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#ECF7FD] px-7 py-7">
      <section className="rounded-sm bg-[#ECF7FD] px-3 py-2">
        <Link href="/register-list" className="inline-flex items-center gap-2 text-[14px] font-medium text-[#0B5280]">
          <ArrowLeft className="size-4" />
          Back to Register List
        </Link>

        {loading ? (
          <div className="mt-6 rounded-sm bg-white p-6">
            <TableSkeleton columns={5} rows={8} />
          </div>
        ) : details ? (
          <>
            <div className="mt-5">
              <h1 className="text-[34px] font-semibold text-[#3E4A59]">School Information</h1>
              <p className="mt-1 text-[14px] text-[#7A8794]">Manage your school information and profile details.</p>
            </div>

            <div className="mt-7 grid grid-cols-[120px_minmax(0,1fr)] gap-6">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-full bg-[#CFCFCF]">
                  {logoPreview ? (
                    <Image
                      src={logoPreview}
                      alt="School logo"
                      width={92}
                      height={92}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : null}
                </div>
                <label
                  htmlFor="school-logo"
                  className="inline-flex cursor-pointer items-center gap-2 text-[12px] font-medium text-[#0B5280]"
                >
                  <Upload className="size-4" />
                  Upload logo
                </label>
                <input
                  id="school-logo"
                  type="file"
                  accept="image/*"
                  onChange={event => handleFileChange(event.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-md bg-[#F6F6F6] px-6 py-5 text-center">
                  <CalendarDays className="mx-auto size-6 text-[#0B2E59]" />
                  <p className="mt-3 text-[24px] font-medium text-[#0A0A0B]">
                    {details.subscriptionExpiry
                      ? new Date(details.subscriptionExpiry).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                  <p className="mt-1 text-[16px] text-[#8C8C8C]">Expired Date</p>
                </div>

                <div className="rounded-md bg-[#F6F6F6] px-6 py-5 text-center">
                  <p className="text-[18px] font-medium text-[#0A0A0B]">Total Students</p>
                  <p className="mt-3 text-[32px] font-medium text-[#0B5280]">{details.totalStudent ?? 0}</p>
                </div>

                <div className="rounded-md bg-[#F6F6F6] px-6 py-5 text-center">
                  <p className="text-[18px] font-medium text-[#0A0A0B]">Total Paid</p>
                  <p className="mt-3 text-[32px] font-medium text-[#0B5280]">${totalPaid.toLocaleString()}</p>
                  <p className="mt-1 text-[14px] text-[#8C8C8C]">{paymentCount} completed payments</p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#5A5A5A]">School Name</label>
                <input
                  type="text"
                  value={schoolTitle}
                  readOnly
                  className="h-11 w-full rounded-sm border border-[#D1D5DB] bg-white px-4 text-[14px] outline-none"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-[#5A5A5A]">School Email</label>
                  <input
                    type="email"
                    value={details.email || ''}
                    onChange={event => handleFieldChange('email', event.target.value)}
                    className="h-11 w-full rounded-sm border border-[#D1D5DB] bg-white px-4 text-[14px] outline-none focus:border-[#0B5280]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-medium text-[#5A5A5A]">Phone Number</label>
                  <input
                    type="text"
                    value={details.phoneNumber || ''}
                    onChange={event => handleFieldChange('phoneNumber', event.target.value)}
                    className="h-11 w-full rounded-sm border border-[#D1D5DB] bg-white px-4 text-[14px] outline-none focus:border-[#0B5280]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#5A5A5A]">Bio</label>
                <textarea
                  rows={3}
                  value={details.bio || ''}
                  onChange={event => handleFieldChange('bio', event.target.value)}
                  className="w-full rounded-sm border border-[#D1D5DB] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#0B5280]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#5A5A5A]">Total Students</label>
                <input
                  type="number"
                  value={details.totalStudent ?? 0}
                  onChange={event => handleFieldChange('totalStudent', event.target.value)}
                  className="h-11 w-full rounded-sm border border-[#D1D5DB] bg-white px-4 text-[14px] outline-none focus:border-[#0B5280]"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2F6FB3] px-6 text-[15px] font-semibold text-white transition hover:bg-[#0B5280] disabled:opacity-60"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <div className="mt-8">
              <h2 className="text-center text-[24px] font-medium text-[#0A0A0B]">All Students</h2>

              <div className="mt-6 overflow-x-auto rounded-sm bg-white">
                <table className="w-full border-collapse">
                  <thead className="bg-[#F9FAFB]">
                    <tr className="border-b border-[#E5E7EB]">
                      <th className="px-4 py-4 text-center text-[14px] font-bold text-[#6B7280]">School Name</th>
                      <th className="px-4 py-4 text-center text-[14px] font-bold text-[#6B7280]">Last Name</th>
                      <th className="px-4 py-4 text-center text-[14px] font-bold text-[#6B7280]">First Name</th>
                      <th className="px-4 py-4 text-center text-[14px] font-bold text-[#6B7280]">Student ID</th>
                      <th className="px-4 py-4 text-center text-[14px] font-bold text-[#6B7280]">Grade Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentRows.length ? (
                      studentRows.map((student, index) => (
                        <tr key={student._id || `${student.studentId}-${index}`} className="border-b border-[#E5E7EB]">
                          <td className="px-4 py-4 text-center text-[14px]">{student.schoolName || schoolTitle}</td>
                          <td className="px-4 py-4 text-center text-[14px]">{student.lastName || 'N/A'}</td>
                          <td className="px-4 py-4 text-center text-[14px]">{student.firstName || 'N/A'}</td>
                          <td className="px-4 py-4 text-center text-[14px]">{student.studentId || 'N/A'}</td>
                          <td className="px-4 py-4 text-center text-[14px]">{student.gradeLevel || 'N/A'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[14px] text-[#6B7280]">
                          No student details are available from the current admin API for this school.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-sm bg-white px-6 py-10 text-center text-[16px] text-[#6B7280]">
            School information not found.
          </div>
        )}
      </section>
    </div>
  )
}

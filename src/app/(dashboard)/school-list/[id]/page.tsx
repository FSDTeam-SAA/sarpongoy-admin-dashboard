'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  History,
  PencilLine,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { SchoolDetailsSkeleton } from '../../_components/SkeletonBlocks'

type SessionUser = {
  accessToken?: string | null
}

type SchoolMember = {
  _id: string
  firstName?: string
  lastName?: string
  email?: string
  totalStudent?: number
  role?: string
  profilePicture?: string
  schoolLogo?: string
}

type StudentRow = {
  _id?: string
  schoolName: string
  lastName: string
  firstName: string
  studentId: string
  gradeLevel: string
}

type StudentMeta = {
  page: number
  limit: number
  total: number
}

type PaymentRecord = {
  id: string
  amount?: number
  status?: string
  paymentPlan?: string
  paymentMethod?: string
  totalAmount?: number
  createdAt?: string
  email?: string
  offlinePaymentNote?: string
}

type PaymentHistoryRecord = {
  id: string
  paymentPlan?: string
  paymentMethod?: string
  status?: string
  amount?: number
  note?: string
  createdAt?: string
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
  school?: SchoolMember[]
}

type SchoolPaymentOverview = {
  schoolId: string
  schoolName?: string
  termConfig?: SchoolDetails['termConfig']
  paymentAccessStatus?: 'active' | 'restricted'
  activeTerm?: 'first_term' | 'second_term' | 'third_term' | 'full_payment' | 'none'
  overdueTerm?: 'first_term' | 'second_term' | 'third_term' | 'full_payment' | 'none'
  isRestricted?: boolean
  reason?: string
  totalStudents?: number
  perStudentCharge?: number
  totalAmountDue?: number
  totalCollected?: number
  balanceDue?: number
  latestPayment?: {
    id?: string
    amount?: number
    status?: string
    paymentPlan?: string
    paymentMethod?: string
    createdAt?: string
  } | null
  payments?: PaymentRecord[]
  paymentHistory?: PaymentHistoryRecord[]
  school?: SchoolDetails
  schoolAccounts?: SchoolMember[]
}

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(Number(value || 0))

const formatDate = (value?: string) => {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const formatPlan = (plan?: string) => {
  if (plan === 'first_term') return 'First Term'
  if (plan === 'second_term') return 'Second Term'
  if (plan === 'third_term') return 'Third Term'
  if (plan === 'full_year') return 'Full Term'
  return 'N/A'
}

const formatStatus = (status?: string) =>
  status ? status.replace(/_/g, ' ') : 'unknown'

export default function SchoolDetailsPage() {
  const params = useParams<{ id: string }>()
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const accessToken = user?.accessToken

  const [overview, setOverview] = useState<SchoolPaymentOverview | null>(null)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [studentMeta, setStudentMeta] = useState<StudentMeta>({ page: 1, limit: 100, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params?.id) return

    const loadSchool = async () => {
      try {
        setLoading(true)
        const headers = accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined

        const [response, studentsResponse] = await Promise.all([
          fetch(`${baseUrl}/payment/school/${params.id}/overview`, { headers }),
          fetch(
            `${baseUrl}/exclesheet/school/${params.id}?page=1&limit=500&sortBy=createdAt&sortOrder=desc`,
            { headers },
          ),
        ])

        const result = (await response.json()) as { message?: string; data?: SchoolPaymentOverview }
        const studentsResult = (await studentsResponse.json()) as {
          message?: string
          data?: StudentRow[]
          meta?: StudentMeta
        }

        if (!response.ok) {
          throw new Error(result.message || 'Failed to load school details')
        }
        if (!studentsResponse.ok) {
          throw new Error(studentsResult.message || 'Failed to load imported students')
        }

        setOverview(result.data || null)
        setStudents(studentsResult.data || [])
        setStudentMeta(studentsResult.meta || { page: 1, limit: 500, total: 0 })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load school details')
      } finally {
        setLoading(false)
      }
    }

    loadSchool()
  }, [accessToken, params?.id])

  const school = overview?.school || null
  const members = school?.school || []
  const history = overview?.paymentHistory || []
  const schoolAccount = overview?.schoolAccounts?.[0] || members[0]
  const schoolAvatar = schoolAccount?.schoolLogo || schoolAccount?.profilePicture || ''

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#ECF7FD] px-4 py-6 md:px-8 md:py-10">
      <section className="rounded-none bg-white px-4 py-6 shadow-sm md:px-8 md:py-8">
        <div className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/school-list"
              className="inline-flex items-center text-[14px] font-medium text-[#0B5280] transition hover:text-[#094570]"
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to School List
            </Link>

            {school?._id ? (
              <Link
                href={`/school-list/${school._id}/edit`}
                className="inline-flex items-center gap-2 rounded-md bg-[#0B5280] px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-[#094570]"
              >
                Edit School
                <PencilLine className="size-4" />
              </Link>
            ) : null}
          </div>
        </div>

        {loading ? (
          <SchoolDetailsSkeleton />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative h-[68px] w-[68px] overflow-hidden rounded-full bg-[#CFCFCF]">
                {schoolAvatar ? (
                  <Image
                    src={schoolAvatar}
                    alt={school?.name || 'School'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : null}
              </div>
              <div>
                <h1 className="text-[28px] font-semibold text-[#5A5A5A]">
                  {school?.name || 'School Details'}
                </h1>
                <p className="mt-1 text-[14px] text-[#6B7280]">
                  Current access, payment history, and school members in one view.
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${
                  overview?.isRestricted
                    ? 'bg-[#FDE2E2] text-[#D92D20]'
                    : 'bg-[#D9FBE2] text-[#2F9E44]'
                }`}
              >
                <ShieldCheck className="mr-1 size-3.5" />
                {overview?.paymentAccessStatus || 'active'}
              </span>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                <p className="text-[13px] font-medium text-[#6B7280]">Per-student Charge</p>
                <p className="mt-2 text-[26px] font-semibold text-[#0A0A0B]">{formatCurrency(school?.subscribePrice)}</p>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                <p className="text-[13px] font-medium text-[#6B7280]">Total Collected</p>
                <p className="mt-2 text-[26px] font-semibold text-[#0A0A0B]">{formatCurrency(overview?.totalCollected)}</p>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                <p className="text-[13px] font-medium text-[#6B7280]">Balance Due</p>
                <p className="mt-2 text-[26px] font-semibold text-[#0A0A0B]">{formatCurrency(overview?.balanceDue)}</p>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                <p className="text-[13px] font-medium text-[#6B7280]">Current Term</p>
                <p className="mt-2 text-[26px] font-semibold text-[#0A0A0B]">
                  {overview?.overdueTerm && overview.overdueTerm !== 'none'
                    ? formatPlan(overview.overdueTerm)
                    : overview?.activeTerm && overview.activeTerm !== 'none'
                      ? formatPlan(overview.activeTerm)
                      : 'None'}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-[#6B7280]">Payment Summary</p>
                  <p className="mt-1 text-[14px] text-[#0A0A0B]">
                    {overview?.reason || 'Payment status synchronized from the backend.'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#0B5280] ring-1 ring-[#D7E3EE]">
                  <CircleDollarSign className="size-3.5" />
                  {formatCurrency(overview?.totalAmountDue)}
                  due
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ['First Term', overview?.termConfig?.firstTermDueDate],
                  ['Second Term', overview?.termConfig?.secondTermDueDate],
                  ['Third Term', overview?.termConfig?.thirdTermDueDate],
                  ['Full Payment', overview?.termConfig?.fullPaymentDueDate],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-white px-3 py-2">
                    <p className="text-[12px] font-medium text-[#6B7280]">{label}</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#0A0A0B]">
                      {formatDate(value as string | undefined)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
              <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-[#0B5280]" />
                  <p className="text-[16px] font-semibold text-[#0A0A0B]">Latest Payment</p>
                </div>
                {overview?.latestPayment ? (
                  <div className="mt-3 rounded-md bg-white px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[14px] font-semibold text-[#0A0A0B]">
                        {formatPlan(overview.latestPayment.paymentPlan)}
                      </p>
                      <span className="rounded-full bg-[#EEF6FB] px-2 py-0.5 text-[11px] font-semibold text-[#063D5B]">
                        {formatStatus(overview.latestPayment.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-[#6B7280]">
                      {formatCurrency(overview.latestPayment.amount)} · {overview.latestPayment.paymentMethod || 'stripe'}
                    </p>
                    <p className="mt-1 text-[12px] text-[#6B7280]">
                      {formatDate(overview.latestPayment.createdAt)}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 rounded-md bg-white px-3 py-4 text-[13px] text-[#6B7280]">
                    No payment records yet.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="rounded-md bg-white px-3 py-2">
                    <p className="text-[12px] text-[#6B7280]">Collected</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#0A0A0B]">
                      {formatCurrency(overview?.totalCollected)}
                    </p>
                  </div>
                  <div className="rounded-md bg-white px-3 py-2">
                    <p className="text-[12px] text-[#6B7280]">Balance Due</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#0A0A0B]">
                      {formatCurrency(overview?.balanceDue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <History className="size-4 text-[#0B5280]" />
                    <p className="text-[16px] font-semibold text-[#0A0A0B]">Payment History</p>
                  </div>
                  <p className="text-[12px] text-[#64748B]">{history.length} events</p>
                </div>

                <div className="mt-4 space-y-3">
                  {history.length ? (
                    history.slice(0, 6).map(item => (
                      <div key={item.id} className="rounded-md bg-white px-3 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[14px] font-semibold text-[#0A0A0B]">
                            {formatPlan(item.paymentPlan)}
                          </p>
                          <span className="rounded-full bg-[#EEF6FB] px-2 py-0.5 text-[11px] font-semibold text-[#063D5B]">
                            {formatStatus(item.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] text-[#6B7280]">
                          {formatCurrency(item.amount)} · {item.paymentMethod || 'system'}
                        </p>
                        <p className="mt-1 text-[12px] text-[#6B7280]">{formatDate(item.createdAt)}</p>
                        {item.note ? (
                          <p className="mt-1 text-[12px] text-[#475569]">{item.note}</p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="rounded-md bg-white px-3 py-4 text-[13px] text-[#6B7280]">
                      No history records found.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[18px] font-medium text-[#0A0A0B]">All Students</h2>
                <span className="rounded-full bg-[#EEF6FB] px-3 py-1 text-[12px] font-semibold text-[#0B5280]">
                  {studentMeta.total} imported
                </span>
              </div>

              <div className="mt-4 overflow-x-auto">
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
                    {students.length ? (
                      students.map(student => (
                        <tr key={student._id || `${student.studentId}-${student.firstName}`} className="border-b border-[#E5E7EB]">
                          <td className="px-4 py-4 text-center text-[14px] font-normal text-[#0A0A0B]">{student.schoolName}</td>
                          <td className="px-4 py-4 text-center text-[14px] font-normal text-[#0A0A0B]">{student.lastName || 'N/A'}</td>
                          <td className="px-4 py-4 text-center text-[14px] font-normal text-[#0A0A0B]">{student.firstName || 'N/A'}</td>
                          <td className="px-4 py-4 text-center text-[14px] font-normal text-[#0A0A0B]">{student.studentId || 'N/A'}</td>
                          <td className="px-4 py-4 text-center text-[14px] font-normal text-[#0A0A0B]">
                            {student.gradeLevel || 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-[14px] text-[#6B7280]">
                          No imported students found for this school.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 px-3 py-6">
                <p className="text-[14px] font-normal text-[#6B7280]">
                  Showing {students.length ? 1 : 0} to {students.length} of {studentMeta.total} results
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled
                    className="flex h-8 w-8 items-center justify-center rounded border border-[#94A3B8] text-[#64748B] disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="flex h-8 min-w-8 items-center justify-center rounded border border-[#0B2E59] bg-[#0B2E59] px-2 text-[14px] text-white"
                  >
                    1
                  </button>
                  <button
                    type="button"
                    disabled
                    className="flex h-8 w-8 items-center justify-center rounded border border-[#94A3B8] text-[#334155] disabled:opacity-40"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  Loader2,
  Search,
  ShieldCheck,
  WalletCards,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { TableSkeleton } from '../_components/SkeletonBlocks'

type SessionUser = {
  accessToken?: string | null
}

type PaymentItem = {
  _id: string
  schoolId?: string | SchoolDetails
  schoolName?: string | { name?: string }
  email?: string
  amount?: number
  totalAmount?: number
  perStudentCharge?: number
  status?: 'pending' | 'offline_pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod?: 'stripe' | 'offline'
  paymentPlan?: 'first_term' | 'second_term' | 'third_term' | 'full_year'
  totalStudents?: number
  offlinePaymentNote?: string
  createdAt?: string
  updatedAt?: string
  userId?: {
    email?: string
    totalStudent?: number
    schoolName?: string | { name?: string }
  }
}

type SchoolPaymentStatus = {
  schoolId: string
  schoolName?: string
  totalStudents?: number
  perStudentCharge?: number
  activeTerm?:
    | 'first_term'
    | 'second_term'
    | 'third_term'
    | 'full_payment'
    | 'none'
  overdueTerm?:
    | 'first_term'
    | 'second_term'
    | 'third_term'
    | 'full_payment'
    | 'none'
  isRestricted?: boolean
  reason?: string
  paymentAccessStatus?: 'active' | 'restricted'
  latestPayment?: {
    id: string
    amount?: number
    status?: string
    paymentPlan?: PaymentItem['paymentPlan']
    paymentMethod?: PaymentItem['paymentMethod']
  } | null
}

type SchoolUser = {
  _id?: string
  totalStudent?: number
}

type SchoolDetails = {
  _id: string
  name?: string
  subscribePrice?: number
  school?: SchoolUser[]
}

type PaginationMeta = {
  page: number
  limit: number
  total: number
}

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL

const formatCurrency = (amount?: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(amount || 0))

const formatSchoolName = (schoolName?: string | { name?: string }) => {
  if (!schoolName) return 'N/A'
  return typeof schoolName === 'string' ? schoolName : schoolName.name || 'N/A'
}

const getSchoolId = (payment: PaymentItem) => {
  if (payment.schoolId) {
    return typeof payment.schoolId === 'string'
      ? payment.schoolId
      : payment.schoolId._id
  }

  const schoolRef = payment.userId?.schoolName || payment.schoolName
  if (!schoolRef) return ''
  return typeof schoolRef === 'string' ? schoolRef : ''
}

const getTotalStudents = (school?: SchoolDetails) =>
  (school?.school || []).reduce(
    (total, item) => total + Number(item.totalStudent || 0),
    0,
  )

const getSchoolName = (payment: PaymentItem) => {
  if (payment.schoolId && typeof payment.schoolId !== 'string') {
    return payment.schoolId.name || 'N/A'
  }

  return formatSchoolName(payment.schoolName)
}

const formatPlan = (plan?: PaymentItem['paymentPlan']) => {
  if (plan === 'first_term') return 'First Term'
  if (plan === 'second_term') return 'Second Term'
  if (plan === 'third_term') return 'Third Term'
  if (plan === 'full_year') return 'Full Term'
  return 'N/A'
}

const formatTerm = (term?: SchoolPaymentStatus['activeTerm']) => {
  if (term === 'first_term') return 'First Term'
  if (term === 'second_term') return 'Second Term'
  if (term === 'third_term') return 'Third Term'
  if (term === 'full_payment') return 'Full Payment'
  return 'None'
}

const formatStatus = (status?: string) =>
  status ? status.replace(/_/g, ' ') : 'unknown'

const formatDate = (value?: string) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default function PaymentPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const accessToken = user?.accessToken

  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [schoolStatuses, setSchoolStatuses] = useState<SchoolPaymentStatus[]>(
    [],
  )
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
  })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState('')
  const [invoiceDownloadingId, setInvoiceDownloadingId] = useState('')
  const [updatingStatusId, setUpdatingStatusId] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeView, setActiveView] = useState<'payments' | 'status'>('payments')
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(
    null,
  )

  useEffect(() => {
    if (!accessToken) return

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          page: String(meta.page),
          limit: String(meta.limit),
          paymentType: 'school',
        })

        if (search.trim()) {
          params.set('searchTerm', search.trim())
        }

        const response = await fetch(
          `${baseUrl}/payment?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            signal: controller.signal,
          },
        )

        const result = (await response.json()) as {
          data?: PaymentItem[]
          meta?: PaginationMeta
          message?: string
        }

        if (!response.ok) {
          throw new Error(result.message || 'Failed to load payments')
        }

        const statusResponse = await fetch(`${baseUrl}/payment/school-status`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        })
        const statusResult = (await statusResponse.json()) as {
          data?: SchoolPaymentStatus[]
          message?: string
        }
        if (!statusResponse.ok) {
          throw new Error(
            statusResult.message || 'Failed to load school payment statuses',
          )
        }

        const basePayments = (result.data || []).map(payment => ({
          ...payment,
          email: payment.email || payment.userId?.email,
        }))

        const schoolIds = Array.from(
          new Set(
            basePayments.map(payment => getSchoolId(payment)).filter(Boolean),
          ),
        )

        const schoolEntries = await Promise.all(
          schoolIds.map(async schoolId => {
            try {
              const schoolResponse = await fetch(
                `${baseUrl}/school/${schoolId}`,
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                  signal: controller.signal,
                },
              )

              const schoolResult = (await schoolResponse.json()) as {
                data?: SchoolDetails
              }

              if (!schoolResponse.ok || !schoolResult.data) {
                return null
              }

              return [schoolId, schoolResult.data] as const
            } catch {
              return null
            }
          }),
        )

        const schoolMap = new Map<string, SchoolDetails>(
          schoolEntries.filter(
            (entry): entry is readonly [string, SchoolDetails] =>
              Boolean(entry),
          ),
        )

        const normalizedPayments = basePayments.map(payment => {
          const school = schoolMap.get(getSchoolId(payment))

          return {
            ...payment,
            schoolName: school?.name || getSchoolName(payment),
            totalStudents:
              payment.totalStudents ??
              payment.userId?.totalStudent ??
              (school ? getTotalStudents(school) : undefined),
          }
        })

        setPayments(normalizedPayments)
        setSchoolStatuses(statusResult.data || [])
        setMeta(result.meta || { page: 1, limit: 10, total: 0 })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error(
            error instanceof Error ? error.message : 'Failed to load payments',
          )
        }
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [accessToken, meta.page, meta.limit, search, refreshKey])

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit))

  const fetchPaymentsPage = () => {
    setRefreshKey(current => current + 1)
  }

  const handleApproveOffline = async (paymentId: string) => {
    if (!accessToken) return

    try {
      setApprovingId(paymentId)
      const response = await fetch(
        `${baseUrl}/payment/${paymentId}/approve-offline`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      const result = (await response.json()) as { message?: string }
      if (!response.ok) {
        throw new Error(result.message || 'Failed to approve offline payment')
      }

      toast.success('Offline payment approved and school access activated.')
      setSelectedPayment(null)
      fetchPaymentsPage()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to approve offline payment',
      )
    } finally {
      setApprovingId('')
    }
  }

  const handleManualStatusUpdate = async (
    paymentId: string,
    status: string,
  ) => {
    if (!accessToken || !paymentId || !status) return

    try {
      setUpdatingStatusId(paymentId)
      const response = await fetch(`${baseUrl}/payment/${paymentId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      const result = (await response.json()) as { message?: string }
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update payment status')
      }

      toast.success('Payment status updated.')
      fetchPaymentsPage()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update payment status',
      )
    } finally {
      setUpdatingStatusId('')
    }
  }

  const handleDownloadInvoice = async (paymentId: string) => {
    if (!accessToken) return

    try {
      setInvoiceDownloadingId(paymentId)
      const response = await fetch(`${baseUrl}/payment/${paymentId}/invoice`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          message?: string
        } | null
        throw new Error(result?.message || 'Failed to download invoice')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${paymentId.slice(-8)}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to download invoice',
      )
    } finally {
      setInvoiceDownloadingId('')
    }
  }

  const renderStatus = (status?: string) => {
    if (status === 'completed') {
      return 'bg-[#D9FBE2] text-[#2F9E44]'
    }

    if (status === 'pending' || status === 'offline_pending') {
      return 'bg-[#FFF1BF] text-[#E67700]'
    }

    return 'bg-[#FDE2E2] text-[#D92D20]'
  }

  const overdueCount = schoolStatuses.filter(item => item.isRestricted).length
  const activeCount = schoolStatuses.filter(item => !item.isRestricted).length
  const pendingPayments = payments.filter(
    payment =>
      payment.status === 'pending' || payment.status === 'offline_pending',
  ).length
  const totalCollected = payments
    .filter(payment => payment.status === 'completed')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#ECF7FD] p-6 lg:p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#608BB9]">
            Billing Control
          </p>
          <h1 className="mt-1 text-[28px] font-semibold text-[#0A0A0B]">
            Payment
          </h1>
          <p className="mt-1 text-[14px] text-[#64748B]">
            Track school access, approve offline payments, and review
            subscription activity.
          </p>
        </div>

        <div className="flex h-11 w-full items-center rounded-md border border-[#D1D5DB] bg-white px-4 text-[#6B7280] shadow-sm xl:w-[340px]">
          <Search className="mr-2 size-4 shrink-0" />
          <input
            type="text"
            placeholder="Search by school, email, status"
            value={search}
            onChange={event => {
              setMeta(current => ({ ...current, page: 1 }))
              setSearch(event.target.value)
            }}
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#A8B0BD]"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-[#DDEAF3] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-[#64748B]">
              Restricted schools
            </p>
            <AlertTriangle className="size-4 text-[#D92D20]" />
          </div>
          <p className="mt-3 text-[28px] font-semibold text-[#0A0A0B]">
            {overdueCount}
          </p>
          <p className="mt-1 text-[12px] text-[#94A3B8]">
            Need payment or due-date review
          </p>
        </div>

        <div className="rounded-lg border border-[#DDEAF3] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-[#64748B]">
              Active schools
            </p>
            <ShieldCheck className="size-4 text-[#2F9E44]" />
          </div>
          <p className="mt-3 text-[28px] font-semibold text-[#0A0A0B]">
            {activeCount}
          </p>
          <p className="mt-1 text-[12px] text-[#94A3B8]">
            Access currently open
          </p>
        </div>

        <div className="rounded-lg border border-[#DDEAF3] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-[#64748B]">
              Pending payments
            </p>
            <Clock3 className="size-4 text-[#E67700]" />
          </div>
          <p className="mt-3 text-[28px] font-semibold text-[#0A0A0B]">
            {pendingPayments}
          </p>
          <p className="mt-1 text-[12px] text-[#94A3B8]">
            Stripe or offline waiting
          </p>
        </div>

        <div className="rounded-lg border border-[#DDEAF3] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-[#64748B]">Collected</p>
            <WalletCards className="size-4 text-[#0B5280]" />
          </div>
          <p className="mt-3 text-[28px] font-semibold text-[#0A0A0B]">
            {formatCurrency(totalCollected)}
          </p>
          <p className="mt-1 text-[12px] text-[#94A3B8]">
            Current filtered page
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-[#DDEAF3] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#E5E7EB] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex w-full rounded-md border border-[#D1D5DB] bg-[#F8FAFC] p-1 lg:w-auto">
            <button
              type="button"
              onClick={() => setActiveView('payments')}
              className={`flex h-10 flex-1 items-center justify-center gap-2 rounded px-4 text-[14px] font-semibold transition lg:flex-none ${
                activeView === 'payments'
                  ? 'bg-[#0B5280] text-white shadow-sm'
                  : 'text-[#475569] hover:bg-white'
              }`}
            >
              <WalletCards className="size-4" />
              Payment records
            </button>
            <button
              type="button"
              onClick={() => setActiveView('status')}
              className={`flex h-10 flex-1 items-center justify-center gap-2 rounded px-4 text-[14px] font-semibold transition lg:flex-none ${
                activeView === 'status'
                  ? 'bg-[#0B5280] text-white shadow-sm'
                  : 'text-[#475569] hover:bg-white'
              }`}
            >
              <ShieldCheck className="size-4" />
              School status
            </button>
          </div>

          <p className="text-[13px] text-[#64748B]">
            {activeView === 'status'
              ? `${overdueCount} restricted, ${activeCount} active`
              : `${meta.total} payment records`}
          </p>
        </div>

        {activeView === 'status' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] border-collapse">
              <thead className="bg-[#F8FAFC]">
                <tr className="border-b border-[#E5E7EB]">
                  <th className="px-5 py-4 text-left text-[13px] font-bold text-[#64748B]">
                    School
                  </th>
                  <th className="px-5 py-4 text-left text-[13px] font-bold text-[#64748B]">
                    Current term
                  </th>
                  <th className="px-5 py-4 text-left text-[13px] font-bold text-[#64748B]">
                    Access
                  </th>
                  <th className="px-5 py-4 text-left text-[13px] font-bold text-[#64748B]">
                    Latest payment
                  </th>
                  <th className="px-5 py-4 text-left text-[13px] font-bold text-[#64748B]">
                    Manual status
                  </th>
                  <th className="px-5 py-4 text-right text-[13px] font-bold text-[#64748B]">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <TableSkeleton columns={6} rows={6} />
                    </td>
                  </tr>
                ) : schoolStatuses.length ? (
                  schoolStatuses.map(item => (
                    <tr
                      key={item.schoolId}
                      className="border-b border-[#E5E7EB] last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="text-[14px] font-semibold text-[#0A0A0B]">
                          {item.schoolName || 'N/A'}
                        </p>
                        <p className="mt-1 max-w-[280px] truncate text-[12px] text-[#64748B]">
                          {item.reason || 'No status note'}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-[14px] text-[#0A0A0B]">
                        {formatTerm(item.activeTerm)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold capitalize ${
                            item.isRestricted
                              ? 'bg-[#FDE2E2] text-[#D92D20]'
                              : 'bg-[#D9FBE2] text-[#2F9E44]'
                          }`}
                        >
                          {item.paymentAccessStatus || 'active'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[14px] text-[#0A0A0B]">
                        {item.latestPayment
                          ? `${formatPlan(item.latestPayment.paymentPlan)} · ${formatStatus(item.latestPayment.status)}`
                          : 'No payment'}
                      </td>
                      <td className="px-5 py-4">
                        {item.latestPayment?.id ? (
                          <select
                            value={item.latestPayment.status || ''}
                            disabled={
                              updatingStatusId === item.latestPayment.id
                            }
                            onChange={event =>
                              handleManualStatusUpdate(
                                item.latestPayment!.id,
                                event.target.value,
                              )
                            }
                            className="h-10 rounded-md border border-[#CBD5E1] bg-white px-3 text-[13px] outline-none transition focus:border-[#0B5280]"
                          >
                            <option value="pending">Pending</option>
                            <option value="offline_pending">
                              Offline Pending
                            </option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        ) : (
                          <span className="text-[13px] text-[#94A3B8]">
                            No payment
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/school-list/${item.schoolId}`}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#CBD5E1] px-3 text-[13px] font-semibold text-[#0B5280] transition hover:border-[#0B5280] hover:bg-[#F0F7FF]"
                        >
                          <Eye className="size-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-[14px] text-[#64748B]"
                    >
                      No school payment statuses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border-collapse">
                <thead className="bg-[#F8FAFC]">
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="px-5 py-4 text-left text-[13px] font-bold text-[#64748B]">
                      School
                    </th>
                    <th className="px-5 py-4 text-left text-[13px] font-bold text-[#64748B]">
                      Billing email
                    </th>
                    <th className="px-5 py-4 text-left text-[13px] font-bold text-[#64748B]">
                      Plan
                    </th>
                    <th className="px-5 py-4 text-left text-[13px] font-bold text-[#64748B]">
                      Method
                    </th>
                    <th className="px-5 py-4 text-left text-[13px] font-bold text-[#64748B]">
                      Students
                    </th>
                    <th className="px-5 py-4 text-left text-[13px] font-bold text-[#64748B]">
                      Amount
                    </th>
                    <th className="px-5 py-4 text-left text-[13px] font-bold text-[#64748B]">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right text-[13px] font-bold text-[#64748B]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-0">
                        <TableSkeleton columns={8} rows={6} />
                      </td>
                    </tr>
                  ) : payments.length ? (
                    payments.map(payment => (
                      <tr
                        key={payment._id}
                        className="border-b border-[#E5E7EB] last:border-0"
                      >
                        <td className="px-5 py-4">
                          <p className="text-[14px] font-semibold text-[#0A0A0B]">
                            {formatSchoolName(payment.schoolName)}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-[14px] text-[#0A0A0B]">
                          {payment.email || 'N/A'}
                        </td>
                        <td className="px-5 py-4 text-[14px] text-[#0A0A0B]">
                          {formatPlan(payment.paymentPlan)}
                        </td>
                        <td className="px-5 py-4 text-[14px] capitalize text-[#0A0A0B]">
                          {payment.paymentMethod || 'stripe'}
                        </td>
                        <td className="px-5 py-4 text-[14px] text-[#0A0A0B]">
                          {payment.totalStudents ?? 'N/A'}
                        </td>
                        <td className="px-5 py-4 text-[14px] font-semibold text-[#0A0A0B]">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold capitalize ${renderStatus(
                              payment.status,
                            )}`}
                          >
                            {formatStatus(payment.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedPayment(payment)}
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#CBD5E1] px-3 text-[13px] font-semibold text-[#0B5280] transition hover:border-[#0B5280] hover:bg-[#F0F7FF]"
                            >
                              <Eye className="size-4" />
                              View
                            </button>

                            {payment.status === 'completed' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownloadInvoice(payment._id)
                                }
                                disabled={invoiceDownloadingId === payment._id}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#CBD5E1] px-3 text-[13px] font-semibold text-[#0B5280] transition hover:border-[#0B5280] hover:bg-[#F0F7FF] disabled:opacity-60"
                              >
                                <Download className="size-4" />
                                Invoice
                              </button>
                            ) : null}

                            {payment.status === 'offline_pending' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleApproveOffline(payment._id)
                                }
                                disabled={approvingId === payment._id}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#0B5280] px-3 text-[13px] font-semibold text-white transition hover:bg-[#094570] disabled:opacity-60"
                              >
                                {approvingId === payment._id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="size-4" />
                                )}
                                Approve
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-10 text-center text-[14px] text-[#64748B]"
                      >
                        No payment records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E5E7EB] px-5 py-4">
              <p className="text-[14px] font-normal text-[#64748B]">
                Showing {payments.length ? (meta.page - 1) * meta.limit + 1 : 0}{' '}
                to {Math.min(meta.page * meta.limit, meta.total)} of{' '}
                {meta.total} results
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMeta(current => ({
                      ...current,
                      page: Math.max(1, current.page - 1),
                    }))
                  }
                  disabled={meta.page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded border border-[#94A3B8] text-[#64748B] disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <button
                  type="button"
                  className="flex h-8 min-w-8 items-center justify-center rounded border border-[#0B2E59] bg-[#0B2E59] px-2 text-[14px] text-white"
                >
                  {meta.page}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMeta(current => ({
                      ...current,
                      page: Math.min(totalPages, current.page + 1),
                    }))
                  }
                  disabled={meta.page >= totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded border border-[#94A3B8] text-[#334155] disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedPayment ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0A0A0B]/35 px-4 py-6 backdrop-blur-[2px]">
          <section className="w-full max-w-[720px] overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] px-6 py-5">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#608BB9]">
                  Payment Detail
                </p>
                <h2 className="mt-1 text-[22px] font-semibold text-[#0A0A0B]">
                  {formatSchoolName(selectedPayment.schoolName)}
                </h2>
                <p className="mt-1 text-[14px] text-[#64748B]">
                  {selectedPayment.email || 'No billing email'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="flex size-9 items-center justify-center rounded-md border border-[#CBD5E1] text-[#64748B] transition hover:border-[#0B5280] hover:text-[#0B5280]"
                aria-label="Close payment detail"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">
                    Plan
                  </p>
                  <p className="mt-1 text-[15px] font-semibold text-[#0A0A0B]">
                    {formatPlan(selectedPayment.paymentPlan)}
                  </p>
                </div>
                <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">
                    Method
                  </p>
                  <p className="mt-1 text-[15px] font-semibold capitalize text-[#0A0A0B]">
                    {selectedPayment.paymentMethod || 'stripe'}
                  </p>
                </div>
                <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">
                    Status
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-[12px] font-semibold capitalize ${renderStatus(selectedPayment.status)}`}
                  >
                    {formatStatus(selectedPayment.status)}
                  </span>
                </div>
                <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">
                    Submitted
                  </p>
                  <p className="mt-1 text-[15px] font-semibold text-[#0A0A0B]">
                    {formatDate(selectedPayment.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-md border border-[#E2E8F0]">
                <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] px-4 py-3 text-[14px]">
                  <span className="text-[#64748B]">Students</span>
                  <strong className="text-[#0A0A0B]">
                    {selectedPayment.totalStudents ?? 'N/A'}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] px-4 py-3 text-[14px]">
                  <span className="text-[#64748B]">Per-student charge</span>
                  <strong className="text-[#0A0A0B]">
                    {formatCurrency(selectedPayment.perStudentCharge)}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] px-4 py-3 text-[14px]">
                  <span className="text-[#64748B]">Calculated total</span>
                  <strong className="text-[#0A0A0B]">
                    {formatCurrency(selectedPayment.totalAmount)}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-4 bg-[#EEF6FB] px-4 py-3 text-[15px]">
                  <span className="font-semibold text-[#063D5B]">
                    Payment amount
                  </span>
                  <strong className="text-[#063D5B]">
                    {formatCurrency(selectedPayment.amount)}
                  </strong>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-[#E2E8F0] px-4 py-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">
                  Offline note
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-[#0A0A0B]">
                  {selectedPayment.offlinePaymentNote?.trim() ||
                    'No note submitted.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-[#E5E7EB] px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="h-10 rounded-md border border-[#CBD5E1] px-4 text-[14px] font-semibold text-[#334155] transition hover:bg-[#F8FAFC]"
              >
                Close
              </button>
              {selectedPayment.status === 'completed' ? (
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(selectedPayment._id)}
                  disabled={invoiceDownloadingId === selectedPayment._id}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#0B5280] px-4 text-[14px] font-semibold text-[#0B5280] transition hover:bg-[#F0F7FF] disabled:opacity-60"
                >
                  <Download className="size-4" />
                  {invoiceDownloadingId === selectedPayment._id
                    ? 'Downloading...'
                    : 'Download Invoice'}
                </button>
              ) : null}
              {selectedPayment.status === 'offline_pending' ? (
                <button
                  type="button"
                  onClick={() => handleApproveOffline(selectedPayment._id)}
                  disabled={approvingId === selectedPayment._id}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0B5280] px-4 text-[14px] font-semibold text-white transition hover:bg-[#094570] disabled:opacity-60"
                >
                  {approvingId === selectedPayment._id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Approve Payment
                </button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

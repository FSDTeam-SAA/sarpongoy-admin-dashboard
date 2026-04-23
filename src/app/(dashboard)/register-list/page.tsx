'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { ChevronLeft, ChevronRight, Eye, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { TableSkeleton } from '../_components/SkeletonBlocks'

type SessionUser = {
  accessToken?: string | null
}

type SchoolRef = {
  _id?: string
  name?: string
}

type RegisterItem = {
  _id: string
  firstName?: string
  lastName?: string
  email?: string
  totalStudent?: number
  subscription?: string | null
  schoolName?: SchoolRef | string | null
}

type PaymentItem = {
  email?: string
  amount?: number
  status?: string
}

type PaginationMeta = {
  page: number
  limit: number
  total: number
}

type AmountMap = Record<string, number>

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL

export default function RegisterListPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const accessToken = user?.accessToken

  const [schools, setSchools] = useState<RegisterItem[]>([])
  const [amountMap, setAmountMap] = useState<AmountMap>({})
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          role: 'school',
          page: String(meta.page),
          limit: String(meta.limit),
        })

        if (search.trim()) {
          params.set('searchTerm', search.trim())
        }

        const response = await fetch(`${baseUrl}/user?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        })

        const result = (await response.json()) as {
          data?: RegisterItem[]
          meta?: PaginationMeta
          message?: string
        }

        if (!response.ok) {
          throw new Error(result.message || 'Failed to load registered schools')
        }

        const registerData = result.data || []
        setSchools(registerData)
        setMeta(result.meta || { page: 1, limit: 10, total: 0 })

        const paymentTotals = await Promise.all(
          registerData.map(async item => {
            if (!item.email) return [item._id, 0] as const

            const paymentResponse = await fetch(
              `${baseUrl}/payment?searchTerm=${encodeURIComponent(item.email)}&status=completed&limit=100`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
                signal: controller.signal,
              },
            )

            const paymentResult = (await paymentResponse.json()) as {
              data?: PaymentItem[]
            }

            const totalAmount = (paymentResult.data || []).reduce(
              (sum, payment) => sum + (payment.email === item.email ? payment.amount || 0 : 0),
              0,
            )

            return [item._id, totalAmount] as const
          }),
        )

        setAmountMap(Object.fromEntries(paymentTotals))
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error(error instanceof Error ? error.message : 'Failed to load registered schools')
        }
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [accessToken, meta.page, meta.limit, search])

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit))

  const handleDelete = async (id: string) => {
    if (!accessToken) return

    try {
      const response = await fetch(`${baseUrl}/user/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const result = (await response.json()) as { message?: string }

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete school')
      }

      setSchools(current => current.filter(item => item._id !== id))
      setMeta(current => ({ ...current, total: Math.max(0, current.total - 1) }))
      setAmountMap(current => {
        const next = { ...current }
        delete next[id]
        return next
      })
      toast.success('Registered school deleted successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete school')
    }
  }

  const getSchoolLabel = (item: RegisterItem) => {
    if (item.schoolName && typeof item.schoolName === 'object') {
      return item.schoolName.name || 'N/A'
    }

    const fullName = [item.firstName, item.lastName].filter(Boolean).join(' ')
    return fullName || 'N/A'
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#ECF7FD] p-8">
      <section className="rounded-lg bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] px-5 py-4">
          <h1 className="text-[18px] font-semibold text-[#0A0A0B]">Register Lists</h1>

          <div className="flex h-11 w-full min-w-[260px] max-w-[320px] items-center rounded-full border border-[#D1D5DB] px-4 text-[#6B7280] sm:w-[320px]">
            <input
              type="text"
              placeholder="Search School"
              value={search}
              onChange={event => {
                setMeta(current => ({ ...current, page: 1 }))
                setSearch(event.target.value)
              }}
              className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#C0C4CC]"
            />
            <Search className="size-4 shrink-0" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-[#F9FAFB]">
              <tr className="border-b border-[#E5E7EB]">
                <th className="px-4 py-4 text-center text-[16px] font-bold text-[#6B7280]">School Name</th>
                <th className="px-4 py-4 text-center text-[16px] font-bold text-[#6B7280]">Email</th>
                <th className="px-4 py-4 text-center text-[16px] font-bold text-[#6B7280]">Total School Population</th>
                <th className="px-4 py-4 text-center text-[16px] font-bold text-[#6B7280]">Total Amount</th>
                <th className="px-4 py-4 text-center text-[16px] font-bold text-[#6B7280]">Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <TableSkeleton columns={5} rows={6} />
                  </td>
                </tr>
              ) : schools.length ? (
                schools.map(item => (
                  <tr key={item._id} className="border-b border-[#E5E7EB]">
                    <td className="px-4 py-8 text-center text-[16px] font-normal text-[#0A0A0B]">
                      {getSchoolLabel(item)}
                    </td>
                    <td className="px-4 py-8 text-center text-[16px] font-normal text-[#0A0A0B]">{item.email || 'N/A'}</td>
                    <td className="px-4 py-8 text-center text-[16px] font-normal text-[#0A0A0B]">{item.totalStudent ?? 0}</td>
                    <td className="px-4 py-8 text-center text-[16px] font-normal text-[#0A0A0B]">
                      ${Number(amountMap[item._id] || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-8">
                      <div className="flex items-center justify-center gap-4">
                        <Link
                          href={`/register-list/${item._id}`}
                          className="text-[#7A7A7A] transition hover:text-[#0B5280]"
                          aria-label={`View ${getSchoolLabel(item)}`}
                        >
                          <Eye className="size-5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          className="text-red-500 transition hover:text-red-600"
                          aria-label={`Delete ${getSchoolLabel(item)}`}
                        >
                          <Trash2 className="size-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[16px] text-[#6B7280]">
                    No registered schools found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <p className="text-[16px] font-normal text-[#6B7280]">
            Showing {schools.length ? (meta.page - 1) * meta.limit + 1 : 0} to {Math.min(meta.page * meta.limit, meta.total)} of{' '}
            {meta.total} results
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMeta(current => ({ ...current, page: Math.max(1, current.page - 1) }))}
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
              onClick={() => setMeta(current => ({ ...current, page: Math.min(totalPages, current.page + 1) }))}
              disabled={meta.page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded border border-[#94A3B8] text-[#334155] disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

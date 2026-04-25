'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { ChevronLeft, ChevronRight, Eye, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { TableSkeleton } from '../_components/SkeletonBlocks'

type SessionUser = {
  accessToken?: string | null
}

type SchoolUser = {
  _id: string
  email?: string
  totalStudent?: number
  status?: string
}

type SchoolItem = {
  _id: string
  name: string
  school?: SchoolUser[]
}

type PaginationMeta = {
  page: number
  limit: number
  total: number
}

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL

const getSchoolEmail = (school: SchoolItem) =>
  school.school?.find(item => item.email)?.email || 'N/A'

const getTotalStudents = (school: SchoolItem) =>
  (school.school || []).reduce((total, item) => total + Number(item.totalStudent || 0), 0)

const getSchoolStatus = (school: SchoolItem) => {
  const statuses = (school.school || []).map(item => item.status).filter(Boolean)
  if (!statuses.length) return 'inactive'
  return statuses.includes('active') ? 'active' : statuses[0] || 'inactive'
}

export default function SchoolListPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const accessToken = user?.accessToken

  const [schools, setSchools] = useState<SchoolItem[]>([])
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
          page: String(meta.page),
          limit: String(meta.limit),
        })

        if (search.trim()) {
          params.set('name', search.trim())
        }

        const response = await fetch(`${baseUrl}/school?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        })

        const result = (await response.json()) as {
          message?: string
          data?: SchoolItem[]
          meta?: PaginationMeta
        }

        if (!response.ok) {
          throw new Error(result.message || 'Failed to load schools')
        }

        setSchools(result.data || [])
        setMeta(result.meta || { page: 1, limit: 10, total: 0 })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error(error instanceof Error ? error.message : 'Failed to load schools')
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
      const response = await fetch(`${baseUrl}/school/${id}`, {
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
      toast.success('School deleted successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete school')
    }
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#ECF7FD] p-8">
      <section className="rounded-lg bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] px-5 py-4">
          <h1 className="text-[18px] font-semibold text-[#0A0A0B]">School Lists</h1>

          <div className="flex flex-wrap items-center gap-4">
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

            <Link
              href="/school-list/add"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0B5280] px-5 text-[16px] font-semibold text-white transition hover:bg-[#094570]"
            >
              Add School
              <Plus className="size-4" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-[#F9FAFB]">
              <tr className="border-b border-[#E5E7EB]">
                <th className="px-4 py-4 text-center text-[16px] font-bold text-[#6B7280]">School Name</th>
                <th className="px-4 py-4 text-center text-[16px] font-bold text-[#6B7280]">Email</th>
                <th className="px-4 py-4 text-center text-[16px] font-bold text-[#6B7280]">Total Students</th>
                <th className="px-4 py-4 text-center text-[16px] font-bold text-[#6B7280]">Total Amount</th>
                <th className="px-4 py-4 text-center text-[16px] font-bold text-[#6B7280]">Status</th>
                <th className="px-4 py-4 text-center text-[16px] font-bold text-[#6B7280]">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <TableSkeleton columns={6} rows={6} />
                  </td>
                </tr>
              ) : schools.length ? (
                schools.map(school => (
                  <tr key={school._id} className="border-b border-[#E5E7EB]">
                    <td className="px-4 py-8 text-center text-[16px] font-normal text-[#0A0A0B]">{school.name}</td>
                    <td className="px-4 py-8 text-center text-[16px] font-normal text-[#0A0A0B]">{getSchoolEmail(school)}</td>
                    <td className="px-4 py-8 text-center text-[16px] font-normal text-[#0A0A0B]">{getTotalStudents(school)}</td>
                    <td className="px-4 py-8 text-center text-[16px] font-normal text-[#0A0A0B]">$0</td>
                    <td className="px-4 py-8 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[12px] font-medium ${
                          getSchoolStatus(school) === 'active'
                            ? 'bg-[#D9FBE2] text-[#2F9E44]'
                            : 'bg-[#FDE2E2] text-[#D92D20]'
                        }`}
                      >
                        {getSchoolStatus(school)}
                      </span>
                    </td>
                    <td className="px-4 py-8">
                      <div className="flex items-center justify-center gap-4">
                        <Link
                          href={`/school-list/${school._id}`}
                          className="text-[#7A7A7A] transition hover:text-[#0B5280]"
                          aria-label={`View ${school.name}`}
                        >
                          <Eye className="size-5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(school._id)}
                          className="text-red-500 transition hover:text-red-600"
                          aria-label={`Delete ${school.name}`}
                        >
                          <Trash2 className="size-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[16px] text-[#6B7280]">
                    No schools found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <p className="text-[16px] font-normal text-[#6B7280]">
            Showing {schools.length ? (meta.page - 1) * meta.limit + 1 : 0} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} results
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

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
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
}

type SchoolDetails = {
  _id: string
  name: string
  school?: SchoolMember[]
}

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL

export default function SchoolDetailsPage() {
  const params = useParams<{ id: string }>()
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const accessToken = user?.accessToken

  const [school, setSchool] = useState<SchoolDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params?.id) return

    const loadSchool = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${baseUrl}/school/${params.id}`, {
          headers: accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : undefined,
        })

        const result = (await response.json()) as { message?: string; data?: SchoolDetails }

        if (!response.ok) {
          throw new Error(result.message || 'Failed to load school details')
        }

        setSchool(result.data || null)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load school details')
      } finally {
        setLoading(false)
      }
    }

    loadSchool()
  }, [accessToken, params?.id])

  const members = school?.school || []

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#ECF7FD] px-8 py-10">
      <section className="rounded-none bg-white px-8 py-8 shadow-sm">
        <div className="mb-4">
          <Link
            href="/school-list"
            className="inline-flex items-center text-[14px] font-medium text-[#0B5280] transition hover:text-[#094570]"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to School List
          </Link>
        </div>

        {loading ? (
          <SchoolDetailsSkeleton />
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="h-[68px] w-[68px] rounded-full bg-[#CFCFCF]" />
              <h1 className="text-[28px] font-semibold text-[#5A5A5A]">
                {school?.name || 'School Details'}
              </h1>
            </div>

            <div className="mt-10">
              <h2 className="text-[18px] font-medium text-[#0A0A0B]">All Students</h2>

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
                    {members.length ? (
                      members.map(member => (
                        <tr key={member._id} className="border-b border-[#E5E7EB]">
                          <td className="px-4 py-4 text-center text-[14px] font-normal text-[#0A0A0B]">{school?.name}</td>
                          <td className="px-4 py-4 text-center text-[14px] font-normal text-[#0A0A0B]">{member.lastName || 'N/A'}</td>
                          <td className="px-4 py-4 text-center text-[14px] font-normal text-[#0A0A0B]">{member.firstName || 'N/A'}</td>
                          <td className="px-4 py-4 text-center text-[14px] font-normal text-[#0A0A0B]">{member._id.slice(-6)}</td>
                          <td className="px-4 py-4 text-center text-[14px] font-normal text-[#0A0A0B]">
                            {member.totalStudent ? `Total ${member.totalStudent}` : member.role || 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-[14px] text-[#6B7280]">
                          No linked users found for this school.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 px-3 py-6">
                <p className="text-[14px] font-normal text-[#6B7280]">
                  Showing {members.length ? 1 : 0} to {members.length} of {members.length} results
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

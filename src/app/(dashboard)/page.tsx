'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import KpiCard from './_components/KpiCard'
import RevenueChart from './_components/RevenueChart'
import SchoolTable, { type SchoolRow } from './_components/SchoolTable'

type SessionUser = {
  accessToken?: string | null
}

type UserItem = {
  _id: string
  email?: string
  totalStudent?: number
  subscription?: string | { status?: string } | null
  subscriptionExpiry?: string
  schoolName?: string | { name?: string }
}

type PaymentItem = {
  _id: string
  amount?: number
  status?: string
  createdAt?: string
  email?: string
  userId?: {
    email?: string
    schoolName?: string | { name?: string }
  }
}

type PaginationMeta = {
  page: number
  limit: number
  total: number
}

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL

const formatSchoolName = (schoolName?: UserItem['schoolName']) => {
  if (!schoolName) return 'N/A'
  return typeof schoolName === 'string' ? schoolName : schoolName.name || 'N/A'
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const getMonthLabel = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()

function buildRevenueSeries(payments: PaymentItem[]) {
  const now = new Date()
  const months: { key: string; label: string; value: number }[] = []

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    months.push({ key, label: getMonthLabel(date), value: 0 })
  }

  payments.forEach(payment => {
    if (!payment.createdAt) return

    const createdDate = new Date(payment.createdAt)
    const key = `${createdDate.getFullYear()}-${createdDate.getMonth()}`
    const bucket = months.find(item => item.key === key)

    if (bucket) {
      bucket.value += Number(payment.amount || 0)
    }
  })

  return months.map(({ label, value }) => ({ month: label, value }))
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const accessToken = user?.accessToken

  const [schools, setSchools] = useState<SchoolRow[]>([])
  const [schoolsLoading, setSchoolsLoading] = useState(true)
  const [schoolsTotal, setSchoolsTotal] = useState(0)

  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [revenueLoading, setRevenueLoading] = useState(true)

  useEffect(() => {
    if (!accessToken || !baseUrl) {
      setSchoolsLoading(false)
      setRevenueLoading(false)
      return
    }

    const controller = new AbortController()

    const loadDashboard = async () => {
      try {
        setSchoolsLoading(true)
        setRevenueLoading(true)

        const [schoolResponse, paymentResponse] = await Promise.all([
          fetch(
            `${baseUrl}/user?role=school&page=1&limit=5&sortBy=createdAt&sortOrder=desc`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              signal: controller.signal,
            },
          ),
          fetch(
            `${baseUrl}/payment?status=completed&page=1&limit=500&sortBy=createdAt&sortOrder=desc`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              signal: controller.signal,
            },
          ),
        ])

        const schoolResult = (await schoolResponse.json()) as {
          data?: UserItem[]
          meta?: PaginationMeta
          message?: string
        }
        const paymentResult = (await paymentResponse.json()) as {
          data?: PaymentItem[]
          meta?: PaginationMeta
          message?: string
        }

        if (!schoolResponse.ok) {
          throw new Error(schoolResult.message || 'Failed to load schools')
        }

        if (!paymentResponse.ok) {
          throw new Error(paymentResult.message || 'Failed to load payments')
        }

        const completedPayments = paymentResult.data || []
        const paymentTotalsByEmail = completedPayments.reduce<Record<string, number>>(
          (acc, payment) => {
            const email = payment.email || payment.userId?.email || ''
            if (!email) return acc
            acc[email] = (acc[email] || 0) + Number(payment.amount || 0)
            return acc
          },
          {},
        )

        const schoolRows = (schoolResult.data || []).map(userItem => {
          const email = userItem.email || ''
          const isActive =
            !!userItem.subscription &&
            (!userItem.subscriptionExpiry || new Date(userItem.subscriptionExpiry) > new Date())

          return {
            _id: userItem._id,
            name: formatSchoolName(userItem.schoolName),
            email,
            totalStudents: Number(userItem.totalStudent || 0),
            totalAmount: paymentTotalsByEmail[email] || 0,
            status: isActive ? 'active' : 'inactive',
          }
        })

        setSchools(schoolRows)
        setSchoolsTotal(schoolResult.meta?.total || schoolRows.length)
        setPayments(completedPayments)
      } catch {
        setSchools([])
        setSchoolsTotal(0)
        setPayments([])
      } finally {
        setSchoolsLoading(false)
        setRevenueLoading(false)
      }
    }

    loadDashboard()

    return () => controller.abort()
  }, [accessToken])

  const totalRevenue = useMemo(
    () => payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [payments],
  )

  const revenueSeries = useMemo(() => buildRevenueSeries(payments), [payments])

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-[#ECF7FD] p-10">
      <div className="grid gap-6 md:grid-cols-2">
        <KpiCard title="Total Schools" value={schoolsTotal} icon="schools" />
        <KpiCard title="Total Revenue" value={`$${formatCurrency(totalRevenue)}`} icon="revenue" />
      </div>

      <div className="mt-6">
        <RevenueChart
          data={revenueSeries}
          totalRevenue={totalRevenue}
          loading={revenueLoading}
        />
      </div>

      <div className="mt-6">
        <SchoolTable schools={schools} loading={schoolsLoading} />
      </div>
    </div>
  )
}

'use client'

import { CheckCircle2, Loader2, Plus, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

type SessionUser = {
  accessToken?: string | null
}

type SubscriptionItem = {
  _id: string
  name: string
  price: number
  features: string[]
  months: number
  status: 'active' | 'inactive'
}

type PaginationMeta = {
  page: number
  limit: number
  total: number
}

const emptyForm = {
  id: '',
  name: '',
  features: '',
  months: '',
  price: '',
  status: 'active' as 'active' | 'inactive',
}

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL

export default function SubscriptionPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const accessToken = user?.accessToken

  const [plans, setPlans] = useState<SubscriptionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!accessToken) return

    const loadPlans = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${baseUrl}/subscribe?page=1&limit=20`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        const result = (await response.json()) as {
          data?: SubscriptionItem[]
          meta?: PaginationMeta
          message?: string
        }

        if (!response.ok) {
          throw new Error(result.message || 'Failed to load subscriptions')
        }

        setPlans(result.data || [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load subscriptions')
      } finally {
        setLoading(false)
      }
    }

    loadPlans()
  }, [accessToken])

  const openEditor = (plan?: SubscriptionItem) => {
    if (!plan) {
      setForm(emptyForm)
      setOpen(true)
      return
    }

    setForm({
      id: plan._id,
      name: plan.name,
      features: plan.features.join('\n'),
      months: String(plan.months),
      price: String(plan.price),
      status: plan.status,
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!accessToken) return

    try {
      setSaving(true)
      const payload = {
        name: form.name.trim(),
        features: form.features
          .split('\n')
          .map(item => item.trim())
          .filter(Boolean),
        months: Number(form.months) || 0,
        price: Number(form.price) || 0,
        status: form.status,
      }

      const endpoint = form.id ? `${baseUrl}/subscribe/${form.id}` : `${baseUrl}/subscribe`
      const method = form.id ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as {
        message?: string
        data?: SubscriptionItem
      }

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save subscription')
      }

      setPlans(current =>
        form.id
          ? current.map(item => (item._id === form.id ? (result.data as SubscriptionItem) : item))
          : [result.data as SubscriptionItem, ...current],
      )
      setOpen(false)
      setForm(emptyForm)
      toast.success(form.id ? 'Subscription updated successfully' : 'Subscription created successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save subscription')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#ECF7FD] p-8">
      <section className="rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
          <h1 className="text-[18px] font-semibold text-[#0A0A0B]">Subscription</h1>
          <button
            type="button"
            onClick={() => openEditor()}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#2F6FB3] px-4 text-[14px] font-semibold text-white transition hover:bg-[#0B5280]"
          >
            <Plus className="size-4" />
            Add Plan
          </button>
        </div>

        <div className="px-6 py-10">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[340px] animate-pulse rounded-2xl border border-[#D6E4FF] bg-white shadow-[0_12px_24px_rgba(11,82,128,0.08)]"
                />
              ))}
            </div>
          ) : plans.length ? (
            <div className="flex flex-wrap justify-center gap-8">
              {plans.map(plan => (
                <div
                  key={plan._id}
                  className="w-full max-w-[310px] rounded-2xl border border-[#8AA4FF] bg-white px-8 py-7 shadow-[0_12px_24px_rgba(11,82,128,0.12)]"
                >
                  <div className="text-center">
                    <div className="mx-auto inline-flex rounded-full bg-[#EEF4FF] px-4 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#5B67F1]">
                      {plan.status}
                    </div>
                    <h2 className="mt-3 text-[34px] font-semibold text-[#1F2937]">{plan.name}</h2>
                    <p className="mt-2 text-[18px] font-semibold text-[#1F2937]">{plan.months} Months</p>
                    <p className="mt-3 text-[50px] font-bold leading-none text-[#0A0A0B]">${plan.price}</p>
                  </div>

                  <ul className="mt-8 space-y-4">
                    {plan.features.map(feature => (
                      <li key={feature} className="flex items-center gap-3 text-[15px] text-[#4B5563]">
                        <CheckCircle2 className="size-5 text-[#34D399]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => openEditor(plan)}
                    className="mt-8 flex h-11 w-full items-center justify-center rounded-md bg-[#0B2E59] text-[15px] font-semibold text-white transition hover:bg-[#0B5280]"
                  >
                    Edit plan
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-[#C6D4E1] bg-white text-[16px] text-[#6B7280]">
              No subscription plans found.
            </div>
          )}
        </div>
      </section>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-sm bg-white px-6 py-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="w-5" />
              <h2 className="text-center text-[15px] font-medium text-[#0A0A0B]">
                {form.id ? 'Edit subscription' : 'Add subscription'}
              </h2>
              <button type="button" onClick={() => setOpen(false)} className="text-[#0A0A0B]">
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <label className="mb-1 block text-[12px] text-[#5A5A5A]">Subscription Plan Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
                  placeholder="Premium"
                  className="h-10 w-full rounded-sm border border-[#9DB8FF] px-3 text-[13px] outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] text-[#5A5A5A]">Subscription Features</label>
                <textarea
                  rows={8}
                  value={form.features}
                  onChange={event => setForm(current => ({ ...current, features: event.target.value }))}
                  placeholder={'Full Library Access\nLive Classes\nProgress Tracking'}
                  className="w-full rounded-sm border border-[#9DB8FF] px-3 py-3 text-[13px] outline-none"
                />
              </div>

              <div>
                <p className="mb-1 text-[12px] text-[#5A5A5A]">Choose Your Subscription Plan</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] text-[#9CA3AF]">Months</label>
                    <input
                      type="number"
                      value={form.months}
                      onChange={event => setForm(current => ({ ...current, months: event.target.value }))}
                      placeholder="3"
                      className="h-10 w-full rounded-sm border border-[#9DB8FF] px-3 text-[13px] outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#9CA3AF]">Price</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={event => setForm(current => ({ ...current, price: event.target.value }))}
                      placeholder="0"
                      className="h-10 w-full rounded-sm border border-[#9DB8FF] px-3 text-[13px] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] text-[#5A5A5A]">Status</label>
                <select
                  value={form.status}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      status: event.target.value as 'active' | 'inactive',
                    }))
                  }
                  className="h-10 w-full rounded-sm border border-[#9DB8FF] px-3 text-[13px] outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm bg-[#2F6FB3] text-[13px] font-semibold text-white transition hover:bg-[#0B5280] disabled:opacity-60"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

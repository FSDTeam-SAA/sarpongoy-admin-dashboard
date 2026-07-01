'use client'

import { Loader2, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

type SessionUser = {
  accessToken?: string | null
}

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL

const splitAmount = (total: number, count: number) => {
  const cents = Math.round(total * 100)
  const base = Math.floor(cents / count)
  const remainder = cents - base * count

  return Array.from({ length: count }, (_, index) =>
    ((base + (index < remainder ? 1 : 0)) / 100).toFixed(2),
  )
}

export default function AddSchoolPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const accessToken = user?.accessToken

  const [schoolName, setSchoolName] = useState('')
  const [subscribePrice, setSubscribePrice] = useState('')
  const [totalStudent, setTotalStudent] = useState('')
  const [ndaFile, setNdaFile] = useState<File | null>(null)
  const [paymentTerms, setPaymentTerms] = useState([
    { termId: 'term_1', label: 'Term 1', amount: '', dueDate: '' },
    { termId: 'term_2', label: 'Term 2', amount: '', dueDate: '' },
    { termId: 'term_3', label: 'Term 3', amount: '', dueDate: '' },
  ])
  const [saving, setSaving] = useState(false)
  const totalContractAmount =
    Number(subscribePrice || 0) * Number(totalStudent || 0)
  const termTotal = paymentTerms.reduce(
    (sum, term) => sum + Number(term.amount || 0),
    0,
  )
  const termDelta = Number((totalContractAmount - termTotal).toFixed(2))

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount || 0)

  const setTermCount = (count: number) => {
    const safeCount = Math.max(1, count)
    setPaymentTerms(current =>
      Array.from({ length: safeCount }, (_, index) => {
        const existing = current[index]
        return (
          existing || {
            termId: `term_${index + 1}`,
            label: `Term ${index + 1}`,
            amount: '',
            dueDate: '',
          }
        )
      }),
    )
  }

  const prevTotalContractRef = useRef(0)

  useEffect(() => {
    if (totalContractAmount <= 0) return

    const isEmpty = paymentTerms.every(term => !term.amount)
    if (totalContractAmount !== prevTotalContractRef.current || isEmpty) {
      prevTotalContractRef.current = totalContractAmount
      const amounts = splitAmount(totalContractAmount, paymentTerms.length)
      setPaymentTerms(current =>
        current.map((term, index) => ({
          ...term,
          amount: amounts[index] || '',
        })),
      )
    }
  }, [paymentTerms, totalContractAmount])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!accessToken) return
    if (!schoolName.trim()) {
      toast.error('Please enter school name')
      return
    }
    if (Number(subscribePrice || 0) <= 0 || Number(totalStudent || 0) <= 0) {
      toast.error('Per-student charge and total population are required')
      return
    }
    if (Math.round(termDelta * 100) !== 0) {
      toast.error(`Term total mismatch: ${formatCurrency(termDelta)} remaining`)
      return
    }

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('name', schoolName.trim())
      formData.append('subscribePrice', subscribePrice)
      formData.append('totalStudent', totalStudent)
      formData.append(
        'paymentTerms',
        JSON.stringify(
          paymentTerms.map((term, index) => ({
            termId: term.termId || `term_${index + 1}`,
            label: term.label || `Term ${index + 1}`,
            amount: Number(term.amount || 0),
            dueDate: term.dueDate || undefined,
          })),
        ),
      )
      paymentTerms.forEach((term, index) => {
        if (!term.dueDate) return
        if (index === 0) formData.append('firstTermDueDate', term.dueDate)
        if (index === 1) formData.append('secondTermDueDate', term.dueDate)
        if (index === 2) formData.append('thirdTermDueDate', term.dueDate)
      })

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
    <div className="min-h-[calc(100vh-5rem)] bg-[#ECF7FD] px-4 py-6 sm:px-6 lg:min-h-[calc(100vh-6rem)] lg:px-8 lg:py-10">
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center lg:min-h-[calc(100vh-10rem)]">
        <section className="w-full max-w-[980px] rounded-lg bg-white px-4 py-8 shadow-sm sm:px-8 lg:px-14 lg:py-14">
          <h1 className="text-center text-[24px] font-semibold text-[#5A5A5A]">Add School</h1>

          <form onSubmit={handleSubmit} className="mx-auto mt-8 w-full max-w-[760px] lg:mt-10">
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
                Per-student Charge
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
              <label htmlFor="totalStudent" className="block text-[13px] font-medium text-[#5A5A5A]">
                Total School Population
              </label>
              <input
                id="totalStudent"
                name="totalStudent"
                type="number"
                min="1"
                step="1"
                value={totalStudent}
                onChange={event => setTotalStudent(event.target.value)}
                placeholder="Write here"
                className="mt-2 h-11 w-full rounded-sm border border-[#D1D5DB] px-4 text-[14px] text-[#0A0A0B] outline-none transition focus:border-[#0B5280]"
              />
            </div>

            <div className="mt-6 rounded-sm border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
              <p className="text-[13px] font-medium text-[#111827]">
                Total Contract Amount
              </p>
              <p className="mt-1 text-[24px] font-semibold text-[#0B5280]">
                {formatCurrency(totalContractAmount)}
              </p>
            </div>

            <div className="mt-6">
              <label htmlFor="ndaFile" className="block text-[13px] font-medium text-[#5A5A5A]">
                School Contract File (Optional)
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
                Upload the school contract file when available.
              </p>
            </div>

            <div className="mt-6 rounded-sm border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[14px] font-semibold text-[#111827]">Payment Terms</p>
                <input
                  type="number"
                  min="1"
                  value={paymentTerms.length}
                  onChange={event => setTermCount(Number(event.target.value || 1))}
                  className="h-10 w-24 rounded-sm border border-[#D1D5DB] px-3 text-[14px] outline-none focus:border-[#0B5280]"
                  aria-label="Number of terms"
                />
              </div>
              <div className="mt-4 hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_170px] gap-3 px-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#64748B] lg:grid">
                <span>Term Name</span>
                <span>Amount</span>
                <span>Due Date</span>
              </div>
              <div className="mt-2 space-y-3">
                {paymentTerms.map((term, index) => (
                  <div key={term.termId} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_170px]">
                    <input
                      value={term.label}
                      placeholder="Term name"
                      onChange={event =>
                        setPaymentTerms(current =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, label: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="h-11 min-w-0 rounded-sm border border-[#D1D5DB] px-4 text-[14px] outline-none focus:border-[#0B5280]"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Amount"
                      value={term.amount}
                      onChange={event =>
                        setPaymentTerms(current =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, amount: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="h-11 min-w-0 rounded-sm border border-[#D1D5DB] px-4 text-[14px] outline-none focus:border-[#0B5280]"
                    />
                    <input
                      type="date"
                      aria-label={`${term.label || `Term ${index + 1}`} due date`}
                      value={term.dueDate}
                      onChange={event =>
                        setPaymentTerms(current =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, dueDate: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="h-11 min-w-0 rounded-sm border border-[#D1D5DB] px-3 text-[14px] outline-none focus:border-[#0B5280]"
                    />
                  </div>
                ))}
              </div>
              <p className={`mt-3 text-[13px] font-medium ${Math.round(termDelta * 100) === 0 ? 'text-[#166534]' : 'text-[#B45309]'}`}>
                Terms total: {formatCurrency(termTotal)} · Difference: {formatCurrency(termDelta)}
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

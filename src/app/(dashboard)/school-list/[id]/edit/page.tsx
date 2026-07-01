'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
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
  totalStudent?: number
  totalContractAmount?: number
  termsLocked?: boolean
  NDA?: string
  paymentTerms?: Array<{
    termId?: string
    label?: string
    amount?: number
    dueDate?: string
  }>
  school?: Array<{ totalStudent?: number }>
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

const splitAmount = (total: number, count: number) => {
  const cents = Math.round(total * 100)
  const base = Math.floor(cents / count)
  const remainder = cents - base * count

  return Array.from({ length: count }, (_, index) =>
    ((base + (index < remainder ? 1 : 0)) / 100).toFixed(2),
  )
}

const getSchoolPopulation = (school?: SchoolDetails | null) =>
  Number(
    school?.totalStudent ??
      school?.school?.reduce(
        (total, member) => total + Number(member?.totalStudent || 0),
        0,
      ) ??
      0,
  )

const getLegacyTermDueDate = (school: SchoolDetails | null, index: number) => {
  if (index === 0) return school?.termConfig?.firstTermDueDate
  if (index === 1) return school?.termConfig?.secondTermDueDate
  if (index === 2) return school?.termConfig?.thirdTermDueDate
  return ''
}

export default function EditSchoolPage() {
  const params = useParams<{ id: string }>()
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const accessToken = user?.accessToken

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [school, setSchool] = useState<SchoolDetails | null>(null)
  const [schoolName, setSchoolName] = useState('')
  const [subscribePrice, setSubscribePrice] = useState('')
  const [ndaFile, setNdaFile] = useState<File | null>(null)
  const [totalStudent, setTotalStudent] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [paymentTerms, setPaymentTerms] = useState([
    { termId: 'term_1', label: 'Term 1', amount: '', dueDate: '' },
    { termId: 'term_2', label: 'Term 2', amount: '', dueDate: '' },
    { termId: 'term_3', label: 'Term 3', amount: '', dueDate: '' },
  ])
  const termsLocked = Boolean(school?.termsLocked)
  const totalContractAmount =
    Number(subscribePrice || 0) * Number(totalStudent || 0)
  const termTotal = paymentTerms.reduce(
    (sum, term) => sum + Number(term.amount || 0),
    0,
  )
  const termDelta = Number((totalContractAmount - termTotal).toFixed(2))
  const perStudentChargeValue = Number(subscribePrice || 0)
  const populationValue = Number(totalStudent || 0)
  const hasInvalidTermAmount = paymentTerms.some(term => Number(term.amount || 0) <= 0)
  const hasBlankTermName = paymentTerms.some(term => !term.label.trim())
  const hasContractInputError =
    !termsLocked && (perStudentChargeValue <= 0 || populationValue <= 0)
  const hasTermError =
    !termsLocked &&
    (totalContractAmount <= 0 ||
      hasInvalidTermAmount ||
      hasBlankTermName ||
      Math.round(termDelta * 100) !== 0)
  const canSave = Boolean(schoolName.trim()) && !hasContractInputError && !hasTermError

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

  const hydrateSchool = useCallback((data: SchoolDetails | null) => {
    const population = getSchoolPopulation(data)
    const contractAmount = Number(
      data?.totalContractAmount ||
        Number(data?.subscribePrice || 0) * population ||
        0,
    )

    prevTotalContractRef.current = contractAmount
    setSchool(data)
    setSchoolName(data?.name || '')
    setSubscribePrice(data?.subscribePrice !== undefined ? String(data.subscribePrice) : '')
    setTotalStudent(population ? String(population) : '')
    setPaymentTerms(
      data?.paymentTerms?.length
        ? data.paymentTerms.map((term, index) => ({
            termId: term.termId || `term_${index + 1}`,
            label: term.label || `Term ${index + 1}`,
            amount: term.amount !== undefined ? String(term.amount) : '',
            dueDate: toDateInputValue(term.dueDate || getLegacyTermDueDate(data, index)),
          }))
        : splitAmount(contractAmount, 3).map((amount, index) => ({
            termId: `term_${index + 1}`,
            label: `Term ${index + 1}`,
            amount: contractAmount ? amount : '',
            dueDate: toDateInputValue(getLegacyTermDueDate(data, index)),
          })),
    )
  }, [])

  const loadSchool = useCallback(async () => {
    if (!params?.id || !accessToken) return

    try {
      setLoading(true)
      const response = await fetch(`${baseUrl}/school/${params.id}`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const result = (await response.json()) as { message?: string; data?: SchoolDetails }
      if (!response.ok) {
        throw new Error(result.message || 'Failed to load school')
      }

      hydrateSchool(result.data || null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load school')
    } finally {
      setLoading(false)
    }
  }, [accessToken, hydrateSchool, params?.id])

  useEffect(() => {
    if (!params?.id || !accessToken) return

    loadSchool()
  }, [accessToken, loadSchool, params?.id])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)

    if (!accessToken || !params?.id) return
    if (!schoolName.trim()) {
      toast.error('Please enter school name')
      return
    }
    if (hasContractInputError) {
      toast.error('Per-student charge and total population are required')
      return
    }
    if (!termsLocked && hasBlankTermName) {
      toast.error('Every payment term needs a name')
      return
    }
    if (!termsLocked && hasInvalidTermAmount) {
      toast.error('Every payment term amount must be greater than 0')
      return
    }
    if (!termsLocked && Math.round(termDelta * 100) !== 0) {
      toast.error(`Term total mismatch: ${formatCurrency(termDelta)} difference`)
      return
    }

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('name', schoolName.trim())

      if (!termsLocked && subscribePrice.trim()) {
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
      }

      if (ndaFile) {
        formData.append('NDA', ndaFile)
      }

      const response = await fetch(`${baseUrl}/school/${params.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })

      const result = (await response.json()) as { message?: string; data?: SchoolDetails }
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update school')
      }
      if (
        !termsLocked &&
        (!result.data?.totalStudent || !result.data?.paymentTerms?.length)
      ) {
        throw new Error('School contract fields were not saved. Please retry after restarting the backend server.')
      }

      toast.success('School updated successfully')
      await loadSchool()
      setSubmitted(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update school')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#ECF7FD] px-4 py-6 sm:px-6 lg:min-h-[calc(100vh-6rem)] lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-[980px]">
        <div className="mb-4">
          <Link
            href="/school-list"
            className="inline-flex items-center text-[14px] font-medium text-[#0B5280] transition hover:text-[#094570]"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to School List
          </Link>
        </div>

        <section className="rounded-lg bg-white px-4 py-8 shadow-sm sm:px-8 lg:px-14 lg:py-14">
          <h1 className="text-center text-[24px] font-semibold text-[#5A5A5A]">Edit School</h1>

          {loading ? (
            <div className="mt-10 text-center text-[14px] text-[#6B7280]">Loading school...</div>
          ) : (
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
                  disabled={termsLocked}
                  className="mt-2 h-11 w-full rounded-sm border border-[#D1D5DB] px-4 text-[14px] text-[#0A0A0B] outline-none transition focus:border-[#0B5280] disabled:bg-[#F3F4F6]"
                />
                {submitted && !termsLocked && perStudentChargeValue <= 0 ? (
                  <p className="mt-2 text-[12px] font-medium text-[#B91C1C]">
                    Per-student charge is required.
                  </p>
                ) : null}
              </div>

              <div className="mt-6">
                <label htmlFor="totalStudent" className="block text-[13px] font-medium text-[#5A5A5A]">
                  Total School Population
                </label>
                <input
                  id="totalStudent"
                  type="number"
                  min="1"
                  step="1"
                  value={totalStudent}
                  onChange={event => setTotalStudent(event.target.value)}
                  disabled={termsLocked}
                  className="mt-2 h-11 w-full rounded-sm border border-[#D1D5DB] px-4 text-[14px] text-[#0A0A0B] outline-none transition focus:border-[#0B5280] disabled:bg-[#F3F4F6]"
                />
                {submitted && !termsLocked && populationValue <= 0 ? (
                  <p className="mt-2 text-[12px] font-medium text-[#B91C1C]">
                    Total school population is required.
                  </p>
                ) : null}
              </div>

              <div className="mt-6 rounded-sm border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[13px] text-[#4B5563]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#111827]">Total Contract Amount</p>
                    <p className="mt-1 text-[24px] font-semibold text-[#0B5280]">
                      {formatCurrency(totalContractAmount)}
                    </p>
                  </div>
                  {termsLocked ? (
                    <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-[12px] font-semibold text-[#92400E]">
                      Locked - payments already in progress
                    </span>
                  ) : null}
                </div>
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
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[14px] font-semibold text-[#111827]">Payment Terms</p>
                  <input
                    type="number"
                    min="1"
                    value={paymentTerms.length}
                    disabled={termsLocked}
                    onChange={event => setTermCount(Number(event.target.value || 1))}
                    className="h-10 w-24 rounded-sm border border-[#D1D5DB] px-3 text-[14px] outline-none focus:border-[#0B5280] disabled:bg-[#F3F4F6]"
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
                        disabled={termsLocked}
                        onChange={event =>
                          setPaymentTerms(current =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, label: event.target.value } : item,
                            ),
                          )
                        }
                        className="h-11 min-w-0 rounded-sm border border-[#D1D5DB] px-4 text-[14px] outline-none focus:border-[#0B5280] disabled:bg-[#F3F4F6]"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount"
                        value={term.amount}
                        disabled={termsLocked}
                        onChange={event =>
                          setPaymentTerms(current =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, amount: event.target.value } : item,
                            ),
                          )
                        }
                        className="h-11 min-w-0 rounded-sm border border-[#D1D5DB] px-4 text-[14px] outline-none focus:border-[#0B5280] disabled:bg-[#F3F4F6]"
                      />
                      <input
                        type="date"
                        aria-label={`${term.label || `Term ${index + 1}`} due date`}
                        value={term.dueDate}
                        disabled={termsLocked}
                        onChange={event =>
                          setPaymentTerms(current =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, dueDate: event.target.value } : item,
                            ),
                          )
                        }
                        className="h-11 min-w-0 rounded-sm border border-[#D1D5DB] px-3 text-[14px] outline-none focus:border-[#0B5280] disabled:bg-[#F3F4F6]"
                      />
                    </div>
                  ))}
                </div>
                {submitted && !termsLocked && hasBlankTermName ? (
                  <p className="mt-3 text-[12px] font-medium text-[#B91C1C]">
                    Every payment term needs a name.
                  </p>
                ) : null}
                {submitted && !termsLocked && hasInvalidTermAmount ? (
                  <p className="mt-2 text-[12px] font-medium text-[#B91C1C]">
                    Every payment term amount must be greater than 0.
                  </p>
                ) : null}
                <p className={`mt-3 text-[13px] font-medium ${!hasTermError ? 'text-[#166534]' : 'text-[#B45309]'}`}>
                  Terms total: {formatCurrency(termTotal)} · Difference: {formatCurrency(termDelta)}
                </p>
              </div>

              <div className="mt-8 rounded-md bg-[#F8FAFC] px-4 py-3 text-[13px] text-[#4B5563]">
                Last saved price: {formatCurrency(school?.subscribePrice)}
              </div>

              <button
                type="submit"
                disabled={saving}
                className={`mt-10 inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm text-[16px] font-semibold text-white transition disabled:opacity-60 ${
                  canSave ? 'bg-[#0B5280] hover:bg-[#094570]' : 'bg-[#0B5280]'
                }`}
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

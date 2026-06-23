'use client'

import Link from 'next/link'
import { ArrowRight, GraduationCap } from 'lucide-react'

export default function SubscriptionPage() {
  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#ECF7FD] p-8">
      <section className="rounded-xl border border-[#D9E6F1] bg-white p-8 shadow-sm">
        <div className="flex max-w-3xl flex-col gap-5">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#E8F4FF] text-[#0B5280]">
            <GraduationCap className="size-7" />
          </div>

          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#6A9D23]">
              Subscription moved
            </p>
            <h1 className="mt-3 text-[30px] font-bold text-[#0A0A0B]">
              School subscriptions are now managed per school
            </h1>
            <p className="mt-3 text-[16px] leading-7 text-[#64748B]">
              The old global subscription packages are no longer used. Add or
              update a school from School List and set that school&apos;s own
              subscription price and NDA file there.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/school-list"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0B5280] px-5 text-[15px] font-semibold text-white transition hover:bg-[#094570]"
            >
              Go to School List
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/school-list/add"
              className="inline-flex h-11 items-center justify-center rounded-md border border-[#0B5280] px-5 text-[15px] font-semibold text-[#0B5280] transition hover:bg-[#F0F7FF]"
            >
              Add New School
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

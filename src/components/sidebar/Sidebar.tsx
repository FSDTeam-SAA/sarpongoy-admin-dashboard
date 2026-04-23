'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  AlertTriangle,
  BadgeCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Wallet,
  Phone,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'School List', icon: GraduationCap, href: '/school-list' },
  { label: 'Register List', icon: ClipboardList, href: '/register-list' },
  { label: 'Subscription', icon: BadgeCheck, href: '/subscription' },
  { label: 'Payment', icon: Wallet, href: '/payment' },
  { label: 'Contact Us', icon: Phone, href: '/contact-us' },
  { label: 'Settings', icon: Settings, href: '/settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await signOut({ callbackUrl: '/signin' })
    } finally {
      setIsLoggingOut(false)
      setShowLogoutModal(false)
    }
  }

  return (
    <>
      <aside
        className="sticky top-0 flex h-screen w-[330px] shrink-0 flex-col px-6 py-0"
        style={{
          background: 'linear-gradient(180deg, #C3E1FF 0%, #608BB9 100%)',
        }}
      >
        <div className="mb-[-15px] flex justify-center pb-0 pt-0 -mt-1">
          <Image
            src="/images/logo.png"
            alt="Sarpongoy logo"
            width={146}
            height={106}
            className="h-auto w-[196px]"
            priority
          />
        </div>

        <nav className="flex-1 space-y-3">
          {navItems.map(item => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-8 py-2 text-[20px] font-medium text-[#0A0A0B] transition-colors',
                  isActive
                    ? 'bg-[#286CB2] text-white'
                    : 'hover:bg-white/20 hover:text-[#0A0A0B]',
                )}
              >
                <item.icon className="size-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="mt-8 flex items-center gap-3 rounded-lg px-8 py-4 text-[20px] font-medium text-red-500 transition-colors hover:bg-white/20"
        >
          <LogOut className="size-5" />
          <span>Log Out</span>
        </button>
      </aside>

      {showLogoutModal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0A0A0B]/30 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertTriangle className="size-7" />
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-[24px] font-semibold text-[#0A0A0B]">Log out of admin dashboard?</h2>
              <p className="mt-2 text-[15px] leading-6 text-[#6B7280]">
                You&apos;ll need to sign in again to manage schools, subscriptions, and platform settings.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex h-11 flex-1 items-center justify-center rounded-md border border-[#D1D5DB] text-[15px] font-medium text-[#0A0A0B] transition hover:bg-[#F9FAFB] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex h-11 flex-1 items-center justify-center rounded-md bg-[#0B5280] text-[15px] font-semibold text-white transition hover:bg-[#094570] disabled:opacity-60"
              >
                {isLoggingOut ? 'Logging out...' : 'Yes, Log Out'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

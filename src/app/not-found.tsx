'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, LayoutDashboard } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const router = useRouter()

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: event.clientX / window.innerWidth - 0.5,
        y: event.clientY / window.innerHeight - 0.5,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    const timer = setTimeout(() => setIsLoaded(true), 100)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#d7ebff] via-[#eef7ff] to-[#d6e9fb] px-4">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="absolute rounded-full border border-white/40 bg-white/15 backdrop-blur-sm shadow-sm"
            style={{
              width: `${(index + 1) * 120}px`,
              height: `${(index + 1) * 120}px`,
              left: `calc(50% - ${(index + 1) * 60}px)`,
              top: `calc(50% - ${(index + 1) * 60}px)`,
              animationDuration: `${20 + index * 5}s`,
              animationDelay: `${index * 0.2}s`,
              animation: `pulse ${10 + index * 2}s infinite ease-in-out alternate`,
              transform: `translate(${mousePosition.x * (index + 1) * 15}px, ${mousePosition.y * (index + 1) * 15}px)`,
              transition: 'transform 0.2s ease-out',
            }}
          />
        ))}
      </div>

      <div
        className={`z-10 flex max-w-[720px] flex-col items-center rounded-[2rem] border border-white/50 bg-white/65 p-10 text-center shadow-xl backdrop-blur-md transition-all duration-1000 ease-out md:p-16 ${
          isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#0B5280]/15 bg-white shadow-sm">
          <LayoutDashboard className="h-10 w-10 text-[#0B5280]" />
        </div>

        <div
          className="relative mb-4"
          style={{
            transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`,
            transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          <h1
            className="bg-clip-text text-[6rem] font-black leading-none tracking-tighter text-transparent sm:text-[8rem] md:text-[10rem]"
            style={{ backgroundImage: 'linear-gradient(90.99deg, #608BB9 2.49%, #0B5280 99.73%)' }}
          >
            404
          </h1>
        </div>

        <h2 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl">
          Dashboard page not found
        </h2>

        <p className="mb-10 max-w-md font-medium text-gray-600">
          The admin page you&apos;re trying to open is unavailable right now or has not been created yet in the
          Sarpongoy dashboard.
        </p>

        <div className="flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row sm:items-center">
          <Link
            href="/"
            className="group relative inline-flex h-14 w-full shrink-0 items-center justify-center overflow-hidden rounded-full border-none px-8 text-base font-bold text-white shadow-md transition-all hover:shadow-lg sm:w-auto"
            style={{
              background: 'linear-gradient(90.99deg, #608BB9 2.49%, #0B5280 99.73%)',
              transform: `translate(${mousePosition.x * -5}px, ${mousePosition.y * -5}px)`,
              transition: 'transform 0.3s ease-out, box-shadow 0.3s ease',
            }}
          >
            Back to dashboard
          </Link>

          <Button
            variant="outline"
            onClick={() => router.back()}
            className="group relative flex h-14 w-full shrink-0 items-center justify-center overflow-hidden rounded-full border-gray-200 bg-white/80 px-8 text-base font-bold text-gray-800 shadow-sm transition-all hover:bg-gray-50 hover:shadow sm:w-auto"
            style={{
              transform: `translate(${mousePosition.x * -5}px, ${mousePosition.y * -5}px)`,
              transition:
                'transform 0.3s ease-out, background-color 0.3s ease, border-color 0.3s ease',
            }}
          >
            <ArrowLeft className="mr-2 h-5 w-5 text-gray-500 transition-transform group-hover:-translate-x-1" />
            <span>Go back</span>
          </Button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.05) rotate(5deg);
          }
        }
      `}</style>
    </div>
  )
}

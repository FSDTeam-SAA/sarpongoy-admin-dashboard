// import AppProvider from "@/provider/AppProvider";
import Header from '@/components/header/Header'
import { Sidebar } from '@/components/sidebar/Sidebar'
import React from 'react'

function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="w-full mt-24">
          {/* <AppProvider> */}
          {children}
          {/* </AppProvider> */}
        </div>
      </div>
    </>
  )
}

export default layout

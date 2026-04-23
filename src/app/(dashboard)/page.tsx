import KpiCard from './_components/KpiCard'
import RevenueChart from './_components/RevenueChart'
import SchoolTable from './_components/SchoolTable'

export default function DashboardPage() {
  return (
    <div className="min-h-[calc(100vh-7rem)]  bg-[#ECF7FD] p-10">
      <div className="grid gap-6 md:grid-cols-2">
        <KpiCard title="Total Schools" value="1,250" icon="schools" />
        <KpiCard title="Total Revenue" value="$86,400.12" icon="revenue" />
      </div>

      <div className="mt-6">
        <RevenueChart />
      </div>

      <div className="mt-6">
        <SchoolTable />
      </div>
    </div>
  )
}

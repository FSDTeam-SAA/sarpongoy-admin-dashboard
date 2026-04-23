type TableSkeletonProps = {
  columns: number
  rows?: number
}

export function TableSkeleton({
  columns,
  rows = 6,
}: TableSkeletonProps) {
  return (
    <div className="animate-pulse">
      <div className="grid gap-4 bg-[#F9FAFB] px-4 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="mx-auto h-4 w-24 rounded bg-[#E5E7EB]" />
        ))}
      </div>

      <div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid border-b border-[#E5E7EB] px-4 py-7"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((__, columnIndex) => (
              <div key={columnIndex} className="mx-auto h-4 w-20 rounded bg-[#E5E7EB]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProfileFormSkeleton() {
  return (
    <div className="mt-6 animate-pulse">
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <div className="mb-2 h-4 w-24 rounded bg-[#E5E7EB]" />
            <div className="h-11 w-full rounded-md bg-[#E5E7EB]" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PasswordCardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="rounded-xl border border-[#B9C6D2] bg-[#ECF7FD] px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="h-[72px] w-[72px] rounded-full bg-[#D8E3EC]" />
          <div className="space-y-2">
            <div className="h-5 w-44 rounded bg-[#D8E3EC]" />
            <div className="h-4 w-20 rounded bg-[#D8E3EC]" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#B9C6D2] bg-[#ECF7FD] px-4 py-4">
        <div className="h-5 w-40 rounded bg-[#D8E3EC]" />
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index}>
              <div className="mb-2 h-4 w-32 rounded bg-[#D8E3EC]" />
              <div className="h-11 w-full rounded-md bg-[#D8E3EC]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SchoolDetailsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 h-4 w-40 rounded bg-[#D8E3EC]" />

      <div className="flex items-center gap-4">
        <div className="h-[68px] w-[68px] rounded-full bg-[#D8E3EC]" />
        <div className="h-10 w-72 rounded bg-[#D8E3EC]" />
      </div>

      <div className="mt-10">
        <div className="h-6 w-28 rounded bg-[#D8E3EC]" />
        <div className="mt-4 rounded-sm bg-white">
          <TableSkeleton columns={5} rows={8} />
        </div>
      </div>
    </div>
  )
}

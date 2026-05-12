function Bar({ w = 'w-full', h = 'h-3' }: { w?: string; h?: string }) {
  return <div className={`shimmer rounded ${w} ${h}`} />
}

function CardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="shimmer w-9 h-9 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Bar w="w-1/3" h="h-4" />
            <Bar w="w-16" h="h-4" />
            <Bar w="w-16" h="h-4" />
          </div>
          <Bar w="w-1/2" h="h-3" />
          <Bar h="h-3" />
          <Bar w="w-4/5" h="h-3" />
          <Bar w="w-3/5" h="h-3" />
        </div>
        <Bar w="w-12" h="h-3" />
      </div>
    </div>
  )
}

export function SummariesSkeleton() {
  return (
    <div className="space-y-5 max-w-3xl">
      <Bar w="w-32" h="h-7" />
      {/* Filter bar */}
      <div className="flex gap-3">
        <Bar h="h-10" />
        <Bar w="w-32" h="h-10" />
        <Bar w="w-32" h="h-10" />
      </div>
      <Bar w="w-24" h="h-3" />
      <div className="space-y-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}

export function OverviewSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Bar w="w-32" h="h-7" />
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <Bar w="w-2/3" h="h-4" />
        <div className="mt-3">
          <Bar h="h-3" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 space-y-2">
            <Bar w="w-6" h="h-6" />
            <Bar w="w-12" h="h-8" />
            <Bar w="w-16" h="h-3" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Bar w="w-16" h="h-3" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}

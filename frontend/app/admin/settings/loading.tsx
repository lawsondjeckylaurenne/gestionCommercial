import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-64 lg:block">
        <Skeleton className="h-full" />
      </div>
      <div className="flex-1 p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}

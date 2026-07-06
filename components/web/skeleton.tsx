export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`rounded-[20px] bg-card p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] ${className}`}>
    <Skeleton className="mb-4 h-4 w-32" />
    <Skeleton className="h-8 w-48" />
  </div>;
}

export function SkeletonTabla({ filas = 5 }: { filas?: number }) {
  return (
    <div className="rounded-[20px] bg-card p-[6px_22px_10px] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between py-3.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <div className="flex flex-col gap-3 py-3">
        {Array.from({ length: filas }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    </div>
  );
}

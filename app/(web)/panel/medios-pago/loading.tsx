import { Skeleton, SkeletonTabla } from "@/components/web/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <SkeletonTabla filas={6} />
    </div>
  );
}

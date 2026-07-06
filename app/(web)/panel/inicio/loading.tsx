import { Skeleton, SkeletonCard, SkeletonTabla } from "@/components/web/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="grid grid-cols-3 gap-[18px] max-[900px]:grid-cols-1">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <Skeleton className="h-64 w-full rounded-[20px]" />
      <SkeletonTabla filas={4} />
    </div>
  );
}

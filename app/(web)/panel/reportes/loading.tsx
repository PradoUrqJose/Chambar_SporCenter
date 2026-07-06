import { Skeleton, SkeletonCard, SkeletonTabla } from "@/components/web/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-[18px]">
      <Skeleton className="h-12 w-full max-w-md rounded-2xl" />
      <div className="grid grid-cols-3 gap-[18px] max-[900px]:grid-cols-1">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonTabla filas={5} />
    </div>
  );
}

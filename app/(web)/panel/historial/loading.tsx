import { Skeleton, SkeletonTabla } from "@/components/web/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-[18px]">
      <Skeleton className="h-12 w-full max-w-md rounded-2xl" />
      <SkeletonTabla filas={6} />
    </div>
  );
}

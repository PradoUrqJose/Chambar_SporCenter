import { Skeleton, SkeletonTabla } from "@/components/web/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="mb-[6px] flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-48 rounded-full" />
      </div>

      <div className="flex flex-wrap gap-[18px]">
        <Skeleton className="basis-[calc(50%_-_9px)] h-[220px] rounded-[22px] max-[900px]:basis-full" />
        <Skeleton className="basis-[calc(50%_-_9px)] h-[220px] rounded-[20px] max-[900px]:basis-full" />
        <Skeleton className="basis-[220px] h-[220px] rounded-[20px] max-[900px]:basis-full" />
        <div className="min-w-0 basis-[calc(100%_-_238px)] grow max-[900px]:basis-full">
          <SkeletonTabla filas={4} />
        </div>
      </div>
    </div>
  );
}

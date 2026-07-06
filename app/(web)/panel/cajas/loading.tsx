import { SkeletonCard } from "@/components/web/skeleton";

export default function Loading() {
  return (
    <div className="grid grid-cols-3 gap-[18px] max-[1100px]:grid-cols-1">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

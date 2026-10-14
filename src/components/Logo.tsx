import Link from "next/link";

/** PePeTi brand mark: the smiling P mascot with the two-tone wordmark. */
export function Logo({ small }: { small?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2" aria-label="PePeTi home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/pepeti-icon.png" alt="" className={`w-auto mix-blend-multiply transition group-hover:-rotate-6 group-hover:scale-110 ${small ? "h-7" : "h-10"}`} />
      <span className={`font-display font-bold leading-none tracking-tight ${small ? "text-xl" : "text-[1.75rem]"}`}>
        <span className="text-[#0b4fb0]">PePeT</span>
        <span className="text-[#1aa67e]">i</span>
      </span>
    </Link>
  );
}

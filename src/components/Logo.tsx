import Link from "next/link";

/** SlideGenie brand mark: the slides + magic-wand icon with the two-tone wordmark. */
export function Logo({ small }: { small?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2" aria-label="SlideGenie home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/slidegenie-icon.png"
        alt=""
        className={`w-auto mix-blend-multiply transition group-hover:-rotate-3 group-hover:scale-105 ${small ? "h-7" : "h-10"}`}
      />
      <span className={`font-display font-bold leading-none tracking-tight ${small ? "text-xl" : "text-[1.7rem]"}`}>
        <span className="text-ink">Slide</span>
        <span className="text-genie">Genie</span>
      </span>
    </Link>
  );
}

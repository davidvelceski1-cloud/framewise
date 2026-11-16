import Image from "next/image";
import type { MediaImage, StudioMedia } from "@/lib/data/media";
import type { Studio } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Hardware photo that fades into its container from the left (sits on platform-colored gradients). */
export function PlatformPhoto({ image, alt, sizes, className, fit = "cover" }: { image: MediaImage; alt: string; sizes: string; className?: string; fit?: "cover" | "contain" }) {
  return (
    <div className={cn("pointer-events-none", className)} style={{ maskImage: "linear-gradient(90deg, transparent, #000 30%)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 30%)" }}>
      <Image src={image.url} alt={alt} fill sizes={sizes} className={fit === "cover" ? "object-cover object-[center_40%]" : "object-contain drop-shadow-2xl"} />
    </div>
  );
}

/** Attribution line required by the Commons licenses (CC BY / CC BY-SA). */
export function Credit({ image, label = "Photo", className }: { image: MediaImage; label?: string; className?: string }) {
  return (
    <p className={cn("text-[11px] leading-snug text-muted", className)}>
      {image.caption && <>{image.caption}. </>}
      {label}:{" "}
      <a href={image.source} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-ink">
        {image.credit}
      </a>
      , via Wikimedia Commons
    </p>
  );
}

const tile = { md: "h-14 w-14 rounded-2xl", lg: "h-32 w-32 rounded-[28px]" } as const;

/** Studio logo on a light tile; a solo developer's portrait; otherwise the generated monogram. */
export function StudioMark({ studio, media, size = "md" }: { studio: Studio; media?: StudioMedia; size?: "md" | "lg" }) {
  const sizes = size === "lg" ? "128px" : "56px";
  if (media?.logo)
    return (
      <span className={cn("relative block shrink-0 overflow-hidden bg-white shadow-soft ring-1 ring-black/5", tile[size])}>
        <Image src={media.logo.url} alt={`${studio.name} logo`} fill sizes={sizes} className={cn("object-contain", size === "lg" ? "p-4" : "p-2")} />
      </span>
    );
  if (media?.person?.photo)
    return (
      <span className={cn("relative block shrink-0 overflow-hidden", tile[size])}>
        <Image src={media.person.photo.url} alt={media.person.name} fill sizes={sizes} className="object-cover object-top" />
      </span>
    );
  return (
    <span
      className={cn("grid shrink-0 place-items-center font-display font-semibold", tile[size], size === "lg" ? "text-4xl shadow-lift" : "text-[15px]")}
      style={{ background: `linear-gradient(140deg, ${studio.colors[0]}, #0E1116)`, color: studio.colors[1] }}
      aria-label={`${studio.name} monogram`}
    >
      {studio.monogram}
    </span>
  );
}

/** Round portrait with an initials fallback. */
export function PersonPhoto({ name, photo, size }: { name: string; photo?: MediaImage; size: number }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <span className="relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-line text-muted ring-1 ring-black/5" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {photo ? <Image src={photo.url} alt={name} fill sizes={`${size * 2}px`} className="object-cover object-top" /> : <span aria-hidden>{initials}</span>}
    </span>
  );
}

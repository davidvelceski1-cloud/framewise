import Link from "next/link";
import { Logo } from "./navbar";
import { coverCount, coverSources } from "@/lib/data/covers";

const creditLink = "underline underline-offset-2 hover:text-ink";

function CoverCredit() {
  if (coverCount() === 0) return <>Cover art is generated.</>;
  const { igdb, steamgriddb } = coverSources();
  return (
    <>
      Cover art courtesy of{" "}
      {igdb && <a href="https://www.igdb.com" className={creditLink} target="_blank" rel="noreferrer noopener">IGDB.com</a>}
      {igdb && steamgriddb && " and "}
      {steamgriddb && <a href="https://www.steamgriddb.com" className={creditLink} target="_blank" rel="noreferrer noopener">SteamGridDB</a>}
      ; games without a synced cover show generated art.
    </>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 bg-panel">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted">Every game. Every platform. Every frame. A calm, precise reference for how games run across consoles, handhelds and PC.</p>
        </div>
        {[
          { h: "Explore", l: [["Games", "/games"], ["Compare", "/compare"], ["Platforms", "/platforms"], ["Studios", "/studios"]] },
          { h: "Tools", l: [["Can I Run It?", "/can-i-run"], ["AI Assistant", "/assistant"], ["Dashboard", "/dashboard"], ["Admin", "/admin"]] },
          { h: "Account", l: [["Sign in", "/login"], ["Saved builds", "/dashboard"], ["Submit a benchmark", "/dashboard#submit"]] },
        ].map((c) => (
          <div key={c.h}>
            <p className="text-[15px] font-bold">{c.h}</p>
            <ul className="mt-4 space-y-3 text-[13.5px] text-muted">
              {c.l.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-ink hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-[1440px] space-y-2 px-6 py-6 text-[12.5px] leading-relaxed text-muted lg:px-10">
          <p>
            <strong className="font-medium text-ink">Data sources.</strong> Game metadata, credits and release dates are seeded from public information and are designed to be synced from IGDB/RAWG. PC requirements are seeded from publisher store listings. Performance figures marked <em>Demo data</em> are generated for demonstration and are not real measurements; verified figures carry a source link and a ✓ badge.
          </p>
          <p>All trademarks, platform names and game titles belong to their respective owners. FRAMEWISE is an independent reference and is not affiliated with Sony, Microsoft, Nintendo or Valve. <CoverCredit /> Hardware photos, studio logos and portraits come from <a href="https://commons.wikimedia.org" className={creditLink} target="_blank" rel="noreferrer noopener">Wikimedia Commons</a> under their stated licenses (credited where shown); studio leadership is per <a href="https://www.wikidata.org" className={creditLink} target="_blank" rel="noreferrer noopener">Wikidata</a>.</p>
          <p>© FRAMEWISE</p>
        </div>
      </div>
    </footer>
  );
}

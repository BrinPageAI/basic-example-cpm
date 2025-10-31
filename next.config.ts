import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// ==== BRINPAGE CPM (auto) START ====
// Local types (do not break JS projects)
type Rewrite = {
  source: string;
  destination: string;
  basePath?: boolean;
  locale?: false;
  has?: any[];
  missing?: any[];
};
type Rewrites =
  | Rewrite[]
  | { beforeFiles?: Rewrite[]; afterFiles?: Rewrite[]; fallback?: Rewrite[] };

// Apunta SIEMPRE al Cloud (o usa IA_STUDIO_ORIGIN si lo defines)
const SDK = process.env.IA_STUDIO_ORIGIN || "https://cloud.brinpage.com";

// ⚠️ Las rutas públicas del Cloud (App Router) son /api/sdk/* y /api/proxy/*
// Corrige los destinos:
const __brinpageRewrites: Rewrite[] = [
  // SDK (negocio)
  { source: "/api/ask",     destination: `${SDK}/api/sdk/ask` },
  { source: "/api/docs",    destination: `${SDK}/api/sdk/docs` },
  { source: "/api/doc",     destination: `${SDK}/api/sdk/doc` },
  { source: "/api/ingest",  destination: `${SDK}/api/sdk/ingest` },
  { source: "/api/metrics", destination: `${SDK}/api/sdk/metrics` },
  { source: "/api/config",  destination: `${SDK}/api/sdk/config` },
  // Proxy modelos (si los usas desde el front para depurar)
  { source: "/api/proxy/chat",       destination: `${SDK}/api/proxy/chat` },
  { source: "/api/proxy/embeddings", destination: `${SDK}/api/proxy/embeddings` },
];

function __mergeRewrites(existing: Rewrites | undefined): Rewrites {
  if (!existing) return __brinpageRewrites;
  if (Array.isArray(existing)) return [...existing, ...__brinpageRewrites];
  return {
    beforeFiles: existing.beforeFiles ?? [],
    afterFiles:  [ ...(existing.afterFiles ?? []), ...__brinpageRewrites ],
    fallback:    existing.fallback ?? [],
  };
}

try {
  // @ts-ignore
  if (typeof module !== "undefined" && module?.exports) {
    // @ts-ignore
    const base = module.exports;
    if (typeof base?.rewrites === "function") {
      const _old = base.rewrites.bind(base);
      base.rewrites = async () => __mergeRewrites(await _old());
    } else if (base) {
      base.rewrites = async () => __brinpageRewrites;
    }
  }
} catch {}
// ==== BRINPAGE CPM (auto) END ====


export default nextConfig;

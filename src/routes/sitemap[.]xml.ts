import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://pageimportpro.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticEntries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/sobre", changefreq: "monthly", priority: "0.7" },
          { path: "/blog", changefreq: "weekly", priority: "0.8" },
          { path: "/contato", changefreq: "monthly", priority: "0.6" },
          { path: "/suporte", changefreq: "monthly", priority: "0.5" },
          { path: "/suporte-acesso", changefreq: "monthly", priority: "0.4" },
          { path: "/login", changefreq: "yearly", priority: "0.3" },
          { path: "/ativar", changefreq: "yearly", priority: "0.3" },
          { path: "/privacidade", changefreq: "yearly", priority: "0.3" },
          { path: "/termos", changefreq: "yearly", priority: "0.3" },
          { path: "/reembolso", changefreq: "yearly", priority: "0.3" },
        ];

        const dynamicEntries: SitemapEntry[] = [];
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin
            .from("blog_posts" as never)
            .select("slug, updated_at, published")
            .eq("published", true);
          if (Array.isArray(data)) {
            for (const row of data as Array<{ slug?: string; updated_at?: string }>) {
              if (row?.slug) {
                dynamicEntries.push({
                  path: `/blog/${row.slug}`,
                  lastmod: row.updated_at,
                  changefreq: "monthly",
                  priority: "0.6",
                });
              }
            }
          }
        } catch {
          // Blog table may not exist yet; skip dynamic entries.
        }

        const urls = [...staticEntries, ...dynamicEntries].map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

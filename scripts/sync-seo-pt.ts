import { syncSitePageSeoRoutes } from "../lib/seo/sync-routes";
import { db } from "../lib/db";

async function main() {
  await syncSitePageSeoRoutes({ overwriteCopy: true });
  console.log("Synced SitePageSeo with Portuguese title/description.");

  const home = await db.sitePageSeo.findUnique({ where: { path: "/" } });
  console.log("home title:", home?.title);
  console.log("home description:", home?.description?.slice(0, 140));

  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

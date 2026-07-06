export type NavCategoryLink = {
  href: string;
  label: string;
  megaMenu?: boolean;
  highlight?: boolean;
};

export function getNavCategoryLinks(
  t: (key: string) => string
): NavCategoryLink[] {
  return [
    { href: "/products", label: t("nav.shopMenu.allProducts"), megaMenu: true },
    { href: "/builders", label: t("nav.shopMenu.builders"), highlight: true },
    { href: "/bio-gel", label: t("nav.shopMenu.bioGel") },
    { href: "/colours", label: t("nav.shopMenu.colours") },
    { href: "/evo", label: t("nav.shopMenu.evo") },
    { href: "/gemini", label: t("nav.shopMenu.gemini") },
    { href: "/spa", label: t("nav.shopMenu.spa") },
    { href: "/ethos", label: t("nav.shopMenu.ethos") },
    { href: "/bases", label: t("nav.shopMenu.bases") },
    { href: "/training", label: t("nav.training") },
  ];
}

export function getNavShopMenuLinks(
  t: (key: string) => string
): { href: string; label: string }[] {
  return [
    { href: "/products", label: t("nav.shopMenu.allProducts") },
    { href: "/builders", label: t("nav.shopMenu.builders") },
    { href: "/bio-gel", label: t("nav.shopMenu.bioGel") },
    { href: "/colours", label: t("nav.shopMenu.colours") },
    { href: "/evo", label: t("nav.shopMenu.evo") },
    { href: "/gemini", label: t("nav.shopMenu.gemini") },
    { href: "/spa", label: t("nav.shopMenu.spa") },
    { href: "/ethos", label: t("nav.shopMenu.ethos") },
    { href: "/bases", label: t("nav.shopMenu.bases") },
    { href: "/softs", label: t("nav.shopMenu.softs") },
    { href: "/extensao", label: t("nav.shopMenu.extensao") },
    { href: "/eletronicos", label: t("nav.shopMenu.eletronicos") },
    { href: "/promocoes", label: t("nav.shopMenu.promocoes") },
    { href: "/solventes", label: t("nav.shopMenu.solventes") },
    { href: "/nail-art", label: t("nav.shopMenu.nailArt") },
    { href: "/tips", label: t("nav.shopMenu.tips") },
    { href: "/utensilios", label: t("nav.shopMenu.utensilios") },
    { href: "/pinceis", label: t("nav.shopMenu.pinceis") },
    { href: "/lima-buffs", label: t("nav.shopMenu.limaBuffs") },
  ];
}

export type NavLearnLink = {
  href: string;
  label: string;
  external?: boolean;
};

export function getNavLearnLinks(t: (key: string) => string): NavLearnLink[] {
  return [
    { href: "/about", label: t("nav.about") },
    { href: "/training", label: t("nav.training") },
    {
      href: "https://formacaobiosculpture.com/login",
      label: t("nav.aboutMenu.trainingPortal"),
      external: true,
    },
    { href: "/blog", label: t("nav.aboutMenu.blog") },
    { href: "/find-your-salon", label: t("nav.aboutMenu.findSalon") },
    { href: "/contact", label: t("nav.aboutMenu.contact") },
  ];
}

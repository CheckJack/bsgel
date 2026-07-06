export type ColourTone = {
  id: string;
  labelKey: string;
  href: string;
  showcasingSection: string;
  swatch: string;
  sparkle?: boolean;
};

export const COLOUR_TONES: ColourTone[] = [
  {
    id: "reds",
    labelKey: "nav.shopMenu.redsBrowns",
    href: "/colours/reds-browns",
    showcasingSection: "reds",
    swatch: "#8B1E1E",
  },
  {
    id: "oranges",
    labelKey: "nav.shopMenu.orangesYellows",
    href: "/colours/oranges-yellows",
    showcasingSection: "oranges",
    swatch: "#E87A2E",
  },
  {
    id: "brights",
    labelKey: "nav.shopMenu.brights",
    href: "/colours/brights",
    showcasingSection: "brights",
    swatch: "#FF3CAC",
    sparkle: true,
  },
  {
    id: "fluorescents",
    labelKey: "nav.shopMenu.fluorescents",
    href: "/colours/fluorescents",
    showcasingSection: "fluorescents",
    swatch: "#CCFF00",
  },
  {
    id: "blues-greens",
    labelKey: "nav.shopMenu.bluesGreens",
    href: "/colours/blues-greens",
    showcasingSection: "blues-greens",
    swatch: "#2E6B8A",
  },
  {
    id: "pinks",
    labelKey: "nav.shopMenu.pinksPurples",
    href: "/colours/pinks-purples",
    showcasingSection: "pinks",
    swatch: "#D4568A",
  },
  {
    id: "nudes",
    labelKey: "nav.shopMenu.whitesNudes",
    href: "/colours/whites-nudes",
    showcasingSection: "nudes",
    swatch: "#E8D5C4",
  },
];

export const COLOUR_TONE_SECTIONS = COLOUR_TONES.map((tone) => tone.showcasingSection);

export function getColourToneForProduct(showcasingSections: string[] | undefined) {
  if (!showcasingSections?.length) return undefined;
  return COLOUR_TONES.find((tone) => showcasingSections.includes(tone.showcasingSection));
}

export function getColourToneById(id: string) {
  return COLOUR_TONES.find((tone) => tone.id === id);
}

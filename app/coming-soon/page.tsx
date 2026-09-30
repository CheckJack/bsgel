import type { Metadata } from "next";
import { ComingSoonClient } from "./coming-soon-client";

export const metadata: Metadata = {
  title: "Em breve | Bio Sculpture",
  description: "Bio Sculpture Portugal — em breve.",
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return <ComingSoonClient />;
}

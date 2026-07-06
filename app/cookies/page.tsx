"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

export default function CookiesPolicyPage() {
  const { t } = useLanguage();

  const sections = [
    { title: t("cookies.policy.s1Title"), body: t("cookies.policy.s1Body") },
    { title: t("cookies.policy.s2Title"), body: t("cookies.policy.s2Body") },
    { title: t("cookies.policy.s3Title"), body: t("cookies.policy.s3Body") },
    { title: t("cookies.policy.s4Title"), body: t("cookies.policy.s4Body") },
    { title: t("cookies.policy.s5Title"), body: t("cookies.policy.s5Body") },
    { title: t("cookies.policy.s6Title"), body: t("cookies.policy.s6Body") },
  ];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
      <h1 className="mb-4 text-3xl font-bold text-brand-black md:text-4xl">
        {t("cookies.policy.pageTitle")}
      </h1>
      <p className="mb-8 text-lg text-gray-600">{t("cookies.policy.intro")}</p>

      <div className="prose prose-slate max-w-none space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 text-xl font-semibold text-brand-black">{section.title}</h2>
            <p className="whitespace-pre-line text-gray-700 leading-relaxed">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-12 text-sm text-gray-600">
        {t("cookies.policy.contactNote")}{" "}
        <a href="mailto:info@biosculpture.pt" className="font-medium text-brand-black underline">
          info@biosculpture.pt
        </a>
        .{" "}
        <Link href="/privacy" className="font-medium text-brand-black underline">
          {t("footer.privacyPolicy")}
        </Link>
      </p>
    </div>
  );
}

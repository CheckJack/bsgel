"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { termsOfSaleContent } from "@/lib/legal/terms-of-sale-content";

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="my-4 list-disc space-y-2 pl-5 text-gray-700 leading-relaxed">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function LinkedText({ text }: { text: string }) {
  const parts = text.split(
    /(info@biosculpture\.pt|\+351 935172295|livroreclamacoes\.pt|Privacy Policy|Cookie Policy|Política de Privacidade|Política de Cookies)/g
  );

  return (
    <>
      {parts.map((part, index) => {
        if (part === "info@biosculpture.pt") {
          return (
            <a
              key={`${part}-${index}`}
              href="mailto:info@biosculpture.pt"
              className="underline underline-offset-2"
            >
              {part}
            </a>
          );
        }
        if (part === "+351 935172295") {
          return (
            <a
              key={`${part}-${index}`}
              href="tel:+351935172295"
              className="underline underline-offset-2"
            >
              {part}
            </a>
          );
        }
        if (part === "livroreclamacoes.pt") {
          return (
            <a
              key={`${part}-${index}`}
              href="https://www.livroreclamacoes.pt/Inicio/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {part}
            </a>
          );
        }
        if (part === "Privacy Policy" || part === "Política de Privacidade") {
          return (
            <Link
              key={`${part}-${index}`}
              href="/privacy"
              className="underline underline-offset-2"
            >
              {part}
            </Link>
          );
        }
        if (part === "Cookie Policy" || part === "Política de Cookies") {
          return (
            <Link
              key={`${part}-${index}`}
              href="/cookies"
              className="underline underline-offset-2"
            >
              {part}
            </Link>
          );
        }
        return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
      })}
    </>
  );
}

export default function TermsAndReturnsPage() {
  const { language } = useLanguage();
  const content = termsOfSaleContent[language === "en" ? "en" : "pt"];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
      <h1 className="mb-3 text-3xl font-bold text-brand-black md:text-4xl">
        {content.pageTitle}
      </h1>
      <p className="mb-2 text-sm text-gray-600">
        {content.effectiveDateLabel}: {content.effectiveDate}
      </p>
      <p className="mb-10 text-sm text-gray-600">
        {content.lastUpdatedLabel}: {content.lastUpdated}
      </p>

      <div className="prose prose-slate max-w-none space-y-10">
        {content.sections.map((section) => (
          <section key={section.title} id={section.id}>
            <h2 className="mb-4 text-xl font-semibold text-brand-black">{section.title}</h2>

            {section.paragraphs?.map((paragraph, index) => (
              <p
                key={`${section.title}-p-${index}`}
                className={`${index > 0 ? "mt-4 " : ""}text-gray-700 leading-relaxed`}
              >
                <LinkedText text={paragraph} />
              </p>
            ))}

            {section.definitionList ? (
              <ul className="my-4 list-none space-y-2 pl-0 text-gray-700 leading-relaxed">
                {section.definitionList.map((item) => (
                  <li key={item.label}>
                    <strong className="text-brand-black">{item.label}:</strong>{" "}
                    {item.href ? (
                      <a href={item.href} className="underline underline-offset-2">
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )}
                  </li>
                ))}
              </ul>
            ) : null}

            {section.bullets ? <BulletList items={section.bullets} /> : null}

            {section.afterBullets?.map((paragraph, index) => (
              <p
                key={`${section.title}-ab-${index}`}
                className={`${index > 0 ? "mt-4 " : ""}text-gray-700 leading-relaxed`}
              >
                <LinkedText text={paragraph} />
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

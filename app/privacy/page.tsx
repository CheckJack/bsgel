"use client";

import { Fragment } from "react";
import { useLanguage } from "@/contexts/language-context";
import {
  privacyPolicyContent,
  type PrivacyTable,
} from "@/lib/legal/privacy-policy-content";

function PolicyTable({ headers, rows }: PrivacyTable) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-black/10">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead className="bg-[#f7f4f1]">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="border-b border-black/10 px-4 py-3 font-semibold text-brand-black"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="align-top odd:bg-white even:bg-[#faf9f8]">
              {row.map((cell, index) => (
                <td
                  key={`${row[0]}-${index}`}
                  className="border-b border-black/5 px-4 py-3 text-gray-700 leading-relaxed"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
  const parts = text.split(/(info@biosculpture\.pt|\+351 935172295)/g);

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
        return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
      })}
    </>
  );
}

export default function PrivacyPolicyPage() {
  const { language, t } = useLanguage();
  const content = privacyPolicyContent[language === "en" ? "en" : "pt"];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
      <h1 className="mb-3 text-3xl font-bold text-brand-black md:text-4xl">
        {t("footer.privacyPolicy")}
      </h1>
      <p className="mb-2 text-sm text-gray-600">
        {content.effectiveDateLabel}: {content.effectiveDate}
      </p>
      <p className="mb-10 text-sm text-gray-600">
        {content.lastUpdatedLabel}: {content.lastUpdated}
      </p>

      <div className="prose prose-slate max-w-none space-y-10">
        {content.sections.map((section) => (
          <section key={section.title}>
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

            {section.table ? <PolicyTable {...section.table} /> : null}

            {section.afterTable?.map((paragraph, index) => (
              <p
                key={`${section.title}-at-${index}`}
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

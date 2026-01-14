"use client";

import { HeroSlider } from "@/components/layout/hero-slider";
import { useLanguage } from "@/contexts/language-context";

export default function ContactPage() {
  const { t } = useLanguage();

  const slides = [
    {
      type: "image" as const,
      src: "/123_Tracey_Wide - Copy.jpg",
      title: t("contact.title"),
      description: t("contact.description"),
    },
  ];

  return (
    <>
      <HeroSlider slides={slides} autoPlayInterval={5000} className="h-[400px]" />
      <div className="min-h-screen bg-brand-white flex flex-col">

      {/* Contact Information Section */}
      <section className="flex-1 flex items-center py-16 sm:py-20 md:py-32 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl w-full">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium mb-4 sm:mb-6 text-brand-black">{t("contact.sendUsMessage")}</h2>
              <div className="w-24 h-1 bg-brand-champagne mb-6 sm:mb-8"></div>
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-brand-black mb-2">
                    {t("contact.name")} *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-champagne focus:border-brand-champagne outline-none font-light"
                    placeholder={t("contact.namePlaceholder")}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-brand-black mb-2">
                    {t("contact.email")} *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-champagne focus:border-brand-champagne outline-none font-light"
                    placeholder={t("contact.emailPlaceholder")}
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-brand-black mb-2">
                    {t("contact.subject")} *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-champagne focus:border-brand-champagne outline-none font-light"
                    placeholder={t("contact.subjectPlaceholder")}
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-brand-black mb-2">
                    {t("contact.message")} *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-champagne focus:border-brand-champagne outline-none font-light resize-none"
                    placeholder={t("contact.messagePlaceholder")}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full px-8 py-3 bg-brand-black text-brand-white hover:bg-brand-champagne transition-colors font-medium rounded-lg"
                >
                  {t("contact.sendMessage")}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium mb-4 sm:mb-6 text-brand-black">{t("contact.getInTouch")}</h2>
              <div className="w-24 h-1 bg-brand-champagne mb-6 sm:mb-8"></div>
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 text-brand-black">{t("contact.generalInquiries")}</h3>
                  <p className="text-sm sm:text-base font-light text-brand-champagne leading-relaxed">
                    {t("contact.generalInquiriesDesc")}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 text-brand-black">{t("contact.customerSupport")}</h3>
                  <p className="text-sm sm:text-base font-light text-brand-champagne leading-relaxed mb-2">
                    <strong className="text-brand-black">{t("contact.emailLabel")}</strong> support@biosculpture.com
                  </p>
                  <p className="text-sm sm:text-base font-light text-brand-champagne leading-relaxed mb-2">
                    <strong className="text-brand-black">{t("contact.phone")}</strong> +1 (555) 123-4567
                  </p>
                  <p className="text-sm sm:text-base font-light text-brand-champagne leading-relaxed">
                    <strong className="text-brand-black">{t("contact.hours")}</strong> {t("contact.hoursValue")}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 text-brand-black">{t("contact.trainingEducation")}</h3>
                  <p className="text-sm sm:text-base font-light text-brand-champagne leading-relaxed">
                    {t("contact.trainingEducationDesc")}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 text-brand-black">{t("contact.findASalon")}</h3>
                  <p className="text-sm sm:text-base font-light text-brand-champagne leading-relaxed mb-4">
                    {t("contact.findASalonDesc")}
                  </p>
                  <a
                    href="/salons"
                    className="inline-block px-5 sm:px-6 py-2 bg-brand-black text-brand-white hover:bg-brand-champagne transition-colors font-medium rounded text-sm sm:text-base"
                  >
                    {t("contact.findASalon")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}


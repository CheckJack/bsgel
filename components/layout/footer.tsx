"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Send,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

const linkClass =
  "text-sm text-brand-black/70 transition-colors hover:text-brand-champagne-dark";

export function Footer() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "success" | "error">("idle");

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);
    setSubscribeStatus("idle");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubscribeStatus("success");
      setEmail("");
    } catch {
      setSubscribeStatus("error");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="mt-auto border-t border-black/10 bg-brand-white text-brand-black">
      <div className="w-full px-4 py-8 sm:px-6 sm:py-12 md:px-12 lg:px-16 lg:py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 md:grid-cols-3 lg:grid-cols-6 lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="mb-4 inline-block">
              <Image
                src="/bio-sculpture-black.png"
                alt="Bio Sculpture"
                width={7442}
                height={756}
                sizes="(max-width: 640px) 240px, 280px"
                className="h-auto w-[180px] max-w-full object-contain xs:w-[220px] sm:w-[280px]"
              />
            </Link>
            <p className="mb-6 text-sm leading-relaxed text-brand-black/70">
              {t("footer.description")}
            </p>

            <div className="mb-6">
              <h4 className="mb-3 text-base font-medium text-brand-black">
                {t("footer.stayConnected")}
              </h4>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("footer.yourEmail")}
                  required
                  className="flex-1 rounded-md border border-black/15 bg-brand-white px-3 py-2 text-sm text-brand-black placeholder:text-brand-black/40 focus:border-brand-champagne focus:outline-none focus:ring-2 focus:ring-brand-champagne/30"
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="rounded-md bg-brand-champagne px-4 py-2 text-brand-white transition-colors hover:bg-brand-champagne-dark disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={t("footer.subscribeToNewsletter")}
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              {subscribeStatus === "success" && (
                <p className="mt-2 text-xs text-brand-black/70">
                  {t("footer.thankYouForSubscribing")}
                </p>
              )}
              {subscribeStatus === "error" && (
                <p className="mt-2 text-xs text-red-600">{t("footer.somethingWentWrong")}</p>
              )}
            </div>

            <div>
              <h4 className="mb-3 text-base font-medium text-brand-black">
                {t("footer.followUs")}
              </h4>
              <div className="flex gap-3">
                {[
                  { href: "https://facebook.com/biosculpture", label: "Facebook", Icon: Facebook },
                  { href: "https://instagram.com/biosculpture", label: "Instagram", Icon: Instagram },
                  { href: "https://twitter.com/biosculpture", label: "Twitter", Icon: Twitter },
                  { href: "https://youtube.com/biosculpture", label: "YouTube", Icon: Youtube },
                ].map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-black/[0.03] text-brand-black transition-colors hover:border-black/20 hover:bg-black/[0.06]"
                    aria-label={label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-base font-medium text-brand-black">{t("footer.shop")}</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/bio-gel" className={linkClass}>
                  Biogel
                </Link>
              </li>
              <li>
                <Link href="/evo" className={linkClass}>
                  Evo
                </Link>
              </li>
              <li>
                <Link href="/ethos" className={linkClass}>
                  Cuidados das unhas
                </Link>
              </li>
              <li>
                <Link href="/gemini" className={linkClass}>
                  Verniz Clássico
                </Link>
              </li>
              <li>
                <Link href="/spa" className={linkClass}>
                  Spa
                </Link>
              </li>
              <li>
                <Link href="/products" className={linkClass}>
                  {t("footer.allProducts")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-base font-medium text-brand-black">{t("footer.resources")}</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/salons" className={linkClass}>
                  {t("footer.findASalon")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className={linkClass}>
                  {t("footer.blog")}
                </Link>
              </li>
              <li>
                <Link href="/training" className={linkClass}>
                  {t("footer.training")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-base font-medium text-brand-black">{t("footer.company")}</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className={linkClass}>
                  {t("footer.aboutUs")}
                </Link>
              </li>
              <li>
                <Link href="/about/biosculpture/philosophy" className={linkClass}>
                  {t("footer.philosophy")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  {t("footer.contact")}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className={linkClass}>
                  {t("footer.myAccount")}
                </Link>
              </li>
              <li>
                <Link href="/orders" className={linkClass}>
                  {t("footer.orders")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-base font-medium text-brand-black">{t("footer.getInTouch")}</h3>
            <ul className="mb-6 space-y-3">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-black/50" />
                <a href="mailto:info@biosculpture.pt" className={linkClass}>
                  info@biosculpture.pt
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-black/50" />
                <a href="tel:+351935172295" className={linkClass}>
                  +351 935 172 295{" "}
                  <span className="text-brand-black/50">(rede móvel nacional)</span>
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-black/50" />
                <span className="text-sm text-brand-black/70">Bio Sculpture Portugal</span>
              </li>
            </ul>

            <h4 className="mb-3 text-base font-medium text-brand-black">{t("footer.legal")}</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/privacy" className={linkClass}>
                  {t("footer.privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className={linkClass}>
                  {t("footer.cookiePolicy")}
                </Link>
              </li>
              <li>
                <Link href="/terms-and-returns" className={linkClass}>
                  {t("footer.termsAndReturns")}
                </Link>
              </li>
              <li>
                <Link href="/consumer-dispute-resolution" className={linkClass}>
                  {t("footer.consumerDisputeResolution")}
                </Link>
              </li>
              <li>
                <Link href="/complaints-book" className={linkClass}>
                  {t("footer.complaintsBook")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-black/10">
        <div className="w-full px-4 py-4 sm:px-6 sm:py-6 md:px-12 lg:px-16">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
            <p className="text-center text-sm text-brand-black/60 sm:text-left">
              &copy; {new Date().getFullYear()} Bio Sculpture. {t("footer.allRightsReserved")}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="mr-1 text-xs text-brand-black/50 sm:mr-2">{t("footer.weAccept")}</span>
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                {[
                  { src: "/visa-65d650f7.svg", alt: "Visa" },
                  { src: "/master-54b5a7ce.svg", alt: "Mastercard" },
                  { src: "/maestro-61c41725.svg", alt: "Maestro" },
                  { src: "/paypal-a7c68b85.svg", alt: "PayPal" },
                  { src: "/google_pay-34c30515 (1).svg", alt: "Google Pay" },
                  { src: "/apple_pay-1721ebad (1).svg", alt: "Apple Pay" },
                ].map((payment) => (
                  <div
                    key={payment.alt}
                    className="rounded border border-black/10 bg-white px-1.5 py-1"
                  >
                    <Image
                      src={payment.src}
                      alt={payment.alt}
                      width={32}
                      height={20}
                      className="h-4 w-auto"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

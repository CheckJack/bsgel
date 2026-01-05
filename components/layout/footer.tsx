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
  Send
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

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
      // TODO: Implement newsletter subscription API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubscribeStatus("success");
      setEmail("");
    } catch (error) {
      setSubscribeStatus("error");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-black text-white mt-auto">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo.png"
                alt="Bio Sculpture"
                width={160}
                height={40}
                className="h-10 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-white/90 text-sm leading-relaxed mb-6">
              {t("footer.description")}
            </p>
            
            {/* Newsletter */}
            <div className="mb-6">
              <h4 className="font-medium text-base mb-3">{t("footer.stayConnected")}</h4>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("footer.yourEmail")}
                  required
                  className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-md 
                           text-white placeholder:text-white/60 focus:outline-none focus:ring-2 
                           focus:ring-white/40 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="px-4 py-2 bg-white text-[#857D71] rounded-md hover:bg-white/90 
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t("footer.subscribeToNewsletter")}
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              {subscribeStatus === "success" && (
                <p className="text-xs text-white/90 mt-2">{t("footer.thankYouForSubscribing")}</p>
              )}
              {subscribeStatus === "error" && (
                <p className="text-xs text-red-300 mt-2">{t("footer.somethingWentWrong")}</p>
              )}
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-medium text-base mb-3">{t("footer.followUs")}</h4>
              <div className="flex gap-3">
                <a
                  href="https://facebook.com/biosculpture"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center 
                           justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="https://instagram.com/biosculpture"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center 
                           justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://twitter.com/biosculpture"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center 
                           justify-center transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="https://youtube.com/biosculpture"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center 
                           justify-center transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Shop Section */}
          <div>
            <h3 className="font-medium text-base mb-4">{t("footer.shop")}</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/bio-gel" className="text-sm text-white/90 hover:text-white transition-colors">
                  Bio Gel
                </Link>
              </li>
              <li>
                <Link href="/evo" className="text-sm text-white/90 hover:text-white transition-colors">
                  Evo
                </Link>
              </li>
              <li>
                <Link href="/ethos" className="text-sm text-white/90 hover:text-white transition-colors">
                  Ethos
                </Link>
              </li>
              <li>
                <Link href="/gemini" className="text-sm text-white/90 hover:text-white transition-colors">
                  Gemini
                </Link>
              </li>
              <li>
                <Link href="/spa" className="text-sm text-white/90 hover:text-white transition-colors">
                  Spa
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-sm text-white/90 hover:text-white transition-colors">
                  {t("footer.allProducts")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="font-medium text-base mb-4">{t("footer.resources")}</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/diagnosis" className="text-sm text-white/90 hover:text-white transition-colors">
                  {t("footer.nailDiagnosis")}
                </Link>
              </li>
              <li>
                <Link href="/salons" className="text-sm text-white/90 hover:text-white transition-colors">
                  {t("footer.findASalon")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-white/90 hover:text-white transition-colors">
                  {t("footer.blog")}
                </Link>
              </li>
              <li>
                <Link href="/about/biosculpture/training" className="text-sm text-white/90 hover:text-white transition-colors">
                  {t("footer.training")}
                </Link>
              </li>
              <li>
                <Link href="/about/biosculpture/certifications" className="text-sm text-white/90 hover:text-white transition-colors">
                  {t("footer.certifications")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="font-medium text-base mb-4">{t("footer.company")}</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="text-sm text-white/90 hover:text-white transition-colors">
                  {t("footer.aboutUs")}
                </Link>
              </li>
              <li>
                <Link href="/about/biosculpture/philosophy" className="text-sm text-white/90 hover:text-white transition-colors">
                  {t("footer.philosophy")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-white/90 hover:text-white transition-colors">
                  {t("footer.contact")}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-white/90 hover:text-white transition-colors">
                  {t("footer.myAccount")}
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-sm text-white/90 hover:text-white transition-colors">
                  {t("footer.orders")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Legal Section */}
          <div>
            <h3 className="font-medium text-base mb-4">{t("footer.getInTouch")}</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <a 
                  href="mailto:info@biosculpture.com" 
                  className="text-sm text-white/90 hover:text-white transition-colors"
                >
                  info@biosculpture.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <a 
                  href="tel:+15551234567" 
                  className="text-sm text-white/90 hover:text-white transition-colors"
                >
                  (555) 123-4567
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/90">
                  Bio Sculpture USA
                </span>
              </li>
            </ul>

            <h4 className="font-medium text-base mb-3">{t("footer.legal")}</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/privacy" className="text-sm text-white/90 hover:text-white transition-colors">
                  {t("footer.privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-white/90 hover:text-white transition-colors">
                  {t("footer.termsOfService")}
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-sm text-white/90 hover:text-white transition-colors">
                  {t("footer.shippingPolicy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-sm text-white/80 text-center md:text-left">
              &copy; {new Date().getFullYear()} Bio Sculpture. {t("footer.allRightsReserved")}
            </p>

            {/* Payment Methods */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-white/70 mr-2">{t("footer.weAccept")}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="bg-white rounded px-1.5 py-1">
                  <Image
                    src="/visa-65d650f7.svg"
                    alt="Visa"
                    width={32}
                    height={20}
                    className="h-4 w-auto"
                    unoptimized
                    priority={false}
                  />
                </div>
                <div className="bg-white rounded px-1.5 py-1">
                  <Image
                    src="/master-54b5a7ce.svg"
                    alt="Mastercard"
                    width={32}
                    height={20}
                    className="h-4 w-auto"
                    unoptimized
                    priority={false}
                  />
                </div>
                <div className="bg-white rounded px-1.5 py-1">
                  <Image
                    src="/maestro-61c41725.svg"
                    alt="Maestro"
                    width={32}
                    height={20}
                    className="h-4 w-auto"
                    unoptimized
                    priority={false}
                  />
                </div>
                <div className="bg-white rounded px-1.5 py-1">
                  <Image
                    src="/paypal-a7c68b85.svg"
                    alt="PayPal"
                    width={32}
                    height={20}
                    className="h-4 w-auto"
                    unoptimized
                    priority={false}
                  />
                </div>
                <div className="bg-white rounded px-1.5 py-1">
                  <Image
                    src="/google_pay-34c30515 (1).svg"
                    alt="Google Pay"
                    width={32}
                    height={20}
                    className="h-4 w-auto"
                    unoptimized
                    priority={false}
                  />
                </div>
                <div className="bg-white rounded px-1.5 py-1">
                  <Image
                    src="/apple_pay-1721ebad (1).svg"
                    alt="Apple Pay"
                    width={32}
                    height={20}
                    className="h-4 w-auto"
                    unoptimized
                    priority={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


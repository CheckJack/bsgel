"use client";

import { HeroSlider } from "@/components/layout/hero-slider";

export default function ContactPage() {
  const slides = [
    {
      type: "image" as const,
      src: "/123_Tracey_Wide - Copy.jpg",
      title: "Contact Us",
      description: "We'd love to hear from you. Get in touch with our team today.",
    },
  ];

  return (
    <>
      <HeroSlider slides={slides} autoPlayInterval={5000} className="h-[400px]" />
      <div className="min-h-screen bg-brand-white">

      {/* Contact Information Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium mb-4 sm:mb-6 text-brand-black">Send us a Message</h2>
              <div className="w-24 h-1 bg-brand-champagne mb-6 sm:mb-8"></div>
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-brand-black mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-champagne focus:border-brand-champagne outline-none font-light"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-brand-black mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-champagne focus:border-brand-champagne outline-none font-light"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-brand-black mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-champagne focus:border-brand-champagne outline-none font-light"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-brand-black mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-champagne focus:border-brand-champagne outline-none font-light resize-none"
                    placeholder="Tell us more about your inquiry..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full px-8 py-3 bg-brand-black text-brand-white hover:bg-brand-champagne transition-colors font-medium rounded-lg"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium mb-4 sm:mb-6 text-brand-black">Get in Touch</h2>
              <div className="w-24 h-1 bg-brand-champagne mb-6 sm:mb-8"></div>
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 text-brand-black">General Inquiries</h3>
                  <p className="text-sm sm:text-base font-light text-brand-champagne leading-relaxed">
                    For general questions about our products, services, or training programs, 
                    please fill out the contact form or reach out using the information below.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 text-brand-black">Customer Support</h3>
                  <p className="text-sm sm:text-base font-light text-brand-champagne leading-relaxed mb-2">
                    <strong className="text-brand-black">Email:</strong> support@biosculpture.com
                  </p>
                  <p className="text-sm sm:text-base font-light text-brand-champagne leading-relaxed mb-2">
                    <strong className="text-brand-black">Phone:</strong> +1 (555) 123-4567
                  </p>
                  <p className="text-sm sm:text-base font-light text-brand-champagne leading-relaxed">
                    <strong className="text-brand-black">Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM EST
                  </p>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 text-brand-black">Training & Education</h3>
                  <p className="text-sm sm:text-base font-light text-brand-champagne leading-relaxed">
                    Interested in our professional training programs? Contact our education team 
                    to learn more about certification courses and workshops.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 text-brand-black">Find a Salon</h3>
                  <p className="text-sm sm:text-base font-light text-brand-champagne leading-relaxed mb-4">
                    Looking for a Bio Sculpture salon near you? Use our salon locator to find 
                    certified professionals in your area.
                  </p>
                  <a
                    href="/salons"
                    className="inline-block px-5 sm:px-6 py-2 bg-brand-black text-brand-white hover:bg-brand-champagne transition-colors font-medium rounded text-sm sm:text-base"
                  >
                    Find a Salon
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Resources Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-brand-sweet-bianca">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium mb-3 sm:mb-4 text-brand-black">Additional Resources</h2>
            <div className="w-24 h-1 bg-brand-champagne mx-auto"></div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <a
              href="/products"
              className="bg-brand-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <h3 className="text-xl font-medium mb-2 text-brand-black">Browse Products</h3>
              <p className="font-light text-brand-champagne text-sm">
                Explore our complete range of premium nail care products
              </p>
            </a>
            <a
              href="/about"
              className="bg-brand-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <h3 className="text-xl font-medium mb-2 text-brand-black">About Us</h3>
              <p className="font-light text-brand-champagne text-sm">
                Learn more about our mission, values, and commitment
              </p>
            </a>
            <a
              href="/diagnosis"
              className="bg-brand-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <h3 className="text-xl font-medium mb-2 text-brand-black">Nail Diagnosis</h3>
              <p className="font-light text-brand-champagne text-sm">
                Use our tool to diagnose and understand nail conditions
              </p>
            </a>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}


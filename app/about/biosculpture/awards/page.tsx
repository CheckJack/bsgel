"use client";

import { Trophy, Shield, Star } from "lucide-react";
import Image from "next/image";

export default function AwardsPage() {
  return (
    <div className="bg-brand-white">

      {/* Magazine Cover - Hero */}
      <section className="min-h-screen flex items-end pb-20 pt-32">
        <div className="container mx-auto px-8 max-w-7xl w-full">
          <div className="grid lg:grid-cols-12 gap-16 items-end">
            
            {/* Title Side */}
            <div className="lg:col-span-7 space-y-12">
              <div className="space-y-8">
                <div className="text-xs uppercase tracking-[1em] text-brand-champagne">
                  Issue No. 01 — 2024
                </div>
                
                <h1 className="text-[10rem] md:text-[14rem] lg:text-[18rem] font-extralight leading-[0.8] tracking-tighter text-brand-black">
                  AWARDS
                </h1>

                <div className="max-w-md">
                  <p className="text-xl font-light text-brand-black/60 leading-relaxed">
                    A celebration of three decades of excellence, innovation, 
                    and recognition in the art of nail care
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8 pt-8">
                <div className="text-7xl font-extralight text-brand-champagne">9</div>
                <div className="h-16 w-px bg-brand-champagne/30"></div>
                <div>
                  <div className="text-sm uppercase tracking-wider text-brand-black">Years</div>
                  <div className="text-xs text-brand-champagne/60">Consecutive</div>
                </div>
              </div>
            </div>

            {/* Stats Sidebar */}
            <div className="lg:col-span-5 space-y-8">
              <div className="pt-8 space-y-6">
                {[
                  { label: 'Safety Rating', value: '5★' },
                  { label: 'Countries', value: '40+' },
                  { label: 'Major Awards', value: '20+' }
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-baseline border-b border-brand-champagne/10 pb-4">
                    <span className="text-sm uppercase tracking-wider text-brand-black/60">{stat.label}</span>
                    <span className="text-4xl font-extralight text-brand-champagne">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Magazine Spread 01 - Featured Image */}
      <section className="py-20">
        <div className="container mx-auto px-8 max-w-7xl">
          
          {/* Page Number */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-xs uppercase tracking-[0.5em] text-brand-champagne/40">Salon Magazine</div>
            <div className="text-xs text-brand-black/40">01</div>
          </div>

          <div className="grid lg:grid-cols-3 gap-16">
            
            {/* Image - 2/3 width */}
            <div className="lg:col-span-2">
              <div className="aspect-[4/3] relative bg-brand-sweet-bianca">
                <Image 
                  src="/8.png" 
                  alt="Salon Magazine Winner 2024" 
                  fill 
                  className="object-cover"
                  priority
                />
              </div>
              
              {/* Caption */}
              <div className="mt-6 text-xs uppercase tracking-wider text-brand-black/40">
                Bio Sculpture BIOGEL — 2024 Readers&apos; Choice Award Winner
              </div>
            </div>

            {/* Editorial Text - 1/3 width */}
            <div className="space-y-8 lg:pt-16">
              <div className="space-y-4">
                <h2 className="text-4xl font-light text-brand-black leading-tight">
                  Nine Years<br/>of Excellence
                </h2>
                <div className="w-12 h-px bg-brand-champagne"></div>
              </div>

              <div className="space-y-6 text-base text-brand-black/60 leading-relaxed">
                <p>
                  From 2016 through 2024, Bio Sculpture Base Gel has maintained 
                  an unprecedented winning streak.
                </p>
                
                <p className="text-brand-champagne font-medium">
                  &quot;An achievement that demonstrates unwavering professional trust 
                  and consistent quality.&quot;
                </p>

                <div className="pt-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-4 h-4 text-brand-champagne" />
                    <span className="text-sm">Nail Enhancement Category</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="w-4 h-4 text-brand-champagne fill-brand-champagne" />
                    <span className="text-sm">Readers&apos; Choice Winner</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Spread */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-8 max-w-7xl">
          
          {/* Page Header */}
          <div className="flex justify-between items-center mb-16">
            <div className="text-xs uppercase tracking-[0.5em] text-white/40">Timeline</div>
            <div className="text-xs text-white/40">02</div>
          </div>

          <div className="space-y-16">
            <div className="text-center space-y-8">
              <div className="text-8xl font-extralight text-white/30">2016 — 2024</div>
              <div className="flex justify-center gap-2">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-white"></div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-9 gap-4 max-w-5xl mx-auto">
              {['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'].map((year) => (
                <div key={year} className="aspect-square border border-white/30 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300">
                  <div className="text-sm font-light text-white">{year}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase - Simple Grid */}
      <section className="py-32">
        <div className="container mx-auto px-8 max-w-7xl">
          <div className="text-center mb-20 space-y-6">
            <h2 className="text-5xl font-extralight text-brand-black">Award-Winning Products</h2>
            <div className="w-16 h-px bg-brand-champagne mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { img: '/6.png', title: 'HP Gel Nail Art Kit', award: 'Nails Magazine 2018', cat: 'Favourite New Product' },
              { img: '/7.png', title: 'Black & Blue Teardrop', award: 'Nails Magazine 2018', cat: 'Favourite File' },
              { img: '/9.png', title: 'Ethos Lavender Base', award: 'Woman&Home 2023', cat: 'Holy Grail' },
              { img: '/10.png', title: 'Hand Cream', award: 'Woman&Home 2023', cat: 'Holy Grail' },
              { img: '/12.png', title: 'Mirror Top Coat', award: 'Woman&Home 2024', cat: 'Holy Grail' },
              { img: '/13.png', title: 'Vitamin Dose', award: 'Woman&Home 2024', cat: 'Holy Grail' }
            ].map((item, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-square relative bg-brand-white border border-brand-champagne/10">
                  <Image src={item.img} alt={item.title} fill className="object-contain p-8" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium text-brand-black">{item.title}</h3>
                  <p className="text-sm text-brand-champagne">{item.award}</p>
                  <p className="text-xs uppercase tracking-wider text-brand-black/40">{item.cat}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety - Centered */}
      <section className="py-32 bg-brand-sweet-bianca">
        <div className="container mx-auto px-8 max-w-4xl text-center space-y-12">
          <Shield className="w-16 h-16 text-brand-champagne mx-auto" />
          <div className="space-y-6">
            <h2 className="text-5xl font-extralight text-brand-black">5-Star Safety Rating</h2>
            <div className="flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-8 h-8 text-brand-champagne fill-brand-champagne" />
              ))}
            </div>
            <div className="w-16 h-px bg-brand-champagne mx-auto"></div>
          </div>
          <p className="text-xl text-brand-black/60 leading-relaxed">
            First in our category to complete independent clinical trials, 
            setting new standards for nail health and safety worldwide
          </p>
        </div>
      </section>

      {/* Founder - Split */}
      <section className="py-32">
        <div className="container mx-auto px-8 max-w-7xl">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div className="aspect-[3/4] relative">
              <Image src="/EL.webp" alt="Elmien Scholtz" fill className="object-cover" />
            </div>
            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-5xl font-extralight text-brand-black">Elmien Scholtz</h2>
                <div className="w-16 h-px bg-brand-champagne"></div>
                <p className="text-lg text-brand-champagne">Founder & Visionary</p>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="font-medium text-brand-black mb-1">Ernst & Young Entrepreneur of the Year</p>
                  <p className="text-sm text-brand-champagne">Emerging Category • Southern Africa</p>
                </div>
                <blockquote className="text-xl font-light text-brand-black/60 italic border-l-2 border-brand-champagne pl-6">
                  &quot;A great sense of pride for my brand and hard work.&quot;
                </blockquote>
                <div className="flex gap-12 pt-4">
                  <div>
                    <p className="text-4xl font-extralight text-brand-champagne mb-1">1980</p>
                    <p className="text-xs uppercase tracking-wider text-brand-black/40">CIDESCO</p>
                  </div>
                  <div>
                    <p className="text-4xl font-extralight text-brand-champagne mb-1">1988</p>
                    <p className="text-xs uppercase tracking-wider text-brand-black/40">Founded</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

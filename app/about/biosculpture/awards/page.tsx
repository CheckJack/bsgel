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
                  Edição N.º 01 — 2024
                </div>
                
                <h1 className="text-[10rem] md:text-[14rem] lg:text-[18rem] font-extralight leading-[0.8] tracking-tighter text-brand-black">
                  PRÉMIOS
                </h1>

                <div className="max-w-md">
                  <p className="text-xl font-light text-brand-black/60 leading-relaxed">
                    Excelência Premiada
                  </p>
                  <p className="text-lg font-light text-brand-black/50 leading-relaxed mt-2">
                    Mais de três décadas de excelência e inovação no cuidado de unhas. Um legado reconhecido.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8 pt-8">
                <div className="text-7xl font-extralight text-brand-champagne">10</div>
                <div className="h-16 w-px bg-brand-champagne/30"></div>
                <div>
                  <div className="text-sm uppercase tracking-wider text-brand-black">Anos</div>
                  <div className="text-xs text-brand-champagne/60">Consecutivos</div>
                </div>
              </div>
            </div>

            {/* Stats Sidebar */}
            <div className="lg:col-span-5 space-y-8">
              <div className="pt-8 space-y-6">
                {[
                  { label: 'Classificação de Segurança', value: '5' },
                  { label: 'Países', value: '40+' },
                  { label: 'Prémios de Referência', value: '20+' }
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
            <div className="text-xs uppercase tracking-[0.5em] text-brand-champagne/40">Revista Salon</div>
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
                Bio Sculpture BIOGEL — Vencedor do Prémio Escolha dos Leitores 2024
              </div>
            </div>

            {/* Editorial Text - 1/3 width */}
            <div className="space-y-8 lg:pt-16">
              <div className="space-y-4">
                <h2 className="text-4xl font-light text-brand-black leading-tight">
                  Uma Década<br/>de Excelência
                </h2>
                <div className="w-12 h-px bg-brand-champagne"></div>
              </div>

              <div className="space-y-6 text-base text-brand-black/60 leading-relaxed">
                <p>
                  De 2016 a 2025, uma sequência de vitórias sem precedentes.
                </p>
                
                <p className="text-brand-champagne font-medium">
                  Um feito que demonstra confiança profissional inabalável e qualidade consistente.
                </p>

                <div className="pt-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-4 h-4 text-brand-champagne" />
                    <span className="text-sm">Categoria de Melhoria de Unhas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="w-4 h-4 text-brand-champagne fill-brand-champagne" />
                    <span className="text-sm">Vencedor da Escolha dos Leitores</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase - Simple Grid */}
      <section className="py-32">
        <div className="container mx-auto px-8 max-w-7xl">
          <div className="text-center mb-20 space-y-6">
            <h2 className="text-5xl font-extralight text-brand-black">Produtos Premiados</h2>
            <div className="w-16 h-px bg-brand-champagne mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { img: '/6.png', title: 'HP Gel Nail Art Kit', award: 'Nails Magazine 2018', cat: 'Produto Novo Favorito' },
              { img: '/7.png', title: 'Black & Blue Teardrop', award: 'Nails Magazine 2018', cat: 'Lima Favorita' },
              { img: '/9.png', title: 'Ethos Lavender Base', award: 'Woman&Home 2023', cat: 'Santo Graal' },
              { img: '/10.png', title: 'Hand Cream', award: 'Woman&Home 2023', cat: 'Santo Graal' },
              { img: '/12.png', title: 'Mirror Top Coat', award: 'Woman&Home 2024', cat: 'Santo Graal' },
              { img: '/13.png', title: 'Vitamin Dose', award: 'Woman&Home 2024', cat: 'Santo Graal' }
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
      <section className="py-32 bg-black">
        <div className="container mx-auto px-8 max-w-4xl text-center space-y-12">
          <Shield className="w-16 h-16 text-brand-champagne mx-auto" />
          <div className="space-y-6">
            <h2 className="text-5xl font-extralight text-white">Classificação de Segurança 5 Estrelas</h2>
            <div className="flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-8 h-8 text-brand-champagne fill-brand-champagne" />
              ))}
            </div>
            <div className="w-16 h-px bg-brand-champagne mx-auto"></div>
          </div>
          <p className="text-xl text-white/70 leading-relaxed">
            Primeiros na nossa categoria a completar ensaios clínicos independentes, estabelecendo novos padrões para a saúde e segurança das unhas em todo o mundo
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
                <p className="text-lg text-brand-champagne">Fundadora e Visionária</p>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="font-medium text-brand-black mb-1">Empreendedor do Ano Ernst & Young</p>
                  <p className="text-sm text-brand-champagne">Categoria Emergente • África Austral</p>
                </div>
                <blockquote className="text-xl font-light text-brand-black/60 italic border-l-2 border-brand-champagne pl-6">
                  &quot;Um grande sentido de orgulho pela minha marca e trabalho árduo.&quot;
                </blockquote>
                <div className="flex gap-12 pt-4">
                  <div>
                    <p className="text-4xl font-extralight text-brand-champagne mb-1">1980</p>
                    <p className="text-xs uppercase tracking-wider text-brand-black/40">CIDESCO</p>
                  </div>
                  <div>
                    <p className="text-4xl font-extralight text-brand-champagne mb-1">1988</p>
                    <p className="text-xs uppercase tracking-wider text-brand-black/40">Fundada</p>
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

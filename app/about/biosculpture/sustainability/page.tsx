"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, Leaf, Heart, ShieldCheck, Sparkles, Ban } from "lucide-react";

export default function SustainabilityPage() {
  const [activeTab, setActiveTab] = useState("onde-tudo-ganha-forma");

  const tabs = [
    {
      id: "onde-tudo-ganha-forma",
      label: "Onde tudo ganha forma",
      content: "No coração da África do Sul, a nossa unidade de produção de 3000 m² foi concebida para ser um modelo de eco-eficiência. Rodeada por paisagens naturais, é neste ambiente tranquilo e rigorosamente controlado que cada produto BIO ganha vida.",
      media: {
        type: "video",
        src: "/fsfadfsvgsz.mp4"
      }
    },
    {
      id: "construida-eco-eficiente",
      label: "Eco-eficiência",
      content: "Infraestruturas pensadas para reduzir o impacto ambiental.",
      media: {
        type: "video",
        src: "/fsfsfsfsdszxc.mp4"
      }
    },
    {
      id: "energia-sol",
      label: "Energia Solar",
      content: "Aproveitamos a força do sol para uma produção mais consciente.",
      media: {
        type: "video",
        src: "/fsfadfsvgszdssf.mp4"
      }
    },
    {
      id: "certificacoes",
      label: "Certificações Globais",
      content: "Padrões internacionais que garantem a confiança de profissionais em todo o mundo. Aqui, a inovação técnica e a responsabilidade ecológica unem-se para criar a beleza do futuro.",
      media: {
        type: "video",
        src: "/fsfadfssvgszdssf.mp4"
      }
    }
  ];
  return (
    <>
      {/* Video Hero Section */}
      <section className="relative w-full h-[calc(100vh-60px)] md:h-[calc(100vh-70px)] overflow-hidden">
        <video
          src="/efggafdjykee.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Text Overlay - Bottom Left - Aligned with Logo */}
        <div className="absolute bottom-12 md:bottom-16 lg:bottom-20 left-0 right-0 z-10 px-6 md:px-12 lg:px-16">
          <p className="text-white text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light leading-relaxed">
            Bio Sculpture:<br />
            Ciência Ética,<br />
            Beleza Sustentável.
          </p>
        </div>

        {/* Scroll Indicator - Right Side */}
        <div className="absolute bottom-12 md:bottom-16 lg:bottom-20 right-4 md:right-8 lg:right-16 z-10 flex flex-col items-center gap-2">
          <span className="text-white text-sm md:text-base font-light uppercase tracking-wider">Scroll</span>
          <ChevronDown className="w-6 h-6 md:w-8 md:h-8 text-white animate-bounce" />
        </div>
      </section>

      {/* Text Section - Centered */}
      <section className="relative w-full min-h-[70vh] md:min-h-[80vh] flex items-center justify-center py-20 md:py-28 bg-brand-white">
        <div className="w-full px-6 md:px-12 lg:px-16">
          <div className="text-center max-w-7xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-brand-black leading-relaxed">
              BIO Sculpture: O nosso compromisso com o futuro.
            </h2>
            <p className="text-xl md:text-2xl lg:text-3xl font-light text-brand-black leading-relaxed">
              Trabalhamos diariamente para reduzir o impacto ambiental de cada produto — da nossa fábrica energéticamente eficiente até à reciclagem das embalagens no salão. Com fórmulas vegan e 10-Free, aliamos escolhas responsáveis de packaging dos 3 R's (Reduzir, Reutilizar e Reciclar) a um rigoroso respeito pela saúde e pelo planeta.
            </p>
          </div>
        </div>
      </section>

      {/* Tabbed Content Section */}
      <section className="relative w-full bg-[#1a3a2a]">
        {/* Full Width Heading Container */}
        <div className="w-full px-6 md:px-12 lg:px-16 pt-32 md:pt-40 pb-0">
          <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-white leading-relaxed mb-4">
            A Nossa Fábrica, o Nosso Planeta
          </h2>
          <p className="text-xl md:text-2xl lg:text-3xl font-light text-white/80 leading-relaxed">
            Onde a inovação encontra a natureza.
          </p>
        </div>

        {/* Two Column Container - Accordion and Image */}
        <div className="grid md:grid-cols-2 gap-0 items-stretch">
          {/* Left Side - Accordion */}
          <div className="flex flex-col px-6 md:px-12 lg:px-16 pt-16 md:pt-24 pb-16 md:pb-24">
            {/* Tabs Navigation */}
            <div className="space-y-0 mb-8 md:mb-12">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="w-full text-left py-4 md:py-5 border-b border-white/20 transition-all group"
                >
                  <span
                    className={`text-xl md:text-2xl lg:text-3xl font-light transition-colors ${
                      activeTab === tab.id
                        ? "text-white"
                        : "text-white/60 group-hover:text-white/80"
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[150px] md:min-h-[200px]">
              {tabs.find((tab) => tab.id === activeTab) && (
                <p className="text-lg md:text-xl lg:text-2xl font-light text-white leading-relaxed">
                  {tabs.find((tab) => tab.id === activeTab)?.content}
                </p>
              )}
            </div>
          </div>

          {/* Right Side - Media (Video or Image) */}
          <div className="px-6 md:px-12 lg:px-16 pt-16 md:pt-24 pb-16 md:pb-24 flex">
            <div className="relative w-full h-full rounded-lg overflow-hidden">
              {tabs.find((tab) => tab.id === activeTab)?.media.type === "video" ? (
                <video
                  key={activeTab}
                  src={tabs.find((tab) => tab.id === activeTab)?.media.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Image
                  src={tabs.find((tab) => tab.id === activeTab)?.media.src || "/efggaee.png"}
                  alt="Sustainability"
                  fill
                  className="object-cover rounded-lg"
                  priority
                  unoptimized
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Formulas & Ingredients Section */}
      <section className="relative w-full bg-brand-white py-24 md:py-32">
        <div className="w-full px-6 md:px-12 lg:px-16">
          {/* Section Heading */}
          <div className="mb-16 md:mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-brand-black leading-relaxed mb-6">
              Fórmulas & Ingredientes: A Vanguarda da Saúde
            </h2>
            <p className="text-xl md:text-2xl font-light text-brand-black/80 max-w-4xl mb-4">
              Cada produto BIO SCULPTURE é o resultado de um compromisso absoluto com a saúde e a transparência. Integramos as fórmulas mais revolucionárias da indústria cosmética, desenvolvidas para garantir uma performance profissional sem precedentes, sem nunca comprometer o bem-estar da unha natural.
            </p>
            <p className="text-lg md:text-xl font-light text-brand-black/70 max-w-4xl">
              Fórmulas puras, tecnologia de ponta e ética inabalável.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Card 1: 10-Free & Non-Toxic */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-black/5">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-[#1a3a2a]/10 flex items-center justify-center group-hover:bg-[#1a3a2a] transition-colors duration-300">
                  <Ban className="w-8 h-8 text-[#1a3a2a] group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-light text-brand-black mb-4">
                Segurança 10-Free
              </h3>
              <p className="text-lg font-light text-brand-black/70 leading-relaxed">
                Fórmula non-toxic que elimina os 10 ingredientes mais nocivos, garantindo total integridade e segurança para a cliente.
              </p>
            </div>

            {/* Card 2: 100% Vegan */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-black/5">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-[#1a3a2a]/10 flex items-center justify-center group-hover:bg-[#1a3a2a] transition-colors duration-300">
                  <Leaf className="w-8 h-8 text-[#1a3a2a] group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-light text-brand-black mb-4">
                100% Vegan
              </h3>
              <p className="text-lg font-light text-brand-black/70 leading-relaxed">
                Fórmulas totalmente isentas de ingredientes de origem animal.
              </p>
            </div>

            {/* Card 3: Cruelty-Free */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-black/5">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-[#1a3a2a]/10 flex items-center justify-center group-hover:bg-[#1a3a2a] transition-colors duration-300">
                  <Heart className="w-8 h-8 text-[#1a3a2a] group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-light text-brand-black mb-4">
                Cruelty-Free
              </h3>
              <p className="text-lg font-light text-brand-black/70 leading-relaxed">
                Sem testes em animais. Beleza ética e consciente.
              </p>
            </div>

            {/* Card 4: Healthy */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-black/5">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-[#1a3a2a]/10 flex items-center justify-center group-hover:bg-[#1a3a2a] transition-colors duration-300">
                  <ShieldCheck className="w-8 h-8 text-[#1a3a2a] group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-light text-brand-black mb-4">
                Healthy
              </h3>
              <p className="text-lg font-light text-brand-black/70 leading-relaxed">
                Fórmulas que fortalecem e protegem a saúde da unha natural.
              </p>
            </div>

            {/* Card 5: TPO-Free */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-black/5">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-[#1a3a2a]/10 flex items-center justify-center group-hover:bg-[#1a3a2a] transition-colors duration-300">
                  <Sparkles className="w-8 h-8 text-[#1a3a2a] group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-light text-brand-black mb-4">
                TPO-Free
              </h3>
              <p className="text-lg font-light text-brand-black/70 leading-relaxed">
                Fórmulas sem TPO, protegendo a saúde da unha e da pele circundante.
              </p>
            </div>

            {/* Card 6: HEMA-Free */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-black/5">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-[#1a3a2a]/10 flex items-center justify-center group-hover:bg-[#1a3a2a] transition-colors duration-300">
                  <Sparkles className="w-8 h-8 text-[#1a3a2a] group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-light text-brand-black mb-4">
                HEMA-Free
              </h3>
              <p className="text-lg font-light text-brand-black/70 leading-relaxed">
                Algumas gamas formuladas sem HEMA, minimizando o risco de sensibilização e alergias.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}


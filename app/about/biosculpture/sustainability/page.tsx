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
      content: "No coração da África do Sul, a nossa fábrica de 3000 m² foi pensada para unir inovação, natureza e responsabilidade. Rodeada por paisagens abertas, é aqui que cada frasco BIO nasce num ambiente tranquilo, controlado e alinhado com padrões internacionais de qualidade.",
      media: {
        type: "video",
        src: "/fsfadfsvgsz.mp4"
      }
    },
    {
      id: "construida-eco-eficiente",
      label: "Construída para ser eco‑eficiente",
      content: "O edifício é ambientalmente responsável, com sistemas de ventilação climatizada, aproveitamento máximo de luz natural e reservatório de água auto‑sustentável. Estas escolhas reduzem o consumo energético e o desperdício de recursos, tornando cada etapa de produção mais leve para o planeta.",
      media: {
        type: "video",
        src: "/fsfsfsfsdszxc.mp4"
      }
    },
    {
      id: "energia-sol",
      label: "Energia do sol, para unhas mais conscientes",
      content: "O telhado da fábrica em \"sunny South Africa\" está equipado com painéis solares que alimentam grande parte da produção com energia limpa. Ao transformar sol em energia, diminuímos a pegada de carbono dos nossos produtos e aproximamos a beleza profissional de um futuro mais sustentável.",
      media: {
        type: "video",
        src: "/fsfadfsvgszdssf.mp4"
      }
    },
    {
      id: "certificacoes",
      label: "Certificações que garantem confiança",
      content: "A fábrica BIO SCULPTURE é certificada segundo as normas ISO 22716 (Boas Práticas de Fabrico) e gerida sob um sistema de qualidade ISO 9001, auditado regularmente. Estas certificações asseguram processos rigorosos, seguros e consistentes, reforçando o compromisso \"Healthy | Ethical | Professional\" em cada produto que sai da nossa linha.",
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
            Energia limpa<br />
            fórmulas conscientes<br />
            beleza responsável.
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
          <p className="text-center text-2xl md:text-3xl lg:text-4xl font-light text-brand-black leading-relaxed max-w-7xl mx-auto">
            BIO Sculpture trabalha todos os dias para reduzir o impacto ambiental dos seus produtos, desde a fábrica até à reciclagem das embalagens no salão.​ Com fórmulas vegan e 10‑Free, uma fábrica energeticamente eficiente e escolhas responsáveis de packaging, a marca procura alinhar beleza, saúde e respeito pelo planeta.​
          </p>
        </div>
      </section>

      {/* Tabbed Content Section */}
      <section className="relative w-full bg-[#1a3a2a]">
        {/* Full Width Heading Container */}
        <div className="w-full px-6 md:px-12 lg:px-16 pt-32 md:pt-40 pb-0">
          <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-white leading-relaxed whitespace-nowrap">
            A Nossa Fábrica, o Nosso Planeta
          </h2>
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
              Fórmulas & Ingredientes
            </h2>
            <p className="text-xl md:text-2xl font-light text-brand-black/80 max-w-4xl">
              Cada produto BIO SCULPTURE é formulado com cuidado, transparência e compromisso com a saúde. 
              As nossas fórmulas são desenvolvidas para garantir beleza profissional sem comprometer o bem-estar.
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
                10-Free & Non-Toxic
              </h3>
              <p className="text-lg font-light text-brand-black/70 leading-relaxed">
                Fórmulas livres de 10 ingredientes nocivos, garantindo segurança e qualidade sem comprometer o desempenho.
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
                Todos os nossos produtos são formulados sem qualquer ingrediente de origem animal.
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
                Nunca testamos os nossos produtos em animais. Beleza consciente e ética.
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
                Fórmulas pensadas para a saúde das unhas, promovendo fortalecimento e proteção natural.
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
                Fórmulas sem TPO (óxido de trifenilfosfina), protegendo a saúde das unhas e da pele circundante.
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
                Sem HEMA (metacrilato de 2-hidroxietilo), reduzindo o risco de sensibilização e alergias.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}


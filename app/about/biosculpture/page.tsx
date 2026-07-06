"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";

export default function BiosculpturePage() {
  return (
    <>
      {/* Hero Image Section */}
      <div className="relative h-[calc(100dvh-var(--site-header-height,113px))] min-h-[420px] w-full overflow-hidden md:min-h-[520px]">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/Add a heading (16).png"
            alt="Bio Sculpture Concept"
            fill
            className="object-cover"
            priority
            unoptimized
            sizes="100vw"
          />
        </div>
        
        {/* Text Overlay - Bottom Left - Aligned with Logo */}
        <div className="absolute bottom-12 md:bottom-16 lg:bottom-20 left-0 right-0 z-10">
          <div className="container mx-auto px-4">
            <p className="text-white text-3xl font-light leading-relaxed sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              Primeiro Tratar,<br />
              Depois Embelezar
            </p>
          </div>
        </div>

        {/* Scroll Indicator - Right Side */}
        <div className="absolute bottom-12 md:bottom-16 lg:bottom-20 right-4 md:right-8 lg:right-16 z-10 flex flex-col items-center gap-2">
          <span className="text-white text-sm md:text-base font-light uppercase tracking-wider">Scroll</span>
          <ChevronDown className="w-6 h-6 md:w-8 md:h-8 text-white animate-bounce" />
        </div>
      </div>

      {/* "O que significa Tratar" Section */}
      <section 
        className="relative flex w-full items-center px-4 py-12 sm:px-6 sm:py-16 md:h-[700px] md:px-8 md:py-0 lg:h-[800px] lg:px-16" 
        style={{ backgroundColor: '#ddd6d0' }}
      >
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-8 md:mb-10 text-brand-black">
            O que significa <span className="font-medium">&quot;Tratar&quot;</span>
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl font-light text-brand-black leading-relaxed">
            Antes da estética, a Terapeuta BIO analisa a fundo a unha natural - da flexibilidade, às quebras, à descamação e manchas, aos hábitos diários. No conceito Bio Sculpture, o compromisso é claro: primeiro tratar, depois embelezar.
          </p>
        </div>
      </section>

      {/* "O Protocolo" Section */}
      <section className="relative w-full bg-brand-white py-12 sm:py-16 md:py-0 md:h-[700px] lg:h-[800px]">
        <div className="w-full md:h-full">
          <div className="grid h-full grid-cols-1 gap-8 md:grid-cols-2 md:gap-0">
            <div className="flex items-center px-4 sm:px-6 md:px-8 lg:px-16">
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-6 md:mb-8 text-brand-black">
                  O Diagnóstico BIO: Tratamento por Prescrição
                </h2>
                <p className="text-lg md:text-xl lg:text-2xl font-light text-brand-black leading-relaxed">
                  No Conceito BIO, o tratamento é uma &quot;receita&quot; exclusiva para cada cliente. A profissional prescreve Bases personalizadas, tratamentos ETHOS e cuidados SPA específicos para fortalecer, equilibrar ou proteger a queratina. O resultado é uma base perfeitamente saudável antes de qualquer construção ou cor.
                </p>
              </div>
            </div>

            <div className="relative aspect-[4/3] min-h-[220px] w-full sm:min-h-[280px] md:aspect-auto md:h-full">
              <Image 
                src="/fdfvd.png" 
                alt="O Protocolo - Base Gel" 
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      {/* "De Tratamento" Section */}
      <section className="relative w-full bg-brand-white py-12 sm:py-16 md:py-0 md:h-[700px] lg:h-[800px]">
        <div className="w-full md:h-full">
          <div className="grid h-full grid-cols-1 gap-8 md:grid-cols-2 md:gap-0">
            <div className="relative order-2 aspect-[4/3] min-h-[220px] w-full sm:min-h-[280px] md:order-1 md:aspect-auto md:h-full">
              <Image 
                src="/_zx.png" 
                alt="De Tratamento - Base Gel Products" 
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="order-1 flex items-center px-4 sm:px-6 md:order-2 md:px-8 lg:px-16">
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-6 md:mb-8 text-brand-black">
                  Cuidados de Tratamento
                </h2>
                <p className="text-lg md:text-xl lg:text-2xl font-light text-brand-black leading-relaxed">
                  Soluções concebidas para hidratar, fortalecer ou suavizar as unhas, através de fórmulas veganas e livres de ingredientes agressivos. Estes produtos garantem a integridade da unha natural, proporcionando uma estrutura saudável e segura — a escolha ideal para quem utiliza gel regularmente ou possui unhas sensíveis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "O momento de Embelezar" Section */}
      <section className="relative min-h-[480px] w-full overflow-hidden py-16 sm:min-h-[560px] md:h-[700px] md:py-0 lg:h-[800px]">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image 
            src="/efggaee.png" 
            alt="O momento de Embelezar" 
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        
        {/* Semi-transparent Brown Overlay - Rectangle in Middle */}
        <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8 lg:p-16">
          <div className="m-2 max-w-6xl rounded-lg bg-[rgba(139,69,19,0.7)] p-8 sm:p-12 md:m-4 md:max-w-7xl md:rounded-xl md:bg-[rgba(139,69,19,0.75)] md:p-16 lg:m-6 lg:rounded-2xl lg:p-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-6 md:mb-8 text-white">
              A Fase de &quot;Embelezar&quot;
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl font-light text-white leading-relaxed">
              Com a saúde da unha assegurada, passamos à estética: cor, brilho e design. A construção, o alongamento e a nail art são aplicados sobre uma base estável e tratada. Esta abordagem garante um acabamento perfeito e duradouro, minimizando a necessidade de intervenções agressivas e preservando sempre a beleza natural.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

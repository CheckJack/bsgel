"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";

export default function ConceptPage() {
  return (
    <>
      {/* Hero Video Section */}
      <div className="relative w-full h-[calc(100vh-60px)] md:h-[calc(100vh-70px)] overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/Primeiro tratar e depois embelezar..mp4" type="video/mp4" />
        </video>
        
        {/* Text Overlay - Bottom Left - Aligned with Logo */}
        <div className="absolute bottom-12 md:bottom-16 lg:bottom-20 left-0 right-0 z-10">
          <div className="container mx-auto px-4">
            <p className="text-white text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light leading-relaxed">
              Primeiro tratar<br />
              e depois embelezar.
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
        className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] flex items-center px-4 md:px-8 lg:px-16" 
        style={{ backgroundColor: '#ddd6d0' }}
      >
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-8 md:mb-10 text-brand-black">
            O que significa <span className="font-medium">"Tratar"</span>
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl font-light text-brand-black leading-relaxed">
            Antes de falar em cor, forma ou comprimento, a Terapeuta de unhas BIO observa a unha natural espessura, flexibilidade, quebras, descamação, manchas e até os hábitos diários da cliente.
          </p>
        </div>
      </section>

      {/* "O Protocolo" Section */}
      <section 
        className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] bg-brand-white"
      >
        <div className="w-full h-full">
          <div className="grid md:grid-cols-2 gap-0 h-full">
            {/* Text Content - Left Side (50%) */}
            <div className="px-4 md:px-8 lg:px-16 flex items-center">
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-6 md:mb-8 text-brand-black">
                  O Protocolo
                </h2>
                <p className="text-lg md:text-xl lg:text-2xl font-light text-brand-black leading-relaxed">
                  No Conceito BIO, o tratamento é personalizado como uma "receita" para cada unha. A profissional escolhe bases, tratamentos ETHOS e cuidados de SPA específicos para fortalecer, equilibrar ou proteger, criando uma base saudável antes de qualquer construção ou cor.
                </p>
              </div>
            </div>
            
            {/* Image - Right Side (50%) */}
            <div className="h-full w-full relative">
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
      <section 
        className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] bg-brand-white"
      >
        <div className="w-full h-full">
          <div className="grid md:grid-cols-2 gap-0 h-full">
            {/* Image - Left Side (50%) */}
            <div className="h-full w-full relative">
              <Image 
                src="/_zx.png" 
                alt="De Tratamento - Base Gel Products" 
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            
            {/* Text Content - Right Side (50%) */}
            <div className="px-4 md:px-8 lg:px-16 flex items-center">
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-6 md:mb-8 text-brand-black">
                  De Tratamento
                </h2>
                <p className="text-lg md:text-xl lg:text-2xl font-light text-brand-black leading-relaxed">
                  Produtos que hidratam, endurecem ou amaciam as unhas, sempre com fórmulas veganas e sem ingredientes agressivos, pensados para manter a integridade da unha natural. O resultado é uma estrutura confortável e segura, ideal para quem usa gel com frequência ou tem unhas naturalmente sensíveis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "O momento de Embelezar" Section */}
      <section 
        className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden"
      >
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
          <div className="bg-[rgba(139,69,19,0.7)] md:bg-[rgba(139,69,19,0.75)] m-2 md:m-4 lg:m-6 p-12 md:p-16 lg:p-20 max-w-6xl md:max-w-7xl rounded-lg md:rounded-xl lg:rounded-2xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-6 md:mb-8 text-white">
              O momento de "Embelezar"
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl font-light text-white leading-relaxed">
              Só depois de a unha estar cuidada é que entra a parte estética: cor, brilho, comprimento e nail art. A construção, o alongamento e os detalhes artísticos são feitos em cima de uma base estável, o que ajuda a manter o resultado bonito durante mais tempo e reduz a necessidade de correções agressivas.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}


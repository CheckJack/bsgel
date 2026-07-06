"use client";

import { HeroSlider } from "@/components/layout/hero-slider";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";

export default function AboutPage() {
  const { t } = useLanguage();

  const slides = [
    {
      type: "video" as const,
      src: "/1204 (3.mp4",
    },
  ];

  return (
    <>
      <HeroSlider slides={slides} autoPlayInterval={5000} className="h-[85dvh] min-h-[420px] sm:h-[90dvh] md:h-screen" showDarkOverlay={false} />
      <div className="min-h-screen bg-brand-white">

      {/* Mission Section */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6 flex items-center">
        <div className="container mx-auto w-full">
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-light text-brand-black text-center leading-relaxed w-full px-4 sm:px-6 md:px-8">
            {t("about.mission")}
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-20 md:pb-24 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="relative overflow-hidden rounded-lg bg-gray-100">
              <Image
                src="/elmien-about.jpg"
                alt="Bio Sculpture specialist"
                width={740}
                height={1024}
                className="h-full w-full object-cover"
                priority
                unoptimized
              />
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-brand-black">
                About Us
              </h2>
              <p className="mt-4 text-base sm:text-lg font-light leading-relaxed text-brand-black whitespace-pre-line">
                {`Desde a infancia, Elmien era fascinada por unhas bonitas. Esse fascinio tornou-se a sua paixao. Depois de concluir os seus estudos na CIDESCO Beauty Academy, Elmien abriu o seu primeiro salao. Sem conseguir encontrar produtos de cuidados de unhas premium que correspondessem aos seus padroes, continuou a sua formacao nos EUA, frequentando cursos em sistemas de unhas artificiais. Elmien concluiu que, se queria um produto de referencia que cumprisse todos os requisitos, teria de o desenvolver de raiz.

O seu objetivo nao era apenas criar unhas bonitas, mas tambem promover a saude da unha natural. Ao consultar os melhores cientistas nas respetivas areas e ao aplicar as tecnologias mais avancadas disponiveis, nasceu o Bio Sculpture Gel. De um inicio humilde, com paixao, trabalho arduo e a fe de uma verdadeira pioneira, tornou-se hoje uma das principais solucoes de cuidados de unhas.`}
              </p>

              <div className="mt-6 space-y-3">
                <details className="group rounded-md border border-gray-200 bg-white p-4">
                  <summary className="cursor-pointer list-none text-sm sm:text-base font-medium text-brand-black">
                    Ambito
                  </summary>
                  <p className="mt-3 text-sm sm:text-base font-light leading-relaxed text-gray-700">
                    A Bio Sculpture SA (Pty) Ltd concebe, desenvolve, fabrica e comercializa produtos de cuidado de unhas e beleza.
                    Esforcamo-nos por manter um Sistema de Gestao da Qualidade alinhado com as normas ISO 9001:2015 e ISO 22716
                    em todos os aspetos e fases das nossas operacoes. A Bio Sculpture assegura que os produtos, cosmeticos e equipa
                    cumprem a ISO 9001:2015 e tambem as Boas Praticas de Fabrico (GMP) ISO 22716.
                  </p>
                </details>

                <details className="group rounded-md border border-gray-200 bg-white p-4">
                  <summary className="cursor-pointer list-none text-sm sm:text-base font-medium text-brand-black">
                    Declaracao da Politica de Qualidade
                  </summary>
                  <p className="mt-3 text-sm sm:text-base font-light leading-relaxed text-gray-700">
                    PARA AUMENTAR A SATISFACAO DO CLIENTE, IREMOS:
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm sm:text-base font-light leading-relaxed text-gray-700">
                    <li>Reforcar a especializacao da nossa equipa atraves de formacao periodica.</li>
                    <li>Rever e melhorar continuamente os sistemas.</li>
                    <li>Adotar principios de Gestao da Qualidade Total e melhorar processos, produtos e servicos.</li>
                    <li>Fornecer produtos e servicos que cumpram ou superem os requisitos de qualidade dos clientes.</li>
                    <li>Rever e atualizar os objetivos e os resultados alcancados.</li>
                    <li>Comunicar a politica do Sistema de Gestao da Qualidade a todos os colaboradores e partes interessadas.</li>
                    <li>Entregar produtos na quantidade certa e no prazo, sempre.</li>
                    <li>Promover um ambiente seguro e saudavel.</li>
                    <li>Comprometer-nos com o cumprimento de todos os regulamentos aplicaveis.</li>
                  </ul>
                </details>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <Image
              src="/elmien-signature.webp"
              alt="Assinatura Elmien"
              width={360}
              height={120}
              className="h-auto w-[320px] sm:w-[420px] md:w-[520px]"
              unoptimized
            />
          </div>
        </div>
      </section>
      </div>
    </>
  );
}


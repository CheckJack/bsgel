"use client";

import React from "react";
import { motion } from "framer-motion";

interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

const testimonials: Testimonial[] = [
  {
    text: "Esta formação transformou por completo a forma como avalio e trato cada unha. As clientes notam a diferença desde a primeira sessão.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Briana Patton",
    role: "Nail Therapist",
  },
  {
    text: "A metodologia é clara, prática e muito completa. Consegui aplicar imediatamente os protocolos no meu dia a dia de salão.",
    image: "https://images.unsplash.com/photo-1542204625-de293a06df26?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Marta Oliveira",
    role: "Formanda BIO",
  },
  {
    text: "O apoio após a formação é incrível. Sempre que tenho dúvidas, recebo orientação rápida e objetiva.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Saman Malik",
    role: "Profissional Certificada",
  },
  {
    text: "Os módulos são bem estruturados e elevam o nível técnico de forma real. Hoje presto um serviço muito mais especializado.",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Joana Martins",
    role: "Salon Owner",
  },
  {
    text: "A formação ajudou-me a diferenciar o meu trabalho no mercado. O foco em saúde da unha faz toda a diferença.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Zainab Hussain",
    role: "Nail Specialist",
  },
  {
    text: "Conteúdo excelente, prática orientada e resultados reais. Recomendo para quem quer evoluir com confiança.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Aliza Khan",
    role: "Formanda",
  },
  {
    text: "Com esta certificação, passei a oferecer tratamentos mais completos e fidelizei mais clientes.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Andreia Silva",
    role: "Técnica de Unhas",
  },
  {
    text: "A qualidade pedagógica e o acompanhamento contínuo tornam esta formação uma escolha segura.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Sana Sheikh",
    role: "Profissional BIO",
  },
  {
    text: "Foi o passo certo para elevar a minha carreira. Hoje trabalho com mais técnica e muito mais segurança.",
    image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Catarina Lopes",
    role: "Nail Artist",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

function TestimonialsColumn(props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) {
  return (
    <div className={props.className}>
      <motion.ul
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="m-0 flex list-none flex-col gap-6 bg-transparent p-0 pb-6"
      >
        {[...new Array(2).fill(0)].map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <motion.li
                key={`${index}-${i}`}
                aria-hidden={index === 1 ? "true" : "false"}
                tabIndex={index === 1 ? -1 : 0}
                whileHover={{
                  scale: 1.03,
                  y: -8,
                  boxShadow:
                    "0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                  transition: { type: "spring", stiffness: 400, damping: 17 },
                }}
                whileFocus={{
                  scale: 1.03,
                  y: -8,
                  boxShadow:
                    "0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                  transition: { type: "spring", stiffness: 400, damping: 17 },
                }}
                className="group w-full max-w-sm cursor-default select-none rounded-3xl border border-neutral-200 bg-white p-10 shadow-lg shadow-black/5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-champagne/30"
              >
                <blockquote className="m-0 p-0">
                  <p className="m-0 leading-relaxed text-neutral-600">{text}</p>
                  <footer className="mt-6 flex items-center gap-3">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={`Avatar of ${name}`}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-neutral-100 transition-all duration-300 ease-in-out group-hover:ring-brand-champagne/30"
                    />
                    <div className="flex flex-col">
                      <cite className="not-italic leading-5 tracking-tight text-neutral-900">
                        {name}
                      </cite>
                      <span className="mt-0.5 text-sm leading-5 tracking-tight text-neutral-500">
                        {role}
                      </span>
                    </div>
                  </footer>
                </blockquote>
              </motion.li>
            ))}
          </React.Fragment>
        ))}
      </motion.ul>
    </div>
  );
}

export default function TestimonialV2() {
  return (
    <section aria-labelledby="testimonials-heading" className="relative overflow-hidden bg-white py-20">
      <div className="container z-10 mx-auto px-4">
        <div className="mx-auto mb-16 flex max-w-5xl flex-col items-center justify-center">
          <div className="flex justify-center">
            <div className="rounded-full border border-neutral-300 bg-neutral-100/50 px-4 py-1 text-xs font-light uppercase tracking-wide text-neutral-600">
              Testemunhos
            </div>
          </div>

          <h2
            id="testimonials-heading"
            className="mt-6 text-center text-4xl font-light tracking-tight text-neutral-900 md:whitespace-nowrap md:text-5xl"
          >
            O que dizem as nossas formandas
          </h2>
          <p className="mt-5 max-w-sm text-center text-lg font-light leading-relaxed text-neutral-500">
            Descubra como esta formação está a elevar carreiras no setor profissional de unhas.
          </p>
        </div>

        <div
          className="mt-10 flex max-h-[740px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]"
          role="region"
          aria-label="Scrolling Testimonials"
        >
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={19}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={17}
          />
        </div>
      </div>
    </section>
  );
}

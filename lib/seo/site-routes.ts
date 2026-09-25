import type { SiteRouteDefinition } from "@/lib/seo/types";

/** All public storefront routes eligible for SEO management. Primary language: Portuguese. */
export const SITE_ROUTE_DEFINITIONS: SiteRouteDefinition[] = [
  {
    path: "/",
    name: "Início",
    defaultTitle: "Bio Sculpture | Produtos Profissionais para Unhas",
    defaultDescription:
      "Descubra o gel Bio Sculpture, formação e cuidados profissionais de unhas. Compre colour builders, bases, spa e sistemas aprovados para salões.",
    defaultMedia: [
      { id: "hero", label: "Hero carousel", src: "/hero-builder-hush.png", alt: "Bio Sculpture Colour Builder Gel" },
    ],
  },
  {
    path: "/products",
    name: "Produtos",
    defaultTitle: "Loja de Produtos para Unhas | Bio Sculpture",
    defaultDescription:
      "Explore produtos profissionais Bio Sculpture — géis, bases, cores, ferramentas e spa para salões e técnicas certificadas.",
  },
  {
    path: "/products/[id]",
    name: "Detalhe do produto",
    isDynamic: true,
    defaultTitle: "{productName} | Bio Sculpture",
    defaultDescription:
      "Veja detalhes, preço e requisitos de certificação deste produto Bio Sculpture.",
  },
  {
    path: "/cart",
    name: "Carrinho",
    defaultTitle: "O Seu Carrinho | Bio Sculpture",
    defaultDescription: "Reveja os artigos no seu carrinho Bio Sculpture antes de finalizar a compra.",
  },
  {
    path: "/checkout",
    name: "Checkout",
    defaultTitle: "Finalizar Compra | Bio Sculpture",
    defaultDescription: "Conclua a sua encomenda Bio Sculpture de forma segura.",
  },
  {
    path: "/bio-gel",
    name: "Bio Gel",
    defaultTitle: "Bio Gel | Bio Sculpture",
    defaultDescription: "Explore os sistemas Bio Gel Bio Sculpture para unhas saudáveis, fortes e de aspeto natural.",
  },
  {
    path: "/bio-gel/treatment-gels",
    name: "Bio Gel — Géis de Tratamento",
    defaultTitle: "Géis de Tratamento Bio Gel | Bio Sculpture",
    defaultDescription: "Géis de tratamento Bio Gel profissionais para reforço e cuidado das unhas.",
  },
  {
    path: "/colours",
    name: "Cores",
    defaultTitle: "Cores de Unhas | Bio Sculpture",
    defaultDescription: "Compre as coleções de cores Bio Sculpture para todos os estilos e estações.",
  },
  {
    path: "/colours/reds-browns",
    name: "Cores — Vermelhos e Castanhos",
    defaultTitle: "Cores Vermelhas e Castanhas | Bio Sculpture",
    defaultDescription: "Compre cores vermelhas e castanhas Bio Sculpture para looks clássicos e ousados.",
  },
  {
    path: "/colours/pinks-purples",
    name: "Cores — Rosas e Roxos",
    defaultTitle: "Cores Rosas e Roxas | Bio Sculpture",
    defaultDescription: "Explore géis rosa e roxo Bio Sculpture para salões e técnicas.",
  },
  {
    path: "/colours/whites-nudes",
    name: "Cores — Brancos e Nudes",
    defaultTitle: "Cores Brancas e Nudes | Bio Sculpture",
    defaultDescription: "Cores brancas e nudes Bio Sculpture para unhas elegantes e discretas.",
  },
  {
    path: "/colours/oranges-yellows",
    name: "Cores — Laranjas e Amarelos",
    defaultTitle: "Cores Laranja e Amarelo | Bio Sculpture",
    defaultDescription: "Cores vibrantes laranja e amarelo Bio Sculpture para estilos solares e ousados.",
  },
  {
    path: "/colours/blues-greens",
    name: "Cores — Azuis e Verdes",
    defaultTitle: "Cores Azuis e Verdes | Bio Sculpture",
    defaultDescription: "Géis azuis e verdes Bio Sculpture para nail art fresca e moderna.",
  },
  {
    path: "/colours/fluorescents",
    name: "Cores — Fluorescentes",
    defaultTitle: "Cores Fluorescentes | Bio Sculpture",
    defaultDescription: "Cores néon e fluorescentes Bio Sculpture que se destacam em qualquer luz.",
  },
  {
    path: "/colours/brights",
    name: "Cores — Vivas",
    defaultTitle: "Cores Vivas | Bio Sculpture",
    defaultDescription: "Cores Bio Sculpture de alto impacto para manicures de afirmação.",
  },
  {
    path: "/evo",
    name: "Verniz Gel",
    defaultTitle: "Verniz Gel | Bio Sculpture",
    defaultDescription: "Verniz Gel Bio Sculpture — sistemas de cor vibrante e tratamento.",
  },
  {
    path: "/evo/treatment-base-gels",
    name: "Verniz Gel — Bases de Tratamento",
    defaultTitle: "Bases de Tratamento Verniz Gel | Bio Sculpture",
    defaultDescription: "Bases e géis de tratamento Verniz Gel para unhas fortes e saudáveis sob a cor.",
  },
  {
    path: "/evo/top-coats",
    name: "Verniz Gel — Top Coats",
    defaultTitle: "Top Coats Verniz Gel | Bio Sculpture",
    defaultDescription: "Top coats Verniz Gel para manicures Bio Sculpture de alto brilho e durabilidade.",
  },
  {
    path: "/gemini",
    name: "Verniz Clássico",
    defaultTitle: "Verniz Clássico | Bio Sculpture",
    defaultDescription: "Tons de Verniz Clássico Bio Sculpture.",
  },
  {
    path: "/gemini/oranges-corals-yellows",
    name: "Verniz Clássico — Laranjas, Corais e Amarelos",
    defaultTitle: "Tons Laranja e Amarelo Verniz Clássico | Bio Sculpture",
    defaultDescription: "Cores quentes laranja, coral e amarelo do Verniz Clássico Bio Sculpture.",
  },
  {
    path: "/gemini/nudes-neutrals-browns",
    name: "Verniz Clássico — Nudes, Neutros e Castanhos",
    defaultTitle: "Tons Nude e Neutros Verniz Clássico | Bio Sculpture",
    defaultDescription: "Cores nude, neutras e castanhas do Verniz Clássico para looks atemporais.",
  },
  {
    path: "/gemini/pinks",
    name: "Verniz Clássico — Rosas",
    defaultTitle: "Cores Rosa Verniz Clássico | Bio Sculpture",
    defaultDescription: "Cores rosa Verniz Clássico — do blush suave ao fúcsia ousado.",
  },
  {
    path: "/gemini/reds",
    name: "Verniz Clássico — Vermelhos",
    defaultTitle: "Cores Vermelhas Verniz Clássico | Bio Sculpture",
    defaultDescription: "Vermelhos clássicos e de impacto do Verniz Clássico para manicures profissionais.",
  },
  {
    path: "/spa",
    name: "Spa",
    defaultTitle: "Cuidados Spa | Bio Sculpture",
    defaultDescription: "Cuidados spa Bio Sculpture para mãos e pés, em salão ou em casa.",
  },
  {
    path: "/spa/hand-care",
    name: "Spa — Cuidados das Mãos",
    defaultTitle: "Cuidados das Mãos Spa | Bio Sculpture",
    defaultDescription: "Produtos profissionais Bio Sculpture para cuidados das mãos em spa e salão.",
  },
  {
    path: "/spa/foot-care",
    name: "Spa — Cuidados dos Pés",
    defaultTitle: "Cuidados dos Pés Spa | Bio Sculpture",
    defaultDescription: "Gama de cuidados dos pés Bio Sculpture para pedicures e rituais spa em casa.",
  },
  {
    path: "/ethos",
    name: "Cuidados das Unhas",
    defaultTitle: "Cuidados das Unhas | Bio Sculpture",
    defaultDescription: "Diagnóstico e cuidados das unhas com Cuidados das Unhas by Bio Sculpture.",
  },
  {
    path: "/natural-nail-treatments",
    name: "Tratamentos da Unha Natural",
    defaultTitle: "Tratamentos da Unha Natural | Bio Sculpture",
    defaultDescription:
      "Tratamentos Bio Sculpture para a unha natural — enzyme scrub, bases de tratamento, óleos de cutículas e reparação com vitaminas.",
  },
  {
    path: "/salons",
    name: "Encontrar um Salão",
    defaultTitle: "Encontre um Salão Bio Sculpture",
    defaultDescription: "Localize salões certificados Bio Sculpture perto de si.",
  },
  {
    path: "/salons/[id]",
    name: "Detalhe do salão",
    isDynamic: true,
    defaultTitle: "{salonName} | Salão Bio Sculpture",
    defaultDescription: "Perfil, localização e serviços deste parceiro Bio Sculpture.",
  },
  {
    path: "/builders",
    name: "Construtores (secção)",
    isDynamic: true,
    defaultTitle: "Colour Builder Gel | Bio Sculpture",
    defaultDescription: "Compre Colour Builder Gel e sistemas construtores Bio Sculpture.",
  },
  {
    path: "/blog",
    name: "BIO News",
    defaultTitle: "BIO News | Bio Sculpture",
    defaultDescription: "Notícias da indústria das unhas, novidades de produtos e insights Bio Sculpture.",
  },
  {
    path: "/blog/[slug]",
    name: "Artigo BIO News",
    isDynamic: true,
    defaultTitle: "{postTitle} | BIO News",
    defaultDescription: "Leia este artigo na BIO News by Bio Sculpture.",
  },
  {
    path: "/contact",
    name: "Contacto",
    defaultTitle: "Contacto | Bio Sculpture",
    defaultDescription: "Contacte a Bio Sculpture para questões sobre produtos e formação.",
  },
  {
    path: "/about",
    name: "Sobre",
    defaultTitle: "Sobre a Bio Sculpture",
    defaultDescription: "Conheça a missão, a herança e o cuidado profissional de unhas da Bio Sculpture.",
  },
  {
    path: "/about/biosculpture",
    name: "Sobre — Bio Sculpture",
    defaultTitle: "A Nossa História | Bio Sculpture",
    defaultDescription: "A história da marca Bio Sculpture e o compromisso com unhas saudáveis.",
  },
  {
    path: "/training",
    name: "Formação",
    defaultTitle: "Formação de Unhas | Bio Sculpture",
    defaultDescription: "Cursos profissionais e programas de certificação Bio Sculpture.",
  },
  {
    path: "/training/[id]",
    name: "Programa de formação",
    isDynamic: true,
    defaultTitle: "{trainingName} | Formação Bio Sculpture",
    defaultDescription: "Detalhes, datas e inscrição neste curso Bio Sculpture.",
  },
  {
    path: "/privacy",
    name: "Política de Privacidade",
    defaultTitle: "Política de Privacidade | Bio Sculpture",
    defaultDescription: "Como a Bio Sculpture recolhe, utiliza e protege os seus dados pessoais.",
  },
  {
    path: "/terms-and-returns",
    name: "Termos e Devoluções",
    defaultTitle: "Termos e Devoluções | Bio Sculpture",
    defaultDescription: "Condições de venda, política de devoluções e informação ao cliente Bio Sculpture.",
  },
  {
    path: "/cookies",
    name: "Política de Cookies",
    defaultTitle: "Política de Cookies | Bio Sculpture",
    defaultDescription: "Informação sobre os cookies utilizados no website Bio Sculpture.",
  },
  {
    path: "/complaints-book",
    name: "Livro de Reclamações",
    defaultTitle: "Livro de Reclamações | Bio Sculpture",
    defaultDescription: "Submeta uma reclamação ou feedback à Bio Sculpture.",
  },
  {
    path: "/consumer-dispute-resolution",
    name: "Resolução de Litígios de Consumo",
    defaultTitle: "Resolução de Litígios de Consumo | Bio Sculpture",
    defaultDescription: "Informação sobre resolução de litígios de consumo para clientes Bio Sculpture.",
  },
  {
    path: "/find-your-salon",
    name: "Encontre o Seu Salão",
    defaultTitle: "Encontre o Seu Salão | Bio Sculpture",
    defaultDescription: "Descubra um salão Bio Sculpture para a sua próxima marcação.",
  },
  {
    path: "/nail-diagnostics",
    name: "Diagnóstico de Unhas",
    defaultTitle: "Diagnóstico de Unhas | Bio Sculpture",
    defaultDescription: "Analise as suas unhas com as ferramentas de diagnóstico Bio Sculpture.",
  },
  {
    path: "/ethos/nail-diagnosis",
    name: "Cuidados das Unhas — Diagnóstico",
    defaultTitle: "Diagnóstico de Unhas | Bio Sculpture Cuidados das Unhas",
    defaultDescription: "Utilize o diagnóstico Cuidados das Unhas Bio Sculpture para compreender a saúde das suas unhas.",
  },
  {
    path: "/diagnosis",
    name: "Diagnóstico",
    defaultTitle: "Diagnóstico de Unhas | Bio Sculpture",
    defaultDescription: "Inicie o questionário de diagnóstico de saúde das unhas Bio Sculpture.",
  },
  {
    path: "/diagnosis/results",
    name: "Resultados do Diagnóstico",
    defaultTitle: "Resultados do Diagnóstico | Bio Sculpture",
    defaultDescription: "Veja os resultados personalizados e recomendações do seu diagnóstico Bio Sculpture.",
  },
  {
    path: "/orders/[id]",
    name: "Detalhe da encomenda",
    isDynamic: true,
    defaultTitle: "Encomenda | Bio Sculpture",
    defaultDescription: "Consulte o estado e os detalhes da sua encomenda Bio Sculpture.",
  },
  {
    path: "/checkout/payment-return",
    name: "Retorno de Pagamento",
    defaultTitle: "Confirmação de Pagamento | Bio Sculpture",
    defaultDescription: "Página de confirmação de pagamento da sua compra Bio Sculpture.",
  },
];

export function findRouteDefinition(path: string) {
  return SITE_ROUTE_DEFINITIONS.find((r) => r.path === path);
}

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const SAMPLE_IMAGES = [
  "/blog-hero-custom.png",
  "/home-main-hero-v28.png",
  "/kits-treino-hero-custom.png",
  "/colours-hero-badge.png",
  "/hero-builder-hush.png",
  "/hero-builder-petal.png",
  "/hero-builder-peony.png",
];

const POSTS = [
  {
    title: "Colour Builder Gel: quatro novos tons para a estação",
    slug: "colour-builder-gel-quatro-novos-tons",
    excerpt:
      "Hush, Petal, Peony e Ballet chegam à coleção — cor e construção num só passo, com a fórmula com infusão de fibras Bio Sculpture.",
    author: "Equipa Bio Sculpture",
    daysAgo: 1,
  },
  {
    title: "Como preparar a unha natural antes de qualquer serviço de gel",
    slug: "preparar-unha-natural-servico-gel",
    excerpt:
      "A preparação correta é a base de qualquer manicure duradoura. Guia prático para profissionais certificados.",
    author: "Maria Santos",
    daysAgo: 3,
  },
  {
    title: "HEMA-free: o que significa e porque importa ao cliente",
    slug: "hema-free-o-que-significa",
    excerpt:
      "Cada vez mais clientes procuram sistemas mais suaves. Explicamos a diferença e como comunicar os benefícios no salão.",
    author: "Equipa Bio Sculpture",
    daysAgo: 5,
  },
  {
    title: "Tendências de nail art para outono-inverno 2026",
    slug: "tendencias-nail-art-outono-inverno-2026",
    excerpt:
      "Dos nudes sofisticados aos brilhos discretos — as inspirações que estão a dominar os salões em Portugal.",
    author: "Inês Ferreira",
    daysAgo: 8,
  },
  {
    title: "Kit Experiência: formação online incluída na compra",
    slug: "kit-experiencia-formacao-online",
    excerpt:
      "O novo kit de entrada na marca inclui acesso gratuito à plataforma de formação Bio Sculpture durante 30 dias.",
    author: "Equipa Formação",
    daysAgo: 12,
  },
  {
    title: "Bio Diamond: o que distingue um salão certificado",
    slug: "bio-diamond-salao-certificado",
    excerpt:
      "Salões Bio Diamond utilizam estritamente produtos e técnicas Bio Sculpture. Saiba como encontrar o mais perto de si.",
    author: "Equipa Bio Sculpture",
    daysAgo: 15,
  },
  {
    title: "Cinco erros comuns na aplicação de gel de construção",
    slug: "cinco-erros-aplicacao-gel-construcao",
    excerpt:
      "Espessura irregular, polimerização insuficiente e preparação incompleta — como evitar e corrigir no dia a dia.",
    author: "Carla Mendes",
    daysAgo: 18,
  },
];

function articleBody(title) {
  return `<p>${title} — conteúdo de demonstração para BIO News.</p><p>A Bio Sculpture desenvolve sistemas profissionais de gel saudáveis, vegan e cruelty free, pensados para terapeutas de unhas que exigem resultados duradouros e clientes satisfeitas.</p><p>Neste artigo abordamos as boas práticas, novidades de produto e tendências da indústria das unhas em Portugal e na Europa.</p><h2>Para profissionais</h2><p>Consulte a nossa formação certificada e descubra os salões Bio Diamond na sua zona através do localizador oficial.</p>`;
}

async function main() {
  const existing = await db.blog.findMany({
    select: { slug: true },
  });
  const existingSlugs = new Set(existing.map((b) => b.slug));

  let created = 0;
  for (let i = 0; i < POSTS.length; i++) {
    const post = POSTS[i];
    if (existingSlugs.has(post.slug)) {
      console.log(`Skip (exists): ${post.slug}`);
      continue;
    }

    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - post.daysAgo);

    const image = SAMPLE_IMAGES[i % SAMPLE_IMAGES.length];

    await db.blog.create({
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: articleBody(post.title),
        author: post.author,
        image,
        heroImage: image,
        status: "PUBLISHED",
        publishedAt,
      },
    });

    created++;
    console.log(`Created: ${post.slug}`);
  }

  const total = await db.blog.count({ where: { status: "PUBLISHED" } });
  console.log(`Done. Created ${created} posts. Total published: ${total}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

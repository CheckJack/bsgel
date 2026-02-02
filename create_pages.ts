import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const pages = [
    {
      name: 'Política de Privacidade',
      slug: 'privacy',
      content: '<h1>Política de Privacidade</h1><p>Conteúdo em breve...</p>',
      status: 'PUBLISHED'
    },
    {
      name: 'Condições de Venda e Devoluções',
      slug: 'terms-and-returns',
      content: '<h1>Condições de Venda e Devoluções</h1><p>Conteúdo em breve...</p>',
      status: 'PUBLISHED'
    },
    {
      name: 'Resolução de Litígios de Consumo',
      slug: 'consumer-dispute-resolution',
      content: '<h1>Resolução de Litígios de Consumo</h1><p>Conteúdo em breve...</p>',
      status: 'PUBLISHED'
    },
    {
      name: 'Livro de Reclamações',
      slug: 'complaints-book',
      content: '<h1>Livro de Reclamações</h1><p>Conteúdo em breve...</p>',
      status: 'PUBLISHED'
    }
  ];

  for (const page of pages) {
    const existing = await prisma.page.findUnique({
      where: { slug: page.slug }
    });

    if (!existing) {
      await prisma.page.create({
        data: page as any
      });
      console.log(`Created page: ${page.name}`);
    } else {
      console.log(`Page already exists: ${page.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

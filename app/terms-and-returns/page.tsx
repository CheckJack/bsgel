"use client";

import { useLanguage } from "@/contexts/language-context";

export default function TermsAndReturnsPage() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">{t("footer.termsOfService")}</h1>
      <div className="prose prose-slate max-w-none">
        <p className="text-lg text-gray-600 mb-6">
          Estas são as nossas Condições de Venda e Devoluções. O conteúdo detalhado será atualizado em breve.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Condições de Venda</h2>
        <p>Todos os produtos estão sujeitos a disponibilidade e confirmação do preço do pedido.</p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">2. Política de Devoluções</h2>
        <p>Tem o direito de devolver os produtos num prazo determinado de acordo com a legislação em vigor.</p>
      </div>
    </div>
  );
}

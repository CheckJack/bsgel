"use client";

import { useLanguage } from "@/contexts/language-context";

export default function ComplaintsBookPage() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">{t("footer.complaintsBook")}</h1>
      <div className="prose prose-slate max-w-none">
        <p className="text-lg text-gray-600 mb-6">
          Acesso ao Livro de Reclamações Eletrónico.
        </p>
        <p>Pode aceder ao Livro de Reclamações Eletrónico através do link oficial: <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.livroreclamacoes.pt</a></p>
      </div>
    </div>
  );
}

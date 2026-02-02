"use client";

import { useLanguage } from "@/contexts/language-context";

export default function ConsumerDisputeResolutionPage() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">{t("footer.shippingPolicy")}</h1>
      <div className="prose prose-slate max-w-none">
        <p className="text-lg text-gray-600 mb-6">
          Informações sobre Resolução de Litígios de Consumo. O conteúdo detalhado será atualizado em breve.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-4">Entidades de Resolução Alternativa de Litígios</h2>
        <p>Em caso de litígio, o consumidor pode recorrer a uma Entidade de Resolução Alternativa de Litígios de Consumo.</p>
      </div>
    </div>
  );
}

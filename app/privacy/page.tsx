"use client";

import { useLanguage } from "@/contexts/language-context";

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">{t("footer.privacyPolicy")}</h1>
      <div className="prose prose-slate max-w-none">
        <p className="text-lg text-gray-600 mb-6">
          Esta é a nossa Política de Privacidade. O conteúdo detalhado será atualizado em breve.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Recolha de Dados</h2>
        <p>Recolhemos informações para fornecer melhores serviços a todos os nossos utilizadores.</p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">2. Utilização de Informação</h2>
        <p>Utilizamos as informações que recolhemos de todos os nossos serviços para os fornecer, manter, proteger e melhorar.</p>
      </div>
    </div>
  );
}

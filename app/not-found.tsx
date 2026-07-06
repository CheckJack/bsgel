import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium tracking-wide text-brand-champagne mb-2">Erro 404</p>
        <h1 className="text-4xl sm:text-5xl font-semibold text-brand-black mb-3">
          Página não encontrada
        </h1>
        <p className="text-gray-600 mb-8">
          A página que procura não existe ou foi movida. Pode voltar para a página inicial.
        </p>
        <Link href="/" className="inline-flex">
          <Button className="bg-brand-black text-white hover:bg-brand-black/90">
            Ir para a página inicial
          </Button>
        </Link>
      </div>
    </div>
  );
}


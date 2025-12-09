'use client';

import ProductsDisplay from '@/components/ProductsDisplay';

export default function CardapioPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-red-600 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center">
            🍕 Pizzaria Zattera - Cardápio
          </h1>
          <p className="text-center mt-2 text-red-100">
            Produtos atualizados em tempo real com nosso sistema PDV
          </p>
        </div>
      </header>

      {/* Produtos */}
      <main className="py-8">
        <ProductsDisplay />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 Pizzaria Zattera - Todos os direitos reservados</p>
          <p className="text-sm text-gray-400 mt-2">
            Sistema integrado com PDV para garantir informações sempre atualizadas
          </p>
        </div>
      </footer>
    </div>
  );
}

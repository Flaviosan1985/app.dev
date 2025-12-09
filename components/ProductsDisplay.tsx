'use client';

import { useProducts } from '@/app/hooks/useSyncData';

export default function ProductsDisplay() {
  const { products, lastSync, loading, error } = useProducts(true, 5000); // Atualiza a cada 5 segundos

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  // Filtrar apenas produtos ativos e não-complementos
  const activeProducts = products.filter((p: any) => p.isActive && p.type !== 'complement');
  
  // Filtrar complementos (bordas)
  const complements = products.filter((p: any) => p.type === 'complement' && p.isActive);

  // Agrupar por categoria
  const categories: string[] = Array.from(new Set(activeProducts.map((p: any) => p.category)));

  return (
    <div className="container mx-auto p-4">
      {/* Status de Sincronização */}
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4 flex items-center justify-between">
        <span>
          <span className="font-bold">✓ Sincronizado com PDV</span>
        </span>
        {lastSync && (
          <span className="text-sm">
            Última atualização: {new Date(lastSync).toLocaleTimeString('pt-BR')}
          </span>
        )}
      </div>

      {/* Lista de Produtos por Categoria */}
      {categories.map((category: string) => {
        const categoryProducts = activeProducts.filter((p: any) => p.category === category);
        
        return (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 capitalize text-gray-800">
              {category}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryProducts.map((product: any) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-green-600">
                          R$ {product.price.toFixed(2)}
                        </span>
                        {product.priceSmall && (
                          <span className="text-sm text-gray-500 ml-2">
                            (Broto: R$ {product.priceSmall.toFixed(2)})
                          </span>
                        )}
                      </div>
                      
                      {product.isFeatured && (
                        <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                          Destaque
                        </span>
                      )}
                    </div>

                    {/* Mostrar complementos disponíveis para pizzas */}
                    {category === 'pizzas' && complements.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold mb-2">
                          Complementos disponíveis:
                        </p>
                        <div className="space-y-1">
                          {complements.map((comp: any) => (
                            <div key={comp.id} className="flex justify-between text-xs">
                              <span className="text-gray-600">{comp.name}</span>
                              <span className="text-purple-600 font-semibold">
                                {comp.price === 0 ? 'Grátis' : `+R$ ${comp.price.toFixed(2)}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {activeProducts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl">Nenhum produto disponível no momento</p>
          <p className="text-sm mt-2">Aguardando sincronização com o PDV...</p>
        </div>
      )}
    </div>
  );
}

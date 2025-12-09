import { useState } from 'react';
import { Product, PizzaFlavor, CartItemPizza } from '../types';

interface PizzaSelectorProps {
  pizzas: Product[];
  complements: Product[];
  onAdd: (item: CartItemPizza) => void;
  onClose: () => void;
}

export default function PizzaSelector({ pizzas, complements, onAdd, onClose }: PizzaSelectorProps) {
  const [pizzaType, setPizzaType] = useState<'inteira' | 'meio-a-meio' | '1/3'>('inteira');
  const [size, setSize] = useState<'grande' | 'broto'>('grande');
  const [selectedFlavors, setSelectedFlavors] = useState<Product[]>([]);
  const [selectedComplements, setSelectedComplements] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const maxFlavors = pizzaType === 'inteira' ? 1 : pizzaType === 'meio-a-meio' ? 2 : 3;

  const filteredPizzas = pizzas.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    p.category === 'pizzas'
  );

  const toggleFlavor = (pizza: Product) => {
    if (selectedFlavors.find(f => f.id === pizza.id)) {
      setSelectedFlavors(selectedFlavors.filter(f => f.id !== pizza.id));
    } else if (selectedFlavors.length < maxFlavors) {
      setSelectedFlavors([...selectedFlavors, pizza]);
    }
  };

  const calculatePrice = (): number => {
    if (selectedFlavors.length === 0) return 0;
    
    const prices = selectedFlavors.map(f => size === 'grande' ? f.price : (f.priceSmall || f.price));
    const maxPrice = Math.max(...prices);
    const complementsTotal = selectedComplements.reduce((sum, c) => sum + c.price, 0);
    
    return maxPrice + complementsTotal;
  };

  const toggleComplement = (complement: Product) => {
    if (selectedComplements.find(c => c.id === complement.id)) {
      setSelectedComplements([]);
    } else {
      setSelectedComplements([complement]);
    }
  };

  const handleAdd = () => {
    if (selectedFlavors.length === 0) {
      alert('Selecione pelo menos um sabor');
      return;
    }

    if (pizzaType !== 'inteira' && selectedFlavors.length < maxFlavors) {
      alert(`Selecione ${maxFlavors} sabores para ${pizzaType}`);
      return;
    }

    const fraction = pizzaType === 'inteira' ? 1 : pizzaType === 'meio-a-meio' ? 0.5 : 0.33;
    
    const pizzaItem: CartItemPizza = {
      id: Date.now().toString(),
      type: pizzaType,
      size,
      flavors: selectedFlavors.map(product => ({ product, fraction })),
      price: calculatePrice(),
      quantity: 1,
      complements: selectedComplements.length > 0 ? [selectedComplements[0]] : undefined
    };

    onAdd(pizzaItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="material-icons-round text-4xl">local_pizza</span>
              Monte sua Pizza
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <span className="material-icons-round">close</span>
            </button>
          </div>

          {/* Tipo de Pizza */}
          <div className="flex gap-3">
            <button
              onClick={() => { setPizzaType('inteira'); setSelectedFlavors([]); }}
              className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                pizzaType === 'inteira'
                  ? 'bg-white text-green-600 shadow-lg scale-105'
                  : 'bg-green-800 text-white hover:bg-green-700'
              }`}
            >
              <div className="text-lg">Pizza Inteira</div>
              <div className="text-sm opacity-80">1 sabor</div>
            </button>
            <button
              onClick={() => { setPizzaType('meio-a-meio'); setSelectedFlavors([]); }}
              className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                pizzaType === 'meio-a-meio'
                  ? 'bg-white text-green-600 shadow-lg scale-105'
                  : 'bg-green-800 text-white hover:bg-green-700'
              }`}
            >
              <div className="text-lg">Meio a Meio</div>
              <div className="text-sm opacity-80">2 sabores</div>
            </button>
            <button
              onClick={() => { setPizzaType('1/3'); setSelectedFlavors([]); }}
              className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                pizzaType === '1/3'
                  ? 'bg-white text-green-600 shadow-lg scale-105'
                  : 'bg-green-800 text-white hover:bg-green-700'
              }`}
            >
              <div className="text-lg">Pizza 1/3</div>
              <div className="text-sm opacity-80">3 sabores</div>
            </button>
          </div>

          {/* Tamanho */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setSize('grande')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                size === 'grande'
                  ? 'bg-white text-green-600 shadow-lg'
                  : 'bg-green-800 text-white hover:bg-green-700'
              }`}
            >
              <span className="material-icons-round">panorama_fish_eye</span> GRANDE
            </button>
            <button
              onClick={() => setSize('broto')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                size === 'broto'
                  ? 'bg-white text-green-600 shadow-lg'
                  : 'bg-green-800 text-white hover:bg-green-700'
              }`}
            >
              <span className="material-icons-round">adjust</span> BROTO
            </button>
          </div>
        </div>

        {/* Busca */}
        <div className="p-4 bg-gray-800">
          <div className="relative">
            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar sabor..."
              className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Sabores Selecionados */}
        {selectedFlavors.length > 0 && (
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              <span className="material-icons-round text-green-400">check_circle</span>
              Sabores Selecionados ({selectedFlavors.length}/{maxFlavors})
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedFlavors.map(flavor => (
                <div
                  key={flavor.id}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold"
                >
                  <span>{flavor.name}</span>
                  <button
                    onClick={() => toggleFlavor(flavor)}
                    className="hover:bg-green-700 rounded p-1 transition-colors"
                  >
                    <span className="material-icons-round text-sm">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção de Complementos */}
        {complements.length > 0 && (
          <div className="px-6 py-4 bg-gray-800 border-b border-gray-700">
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <span className="material-icons-round text-purple-400">add_circle</span>
              Complementos (Opcional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {complements.map(complement => {
                const isSelected = selectedComplements.find(c => c.id === complement.id);
                return (
                  <button
                    key={complement.id}
                    onClick={() => toggleComplement(complement)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500'
                        : 'bg-gray-700 border-gray-600 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'bg-purple-600 border-purple-500' : 'border-gray-500'
                        }`}>
                          {isSelected && (
                            <span className="material-icons-round text-white text-xs">check</span>
                          )}
                        </div>
                        <span className="text-white font-semibold">{complement.name}</span>
                      </div>
                      <span className={`font-bold ${
                        complement.price === 0 ? 'text-green-400' : 'text-white'
                      }`}>
                        {complement.price === 0 ? 'Grátis' : `+R$ ${complement.price.toFixed(2)}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Grid de Sabores */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPizzas.map(pizza => {
              const isSelected = selectedFlavors.find(f => f.id === pizza.id);
              const price = size === 'grande' ? pizza.price : (pizza.priceSmall || pizza.price);
              
              return (
                <button
                  key={pizza.id}
                  onClick={() => toggleFlavor(pizza)}
                  disabled={!isSelected && selectedFlavors.length >= maxFlavors}
                  className={`rounded-xl overflow-hidden transition-all ${
                    isSelected
                      ? 'ring-4 ring-green-400 shadow-lg shadow-green-400/50'
                      : selectedFlavors.length >= maxFlavors
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:ring-2 hover:ring-green-500 shadow-lg'
                  }`}
                >
                  <div className="aspect-square bg-gray-700 relative">
                    <img
                      src={pizza.image}
                      alt={pizza.name}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-green-500/40 flex items-center justify-center">
                        <span className="material-icons-round text-white text-6xl">
                          check_circle
                        </span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-lg font-bold text-sm">
                      R$ {price.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-gray-700 p-3 text-left">
                    <h4 className="text-white font-bold text-sm">{pizza.name}</h4>
                    <p className="text-gray-300 text-xs mt-1 line-clamp-2">{pizza.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer - Resumo e Adicionar */}
        <div className="bg-gray-900 p-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="text-white">
              <div className="text-sm text-gray-400">
                {pizzaType === 'inteira' && 'Pizza Inteira'}
                {pizzaType === 'meio-a-meio' && 'Meio a Meio'}
                {pizzaType === '1/3' && 'Pizza 1/3'}
                {' • '}
                {size === 'grande' ? 'Grande' : 'Broto'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {pizzaType !== 'inteira' && '💡 Valor cobrado: sabor mais caro'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Total</div>
              <div className="text-3xl font-bold text-green-400">
                R$ {calculatePrice().toFixed(2)}
              </div>
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={selectedFlavors.length === 0 || (pizzaType !== 'inteira' && selectedFlavors.length < maxFlavors)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
          >
            <span className="material-icons-round">add_shopping_cart</span>
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
}

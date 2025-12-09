import { useState, useEffect, useRef } from 'react';
import { Customer } from '../types';

interface CustomerAutocompleteProps {
  onSelectCustomer: (customer: Customer) => void;
  currentPhone?: string;
  currentName?: string;
}

export default function CustomerAutocomplete({ 
  onSelectCustomer, 
  currentPhone = '',
  currentName = ''
}: CustomerAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (currentPhone) {
      setSearchTerm(currentPhone);
    } else if (currentName) {
      setSearchTerm(currentName);
    }
  }, [currentPhone, currentName]);

  useEffect(() => {
    // Fechar dropdown ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCustomers = async () => {
    try {
      const customersData = await window.electronAPI.customers.getAll();
      // Ordenar por última compra (mais recentes primeiro)
      const sorted = customersData.sort((a, b) => {
        const dateA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
        const dateB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
        return dateB - dateA;
      });
      setCustomers(sorted);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setSelectedIndex(-1);

    if (value.length < 2) {
      setFilteredCustomers([]);
      setShowDropdown(false);
      return;
    }

    const searchLower = value.toLowerCase();
    const filtered = customers.filter(customer => 
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone.includes(value) ||
      customer.address?.toLowerCase().includes(searchLower)
    ).slice(0, 10); // Limitar a 10 resultados

    setFilteredCustomers(filtered);
    setShowDropdown(filtered.length > 0);
  };

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setSearchTerm(customer.name);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredCustomers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredCustomers.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectCustomer(filteredCustomers[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          search
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (filteredCustomers.length > 0) setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar por nome, telefone ou endereço..."
          className="w-full pl-12 pr-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilteredCustomers([]);
              setShowDropdown(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <span className="material-icons-round">close</span>
          </button>
        )}
      </div>

      {/* Dropdown de Resultados */}
      {showDropdown && filteredCustomers.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-2xl max-h-96 overflow-y-auto custom-scrollbar">
          <div className="p-2">
            <div className="text-xs text-gray-400 px-3 py-2 flex items-center gap-2">
              <span className="material-icons-round text-sm">history</span>
              {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''} encontrado{filteredCustomers.length !== 1 ? 's' : ''}
            </div>
            {filteredCustomers.map((customer, index) => (
              <button
                key={customer.id}
                onClick={() => handleSelectCustomer(customer)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  index === selectedIndex
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-600 text-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-icons-round text-sm text-blue-400">
                        person
                      </span>
                      <span className="font-bold">{customer.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="material-icons-round text-xs">phone</span>
                      <span>{customer.phone}</span>
                    </div>
                    
                    {customer.address && (
                      <div className="flex items-start gap-2 text-sm text-gray-300 mt-1">
                        <span className="material-icons-round text-xs mt-0.5">location_on</span>
                        <span className="line-clamp-2">{customer.address}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      {customer.orderHistory.length > 0 && (
                        <span className="text-green-400 flex items-center gap-1">
                          <span className="material-icons-round text-xs">shopping_bag</span>
                          {customer.orderHistory.length} pedido{customer.orderHistory.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {customer.totalSpent > 0 && (
                        <span className="text-yellow-400 flex items-center gap-1">
                          <span className="material-icons-round text-xs">payments</span>
                          R$ {customer.totalSpent.toFixed(2)}
                        </span>
                      )}
                      {customer.lastOrderDate && (
                        <span className="text-gray-400 flex items-center gap-1">
                          <span className="material-icons-round text-xs">schedule</span>
                          {new Date(customer.lastOrderDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <span className="material-icons-round text-blue-400">
                    arrow_forward
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem quando não encontrar */}
      {showDropdown && searchTerm.length >= 2 && filteredCustomers.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-2xl p-4">
          <div className="text-center text-gray-400">
            <span className="material-icons-round text-3xl mb-2">person_search</span>
            <p className="text-sm">Nenhum cliente encontrado</p>
            <p className="text-xs mt-1">Tente buscar por nome, telefone ou endereço</p>
          </div>
        </div>
      )}
    </div>
  );
}

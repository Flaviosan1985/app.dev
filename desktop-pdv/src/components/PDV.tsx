import { useState, useEffect } from 'react';
import { Product, User, CartItemPizza, Customer } from '../types';
import PizzaSelector from './PizzaSelector';
import CustomerAutocomplete from './CustomerAutocomplete';

interface CartItem {
  product: Product;
  quantity: number;
  size?: 'grande' | 'broto';
  observation?: string;
  complements?: Product[]; // Array de complementos adicionados
}

type CartEntry = CartItem | CartItemPizza;

interface PDVProps {
  currentUser: User;
  deliveryType: 'pickup' | 'delivery';
  onCartChange: (hasItems: boolean) => void;
  clientModalTrigger?: number;
}

export default function PDV({ currentUser, deliveryType, onCartChange, clientModalTrigger }: PDVProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [addressReference, setAddressReference] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showPizzaSelector, setShowPizzaSelector] = useState(false);
  const [showComplementModal, setShowComplementModal] = useState(false);
  const [selectedProductForComplement, setSelectedProductForComplement] = useState<Product | null>(null);
  const [selectedComplements, setSelectedComplements] = useState<Product[]>([]);
  const [editingCartItemIndex, setEditingCartItemIndex] = useState<number | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('Dinheiro');
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [cashChange, setCashChange] = useState<number>(0);
  const [orderObservation, setOrderObservation] = useState<string>('');
  const [itemParaObs, setItemParaObs] = useState<{ index: number; item: CartEntry } | null>(null);
  const [obsTemp, setObsTemp] = useState<string>('');
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'value'>('none');
  const [discountAmount, setDiscountAmount] = useState<string>('');
  const [serviceCharge, setServiceCharge] = useState<boolean>(false);
  const [serviceChargePercent, setServiceChargePercent] = useState<number>(10);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState<string>('');
  const itemsPerPage = 12;

  useEffect(() => {
    loadData();
    
    // LISTENER PARA RECARREGAR PRODUTOS QUANDO CACHE FOR INVALIDADO
    if (window.electronAPI.data.onCacheInvalidated) {
      window.electronAPI.data.onCacheInvalidated((data: any) => {
        if (data.entity === 'products') {
          console.log('🔔 PDV - Cache de produtos invalidado, recarregando...');
          loadData();
        }
      });
    }
  }, []);

  // Escutar evento para abrir modal de cliente
  useEffect(() => {
    if (clientModalTrigger && clientModalTrigger > 0) {
      setShowClientModal(true);
    }
  }, [clientModalTrigger]);

  useEffect(() => {
    onCartChange(cart.length > 0);
  }, [cart, onCartChange]);

  // 🚨 Monitorar mudança de tipo de entrega
  useEffect(() => {
    // Se mudar de delivery para retirada, remover taxa de entrega
    if (deliveryType === 'pickup') {
      removeDeliveryFeeFromCart();
      console.log('🔄 Mudou para RETIRADA - Taxa de entrega removida');
    }
  }, [deliveryType]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) prepareOrder();
      }
      if (e.key === 'F3') {
        e.preventDefault();
        clearCart();
      }
      if (e.key === 'F4') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart]);

  const loadData = async () => {
    try {
      // FORÇAR RELOAD - Ignorar qualquer cache local ou HTTP
      const response = await window.electronAPI.products.getAll();
      const productsData = response.data || response; // Compatibilidade com novo formato
      const activeProducts = productsData.filter((p: any) => p.isActive);
      
      setProducts(activeProducts);
      console.log('🔄 PDV - Produtos recarregados:', activeProducts.length, 'ativos de', productsData.length, 'totais');
    } catch (error) {
      console.error('❌ PDV - Erro ao carregar dados:', error);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 💰 BUSCAR TAXA DE ENTREGA POR BAIRRO
  // ═══════════════════════════════════════════════════════════════
  const getDeliveryFee = async (neighborhoodName: string): Promise<number> => {
    try {
      const neighborhoods = await window.electronAPI.neighborhoods.getAll();
      const neighborhood = neighborhoods.find(
        (n: any) => n.name.toLowerCase() === neighborhoodName.toLowerCase()
      );
      return neighborhood?.deliveryFee || 0;
    } catch (error) {
      console.error('Erro ao buscar taxa de entrega:', error);
      return 0;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🚚 ADICIONAR TAXA DE ENTREGA AO CARRINHO
  // ═══════════════════════════════════════════════════════════════
  const addDeliveryFeeToCart = async (neighborhoodName: string) => {
    // Remover taxa de entrega anterior (se existir)
    removeDeliveryFeeFromCart();

    // Se não for delivery, não adiciona taxa
    if (deliveryType !== 'delivery') {
      return;
    }

    // Buscar taxa do bairro
    const fee = await getDeliveryFee(neighborhoodName);
    
    if (fee > 0) {
      // Criar produto fictício para taxa de entrega
      const deliveryFeeProduct: Product = {
        id: 'DELIVERY_FEE',
        name: `Taxa de Entrega: ${neighborhoodName}`,
        description: 'Taxa de entrega para o bairro selecionado',
        price: fee,
        category: 'taxa-entrega',
        image: '',
        isActive: true,
        isFeatured: false,
        stock: 999,
        preparationTime: 0,
        type: 'product'
      };

      // Adicionar ao carrinho
      const deliveryFeeItem: CartItem = {
        product: deliveryFeeProduct,
        quantity: 1
      };

      setCart(prev => [...prev, deliveryFeeItem]);
      setDeliveryFee(fee);
      setDeliveryNeighborhood(neighborhoodName);
      
      console.log(`✅ Taxa de entrega adicionada: R$ ${fee.toFixed(2)} (${neighborhoodName})`);
    } else {
      console.log(`ℹ️ Sem taxa de entrega para o bairro: ${neighborhoodName}`);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // ❌ REMOVER TAXA DE ENTREGA DO CARRINHO
  // ═══════════════════════════════════════════════════════════════
  const removeDeliveryFeeFromCart = () => {
    setCart(prev => prev.filter(item => {
      if ('product' in item) {
        return item.product.id !== 'DELIVERY_FEE';
      }
      return true;
    }));
    setDeliveryFee(0);
    setDeliveryNeighborhood('');
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const addToCart = (product: Product) => {
    // Se for pizza, abrir painel de montar pizza (pizzas fracionadas)
    if (product.category === 'pizzas' || product.category === 'pizzas-broto') {
      setShowPizzaSelector(true);
      return;
    }

    // Produto normal - sem complementos por enquanto para produtos simples
    const existingItem = cart.find(item => 
      'product' in item && item.product.id === product.id
    ) as CartItem | undefined;
    
    if (existingItem) {
      setCart(cart.map(item =>
        'product' in item && item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const addProductWithComplements = () => {
    if (!selectedProductForComplement) return;
    
    if (editingCartItemIndex !== null) {
      // Editando complementos de item existente
      setCart(cart.map((item, idx) => {
        if (idx === editingCartItemIndex && 'product' in item) {
          return { ...item, complements: selectedComplements.length > 0 ? [selectedComplements[0]] : [] };
        }
        return item;
      }));
      setEditingCartItemIndex(null);
    } else {
      // Adicionando novo item
      setCart([...cart, { 
        product: selectedProductForComplement, 
        quantity: 1,
        complements: selectedComplements.length > 0 ? [selectedComplements[0]] : []
      }]);
    }
    
    setShowComplementModal(false);
    setSelectedProductForComplement(null);
    setSelectedComplements([]);
  };

  const openComplementsForCartItem = (index: number, item: CartEntry) => {
    // Para produto normal
    if ('product' in item) {
      setSelectedProductForComplement(item.product);
      setSelectedComplements(item.complements || []);
      setEditingCartItemIndex(index);
      setShowComplementModal(true);
    }
    // Para pizza fracionada, usar o primeiro sabor como referência
    else if ('flavors' in item && item.flavors.length > 0) {
      setSelectedProductForComplement(item.flavors[0].product);
      setSelectedComplements(item.complements || []);
      setEditingCartItemIndex(index);
      setShowComplementModal(true);
    }
  };

  const addPizzaToCart = (pizzaItem: CartItemPizza) => {
    setCart([...cart, pizzaItem]);
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => {
      if ('product' in item) {
        return item.product.id !== itemId;
      } else {
        return item.id !== itemId;
      }
    }));
  };

  const adicionarObsItem = (index: number, obs: string) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, observation: obs };
      }
      return item;
    }));
  };

  const removeObsItem = (index: number) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, observation: undefined };
      }
      return item;
    }));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(item => {
        if ('product' in item && item.product.id === itemId) {
          return { ...item, quantity };
        } else if ('id' in item && item.id === itemId) {
          return { ...item, quantity };
        }
        return item;
      }));
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      if ('product' in item) {
        const productTotal = item.product.price * item.quantity;
        const complementsTotal = (item.complements || []).reduce(
          (sum, complement) => sum + complement.price, 0
        ) * item.quantity;
        return total + productTotal + complementsTotal;
      } else {
        return total + (item.price * item.quantity);
      }
    }, 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (discountType === 'percent') {
      return (subtotal * (parseFloat(discountAmount) || 0)) / 100;
    } else if (discountType === 'value') {
      return parseFloat(discountAmount) || 0;
    }
    return 0;
  };

  const calculateServiceCharge = () => {
    if (!serviceCharge) return 0;
    const subtotal = calculateSubtotal();
    return (subtotal * serviceChargePercent) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const service = calculateServiceCharge();
    return subtotal - discount + service;
  };

  const prepareOrder = async () => {
    if (cart.length === 0) {
      alert('Adicione produtos ao carrinho');
      return;
    }

    // 🔒 VERIFICAÇÃO OBRIGATÓRIA DE CAIXA ABERTO
    try {
      const currentCash = await window.electronAPI.cashRegister.getCurrent();
      if (!currentCash) {
        alert('⚠️ CAIXA FECHADO!\n\nVocê precisa abrir o caixa antes de realizar vendas.\n\nAcesse: Menu → Caixa → Abrir Caixa');
        return;
      }
    } catch (error) {
      console.error('Erro ao verificar caixa:', error);
      alert('Erro ao verificar status do caixa');
      return;
    }

    if (!customerName || !customerPhone) {
      alert('Preencha nome e telefone do cliente');
      return;
    }

    // Validação de endereço será feita no modal de checkout

    // Preparar dados do pedido
    const orderId = Date.now().toString();
    const total = calculateTotal();

    console.log('🔍 PrepareOrder - deliveryType:', deliveryType);
    console.log('🔍 PrepareOrder - deliveryAddress:', deliveryAddress);

    const orderData = {
      orderId,
      total,
      customerName,
      customerPhone,
      deliveryType,
      deliveryAddress,
      addressComplement,
      addressReference,
      cart,
      selectedCustomer,
      observation: orderObservation,
      discount: calculateDiscount(),
      discountType,
      serviceCharge: calculateServiceCharge()
    };

    setPendingOrder(orderData);
    setShowPaymentModal(true);
  };

  const handleFinalizeSale = async () => {
    if (!pendingOrder) return;

    // Validar endereço se for delivery
    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      alert('Preencha o endereço de entrega');
      return;
    }

    try {
      const { orderId, total, customerName, customerPhone, deliveryType, deliveryAddress, addressComplement, addressReference, cart, selectedCustomer } = pendingOrder;

      // Criar ou atualizar cliente
      if (!selectedCustomer) {
        // Cliente novo - criar
        const newCustomer: Customer = {
          id: Date.now().toString(),
          name: customerName,
          phone: customerPhone,
          address: deliveryAddress || undefined,
          addressDetails: deliveryType === 'delivery' && deliveryAddress ? {
            street: deliveryAddress.split(',')[0] || '',
            number: '',
            complement: addressComplement,
            neighborhood: '',
            city: '',
            state: '',
            zipCode: '',
            reference: addressReference
          } : undefined,
          orderHistory: [orderId],
          totalSpent: total,
          lastOrderDate: new Date().toISOString()
        };
        
        await window.electronAPI.customers.create(newCustomer);
      } else {
        // Cliente existente - atualizar
        const updatedCustomer: Customer = {
          ...selectedCustomer,
          name: customerName,
          phone: customerPhone,
          address: deliveryAddress || selectedCustomer.address,
          addressDetails: deliveryType === 'delivery' && deliveryAddress ? {
            ...(selectedCustomer.addressDetails || {
              street: '',
              number: '',
              neighborhood: '',
              city: '',
              state: '',
              zipCode: ''
            }),
            street: deliveryAddress.split(',')[0] || selectedCustomer.addressDetails?.street || '',
            complement: addressComplement || selectedCustomer.addressDetails?.complement,
            reference: addressReference || selectedCustomer.addressDetails?.reference
          } : selectedCustomer.addressDetails,
          orderHistory: [...selectedCustomer.orderHistory, orderId],
          totalSpent: selectedCustomer.totalSpent + total,
          lastOrderDate: new Date().toISOString()
        };
        
        await window.electronAPI.customers.update(selectedCustomer.id, updatedCustomer);
      }

      // Criar pedido
      const order = {
        id: orderId,
        customerName,
        customerPhone,
        items: cart,
        total,
        status: 'Pendente' as 'Pendente' | 'Preparando' | 'Pronto' | 'Entregue' | 'Cancelado',
        paymentMethod: paymentMethod,
        deliveryType: deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? {
          full: deliveryAddress,
          complement: addressComplement,
          reference: addressReference
        } : undefined,
        createdAt: new Date().toISOString()
      };

      await window.electronAPI.orders.create(order);
      
      // 💰 REGISTRAR VENDA NO CAIXA AUTOMATICAMENTE
      try {
        const currentCash = await window.electronAPI.cashRegister.getCurrent();
        if (currentCash) {
          await window.electronAPI.cashRegister.addTransaction(currentCash.id, {
            id: `sale-${orderId}`,
            type: 'sale',
            amount: total,
            description: `Venda #${orderId} - ${customerName} - ${paymentMethod}`,
            timestamp: new Date().toISOString()
          });
          console.log('✅ Venda registrada no caixa:', total);
        }
      } catch (error) {
        console.error('⚠️ Erro ao registrar venda no caixa:', error);
        // Não bloqueia a venda, apenas registra o erro
      }
      
      // Imprimir cupom
      const printResult = await window.electronAPI.printer.print(order);
      if (!printResult.success) {
        console.error('Erro ao imprimir:', (printResult as any).error);
        alert('Pedido salvo, mas houve erro na impressão: ' + ((printResult as any).error || 'Erro desconhecido'));
      }
      
      // Limpar carrinho e dados
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setAddressComplement('');
      setAddressReference('');
      setSelectedCustomer(null);
      setCashAmount('');
      setCashChange(0);
      setShowPaymentModal(false);
      setPendingOrder(null);
      setPaymentMethod('Dinheiro');
      setOrderObservation('');
      setDiscountType('none');
      setDiscountAmount('');
      setServiceCharge(false);

      alert(`Venda finalizada e cupom impresso!\nTotal: R$ ${total.toFixed(2)}\nTipo: ${deliveryType === 'delivery' ? 'Delivery' : 'Retirada'}`);

      // Chamar endpoints de automação (movimentação de caixa e WhatsApp)
      try {
        // Movimentação de caixa
        await fetch('/services/orderAutomationApi/caixa/movimentacao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pedidoId: orderId, valor: total, tipo: 'Venda Online' })
        });
        // Notificação WhatsApp
        await fetch('/services/orderAutomationApi/notificacao/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clienteNome: customerName,
            status: 'Pedido Pronto',
            tipoEntrega: deliveryType === 'delivery' ? 'Delivery' : 'Retirada',
            telefone: customerPhone
          })
        });
      } catch (err) {
        console.error('Erro na automação de pedido/WhatsApp:', err);
      }
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert('Erro ao finalizar venda');
    }
  };

  const clearCart = () => {
    if (confirm('Deseja limpar todo o carrinho?')) {
      setCart([]);
    }
  };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-gray-900">
      {/* Área Principal - Produtos (coluna flex) */}
      <div className="flex-1 min-w-0 flex flex-col bg-gray-800 overflow-hidden border-r border-gray-700">
        {/* Header com Categorias */}
        <div className="bg-gray-900 border-b border-gray-700 flex-shrink-0">
          {/* Barra de Categorias */}
          <div className="flex items-center gap-2 p-2 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              TODOS
            </button>
            <button
              onClick={() => { setSelectedCategory('refeicoes'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'refeicoes'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              REFEIÇÕES
            </button>
            <button
              onClick={() => { setSelectedCategory('bebidas'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'bebidas'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              BEBIDAS
            </button>
            <button
              onClick={() => { 
                setShowPizzaSelector(true);
              }}
              className="px-4 py-1.5 rounded text-sm font-semibold whitespace-nowrap transition-colors bg-green-600 text-white hover:bg-green-700"
            >
              🍕 MONTE SUA PIZZA
            </button>
            <button
              onClick={() => { setSelectedCategory('sucos'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'sucos'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              SUCOS
            </button>
            <button
              onClick={() => { setSelectedCategory('massas'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'massas'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              MASSAS
            </button>
            <button
              onClick={() => { setSelectedCategory('acai'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'acai'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              AÇAÍ
            </button>
            <button
              onClick={() => { setSelectedCategory('porcoes'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'porcoes'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              PORÇÕES
            </button>
          </div>

          {/* Busca */}
          <div className="p-2 border-t border-gray-700 flex-shrink-0">
            <div className="relative">
              <span className="material-icons-round absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Grid de Produtos */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 w-full">
            {displayedProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-gray-700 rounded overflow-hidden hover:ring-2 hover:ring-red-500 transition-all group shadow hover:shadow-red-500/50"
              >
                <div className="aspect-square bg-gray-600 relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {product.priceSmall ? (
                    <div className="absolute top-1 right-1 bg-red-600 text-white px-1 py-0.5 rounded text-[10px] font-bold shadow">
                      <div>G: {product.price.toFixed(2)}</div>
                      <div>B: {product.priceSmall.toFixed(2)}</div>
                    </div>
                  ) : (
                    <div className="absolute top-1 right-1 bg-red-600 text-white px-1.5 py-0.5 rounded text-xs font-bold shadow">
                      R$ {product.price.toFixed(2)}
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <h3 className="font-bold text-white text-sm line-clamp-2 min-h-[2rem] leading-tight">{product.name}</h3>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="bg-gray-900 border-t border-gray-700 p-3 flex items-center justify-center gap-2 flex-shrink-0">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <span className="material-icons-round">chevron_left</span>
            </button>
            <span className="text-white font-semibold">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <span className="material-icons-round">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* Painel Lateral - Carrinho Premium (largura fixa responsiva) */}
      <div className="min-w-[400px] w-[480px] max-w-[500px] h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col shadow-2xl border-l-4 border-green-600">
        {/* Header do Carrinho - Tema Italiano */}
        <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-3 flex-shrink-0 border-b-4 border-green-600 shadow-lg">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 via-white to-red-600"></div>
          <div className="flex items-center justify-between mt-1">
            <div>
              <h2 className="text-2xl font-black tracking-wide flex items-center gap-2">
                <span className="material-icons-round text-3xl text-green-400">shopping_basket</span>
                SEU CARRINHO
              </h2>
              <p className="text-sm text-gray-400 mt-1">Operador: {currentUser.name}</p>
            </div>
            <button
              onClick={clearCart}
              className="hover:bg-red-600 bg-red-700 p-3 rounded-lg transition-all transform hover:scale-105 shadow-md"
            >
              <span className="material-icons-round text-2xl">delete_sweep</span>
            </button>
          </div>
        </div>

        {/* Lista de Itens do Carrinho */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-gray-900">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <div className="bg-gray-800 rounded-full w-32 h-32 mx-auto flex items-center justify-center mb-6 border-4 border-gray-700">
                <span className="material-icons-round text-7xl text-gray-600">shopping_cart</span>
              </div>
              <p className="text-2xl font-bold text-gray-400">Carrinho Vazio</p>
              <p className="text-base mt-3 text-gray-500">Adicione produtos para começar seu pedido</p>
            </div>
          ) : (
            cart.map((item, index) => {
              // Item normal
              if ('product' in item) {
                return (
                  <div key={index} className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-4 shadow-lg border border-gray-600 hover:border-green-500 transition-all transform hover:scale-[1.02]">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-2xl leading-tight mb-2">{item.product.name}</h4>
                        {item.size && (
                          <span className="inline-block bg-gray-900 text-green-400 text-base px-3 py-1 rounded-full font-bold">Tam: {item.size === 'grande' ? 'Grande' : 'Broto'}</span>
                        )}
                        {item.complements && item.complements.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {item.complements.map((complement, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-purple-300 text-base">
                                <span className="material-icons-round text-sm">add_circle</span>
                                <span>{complement.name}</span>
                                {complement.price > 0 && (
                                  <span className="text-green-600 font-semibold">+R$ {complement.price.toFixed(2)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Observação por item (exibe para todos exceto bebidas) */}
                        {item.product.category !== 'bebidas' && (
                          item.observation ? (
                            <div className="mt-2 bg-blue-900/30 border border-blue-400 rounded-lg p-2 flex items-start justify-between">
                              <p className="text-sm text-blue-200 flex-1">
                                <strong>Obs:</strong> {item.observation}
                              </p>
                              <button
                                onClick={() => removeObsItem(index)}
                                className="text-red-400 hover:text-red-300 ml-2"
                              >
                                <span className="material-icons-round text-base">close</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setItemParaObs({ index, item })}
                              className="mt-2 flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors"
                            >
                              <span className="material-icons-round text-base">chat_bubble_outline</span>
                              Adicionar observação
                            </button>
                          )
                        )}

                        <p className="text-green-400 font-bold text-2xl mt-2">
                          R$ {(item.product.price + (item.complements || []).reduce((sum, c) => sum + c.price, 0)).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-900/30 p-1.5 rounded-lg transition-all"
                      >
                        <span className="material-icons-round text-xl">close</span>
                      </button>
                    </div>

                    {/* Botão Complemento para Pizzas */}
                    {item.product.category === 'pizzas' && (
                      <div className="mt-3">
                        <button
                          onClick={() => openComplementsForCartItem(index, item)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          <span className="material-icons-round text-lg">add_circle</span>
                          Complemento
                        </button>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 bg-gray-900 rounded-lg p-2 border border-gray-700">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-10 h-10 text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center transition-all transform hover:scale-110"
                        >
                          <span className="material-icons-round text-xl">remove</span>
                        </button>
                        <span className="text-white font-bold text-2xl w-14 text-center bg-gray-800 rounded px-3 py-2">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-10 h-10 text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center transition-all transform hover:scale-110"
                        >
                          <span className="material-icons-round text-xl">add</span>
                        </button>
                      </div>
                      <span className="text-white font-bold text-2xl bg-green-600/20 px-4 py-2 rounded-lg">
                        R$ {((item.product.price + (item.complements || []).reduce((sum, c) => sum + c.price, 0)) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              }
              
              // Pizza fracionada
              else {
                return (
                  <div key={index} className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-3 shadow-lg border-2 border-yellow-400 hover:border-yellow-300 transition-all transform hover:scale-[1.02]">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="material-icons-round text-yellow-300 text-xl">local_pizza</span>
                          <h4 className="font-bold text-white text-lg leading-tight">
                            Pizza {item.type === 'inteira' ? 'Inteira' : item.type === 'meio-a-meio' ? '1/2' : '3 Sabores'}
                          </h4>
                        </div>
                        <span className="inline-block bg-gray-900 text-yellow-400 text-sm px-2 py-0.5 rounded-full font-bold mb-1">
                          {item.size === 'grande' ? 'Grande' : 'Broto'}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {item.flavors.map((flavor, idx) => (
                            <div key={idx} className="text-white text-sm leading-tight font-medium">
                              • {flavor.product.name}
                            </div>
                          ))}
                        </div>
                        {item.complements && item.complements.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {item.complements.map((complement, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-purple-300 text-sm">
                                <span className="material-icons-round text-xs">add_circle</span>
                                <span>{complement.name}</span>
                                {complement.price > 0 && (
                                  <span className="text-purple-400 font-semibold">+R$ {complement.price.toFixed(2)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Observação por item */}
                        {item.observation ? (
                          <div className="mt-2 bg-blue-900/30 border border-blue-400 rounded-lg p-2 flex items-start justify-between">
                            <p className="text-xs text-blue-200 flex-1">
                              <strong>Obs:</strong> {item.observation}
                            </p>
                            <button
                              onClick={() => removeObsItem(index)}
                              className="text-red-400 hover:text-red-300 ml-2"
                            >
                              <span className="material-icons-round text-sm">close</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setItemParaObs({ index, item })}
                            className="mt-1 flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            <span className="material-icons-round text-sm">chat_bubble_outline</span>
                            Adicionar observação
                          </button>
                        )}

                        <p className="text-yellow-300 font-bold text-lg mt-1">
                          R$ {(item.price + (item.complements || []).reduce((sum, c) => sum + c.price, 0)).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-900/30 p-1 rounded-lg transition-all"
                      >
                        <span className="material-icons-round text-lg">close</span>
                      </button>
                    </div>

                    {/* Botão Complemento para Pizzas */}
                    <div className="mt-2">
                      <button
                        onClick={() => openComplementsForCartItem(index, item)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <span className="material-icons-round text-base">add_circle</span>
                        Complemento
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-1.5 border border-gray-700">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center transition-all transform hover:scale-110"
                        >
                          <span className="material-icons-round text-lg">remove</span>
                        </button>
                        <span className="text-white font-bold text-lg w-12 text-center bg-gray-800 rounded px-2 py-1">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center transition-all transform hover:scale-110"
                        >
                          <span className="material-icons-round text-lg">add</span>
                        </button>
                      </div>
                      <span className="text-white font-bold text-lg bg-green-600/20 px-3 py-1 rounded-lg">
                        R$ {((item.price + (item.complements || []).reduce((sum, c) => sum + c.price, 0)) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>

        {/* Rodapé Fixo - Totais, Controles e Botões de Ação */}
        <div className="flex-shrink-0 bg-gray-900 border-t-2 border-green-600">
          {/* Seção de Totais */}
          <div className="p-3 border-b border-gray-700">
            <div className="bg-gray-800 rounded-xl p-3 space-y-2 border-2 border-gray-700 shadow-lg">
              <div className="flex justify-between text-sm text-gray-300 pb-2 border-b border-gray-700">
                <span className="font-semibold">Subtotal:</span>
                <span className="font-bold">R$ {calculateSubtotal().toFixed(2)}</span>
              </div>
              
              {/* Desconto */}
              {calculateDiscount() > 0 && (
                <div className="flex justify-between text-sm text-red-400 bg-red-900/20 rounded-lg p-2">
                  <span className="font-semibold">Desconto {discountType === 'percent' ? `(${discountAmount}%)` : '(Fixo)'}:</span>
                  <span className="font-bold">- R$ {calculateDiscount().toFixed(2)}</span>
                </div>
              )}
              
              {/* Taxa de Serviço */}
              {serviceCharge && (
                <div className="flex justify-between text-sm text-blue-400 bg-blue-900/20 rounded-lg p-2">
                  <span className="font-semibold">Taxa Serviço ({serviceChargePercent}%):</span>
                  <span className="font-bold">+ R$ {calculateServiceCharge().toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t-2 border-green-600 pt-3 mt-2">
                <div className="flex justify-between items-center bg-green-600/20 rounded-lg p-3">
                  <span className="text-lg font-black text-white">TOTAL:</span>
                  <span className="text-3xl font-black text-green-400">R$ {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
            {/* Controles de Desconto e Taxa */}
            <div className="p-3 space-y-2 border-b border-gray-700">
              <div className="flex gap-2">
                <button
                  onClick={() => setDiscountType(discountType === 'percent' ? 'none' : 'percent')}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all transform hover:scale-105 ${
                    discountType === 'percent'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                  }`}
                >
                  DESC %
                </button>
                <button
                  onClick={() => setDiscountType(discountType === 'value' ? 'none' : 'value')}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all transform hover:scale-105 ${
                    discountType === 'value'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                  }`}
                >
                  DESC R$
                </button>
                <button
                  onClick={() => setServiceCharge(!serviceCharge)}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all transform hover:scale-105 ${
                    serviceCharge
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                  }`}
                >
                  +10%
                </button>
              </div>
              
              {discountType !== 'none' && (
                <input
                  type="number"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder={discountType === 'percent' ? 'Desconto %' : 'Valor R$'}
                  className="w-full px-3 py-2 text-base bg-gray-700 border-2 border-red-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 font-semibold transition-all"
                />
              )}
            </div>

            {/* Botões de Ação */}
            <div className="p-4 space-y-3">
            {/* Botão único grande: FINALIZAR PEDIDO */}
            <button
              onClick={prepareOrder}
              disabled={cart.length === 0}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-6 rounded-xl text-2xl font-black transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-2xl border-2 border-green-400 disabled:border-gray-600"
            >
              <span className="material-icons-round text-4xl">shopping_cart_checkout</span>
              <span>SEGUIR PARA PAGAMENTO<span className="text-base opacity-75 ml-2">(F2)</span></span>
            </button>
            {/* Botão Despachar Pedido */}
            <button
              onClick={async () => {
                if (!pendingOrder) return;
                // Atualizar status para 'Pedido Pronto' (simulação)
                // Chamar endpoints de automação
                try {
                  await fetch('/services/orderAutomationApi/caixa/movimentacao', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pedidoId: pendingOrder.orderId, valor: pendingOrder.total, tipo: 'Venda Online' })
                  });
                  await fetch('/services/orderAutomationApi/notificacao/whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      clienteNome: pendingOrder.customerName,
                      status: 'Pedido Pronto',
                      tipoEntrega: pendingOrder.deliveryType === 'delivery' ? 'Delivery' : 'Retirada',
                      telefone: pendingOrder.customerPhone
                    })
                  });
                  alert('Pedido despachado e cliente notificado via WhatsApp!');
                } catch (err) {
                  alert('Erro ao despachar pedido ou notificar via WhatsApp.');
                  console.error(err);
                }
              }}
              disabled={!pendingOrder}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-xl border-2 border-blue-400 disabled:border-gray-600 mt-2"
            >
              <span className="material-icons-round text-3xl">local_shipping</span>
              <span>DESPACHAR PEDIDO</span>
            </button>
            
            {/* Botão secundário: Limpar carrinho */}
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 rounded-xl text-base font-bold transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg"
            >
              <span className="material-icons-round text-xl">delete_sweep</span>
              <span>LIMPAR CARRINHO<span className="text-sm opacity-75 ml-1">(F3)</span></span>
            </button>
            
            <div className="text-[9px] text-gray-500 text-center">
              F4: Buscar Produtos
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Pizza */}
      {showPizzaSelector && (
        <PizzaSelector
          pizzas={products.filter(p => p.category === 'pizzas' || p.category === 'pizzas-broto')}
          complements={products.filter(p => p.type === 'complement' && p.category === 'complementos' && p.isActive)}
          onAdd={addPizzaToCart}
          onClose={() => setShowPizzaSelector(false)}
        />
      )}

      {/* Modal de Pagamento - Nova Etapa */}
      {showPaymentModal && pendingOrder && (() => {
        console.log('🎯 Modal renderizando - deliveryType:', deliveryType);
        console.log('🎯 Modal - Mostra campos de endereço?', deliveryType === 'delivery');
        return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-green-500">
            {/* Header do Modal */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-green-600">
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                <span className="material-icons-round text-green-400 text-4xl">payment</span>
                Pagamento do Pedido
              </h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="material-icons-round text-3xl">close</span>
              </button>
            </div>

            {/* Resumo do Pedido */}
            <div className="mb-6 bg-gray-700 rounded-xl p-4 border-2 border-gray-600">
              <div className="flex items-center gap-2 text-yellow-400 mb-3">
                <span className="material-icons-round">receipt_long</span>
                <span className="font-bold text-lg">Resumo do Pedido</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-base">
                  <span className="text-gray-300">Subtotal:</span>
                  <span className="text-white font-bold">R$ {calculateSubtotal().toFixed(2)}</span>
                </div>
                {calculateDiscount() > 0 && (
                  <div className="flex justify-between text-base text-red-400">
                    <span>Desconto:</span>
                    <span className="font-bold">- R$ {calculateDiscount().toFixed(2)}</span>
                  </div>
                )}
                {serviceCharge && (
                  <div className="flex justify-between text-base text-blue-400">
                    <span>Taxa de Serviço (10%):</span>
                    <span className="font-bold">+ R$ {calculateServiceCharge().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-2xl font-black pt-2 border-t-2 border-green-600 mt-2">
                  <span className="text-white">TOTAL:</span>
                  <span className="text-green-400">R$ {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Endereço de Entrega */}
            {deliveryType === 'delivery' && (
              <div className="mb-6 bg-gray-700 rounded-xl p-4 border-2 border-gray-600">
                <div className="flex items-center gap-2 text-green-400 mb-3">
                  <span className="material-icons-round">location_on</span>
                  <span className="font-bold text-lg">Endereço de Entrega</span>
                </div>
                
                <div className="space-y-3">
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Rua, número, bairro, cidade *"
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    required
                  />
                  
                  <input
                    type="text"
                    value={addressComplement}
                    onChange={(e) => setAddressComplement(e.target.value)}
                    placeholder="Complemento (apto, bloco, etc)"
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  
                  <input
                    type="text"
                    value={addressReference}
                    onChange={(e) => setAddressReference(e.target.value)}
                    placeholder="Ponto de referência"
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Seleção de Forma de Pagamento */}
            <div className="mb-6 bg-gray-700 rounded-xl p-4 border-2 border-gray-600">
              <div className="flex items-center gap-2 text-green-400 mb-4">
                <span className="material-icons-round">credit_card</span>
                <span className="font-bold text-lg">Escolha a Forma de Pagamento</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Dinheiro */}
                <button
                  onClick={() => setPaymentMethod('Dinheiro')}
                  className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-200 transform hover:scale-105 ${
                    paymentMethod === 'Dinheiro'
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/50 ring-2 ring-green-400'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className={`material-icons-round text-4xl ${
                      paymentMethod === 'Dinheiro' ? 'text-white' : 'text-green-400'
                    }`}>payments</span>
                    <span className="text-base font-bold">Dinheiro</span>
                  </div>
                  {paymentMethod === 'Dinheiro' && (
                    <div className="absolute top-2 right-2">
                      <span className="material-icons-round text-white">check_circle</span>
                    </div>
                  )}
                </button>
                
                {/* Cartão de Débito */}
                <button
                  onClick={() => setPaymentMethod('Cartão de Débito')}
                  className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-200 transform hover:scale-105 ${
                    paymentMethod === 'Cartão de Débito'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50 ring-2 ring-blue-400'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className={`material-icons-round text-4xl ${
                      paymentMethod === 'Cartão de Débito' ? 'text-white' : 'text-blue-400'
                    }`}>credit_card</span>
                    <span className="text-base font-bold">Débito</span>
                  </div>
                  {paymentMethod === 'Cartão de Débito' && (
                    <div className="absolute top-2 right-2">
                      <span className="material-icons-round text-white">check_circle</span>
                    </div>
                  )}
                </button>
                
                {/* Cartão de Crédito */}
                <button
                  onClick={() => setPaymentMethod('Cartão de Crédito')}
                  className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-200 transform hover:scale-105 ${
                    paymentMethod === 'Cartão de Crédito'
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 ring-2 ring-purple-400'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className={`material-icons-round text-4xl ${
                      paymentMethod === 'Cartão de Crédito' ? 'text-white' : 'text-purple-400'
                    }`}>credit_card</span>
                    <span className="text-base font-bold">Crédito</span>
                  </div>
                  {paymentMethod === 'Cartão de Crédito' && (
                    <div className="absolute top-2 right-2">
                      <span className="material-icons-round text-white">check_circle</span>
                    </div>
                  )}
                </button>
                
                {/* PIX */}
                <button
                  onClick={() => setPaymentMethod('PIX')}
                  className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-200 transform hover:scale-105 ${
                    paymentMethod === 'PIX'
                      ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/50 ring-2 ring-teal-400'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className={`material-icons-round text-4xl ${
                      paymentMethod === 'PIX' ? 'text-white' : 'text-teal-400'
                    }`}>qr_code_2</span>
                    <span className="text-base font-bold">PIX</span>
                  </div>
                  {paymentMethod === 'PIX' && (
                    <div className="absolute top-2 right-2">
                      <span className="material-icons-round text-white">check_circle</span>
                    </div>
                  )}
                </button>
              </div>
              
              {/* Campo de Valor em Dinheiro */}
              {paymentMethod === 'Dinheiro' && (
                <div className="space-y-3 bg-gray-600 rounded-lg p-3">
                  <label className="text-sm text-gray-200 font-semibold">Valor Recebido:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cashAmount}
                    onChange={(e) => {
                      setCashAmount(e.target.value);
                      const amount = parseFloat(e.target.value) || 0;
                      const total = calculateTotal();
                      setCashChange(amount - total);
                    }}
                    placeholder="R$ 0,00"
                    className="w-full px-4 py-3 text-lg bg-gray-700 border-2 border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-bold"
                    autoFocus
                  />
                  {cashAmount && parseFloat(cashAmount) > 0 && (
                    <div className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                      <span className="text-gray-200 font-semibold">Troco:</span>
                      <span className={`font-black text-2xl ${cashChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        R$ {Math.abs(cashChange).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPendingOrder(null);
                }}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span className="material-icons-round text-2xl">close</span>
                Cancelar
              </button>
              
              <button
                onClick={handleFinalizeSale}
                className="flex-[2] bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-xl text-xl font-black transition-all transform hover:scale-105 flex items-center justify-center gap-3 shadow-xl border-2 border-green-400"
              >
                <span className="material-icons-round text-3xl">check_circle</span>
                CONFIRMAR PAGAMENTO
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Modal de Complementos */}
      {showComplementModal && selectedProductForComplement && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {editingCartItemIndex !== null ? 'Editar' : 'Adicionar'} Complementos
                </h2>
                <p className="text-gray-400">{selectedProductForComplement.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowComplementModal(false);
                  setSelectedProductForComplement(null);
                  setSelectedComplements([]);
                  setEditingCartItemIndex(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="material-icons-round text-3xl">close</span>
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {products
                .filter(p => p.type === 'complement' && p.category === 'complementos' && p.isActive)
                .map(complement => {
                  const isSelected = selectedComplements.some(c => c.id === complement.id);
                  return (
                    <button
                      key={complement.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedComplements([]);
                        } else {
                          setSelectedComplements([complement]);
                        }
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500'
                          : 'bg-gray-700 border-gray-600 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'bg-purple-600 border-purple-500' : 'border-gray-500'
                          }`}>
                            {isSelected && (
                              <span className="material-icons-round text-white text-sm">check</span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-lg">{complement.name}</h3>
                            {complement.description && (
                              <p className="text-gray-400 text-sm">{complement.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${
                            complement.price === 0 ? 'text-green-600' : 'text-white'
                          }`}>
                            {complement.price === 0 ? 'Grátis' : `+R$ ${complement.price.toFixed(2)}`}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowComplementModal(false);
                  setSelectedProductForComplement(null);
                  setSelectedComplements([]);
                  setEditingCartItemIndex(null);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={addProductWithComplements}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-icons-round">{editingCartItemIndex !== null ? 'check' : 'add_shopping_cart'}</span>
                {editingCartItemIndex !== null ? 'Confirmar' : 'Adicionar ao Carrinho'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Buscar Cliente */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="material-icons-round text-green-400">person_search</span>
                Buscar Cliente
              </h2>
              <button
                onClick={() => setShowClientModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="material-icons-round text-3xl">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block font-medium">
                  Buscar Cliente Existente
                </label>
                <CustomerAutocomplete
                  onSelectCustomer={async (customer) => {
                    setSelectedCustomer(customer);
                    setCustomerName(customer.name);
                    setCustomerPhone(customer.phone);
                    if (customer.address) {
                      setDeliveryAddress(customer.address);
                    }
                    if (customer.addressDetails?.complement) {
                      setAddressComplement(customer.addressDetails.complement);
                    }
                    if (customer.addressDetails?.reference) {
                      setAddressReference(customer.addressDetails.reference);
                    }
                    
                    // 🚚 ADICIONAR TAXA DE ENTREGA AUTOMATICAMENTE
                    if (deliveryType === 'delivery' && customer.addressDetails?.neighborhood) {
                      await addDeliveryFeeToCart(customer.addressDetails.neighborhood);
                    }
                    
                    setShowClientModal(false);
                  }}
                  currentPhone={customerPhone}
                  currentName={customerName}
                />
              </div>

              <div className="border-t border-gray-700 pt-4">
                <label className="text-sm text-gray-300 mb-3 block font-medium">
                  Ou Preencher Manualmente
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setSelectedCustomer(null);
                    }}
                    placeholder="Nome do cliente *"
                    className="w-full px-4 py-3 text-base bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      setSelectedCustomer(null);
                    }}
                    placeholder="Telefone *"
                    className="w-full px-4 py-3 text-base bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              <button
                onClick={() => setShowClientModal(false)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-colors mt-4"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Observação por Item */}
      {itemParaObs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border-2 border-blue-500 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-icons-round text-blue-400">chat_bubble</span>
              Observação do Item
            </h3>
            <div className="mb-4 p-3 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-300">
                {'product' in itemParaObs.item 
                  ? itemParaObs.item.product.name 
                  : `Pizza ${itemParaObs.item.type === 'inteira' ? 'Inteira' : itemParaObs.item.type === 'meio-a-meio' ? 'Meio a Meio' : '3 Sabores'}`
                }
              </p>
            </div>
            <textarea
              value={obsTemp}
              onChange={(e) => setObsTemp(e.target.value)}
              rows={4}
              className="w-full border-2 border-gray-600 rounded-lg px-4 py-3 bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Ex: sem cebola, borda recheada, bem assada, ponto da carne..."
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  adicionarObsItem(itemParaObs.index, obsTemp);
                  setItemParaObs(null);
                  setObsTemp('');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-icons-round">check</span>
                Salvar
              </button>
              <button
                onClick={() => {
                  setItemParaObs(null);
                  setObsTemp('');
                }}
                className="px-6 py-3 border-2 border-gray-600 hover:border-gray-500 rounded-lg text-white font-bold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

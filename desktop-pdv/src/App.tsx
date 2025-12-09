import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Product, Category, Order, Customer, StoreConfig, User, Neighborhood } from './types';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import PDV from './components/PDV';
import ProductForm from './components/ProductForm';
import CategoryForm from './components/CategoryForm';
import NeighborhoodForm from './components/NeighborhoodForm';
import CashManagement from './components/CashManagement';
import Analytics from './components/Analytics';
import CashHistory from './components/CashHistory';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    name: 'Pizzaria Zattera',
    phone: '(13) 99651-1793',
    address: 'Santos, SP',
    openTime: '18:00',
    closeTime: '23:00',
    primaryColor: '#dc2626'
  });

  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [currentCashRegister, setCurrentCashRegister] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'pdv' | 'orders' | 'products' | 'categories' | 'customers' | 'cash' | 'admin-config'>('pdv');
  const [adminConfigTab, setAdminConfigTab] = useState<'users' | 'analytics' | 'neighborhoods' | 'customers' | 'cash-history'>('users');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [cartHasItems, setCartHasItems] = useState(false);
  const [showClientModalTrigger, setShowClientModalTrigger] = useState(0);
  const [showDeliveryFeesModal, setShowDeliveryFeesModal] = useState(false);
  const [neighborhoodSearchTerm, setNeighborhoodSearchTerm] = useState('');
  
  const handleDeliveryTypeChange = (type: 'pickup' | 'delivery') => {
    if (cartHasItems) {
      alert('Finalize ou cancele a venda atual para trocar o tipo de entrega');
      return;
    }
    setDeliveryType(type);
  };
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showNeighborhoodForm, setShowNeighborhoodForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [editingNeighborhood, setEditingNeighborhood] = useState<Neighborhood | undefined>();
  const [dataVersion, setDataVersion] = useState<{products: number, categories: number}>({products: 0, categories: 0});

  // Sistema de sincronização forçada - Carregar dados do banco local ao iniciar
  useEffect(() => {
    if (currentUser) {
      loadAllData();

      //  WebSocket Connection
      const socket = io('http://localhost:3030');

      socket.on('connect', () => {
        console.log('✅ Conectado ao servidor de automação via WebSocket:', socket.id);
      });

      socket.on('novo_pedido', (newOrder: Order) => {
        console.log('📦 Novo pedido recebido do site via WebSocket!', newOrder);
        setOrders(prevOrders => [newOrder as Order, ...prevOrders]); // Conversão explícita para Order
        
        // Alerta sonoro para o operador
        new Audio('/notification.mp3').play();
      });

      socket.on('status_atualizado', ({ orderId, newStatus }: { orderId: string, newStatus: string }) => {
        console.log(`🔄 Status do pedido ${orderId} atualizado para "${newStatus}" via WebSocket.`);
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      });

      socket.on('disconnect', () => {
        console.log('❌ Desconectado do servidor de automação.');
      });
      
      // MECANISMO 1: Listener para invalidação de cache em tempo real
      if (window.electronAPI.data && window.electronAPI.data.onCacheInvalidated) { // Verifica se existe antes de usar
        window.electronAPI.data.onCacheInvalidated((data: any) => {
          console.log('🔔 Cache invalidado detectado:', data.entity);
          // Recarregar dados imediatamente quando cache for invalidado
          if (data.entity === 'products') {
            loadProducts();
          } else if (data.entity === 'categories') {
            loadCategories();
          }
        });
      }
      
      // MECANISMO 2: Polling periódico a cada 5 minutos para garantir sincronização
      const syncInterval = setInterval(async () => {
        console.log('🔄 Verificação periódica de sincronização (5 min)...');
        await checkAndSyncData();
      }, 5 * 60 * 1000); // 5 minutos
      
      // MECANISMO 3: Sincronizar ao voltar foco para a janela
      const handleFocus = () => {
        console.log('👁️ Janela em foco - verificando atualizações...');
        checkAndSyncData();
      };
      window.addEventListener('focus', handleFocus);
      
      return () => {
        clearInterval(syncInterval);
        window.removeEventListener('focus', handleFocus);
        socket.disconnect();
      };
    }
  }, [currentUser]);

  // Verificar versão e sincronizar dados se necessário
  const checkAndSyncData = async () => {
    try {
      const serverVersion = await window.electronAPI.data.getVersion(); // Agora getVersion existe
      
      // Verificar se produtos foram atualizados
      if (serverVersion.products !== dataVersion.products) {
        console.log('📦 Produtos desatualizados - recarregando...', {
          local: dataVersion.products,
          server: serverVersion.products
        }); 
        await loadProducts();
      }
      
      // Verificar se categorias foram atualizadas
      if (serverVersion.categories !== dataVersion.categories) {
        console.log('🏷️ Categorias desatualizadas - recarregando...', {
          local: dataVersion.categories,
          server: serverVersion.categories
        }); 
        await loadCategories();
      }
    } catch (error) {
      console.error('❌ Erro ao verificar sincronização:', error);
    }
  }; 

  // Carregar produtos (sem cache)
  const loadProducts = async () => {
    try {
      const response = await window.electronAPI.products.getAll();
      const productsData = response.data || response; // Compatibilidade
      const version = response.version || Date.now();

      setProducts(productsData);
      setDataVersion(prev => ({ ...prev, products: version }));
      console.log('✅ Produtos carregados - Versão:', version, '- Total:', productsData.length);
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
    }
  };

  // Carregar categorias (sem cache)
  const loadCategories = async () => {
    try {
      const response = await window.electronAPI.categories.getAll();
      const categoriesData = response.data || response; // Compatibilidade
      const version = response.version || Date.now();

      setCategories(categoriesData);
      setDataVersion(prev => ({ ...prev, categories: version }));
      console.log('✅ Categorias carregadas - Versão:', version, '- Total:', categoriesData.length);
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Forçar reload completo ignorando qualquer cache (agora forceReload existe)
      const forcedData = await window.electronAPI.data.forceReload(); 
      
      // Carregar produtos e categorias do reload forçado
      setProducts(forcedData.products.data);
      setCategories(forcedData.categories.data);
      setDataVersion({
        products: forcedData.products.version, 
        categories: forcedData.categories.version
      });
      
      // Carregar outros dados
      const [ordersData, customersData, neighborhoodsData, configData] = await Promise.all([
        window.electronAPI.orders.getAll(),
        window.electronAPI.customers.getAll(),
        window.electronAPI.neighborhoods.getAll(),
        window.electronAPI.store.getConfig()
      ]);

      setOrders(ordersData);
      setCustomers(customersData);
      setNeighborhoods(neighborhoodsData);
      setStoreConfig(configData);
      
      console.log('✅ Dados carregados com sucesso - Produtos:', forcedData.products.data.length, 'Categorias:', forcedData.categories.data.length);
      
      // Carregar status do caixa separadamente
      try {
        const cashData = await window.electronAPI.cashRegister.getCurrent();
        setCurrentCashRegister(cashData);
      } catch (cashError) {
        console.error('Erro ao carregar caixa:', cashError);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('pdv');
  };

  const handleSaveNeighborhood = async (neighborhood: Omit<Neighborhood, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => {
    try {
      console.log('📍 Salvando bairro:', neighborhood);
      
      if (editingNeighborhood || neighborhood.id) {
        console.log('✏️ Atualizando bairro existente'); // Passa o ID como primeiro argumento
        await window.electronAPI.neighborhoods.update(neighborhood.id!, { 
          ...neighborhood,
          id: neighborhood.id || editingNeighborhood!.id, // Garante que id é string
          createdAt: neighborhood.createdAt || editingNeighborhood!.createdAt // Garante que createdAt é string
        });
      } else {
        console.log('➕ Criando novo bairro');
        await window.electronAPI.neighborhoods.create({ ...neighborhood, id: Date.now().toString(), createdAt: new Date().toISOString() } as Neighborhood); // Garante id e createdAt
      } 
      
      console.log('✅ Bairro salvo com sucesso');
      setShowNeighborhoodForm(false);
      setEditingNeighborhood(undefined);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao salvar bairro:', error);
      alert('Erro ao salvar bairro. Verifique o console para mais detalhes.');
    }
  };

  const handleDispatchOrder = async (orderId: string) => {
    try {
      const response = await fetch(`http://localhost:3030/pedidos/${orderId}/despachar`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Falha ao despachar o pedido.');
      }
      alert(`Pedido ${orderId} despachado! O cliente será notificado.`);
    } catch (error: any) {
      console.error('❌ Erro ao despachar pedido:', error);
      alert(`❌ ${error.message}`);
    }
  };

  // Tela de Login
  if (!currentUser) {
    return <Login onLoginSuccess={setCurrentUser} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 text-white px-6 py-3 shadow-lg flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
            <span className="material-icons-round text-2xl">local_pizza</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{storeConfig.name} - PDV</h1>
            <p className="text-sm text-gray-300">Sistema de Ponto de Venda</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 mr-4">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <span className="material-icons-round text-white">{currentUser.role === 'admin' ? 'admin_panel_settings' : 'person'}</span>
            </div>
            <div>
              <p className="text-sm font-semibold">{currentUser.name}</p>
              <p className="text-xs text-gray-300">{currentUser.role === 'admin' ? 'Administrador' : 'Operador'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-300">Pedidos Hoje</p>
            <p className="text-2xl font-bold text-green-400">{orders.length}</p>
          </div>
          <button
            onClick={() => window.electronAPI.system.openExternal('http://localhost:3000')}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            title="Abrir site da pizzaria"
          >
            <span className="material-icons-round">open_in_new</span>
            Ver Site
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <span className="material-icons-round">logout</span>
            Sair
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b shadow-sm flex-shrink-0">
        <div className="px-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {[
                { id: 'pdv', label: 'PDV', icon: 'point_of_sale' },
                ...(currentUser.role === 'admin' ? [
                  { id: 'cash', label: 'Caixa', icon: 'payments', showStatus: true }
                ] : []),
                { id: 'orders', label: 'Pedidos', icon: 'receipt_long' },
                { id: 'products', label: 'Produtos', icon: 'inventory_2' },
                { id: 'categories', label: 'Categorias', icon: 'category' },
                ...(currentUser.role === 'admin' ? [
                  { id: 'admin-config', label: 'Configurações ADM', icon: 'admin_panel_settings' }
                ] : [])
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-red-600 bg-red-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-icons-round">{tab.icon}</span>
                  {tab.label}
                  {(tab as any).showStatus && (
                    <span 
                      className={`w-3 h-3 rounded-full ${currentCashRegister ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'} shadow-lg animate-pulse`}
                      title={currentCashRegister ? 'Caixa Aberto' : 'Caixa Fechado'}
                    />
                  )}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t" />
                  )}
                </button>
              ))}
            </div>
            
            {/* Botões de Tipo de Entrega */}
            {activeTab === 'pdv' && (
              <div className="flex gap-2 mr-4">
                <button
                  onClick={() => handleDeliveryTypeChange('pickup')}
                  disabled={cartHasItems && deliveryType !== 'pickup'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    deliveryType === 'pickup'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : cartHasItems 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title={cartHasItems && deliveryType !== 'pickup' ? 'Finalize ou cancele a venda atual para trocar o tipo de entrega' : ''}
                >
                  <span className="material-icons-round text-lg">store</span>
                  Retirada
                  {cartHasItems && deliveryType !== 'pickup' && (
                    <span className="material-icons-round text-sm">lock</span>
                  )}
                </button>
                <button
                  onClick={() => handleDeliveryTypeChange('delivery')}
                  disabled={cartHasItems && deliveryType !== 'delivery'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    deliveryType === 'delivery'
                      ? 'bg-green-600 text-white shadow-lg'
                      : cartHasItems
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title={cartHasItems && deliveryType !== 'delivery' ? 'Finalize ou cancele a venda atual para trocar o tipo de entrega' : ''}
                >
                  <span className="material-icons-round text-lg">delivery_dining</span>
                  Delivery
                  {cartHasItems && deliveryType !== 'delivery' && (
                    <span className="material-icons-round text-sm">lock</span>
                  )}
                </button>
                <button
                  onClick={() => setShowClientModalTrigger(prev => prev + 1)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-all shadow-lg"
                >
                  <span className="material-icons-round text-lg">person_search</span>
                  Buscar Cliente
                </button>
                <button
                  onClick={() => setShowDeliveryFeesModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg"
                >
                  <span className="material-icons-round text-lg">attach_money</span>
                  Taxa de Entrega
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'pdv' && <PDV currentUser={currentUser} deliveryType={deliveryType} onCartChange={setCartHasItems} clientModalTrigger={showClientModalTrigger} />}

        {activeTab === 'orders' && (
          <div className="h-full bg-white p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="material-icons-round text-red-600">receipt_long</span>
                Gerenciar Pedidos ({orders.length})
              </h2>
              
              {/* Campo de Busca */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                  <input
                    type="text"
                    placeholder="Buscar por nome, telefone ou número..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-red-500"
                    onChange={(e) => {
                      const searchValue = e.target.value.toLowerCase();
                      if (searchValue === '') {
                        loadAllData();
                      } else {
                        const filtered = orders.filter(order => 
                          order.customerName.toLowerCase().includes(searchValue) ||
                          order.customerPhone.toLowerCase().includes(searchValue) ||
                          order.id.toLowerCase().includes(searchValue)
                        );
                        setOrders(filtered);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <span className="material-icons-round text-6xl mb-4">receipt</span>
                  <p className="text-xl">Nenhum pedido registrado</p>
                </div>
              ) : (
                orders.map(order => {
                  // Calcular tempo de preparo estimado
                  const preparationTime = order.items.reduce((total: number, item: any) => {
                    if (item.product) {
                      return total + (item.product.preparationTime || 0);
                    }
                    return total + 30; // Tempo padrão para pizzas
                  }, 0);
                  
                  const deliveryTime = order.deliveryType === 'delivery' ? 20 : 0;
                  const totalEstimatedTime = preparationTime + deliveryTime;
                  
                  // Calcular tempo decorrido
                  const createdTime = new Date(order.createdAt).getTime();
                  const currentTime = new Date().getTime();
                  const elapsedMinutes = Math.floor((currentTime - createdTime) / 1000 / 60);
                  const remainingTime = Math.max(0, totalEstimatedTime - elapsedMinutes);

                  const handleStatusChange = async (newStatus: string, sendWhatsApp: boolean = false) => {
                    try {
                      const updates = {
                        status: newStatus,
                        updatedAt: new Date().toISOString()
                      };
                      
                      await window.electronAPI.orders.update(order.id, updates as Partial<Order>); // Cast para Partial<Order>
                      
                      if (sendWhatsApp) {
                        let message = '';
                        if (newStatus === 'Preparando') {
                          message = `🍕 *Pizzaria Zattera*\n\nOlá ${order.customerName}!\n\nSeu pedido #${order.id} está sendo preparado! 👨‍🍳\n\n⏱️ Tempo estimado: ${totalEstimatedTime} minutos\n\nObrigado pela preferência! 😊`;
                        } else if (newStatus === 'Pronto') {
                          if (order.deliveryType === 'delivery') {
                            message = `🍕 *Pizzaria Zattera*\n\nOlá ${order.customerName}!\n\n✅ Seu pedido #${order.id} está pronto e a caminho! 🛵\n\n📍 Endereço: ${order.deliveryAddress?.full || 'N/A'}\n\nAguarde, já estamos chegando! 🚀`;
                          } else {
                            message = `🍕 *Pizzaria Zattera*\n\nOlá ${order.customerName}!\n\n✅ Seu pedido #${order.id} está pronto para retirada! 🎉\n\nVenha buscar na pizzaria!\n\nObrigado! 😊`;
                          }
                        }
                        
                        if (message) {
                          const whatsappResult = await window.electronAPI.whatsapp.sendMessage(order.customerPhone, message);
                          if (whatsappResult.success) {
                            console.log('✅ WhatsApp enviado com sucesso');
                          } else {
                            console.error('❌ Erro ao enviar WhatsApp:', whatsappResult.error);
                          }
                        }
                      }
                      
                      // Recarregar dados
                      loadAllData();
                      
                      alert(`Status atualizado para: ${newStatus}${sendWhatsApp ? '\n\nWhatsApp aberto para envio!' : ''}`);
                    } catch (error) {
                      console.error('Erro ao atualizar status:', error);
                      alert('Erro ao atualizar status do pedido');
                    }
                  };

                  return (
                    <div key={order.id} className="border-2 border-black rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg">{order.customerName}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'Pendente' ? 'bg-yellow-100 text-yellow-700' :
                              order.status === 'Em Produção' ? 'bg-cyan-100 text-cyan-700' : // Agora 'Em Produção' é um status válido
                              order.status === 'Preparando' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'Pronto' ? 'bg-green-100 text-green-700' :
                              order.status === 'Entregue' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 font-medium">{order.customerPhone}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Pedido #{order.id} • {new Date(order.createdAt).toLocaleDateString('pt-BR')} {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          
                          {/* Tempo de Entrega Estimado */}
                          <div className="mt-2 p-2 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                            <div className="flex items-center gap-2">
                              <span className="material-icons-round text-orange-600 text-lg">schedule</span>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-orange-700">TEMPO ESTIMADO</p>
                                <p className="text-sm font-bold text-orange-900">
                                  {order.status === 'Pendente' && `${totalEstimatedTime} minutos (aguardando início)`}
                                  {order.status === 'Preparando' && `${remainingTime} minutos (em preparo)`}
                                  {order.status === 'Pronto' && (order.deliveryType === 'delivery' ? 'A caminho!' : 'Pronto para retirada!')}
                                  {order.status === 'Entregue' && 'Pedido entregue'}
                                </p>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  Preparo: {preparationTime}min {order.deliveryType === 'delivery' && `• Entrega: ${deliveryTime}min`}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm font-semibold text-gray-700 mt-2">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} • R$ {order.total.toFixed(2)}
                          </p>
                          {order.deliveryType === 'delivery' && order.deliveryAddress && (
                            <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                              <p className="flex items-center gap-1 font-semibold text-blue-800">
                                <span className="material-icons-round text-sm">delivery_dining</span>
                                DELIVERY
                              </p>
                              <p className="ml-5 text-xs">📍 {order.deliveryAddress.full}</p>
                              {order.deliveryAddress.complement && (
                                <p className="ml-5 text-xs">🏢 {order.deliveryAddress.complement}</p>
                              )}
                              {order.deliveryAddress.reference && (
                                <p className="ml-5 text-xs">📌 {order.deliveryAddress.reference}</p>
                              )}
                            </div>
                          )}
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-semibold">💳 Pagamento:</span> {order.paymentMethod}
                          </p>
                        </div>
                        
                        {/* Botões de Ação */}
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={async () => {
                              try {
                                const result = await window.electronAPI.printer.print(order);
                                if (result.success) {
                                  alert('Cupom reimpresso com sucesso!');
                                } else {
                                  alert('Erro ao reimprimir: ' + ((result as any).error || 'Erro desconhecido'));
                                }
                              } catch (error) {
                                console.error('Erro ao reimprimir:', error);
                                alert('Erro ao reimprimir cupom');
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                          >
                            <span className="material-icons-round text-sm">print</span>
                            Reimprimir
                          </button>
                          
                          {/* BOTÃO PARA PEDIDOS VINDOS DO SITE */}
                          {order.status === 'Em Produção' && (
                            <button
                              onClick={() => handleDispatchOrder(order.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm whitespace-nowrap animate-pulse"
                            >
                              <span className="material-icons-round text-sm">{order.deliveryType === 'delivery' ? 'two_wheeler' : 'check_circle'}</span>
                              Despachar Pedido
                            </button>
                          )}

                          {order.status === 'Pendente' && (
                            <button
                              onClick={() => handleStatusChange('Preparando', true)}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                            >
                              <span className="material-icons-round text-sm">restaurant</span>
                              Iniciar Preparo
                            </button>
                          )}
                          
                          {order.status === 'Preparando' && (
                            <button
                              onClick={() => handleStatusChange('Pronto', true)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                            >
                              <span className="material-icons-round text-sm">{order.deliveryType === 'delivery' ? 'two_wheeler' : 'check_circle'}</span>
                              {order.deliveryType === 'delivery' ? 'Enviar Pedido' : 'Marcar Pronto'}
                            </button>
                          )}
                          
                          {order.status === 'Pronto' && (
                            <button
                              onClick={() => handleStatusChange('Entregue', false)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                            >
                              <span className="material-icons-round text-sm">done_all</span>
                              Finalizar
                            </button>
                          )}
                        </div>
                      </div>
                    
                    {/* Lista de Itens do Pedido */}
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">ITENS DO PEDIDO:</p>
                      <div className="space-y-1">
                        {order.items.map((item: any, idx: number) => {
                          if (item.product) {
                            // Item normal
                            return (
                              <div key={idx} className="text-sm text-gray-700 flex justify-between">
                                <span>• {item.quantity}x {item.product.name} {item.size ? `(${item.size})` : ''}</span>
                                <span className="font-semibold">R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                              </div>
                            );
                          } else {
                            // Pizza fracionada
                            const pizzaType = item.type === 'inteira' ? 'INTEIRA' : 
                                             item.type === 'meio-a-meio' ? 'MEIO A MEIO' : '1/3';
                            return (
                              <div key={idx} className="text-sm text-gray-700">
                                <div className="flex justify-between font-semibold">
                                  <span>• {item.quantity}x PIZZA {pizzaType} - {item.size.toUpperCase()}</span>
                                  <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                                <div className="ml-4 text-xs text-gray-600">
                                  {item.flavors.map((flavor: any, fIdx: number) => (
                                    <div key={fIdx}>- {flavor.product.name}</div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="h-full bg-white p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span className="material-icons-round text-red-600">inventory_2</span>
                  Produtos ({products.filter(p => p.type !== 'complement').length})
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold text-purple-600">{products.filter(p => p.type === 'complement').length}</span> complementos cadastrados
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingProduct(undefined);
                    setShowProductForm(true);
                  }}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <span className="material-icons-round">add</span>
                  Novo Produto
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(undefined);
                    setShowProductForm(true);
                  }}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <span className="material-icons-round">add_circle</span>
                  Novo Complemento
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      {product.type === 'complement' && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-700 flex items-center gap-1">
                          <span className="material-icons-round text-sm">add_circle</span>
                          Complemento
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl font-bold text-red-600">R$ {product.price.toFixed(2)}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {product.isActive ? 'Ativo' : 'Pausado'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await window.electronAPI.products.update(product.id, { ...product, isActive: !product.isActive });
                          loadAllData();
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1 ${
                          product.isActive 
                            ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' 
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        <span className="material-icons-round text-sm">
                          {product.isActive ? 'pause' : 'play_arrow'}
                        </span>
                        {product.isActive ? 'Pausar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setShowProductForm(true);
                        }}
                        className="py-2 px-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <span className="material-icons-round text-sm">edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="h-full bg-white p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="material-icons-round text-red-600">category</span>
                Categorias ({categories.length})
              </h2>
              <button
                onClick={() => {
                  setEditingCategory(undefined);
                  setShowCategoryForm(true);
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <span className="material-icons-round">add</span>
                Nova Categoria
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map(category => (
                <div key={category.id} className="border-2 rounded-lg p-4 hover:shadow-lg transition-shadow" style={{ borderColor: category.color }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: category.color + '20' }}>
                        <span className="material-icons-round text-2xl" style={{ color: category.color }}>
                          {category.icon}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg">{category.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {category.isActive ? 'Ativa' : 'Pausada'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await window.electronAPI.categories.update(category.id, { ...category, isActive: !category.isActive });
                        loadAllData();
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1 ${
                        category.isActive 
                          ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' 
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      <span className="material-icons-round text-sm">
                        {category.isActive ? 'pause' : 'play_arrow'}
                      </span>
                      {category.isActive ? 'Pausar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setShowCategoryForm(true);
                      }}
                      className="py-2 px-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <span className="material-icons-round text-sm">edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cash' && <CashManagement currentUser={currentUser} onCashChange={loadAllData} />}

        {activeTab === 'admin-config' && (
          <div className="h-full bg-white flex flex-col">
            {/* Sub-tabs */}
            <div className="border-b bg-gray-50 px-6 py-3 flex-shrink-0">
              <div className="flex gap-2">
                {[
                  { id: 'users', label: 'Usuários', icon: 'badge' },
                  { id: 'analytics', label: 'Relatórios', icon: 'analytics' },
                  { id: 'cash-history', label: 'Histórico de Caixa', icon: 'history' },
                  { id: 'neighborhoods', label: 'Bairros', icon: 'location_city' },
                  { id: 'customers', label: 'Clientes', icon: 'people' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setAdminConfigTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                      adminConfigTab === tab.id
                        ? 'bg-red-600 text-white'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="material-icons-round text-lg">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {adminConfigTab === 'users' && (
                <div className="h-full overflow-y-auto p-6">
                  <UserManagement currentUser={currentUser} />
                </div>
              )}

              {adminConfigTab === 'analytics' && (
                <Analytics orders={orders} customers={customers} />
              )}

              {adminConfigTab === 'cash-history' && <CashHistory />}

              {adminConfigTab === 'neighborhoods' && (
                <div className="h-full overflow-y-auto p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <span className="material-icons-round text-red-600">location_city</span>
                      Bairros e Taxas de Entrega ({neighborhoods.length})
                    </h2>
                    <button
                      onClick={() => {
                        setEditingNeighborhood(undefined);
                        setShowNeighborhoodForm(true);
                      }}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <span className="material-icons-round">add</span>
                      Novo Bairro
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {neighborhoods.map(neighborhood => (
                      <div key={neighborhood.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{neighborhood.name}</h3>
                            <p className="text-sm text-gray-600">{neighborhood.city}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            neighborhood.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {neighborhood.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-600 mb-1">Taxa de Entrega</p>
                          <p className="text-2xl font-bold text-green-600">R$ {neighborhood.deliveryFee.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => {
                              setEditingNeighborhood(neighborhood);
                              setShowNeighborhoodForm(true);
                            }}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded font-semibold hover:bg-blue-700 transition-colors text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Deseja excluir o bairro "${neighborhood.name}"?`)) {
                                await window.electronAPI.neighborhoods.delete(neighborhood.id);
                                loadAllData();
                              }
                            }}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded font-semibold hover:bg-red-700 transition-colors text-sm"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminConfigTab === 'customers' && (
                <div className="h-full overflow-y-auto p-6">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span className="material-icons-round text-red-600">people</span>
                    Clientes ({customers.length})
                  </h2>
                  <div className="space-y-3">
                    {customers.map(customer => (
                      <div key={customer.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-bold">{customer.name}</h3>
                            <p className="text-sm text-gray-600">{customer.phone}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Total gasto</p>
                            <p className="text-lg font-bold text-green-600">R$ {customer.totalSpent.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSave={async (productData) => {
            if (editingProduct) {
              await window.electronAPI.products.update(editingProduct.id, { ...editingProduct, ...productData });
            } else {
              await window.electronAPI.products.create({ 
                id: Date.now().toString(), 
                isFeatured: false,
                ...productData 
              } as Product);
            }
            await loadAllData();
            setShowProductForm(false);
          }}
          onClose={() => setShowProductForm(false)}
        />
      )}

      {showCategoryForm && (
        <CategoryForm
          category={editingCategory}
          onSave={async (categoryData) => {
            if (editingCategory) {
              await window.electronAPI.categories.update(editingCategory.id, { ...editingCategory, ...categoryData });
            } else {
              await window.electronAPI.categories.create({ 
                id: Date.now().toString(), 
                ...categoryData 
              } as Category);
            }
            await loadAllData();
            setShowCategoryForm(false);
          }}
          onClose={() => setShowCategoryForm(false)}
        />
      )}

      {showNeighborhoodForm && (
        <NeighborhoodForm
          neighborhood={editingNeighborhood}
          onSave={handleSaveNeighborhood}
          onClose={() => {
            setShowNeighborhoodForm(false);
            setEditingNeighborhood(undefined);
          }}
        />
      )}

      {/* Modal de Taxas de Entrega */}
      {showDeliveryFeesModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-blue-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-blue-600">
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                <span className="material-icons-round text-blue-400 text-4xl">attach_money</span>
                Taxas de Entrega por Bairro
              </h2>
              <button
                onClick={() => setShowDeliveryFeesModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="material-icons-round text-3xl">close</span>
              </button>
            </div>

            {/* Campo de Busca */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Buscar Bairro/Taxa
              </label>
              <div className="relative">
                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                  search
                </span>
                <input
                  type="text"
                  value={neighborhoodSearchTerm}
                  onChange={(e) => setNeighborhoodSearchTerm(e.target.value)}
                  placeholder="Digite o nome do bairro, cidade ou valor da taxa..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                {neighborhoodSearchTerm && (
                  <button
                    onClick={() => setNeighborhoodSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    <span className="material-icons-round text-xl">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Bairros */}
            <div className="space-y-3">
              {neighborhoods.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <span className="material-icons-round text-6xl mb-4">location_off</span>
                  <p className="text-xl font-semibold">Nenhum bairro cadastrado</p>
                  <p className="text-sm mt-2">Cadastre bairros no menu Admin → Bairros</p>
                </div>
              ) : (() => {
                // Filtrar bairros com base no termo de busca
                const filteredNeighborhoods = neighborhoods.filter(neighborhood => {
                  const searchLower = neighborhoodSearchTerm.toLowerCase();
                  return (
                    neighborhood.name.toLowerCase().includes(searchLower) ||
                    (neighborhood.city || 'Santos').toLowerCase().includes(searchLower) ||
                    neighborhood.deliveryFee.toFixed(2).includes(searchLower) ||
                    `R$ ${neighborhood.deliveryFee.toFixed(2)}`.toLowerCase().includes(searchLower)
                  );
                });

                if (filteredNeighborhoods.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-400">
                      <span className="material-icons-round text-6xl mb-4">search_off</span>
                      <p className="text-xl font-semibold">Nenhum resultado encontrado</p>
                      <p className="text-sm mt-2">Tente buscar por outro termo</p>
                    </div>
                  );
                }

                return (
                  <>
                    {/* Tabela Header */}
                    <div className="grid grid-cols-3 gap-4 bg-gray-700 rounded-lg p-3 font-bold text-gray-300">
                      <div>Bairro</div>
                      <div className="text-center">Cidade</div>
                      <div className="text-right">Taxa de Entrega</div>
                    </div>

                    {/* Contador de Resultados */}
                    {neighborhoodSearchTerm && (
                      <div className="text-sm text-gray-400 px-2">
                        {filteredNeighborhoods.length} {filteredNeighborhoods.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                      </div>
                    )}

                    {/* Lista de Bairros Filtrada */}
                    {filteredNeighborhoods
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((neighborhood) => (
                      <div
                        key={neighborhood.id}
                        className="grid grid-cols-3 gap-4 bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition-colors items-center"
                      >
                        <div>
                          <div className="font-bold text-white text-lg">
                            {neighborhood.name}
                          </div>
                        </div>
                        <div className="text-center text-gray-300">
                          {neighborhood.city || 'Santos'}
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-green-400">
                            R$ {neighborhood.deliveryFee.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>

            {/* Footer com informação */}
            <div className="mt-6 bg-blue-900/30 border border-blue-400 rounded-lg p-4 flex items-start gap-3">
              <span className="material-icons-round text-blue-400">info</span>
              <div className="text-sm text-blue-200">
                <p className="font-semibold mb-1">Informação:</p>
                <p>As taxas de entrega são aplicadas automaticamente ao selecionar o bairro do cliente durante o pedido.</p>
                <p className="mt-1">Para editar as taxas, acesse: <strong>Menu → Admin → Bairros</strong></p>
              </div>
            </div>

            {/* Botão Fechar */}
            <button
              onClick={() => {
                setShowDeliveryFeesModal(false);
                setNeighborhoodSearchTerm(''); // Limpar busca ao fechar
              }}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

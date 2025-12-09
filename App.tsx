import React, { useState, useEffect, useMemo } from 'react';
import { CategoryType, Product, CartItem, StoreConfig, Customer, Order } from './types';
import { INITIAL_PRODUCTS, INITIAL_STORE_CONFIG, INITIAL_CUSTOMERS } from './constants';
import { ProductCard } from './components/ProductCard';
import { AIImageEditor } from './components/AIImageEditor';

// --- Admin Component ---

interface AdminProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  customers: Customer[];
  storeConfig: StoreConfig;
  setStoreConfig: React.Dispatch<React.SetStateAction<StoreConfig>>;
  onExit: () => void;
}

const AdminPanel: React.FC<AdminProps> = ({ products, setProducts, customers, storeConfig, setStoreConfig, onExit }) => {
  const [activeTab, setActiveTab] = useState<'store' | 'products' | 'customers'>('store');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAIEditor, setShowAIEditor] = useState(false);
  const [tempImage, setTempImage] = useState<string>('');

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setProducts(prev => {
      const exists = prev.find(p => p.id === editingProduct.id);
      if (exists) {
        return prev.map(p => p.id === editingProduct.id ? editingProduct : p);
      } else {
        return [...prev, editingProduct];
      }
    });
    setEditingProduct(null);
  };

  const createNewProduct = () => {
    setEditingProduct({
      id: Date.now().toString(),
      name: '',
      description: '',
      price: 0,
      category: CategoryType.SALTY,
      image: 'https://picsum.photos/400/400',
      isFeatured: false
    });
  };

  const handleDelete = (id: string) => {
    if(confirm('Tem certeza que deseja excluir este item?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="bg-slate-800 text-white p-4 sticky top-0 z-30 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2">
            <span className="material-icons-round">admin_panel_settings</span>
            <h1 className="text-xl font-bold">Administração</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-700 rounded p-1">
             <button onClick={() => setActiveTab('store')} className={`px-3 py-1 rounded text-sm ${activeTab === 'store' ? 'bg-slate-500 text-white' : 'text-gray-300'}`}>Loja</button>
             <button onClick={() => setActiveTab('products')} className={`px-3 py-1 rounded text-sm ${activeTab === 'products' ? 'bg-slate-500 text-white' : 'text-gray-300'}`}>Produtos</button>
             <button onClick={() => setActiveTab('customers')} className={`px-3 py-1 rounded text-sm ${activeTab === 'customers' ? 'bg-slate-500 text-white' : 'text-gray-300'}`}>Clientes</button>
          </div>
          <button onClick={onExit} className="text-sm bg-red-600 px-3 py-1 rounded hover:bg-red-700">
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-8">
        
        {/* Store Settings */}
        {activeTab === 'store' && (
        <section className="bg-white p-6 rounded-xl shadow-sm animate-fadeIn">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Configurações da Loja</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm text-gray-600">Nome da Pizzaria</label>
                <input 
                  value={storeConfig.name}
                  onChange={e => setStoreConfig({...storeConfig, name: e.target.value})}
                  className="w-full p-2 border rounded mt-1"
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-sm text-gray-600">Abertura</label>
                    <input 
                      type="time"
                      value={storeConfig.openTime}
                      onChange={e => setStoreConfig({...storeConfig, openTime: e.target.value})}
                      className="w-full p-2 border rounded mt-1"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-600">Fechamento</label>
                    <input 
                      type="time"
                      value={storeConfig.closeTime}
                      onChange={e => setStoreConfig({...storeConfig, closeTime: e.target.value})}
                      className="w-full p-2 border rounded mt-1"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm text-gray-600">Cor Primária</label>
                <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="color"
                      value={storeConfig.primaryColor}
                      onChange={e => setStoreConfig({...storeConfig, primaryColor: e.target.value})}
                      className="h-10 w-20 rounded cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">{storeConfig.primaryColor}</span>
                </div>
            </div>
            <div>
                 <label className="flex items-center gap-2 mt-6 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={storeConfig.isOpen}
                      onChange={e => setStoreConfig({...storeConfig, isOpen: e.target.checked})}
                      className="w-5 h-5"
                    />
                    <span className="font-medium">Loja Aberta Agora</span>
                 </label>
            </div>
          </div>
        </section>
        )}

        {/* Product List */}
        {activeTab === 'products' && (
        <section className="bg-white p-6 rounded-xl shadow-sm animate-fadeIn">
           <div className="flex justify-between items-center mb-4 border-b pb-2">
             <h2 className="text-lg font-bold">Produtos</h2>
             <button 
               onClick={createNewProduct}
               className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
             >
               <span className="material-icons-round">add</span> Novo Produto
             </button>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="text-gray-500 text-sm border-b">
                   <th className="p-3 font-medium">Imagem</th>
                   <th className="p-3 font-medium">Nome</th>
                   <th className="p-3 font-medium">Categoria</th>
                   <th className="p-3 font-medium">Preço</th>
                   <th className="p-3 font-medium">Destaque</th>
                   <th className="p-3 font-medium text-right">Ações</th>
                 </tr>
               </thead>
               <tbody>
                 {products.map(p => (
                   <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                     <td className="p-3">
                        <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded" />
                     </td>
                     <td className="p-3 font-medium">{p.name}</td>
                     <td className="p-3 text-sm text-gray-600">{p.category}</td>
                     <td className="p-3 text-sm">R$ {p.price.toFixed(2)}</td>
                     <td className="p-3 text-sm text-center">
                        {p.isFeatured && <span className="material-icons-round text-yellow-500">star</span>}
                     </td>
                     <td className="p-3 text-right space-x-2">
                       <button onClick={() => setEditingProduct(p)} className="text-blue-600 hover:text-blue-800">
                         <span className="material-icons-round">edit</span>
                       </button>
                       <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800">
                         <span className="material-icons-round">delete</span>
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </section>
        )}

        {/* Customers List */}
        {activeTab === 'customers' && (
          <section className="bg-white p-6 rounded-xl shadow-sm animate-fadeIn">
             <h2 className="text-lg font-bold mb-4 border-b pb-2">Clientes Cadastrados</h2>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="text-gray-500 text-sm border-b">
                     <th className="p-3 font-medium">Nome</th>
                     <th className="p-3 font-medium">Telefone</th>
                     <th className="p-3 font-medium">Endereço</th>
                     <th className="p-3 font-medium text-center">Pedidos</th>
                   </tr>
                 </thead>
                 <tbody>
                   {customers.map(c => (
                     <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                       <td className="p-3 font-medium">
                          {c.name}
                          <div className="text-xs text-gray-400">{c.email}</div>
                       </td>
                       <td className="p-3 text-sm">{c.phone}</td>
                       <td className="p-3 text-sm max-w-xs truncate">{c.address}</td>
                       <td className="p-3 text-sm text-center">{c.orders.length}</td>
                     </tr>
                   ))}
                   {customers.length === 0 && (
                      <tr><td colSpan={4} className="p-4 text-center text-gray-400">Nenhum cliente cadastrado.</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
          </section>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <h3 className="text-xl font-bold mb-4">
                 {products.find(p => p.id === editingProduct.id) ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nome</label>
                <input 
                  required
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Descrição / Ingredientes</label>
                <textarea 
                  required
                  value={editingProduct.description}
                  onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                  className="w-full p-2 border rounded h-24"
                  placeholder="Ex: Molho, mussarela, tomate..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Preço (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Categoria</label>
                  <select 
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({...editingProduct, category: e.target.value as CategoryType})}
                    className="w-full p-2 border rounded"
                  >
                    {Object.values(CategoryType).map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input 
                    type="checkbox"
                    checked={editingProduct.isFeatured || false}
                    onChange={e => setEditingProduct({...editingProduct, isFeatured: e.target.checked})}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="font-medium text-gray-700">Destaque (Promoção/Combo)</span>
              </label>

              <div>
                 <label className="block text-sm text-gray-600 mb-1">Imagem URL</label>
                 <div className="flex gap-2">
                    <input 
                        type="text"
                        value={editingProduct.image}
                        onChange={e => setEditingProduct({...editingProduct, image: e.target.value})}
                        className="flex-1 p-2 border rounded"
                    />
                    <button 
                        type="button"
                        onClick={() => {
                            setTempImage(editingProduct.image);
                            setShowAIEditor(true);
                        }}
                        className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 flex items-center gap-1 shadow"
                        title="Editar com IA"
                    >
                        <span className="material-icons-round text-sm">auto_awesome</span>
                        IA
                    </button>
                 </div>
                 {editingProduct.image && (
                     <img src={editingProduct.image} alt="Preview" className="mt-2 h-32 w-full object-cover rounded bg-gray-50" />
                 )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button 
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Editor Modal */}
      {showAIEditor && (
        <AIImageEditor 
            initialImage={tempImage}
            onClose={() => setShowAIEditor(false)}
            onImageSave={(newBase64) => {
                if(editingProduct) {
                    setEditingProduct({...editingProduct, image: newBase64});
                }
                setShowAIEditor(false);
            }}
        />
      )}
    </div>
  );
};

// --- Client App ---

const App: React.FC = () => {
  // Data State
  const [view, setView] = useState<'client' | 'admin'>('client');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(INITIAL_STORE_CONFIG);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  
  // User Session State
  const [currentUser, setCurrentUser] = useState<Customer | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryType>(CategoryType.SALTY);
  const [exitingItems, setExitingItems] = useState<Set<string>>(new Set()); // Track items animating out
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  
  // Half-Half Modal State
  const [isHalfModalOpen, setIsHalfModalOpen] = useState(false);
  const [halfSelections, setHalfSelections] = useState<[Product | null, Product | null]>([null, null]);

  const [selectedHalfComplements, setSelectedHalfComplements] = useState<Product[]>([]);
  const [halfNotes, setHalfNotes] = useState<string>('');
  // Auth Form State
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '', address: '' });

  // Computed
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  // Refs para scroll automático no modal de Meio a Meio
  const complementsRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
      return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  const availableComplements = useMemo(() => {
      // Filtra produtos que são complementos e estão ativos
      return products.filter(p => p.type === 'complement' && p.isActive);
  }, [products]);

  // --- Auth Handlers ---
  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const user = customers.find(c => c.phone === authForm.phone);
      if (user) {
          setCurrentUser(user);
          setShowAuthModal(null);
          setAuthForm({ name: '', email: '', phone: '', password: '', address: '' });
      } else {
          alert("Telefone não encontrado. Por favor, cadastre-se primeiro.");
          setShowAuthModal('register');
      }
  };

  const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      if (customers.some(c => c.phone === authForm.phone)) {
          alert("Telefone já cadastrado. Faça login.");
          setShowAuthModal('login');
          return;
      }
      const newCustomer: Customer = {
          id: `cust-${Date.now()}`,
          name: authForm.name,
          email: authForm.email || `${authForm.phone}@temp.com`,
          phone: authForm.phone,
          password: authForm.phone,
          address: authForm.address,
          orders: []
      };
      setCustomers(prev => [...prev, newCustomer]);
      setCurrentUser(newCustomer);
      setShowAuthModal(null);
      setAuthForm({ name: '', email: '', phone: '', password: '', address: '' });
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setShowProfile(false);
  };

  // --- Cart Logic ---
  const addToCart = (product: Product) => {
    if (!storeConfig.isOpen) {
        alert("Desculpe, estamos fechados no momento.");
        return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && !item.isHalf);
      if (existing) {
        return prev.map(item => item.id === product.id && !item.isHalf 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, cartId: Date.now().toString(), quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const addHalfHalfToCart = () => {
    const [p1, p2] = halfSelections;
    if (!p1 || !p2) return;

    const higherPrice = Math.max(p1.price, p2.price);
    const name = `1/2 ${p1.name} + 1/2 ${p2.name}`;
    
    const newItem: CartItem = {
        id: `half-${Date.now()}`,
        cartId: `cart-half-${Date.now()}`,
        name: name,
        description: 'Pizza Meio a Meio Personalizada',
        price: higherPrice,
        category: CategoryType.HALF,
        image: 'https://picsum.photos/seed/half/400/400', // Generic image for half/half
        quantity: 1,
        isHalf: true
    };

    setCart(prev => [...prev, newItem]);
    setIsHalfModalOpen(false);
    setHalfSelections([null, null]);
    setIsCartOpen(true);
  };

  const removeFromCartWithAnimation = (cartId: string) => {
    // Add to exiting set to trigger animation
    setExitingItems(prev => new Set(prev).add(cartId));
    
    // Wait for animation to finish before actual removal
    setTimeout(() => {
        setCart(prev => prev.filter(item => item.cartId !== cartId));
        setExitingItems(prev => {
            const next = new Set(prev);
            next.delete(cartId);
            return next;
        });
    }, 300); // Duration must match CSS animation
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
        if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
    }));
  };

  const finalizeOrder = async () => {
      // 1. Verifica se o usuário está logado antes de continuar.
      //    Se não estiver, abre o modal de login e interrompe a função.
      //    Isso garante que o pedido só possa ser finalizado por um cliente identificado.
      //    A lógica de login/registro é tratada pelo modal.
      if (!currentUser) {
          setShowAuthModal('login');
          return;
      }

      setIsSubmittingOrder(true);

      // 2. Monta o payload do pedido para enviar ao backend
      const orderPayload: Order = { // Tipagem explícita para Order
        id: `ord-${Date.now()}`,
        customerName: currentUser.name,
        customerPhone: currentUser.phone,
        deliveryAddress: { full: currentUser.address }, // Adapta para o formato esperado pelo backend
        deliveryType: 'delivery', // ou 'pickup', dependendo da lógica do seu app
        items: cart,
        total: cartTotal,
      };

      try {
        // 3. Envia o pedido para o servidor de automação
        const response = await fetch('http://localhost:3030/pedidos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderPayload),
        });

        if (!response.ok) {
          throw new Error('Falha ao enviar o pedido. Tente novamente.');
        }

        // 4. Se o pedido foi enviado com sucesso, atualiza o estado local
        const newOrder: Order = { 
          ...orderPayload, 
          date: new Date().toISOString(), 
          createdAt: new Date().toISOString(), // Adiciona createdAt
          status: 'Em Produção' 
        };
        
        const updatedUser = { ...currentUser, orders: [newOrder, ...currentUser.orders] };
        setCurrentUser(updatedUser);
        setCustomers(prev => prev.map(c => c.id === currentUser.id ? updatedUser : c));

        alert('✅ Pedido enviado com sucesso! Você receberá uma notificação no WhatsApp em breve.');

        setCart([]);

      } catch (error: any) {
        console.error('❌ Erro ao finalizar pedido:', error);
        alert(`❌ ${error.message}`);
      } finally {
        setIsSubmittingOrder(false);
      }
  };

  // Admin Toggle (Secret shortcut: Double click footer copyright)
  const handleSecretAdmin = (e: React.MouseEvent) => {
    if (e.detail === 2) setView('admin');
  };

  if (view === 'admin') {
    return (
        <AdminPanel 
            products={products} 
            setProducts={setProducts}
            customers={customers}
            storeConfig={storeConfig}
            setStoreConfig={setStoreConfig}
            onExit={() => setView('client')}
        />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 shadow-md transition-colors duration-300 bg-black">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3 text-white">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="material-icons-round text-white text-xl sm:text-2xl">local_pizza</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold leading-none">{storeConfig.name}</h1>
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs opacity-90 mt-0.5 sm:mt-1">
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${storeConfig.isOpen ? 'bg-green-400' : 'bg-red-400'}`}></span>
                <span className="hidden xs:inline">{storeConfig.isOpen ? `Aberto • Fecha às ${storeConfig.closeTime}` : `Fechado • Abre às ${storeConfig.openTime}`}</span>
                <span className="xs:hidden">{storeConfig.isOpen ? 'Aberto' : 'Fechado'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-3">
             {currentUser ? (
                 <button 
                   onClick={() => setShowProfile(true)}
                   className="flex items-center gap-1 sm:gap-2 text-white hover:bg-white/20 py-1 px-2 sm:px-3 rounded-full transition-colors"
                 >
                   <span className="material-icons-round text-xl sm:text-2xl">account_circle</span>
                   <span className="text-xs sm:text-sm font-medium hidden md:inline">Olá, {currentUser.name.split(' ')[0]}</span>
                 </button>
             ) : (
                 <button 
                   onClick={() => setShowAuthModal('login')}
                   className="flex items-center gap-1 text-white hover:bg-white/20 py-1 px-2 sm:px-3 rounded-full transition-colors"
                 >
                   <span className="material-icons-round text-xl sm:text-2xl">login</span>
                   <span className="text-xs sm:text-sm font-medium hidden md:inline">Entrar</span>
                 </button>
             )}

             <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-1.5 sm:p-2 text-white hover:bg-white/20 rounded-full transition-colors"
             >
                <span className="material-icons-round text-2xl sm:text-3xl">shopping_cart</span>
                {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:top-0 sm:right-0 bg-yellow-400 text-red-900 text-[10px] sm:text-xs font-bold w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full shadow-sm border-2 border-transparent">
                    {cartCount}
                </span>
                )}
             </button>
          </div>
        </div>
        
        {/* Categories Scroller */}
        <div className="overflow-x-auto hide-scrollbar bg-white/10 backdrop-blur-md">
            <div className="flex max-w-7xl mx-auto px-3 sm:px-4">
                {Object.values(CategoryType).map(cat => (
                    <button
                        key={cat}
                        onClick={() => {
                            if(cat === CategoryType.HALF) {
                                setIsHalfModalOpen(true);
                            } else {
                                setActiveCategory(cat);
                            }
                        }}
                        className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold whitespace-nowrap border-b-2 sm:border-b-4 transition-colors ${
                            activeCategory === cat && cat !== CategoryType.HALF
                            ? 'border-white text-white' 
                            : 'border-transparent text-white/70 hover:text-white'
                        }`}
                    >
                        {cat === CategoryType.COMBO ? (
                           <span className="flex items-center gap-0.5 sm:gap-1">
                             <span className="material-icons-round text-yellow-300 text-sm sm:text-base">local_offer</span>
                             {cat}
                           </span>
                        ) : cat}
                    </button>
                ))}
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Banner/Notice */}
        {!storeConfig.isOpen && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-r flex items-center gap-3">
                <span className="material-icons-round">storefront</span>
                <p>O estabelecimento está fechado no momento. Você pode navegar pelo cardápio, mas não é possível fazer pedidos.</p>
            </div>
        )}

        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            {activeCategory === CategoryType.SALTY && <span className="material-icons-round text-orange-500">local_pizza</span>}
            {activeCategory === CategoryType.SWEET && <span className="material-icons-round text-pink-500">cake</span>}
            {activeCategory === CategoryType.DRINK && <span className="material-icons-round text-blue-500">local_bar</span>}
            {activeCategory === CategoryType.COMBO && <span className="material-icons-round text-yellow-500">stars</span>}
            {activeCategory}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAdd={addToCart}
                        primaryColor={storeConfig.primaryColor}
                    />
                ))
            ) : (
                <div className="col-span-full text-center py-10 text-gray-400">
                    <span className="material-icons-round text-4xl mb-2">sentiment_dissatisfied</span>
                    <p>Nenhum item disponível nesta categoria.</p>
                </div>
            )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-8 mt-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
              <h3 className="font-bold text-xl text-gray-800 mb-2">{storeConfig.name}</h3>
              <p className="text-gray-500 text-sm mb-4">As melhores pizzas da cidade, feitas com amor.</p>
              <div className="flex justify-center gap-4 mb-6">
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Entrega Grátis
                  </div>
                  <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    30-40 min
                  </div>
              </div>
              <p 
                onClick={handleSecretAdmin} 
                className="text-xs text-gray-300 cursor-pointer select-none hover:text-gray-400 transition-colors"
              >
                &copy; 2024 {storeConfig.name}. Todos os direitos reservados.
              </p>
          </div>
      </footer>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
            <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col transform transition-transform">
                <div className="p-3 sm:p-4 bg-gray-50 border-b flex justify-between items-center">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="material-icons-round text-xl sm:text-2xl">shopping_bag</span>
                        Seu Pedido
                    </h2>
                    <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:bg-gray-200 rounded-full p-1">
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                             <span className="material-icons-round text-6xl mb-4 text-gray-300">remove_shopping_cart</span>
                             <p>Seu carrinho está vazio.</p>
                             <button 
                                onClick={() => setIsCartOpen(false)}
                                className="mt-4 text-green-600 font-bold hover:underline"
                             >
                                Ver Cardápio
                             </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map(item => (
                                <div 
                                    key={item.cartId} 
                                    className={`flex gap-3 bg-white border rounded-lg p-2 shadow-sm relative overflow-hidden ${exitingItems.has(item.cartId) ? 'cart-item-exit' : 'cart-item-enter'}`}
                                >
                                    <div className="w-14 h-14 bg-gray-100 rounded-md overflow-hidden shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="font-bold text-gray-800 text-sm leading-tight truncate pr-6">{item.name}</h4>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{item.isHalf ? 'Meio a Meio' : item.category}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="font-bold text-green-700 text-sm">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                            
                                            {/* Compact Quantity Controls */}
                                            <div className="flex items-center bg-gray-100 rounded-md h-7">
                                                <button 
                                                    onClick={() => updateQuantity(item.cartId, -1)} 
                                                    className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-red-600 disabled:opacity-50"
                                                >
                                                    <span className="material-icons-round text-xs">remove</span>
                                                </button>
                                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                <button 
                                                    onClick={() => updateQuantity(item.cartId, 1)} 
                                                    className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-green-600"
                                                >
                                                    <span className="material-icons-round text-xs">add</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => removeFromCartWithAnimation(item.cartId)} 
                                        className="absolute top-1 right-1 text-gray-300 hover:text-red-500 p-1"
                                    >
                                        <span className="material-icons-round text-sm">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="p-3 sm:p-4 border-t bg-gray-50 space-y-2 sm:space-y-3 z-10">
                         {currentUser && (
                             <div className="bg-yellow-50 p-2 sm:p-3 rounded text-xs sm:text-sm text-yellow-800 border border-yellow-100 flex items-start gap-2">
                                 <span className="material-icons-round text-sm mt-0.5">location_on</span>
                                 <div>
                                     <span className="font-bold block">Entrega para:</span>
                                     {currentUser.address}
                                 </div>
                             </div>
                         )}

                        <div className="flex justify-between items-center text-base sm:text-lg font-bold text-gray-800">
                            <span>Total</span>
                            <span>R$ {cartTotal.toFixed(2)}</span>
                        </div> 
                        <button 
                            disabled={isSubmittingOrder}
                            className="w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                            style={{ backgroundColor: storeConfig.secondaryColor }}
                            onClick={finalizeOrder}
                        >
                            {isSubmittingOrder ? (
                                <>Enviando...</>
                            ) : (
                                <><span className="material-icons-round text-xl sm:text-2xl">send</span>
                                Finalizar Pedido</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Half & Half Modal */}
      {isHalfModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
                      <div>
                          <h2 className="text-xl font-bold text-gray-800">Montar Meio a Meio</h2>
                          <p className="text-sm text-gray-500">Escolha dois sabores deliciosos</p>
                      </div>
                      <button onClick={() => setIsHalfModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <span className="material-icons-round">close</span>
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                      <div className="grid grid-cols-2 gap-6 mb-6">
                          {[0, 1].map(index => (
                              <div key={index} className={`border-2 rounded-xl p-4 text-center transition-all ${halfSelections[index] ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300'}`}>
                                  <h4 className="text-sm font-bold text-gray-500 mb-2">Metade {index + 1}</h4>
                                  {halfSelections[index] ? (
                                      <div className="flex flex-col items-center">
                                          <img src={halfSelections[index]!.image} className="w-16 h-16 rounded-full object-cover mb-2" alt="" />
                                          <span className="font-bold text-gray-800 text-sm line-clamp-1">{halfSelections[index]!.name}</span>
                                          <span className="text-xs text-green-700 font-semibold">R$ {halfSelections[index]!.price.toFixed(2)}</span>
                                          <button 
                                            onClick={() => {
                                                const newSel = [...halfSelections] as [Product|null, Product|null];
                                                newSel[index] = null;
                                                setHalfSelections(newSel);
                                            }}
                                            className="mt-2 text-xs text-red-500 hover:underline"
                                          >
                                              Alterar
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="py-4 text-gray-400">
                                          <span className="material-icons-round text-3xl block mb-1">pie_chart</span>
                                          Selecione abaixo
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>

                      <h3 className="font-bold text-gray-700 mb-3">Sabores Disponíveis</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {products.filter(p => p.category === CategoryType.SALTY).map(p => {
                              const isSelected = halfSelections.some(s => s?.id === p.id);
                              return (
                                  <button
                                    key={p.id}
                                    onClick={() => {
                                        // Lógica de seleção de sabor
                                        const emptyIndex = halfSelections.findIndex(s => s === null);
                                        if (emptyIndex !== -1 && !isSelected) {
                                            const newSel = [...halfSelections] as [Product|null, Product|null];
                                            newSel[emptyIndex] = p;
                                            // Scroll automático para a seção de complementos
                                            setHalfSelections(newSel);
                                            complementsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                    }}
                                    disabled={isSelected || (!halfSelections.includes(null))}
                                    className={`flex items-center gap-3 p-2 rounded-lg border text-left transition-all ${
                                        isSelected 
                                        ? 'bg-gray-100 border-gray-200 opacity-50 cursor-default' 
                                        : !halfSelections.includes(null) 
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : 'hover:border-green-500 hover:shadow-sm hover:bg-green-50'
                                    }`}
                                  >
                                      <img src={p.image} alt={p.name} className="w-12 h-12 rounded object-cover" />
                                      <div className="flex-1 min-w-0">
                                          <div className="text-sm font-bold text-gray-800 truncate">{p.name}</div>
                                          <div className="text-xs text-gray-500">R$ {p.price.toFixed(2)}</div>
                                      </div>
                                      {isSelected && <span className="material-icons-round text-green-600 text-sm">check_circle</span>}
                                  </button>
                              );
                          })}
                      </div>
                      
                      {/* Seção de Complementos */}
                      <div ref={complementsRef} className="mt-6 pt-6 border-t border-gray-200">
                          <h3 className="font-bold text-gray-700 mb-3">Adicionar Complementos (Bordas, etc.)</h3>
                          {availableComplements.length === 0 ? (
                              <p className="text-gray-500 text-sm">Nenhum complemento disponível.</p>
                          ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {availableComplements.map(comp => (
                                      <label key={comp.id} className="flex items-center gap-3 p-2 rounded-lg border text-left cursor-pointer hover:border-blue-500 hover:shadow-sm hover:bg-blue-50">
                                          <input
                                              type="checkbox"
                                              checked={selectedHalfComplements.some(s => s.id === comp.id)}
                                              onChange={(e) => {
                                                  if (e.target.checked) {
                                                      setSelectedHalfComplements(prev => [...prev, comp]);
                                                  } else {
                                                      setSelectedHalfComplements(prev => prev.filter(s => s.id !== comp.id));
                                                  }
                                                  // Scroll automático para a seção de observações após selecionar um complemento
                                                  notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                              }}
                                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                          />
                                          <div className="flex-1 min-w-0">
                                              <div className="text-sm font-bold text-gray-800 truncate">{comp.name}</div>
                                              <div className="text-xs text-gray-500">R$ {comp.price.toFixed(2)}</div>
                                          </div>
                                      </label>
                                  ))}
                              </div>
                          )}
                      </div>

                      {/* Seção de Observações */}
                      <div ref={notesRef} className="mt-6 pt-6 border-t border-gray-200">
                          <h3 className="font-bold text-gray-700 mb-3">Observações do Pedido</h3>
                          <textarea
                              value={halfNotes}
                              onChange={(e) => setHalfNotes(e.target.value)}
                              placeholder="Ex: Sem cebola, massa bem passada, etc."
                              rows={3}
                              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          ></textarea>
                      </div>
                  </div>


                  <div className="p-4 bg-white border-t flex justify-end gap-3">
                      <button 
                        onClick={() => setIsHalfModalOpen(false)}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={addHalfHalfToCart}
                        disabled={halfSelections.some(s => s === null)}
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 disabled:opacity-50 disabled:shadow-none"
                      >
                          Adicionar Pizza (R$ {
                             Math.max(
                                 halfSelections[0]?.price || 0, 
                                 halfSelections[1]?.price || 0
                             ).toFixed(2)
                          })
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Auth Modal (Login/Register) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fadeIn">
                 <div className="flex justify-between items-center mb-6">
                     <div>
                         <h2 className="text-2xl font-bold text-gray-800">
                             Identificação
                         </h2>
                         <p className="text-sm text-gray-500 mt-1">Para continuar com seu pedido</p>
                     </div>
                     <button onClick={() => setShowAuthModal(null)} className="text-gray-400 hover:text-gray-600">
                         <span className="material-icons-round">close</span>
                     </button>
                 </div>

                 <form onSubmit={showAuthModal === 'login' ? handleLogin : handleRegister} className="space-y-5">
                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                             <span className="material-icons-round text-green-600 text-lg">person</span>
                             Nome Completo
                         </label>
                         <input 
                             required
                             type="text"
                             className="w-full p-3 sm:p-4 border-2 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all text-base"
                             placeholder="Ex: Flavio Silva"
                             value={authForm.name}
                             onChange={e => setAuthForm({...authForm, name: e.target.value})}
                         />
                     </div>

                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                             <span className="material-icons-round text-green-600 text-lg">phone</span>
                             Telefone (WhatsApp)
                         </label>
                         <input 
                             required
                             type="tel"
                             className="w-full p-3 sm:p-4 border-2 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all text-base"
                             placeholder="Ex: 13 99651-1793"
                             value={authForm.phone}
                             onChange={e => setAuthForm({...authForm, phone: e.target.value})}
                         />
                         <p className="text-xs text-gray-500 mt-1 ml-1">Usaremos para enviar atualizações do pedido</p>
                     </div>

                     {showAuthModal === 'register' && (
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                 <span className="material-icons-round text-green-600 text-lg">location_on</span>
                                 Endereço de Entrega
                             </label>
                             <input 
                                 required
                                 type="text"
                                 className="w-full p-3 sm:p-4 border-2 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all text-base"
                                 placeholder="Rua, Número, Bairro, Complemento"
                                 value={authForm.address}
                                 onChange={e => setAuthForm({...authForm, address: e.target.value})}
                             />
                         </div>
                     )}

                     <button 
                         type="submit"
                         className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all mt-6 flex items-center justify-center gap-2"
                     >
                         <span className="material-icons-round">check_circle</span>
                         {showAuthModal === 'login' ? 'Continuar' : 'Cadastrar e Continuar'}
                     </button>
                 </form>

                 <div className="mt-6 text-center text-sm text-gray-600">
                     {showAuthModal === 'login' ? (
                         <p>
                             Primeira vez aqui?{' '}
                             <button onClick={() => setShowAuthModal('register')} className="text-green-600 font-bold hover:underline">
                                 Cadastre-se
                             </button>
                         </p>
                     ) : (
                         <p>
                             Já é cliente?{' '}
                             <button onClick={() => setShowAuthModal('login')} className="text-green-600 font-bold hover:underline">
                                 Faça Login
                             </button>
                         </p>
                     )}
                 </div>

                 <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
                     <div className="flex items-start gap-3">
                         <span className="material-icons-round text-green-600 text-xl">info</span>
                         <div className="text-xs text-gray-600">
                             <p className="font-semibold text-green-700 mb-1">Seus dados estão seguros</p>
                             <p>Não compartilharemos suas informações com terceiros.</p>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && currentUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 bg-gradient-to-r from-green-600 to-green-700 text-white flex justify-between items-start">
                      <div>
                          <h2 className="text-2xl font-bold flex items-center gap-2">
                              <span className="material-icons-round">account_circle</span>
                              Minha Conta
                          </h2>
                          <p className="opacity-90 mt-1">{currentUser.name}</p>
                      </div>
                      <button onClick={() => setShowProfile(false)} className="text-white/70 hover:text-white">
                          <span className="material-icons-round text-2xl">close</span>
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                      <section className="mb-8">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Meus Dados</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                  <span className="text-gray-500 block mb-1">E-mail</span>
                                  <span className="font-medium">{currentUser.email}</span>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                  <span className="text-gray-500 block mb-1">Telefone</span>
                                  <span className="font-medium">{currentUser.phone}</span>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg col-span-full">
                                  <span className="text-gray-500 block mb-1">Endereço de Entrega</span>
                                  <span className="font-medium flex items-center gap-2">
                                      <span className="material-icons-round text-red-500 text-sm">place</span>
                                      {currentUser.address}
                                  </span>
                              </div>
                          </div>
                      </section>

                      <section>
                          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Histórico de Pedidos</h3>
                          {currentUser.orders.length === 0 ? (
                              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
                                  <span className="material-icons-round text-4xl mb-2">receipt_long</span>
                                  <p>Você ainda não fez nenhum pedido.</p>
                              </div>
                          ) : (
                              <div className="space-y-3">
                                  {currentUser.orders.map(order => (
                                      <div key={order.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                                          <div className="flex justify-between items-start mb-2">
                                              <div>
                                                  <span className="font-bold text-gray-800">Pedido #{order.id.slice(-4)}</span>
                                                  <div className="text-xs text-gray-500">
                                                      {new Date(order.date).toLocaleDateString()} às {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                  </div>
                                              </div>
                                              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                                                  {order.status}
                                              </span>
                                          </div>
                                          <ul className="text-sm text-gray-600 mb-3 space-y-1">
                                              {order.items.map((item, idx) => (
                                                  <li key={idx} className="flex justify-between">
                                                      <span>{item.quantity}x {item.name}</span>
                                                      <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                                  </li>
                                              ))}
                                          </ul>
                                          <div className="border-t pt-2 flex justify-between font-bold text-gray-800">
                                              <span>Total</span>
                                              <span>R$ {order.total.toFixed(2)}</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </section>
                  </div>

                  <div className="p-4 bg-gray-50 border-t flex justify-end">
                      <button 
                          onClick={handleLogout}
                          className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                      >
                          <span className="material-icons-round">logout</span>
                          Sair da Conta
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
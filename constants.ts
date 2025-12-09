import { CategoryType, Product, StoreConfig, Customer, Category } from './types';

export const INITIAL_STORE_CONFIG: StoreConfig = {
  name: "Pizzaria Zattera",
  primaryColor: "#dc2626", // red-600
  secondaryColor: "#15803d", // green-700
  openTime: "18:00",
  closeTime: "23:59",
  isOpen: true,
};

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Salgada',
    icon: 'local_pizza',
    color: '#f97316',
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-2',
    name: 'Doce',
    icon: 'cake',
    color: '#ec4899',
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-3',
    name: 'Bebidas',
    icon: 'local_bar',
    color: '#3b82f6',
    order: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-4',
    name: 'Combos & Promoções',
    icon: 'stars',
    color: '#eab308',
    order: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'combo1',
    name: 'Combo Família',
    description: '1 Pizza Gigante (Salgada) + 1 Pizza Doce Pequena + 1 Coca-Cola 2L.',
    price: 89.90,
    category: CategoryType.COMBO,
    image: 'https://picsum.photos/seed/combo1/400/400',
    isFeatured: true,
    isActive: true,
    stock: 999,
    preparationTime: 40
  },
  {
    id: '1',
    name: 'Margherita Speciale',
    description: 'Molho de tomate artesanal, mussarela de búfala, folhas de manjericão fresco e azeite extra virgem.',
    price: 45.00,
    category: CategoryType.SALTY,
    image: 'https://picsum.photos/seed/pizza1/400/400',
    isActive: true,
    stock: 999,
    preparationTime: 30
  },
  {
    id: '2',
    name: 'Calabresa Acebolada',
    description: 'Molho de tomate, calabresa fatiada defumada, cebola roxa em rodelas, azeitonas pretas e orégano.',
    price: 42.00,
    category: CategoryType.SALTY,
    image: 'https://picsum.photos/seed/pizza2/400/400'
  },
  {
    id: '3',
    name: 'Portuguesa Clássica',
    description: 'Molho, presunto cozido, ovos cozidos, cebola, ervilha fresca, cobertura de mussarela e azeitonas.',
    price: 48.00,
    category: CategoryType.SALTY,
    image: 'https://picsum.photos/seed/pizza3/400/400'
  },
  {
    id: '4',
    name: 'Chocolate com Morango',
    description: 'Base de creme de leite, chocolate ao leite derretido com morangos frescos selecionados.',
    price: 35.00,
    category: CategoryType.SWEET,
    image: 'https://picsum.photos/seed/pizza4/400/400'
  },
  {
    id: '5',
    name: 'Coca-Cola 2L',
    description: 'Refrigerante gelado.',
    price: 12.00,
    category: CategoryType.DRINK,
    image: 'https://picsum.photos/seed/coke/400/400'
  },
  {
    id: 'promo1',
    name: 'Terça em Dobro',
    description: 'Compre 2 Pizzas Grandes e pague apenas 1. Válido apenas para sabores tradicionais.',
    price: 55.00,
    category: CategoryType.COMBO,
    image: 'https://picsum.photos/seed/promo/400/400',
    isFeatured: true
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust1',
    name: 'João Silva',
    phone: '11999999999',
    email: 'joao@email.com',
    password: '123',
    address: 'Rua das Flores, 123, Centro',
    orders: [
      {
        id: 'order1',
        date: new Date().toISOString(),
        items: [],
        total: 45.00,
        status: 'Concluído'
      }
    ]
  }
];
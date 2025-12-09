export enum CategoryType {
  SALTY = 'Salgada',
  SWEET = 'Doce',
  DRINK = 'Bebidas',
  HALF = 'Meio a Meio',
  COMBO = 'Combos & Promoções'
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  priceSmall?: number; // Preço broto/pequeno
  category: CategoryType | string; // Permite categorias customizadas
  image: string;
  isFeatured?: boolean;
  isActive?: boolean; // Para pausar produtos
  stock?: number; // Controle de estoque
  preparationTime?: number; // Tempo de preparo em minutos
  type?: 'product' | 'complement'; // Diferencia produtos de complementos (bordas)
}

export interface Complement extends Product {
  type: 'complement';
}

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  notes?: string;
  isHalf?: boolean;
  secondHalfName?: string;
  size?: 'grande' | 'broto'; // Tamanho da pizza
  selectedComplements?: Complement[]; // Complementos selecionados (bordas)
  complementsPrice?: number; // Preço total dos complementos
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'Em Produção' | 'Pendente' | 'Preparando' | 'Pronto' | 'Saiu para Entrega' | 'Entregue' | 'Concluído' | 'Cancelado';
  paymentMethod?: string;
  deliveryType?: 'delivery' | 'pickup';
  deliveryAddress?: { full: string; complement?: string; reference?: string; };
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  password?: string; // In a real app, this would be hashed
  address: string;
  orders: Order[];
}

export interface StoreConfig {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}
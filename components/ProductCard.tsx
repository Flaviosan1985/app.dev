import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  primaryColor: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd, primaryColor }) => {
  return (
    <div className={`bg-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden border-2 flex flex-col h-full ${product.isFeatured ? 'border-yellow-400 ring-1 ring-yellow-400 relative' : 'border-black'}`}>
      
      {product.isFeatured && (
        <div className="absolute top-0 right-0 bg-yellow-400 text-red-900 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-bl-lg z-10 shadow-sm">
          OFERTA ESPECIAL
        </div>
      )}

      <div className="relative h-24 sm:h-40 md:h-48 overflow-hidden bg-gray-100">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-2 sm:p-3 md:p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1 sm:mb-2">
          <h3 className="font-bold text-xs sm:text-base md:text-lg text-gray-800 leading-tight">{product.name}</h3>
          <span className="font-semibold text-green-700 whitespace-nowrap ml-1 sm:ml-2 text-xs sm:text-base">
            R$ {product.price.toFixed(2)}
          </span>
        </div>
        <div className="text-gray-600 text-[10px] sm:text-sm mb-1.5 sm:mb-3 md:mb-4 flex-1">
          <span className="font-medium text-gray-400 text-[9px] sm:text-xs uppercase block mb-0.5 sm:mb-1">Ingredientes:</span>
          <p className="line-clamp-1 sm:line-clamp-3">{product.description}</p>
        </div>
        <button
          onClick={() => onAdd(product)}
          className="w-full py-1.5 sm:py-2.5 rounded-md sm:rounded-lg text-white font-medium text-[10px] sm:text-sm shadow-sm flex items-center justify-center gap-1 sm:gap-2 active:scale-95 transition-transform"
          style={{ backgroundColor: primaryColor }}
        >
          <span className="material-icons-round text-sm sm:text-base">add_shopping_cart</span>
          <span className="hidden xs:inline">Adicionar</span>
          <span className="xs:hidden">Add</span>
        </button>
      </div>
    </div>
  );
};
import { useState } from 'react';
import { Category } from '../types';

interface CategoryFormProps {
  category?: Category;
  onSave: (category: Partial<Category>) => Promise<void>;
  onClose: () => void;
}

const MATERIAL_ICONS = [
  'local_pizza', 'restaurant', 'fastfood', 'lunch_dining', 'dinner_dining',
  'local_drink', 'local_cafe', 'emoji_food_beverage', 'liquor', 'beer',
  'icecream', 'cake', 'cookie', 'bakery_dining', 'ramen_dining'
];

const COLORS = [
  '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2',
  '#2563eb', '#7c3aed', '#c026d3', '#e11d48', '#f59e0b'
];

export default function CategoryForm({ category, onSave, onClose }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    icon: category?.icon || 'category',
    color: category?.color || '#dc2626',
    isActive: category?.isActive ?? true,
    order: category?.order || 0
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      alert('Erro ao salvar categoria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800">
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Preview */}
          <div className="flex justify-center">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: formData.color + '30' }}
            >
              <span 
                className="material-icons-round text-5xl"
                style={{ color: formData.color }}
              >
                {formData.icon}
              </span>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Categoria *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          {/* Ícone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ícone
            </label>
            <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {MATERIAL_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`p-2 rounded-lg transition-all ${
                    formData.icon === icon
                      ? 'bg-red-100 ring-2 ring-red-500'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="material-icons-round text-gray-700">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cor
            </label>
            <div className="grid grid-cols-5 gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-full h-10 rounded-lg transition-all ${
                    formData.color === color
                      ? 'ring-4 ring-offset-2 ring-gray-400'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Ordem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordem de Exibição
            </label>
            <input
              type="number"
              min="0"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Categoria ativa
            </label>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-icons-round animate-spin">refresh</span>
                  Salvando...
                </>
              ) : (
                <>
                  <span className="material-icons-round">save</span>
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

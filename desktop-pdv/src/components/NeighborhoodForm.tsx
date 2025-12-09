import { useState, useEffect } from 'react';
import { Neighborhood } from '../types';

interface NeighborhoodFormProps {
  neighborhood?: Neighborhood;
  onSave: (neighborhood: Omit<Neighborhood, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => void;
  onClose: () => void;
}

export default function NeighborhoodForm({ neighborhood, onSave, onClose }: NeighborhoodFormProps) {
  const [formData, setFormData] = useState<Partial<Neighborhood>>({
    name: '',
    city: 'Santos',
    deliveryFee: 0,
    isActive: true
  });

  useEffect(() => {
    if (neighborhood) {
      setFormData(neighborhood);
    }
  }, [neighborhood]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const neighborhoodData: any = {
      name: formData.name || '',
      city: formData.city || 'Santos',
      deliveryFee: Number(formData.deliveryFee) || 0,
      isActive: formData.isActive ?? true
    };

    // Se estiver editando, incluir id e createdAt
    if (neighborhood) {
      neighborhoodData.id = neighborhood.id;
      neighborhoodData.createdAt = neighborhood.createdAt;
    }

    onSave(neighborhoodData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="material-icons-round text-red-600">location_city</span>
          {neighborhood ? 'Editar Bairro' : 'Novo Bairro'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome do Bairro *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              placeholder="Ex: Centro, Gonzaga, José Menino"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cidade *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              placeholder="Ex: Santos"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Taxa de Entrega (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.deliveryFee}
              onChange={(e) => setFormData({ ...formData, deliveryFee: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Bairro ativo para entregas
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              {neighborhood ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

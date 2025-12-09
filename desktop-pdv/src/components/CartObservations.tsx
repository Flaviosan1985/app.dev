import { useState } from 'react';

interface CartObservationsProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CartObservations({ value, onChange }: CartObservationsProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="p-4 bg-gray-800 border-t-2 border-gray-700 flex-shrink-0">
      {!show ? (
        <button
          onClick={() => setShow(true)}
          className="flex items-center gap-2 text-base text-gray-300 hover:text-green-400 border-2 border-dashed border-gray-600 rounded-lg px-4 py-3 w-full hover:border-green-500 transition-all"
        >
          <span className="material-icons-round text-lg">add</span>
          Adicionar observação
        </button>
      ) : (
        <div className="space-y-3 animate-in fade-in">
          <div>
            <label className="text-base text-gray-300 mb-3 block font-bold flex items-center gap-2">
              <span className="material-icons-round text-lg text-yellow-400">edit_note</span>
              Observações do Pedido
            </label>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-base bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none transition-all outline-none"
              placeholder="Ex: Sem cebola, massa fina, bem assada..."
            />
          </div>
          <button
            onClick={() => {
              onChange('');
              setShow(false);
            }}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/30 px-3 py-2 rounded-lg transition-colors"
          >
            <span className="material-icons-round text-base">delete</span>
            Remover observação
          </button>
        </div>
      )}
    </div>
  );
}

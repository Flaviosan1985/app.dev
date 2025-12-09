import React, { useState, useRef } from 'react';
import { editPizzaImage } from '../services/geminiService';

interface AIImageEditorProps {
  onImageSave: (base64: string) => void;
  initialImage?: string;
  onClose: () => void;
}

export const AIImageEditor: React.FC<AIImageEditorProps> = ({ onImageSave, initialImage, onClose }) => {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!image || !prompt) return;

    setLoading(true);
    setError(null);

    try {
      // Extract mime type
      const matches = image.match(/^data:(.+);base64,/);
      const mimeType = matches ? matches[1] : 'image/png';
      
      const generatedImage = await editPizzaImage(image, mimeType, prompt);
      setImage(generatedImage);
    } catch (err) {
      setError("Falha ao gerar imagem. Verifique sua chave de API ou tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="material-icons-round text-purple-600">auto_awesome</span>
            Editor de Fotos IA
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            
           {/* Image Preview Area */}
           <div className="mb-6 flex justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 relative min-h-[200px] items-center group">
              {image ? (
                <img src={image} alt="Preview" className="max-h-[400px] w-full object-contain rounded" />
              ) : (
                <div className="text-center text-gray-400">
                  <span className="material-icons-round text-4xl">image</span>
                  <p>Nenhuma imagem selecionada</p>
                </div>
              )}
              
              <div className="absolute bottom-2 right-2 flex gap-2">
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-gray-700 p-2 rounded-full shadow hover:bg-gray-100"
                    title="Upload nova imagem"
                 >
                   <span className="material-icons-round">upload</span>
                 </button>
              </div>
           </div>
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileChange} 
             className="hidden" 
             accept="image/*"
           />

           {/* Controls */}
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Prompt de IA (O que você quer mudar?)
               </label>
               <div className="flex gap-2">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: Adicione folhas de manjericão, aplique filtro retrô..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !image || !prompt}
                    className={`px-6 py-3 rounded-lg font-bold text-white flex items-center gap-2 transition-colors ${
                       loading || !image || !prompt 
                       ? 'bg-gray-300 cursor-not-allowed' 
                       : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin material-icons-round text-sm">refresh</span>
                        Gerando...
                      </>
                    ) : (
                      <>
                        <span className="material-icons-round">auto_fix_high</span>
                        Gerar
                      </>
                    )}
                  </button>
               </div>
               <p className="text-xs text-gray-500 mt-1">
                 Utiliza Gemini 2.5 Flash Image (Nano Banana). Tente pedir para remover fundos ou melhorar a iluminação.
               </p>
             </div>
             
             {error && (
               <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
                 {error}
               </div>
             )}
           </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg"
          >
            Cancelar
          </button>
          <button 
            onClick={() => {
              if (image) onImageSave(image);
            }}
            disabled={!image}
            className="px-4 py-2 bg-green-600 text-white font-medium hover:bg-green-700 rounded-lg disabled:opacity-50"
          >
            Salvar Imagem
          </button>
        </div>
      </div>
    </div>
  );
};

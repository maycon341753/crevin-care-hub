import React from 'react';

const ExemploImagem: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Exemplos de Imagem em Div</h2>
      
      {/* Método 1: Tag img dentro de div */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">1. Usando tag &lt;img&gt;</h3>
        <div className="flex justify-center bg-gray-100 p-4 rounded">
          <img 
            src="/images/crevin.jpg" 
            alt="Logo Crevin" 
            className="max-w-full h-auto rounded-lg shadow-md"
            style={{ maxWidth: '300px' }}
          />
        </div>
      </div>

      {/* Método 2: Background image */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">2. Como background-image</h3>
        <div 
          className="w-full h-48 bg-cover bg-center rounded-lg shadow-md flex items-center justify-center"
          style={{ 
            backgroundImage: 'url(/images/crevin.jpg)',
            backgroundColor: '#f3f4f6' // fallback color
          }}
        >
          <div className="bg-black bg-opacity-50 text-white p-4 rounded">
            <p>Conteúdo sobre a imagem</p>
          </div>
        </div>
      </div>

      {/* Método 3: Imagem responsiva com container */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">3. Container responsivo</h3>
        <div className="relative overflow-hidden rounded-lg shadow-md">
          <img 
            src="/images/crevin.jpg" 
            alt="Logo Crevin responsivo" 
            className="w-full h-64 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <p className="text-white font-semibold">Logo Crevin</p>
          </div>
        </div>
      </div>

      {/* Método 4: Grid de imagens */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">4. Grid de imagens</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((index) => (
            <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
              <img 
                src="/images/crevin.jpg"
                alt={`Logo Crevin ${index}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Fallback para quando a imagem não existe
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExemploImagem;
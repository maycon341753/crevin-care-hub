import React from 'react';

const TesteImagemSimples: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Teste Simples da Imagem Crevin</h1>
      
      {/* Teste 1: Caminho absoluto */}
      <div className="mb-8 border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Teste 1: Caminho absoluto (/images/crevin.jpg)</h2>
        <div className="bg-gray-100 p-4 rounded">
          <img 
            src="/images/crevin.jpg" 
            alt="Logo Crevin - Caminho Absoluto" 
            className="max-w-xs border"
            onLoad={() => console.log('Imagem carregada com sucesso - caminho absoluto')}
            onError={(e) => {
              console.error('Erro ao carregar imagem - caminho absoluto:', e);
              const target = e.target as HTMLImageElement;
              target.style.border = '2px solid red';
              target.alt = 'ERRO: Imagem não encontrada';
            }}
          />
        </div>
      </div>

      {/* Teste 2: Caminho relativo */}
      <div className="mb-8 border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Teste 2: Caminho relativo (./images/crevin.jpg)</h2>
        <div className="bg-gray-100 p-4 rounded">
          <img 
            src="./images/crevin.jpg" 
            alt="Logo Crevin - Caminho Relativo" 
            className="max-w-xs border"
            onLoad={() => console.log('Imagem carregada com sucesso - caminho relativo')}
            onError={(e) => {
              console.error('Erro ao carregar imagem - caminho relativo:', e);
              const target = e.target as HTMLImageElement;
              target.style.border = '2px solid red';
              target.alt = 'ERRO: Imagem não encontrada';
            }}
          />
        </div>
      </div>

      {/* Teste 3: Background image */}
      <div className="mb-8 border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Teste 3: Background Image</h2>
        <div 
          className="w-64 h-64 bg-cover bg-center border rounded"
          style={{ 
            backgroundImage: 'url(/images/crevin.jpg)',
            backgroundColor: '#f3f4f6'
          }}
        >
          <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-30 text-white font-bold">
            Background Image
          </div>
        </div>
      </div>

      {/* Teste 4: Verificação de arquivo */}
      <div className="mb-8 border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Teste 4: Link direto para verificação</h2>
        <p className="mb-2">Clique no link abaixo para verificar se o arquivo existe:</p>
        <a 
          href="/images/crevin.jpg" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          /images/crevin.jpg
        </a>
      </div>

      {/* Informações de debug */}
      <div className="border p-4 rounded bg-yellow-50">
        <h2 className="text-xl font-semibold mb-4">Informações de Debug</h2>
        <p><strong>URL atual:</strong> {window.location.href}</p>
        <p><strong>Base URL:</strong> {window.location.origin}</p>
        <p><strong>Caminho esperado da imagem:</strong> {window.location.origin}/images/crevin.jpg</p>
        <p className="mt-2 text-sm text-gray-600">
          Abra o console do navegador (F12) para ver mensagens de debug sobre o carregamento das imagens.
        </p>
      </div>
    </div>
  );
};

export default TesteImagemSimples;
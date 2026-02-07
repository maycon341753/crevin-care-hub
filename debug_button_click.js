// Script para debugar o botão de criar usuário
// Cole este código no console do navegador na página de usuários

console.log('🔍 Iniciando debug do botão de criar usuário...');

// Verificar se o botão existe
const createButton = document.querySelector('button:contains("Criar Usuário")') || 
                    Array.from(document.querySelectorAll('button')).find(btn => 
                      btn.textContent.includes('Criar Usuário')
                    );

if (createButton) {
  console.log('✅ Botão encontrado:', createButton);
  
  // Verificar se tem event listeners
  console.log('📋 Event listeners:', getEventListeners(createButton));
  
  // Adicionar listener temporário para debug
  createButton.addEventListener('click', function(e) {
    console.log('🖱️ Botão clicado!', e);
    console.log('📊 Estado do formulário:', {
      email: document.querySelector('#email')?.value,
      password: document.querySelector('#password')?.value,
      full_name: document.querySelector('#full_name')?.value,
      role: document.querySelector('[role="combobox"]')?.textContent
    });
  });
  
} else {
  console.log('❌ Botão não encontrado');
  console.log('🔍 Botões disponíveis:', 
    Array.from(document.querySelectorAll('button')).map(btn => btn.textContent)
  );
}

// Verificar erros no console
console.log('🚨 Verificando erros...');
window.addEventListener('error', function(e) {
  console.error('❌ Erro JavaScript:', e.error);
});

// Verificar se React está funcionando
if (window.React) {
  console.log('⚛️ React carregado:', window.React.version);
} else {
  console.log('❌ React não encontrado');
}

// Verificar se há erros de rede
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('🌐 Fetch chamado:', args[0]);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('📡 Resposta:', response.status, response.statusText);
      return response;
    })
    .catch(error => {
      console.error('❌ Erro de rede:', error);
      throw error;
    });
};

console.log('✅ Debug configurado! Agora tente clicar no botão.');
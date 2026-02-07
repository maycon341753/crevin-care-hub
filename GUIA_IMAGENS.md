# 📸 Guia Completo: Como Usar Imagens em Divs no Projeto

## 📁 Onde Colocar as Imagens

### 1. **Pasta Recomendada: `/public/images/`**
```
crevin-care-hub/
├── public/
│   ├── images/          ← COLOQUE SUAS IMAGENS AQUI
│   │   ├── logo.png
│   │   ├── avatar.jpg
│   │   └── background.jpg
│   ├── favicon.ico
│   └── robots.txt
```

### 2. **Por que usar `/public/images/`?**
- ✅ Acesso direto via URL (`/images/nome-da-imagem.jpg`)
- ✅ Não passa pelo bundler (carregamento mais rápido)
- ✅ Fácil de referenciar no código
- ✅ Organização clara dos assets

## 🖼️ Formas de Inserir Imagem em Div

### **Método 1: Tag `<img>` (Mais Comum)**
```tsx
<div className="container-imagem">
  <img 
    src="/images/sua-imagem.jpg" 
    alt="Descrição da imagem" 
    className="w-full h-auto rounded-lg"
  />
</div>
```

**Vantagens:**
- ✅ Semântica correta (SEO)
- ✅ Atributo `alt` para acessibilidade
- ✅ Fácil de estilizar
- ✅ Suporte a lazy loading

### **Método 2: Background Image**
```tsx
<div 
  className="w-full h-64 bg-cover bg-center rounded-lg"
  style={{ backgroundImage: 'url(/images/sua-imagem.jpg)' }}
>
  <div className="p-4">
    <h3>Conteúdo sobre a imagem</h3>
  </div>
</div>
```

**Vantagens:**
- ✅ Permite conteúdo sobreposto
- ✅ Controle total do posicionamento
- ✅ Efeitos visuais mais fáceis

### **Método 3: Com Tailwind CSS**
```tsx
<div className="relative">
  <img 
    src="/images/sua-imagem.jpg" 
    alt="Descrição" 
    className="w-full h-48 object-cover rounded-lg shadow-lg"
  />
  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
    <p>Legenda da imagem</p>
  </div>
</div>
```

## 🎨 Classes Tailwind Úteis para Imagens

### **Dimensões:**
- `w-full` - Largura 100%
- `h-auto` - Altura automática (mantém proporção)
- `h-48` - Altura fixa (192px)
- `max-w-sm` - Largura máxima pequena

### **Object Fit:**
- `object-cover` - Cobre todo o container (pode cortar)
- `object-contain` - Mantém imagem inteira (pode ter espaços)
- `object-center` - Centraliza a imagem

### **Efeitos:**
- `rounded-lg` - Bordas arredondadas
- `shadow-md` - Sombra média
- `hover:scale-105` - Zoom no hover
- `transition-transform` - Animação suave

## 📱 Imagens Responsivas

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="aspect-square overflow-hidden rounded-lg">
    <img 
      src="/images/imagem1.jpg" 
      alt="Imagem 1" 
      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
    />
  </div>
</div>
```

## 🛡️ Tratamento de Erros

```tsx
<img 
  src="/images/sua-imagem.jpg" 
  alt="Descrição" 
  onError={(e) => {
    const target = e.target as HTMLImageElement;
    target.src = '/placeholder.svg'; // Imagem de fallback
  }}
/>
```

## 📋 Checklist de Boas Práticas

- [ ] ✅ Imagem na pasta `/public/images/`
- [ ] ✅ Sempre usar atributo `alt`
- [ ] ✅ Otimizar tamanho das imagens
- [ ] ✅ Usar formatos modernos (WebP, AVIF)
- [ ] ✅ Implementar lazy loading quando necessário
- [ ] ✅ Ter imagem de fallback para erros
- [ ] ✅ Testar responsividade em diferentes telas

## 🚀 Exemplo Prático no Projeto

Para ver todos os exemplos funcionando, importe o componente:

```tsx
import ExemploImagem from './components/ExemploImagem';

// No seu componente:
<ExemploImagem />
```

## 📝 Formatos Recomendados

| Formato | Uso Recomendado | Tamanho |
|---------|----------------|---------|
| **JPG** | Fotos, imagens complexas | Menor |
| **PNG** | Logos, ícones, transparência | Médio |
| **SVG** | Ícones, ilustrações simples | Muito pequeno |
| **WebP** | Uso geral (moderno) | Muito pequeno |

---

**💡 Dica:** Sempre teste suas imagens em diferentes dispositivos e conexões para garantir uma boa experiência do usuário!
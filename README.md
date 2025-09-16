# 🚀 Console Rules

> **Uma extensão moderna para gerenciar e executar snippets de código JavaScript diretamente no console do navegador**

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-brightgreen?style=flat-square&logo=google-chrome)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-0.1.0-blue?style=flat-square)](https://github.com/matheuspuppe/console-rules)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

## ✨ Características

- 🎯 **Interface Moderna**: Design limpo e intuitivo com tema escuro
- 💾 **Gerenciamento de Snippets**: Salve, edite, duplique e organize seus códigos
- ⚡ **Execução Rápida**: Execute snippets diretamente no contexto da página ativa
- 🔍 **Busca Inteligente**: Encontre rapidamente seus snippets salvos
- 📤 **Importar/Exportar**: Compartilhe seus snippets entre dispositivos
- 🛠️ **DevTools Integration**: Painel dedicado nas ferramentas de desenvolvedor
- 🎨 **Syntax Highlighting**: Editor com destaque de sintaxe JavaScript
- ⌨️ **Atalhos de Teclado**: Produtividade máxima com shortcuts

## 🖼️ Screenshots

### Popup Principal
<img width="722" height="527" alt="Screenshot 2025-09-16 at 07 06 01" src="https://github.com/user-attachments/assets/364b1f85-0f26-4562-9ff8-b7f8dfc99a39" />


## 🚀 Instalação

### Chrome Web Store (Recomendado)
1. Acesse a [Chrome Web Store](https://chrome.google.com/webstore)
2. Procure por "Console Rules"
3. Clique em "Adicionar ao Chrome"

### Instalação Manual
1. Clone este repositório:
   ```bash
   git clone https://github.com/matheuspuppe/console-rules.git](https://github.com/puppe1990/console-rules.git
   cd console-rules
   ```

2. Abra o Chrome e vá para `chrome://extensions/`

3. Ative o "Modo do desenvolvedor" no canto superior direito

4. Clique em "Carregar sem compactação" e selecione a pasta do projeto

## 📖 Como Usar

### 1. Criando um Snippet
- Clique no ícone da extensão na barra de ferramentas
- Clique no botão **"Novo"** ou use `Ctrl+N`
- Digite um nome descritivo para seu snippet
- Escreva ou cole seu código JavaScript

### 2. Executando um Snippet
- Selecione o snippet desejado na lista lateral
- Clique em **"Executar"** ou use `Ctrl+Enter`
- O código será executado no contexto da página ativa

### 3. Gerenciando Snippets
- **Salvar**: `Ctrl+S` para salvar alterações
- **Duplicar**: Crie uma cópia de um snippet existente
- **Excluir**: Remove permanentemente um snippet
- **Buscar**: Use o campo de busca para filtrar snippets

### 4. DevTools Panel
- Abra as Ferramentas de Desenvolvedor (`F12`)
- Vá para a aba **"Console Rules"**
- Acesse a interface completa com mais espaço

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl+N` | Novo snippet |
| `Ctrl+S` | Salvar snippet |
| `Ctrl+Enter` | Executar snippet |
| `Tab` | Indentação no editor |
| `Enter` | Auto-indentação |

## 🎨 Recursos do Editor

- **Syntax Highlighting**: Destaque automático de sintaxe JavaScript
- **Auto-indentação**: Indentação inteligente ao pressionar Enter
- **Tab Support**: Indentação com Tab
- **Fonte Monospace**: Fonte otimizada para código
- **Tema Escuro**: Visual moderno e confortável

## 📁 Estrutura do Projeto

```
console-rules/
├── 📄 manifest.json          # Configuração da extensão
├── 🎨 popup.html             # Interface principal
├── 💄 popup.css              # Estilos do popup
├── ⚡ popup.js               # Lógica principal
├── 🖼️ logo.svg               # Ícone da extensão
├── 📁 devtools/              # Painel DevTools
│   ├── devtools.html
│   ├── devtools.js
│   └── panel/
│       ├── panel.html
│       ├── panel.css
│       └── panel.js
└── 📖 README.md              # Este arquivo
```

## 🔧 Desenvolvimento

### Pré-requisitos
- Node.js (opcional, para ferramentas de build)
- Chrome/Chromium para testes

### Setup Local
```bash
# Clone o repositório
git clone https://github.com/matheuspuppe/console-rules.git
cd console-rules

# Instale dependências (se houver)
npm install

# Carregue a extensão no Chrome
# 1. Vá para chrome://extensions/
# 2. Ative "Modo do desenvolvedor"
# 3. Clique "Carregar sem compactação"
# 4. Selecione a pasta do projeto
```

### Build (Futuro)
```bash
# Build para produção
npm run build

# Lint do código
npm run lint

# Testes
npm test
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

### Diretrizes de Contribuição
- Siga o padrão de código existente
- Teste suas mudanças antes de submeter
- Documente novas funcionalidades
- Mantenha a compatibilidade com versões anteriores

## 📋 Roadmap

### v0.2.0
- [ ] Suporte a múltiplas linguagens (TypeScript, Python, etc.)
- [ ] Temas personalizáveis
- [ ] Snippets em nuvem
- [ ] Colaboração em tempo real

### v0.3.0
- [ ] Integração com GitHub Gists
- [ ] Execução de snippets em background
- [ ] Histórico de execução
- [ ] Métricas de uso

### v1.0.0
- [ ] API pública
- [ ] Marketplace de snippets
- [ ] Suporte a extensões
- [ ] Versão para Firefox

## 🐛 Reportar Bugs

Encontrou um bug? Por favor:

1. Verifique se já existe uma [issue](https://github.com/matheuspuppe/console-rules/issues) similar
2. Crie uma nova issue com:
   - Descrição detalhada do problema
   - Passos para reproduzir
   - Screenshots (se aplicável)
   - Informações do navegador e versão

## 💡 Sugestões

Tem uma ideia para melhorar a extensão? 

- Abra uma [issue](https://github.com/matheuspuppe/console-rules/issues) com a tag `enhancement`
- Descreva sua sugestão em detalhes
- Explique como isso beneficiaria outros usuários

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- **Chrome Extensions API** - Por fornecer as ferramentas necessárias
- **Comunidade Open Source** - Por inspiração e feedback
- **Contribuidores** - Por tornar este projeto melhor

## 📞 Contato

- **Desenvolvedor**: [Matheus Puppe](https://github.com/matheuspuppe)
- **Email**: [seu-email@exemplo.com](mailto:seu-email@exemplo.com)
- **Twitter**: [@seu_twitter](https://twitter.com/seu_twitter)

---

<div align="center">

**⭐ Se este projeto te ajudou, considere dar uma estrela! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/matheuspuppe/console-rules?style=social)](https://github.com/matheuspuppe/console-rules/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/matheuspuppe/console-rules?style=social)](https://github.com/matheuspuppe/console-rules/network/members)

</div>

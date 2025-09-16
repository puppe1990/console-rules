Console Rules – Extensão do Chrome

Descrição
- Extensão (Manifest V3) que adiciona um painel no DevTools para salvar snippets e executá-los no Console da aba inspecionada.
- Usa `chrome.storage.sync` para persistir snippets e `chrome.devtools.inspectedWindow.eval` para executar o código no contexto da página.

Instalação (modo desenvolvedor)
1. Abra `chrome://extensions` no Chrome.
2. Ative o “Modo do desenvolvedor”.
3. Clique em “Carregar sem compactação (Load unpacked)”.
4. Selecione a pasta deste projeto (que contém `manifest.json`).
5. Abra DevTools (F12) de qualquer página e vá até a aba “Console Rules”.

Uso
- Crie, renomeie, duplique ou exclua snippets.
- Edite o código e clique em “Executar” (ou use Ctrl/Cmd+Enter).
- Clique em “Salvar” (ou Ctrl/Cmd+S) para persistir alterações.
- Exporte para JSON: botão “Exportar”.
- Importe de JSON: botão “Importar” e selecione o arquivo gerado.
 - Editor com syntax highlight (leve, offline). Suporta Tab para indentação e auto-indent no Enter.

Permissões
- `storage`: para salvar snippets com sincronização do Chrome.
- `devtools_page`: para expor o painel dentro das Ferramentas de Desenvolvedor.

Notas
- A execução usa o mesmo contexto do Console do DevTools. Saídas aparecem na aba Console.
- O código é do usuário; cuidado ao rodar scripts em páginas de terceiros.
- Importação mescla os snippets importados aos existentes (não sobrescreve). IDs são regenerados.
- Syntax highlight implementado localmente (sem bibliotecas externas) cobrindo: palavras‑chave, números, strings e comentários.

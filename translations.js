/*
  Console Rules – Translation System
  - Supports English and Portuguese
  - Stores language preference in chrome.storage.sync
*/

const TRANSLATIONS = {
  en: {
    // App title and header
    appTitle: 'Console Rules',
    appDescription: 'Save and run code snippets directly in the browser console.',
    
    // Buttons
    new: 'New',
    run: 'Run',
    save: 'Save',
    duplicate: 'Duplicate',
    delete: 'Delete',
    export: 'Export',
    import: 'Import',
    
    // Tooltips
    newSnippetTooltip: 'New snippet',
    runSnippetTooltip: 'Run snippet',
    exportTooltip: 'Export snippets',
    importTooltip: 'Import snippets',
    dragToReorderTooltip: 'Drag to reorder',
    deleteTooltip: 'Delete',
    
    // Form labels and placeholders
    nameLabel: 'Name',
    codeLabel: 'Code',
    searchPlaceholder: 'Search…',
    namePlaceholder: 'Ex.: Clear cookies',
    codePlaceholder: '// Paste or write your code here',
    
    // Default snippets
    newSnippetName: 'New snippet',
    exampleSnippetName: 'Example: Hello Console',
    exampleSnippetCode: "console.log('Hello from Console Rules!');",
    noTitleFallback: 'Untitled',
    
    // Status messages
    snippetSaved: 'Snippet saved',
    snippetDeleted: 'Snippet deleted',
    executedSuccessfully: 'Executed successfully',
    exported: 'Exported',
    clearSearchToReorder: 'Clear search to reorder',
    orderUpdated: 'Order updated',
    noActiveTab: 'No active tab',
    cannotExecuteOnSpecialPages: 'Cannot execute on special pages',
    snippetsSaved: 'Snippets saved',
    executed: 'Executed',
    errorExecuting: 'Error executing',
    unknownError: 'Unknown error',
    nothingToImport: 'Nothing to import',
    importFailed: 'Import failed',
    importedCount: 'Imported {count}',
    
    // Confirmation dialogs
    deleteConfirmation: 'Delete "{name}"?',
    
    // Copy suffix
    copySuffix: ' (copy)',
    
    // Saved snippets aria label
    savedSnippetsAria: 'Saved snippets'
  },
  
  pt: {
    // App title and header
    appTitle: 'Console Rules',
    appDescription: 'Salve e execute snippets de código diretamente no console do navegador.',
    
    // Buttons
    new: 'Novo',
    run: 'Executar',
    save: 'Salvar',
    duplicate: 'Duplicar',
    delete: 'Excluir',
    export: 'Exportar',
    import: 'Importar',
    
    // Tooltips
    newSnippetTooltip: 'Novo snippet',
    runSnippetTooltip: 'Executar snippet',
    exportTooltip: 'Exportar snippets',
    importTooltip: 'Importar snippets',
    dragToReorderTooltip: 'Arrastar para reordenar',
    deleteTooltip: 'Excluir',
    
    // Form labels and placeholders
    nameLabel: 'Nome',
    codeLabel: 'Código',
    searchPlaceholder: 'Buscar…',
    namePlaceholder: 'Ex.: Limpar cookies',
    codePlaceholder: '// Cole ou escreva seu código aqui',
    
    // Default snippets
    newSnippetName: 'Novo snippet',
    exampleSnippetName: 'Exemplo: Olá Console',
    exampleSnippetCode: "console.log('Olá do Console Rules!');",
    noTitleFallback: 'Sem título',
    
    // Status messages
    snippetSaved: 'Snippet salvo',
    snippetDeleted: 'Snippet excluído',
    executedSuccessfully: 'Executado com sucesso',
    exported: 'Exportado',
    clearSearchToReorder: 'Limpe a busca para reordenar',
    orderUpdated: 'Ordem atualizada',
    noActiveTab: 'Nenhuma aba ativa',
    cannotExecuteOnSpecialPages: 'Não é possível executar em páginas especiais',
    snippetsSaved: 'Snippets salvos',
    executed: 'Executado',
    errorExecuting: 'Erro ao executar',
    unknownError: 'Erro desconhecido',
    nothingToImport: 'Nada para importar',
    importFailed: 'Falha ao importar',
    importedCount: 'Importados {count}',
    
    // Confirmation dialogs
    deleteConfirmation: 'Excluir "{name}"?',
    
    // Copy suffix
    copySuffix: ' (cópia)',
    
    // Saved snippets aria label
    savedSnippetsAria: 'Snippets salvos'
  }
};

// Translation utility
class Translator {
  constructor() {
    this.currentLanguage = 'pt'; // Default to Portuguese
    this.storageKey = 'consoleRules.language';
  }

  async init() {
    const result = await chrome.storage.sync.get(this.storageKey);
    this.currentLanguage = result[this.storageKey] || 'pt';
    return this.currentLanguage;
  }

  async setLanguage(language) {
    if (!TRANSLATIONS[language]) {
      console.warn(`Language ${language} not supported`);
      return;
    }
    this.currentLanguage = language;
    await chrome.storage.sync.set({ [this.storageKey]: language });
  }

  t(key, params = {}) {
    const translation = TRANSLATIONS[this.currentLanguage][key];
    if (!translation) {
      console.warn(`Translation key "${key}" not found for language "${this.currentLanguage}"`);
      return key;
    }
    
    // Simple parameter replacement
    return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] || match;
    });
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getSupportedLanguages() {
    return Object.keys(TRANSLATIONS);
  }
}

// Global translator instance
const translator = new Translator();

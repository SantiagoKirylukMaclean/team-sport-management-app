# VSCode Settings Recomendadas

Para obtener validación de TypeScript en tiempo real en VSCode, crea el archivo `.vscode/settings.json` con este contenido:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  
  "typescript.validate.enable": true,
  "javascript.validate.enable": true,
  
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  
  "typescript.inlayHints.parameterNames.enabled": "all",
  "typescript.inlayHints.variableTypes.enabled": true,
  
  "editor.formatOnSave": true,
  
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

Esto te dará:
- ✅ Errores de TypeScript en tiempo real
- ✅ Auto-fix de ESLint al guardar
- ✅ Organización automática de imports
- ✅ Hints de tipos inline

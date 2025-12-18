import { RuleContext } from '@alfresco/adf-extensions';

/**
 * Checks if selection contains only files (one or more), no folders
 * COMMENTED OUT: Backend now supports multiple folders and mixed folder/doc selections
 */
// export function isFilesOnly(context: RuleContext): boolean {
//   console.log('[KG Evaluator] isFilesOnly - context:', context);
//   console.log('[KG Evaluator] isFilesOnly - context.selection:', context.selection);

//   if (!context.selection || context.selection.isEmpty) {
//     console.log('[KG Evaluator] isFilesOnly - empty selection');
//     return false;
//   }

//   console.log('[KG Evaluator] isFilesOnly - nodes:', context.selection.nodes);

//   // Check that all selected nodes are files
//   const result = context.selection.nodes.every((node: any) => {
//     console.log('[KG Evaluator] isFilesOnly - checking node:', node);
//     const isFile = node?.entry?.isFile === true;
//     console.log('[KG Evaluator] isFilesOnly - isFile:', isFile);
//     return isFile;
//   });

//   console.log('[KG Evaluator] isFilesOnly result:', result);
//   return result;
// }

/**
 * Checks if selection is a single folder only
 * COMMENTED OUT: Backend now supports multiple folders and mixed folder/doc selections
 */
// export function isSingleFolder(context: RuleContext): boolean {
//   console.log('[KG Evaluator] isSingleFolder - context.selection:', context.selection);

//   const result = context.selection?.count === 1 &&
//          context.selection?.first?.entry?.isFolder === true;

//   console.log('[KG Evaluator] isSingleFolder result:', result);
//   return result;
// }

/**
 * Checks if selection is valid for GraphRAG processing:
 * - One or more files only, OR
 * - A single folder
 * But NOT multiple folders or mixed files/folders
 *
 * COMMENTED OUT: Backend now supports multiple folders and mixed folder/doc selections
 * Simplified to just check if selection is not empty
 */
export function canProcessWithGraphRAG(context: RuleContext): boolean {
  console.log('[KG Evaluator] canProcessWithGraphRAG - context.selection:', context.selection);

  if (!context.selection || context.selection.isEmpty) {
    console.log('[KG Evaluator] canProcessWithGraphRAG - empty selection');
    return false;
  }

  // Backend now supports any selection (multiple folders, mixed files/folders)
  console.log('[KG Evaluator] canProcessWithGraphRAG - selection OK (any combination allowed)');
  return true;

  // COMMENTED OUT: Original restrictions
  // // Single folder is OK
  // if (isSingleFolder(context)) {
  //   console.log('[KG Evaluator] canProcessWithGraphRAG - single folder OK');
  //   return true;
  // }

  // // Multiple files (no folders) is OK
  // if (isFilesOnly(context)) {
  //   console.log('[KG Evaluator] canProcessWithGraphRAG - files only OK');
  //   return true;
  // }

  // // Everything else (multiple folders, mixed) is NOT OK
  // console.log('[KG Evaluator] canProcessWithGraphRAG - invalid selection');
  // return false;
}

/**
 * Checks if we're in KG Spaces navigation context
 */
export function isKgSpaces(context: RuleContext): boolean {
  const { url } = context.navigation;
  return url?.startsWith('/kg-spaces') ?? false;
}

/**
 * Checks if user can create/upload in current context.
 * Works in Personal Files, Library Content, or KG Spaces
 */
export function canCreateFolderInKgSpaces(context: RuleContext): boolean {
  // Check if we're in KG Spaces
  if (isKgSpaces(context)) {
    const { currentFolder } = context.navigation;
    if (currentFolder) {
      return context.permissions.check(currentFolder, ['create']);
    }
    // If no current folder but we're in KG Spaces, allow create in root
    return true;
  }

  // Fall back to standard rule for Personal Files/Library Content
  // Import the standard rule dynamically or check manually
  const { url } = context.navigation;
  if (url?.startsWith('/personal-files') || url?.startsWith('/libraries')) {
    const { currentFolder } = context.navigation;
    if (currentFolder) {
      return context.permissions.check(currentFolder, ['create']);
    }
  }

  return false;
}


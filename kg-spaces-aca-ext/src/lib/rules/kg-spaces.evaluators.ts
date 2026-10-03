import { RuleContext } from '@alfresco/adf-extensions';

/**
 * Anything selected can be sent to KG Spaces: the backend accepts files, folders and mixed
 * selections, so the only thing worth refusing is an empty selection.
 */
export function canProcessWithGraphRAG(context: RuleContext): boolean {
  return !!context.selection && !context.selection.isEmpty;
}

/**
 * True while the user is already on the KG Spaces page, so the toolbar button can hide
 * itself rather than offering to navigate somewhere they already are.
 */
export function isKgSpacesRoute(context: RuleContext): boolean {
  const url = (context as any)?.navigation?.url || window.location.pathname;
  return typeof url === 'string' && url.includes('kg-spaces');
}

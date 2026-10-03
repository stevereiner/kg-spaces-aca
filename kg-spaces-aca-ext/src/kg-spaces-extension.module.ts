import { EnvironmentProviders, NgModule, Provider, inject, provideAppInitializer } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { provideExtensionConfig, provideExtensions } from '@alfresco/adf-extensions';
import { AppConfigService } from '@alfresco/adf-core';
import { FLEXIBLE_GRAPHRAG_CONFIG } from '@flexible-graphrag/angular-ui';
import { KgSpacesPageComponent } from './lib/components/kg-spaces-page/kg-spaces-page.component';
import { kgSpacesConfigFactory } from './lib/services/kg-spaces-config';
import { canProcessWithGraphRAG, isKgSpacesRoute } from './lib/rules/kg-spaces.evaluators';

/**
 * Puts a gap between the KG Spaces nav icon and its label.
 *
 * ACA renders a top-level nav item that has no children with
 * `<span class="action-button__label">` -- no `aca-` prefix -- while its stylesheet only styles
 * `.aca-action-button__label`, so the label gets no styling and sits flush against the icon.
 * ACA's own top-level items never show it: they either have children or no icon. Scoped to
 * this extension's item so nothing else in the sidenav moves.
 */
function addKgSpacesStyles(): void {
  const doc = inject(DOCUMENT);
  if (doc.getElementById('kg-spaces-styles')) {
    return;
  }
  const style = doc.createElement('style');
  style.id = 'kg-spaces-styles';
  style.textContent =
    '[data-automation-id="kg-spaces.navbar.link"] .action-button__label { margin-left: 8px; }';
  doc.head.appendChild(style);
}

/**
 * Registers KG Spaces with the Alfresco Content App.
 *
 * Add `...provideKgSpacesExtension()` to `provideApplicationExtensions()` in the host's
 * `app/src/app/extensions.module.ts`. That single line, plus the asset and app.config entries
 * described in the README, is the whole integration -- no ACA source file is modified, which
 * is what keeps this extension Apache-2.0 and independent of ACA's own licence.
 */
export function provideKgSpacesExtension(): (Provider | EnvironmentProviders)[] {
  return [
    provideExtensionConfig(['kg-spaces.plugin.json']),
    provideAppInitializer(addKgSpacesStyles),
    {
      provide: FLEXIBLE_GRAPHRAG_CONFIG,
      useFactory: kgSpacesConfigFactory,
      deps: [AppConfigService]
    },
    provideExtensions({
      components: {
        'kg-spaces.main.component': KgSpacesPageComponent
      },
      evaluators: {
        'kg-spaces.rules.canProcess': canProcessWithGraphRAG,
        'kg-spaces.rules.isKgSpaces': isKgSpacesRoute
      }
    })
  ];
}

/** @deprecated prefer `provideKgSpacesExtension()`; kept for NgModule-style hosts. */
@NgModule({
  providers: [...provideKgSpacesExtension()]
})
export class KgSpacesExtensionModule {}

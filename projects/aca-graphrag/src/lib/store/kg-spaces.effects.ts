import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { AppStore, getAppSelection } from '@alfresco/aca-shared/store';
import { tap, withLatestFrom, filter } from 'rxjs/operators';

@Injectable()
export class KgSpacesEffects {
  constructor(
    private actions$: Actions,
    private router: Router,
    private store: Store<AppStore>
  ) {
    console.log('[KG Spaces Effects] ===== INITIALIZED =====');
    console.log('[KG Spaces Effects] Router:', this.router);
    console.log('[KG Spaces Effects] Store:', this.store);
    
    // Log ALL actions for debugging
    this.actions$.subscribe(action => {
      console.log('[KG Spaces Effects] ALL ACTIONS:', action);
      if ((action as any).type === 'CUSTOM') {
        console.log('[KG Spaces Effects] *** CUSTOM ACTION DETECTED ***:', action);
      }
    });
  }

  processSelected$ = createEffect(
    () =>
      this.actions$.pipe(
        tap(action => console.log('[KG Spaces Effect] All actions:', action)),
        // Listen for APP_ACTION or CUSTOM actions
        filter((action: any) => action.type === 'APP_ACTION' || action.type === 'CUSTOM'),
        tap(action => console.log('[KG Spaces Effect] APP_ACTION/CUSTOM action:', action)),
        // Filter for our specific payload
        filter((action: any) => {
          const matches = action.payload === 'kg.process.selected';
          console.log('[KG Spaces Effect] Payload match:', { payload: action.payload, matches });
          return matches;
        }),
        withLatestFrom(this.store.select(getAppSelection)),
        tap(([action, selection]) => {
          console.log('[KG Spaces Effect] Process selected:', { action, selection });
          
          if (selection && selection.first) {
            const node = selection.first.entry;
            
            console.log('[KG Spaces Effect] Navigating with node:', node);
            
            this.router.navigate(['/kg-spaces'], {
              queryParams: {
                tab: 'processing',
                nodeId: node.id,
                path: node.path?.name || '/',
                name: node.name
              }
            });
          } else {
            // No selection, just go to processing tab
            console.log('[KG Spaces Effect] No selection, navigating to processing tab');
            this.router.navigate(['/kg-spaces'], {
              queryParams: { tab: 'processing' }
            });
          }
        })
      ),
    { dispatch: false }
  );
}


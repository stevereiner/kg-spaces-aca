import { Component } from '@angular/core';

@Component({
  selector: 'aca-kg-search-tab',
  template: `
    <div class="search-tab">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Knowledge Graph Search</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Search UI coming soon...</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .search-tab {
      max-width: 1200px;
      margin: 0 auto;
    }
  `],
  standalone: false
})
export class SearchTabComponent {}


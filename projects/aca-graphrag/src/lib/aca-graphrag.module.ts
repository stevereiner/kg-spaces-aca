import { NgModule, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideExtensionConfig, provideExtensions, ExtensionService } from '@alfresco/adf-extensions';
import { EffectsModule } from '@ngrx/effects';

// FlexibleGraphRAG Components (copied locally to avoid lazy-load injection issues)
import { ProcessingTabComponent } from './flexgraphrag-components/processing-tab/processing-tab';
import { SearchTabComponent } from './flexgraphrag-components/search-tab/search-tab';
import { ChatTabComponent } from './flexgraphrag-components/chat-tab/chat-tab';
import { ApiService } from './flexgraphrag-components/services/api.service';
import { FLEXIBLE_GRAPHRAG_CONFIG } from './flexgraphrag-components/flexible-graphrag.config';

// Material imports
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TextFieldModule } from '@angular/cdk/text-field';

// ADF imports
import { CoreModule } from '@alfresco/adf-core';
import { ContentModule } from '@alfresco/adf-content-services';
import { DynamicColumnComponent } from '@alfresco/adf-extensions';

// ACA directives
import { DocumentListDirective } from '@alfresco/aca-content';
import { ContextActionsDirective, PageLayoutComponent, ToolbarComponent } from '@alfresco/aca-shared';

// Components
import { KgSpacesComponent } from './components/kg-spaces/kg-spaces.component';
import { AlfrescoTabComponent } from './components/alfresco-tab/alfresco-tab.component';
import { CustomLoginComponent } from './components/custom-login/custom-login.component';
import { AuthCredentialCheckerService } from './services/auth-credential-checker.service';

// Services
import { GraphRagService } from './services/graphrag.service';
import { KgSpacesActionService } from './services/kg-spaces-action.service';
import { LOGIN_CREDENTIAL_INTERCEPTOR_INITIALIZER } from './services/login-credential-interceptor.service';

// Effects
import { KgSpacesEffects } from './store/kg-spaces.effects';

// Evaluators
import * as kgSpacesEvaluators from './rules/kg-spaces.evaluators';

const routes: Routes = [
  {
    path: '',
    component: KgSpacesComponent
  }
];

export function provideKgSpacesExtension(): Provider[] {
  console.log('[KG Spaces] provideKgSpacesExtension called');
  console.log('[KG Spaces] Registering evaluators:', kgSpacesEvaluators);

  return [
    provideExtensionConfig(['kg-spaces.plugin.json']),
    provideExtensions({
      components: {
        'kg.spaces.component': KgSpacesComponent,
        'app.components.login': CustomLoginComponent
      },
      evaluators: {
        // COMMENTED OUT: Backend now supports multiple folders and mixed folder/doc selections
        // 'kg.rules.isFilesOnly': kgSpacesEvaluators.isFilesOnly,
        // 'kg.rules.isSingleFolder': kgSpacesEvaluators.isSingleFolder,
        'kg.rules.canProcessWithGraphRAG': kgSpacesEvaluators.canProcessWithGraphRAG,
        'kg.rules.isKgSpaces': kgSpacesEvaluators.isKgSpaces,
        'kg.rules.canCreateFolder': kgSpacesEvaluators.canCreateFolderInKgSpaces,
        // Override standard rule to also work in KG Spaces
        'app.navigation.folder.canCreate': kgSpacesEvaluators.canCreateFolderInKgSpaces
      }
    }),
    GraphRagService,
    KgSpacesActionService
  ];
}

@NgModule({
  declarations: [
    KgSpacesComponent,
    AlfrescoTabComponent,
    // FlexibleGraphRAG components - copied locally, declared here
    ProcessingTabComponent,
    SearchTabComponent,
    ChatTabComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    // Material (includes modules needed by FlexibleGraphRAG components)
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTableModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatSlideToggleModule,
    TextFieldModule,
    // ADF
    CoreModule.forChild(),
    ContentModule.forChild(),
    // ADF Extensions
    DynamicColumnComponent,
    // ACA directives (standalone)
    DocumentListDirective,
    ContextActionsDirective,
    // ACA components (standalone)
    PageLayoutComponent,
    ToolbarComponent,
    // Custom Login Component (standalone)
    CustomLoginComponent,
    // Ngrx Effects
    EffectsModule.forFeature([KgSpacesEffects])
  ],
  providers: [
    ...provideKgSpacesExtension(),
    // DOM interceptor to capture credentials from login form (backup)
    LOGIN_CREDENTIAL_INTERCEPTOR_INITIALIZER,
    // Auth credential checker service (already provided in root, but ensure it's available)
    AuthCredentialCheckerService,
    // FlexibleGraphRAG services and config
    ApiService,
    {
      provide: FLEXIBLE_GRAPHRAG_CONFIG,
      useValue: {
        apiUrl: '/api',
        cmisBaseUrl: 'http://localhost:8080',
        alfrescoBaseUrl: 'http://localhost:8080'
      }
    }
  ],
  exports: [
    KgSpacesComponent,
    CustomLoginComponent
  ]
})
export class AcaGraphragModule {
  constructor(
    extensions: ExtensionService,
    authCredentialChecker: AuthCredentialCheckerService
  ) {
    console.log('[KG Spaces Module] Constructor called, registering evaluators...');
    console.log('[KG Spaces Module] ExtensionService:', extensions);

    // Register custom evaluators
    extensions.setEvaluators({
      // COMMENTED OUT: Backend now supports multiple folders and mixed folder/doc selections
      // 'kg.rules.isFilesOnly': kgSpacesEvaluators.isFilesOnly,
      // 'kg.rules.isSingleFolder': kgSpacesEvaluators.isSingleFolder,
      'kg.rules.canProcessWithGraphRAG': kgSpacesEvaluators.canProcessWithGraphRAG,
      'kg.rules.isKgSpaces': kgSpacesEvaluators.isKgSpaces,
      'kg.rules.canCreateFolder': kgSpacesEvaluators.canCreateFolderInKgSpaces,
      // Override standard rule to also work in KG Spaces
      'app.navigation.folder.canCreate': kgSpacesEvaluators.canCreateFolderInKgSpaces
    });

    // Register custom login component to override the default
    extensions.setComponents({
      'app.components.login': CustomLoginComponent
    });

    // Check for existing authentication and credentials
    // Use setTimeout to ensure services are fully initialized
    setTimeout(() => {
      authCredentialChecker.checkAndStoreCredentials();
      authCredentialChecker.setupLoginListener();
    }, 500);

    console.log('[KG Spaces Module] Evaluators registered:', {
      // COMMENTED OUT: Backend now supports multiple folders and mixed folder/doc selections
      // 'kg.rules.isFilesOnly': kgSpacesEvaluators.isFilesOnly,
      // 'kg.rules.isSingleFolder': kgSpacesEvaluators.isSingleFolder,
      'kg.rules.canProcessWithGraphRAG': kgSpacesEvaluators.canProcessWithGraphRAG
    });
    console.log('[KG Spaces Module] Custom login component registered');
  }
}


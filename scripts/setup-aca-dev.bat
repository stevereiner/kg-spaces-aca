@echo off
rem Set up a local Alfresco Content App checkout to run KG Spaces from source (Windows; see setup-aca-dev.sh):
rem   1. copy the extension into ACA\projects\kg-spaces-aca-ext (again on every run: re-run after editing it here)
rem   2. install @flexible-graphrag/angular-ui: published (LIB_VERSION, default latest), or with --local from your
rem      Flexible GraphRAG checkout (install-lib-into-aca.bat)
rem   3-6. register the extension, assets, plugins.kgSpaces config, the /api dev proxy entry (patch-aca.mjs)
rem
rem   scripts\setup-aca-dev.bat [--local]        ACA=<checkout> (default ..\alfresco-content-app)
setlocal
set "HERE=%~dp0.."
if "%ACA%"=="" set "ACA=%HERE%\..\alfresco-content-app"
if not exist "%ACA%\app\src\app\extensions.module.ts" (echo not an ACA checkout: %ACA% ^(set ACA^) & exit /b 2)
if "%LIB_VERSION%"=="" set "LIB_VERSION=latest"

echo ==^> 1. copying the extension into %ACA%\projects\kg-spaces-aca-ext
if exist "%ACA%\projects\kg-spaces-aca-ext" rmdir /s /q "%ACA%\projects\kg-spaces-aca-ext"
if not exist "%ACA%\projects" mkdir "%ACA%\projects"
xcopy /e /i /q /y "%HERE%\kg-spaces-aca-ext" "%ACA%\projects\kg-spaces-aca-ext" >nul || exit /b 1

echo ==^> 2. installing the shared UI library
if /i "%~1"=="--local" (
  call "%HERE%\scripts\install-lib-into-aca.bat" || exit /b 1
) else (
  pushd "%ACA%" || exit /b 1
  if exist package-lock.json (
    call npm install "@flexible-graphrag/angular-ui@%LIB_VERSION%" --no-audit --no-fund --legacy-peer-deps || (popd & exit /b 1)
  ) else if exist pnpm-lock.yaml (
    call pnpm add "@flexible-graphrag/angular-ui@%LIB_VERSION%" || (popd & exit /b 1)
  ) else (
    call npm install "@flexible-graphrag/angular-ui@%LIB_VERSION%" --no-audit --no-fund --legacy-peer-deps || (popd & exit /b 1)
  )
  popd
)

echo ==^> 3-6. wiring it into ACA
node "%HERE%\scripts\patch-aca.mjs" "%ACA%" || exit /b 1

echo done - in %ACA%: npm start (pnpm start on ACA's develop branch); the backend is http://localhost:8000 unless FG_BASE_URL says otherwise
exit /b 0

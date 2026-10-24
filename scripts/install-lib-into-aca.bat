@echo off
rem Rebuild @flexible-graphrag/angular-ui from a local Flexible GraphRAG checkout and install it into an ACA host
rem (Windows; see install-lib-into-aca.sh). FG_UI and ACA as there: by default a ..\flexible-graphrag (or
rem ..\..\newdev3\flexible-graphrag) checkout and ..\alfresco-content-app next to this repository. npm when the ACA
rem checkout has a package-lock.json (ACA 8.0.0), else pnpm when it has a pnpm-lock.yaml (ACA's develop branch). Clears ACA's .angular\cache (the library version doesn't change
rem between dev packs, so the CLI would keep serving the old compiled copy).
setlocal
set "HERE=%~dp0.."
if "%FG_UI%"=="" if exist "%HERE%\..\flexible-graphrag\flexible-graphrag-ui\frontend-angular" set "FG_UI=%HERE%\..\flexible-graphrag\flexible-graphrag-ui\frontend-angular"
if "%FG_UI%"=="" if exist "%HERE%\..\..\newdev3\flexible-graphrag\flexible-graphrag-ui\frontend-angular" set "FG_UI=%HERE%\..\..\newdev3\flexible-graphrag\flexible-graphrag-ui\frontend-angular"
if "%ACA%"=="" set "ACA=%HERE%\..\alfresco-content-app"
if "%FG_UI%"=="" (echo Flexible GraphRAG checkout not found: set FG_UI & exit /b 2)
if not exist "%ACA%" (echo ACA checkout not found at %ACA%: set ACA & exit /b 2)

echo ==^> building + packing the library in %FG_UI%
pushd "%FG_UI%" || exit /b 1
call npm run pack:lib || (popd & exit /b 1)
popd

set "TARBALL="
for /f "delims=" %%F in ('dir /b /o-d "%FG_UI%\dist\flexible-graphrag-angular-ui-*.tgz"') do if not defined TARBALL set "TARBALL=%FG_UI%\dist\%%F"
if "%TARBALL%"=="" (echo no library tarball in %FG_UI%\dist & exit /b 1)

echo ==^> installing %TARBALL% into %ACA%
pushd "%ACA%" || exit /b 1
if exist package-lock.json (
  call npm install "%TARBALL%" --no-audit --no-fund --legacy-peer-deps || (popd & exit /b 1)
) else if exist pnpm-lock.yaml (
  call pnpm add "%TARBALL%" || (popd & exit /b 1)
) else (
  call npm install "%TARBALL%" --no-audit --no-fund --legacy-peer-deps || (popd & exit /b 1)
)
popd

echo ==^> clearing the Angular CLI cache
if exist "%ACA%\.angular\cache" rmdir /s /q "%ACA%\.angular\cache"
echo done - restart the ACA dev server
exit /b 0

@echo off
setlocal enabledelayedexpansion

:: newBranch.bat
:: Usage: newBranch [1]=branch-name [2]*=repo-name [3]*=_description
:: [1] is required, [2-9]* are optional

set "_branchName=%~1"
set "_repoName=%~2"
set "_description=%~3"

:: Help option
if /i "%~1"=="-h" goto :showHelp
if /i "%~1"=="--help" goto :showHelp
if /i "%~1"=="/?" goto :showHelp

:: Ensure branch name is provided
if "%_branchName%"=="" (
 echo Error: Branch name is required.
 echo Usage: newBranch branch-name [repo-name] [_description]
 exit /b 1
)

:: Get current branch name
FOR /F "tokens=*" %%A in ('git rev-parse --abbrev-ref HEAD 2^>nul') DO set "_currentBranch=%%A"

:: If current branch is main, checkout new branch directly
:: Otherwise, checkout main first, then create new branch
if "%_currentBranch%"=="main" (
 git checkout -b %_branchName%
) else (
 git checkout main
 git checkout -b %_branchName%
)

:: Show git status
git status

:: Verify we're on the new branch
FOR /F "tokens=*" %%A in ('git rev-parse --abbrev-ref HEAD 2^>nul') DO set "_currentBranch=%%A"

:: If not on the new branch, exit
if NOT "%_currentBranch%"=="%_branchName%" (
 echo Error: Failed to switch to branch %_branchName%
 exit /b 1
)

:: update branch name
sed -i "s;BRANCH_NAME;%_branchName%;g" README.md

:: Update README.md with repo name if provided
if NOT "%_repoName%"=="" (
 sed -i "s;REPO_NAME;%_repoName%;g" README.md
)

:: Update README.md with description if provided
if NOT "%_description%"=="" (
 sed -i "s/SHORT_DESCRIPTION/%_description%/g" README.md
)

echo Branch %_branchName% created and configured successfully.
endlocal
exit /b 0

:showHelp
echo newBranch.bat
echo Usage: newBranch branch-name [repo-name] [_description]
echo Options:
echo   -h, --help, /?   Show this help and exit.
echo.
echo Examples:
echo   newBranch feature/login
echo   newBranch hotfix/api support-repo "Fix API error"
endlocal
exit /b 0

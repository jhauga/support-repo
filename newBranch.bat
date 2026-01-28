@echo off
setlocal enabledelayedexpansion

:: newBranch.bat
:: Usage: newBranch [1]=branch-name [2]*=repo-name [3]*=_description
:: [1] is required, [2-9]* are optional

set "_branchName=%~1"
set "_repoName=%~2"
set "_description=%~3"

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

@echo off
setlocal enabledelayedexpansion

:: newBranch.bat
:: Usage: newBranch [1]=branch-name [2]*=repo-name [3]*=description
:: [1] is required, [2-9]* are optional

set "branchName=%~1"
set "repoName=%~2"
set "description=%~3"

:: Ensure branch name is provided
if "%branchName%"=="" (
    echo Error: Branch name is required.
    echo Usage: newBranch branch-name [repo-name] [description]
    exit /b 1
)

:: Get current branch name
for /f "tokens=*" %%a in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "currentBranch=%%a"

:: If current branch is main, checkout new branch directly
:: Otherwise, checkout main first, then create new branch
if "%currentBranch%"=="main" (
    git checkout -b %branchName%
) else (
    git checkout main
    git checkout -b %branchName%
)

:: Show git status
git status

:: Verify we're on the new branch
for /f "tokens=*" %%a in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "currentBranch=%%a"

:: If not on the new branch, exit
if not "%currentBranch%"=="%branchName%" (
    echo Error: Failed to switch to branch %branchName%
    exit /b 1
)

:: Update README.md with repo name if provided
if not "%repoName%"=="" (
    sed -i "s;REPO_NAME;%repoName%;g" README.md
)

:: Update README.md with description if provided
if not "%description%"=="" (
    sed -i "s/SHORT_DESCRIPTION/%description%/g" README.md
)

echo Branch %branchName% created and configured successfully.
endlocal

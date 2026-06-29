@echo off
setlocal enabledelayedexpansion

:: newBranch.bat
:: Usage: newBranch [1]=branch-name [2]*=repo-name [3]*=_description
:: [1] is required, [2-9]* are optional

set "_branchName=%~1"
set "_repoName=%~2"
set "_description=%~3"

:: Help option
if /i "%~1"=="-h" goto :_showHelp
if /i "%~1"=="--help" goto :_showHelp
if /i "%~1"=="/?" goto :_showHelp

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
sed "s;BRANCH_NAME;%_branchName%;g" README.md > README.md.tmp
rem move to resovlve sed tmp file bug
move /Y README.md.tmp README.md >nul 2>nul

:: Update README.md with repo name if provided
if NOT "%_repoName%"=="" (
 sed "s;REPO_NAME;%_repoName%;g" README.md > README.md.tmp
 rem move to resovlve sed tmp file bug
 move /Y README.md.tmp README.md >nul 2>nul
 if EXIST "templates\%_repoName%.txt" (
  call makeTemplate.bat "%_repoName%"
  if "%_repoName%"=="awesome-copilot" (
   set "_toolName=%_branchName:*-=%%"
   call set "_newWhat=%%_branchName:-!_toolName!=%%"
  )
 ) else (
  call makeTemplate.bat "default"
 )
) else (
 call makeTemplate.bat "default"
)

:: Update README.md with description if provided
if "%_repoName%"=="awesome-copilot" (
 sed "s/SHORT_DESCRIPTION/Support branch for new %_newWhat% %_toolName%./g" README.md  > README.md.tmp
 rem move to resovlve sed tmp file bug
 move /Y README.md.tmp README.md >nul 2>nul
) else (
 if NOT "%_description%"=="" (
  sed "s/SHORT_DESCRIPTION/%_description%/g" README.md > README.md.tmp
  rem move to resovlve sed tmp file bug
  move /Y README.md.tmp README.md >nul 2>nul
 )
)
:: Update workflow action - only ONE branch name per line
sed "s/__main__/%_branchName%/" .gitHub\workflows\deploy.yml > .gitHub\workflows\deploy.yml.tmp
move /Y .gitHub\workflows\deploy.yml.tmp .gitHub\workflows\deploy.yml >nul 2>nul

:: Clean out repo files
del /Q TODO.md makeTemplate.bat >nul >nul
rmdir /S/Q templates >nul 2>nul
if "%_repoName%"=="awesome-copilot" (
 rem files not used for pr in awesome-copilot
 del /Q demo.gif file.md image.jpg >nul 2>nul
)

:: Done.
echo Branch %_branchName% created and configured successfully.
endlocal
del /Q newBranch.bat >nul 2>nul & exit /b 0 >nul 2>nul

:_showHelp
 echo newBranch.bat
 echo Usage: newBranch [branch-name] [repo-name] [_description]
 echo Options:
 echo   -h, --help, /?
 echo   repo-name - The name of the repo for PR, and used for templates
 echo               NOTE - 3rd parameter will not be used if "awesome-copilot" is repo-name
 echo:
 echo Templates:
 echo  awesome-copilot
 echo  default
 echo:
 echo Examples:
 echo   newBranch feature-login
 echo   newBranch hotfix-api support-repo "Fix API error"
 echo   newBranch instruction-file-name awesome-copilot
 echo   newBranch skill-branch-name awesome-copilot
 endlocal
 exit /b 0
goto:eof

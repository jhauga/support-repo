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

:: Stop on tracked changes, which would block the checkout or carry into the new branch
set "_dirtyTree="
FOR /F "tokens=*" %%A in ('git status --porcelain --untracked-files^=no 2^>nul') DO set "_dirtyTree=1"
if defined _dirtyTree (
 echo Error: commit or stash tracked changes before creating a branch:
 git status --short --untracked-files=no
 exit /b 1
)
:: Untracked files carry over, and a later "git add ." would commit them
FOR /F "tokens=1*" %%A in ('git status --porcelain --untracked-files^=normal 2^>nul') DO (
 if "%%A"=="??" echo Warning: untracked file carries over to the new branch: %%B
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
 sed "s;REPO_NAME;%_repoName%;g" README.md > README.md.tmp
 rem move to resovlve sed tmp file bug
 move /Y README.md.tmp README.md >nul 2>nul
 if EXIST "templates\%_repoName%.txt" (
  call "%~dp0makeTemplate.bat" "%_repoName%"
  if "%_repoName%"=="awesome-copilot" (
   set "_toolName=%_branchName:*-=%%"
   call set "_newWhat=%%_branchName:-!_toolName!=%%"
  )
 ) else (
  call "%~dp0makeTemplate.bat" "default"
 )
) else (
 call "%~dp0makeTemplate.bat" "default"
)

:: Escape the description for a sed replacement: & and the | delimiter
:: (delayed expansion is on, so a ! in the description is dropped)
set "_descSed="
if defined _description (
 set "_descSed=!_description:&=\&!"
 set "_descSed=!_descSed:|=\|!"
)

:: Update README.md with description if provided
:: awesome-copilot keeps the "Support branch for new ..." line, which awesomePr
:: turns into the test-results link, and puts the description above it
if "%_repoName%"=="awesome-copilot" (
 if NOT "%_description%"=="" (
  sed "s|SHORT_DESCRIPTION|!_descSed!\n\nSupport branch for new %_newWhat% %_toolName%.|g" README.md > README.md.tmp
 ) else (
  sed "s|SHORT_DESCRIPTION|Support branch for new %_newWhat% %_toolName%.|g" README.md > README.md.tmp
 )
 rem move to resovlve sed tmp file bug
 move /Y README.md.tmp README.md >nul 2>nul
) else (
 if NOT "%_description%"=="" (
  sed "s|SHORT_DESCRIPTION|!_descSed!|g" README.md > README.md.tmp
  rem move to resovlve sed tmp file bug
  move /Y README.md.tmp README.md >nul 2>nul
 )
)

:: update branch name - after the template is appended, since the template uses BRANCH_NAME too
sed "s;BRANCH_NAME;%_branchName%;g" README.md > README.md.tmp
rem move to resovlve sed tmp file bug
move /Y README.md.tmp README.md >nul 2>nul

:: Extension branches for awesome-copilot deploy from main instead of the new branch
set "_isExtension="
if "%_branchName:~0,9%"=="extension" if "%_repoName%"=="awesome-copilot" set "_isExtension=1"

:: Update workflow action - only ONE branch name per line
:: sed -b keeps the file's LF endings (the Windows sed build writes CRLF otherwise)
if defined _isExtension (
 sed -b "s/__main__/main/" .gitHub\workflows\deploy.yml > .gitHub\workflows\deploy.yml.tmp
) else (
 sed -b "s/__main__/%_branchName%/" .gitHub\workflows\deploy.yml > .gitHub\workflows\deploy.yml.tmp
)
move /Y .gitHub\workflows\deploy.yml.tmp .gitHub\workflows\deploy.yml >nul 2>nul

:: Clean out repo files
del /Q TODO.md makeTemplate.bat >nul 2>nul
rmdir /S/Q templates >nul 2>nul
if "%_repoName%"=="awesome-copilot" (
 rem keep a copy of the demo for extension branches before cleanup
 if defined _isExtension copy /Y demo.gif test.gif >nul 2>nul
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
 echo               NOTE - with "awesome-copilot" the 3rd parameter goes above the
 echo                      "Support branch for new ..." line that awesomePr links
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

@echo off
:: usage: undeploy [1]=branch-name (REQUIRED)

:: Set parameter variables.
set "_parOneUndeploy=%~1"
set "_checkParOneUndeploy=-%_parOneUndeploy%-"

:: Store current branch name
FOR /F "tokens=2" %%A in ('git branch ^| findstr /r "^\*"') do set "_currentBranch=%%A"

:: Check if branch name parameter was provided
if "%~1"=="" (
 echo One parameter is required
 exit /b 1
)

:: Checkout to the specified branch
git checkout %~1

:: Check to see if checkout was successful
FOR /F "tokens=2" %%A in ('git branch ^| findstr /r "^\*"') do set "_checkBranch=%%A"

if "%_checkBranch%"=="%~1" (
 rem make sure no conflicts with remote
 git fetch
 git pull
 
 rem continue only if no conflicts
 if NOT ERRORLEVEL 1 (
  rem remove first line with link `https://jhauga.github.io/support-repo/` from README.md
  sed -i "0,/^- .\+https:\/\/jhauga\.github\.io\/support-repo\/.*$/s///" README.md
  
  rem uncomment the htmlpreview block - remove <!-- and --> around the block
  sed -i "/^<!--$/,/^-->$/{/^<!--$/d;/^-->$/d}" README.md
  
  rem remove the git commit comment line
  sed -i "/<!-- git commit -m \"undeploy: use htmlpreview for index.html\" -->/d" README.md
  
  rem replace BRANCH_NAME with the actual branch name
  sed -i "s/BRANCH_NAME/%~1/g" README.md
  
  rem remove undeploy before pushing but ensure not on main
  if NOT "%_checkBranch%"=="main" (
   if NOT "%_parOneUndeploy%"=="main" (
    git rm undeploy.bat
   )
  )
  
  rem Stage, commit, and push changes
  git add .
  git commit -m "undeploy: use htmlpreview for index.html"
  git push

  rem Return to original branch
  git checkout %_currentBranch%
  exit /b 0
 ) else (
  echo Errors on `git pull`
  git checkout %_currentBranch%
  exit /b 1
 )
) else (
 echo Failed to checkout branch %~1
 git checkout %_currentBranch%
 exit /b 1
)

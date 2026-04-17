@echo off
REM itWorked
::  Test wine in codespace

echo I
call :_itWorked 1
goto:eof

:_itWorked
 if "%1"=="1" (
  echo t
  echo.
  call :_itWorked 2 & goto:eof
 )
 if "%1"=="2" (
  echo W
  echo o
  echo r
  echo k
  echo e
  echo d
  goto _done
 )
goto:eof

:_done
 echo:
 echo IT WORKED!
goto:eof
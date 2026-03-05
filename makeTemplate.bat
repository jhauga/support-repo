@echo off 
REM makeTemplate
::  Fill the reminder of README.md with a template.

if NOT EXIST ".tmp" mkdir ".tmp" >nul 2>nul

type templates\%~1.txt >> README.md

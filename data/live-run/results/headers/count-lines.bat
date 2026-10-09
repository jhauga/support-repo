:: Purpose: Print the line count of each .txt file in the current folder.
:: Usage: count-lines.bat
:: Dependencies: Windows CMD, plus the built-in type and find commands.
@echo off
for %%F in (*.txt) do (
  for /f %%N in ('type "%%F" ^| find /c /v ""') do echo %%F: %%N
)

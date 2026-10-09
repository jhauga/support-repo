:: Purpose: Counts and prints the number of lines in each .txt file in the current directory.
:: Usage: count-lines.bat
:: Dependencies: find.exe (built into Windows).
@echo off
for %%F in (*.txt) do (
  for /f %%N in ('type "%%F" ^| find /c /v ""') do echo %%F: %%N
)

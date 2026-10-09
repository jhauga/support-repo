@echo off
for %%F in (*.txt) do (
  for /f %%N in ('type "%%F" ^| find /c /v ""') do echo %%F: %%N
)

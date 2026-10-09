:: Purpose: Prints a greeting to a name given as the first argument, defaulting to "world" if none is given.
:: Usage: greet.bat Alice
:: Dependencies: None (uses only built-in CMD commands).
@echo off
setlocal
set "_NAME=%~1"
if not defined _NAME set "_NAME=world"
echo Hello, %_NAME%!
endlocal

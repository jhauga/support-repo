@echo off
setlocal
set "_NAME=%~1"
if not defined _NAME set "_NAME=world"
echo Hello, %_NAME%!
endlocal

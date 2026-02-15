@echo off
REM Batch file to fill testPDF.pdf with current fiscal quarter and year using pdftk

setlocal enabledelayedexpansion

REM Get current date components
rem one manual change
rem for /f "tokens=1-3 delims=/ " %%a in ('date /t') do (
rem     set month=%%a
rem     set day=%%b
rem     set year=%%c
rem )
rem to
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (
    set day=%%a
    set month=%%b
    set date=%%c
    set year=%%d
)

REM Remove leading zeros from month
set /a month=1%month% %% 100

REM Calculate fiscal year and quarter (US federal fiscal year starts Oct 1)
if %month% GEQ 10 (
    REM Oct-Dec: Q1 of next fiscal year
    set /a fiscal_year=%year%+1
    set fiscal_quarter=Q1
) else if %month% GEQ 7 (
    REM Jul-Sep: Q4 of current fiscal year
    set fiscal_year=%year%
    set fiscal_quarter=Q4
) else if %month% GEQ 4 (
    REM Apr-Jun: Q3 of current fiscal year
    set fiscal_year=%year%
    set fiscal_quarter=Q3
) else (
    REM Jan-Mar: Q2 of current fiscal year
    set fiscal_year=%year%
    set fiscal_quarter=Q2
)

echo Fiscal Quarter: !fiscal_quarter!
echo Fiscal Year: !fiscal_year!

REM Create FDF file with form data
set fdf_file=%~dp0form_data.fdf
set pdf_file=%~dp0testPDF.pdf
set output_file=%~dp0testPDF_filled.pdf

echo %%FDF-1.2> "%fdf_file%"
echo %%����>> "%fdf_file%"
echo 1 0 obj>> "%fdf_file%"
echo ^<^<>> "%fdf_file%"
echo /FDF ^<^< /Fields [>> "%fdf_file%"
echo ^<^</T(Quarter)/V(!fiscal_quarter!)^>^>>> "%fdf_file%"
echo ^<^</T(Year)/V(!fiscal_year!)^>^>>> "%fdf_file%"
echo ] ^>^>>> "%fdf_file%"
echo ^>^>>> "%fdf_file%"
echo endobj>> "%fdf_file%"
echo trailer>> "%fdf_file%"
echo ^<^</Root 1 0 R^>^>>> "%fdf_file%"
echo %%EOF>> "%fdf_file%"

REM Fill the PDF form using pdftk
echo.
echo Filling PDF form...
pdftk "%pdf_file%" fill_form "%fdf_file%" output "%output_file%" flatten

if %errorlevel% equ 0 (
    echo.
    echo Success! PDF filled and saved as: %output_file%
) else (
    echo.
    echo Error: Failed to fill PDF form
)

REM Clean up temporary FDF file
del "%fdf_file%"

endlocal
pause

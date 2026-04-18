@echo off
REM alien-attackers
::  Alien Attackers - A Space Invaders knock-off for DOS/CMD.
::
::  DEPENDENCIES:
::   None. Pure batch file - runs on any Windows cmd.exe or wine cmd.
::
::  RUNNING THE GAME:
::   Windows:  alien-attackers.bat
::   Wine:     wine cmd /c alien-attackers.bat
::
::  HOW TO PLAY:
::   Defend Earth from waves of descending aliens!
::   You control a ship [^] at the bottom of the screen.
::   Shoot the aliens before they reach your position.
::
::  CONTROLS:
::   A ........ Move left
::   D ........ Move right
::   S ........ Shoot
::   P ........ Pause
::   Q ........ Quit
::
::  OPTIONS:
::   /?        Show this help message
::   -h        Show this help message
::   --help    Show this help message
::
set "_helpLinesAlienAttackers=28"

:: ========================================================================
:: CONFIG
:: ========================================================================
set "_versionAlienAttackers=1.0.0"
set "_scriptNameAlienAttackers=%~n0"

:: Parse arguments.
set "_parOneAlienAttackers=%~1"
if "%_parOneAlienAttackers%"=="/?" call :_showHelp & goto _cleanup
if /i "%_parOneAlienAttackers%"=="-h" call :_showHelp & goto _cleanup
if /i "%_parOneAlienAttackers%"=="--help" call :_showHelp & goto _cleanup

:: ========================================================================
:: GAME INIT
:: ========================================================================
setlocal EnableDelayedExpansion

:: Screen dimensions (logical grid).
set "_W=40"
set "_H=20"

:: Player position (column index, 0-based).
set /a "_playerX=20"

:: Score and lives.
set /a "_score=0"
set /a "_lives=3"
set /a "_wave=1"
set /a "_gameOver=0"

:: Bullet state: -1 means no active bullet.
set /a "_bulletX=-1"
set /a "_bulletY=-1"

:: Alien grid: 5 rows x 8 columns, top-left offset.
set /a "_alienRows=4"
set /a "_alienCols=8"
set /a "_alienOffsetX=2"
set /a "_alienOffsetY=2"
set /a "_alienDirX=1"
set /a "_alienStep=2"
set /a "_alienMoveCounter=0"
set /a "_alienMoveRate=1"
set /a "_alienDescentCounter=0"
set /a "_alienDescentRate=10"

:: Initialize alien grid (1=alive, 0=dead).
for /l %%r in (0,1,3) do (
    for /l %%c in (0,1,7) do (
        set "_alien_%%r_%%c=1"
    )
)
set /a "_aliensAlive=32"

:: Set console title.
title Alien Attackers v%_versionAlienAttackers%

:: Clear screen and show intro.
cls
echo:
echo   =============================================
echo        A L I E N   A T T A C K E R S
echo   =============================================
echo:
echo     Defend Earth from the alien invasion!
echo:
echo     Controls:
echo       A = Left   D = Right   S = Shoot
echo       P = Pause    Q = Quit
echo:
echo   =============================================
echo:
echo   Press any key to start...
pause >nul

:: ========================================================================
:: GAME LOOP
:: ========================================================================
:_gameLoop
    if !_gameOver! equ 1 goto _gameEnd

    :: Render the screen.
    call :_render

    :: Get input via CHOICE with 1-second timeout (default=N for no-op).
    :: Mapping: A=1 D=2 S=3 P=4 Q=5 N=6 (N=timeout/no action)
    choice /c ADSPQN /n /t 1 /d N >nul
    set "_input=!ERRORLEVEL!"

    :: Handle quit (Q=5) — check first so it cannot be skipped.
    if "!_input!"=="5" (
        set /a "_gameOver=1"
        goto _gameEnd
    )

    :: Handle pause (P=4).
    if "!_input!"=="4" (
        echo:
        echo  --- PAUSED --- Press P to resume ---
        choice /c P /n >nul
    )

    :: Move left (A=1).
    if !_input! equ 1 (
        if !_playerX! gtr 1 set /a "_playerX-=2"
    )

    :: Move right (D=2).
    if !_input! equ 2 (
        if !_playerX! lss 38 set /a "_playerX+=2"
    )

    :: Shoot (S=3).
    if !_input! equ 3 (
        if !_bulletY! equ -1 (
            set /a "_bulletX=!_playerX!"
            set /a "_bulletY=18"
        )
    )

    :: Update bullet.
    call :_updateBullet

    :: Update aliens.
    call :_updateAliens

    :: Check if aliens reached bottom.
    set /a "_alienBottom=!_alienOffsetY! + !_alienRows!"
    if !_alienBottom! geq 18 (
        set /a "_gameOver=1"
        goto _gameLoop
    )

    :: Check wave clear.
    if !_aliensAlive! equ 0 (
        set /a "_wave+=1"
        set /a "_alienOffsetX=2"
        set /a "_alienOffsetY=2"
        set /a "_alienDirX=1"
        set /a "_alienMoveCounter=0"
        set /a "_alienDescentCounter=0"
        if !_alienDescentRate! gtr 5 set /a "_alienDescentRate-=2"
        for /l %%r in (0,1,3) do (
            for /l %%c in (0,1,7) do (
                set "_alien_%%r_%%c=1"
            )
        )
        set /a "_aliensAlive=32"
    )

goto _gameLoop

:: ========================================================================
:: RENDER
:: ========================================================================
:_render
    cls
    echo  Score: !_score!   Lives: !_lives!   Wave: !_wave!
    echo  ========================================

    :: Build each row.
    for /l %%y in (0,1,19) do (
        set "_row="
        for /l %%x in (0,1,39) do (
            set "_ch= "

            :: Draw aliens.
            set /a "_relR=%%y - !_alienOffsetY!"
            set /a "_relC=%%x - !_alienOffsetX!"
            if !_relR! geq 0 if !_relR! lss !_alienRows! (
                :: Check if column aligns with alien spacing (every 4 cols).
                set /a "_colMod=!_relC! %% 4"
                set /a "_colIdx=!_relC! / 4"
                if !_colMod! equ 0 if !_relC! geq 0 if !_colIdx! lss !_alienCols! (
                    for %%r in (!_relR!) do for %%c in (!_colIdx!) do (
                        if !_alien_%%r_%%c! equ 1 set "_ch=M"
                    )
                )
            )

            :: Draw bullet.
            if %%x equ !_bulletX! if %%y equ !_bulletY! set "_ch=|"

            :: Draw player on row 19.
            if %%y equ 19 (
                if %%x equ !_playerX! set "_ch=^"
                set /a "_pL=!_playerX! - 1"
                set /a "_pR=!_playerX! + 1"
                if %%x equ !_pL! set "_ch=/"
                if %%x equ !_pR! set "_ch=\"
            )

            set "_row=!_row!!_ch!"
        )
        echo(!_row!
    )

    echo  ========================================
goto :eof

:: ========================================================================
:: UPDATE BULLET
:: ========================================================================
:_updateBullet
    if !_bulletY! equ -1 goto :eof

    :: Move bullet up.
    set /a "_bulletY-=1"

    :: Off screen.
    if !_bulletY! lss 0 (
        set /a "_bulletX=-1"
        set /a "_bulletY=-1"
        goto :eof
    )

    :: Check collision with aliens.
    set /a "_bRelR=!_bulletY! - !_alienOffsetY!"
    set /a "_bRelC=!_bulletX! - !_alienOffsetX!"

    if !_bRelR! geq 0 if !_bRelR! lss !_alienRows! (
        set /a "_bColMod=!_bRelC! %% 4"
        set /a "_bColIdx=!_bRelC! / 4"
        if !_bColMod! equ 0 if !_bRelC! geq 0 if !_bColIdx! lss !_alienCols! (
            for %%r in (!_bRelR!) do for %%c in (!_bColIdx!) do (
                if !_alien_%%r_%%c! equ 1 (
                    set "_alien_%%r_%%c=0"
                    set /a "_score+=10"
                    set /a "_aliensAlive-=1"
                    set /a "_bulletX=-1"
                    set /a "_bulletY=-1"
                )
            )
        )
    )
goto :eof

:: ========================================================================
:: UPDATE ALIENS
:: ========================================================================
:_updateAliens
    set /a "_alienMoveCounter+=1"
    if !_alienMoveCounter! lss !_alienMoveRate! goto :eof
    set /a "_alienMoveCounter=0"

    :: Periodic forced descent.
    set /a "_alienDescentCounter+=1"
    if !_alienDescentCounter! geq !_alienDescentRate! (
        set /a "_alienDescentCounter=0"
        set /a "_alienOffsetY+=1"
    )

    :: Move aliens horizontally.
    set /a "_newOffX=!_alienOffsetX! + (!_alienDirX! * !_alienStep!)"

    :: Calculate rightmost alien position.
    set /a "_rightEdge=!_newOffX! + (!_alienCols! * 4)"
    set /a "_leftEdge=!_newOffX!"

    :: Bounce off walls and drop a row.
    if !_rightEdge! gtr 39 (
        set /a "_alienDirX=-1"
        set /a "_alienOffsetY+=1"
        set /a "_alienDescentCounter=0"
        goto :eof
    )
    if !_leftEdge! lss 0 (
        set /a "_alienDirX=1"
        set /a "_alienOffsetY+=1"
        set /a "_alienDescentCounter=0"
        goto :eof
    )

    set /a "_alienOffsetX=!_newOffX!"
goto :eof

:: ========================================================================
:: GAME END
:: ========================================================================
:_gameEnd
    cls
    echo:
    echo   =============================================
    echo        G A M E   O V E R
    echo   =============================================
    echo:
    echo     Final Score: !_score!
    echo     Waves Cleared: !_wave!
    echo:
    echo   =============================================
    echo:
    echo Play again? ^(Y/N^)
    choice /c YNQ /m "Play again? ^(Y/N^)" >nul 2>nul
    if !ERRORLEVEL! equ 1 (
        endlocal
        call "%~f0"
        exit /b
    )
    endlocal
    goto _cleanup

:: ========================================================================
:: HELP
:: ========================================================================
:_showHelp
    echo:
    for /f "skip=1 tokens=* delims=" %%a in ('findstr /n "^" "%~f0"') do (
        set "_line=%%a"
        setlocal EnableDelayedExpansion
        set "_lineNum=!_line:~0,2!"
        if !_lineNum! GTR %_helpLinesAlienAttackers% (
            endlocal
            goto :eof
        )
        set "_text=!_line:*:=!"
        if defined _text (
            echo !_text:~4!
        ) else (
            echo:
        )
        endlocal
    )
goto :eof

:: ========================================================================
:: CLEANUP
:: ========================================================================
:_cleanup
    set _helpLinesAlienAttackers=
    set _versionAlienAttackers=
    set _scriptNameAlienAttackers=
    set _parOneAlienAttackers=
    exit /b

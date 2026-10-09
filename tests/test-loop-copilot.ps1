<#
.SYNOPSIS
Runs loop-copilot.bat against a stub copilot CLI.

.DESCRIPTION
Puts a fake copilot.cmd first on PATH that records its arguments and prints
scripted responses, then runs the driver unchanged through each scenario and
checks its exit code, the copilot calls it made, its log file, its temp
files, and the console code page. No Copilot credits are used.

Works in Windows PowerShell 5.1 and PowerShell 7. Exits 0 when every check
passes, 1 when any check fails.

.EXAMPLE
powershell -NoProfile -ExecutionPolicy Bypass -File tests\test-loop-copilot.ps1 .github\skills\handle-big-tasks\scripts\loop-copilot.bat
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$Driver
)

$ErrorActionPreference = 'Stop'
$Driver = (Resolve-Path -LiteralPath $Driver).Path
$Utf8 = New-Object Text.UTF8Encoding $false
$Sys32 = Join-Path $env:SystemRoot 'System32'
$UuidPattern = '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
# Non-ASCII text for the UTF-8 check, built from code points so this file
# stays ASCII for Windows PowerShell 5.1.
$Utf8Text = 'done ' + [char]0x2192 + ' inventory ' + [char]0x2713

$Work = Join-Path ([IO.Path]::GetTempPath()) ('test-loop-copilot-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
$Bin = Join-Path $Work 'bin'
New-Item -ItemType Directory -Path $Bin | Out-Null
$script:Checks = 0
$script:Fails = 0

function Write-Text([string]$Path, [string]$Text) {
  [IO.File]::WriteAllText($Path, $Text, $Utf8)
}

# Writes CMD script lines with CRLF line endings.
function Write-Cmd([string]$Path, [string[]]$Lines) {
  Write-Text $Path (($Lines -join "`r`n") + "`r`n")
}

Write-Cmd (Join-Path $Bin 'copilot.cmd') @(
  '@echo off'
  'rem Stub copilot: records each call''s arguments in args-<n>.txt, prints'
  'rem response-<n>.txt (or response-default.txt), exits with status-<n> (or 0).'
  'rem On call STUB_READONLY_LOG_CALL it makes STUB_LOG read-only, and on call'
  'rem STUB_BLOCK_LAST_CALL it puts a folder where the driver writes last.txt.'
  'setlocal DisableDelayedExpansion'
  'set "_N=0"'
  'if exist "%STUB_DIR%\count" set /p _N=<"%STUB_DIR%\count"'
  'set /a _N+=1'
  '>"%STUB_DIR%\count" echo %_N%'
  '>"%STUB_DIR%\args-%_N%.txt" echo(%*'
  'if "%_N%"=="%STUB_READONLY_LOG_CALL%" attrib +r "%STUB_LOG%"'
  'if "%_N%"=="%STUB_BLOCK_LAST_CALL%" for %%F in ("%TEMP%\loop-copilot-*.out.txt") do for %%G in ("%%~dpnF") do mkdir "%%~dpnG.last.txt"'
  'set "_F=%STUB_DIR%\response-%_N%.txt"'
  'if not exist "%_F%" set "_F=%STUB_DIR%\response-default.txt"'
  'type "%_F%"'
  'set "_S=0"'
  'if exist "%STUB_DIR%\status-%_N%" set /p _S=<"%STUB_DIR%\status-%_N%"'
  'exit /b %_S%'
)

# Reports the console code page before and after a driver run, plus the
# driver's exit code. Starts from code page 437 so a restore is visible.
$CodePageProbe = Join-Path $Bin 'code-page-probe.cmd'
Write-Cmd $CodePageProbe @(
  '@echo off'
  '"%SystemRoot%\System32\chcp.com" 437 >nul'
  'for /f "tokens=2 delims=:." %%C in (''"%SystemRoot%\System32\chcp.com"'') do set /a "_BEFORE=%%C"'
  'call "%~1" "%~2" 0 >nul 2>&1'
  'set "_RC=%ERRORLEVEL%"'
  'for /f "tokens=2 delims=:." %%C in (''"%SystemRoot%\System32\chcp.com"'') do set /a "_AFTER=%%C"'
  'echo before=%_BEFORE% after=%_AFTER% rc=%_RC%'
)

function Check([string]$Name, [scriptblock]$Test) {
  $script:Checks++
  $ok = $false
  try { $ok = [bool](& $Test) } catch { $ok = $false }
  if ($ok) {
    Write-Output "  pass  $Name"
  } else {
    Write-Output "  FAIL  $Name"
    $script:Fails++
  }
}

# Sets up a fresh scenario folder with a plan file, optionally in a subfolder.
function New-Scenario([string]$Title, [string]$Name, [string]$PlanFolder = '') {
  Write-Output ''
  Write-Output $Title
  $script:Stub = Join-Path $Work $Name
  New-Item -ItemType Directory -Path (Join-Path $script:Stub 'tmp') -Force | Out-Null
  $folder = $script:Stub
  if ($PlanFolder) { $folder = Join-Path $script:Stub $PlanFolder }
  New-Item -ItemType Directory -Path $folder -Force | Out-Null
  $script:Plan = Join-Path $folder 'plan.md'
  Write-Text $script:Plan "# Plan`n`n1. One`n2. Two`n3. Three`n"
}

function Set-Response([string]$Key, [string]$Text) {
  Write-Text (Join-Path $script:Stub "response-$Key.txt") $Text
}

# Runs cmd.exe with an exact command line, the stub first on PATH, and a
# private TEMP. Environment entries in $Env override; a $null value removes.
function Invoke-Cmd([string]$CommandLine, [hashtable]$Env = @{}) {
  $psi = New-Object Diagnostics.ProcessStartInfo
  $psi.FileName = Join-Path $Sys32 'cmd.exe'
  $psi.Arguments = '/d /s /c "' + $CommandLine + '"'
  $psi.WorkingDirectory = $script:Stub
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.StandardOutputEncoding = $Utf8
  $psi.StandardErrorEncoding = $Utf8
  $tmp = Join-Path $script:Stub 'tmp'
  $vars = @{
    PATH = $Bin + ';' + $env:PATH
    STUB_DIR = $script:Stub
    TEMP = $tmp
    TMP = $tmp
    LOOP_MAX_ITERATIONS = $null
    LOOP_COPILOT_ARGS = $null
  }
  foreach ($key in $Env.Keys) { $vars[$key] = $Env[$key] }
  foreach ($key in $vars.Keys) {
    if ($psi.EnvironmentVariables.ContainsKey($key)) { $psi.EnvironmentVariables.Remove($key) }
    if ($null -ne $vars[$key]) { $psi.EnvironmentVariables[$key] = $vars[$key] }
  }
  $process = [Diagnostics.Process]::Start($psi)
  $process.StandardInput.Close()
  $stderr = $process.StandardError.ReadToEndAsync()
  $stdout = $process.StandardOutput.ReadToEnd()
  $process.WaitForExit()
  $script:Out = $stdout + $stderr.Result
  $script:Rc = $process.ExitCode
}

# Runs the driver with each argument quoted, the way a person types them.
function Invoke-Driver([string[]]$DriverArgs = @(), [hashtable]$Env = @{}) {
  $parts = @('"' + $Driver + '"')
  foreach ($arg in $DriverArgs) { $parts += '"' + $arg + '"' }
  Invoke-Cmd ($parts -join ' ') $Env
}

function Get-Calls {
  $file = Join-Path $script:Stub 'count'
  if (Test-Path -LiteralPath $file) { return [int]([IO.File]::ReadAllText($file).Trim()) }
  return 0
}

function Get-CallArgs([int]$N) {
  return [IO.File]::ReadAllText((Join-Path $script:Stub "args-$N.txt")).TrimEnd()
}

function Test-Token([int]$N, [string]$Token) {
  return (' ' + (Get-CallArgs $N) + ' ').Contains(' ' + $Token + ' ')
}

function Get-SessionId {
  if ((Get-CallArgs 1) -match '--session-id=(\S+)') { return $Matches[1] }
  return ''
}

function Get-Log {
  $file = $script:Plan + '.loop.log'
  if (Test-Path -LiteralPath $file) { return [IO.File]::ReadAllText($file, $Utf8) }
  return ''
}

function Test-TmpEmpty {
  return @(Get-ChildItem -LiteralPath (Join-Path $script:Stub 'tmp') -Force).Count -eq 0
}

New-Scenario 'Three phases, markers on the last line' 'happy'
Set-Response 1 "Phase plan: one, two, three.`nPhase 1 $Utf8Text.`n`nCONTINUE? Y or N`n"
Set-Response 2 "Phase 2 done.`r`nCONTINUE? Y or N  `r`n`r`n`n"
Set-Response 3 "Phase 3 done.`nTASK COMPLETE!"
$extra = '--allow-tool=write --allow-tool=shell(git:*) --model test-model'
Invoke-Driver @($Plan, '0') @{ LOOP_COPILOT_ARGS = $extra }
$sid = Get-SessionId
Check 'exits 0' { $Rc -eq 0 }
Check 'makes 3 copilot calls' { (Get-Calls) -eq 3 }
Check 'run 1 sets a UUID with --session-id' { $sid -match $UuidPattern }
Check 'run 1 prompt names the plan file and skill' {
  (Get-CallArgs 1).Contains($Plan) -and (Get-CallArgs 1).Contains('handle-big-tasks')
}
Check 'run 1 prompt names the decisions file' { (Get-CallArgs 1).Contains($Plan + '.decisions.md') }
Check 'run 1 passes -s --no-color' { (Test-Token 1 '-s') -and (Test-Token 1 '--no-color') }
Check 'runs 2-3 answer Y in the same session' {
  ((Get-CallArgs 2) -like "-p Y --resume=$sid *") -and ((Get-CallArgs 3) -like "-p Y --resume=$sid *")
}
Check 'no run uses --continue or --allow-all' {
  -not (1..3 | Where-Object { (Test-Token $_ '--continue') -or (Test-Token $_ '--allow-all') })
}
Check 'LOOP_COPILOT_ARGS, parentheses included, reach every run' {
  -not (1..3 | Where-Object { -not (Get-CallArgs $_).EndsWith($extra) })
}
Check 'prints UTF-8 responses intact' { $Out.Contains($Utf8Text) -and (Get-Log).Contains($Utf8Text) }
Check 'log has a separator for each run' {
  ([regex]::Matches((Get-Log), '\| run \d+ of 10 -----')).Count -eq 3
}
Check 'log ends with the completion line' { (Get-Log).TrimEnd().EndsWith('Task complete after 3 run(s).') }
Check 'removes its temp files' { Test-TmpEmpty }

New-Scenario 'Whitespace-only line after the marker' 'trailing'
Set-Response 1 "Phase 1 done.`nCONTINUE? Y or N`n   `n"
Set-Response 2 "Phase 2 done.`nTASK COMPLETE!`n"
Invoke-Driver @($Plan, '0')
Check 'exits 0' { $Rc -eq 0 }
Check 'makes 2 copilot calls' { (Get-Calls) -eq 2 }

New-Scenario 'Marker quoted mid-response, blocker on the last line' 'midline'
Set-Response 1 "The plan says to end with CONTINUE? Y or N`nCONTINUE? Y or N`nBlocked: the API key is missing.`n"
Invoke-Driver @($Plan, '0')
Check 'exits 1' { $Rc -eq 1 }
Check 'stops after 1 call' { (Get-Calls) -eq 1 }
Check 'reports the last line' { $Out.Contains('Last line: Blocked: the API key is missing.') }
Check 'prints the resume command' { $Out.Contains('copilot --resume=' + (Get-SessionId)) }
Check 'removes its temp files' { Test-TmpEmpty }

New-Scenario 'Blocker line with CMD special characters' 'special'
$specialLine = 'Need 100% of the "key" & <token> ^ (now) ready!'
Set-Response 1 "Phase 1 is blocked.`n$specialLine`n"
Invoke-Driver @($Plan, '0')
Check 'exits 1' { $Rc -eq 1 }
Check 'stops after 1 call' { (Get-Calls) -eq 1 }
Check 'reports the last line unchanged' { $Out.Contains('Last line: ' + $specialLine) }
Check 'logs the last line unchanged' { (Get-Log).Contains('Last line: ' + $specialLine) }

New-Scenario 'Marker wrapped in markdown' 'wrapped'
Set-Response 1 "Phase 1 done.`n**CONTINUE? Y or N**`n"
Invoke-Driver @($Plan, '0')
Check 'exits 1' { $Rc -eq 1 }
Check 'stops after 1 call' { (Get-Calls) -eq 1 }

New-Scenario 'copilot fails on run 2' 'clifail'
Set-Response 'default' "Phase 1 done.`nCONTINUE? Y or N`n"
Write-Text (Join-Path $Stub 'status-2') '7'
Invoke-Driver @($Plan, '0')
Check 'exits 1' { $Rc -eq 1 }
Check 'stops after 2 calls' { (Get-Calls) -eq 2 }
Check 'reports the copilot status' { $Out.Contains('copilot exited with status 7.') }

New-Scenario 'Log turns read-only on run 2, which ends with TASK COMPLETE!' 'logreadonly'
Set-Response 1 "Phase 1 done.`nCONTINUE? Y or N`n"
Set-Response 2 "All done.`nTASK COMPLETE!`n"
Invoke-Driver @($Plan, '0') @{ STUB_READONLY_LOG_CALL = '2'; STUB_LOG = $Plan + '.loop.log' }
Check 'exits 1' { $Rc -eq 1 }
Check 'stops after 2 calls' { (Get-Calls) -eq 2 }
Check 'does not report the task complete' { -not $Out.Contains('Task complete after') }
Check 'reports the log failure' { $Out.Contains('Error: could not write the log file: ' + $Plan + '.loop.log') }
Check 'removes its temp files' { Test-TmpEmpty }
Set-ItemProperty -LiteralPath ($Plan + '.loop.log') -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue

New-Scenario 'Log opens but every write fails' 'loglocked'
Set-Response 'default' "All done.`nTASK COMPLETE!`n"
# A byte-range lock lets the log open but fails each write, as a full disk
# would. ECHO still reports success, so this checks that the driver notices.
$logPath = $Plan + '.loop.log'
Write-Text $logPath ''
$lockHandle = [IO.File]::Open($logPath, 'Open', 'Read', 'ReadWrite')
$lockHandle.Lock(0, 1000000000)
try {
  Invoke-Driver @($Plan, '0')
} finally {
  $lockHandle.Unlock(0, 1000000000)
  $lockHandle.Close()
}
Check 'exits 1' { $Rc -eq 1 }
Check 'stops before running copilot' { (Get-Calls) -eq 0 }
Check 'reports the log failure' { $Out.Contains('Error: could not write the log file: ' + $logPath) }

New-Scenario 'Temporary file cannot be written' 'tempblocked'
Set-Response 'default' "Phase 1 done.`nCONTINUE? Y or N`n"
Invoke-Driver @($Plan, '0') @{ STUB_BLOCK_LAST_CALL = '1' }
Check 'exits 1' { $Rc -eq 1 }
Check 'stops after 1 call' { (Get-Calls) -eq 1 }
Check 'reports the temporary file failure' { $Out.Contains('Stopping: could not write the temporary files') }

New-Scenario 'Safety cap reached' 'cap'
Set-Response 'default' "Phase done.`nCONTINUE? Y or N`n"
Invoke-Driver @($Plan, '0') @{ LOOP_MAX_ITERATIONS = '2' }
Check 'exits 1' { $Rc -eq 1 }
Check 'stops after 2 calls' { (Get-Calls) -eq 2 }
Check 'reports the cap' { $Out.Contains('safety cap of 2 runs') }
Check 'removes its temp files' { Test-TmpEmpty }

New-Scenario 'Default safety cap' 'defaultcap'
Set-Response 'default' "Phase done.`nCONTINUE? Y or N`n"
Invoke-Driver @($Plan, '0')
Check 'exits 1' { $Rc -eq 1 }
Check 'stops after 10 calls' { (Get-Calls) -eq 10 }
Check 'reports the cap' { $Out.Contains('safety cap of 10 runs') }
Check 'prints the resume command' { $Out.Contains('copilot --resume=' + (Get-SessionId)) }

New-Scenario 'Decision pending, guard line last' 'guard'
Set-Response 1 "Phase 3 waits on D1 in plan.md.decisions.md.`n`nREVISED SCRIPT - Unique user response is required`n"
Invoke-Driver @($Plan, '0')
Check 'exits 1' { $Rc -eq 1 }
Check 'stops after 1 call' { (Get-Calls) -eq 1 }
Check 'reports the guard line' { $Out.Contains('Last line: REVISED SCRIPT - Unique user response is required') }
Check 'prints the resume command' { $Out.Contains('copilot --resume=' + (Get-SessionId)) }

New-Scenario 'Quoted value with spaces in LOOP_COPILOT_ARGS' 'quotedargs'
Set-Response 1 "All done.`nTASK COMPLETE!`n"
$quoted = '--add-dir "C:\work\shared plans"'
Invoke-Driver @($Plan, '0') @{ LOOP_COPILOT_ARGS = $quoted }
Check 'exits 0' { $Rc -eq 0 }
Check 'the quoted value reaches copilot intact' { (Get-CallArgs 1).EndsWith($quoted) }

New-Scenario 'Plan path with spaces, parentheses, and an ampersand' 'oddpath' 'R&D plans (v2)'
Set-Response 1 "All done.`nTASK COMPLETE!`n"
Invoke-Driver @($Plan, '0')
Check 'exits 0' { $Rc -eq 0 }
Check 'makes 1 copilot call' { (Get-Calls) -eq 1 }
Check 'prompt names the full plan path' { (Get-CallArgs 1).Contains($Plan) }
Check 'prompt names the decisions file next to the plan' { (Get-CallArgs 1).Contains($Plan + '.decisions.md') }
Check 'writes the log next to the plan' { (Get-Log).Contains('Task complete after 1 run(s).') }

New-Scenario 'Console code page' 'codepage'
Set-Response 'default' "Done.`nTASK COMPLETE!`n"
Invoke-Cmd ('"' + $CodePageProbe + '" "' + $Driver + '" "' + $Plan + '"')
Check 'restores the code page it changed' { $Out.Trim() -eq 'before=437 after=437 rc=0' }

New-Scenario 'Start errors' 'starterr'
Set-Response 'default' "unused`n"
Invoke-Driver @('--help')
Check '--help exits 0' { $Rc -eq 0 }
Check '--help names the script itself' { $Out.Contains('Usage: ' + [IO.Path]::GetFileName($Driver) + ' ') }
Invoke-Driver @()
Check 'missing plan file exits 2' { $Rc -eq 2 }
Invoke-Driver @((Join-Path $Stub 'no-such-plan.md'))
Check 'plan file not found exits 2' { $Rc -eq 2 }
Invoke-Driver @($Stub)
Check 'folder as plan file exits 2' { $Rc -eq 2 }
Invoke-Driver @($Plan, '5', '20')
Check 'third argument exits 2' { $Rc -eq 2 }
Invoke-Driver @($Plan, '1.5')
Check 'non-integer interval exits 2' { $Rc -eq 2 }
Invoke-Driver @($Plan, '0') @{ LOOP_MAX_ITERATIONS = '0' }
Check 'LOOP_MAX_ITERATIONS=0 exits 2' { $Rc -eq 2 }
# FOR /F skips a line whose first character after its delimiters is ;, so
# these test a digit check that does not rely on it.
Invoke-Driver @($Plan, ';')
Check 'interval ; exits 2' { $Rc -eq 2 }
Invoke-Driver @($Plan, '5;')
Check 'interval 5; exits 2' { $Rc -eq 2 }
Invoke-Driver @($Plan, '0') @{ LOOP_MAX_ITERATIONS = '2;rem' }
Check 'LOOP_MAX_ITERATIONS=2;rem exits 2' { $Rc -eq 2 }
Invoke-Driver @($Plan, '0') @{ PATH = $Sys32 }
Check 'copilot not on PATH exits 2' { $Rc -eq 2 }
Check 'copilot never called' { (Get-Calls) -eq 0 }

Remove-Item -LiteralPath $Work -Recurse -Force
Write-Output ''
Write-Output ('{0} of {1} checks passed.' -f ($script:Checks - $script:Fails), $script:Checks)
if ($script:Fails -gt 0) { exit 1 }
exit 0

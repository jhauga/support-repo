# Runs Acme Sting from the command line: writes a job, runs AfterFX.exe -s,
# waits for the result file, then converts the MP4 render to a GIF with ffmpeg.
# Logs, job files, result files and MP4s go to the system temp folder.
[CmdletBinding()]
param(
    [ValidateSet('Classic', 'Shine', 'Bounce')]
    [string]$Preset = 'Classic',
    # Optional JSON object merged over the preset, e.g. '{"word":"ACME","effects":{"drift":{"on":false}}}'.
    [string]$OverridesJson = '',
    [switch]$NoRender,
    [string]$Name = '',
    [string]$GifPath = '',
    [int]$TimeoutSeconds = 900,
    [string]$AfterFX = '',
    [string]$FFmpeg = ''
)

$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
$jsx = Join-Path $PSScriptRoot 'jsx\acme-sting.jsx'
$tempDir = Join-Path $env:TEMP 'acme-sting'
$logFile = Join-Path $tempDir 'run-sting.log'
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

function Write-Log([string]$text) {
    $line = '{0} {1}' -f (Get-Date -Format 's'), $text
    Add-Content -Path $logFile -Value $line
    Write-Host $text
}

if (-not $AfterFX) {
    $AfterFX = Get-ChildItem 'C:\Program Files\Adobe\Adobe After Effects *\Support Files\AfterFX.exe' -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $AfterFX -or -not (Test-Path $AfterFX)) { throw 'AfterFX.exe not found. Pass -AfterFX <path>.' }

if (-not $FFmpeg) {
    $cmd = Get-Command ffmpeg -ErrorAction SilentlyContinue
    if ($cmd) { $FFmpeg = $cmd.Source }
}
if (-not $NoRender -and (-not $FFmpeg -or -not (Test-Path $FFmpeg))) { throw 'ffmpeg not found. Pass -FFmpeg <path>.' }

if (-not $Name) { $Name = $Preset }
if (-not $GifPath) { $GifPath = Join-Path $repo "docs\images\$Name.gif" }
$resultFile = Join-Path $tempDir "$Name-result.json"
$mp4File = Join-Path $tempDir "$Name.mp4"
$jobFile = Join-Path $tempDir "$Name-job.jsx"

$overrides = if ($OverridesJson) { $OverridesJson } else { '{}' }
$job = '{{ "preset": "{0}", "overrides": {1}, "render": {2}, "outputFile": "{3}", "resultFile": "{4}" }}' -f `
    $Preset, $overrides, ([string](-not $NoRender)).ToLower(), $mp4File.Replace('\', '/'), $resultFile.Replace('\', '/')
$jsxPath = $jsx.Replace('\', '/')
Set-Content -Path $jobFile -Value ('var stingJob = ' + $job + '; $.evalFile("' + $jsxPath + '");') -Encoding UTF8

Remove-Item $resultFile -ErrorAction SilentlyContinue
Write-Log "Running preset $Preset (render: $(-not $NoRender))"
& $AfterFX -s ('$.evalFile("' + $jobFile.Replace('\', '/') + '");')

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
while (-not (Test-Path $resultFile) -and (Get-Date) -lt $deadline) { Start-Sleep -Seconds 2 }
if (-not (Test-Path $resultFile)) { throw "No result file after $TimeoutSeconds seconds: $resultFile" }
Start-Sleep -Seconds 1

$result = Get-Content $resultFile -Raw | ConvertFrom-Json
Write-Log ('Result: ok={0} preset={1} composition={2}' -f $result.ok, $result.preset, $result.composition.name)
if (-not $result.ok) { throw "Acme Sting failed at line $($result.line): $($result.error)" }
if ($result.skippedEffects) { Write-Log ('Skipped effects: ' + ($result.skippedEffects -join ', ')) }

if ($NoRender) { Write-Log "Built only. Result: $resultFile"; return }

if (-not (Test-Path $mp4File)) { throw "MP4 not found: $mp4File" }
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $GifPath) | Out-Null
$palette = Join-Path $tempDir "$Name-palette.png"
$filter = 'fps=10,scale=720:-1:flags=lanczos'
& $FFmpeg -hide_banner -loglevel error -y -i $mp4File -vf "$filter,palettegen=stats_mode=diff" $palette
& $FFmpeg -hide_banner -loglevel error -y -i $mp4File -i $palette -lavfi "$filter [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5" $GifPath
$sizeMb = [math]::Round((Get-Item $GifPath).Length / 1MB, 2)
Write-Log "GIF: $GifPath ($sizeMb MB)"
if ($sizeMb -ge 5) { Write-Log 'Warning: GIF is 5 MB or larger; lower the fps or width.' }

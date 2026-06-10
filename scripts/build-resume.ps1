$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $Root

try {
  $BundledPython = "C:\Users\welinkton\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
  $BundledPythonPackages = "C:\Users\welinkton\.cache\codex-runtimes\codex-primary-runtime\dependencies\python"

  $Node = "node"
  $Python = if (Test-Path $BundledPython) { $BundledPython } else { "python" }

  $PlaywrightTarget = Join-Path $env:TEMP "codex-playwright"
  if (!(Test-Path (Join-Path $PlaywrightTarget "node_modules\playwright"))) {
    & npm.cmd install --quiet --prefix $PlaywrightTarget playwright
    if ($LASTEXITCODE -ne 0) { throw "Failed to install Playwright package." }
  }
  $env:NODE_PATH = Join-Path $PlaywrightTarget "node_modules"
  $PlaywrightCmd = Join-Path $PlaywrightTarget "node_modules\.bin\playwright.cmd"
  & $PlaywrightCmd install chromium
  if ($LASTEXITCODE -ne 0) { throw "Failed to install Playwright Chromium." }

  & $Node ".\scripts\build-resume-pdf.js"
  if ($LASTEXITCODE -ne 0) { throw "Failed to build resume.pdf." }

  $PdfiumTarget = Join-Path $env:TEMP "codex-pdfium"
  if (!(Test-Path (Join-Path $PdfiumTarget "pypdfium2"))) {
    & $Python -m pip install --quiet --target $PdfiumTarget pypdfium2
    if ($LASTEXITCODE -ne 0) { throw "Failed to install pypdfium2." }
  }

  $PythonPaths = @($PdfiumTarget)
  if (Test-Path $BundledPythonPackages) {
    $PythonPaths += $BundledPythonPackages
  }
  $env:PYTHONPATH = ($PythonPaths -join [IO.Path]::PathSeparator)

  & $Python ".\scripts\render-resume-preview.py"
  if ($LASTEXITCODE -ne 0) { throw "Failed to render resume-preview.png." }

  $IndexPath = Join-Path $Root "index.html"
  $Index = [IO.File]::ReadAllText($IndexPath)

  $PreviewVersions = [regex]::Matches($Index, "resume-preview\.png\?v=(\d+)") | ForEach-Object { [int]$_.Groups[1].Value }
  $PdfVersions = [regex]::Matches($Index, "resume\.pdf\?v=(\d+)") | ForEach-Object { [int]$_.Groups[1].Value }
  $NextPreviewVersion = (($PreviewVersions | Measure-Object -Maximum).Maximum) + 1
  $NextPdfVersion = (($PdfVersions | Measure-Object -Maximum).Maximum) + 1

  $Index = [regex]::Replace($Index, "resume-preview\.png\?v=\d+", "resume-preview.png?v=$NextPreviewVersion")
  $Index = [regex]::Replace($Index, "resume\.pdf\?v=\d+", "resume.pdf?v=$NextPdfVersion")
  [IO.File]::WriteAllText($IndexPath, $Index, [Text.UTF8Encoding]::new($false))

  & $Python -c "from pypdf import PdfReader; r=PdfReader('assets/resume.pdf'); print(f'resume.pdf pages={len(r.pages)} size={r.pages[0].mediabox}')"
  if ($LASTEXITCODE -ne 0) { throw "Failed to validate resume.pdf." }
  Write-Host "Updated cache versions: resume-preview.png?v=$NextPreviewVersion, resume.pdf?v=$NextPdfVersion"
}
finally {
  Pop-Location
}

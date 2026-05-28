param(
  [string]$Root = (Join-Path $PSScriptRoot '..\prime-epos')
)

$rootPath = [System.IO.Path]::GetFullPath($Root)
$files = Get-ChildItem -LiteralPath $rootPath -Recurse -File |
  Where-Object { $_.Extension -in '.html', '.php', '.css', '.js' }
$refs = @()

foreach ($file in $files) {
  $text = Get-Content -LiteralPath $file.FullName -Raw

  foreach ($match in [regex]::Matches($text, '\b(href|src|action)\s*=\s*(["''])(.*?)\2', 'IgnoreCase')) {
    $line = ($text.Substring(0, $match.Index) -split "`r?`n").Count
    $refs += [pscustomobject]@{
      File = $file.FullName
      Line = $line
      Type = $match.Groups[1].Value
      Url  = $match.Groups[3].Value
    }
  }

  if ($file.Extension -eq '.css') {
    foreach ($match in [regex]::Matches($text, 'url\(\s*(["'']?)(.*?)\1\s*\)', 'IgnoreCase')) {
      $line = ($text.Substring(0, $match.Index) -split "`r?`n").Count
      $refs += [pscustomobject]@{
        File = $file.FullName
        Line = $line
        Type = 'css-url'
        Url  = $match.Groups[2].Value
      }
    }
  }
}

$idCache = @{}
function Get-PageIds {
  param([string]$Path)

  if (-not $script:idCache.ContainsKey($Path)) {
    $text = Get-Content -LiteralPath $Path -Raw
    $ids = New-Object 'System.Collections.Generic.HashSet[string]'
    foreach ($match in [regex]::Matches($text, '\b(?:id|name)\s*=\s*(["''])(.*?)\1', 'IgnoreCase')) {
      [void]$ids.Add($match.Groups[2].Value)
    }
    $script:idCache[$Path] = $ids
  }

  $script:idCache[$Path]
}

$issues = @()
$localCount = 0
$externalCount = 0

foreach ($ref in $refs) {
  $url = $ref.Url.Trim()
  if ($url -match '^https?://') { $externalCount++ }

  if (
    -not $url -or
    $url.StartsWith('#') -or
    $url -match '^(?:[a-z][a-z0-9+.-]*:|//)' -or
    $url.StartsWith('javascript:') -or
    $url.StartsWith('data:')
  ) {
    continue
  }

  $localCount++
  $pathPart = ($url -split '#')[0]
  $pathPart = ($pathPart -split '\?')[0]
  if (-not $pathPart) { continue }

  $target = [System.IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $ref.File) $pathPart))

  if (-not (Test-Path -LiteralPath $target)) {
    $issues += [pscustomobject]@{
      Issue  = 'missing-file'
      Source = $ref.File.Substring($rootPath.Length + 1)
      Line   = $ref.Line
      Url    = $url
      Target = $target.Substring($rootPath.Length + 1)
      Anchor = ''
    }
    continue
  }

  if ($url.Contains('#')) {
    $anchor = ($url -split '#', 2)[1]
    $anchor = ($anchor -split '\?')[0]
    if ($anchor -and -not (Get-PageIds $target).Contains($anchor)) {
      $issues += [pscustomobject]@{
        Issue  = 'missing-anchor'
        Source = $ref.File.Substring($rootPath.Length + 1)
        Line   = $ref.Line
        Url    = $url
        Target = $target.Substring($rootPath.Length + 1)
        Anchor = $anchor
      }
    }
  }
}

Write-Host "Files audited: $($files.Count)"
Write-Host "References found: $($refs.Count)"
Write-Host "Local references checked: $localCount"
Write-Host "External http(s) references: $externalCount"
Write-Host "Issues found: $($issues.Count)"

if ($issues.Count) {
  $issues | Sort-Object Issue, Target, Source, Line | Format-Table -AutoSize
  exit 1
}

exit 0

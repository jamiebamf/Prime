$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$siteRoot = Join-Path $root "prime-epos"
$videoDir = Join-Path $siteRoot "assets\videos\solutions"
$solutionsDir = Join-Path $siteRoot "solutions"

New-Item -ItemType Directory -Force -Path $videoDir | Out-Null

$videos = @{
  "collectionpoint"  = "collectionpoint.mp4"
  "touchmenu"        = "touchmenu.mp4"
  "ticketing"        = "ticketing.mp4"
  "touchkitchen"     = "touchkitchen.mp4"
  "bytable"          = "bytable.mp4"
  "selfservice"      = "SelfService.mp4"
  "touchoffice"      = "TouchOffice-Web.mp4"
  "pockettouch"      = "PocketTouch.mp4"
  "touchpoint-lite"  = "TouchPoint-lite.mp4"
  "touchpoint"       = "TouchPoint.mp4"
}

$missingVideoSlugs = @(
  "touchtakeaway",
  "touchstock",
  "touchtopup",
  "digital-signage",
  "touchreservation"
)

$titles = @{
  "collectionpoint"  = "CollectionPoint"
  "touchmenu"        = "TouchMenu"
  "ticketing"        = "Ticketing"
  "touchkitchen"     = "TouchKitchen"
  "bytable"          = "ByTable"
  "selfservice"      = "SelfService"
  "touchoffice"      = "TouchOffice Web"
  "pockettouch"      = "PocketTouch"
  "touchpoint-lite"  = "TouchPoint Lite"
  "touchpoint"       = "TouchPoint"
  "touchtakeaway"    = "TouchTakeaway"
  "touchstock"       = "TouchStock"
  "touchtopup"       = "TouchTopUp"
  "digital-signage"  = "Digital Signage"
  "touchreservation" = "TouchReservation"
}

function Find-PosterPath {
  param([string]$Slug)

  $imageDir = Join-Path $siteRoot "assets\images\icrtouch\$Slug"
  if (-not (Test-Path $imageDir)) {
    return $null
  }

  $preferred = @("image-2.jpg", "image-2.png", "image-3.jpg", "image-3.png", "image-1.png", "image-1.jpg")
  foreach ($name in $preferred) {
    $candidate = Join-Path $imageDir $name
    if (Test-Path $candidate) {
      return "../assets/images/icrtouch/$Slug/$name"
    }
  }

  $firstImage = Get-ChildItem -Path $imageDir -File | Where-Object { $_.Extension -match '^\.(png|jpe?g|webp)$' } | Select-Object -First 1
  if ($firstImage) {
    return "../assets/images/icrtouch/$Slug/$($firstImage.Name)"
  }

  return $null
}

foreach ($entry in $videos.GetEnumerator()) {
  $source = Join-Path $env:USERPROFILE "Downloads\$($entry.Value)"
  if (-not (Test-Path $source)) {
    Write-Warning "Video not found: $source"
    continue
  }

  $destination = Join-Path $videoDir "$($entry.Key).mp4"
  Copy-Item -LiteralPath $source -Destination $destination -Force
  Write-Host "Copied $($entry.Value) -> assets/videos/solutions/$($entry.Key).mp4"
}

$allSlugs = @($videos.Keys) + $missingVideoSlugs

foreach ($slug in $allSlugs) {
  $page = Join-Path $solutionsDir "$slug.html"
  if (-not (Test-Path $page)) {
    Write-Warning "Page not found: $page"
    continue
  }

  $html = Get-Content -LiteralPath $page -Raw
  $title = $titles[$slug]
  $poster = Find-PosterPath -Slug $slug
  if (-not $poster) {
    Write-Warning "No poster image found for $slug"
    continue
  }

  if ($videos.ContainsKey($slug)) {
    $media = @"
    <div class="icr-video-frame has-local-video">
      <video controls preload="metadata" playsinline poster="$poster" aria-label="$title product video">
        <source src="../assets/videos/solutions/$slug.mp4" type="video/mp4">
        Your browser does not support the video tag.
      </video>
"@
  } else {
    $media = @"
    <div class="icr-video-frame has-image-fallback">
      <img src="$poster" alt="$title preview">
"@
  }

  $updated = [regex]::Replace(
    $html,
    '(?s)    <div class="icr-video-frame">\s*<iframe.*?</iframe>\s*</div>',
    "$media    </div>",
    1
  )

  if ($updated -eq $html) {
    Write-Warning "No video iframe block replaced in $slug.html"
    continue
  }

  Set-Content -LiteralPath $page -Value $updated -Encoding UTF8
  Write-Host "Updated $slug.html"
}

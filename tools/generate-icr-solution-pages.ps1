$ErrorActionPreference = 'Stop'

$products = @(
  @{ slug='touchpoint'; name='TouchPoint'; url='https://icrtouch.com/products/touchpoint'; logo='../assets/images/solutions/logos/touchpoint.png'; file='touchpoint.html'; tag='Bespoke EPoS' },
  @{ slug='touchpoint-lite'; name='TouchPoint Lite'; url='https://icrtouch.com/products/touchpoint-lite/'; logo='../assets/images/solutions/logos/touchpointlite.png'; file='touchpoint-lite.html'; tag='Lightweight EPoS' },
  @{ slug='touchoffice'; name='TouchOffice Web'; url='https://icrtouch.com/products/touchoffice-web'; logo='../assets/images/solutions/logos/touchoffice.png'; file='touchoffice.html'; tag='Cloud Back Office' },
  @{ slug='pockettouch'; name='PocketTouch'; url='https://icrtouch.com/products/pockettouch'; logo='../assets/images/solutions/logos/pockettouch.png'; file='pockettouch.html'; tag='Handheld Ordering' },
  @{ slug='bytable'; name='ByTable'; url='https://icrtouch.com/products/bytable'; logo='../assets/images/solutions/logos/bytable.png'; file='bytable.html'; tag='Order-to-table' },
  @{ slug='touchkitchen'; name='TouchKitchen'; url='https://icrtouch.com/products/touchkitchen'; logo='../assets/images/solutions/logos/touchkitchen.png'; file='touchkitchen.html'; tag='Kitchen Management' },
  @{ slug='selfservice'; name='SelfService'; url='https://icrtouch.com/products/selfservice'; logo='../assets/images/solutions/logos/selfservice.png'; file='selfservice.html'; tag='Kiosk Ordering' },
  @{ slug='touchreservation'; name='TouchReservation'; url='https://icrtouch.com/products/touchreservation'; logo='../assets/images/solutions/logos/touchreservations.png'; file='touchreservation.html'; tag='Online Reservations' },
  @{ slug='touchtakeaway'; name='TouchTakeaway'; url='https://icrtouch.com/products/touchtakeaway'; logo='../assets/images/solutions/logos/touchtakeaway.png'; file='touchtakeaway.html'; tag='Online Ordering' },
  @{ slug='touchmenu'; name='TouchMenu'; url='https://icrtouch.com/products/touchmenu'; logo='../assets/images/solutions/logos/touchmenu.png'; file='touchmenu.html'; tag='Digital Menus' },
  @{ slug='collectionpoint'; name='CollectionPoint'; url='https://icrtouch.com/products/collectionpoint'; logo='../assets/images/solutions/logos/collectionpoint.png'; file='collectionpoint.html'; tag='Order Collection' },
  @{ slug='touchstock'; name='TouchStock'; url='https://icrtouch.com/products/touchstock'; logo='../assets/images/solutions/logos/touchstock.png'; file='touchstock.html'; tag='Stock Management' },
  @{ slug='ticketing'; name='Ticketing'; url='https://icrtouch.com/products/ticketing'; logo='../assets/images/solutions/logos/ticketing.png'; file='ticketing.html'; tag='Event Ticketing' },
  @{ slug='touchtopup'; name='TouchTopUp'; url='https://icrtouch.com/products/touchtopup'; logo='../assets/images/solutions/logos/touchtopup.png'; file='touchtopup.html'; tag='Cashless Top-ups' },
  @{ slug='digital-signage'; name='Digital Signage'; url='https://icrtouch.com/products/digital-signage'; logo='../assets/images/solutions/logos/digitalsignage.png'; file='digital-signage.html'; tag='Digital Signage' }
)

function Decode-Html([string]$s) {
  if ([string]::IsNullOrWhiteSpace($s)) { return '' }
  $s = [regex]::Replace($s, '<script[\s\S]*?</script>', '', 'IgnoreCase')
  $s = [regex]::Replace($s, '<style[\s\S]*?</style>', '', 'IgnoreCase')
  $s = [regex]::Replace($s, '<[^>]+>', ' ')
  $s = [System.Net.WebUtility]::HtmlDecode($s)
  return ([regex]::Replace($s, '\s+', ' ').Trim())
}

function Get-Tags($html, $tag) {
  $matches = [regex]::Matches($html, "<$tag\b[^>]*>([\s\S]*?)</$tag>", 'IgnoreCase')
  $out = New-Object System.Collections.Generic.List[string]
  foreach ($m in $matches) {
    $txt = Decode-Html $m.Groups[1].Value
    if ($txt.Length -gt 2 -and $txt.Length -lt 380 -and -not $out.Contains($txt)) { $out.Add($txt) }
  }
  return @($out)
}

function Escape([string]$s) {
  return [System.Net.WebUtility]::HtmlEncode($s)
}

function Fix-Url([string]$u) {
  $u = [System.Net.WebUtility]::HtmlDecode($u)
  $u = $u.Split(' ')[0]
  if ($u.StartsWith('//')) { return 'https:' + $u }
  if ($u.StartsWith('/')) { return 'https://icrtouch.com' + $u }
  if ($u -match '^wp-content/') { return 'https://icrtouch.com/' + $u }
  return $u
}

function Download-Image($url, $dest) {
  try {
    Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing | Out-Null
    return $true
  } catch {
    Write-Warning "Image download failed: $url"
    return $false
  }
}

$footerSource = [System.IO.File]::ReadAllText((Resolve-Path 'prime-epos/solutions/touchpoint.html'))
$footer = $footerSource.Substring($footerSource.IndexOf('<footer class="site-footer">'))
$navStart = $footerSource.IndexOf('<nav class="site-nav">')
$navEnd = $footerSource.IndexOf('</nav>', $navStart) + 6
$nav = $footerSource.Substring($navStart, $navEnd - $navStart)

foreach ($p in $products) {
  Write-Host "Fetching $($p.name)"
  $html = (Invoke-WebRequest -Uri $p.url -UseBasicParsing).Content
  $h1Index = $html.IndexOf('<h1')
  if ($h1Index -lt 0) { $h1Index = 0 }
  $endIndex = $html.IndexOf('Find your local', $h1Index)
  if ($endIndex -lt 0) { $endIndex = [Math]::Min($html.Length, $h1Index + 180000) }
  $slice = $html.Substring($h1Index, $endIndex - $h1Index)

  $h1s = Get-Tags $slice 'h1'
  $h2s = Get-Tags $slice 'h2'
  $h3s = Get-Tags $slice 'h3'
  $ps = Get-Tags $slice 'p'
  $headline = if ($h1s.Count) { $h1s[0] } else { $p.name }
  $intro = @($ps | Where-Object { $_ -notmatch 'cookie|privacy|copyright|find your local|sign in|accept all|reject all' } | Select-Object -First 3)
  if ($intro.Count -eq 0) { $intro = @("$($p.name) is part of the ICRTouch software ecosystem, designed to connect your front-of-house, back-office, and customer-facing workflows.") }

  $imageUrls = New-Object System.Collections.Generic.List[string]
  foreach ($m in [regex]::Matches($slice, '(?:src|data-src|href)=["'']([^"'']+\.(?:png|jpg|jpeg|webp))(?:\?[^"'']*)?["'']', 'IgnoreCase')) {
    $u = Fix-Url $m.Groups[1].Value
    $file = [IO.Path]::GetFileName($u).ToLowerInvariant()
    if ($u -notmatch 'wp-content/uploads' -or $file -match 'logo|productlogos|icon|cropped|twitter|facebook|linkedin|youtube|favicon') { continue }
    if (-not $imageUrls.Contains($u)) { $imageUrls.Add($u) }
  }
  if ($imageUrls.Count -lt 3) {
    foreach ($m in [regex]::Matches($html, '(?:src|data-src|href)=["'']([^"'']+\.(?:png|jpg|jpeg|webp))(?:\?[^"'']*)?["'']', 'IgnoreCase')) {
      $u = Fix-Url $m.Groups[1].Value
      $file = [IO.Path]::GetFileName($u).ToLowerInvariant()
      if ($u -notmatch 'wp-content/uploads' -or $file -match 'logo|productlogos|icon|cropped|twitter|facebook|linkedin|youtube|favicon|hospitality|venuesevents') { continue }
      if (-not $imageUrls.Contains($u)) { $imageUrls.Add($u) }
    }
  }

  $assetDir = "prime-epos/assets/images/icrtouch/$($p.slug)"
  New-Item -ItemType Directory -Force -Path $assetDir | Out-Null
  $localImgs = New-Object System.Collections.Generic.List[string]
  $i = 1
  foreach ($u in ($imageUrls | Select-Object -First 7)) {
    $ext = [IO.Path]::GetExtension(($u -replace '\?.*$', ''))
    if ([string]::IsNullOrWhiteSpace($ext)) { $ext = '.jpg' }
    $destRel = "assets/images/icrtouch/$($p.slug)/image-$i$ext"
    $dest = "prime-epos/$destRel"
    if (Download-Image $u $dest) { $localImgs.Add('../' + $destRel) }
    $i++
  }

  $fallbackDir = "../assets/images/solutions/media/$($p.slug)"
  if ($p.slug -eq 'touchpoint-lite') { $fallbackDir = '../assets/images/solutions/media/touchpoint-lite' }
  if ($localImgs.Count -eq 0) { $localImgs.Add("$fallbackDir/hero.png") }
  while ($localImgs.Count -lt 4) { $localImgs.Add($localImgs[$localImgs.Count % [Math]::Max(1, $localImgs.Count)]) }

  $pdf = ''
  $pdfMatch = [regex]::Match($slice, 'href=["'']([^"'']+\.pdf[^"'']*)["'']', 'IgnoreCase')
  if ($pdfMatch.Success) { $pdf = Fix-Url $pdfMatch.Groups[1].Value }

  $videoSrc = 'https://www.youtube.com/embed/videoseries?list=PL6IAkFcGM1MpgK2sZsSor3uA8aUGTDI51'
  $yt = [regex]::Match($slice, '(?:youtube\.com/embed/|youtu\.be/)([A-Za-z0-9_-]{6,})', 'IgnoreCase')
  if ($yt.Success) { $videoSrc = "https://www.youtube.com/embed/$($yt.Groups[1].Value)" }

  $features = New-Object System.Collections.Generic.List[object]
  for ($j = 0; $j -lt [Math]::Min(6, $h3s.Count); $j++) {
    $desc = if ($j -lt $ps.Count) { $ps[[Math]::Min($j + 2, $ps.Count - 1)] } else { $intro[0] }
    $features.Add([pscustomobject]@{ Title = $h3s[$j]; Desc = $desc })
  }
  while ($features.Count -lt 6) {
    $features.Add([pscustomobject]@{ Title = 'Connected workflow'; Desc = "Works as part of the wider ICRTouch ecosystem, helping $($p.name) share data with your till, back office, and connected services." })
  }

  $sectionHeads = @($h2s | Where-Object { $_ -notmatch 'products|cookies|sign|local|related|privacy' } | Select-Object -First 3)
  while ($sectionHeads.Count -lt 3) { $sectionHeads += @('Designed for everyday use', 'Built into the ICRTouch ecosystem', 'Clearer control for your team')[$sectionHeads.Count] }
  $sectionParas = @($ps | Where-Object { $_.Length -gt 55 -and $_ -notmatch 'cookie|privacy|accept all|reject all|sign in|find your local' } | Select-Object -First 9)
  while ($sectionParas.Count -lt 9) { $sectionParas += $intro[0] }

  if ($pdf) {
    $brochure = "<a href=""$pdf"" class=""btn-ghost"" target=""_blank"" rel=""noopener"">View brochure</a>"
  } else {
    $brochure = "<a href=""$($p.url)"" class=""btn-ghost"" target=""_blank"" rel=""noopener"">Developer product page</a>"
  }
  $featureIcon = @('↗', '▥', '✓', '▣', '↔', '▤')
  $featureStrip1 = for ($j = 0; $j -lt 3; $j++) { "<div class=""icr-feature""><div class=""icr-feature-icon"">$($featureIcon[$j])</div><div><h3>$(Escape $features[$j].Title)</h3><p>$(Escape $features[$j].Desc)</p></div></div>" }
  $featureStrip2 = for ($j = 3; $j -lt 6; $j++) { "<div class=""icr-feature""><div class=""icr-feature-icon"">$($featureIcon[$j])</div><div><h3>$(Escape $features[$j].Title)</h3><p>$(Escape $features[$j].Desc)</p></div></div>" }

  $body = @"
<section class="icr-product-hero">
  <div class="icr-wrap icr-hero-grid">
    <div class="icr-hero-copy">
      <img class="icr-logo" src="$($p.logo)" alt="$($p.name) logo">
      <p class="section-label">$($p.tag)</p>
      <h1>$(Escape $headline)</h1>
      <p>$(Escape $intro[0])</p>
      <div class="icr-actions">
        <a href="../contact.html" class="btn-primary">Get a quote &rarr;</a>
        $brochure
      </div>
    </div>
    <div class="icr-hero-media">
      <img src="$($localImgs[0])" alt="$($p.name)">
    </div>
  </div>
</section>

<section class="icr-video">
  <div class="icr-wrap icr-video-grid">
    <div class="icr-video-frame">
      <iframe src="$videoSrc" title="$($p.name) product video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
    </div>
    <div class="icr-video-copy">
      <p class="section-label">Overview</p>
      <h2>$(Escape $sectionHeads[0])</h2>
      <p>$(Escape $sectionParas[0])</p>
      <p>$(Escape $sectionParas[1])</p>
    </div>
  </div>
</section>

<section class="icr-feature-strip">
  <div class="icr-wrap icr-feature-grid">
    $($featureStrip1 -join "`n    ")
  </div>
</section>

<section class="icr-content-section">
  <div class="icr-wrap icr-split">
    <div class="icr-copy">
      <p class="section-label">$($p.name)</p>
      <h2>$(Escape $sectionHeads[1])</h2>
      <p>$(Escape $sectionParas[2])</p>
      <p>$(Escape $sectionParas[3])</p>
    </div>
    <div class="icr-section-media">
      <img src="$($localImgs[1])" alt="$($p.name) feature">
    </div>
  </div>
</section>

<section class="icr-feature-strip">
  <div class="icr-wrap icr-feature-grid">
    $($featureStrip2 -join "`n    ")
  </div>
</section>

<section class="icr-content-section alt">
  <div class="icr-wrap icr-split reverse">
    <div class="icr-copy">
      <p class="section-label">More control</p>
      <h2>$(Escape $sectionHeads[2])</h2>
      <p>$(Escape $sectionParas[4])</p>
      <p>$(Escape $sectionParas[5])</p>
    </div>
    <div class="icr-section-media photo">
      <img src="$($localImgs[2])" alt="$($p.name) in use">
    </div>
  </div>
</section>

<section class="icr-content-section">
  <div class="icr-wrap icr-split">
    <div class="icr-copy">
      <p class="section-label">Built to connect</p>
      <h2>Complete the ecosystem.</h2>
      <p>$(Escape $sectionParas[6])</p>
      <p>Talk to Prime-EPOS and we will help you choose the right combination of software, hardware, installation, and support for your business.</p>
      <div class="icr-actions"><a href="../contact.html" class="btn-primary">Get a free quote &rarr;</a><a href="../solutions.html" class="btn-ghost">All solutions</a></div>
    </div>
    <div class="icr-section-media">
      <img src="$($localImgs[3])" alt="$($p.name) ecosystem">
    </div>
  </div>
</section>
"@

  $head = @"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>$($p.name) - Prime-EPOS</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/style.css">
<link rel="stylesheet" href="../assets/css/icr-solution-layout.css">
</head>
<body>
"@

  $final = $head + $nav + "`n" + $body + "`n" + $footer
  $outPath = "prime-epos/solutions/$($p.file)"
  [System.IO.File]::WriteAllText((Resolve-Path $outPath), $final, [System.Text.UTF8Encoding]::new($false))
}

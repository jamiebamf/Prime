function Get-Nav($prefix) {
@"
<nav class="site-nav">
  <a href="${prefix}index.html" class="nav-logo pe-logo"><span class="pe-logo-icon" aria-hidden="true"></span><span class="pe-logo-word"><span class="pe-logo-prime">Prime</span><span class="pe-logo-dash">-</span><span class="pe-logo-epos">EPOS</span></span></a>
  <ul class="nav-links">
    <li class="has-dropdown">
      <a href="${prefix}industries.html">Industries</a>
      <div class="nav-dropdown">
        <div class="nav-dropdown-inner">
          <a href="${prefix}industries/hospitality.html">Hospitality</a>
          <a href="${prefix}industries/retail.html">Retail</a>
          <a href="${prefix}industries/venues.html">Venues &amp; Events</a>
          <a href="${prefix}industries/services.html">Services</a>
        </div>
      </div>
    </li>
    <li class="has-dropdown">
      <a href="${prefix}solutions.html">Solutions</a>
      <div class="nav-dropdown wide">
        <div class="nav-dropdown-inner">
          <a href="${prefix}solutions/touchpoint.html">TouchPoint</a>
          <a href="${prefix}solutions/touchpoint-lite.html">TouchPoint Lite</a>
          <a href="${prefix}solutions/touchoffice.html">TouchOffice Web</a>
          <a href="${prefix}solutions/pockettouch.html">PocketTouch</a>
          <a href="${prefix}solutions/bytable.html">ByTable</a>
          <a href="${prefix}solutions/touchkitchen.html">TouchKitchen</a>
          <a href="${prefix}solutions/selfservice.html">SelfService</a>
          <a href="${prefix}solutions/touchstock.html">TouchStock</a>
          <a href="${prefix}solutions/touchreservation.html">TouchReservation</a>
          <a href="${prefix}solutions/collectionpoint.html">CollectionPoint</a>
          <div class="dd-divider"></div>
          <div class="dd-view-all"><a href="${prefix}solutions.html">View all solutions &rarr;</a></div>
        </div>
      </div>
    </li>
    <li><a href="${prefix}products.html">Products</a></li>
    <li><a href="${prefix}pricing.html">Pricing</a></li>
    <li><a href="${prefix}about.html">About</a></li>
    <li><a href="${prefix}contact.html" class="nav-cta">Get a Quote</a></li>
  </ul>
  <button class="nav-mobile-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
</nav>
"@
}

function Get-Footer($prefix) {
@"
<footer class="site-footer">
  <div class="footer-top">
    <div>
      <div class="footer-brand pe-logo"><span class="pe-logo-icon" aria-hidden="true"></span><span class="pe-logo-word"><span class="pe-logo-prime">Prime</span><span class="pe-logo-dash">-</span><span class="pe-logo-epos">EPOS</span></span></div>
      <p class="footer-tagline">Professional EPoS solutions for UK businesses. Hardware that lasts. Software that works. Support that's actually here.</p>
      <div class="footer-contact">
        <div>Phone: <a href="tel:07947246247">07947 246247</a></div>
        <div>Email: <a href="mailto:info@prime-epos.co.uk">info@prime-epos.co.uk</a></div>
        <div>Support: 24/7 support available</div>
      </div>
    </div>
    <div>
      <div class="footer-col-title">Industries</div>
      <ul class="footer-links">
        <li><a href="${prefix}industries/hospitality.html">Hospitality</a></li>
        <li><a href="${prefix}industries/retail.html">Retail</a></li>
        <li><a href="${prefix}industries/venues.html">Venues &amp; Events</a></li>
        <li><a href="${prefix}industries/services.html">Services</a></li>
      </ul>
    </div>
    <div>
      <div class="footer-col-title">Solutions</div>
      <ul class="footer-links">
        <li><a href="${prefix}solutions/touchpoint.html">TouchPoint</a></li>
        <li><a href="${prefix}solutions/touchoffice.html">TouchOffice Web</a></li>
        <li><a href="${prefix}solutions/pockettouch.html">PocketTouch</a></li>
        <li><a href="${prefix}solutions.html">View all</a></li>
      </ul>
    </div>
    <div>
      <div class="footer-col-title">Company</div>
      <ul class="footer-links">
        <li><a href="${prefix}about.html">About Us</a></li>
        <li><a href="${prefix}pricing.html">Pricing</a></li>
        <li><a href="${prefix}products.html">Hardware</a></li>
        <li><a href="${prefix}contact.html">Contact</a></li>
        <li><a href="${prefix}status.html">System Status</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p class="footer-copy">&copy; 2026 Prime-EPOS. All rights reserved. Registered in England &amp; Wales.</p>
    <div class="footer-legal">
      <a href="${prefix}privacy.html">Privacy Policy</a>
      <a href="${prefix}cookies.html">Cookies</a>
      <a href="${prefix}terms.html">Terms</a>
    </div>
  </div>
</footer>
"@
}

$root = (Resolve-Path 'prime-epos').Path
Get-ChildItem -Path $root -Recurse -Filter *.html | ForEach-Object {
  $path = $_.FullName
  $rel = $path.Substring($root.Length).TrimStart('\', '/')
  $depth = ($rel -split '[\\/]').Count - 1
  $prefix = if ($depth -eq 0) { '' } else { ('../' * $depth) }
  $shellHref = "${prefix}assets/css/site-shell-v2.css"
  $content = Get-Content -LiteralPath $path -Raw

  $content = $content.Replace('<link rel="stylesheet" href="assets/css/site-shell.css">', '')
  $content = $content.Replace('<link rel="stylesheet" href="../assets/css/site-shell.css">', '')
  $content = $content.Replace('<link rel="stylesheet" href="../../assets/css/site-shell.css">', '')
  $content = $content.Replace('<link rel="stylesheet" href="assets/css/site-shell-v2.css">', '')
  $content = $content.Replace('<link rel="stylesheet" href="../assets/css/site-shell-v2.css">', '')
  $content = $content.Replace('<link rel="stylesheet" href="../../assets/css/site-shell-v2.css">', '')
  $content = [regex]::Replace($content, '(\r?\n){3,}', "`r`n`r`n")
  $content = $content -replace '</head>', "<link rel=`"stylesheet`" href=`"$shellHref`">`r`n</head>"

  $content = [regex]::Replace($content, '<nav\s+class="(?:site-nav|nav)"[\s\S]*?</nav>', [System.Text.RegularExpressions.MatchEvaluator]{ param($m) Get-Nav $prefix }, 1)
  $content = [regex]::Replace($content, '<footer\s+class="site-footer"[\s\S]*?</footer>', [System.Text.RegularExpressions.MatchEvaluator]{ param($m) Get-Footer $prefix }, 1)

  Set-Content -LiteralPath $path -Value $content -NoNewline
}

Add-Type -AssemblyName System.Drawing

$publicDir = Resolve-Path (Join-Path $PSScriptRoot "..\public")

# Locate source icon (checks scripts/ or public/, fallback to pwa-512x512.png)
$candidates = @(
    (Join-Path $PSScriptRoot "app-icon.jpg"),
    (Join-Path $PSScriptRoot "app-icon.png"),
    (Join-Path $publicDir "app-icon.jpg"),
    (Join-Path $publicDir "app-icon.png"),
    (Join-Path $publicDir "pwa-512x512.png")
)
$srcPath = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $srcPath) {
    Write-Error "Source icon not found (expected app-icon.jpg/png in scripts/ or pwa-512x512.png in public/)"
    exit 1
}

Write-Output "Source icon: $srcPath"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$srcW = $src.Width
$srcH = $src.Height

# If the image is a wide banner (e.g. 2752x1536), crop the center badge
if ($srcW -gt ($srcH * 1.2)) {
    Write-Output "Detected wide wallpaper/banner ($($srcW)x$($srcH)). Extracting centered icon badge..."
    $badgeW = 780
    $badgeH = 780
    $badgeX = [int](($srcW / 2) - ($badgeW / 2) + 8)
    $badgeY = [int](($srcH / 2) - ($badgeH / 2) - 2)

    # 1. Tight badge crop (opaque)
    $badgeOpaque = New-Object System.Drawing.Bitmap($badgeW, $badgeH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($badgeOpaque)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $srcRect = New-Object System.Drawing.Rectangle($badgeX, $badgeY, $badgeW, $badgeH)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $badgeW, $badgeH)
    $g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    # 2. Padded crop for maskable adaptive icon (safe zone circle)
    $padSize = [Math]::Min($srcH, 1024)
    $padX = [int](($srcW / 2) - ($padSize / 2) + 8)
    $padY = [int](($srcH / 2) - ($padSize / 2) - 2)
    $paddedBmp = New-Object System.Drawing.Bitmap($padSize, $padSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gPad = [System.Drawing.Graphics]::FromImage($paddedBmp)
    $gPad.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gPad.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gPad.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $srcRectPad = New-Object System.Drawing.Rectangle($padX, $padY, $padSize, $padSize)
    $destRectPad = New-Object System.Drawing.Rectangle(0, 0, $padSize, $padSize)
    $gPad.DrawImage($src, $destRectPad, $srcRectPad, [System.Drawing.GraphicsUnit]::Pixel)
    $gPad.Dispose()
} else {
    Write-Output "Image is square ($($srcW)x$($srcH)). Using full image as base..."
    $badgeOpaque = $src.Clone()
    $paddedBmp = $src.Clone()
}

# 3. Create rounded version with smooth transparent corners for web and PWA
function Get-RoundedBitmap($origBmp, $radiusRatio = 0.224) {
    $w = $origBmp.Width
    $h = $origBmp.Height
    $r = [int]($w * $radiusRatio)
    $res = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($res)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $r*2, $r*2, 180, 90)
    $path.AddArc($w - $r*2, 0, $r*2, $r*2, 270, 90)
    $path.AddArc($w - $r*2, $h - $r*2, $r*2, $r*2, 0, 90)
    $path.AddArc(0, $h - $r*2, $r*2, $r*2, 90, 90)
    $path.CloseFigure()

    $g.SetClip($path)
    $g.DrawImage($origBmp, 0, 0, $w, $h)
    $g.Dispose()
    return $res
}

$badgeTransparent = Get-RoundedBitmap $badgeOpaque 0.224

# Helper: Resize Bitmap
function Resize-Bitmap($srcBmp, $width, $height) {
    $dest = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($srcBmp, 0, 0, $width, $height)
    $g.Dispose()
    return $dest
}

# Helper: Save PNG
function Save-Png($bmp, $filePath) {
    if (Test-Path $filePath) { Remove-Item $filePath -Force }
    $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
}

# Multi-resolution ICO builder
function Create-MultiResIco($pngList, $outIcoPath) {
    if (Test-Path $outIcoPath) { Remove-Item $outIcoPath -Force }
    $fs = [System.IO.File]::Create($outIcoPath)
    $bw = New-Object System.IO.BinaryWriter($fs)

    # ICONDIR
    $bw.Write([uint16]0) # Reserved
    $bw.Write([uint16]1) # Type 1 = ICO
    $bw.Write([uint16]$pngList.Count) # Count

    $offset = 6 + (16 * $pngList.Count)

    # ICONDIRENTRY list
    foreach ($item in $pngList) {
        $w = if ($item.Size -ge 256) { 0 } else { [byte]$item.Size }
        $h = if ($item.Size -ge 256) { 0 } else { [byte]$item.Size }
        $bw.Write([byte]$w)
        $bw.Write([byte]$h)
        $bw.Write([byte]0) # Color count
        $bw.Write([byte]0) # Reserved
        $bw.Write([uint16]1) # Planes
        $bw.Write([uint16]32) # Bit count
        $bw.Write([uint32]$item.Bytes.Length)
        $bw.Write([uint32]$offset)
        $offset += $item.Bytes.Length
    }

    # PNG byte payloads
    foreach ($item in $pngList) {
        $bw.Write($item.Bytes)
    }

    $bw.Close()
    $fs.Close()
}

Write-Output "Rendering PNG icons..."

# 1. pwa-192x192.png (Transparent rounded corners)
$pwa192 = Resize-Bitmap $badgeTransparent 192 192
Save-Png $pwa192 (Join-Path $publicDir "pwa-192x192.png")
$pwa192.Dispose()

# 2. pwa-512x512.png (Transparent rounded corners)
$pwa512 = Resize-Bitmap $badgeTransparent 512 512
Save-Png $pwa512 (Join-Path $publicDir "pwa-512x512.png")
$pwa512.Dispose()

# 3. pwa-maskable-512x512.png (Padded canvas for Android adaptive maskable icons)
$maskable512 = Resize-Bitmap $paddedBmp 512 512
Save-Png $maskable512 (Join-Path $publicDir "pwa-maskable-512x512.png")
$maskable512.Dispose()

# 4. apple-touch-icon.png (180x180, Opaque squircle so iOS doesn't make corners black)
$appleTouch = Resize-Bitmap $badgeOpaque 180 180
Save-Png $appleTouch (Join-Path $publicDir "apple-touch-icon.png")
$appleTouch.Dispose()

# 5. favicon-32x32.png, favicon-16x16.png
$fav32 = Resize-Bitmap $badgeTransparent 32 32
Save-Png $fav32 (Join-Path $publicDir "favicon-32x32.png")
$fav32.Dispose()

$fav16 = Resize-Bitmap $badgeTransparent 16 16
Save-Png $fav16 (Join-Path $publicDir "favicon-16x16.png")
$fav16.Dispose()

# 7. Multi-resolution favicon.ico (16, 32, 48, 64)
Write-Output "Generating multi-resolution favicon.ico..."
$icoSizes = @(16, 32, 48, 64)
$icoPngList = @()
foreach ($sz in $icoSizes) {
    $icoBmp = Resize-Bitmap $badgeTransparent $sz $sz
    $ms = New-Object System.IO.MemoryStream
    $icoBmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $icoPngList += @{ Size=$sz; Bytes=$ms.ToArray() }
    $ms.Dispose()
    $icoBmp.Dispose()
}
Create-MultiResIco $icoPngList (Join-Path $publicDir "favicon.ico")

# Cleanup resources
$badgeOpaque.Dispose()
$paddedBmp.Dispose()
$badgeTransparent.Dispose()
$src.Dispose()

Write-Output "✅ All icons generated successfully in: $publicDir"

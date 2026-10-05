Add-Type -AssemblyName System.Drawing

function Resize-Image($srcPath, $destPath, $width, $height) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $dest = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $width, $height)
    $dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $dest.Dispose()
    $src.Dispose()
}

$publicDir = Join-Path $PSScriptRoot "..\public"
$icon = Join-Path $publicDir "app-icon.png"

Resize-Image $icon (Join-Path $publicDir "apple-touch-icon.png") 180 180
Resize-Image $icon (Join-Path $publicDir "pwa-192x192.png") 192 192
Resize-Image $icon (Join-Path $publicDir "pwa-512x512.png") 512 512
Resize-Image $icon (Join-Path $publicDir "favicon.ico") 64 64

Write-Output "All icons generated successfully from app-icon.png"

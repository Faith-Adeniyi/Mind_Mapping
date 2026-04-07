param(
  [string]$OutputDir = "public/brand"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function ConvertTo-Color {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Hex,
    [int]$Alpha = 255
  )

  $normalized = $Hex.Trim().TrimStart("#")
  if ($normalized.Length -ne 6) {
    throw "Hex color '$Hex' must be in #RRGGBB format."
  }

  $r = [Convert]::ToInt32($normalized.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($normalized.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($normalized.Substring(4, 2), 16)
  return [System.Drawing.Color]::FromArgb($Alpha, $r, $g, $b)
}

function Add-GlowNode {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$CenterX,
    [float]$CenterY,
    [float]$Radius,
    [System.Drawing.Color]$CoreColor,
    [System.Drawing.Color]$GlowColor
  )

  $glowRect = [System.Drawing.RectangleF]::new(
    $CenterX - ($Radius * 1.9),
    $CenterY - ($Radius * 1.9),
    $Radius * 3.8,
    $Radius * 3.8
  )

  $glowBrush = [System.Drawing.SolidBrush]::new($GlowColor)
  $Graphics.FillEllipse($glowBrush, $glowRect)
  $glowBrush.Dispose()

  $nodeRect = [System.Drawing.RectangleF]::new(
    $CenterX - $Radius,
    $CenterY - $Radius,
    $Radius * 2,
    $Radius * 2
  )

  $coreBrush = [System.Drawing.SolidBrush]::new($CoreColor)
  $Graphics.FillEllipse($coreBrush, $nodeRect)
  $coreBrush.Dispose()
}

function Draw-NodeAMark {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$Size,
    [hashtable]$Palette
  )

  $cx = $Size / 2.0
  $cy = $Size / 2.0
  $lineWidth = $Size * 0.07
  $nodeRadius = $Size * 0.07

  $top = [System.Drawing.PointF]::new($cx, $Size * 0.22)
  $left = [System.Drawing.PointF]::new($Size * 0.28, $Size * 0.74)
  $right = [System.Drawing.PointF]::new($Size * 0.72, $Size * 0.74)
  $crossY = $Size * 0.53

  $guidePen = [System.Drawing.Pen]::new($Palette.EdgeGlow, $Size * 0.012)
  $guidePen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dot
  $Graphics.DrawEllipse($guidePen, $Size * 0.15, $Size * 0.13, $Size * 0.7, $Size * 0.7)
  $guidePen.Dispose()

  $edgePen = [System.Drawing.Pen]::new($Palette.Primary, $lineWidth)
  $edgePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $edgePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $Graphics.DrawLine($edgePen, $top, $left)
  $Graphics.DrawLine($edgePen, $top, $right)

  $crossPen = [System.Drawing.Pen]::new($Palette.Accent, $lineWidth * 0.72)
  $crossPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $crossPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $Graphics.DrawLine($crossPen, $Size * 0.37, $crossY, $Size * 0.63, $crossY)
  $crossPen.Dispose()
  $edgePen.Dispose()

  Add-GlowNode -Graphics $Graphics -CenterX $top.X -CenterY $top.Y -Radius $nodeRadius -CoreColor $Palette.Primary -GlowColor $Palette.NodeGlow
  Add-GlowNode -Graphics $Graphics -CenterX $left.X -CenterY $left.Y -Radius $nodeRadius -CoreColor $Palette.Secondary -GlowColor $Palette.NodeGlow
  Add-GlowNode -Graphics $Graphics -CenterX $right.X -CenterY $right.Y -Radius $nodeRadius -CoreColor $Palette.Accent -GlowColor $Palette.NodeGlow

  Add-GlowNode -Graphics $Graphics -CenterX $cx -CenterY $crossY -Radius ($nodeRadius * 0.6) -CoreColor $Palette.TextHint -GlowColor $Palette.EdgeGlow
}

function Draw-AbstractOrbit {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$Size,
    [hashtable]$Palette
  )

  $cx = $Size / 2.0
  $cy = $Size / 2.0
  $orbitalPen = [System.Drawing.Pen]::new($Palette.EdgeGlow, $Size * 0.025)
  $orbitalPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $orbitalPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

  $rect1 = [System.Drawing.RectangleF]::new($Size * 0.17, $Size * 0.21, $Size * 0.66, $Size * 0.45)
  $rect2 = [System.Drawing.RectangleF]::new($Size * 0.17, $Size * 0.34, $Size * 0.66, $Size * 0.45)
  $Graphics.DrawArc($orbitalPen, $rect1, 12, 320)
  $Graphics.DrawArc($orbitalPen, $rect2, 190, 295)
  $orbitalPen.Dispose()

  $linkPen = [System.Drawing.Pen]::new($Palette.Primary, $Size * 0.05)
  $linkPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $linkPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $Graphics.DrawLine($linkPen, $Size * 0.2, $Size * 0.62, $Size * 0.5, $Size * 0.42)
  $Graphics.DrawLine($linkPen, $Size * 0.5, $Size * 0.42, $Size * 0.8, $Size * 0.62)
  $linkPen.Dispose()

  Add-GlowNode -Graphics $Graphics -CenterX $cx -CenterY ($Size * 0.5) -Radius ($Size * 0.12) -CoreColor $Palette.Primary -GlowColor $Palette.NodeGlow
  Add-GlowNode -Graphics $Graphics -CenterX ($Size * 0.2) -CenterY ($Size * 0.62) -Radius ($Size * 0.06) -CoreColor $Palette.Secondary -GlowColor $Palette.NodeGlow
  Add-GlowNode -Graphics $Graphics -CenterX ($Size * 0.8) -CenterY ($Size * 0.62) -Radius ($Size * 0.06) -CoreColor $Palette.Accent -GlowColor $Palette.NodeGlow
  Add-GlowNode -Graphics $Graphics -CenterX ($Size * 0.29) -CenterY ($Size * 0.33) -Radius ($Size * 0.05) -CoreColor $Palette.TextHint -GlowColor $Palette.EdgeGlow
  Add-GlowNode -Graphics $Graphics -CenterX ($Size * 0.71) -CenterY ($Size * 0.33) -Radius ($Size * 0.05) -CoreColor $Palette.TextHint -GlowColor $Palette.EdgeGlow
}

function Draw-LetterMonogram {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$Size,
    [hashtable]$Palette
  )

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddPolygon(
    [System.Drawing.PointF[]]@(
      [System.Drawing.PointF]::new($Size * 0.2, $Size * 0.78),
      [System.Drawing.PointF]::new($Size * 0.5, $Size * 0.2),
      [System.Drawing.PointF]::new($Size * 0.8, $Size * 0.78),
      [System.Drawing.PointF]::new($Size * 0.66, $Size * 0.78),
      [System.Drawing.PointF]::new($Size * 0.57, $Size * 0.61),
      [System.Drawing.PointF]::new($Size * 0.43, $Size * 0.61),
      [System.Drawing.PointF]::new($Size * 0.34, $Size * 0.78)
    )
  )

  $fillBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.PointF]::new($Size * 0.3, $Size * 0.2),
    [System.Drawing.PointF]::new($Size * 0.7, $Size * 0.82),
    $Palette.Primary,
    $Palette.Secondary
  )
  $Graphics.FillPath($fillBrush, $path)
  $fillBrush.Dispose()

  $crossPen = [System.Drawing.Pen]::new($Palette.Accent, $Size * 0.07)
  $crossPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $crossPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $Graphics.DrawLine($crossPen, $Size * 0.37, $Size * 0.56, $Size * 0.63, $Size * 0.56)
  $crossPen.Dispose()

  $outline = [System.Drawing.Pen]::new($Palette.EdgeGlow, $Size * 0.012)
  $Graphics.DrawPath($outline, $path)
  $outline.Dispose()
  $path.Dispose()

  Add-GlowNode -Graphics $Graphics -CenterX ($Size * 0.5) -CenterY ($Size * 0.2) -Radius ($Size * 0.055) -CoreColor $Palette.Accent -GlowColor $Palette.NodeGlow
  Add-GlowNode -Graphics $Graphics -CenterX ($Size * 0.2) -CenterY ($Size * 0.78) -Radius ($Size * 0.05) -CoreColor $Palette.Primary -GlowColor $Palette.NodeGlow
  Add-GlowNode -Graphics $Graphics -CenterX ($Size * 0.8) -CenterY ($Size * 0.78) -Radius ($Size * 0.05) -CoreColor $Palette.Secondary -GlowColor $Palette.NodeGlow
}

function Draw-Background {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$Size,
    [hashtable]$Palette
  )

  $bgRect = [System.Drawing.RectangleF]::new(0, 0, $Size, $Size)
  $gradient = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.PointF]::new(0, 0),
    [System.Drawing.PointF]::new($Size, $Size),
    $Palette.BackgroundA,
    $Palette.BackgroundB
  )
  $Graphics.FillRectangle($gradient, $bgRect)
  $gradient.Dispose()

  $overlay = [System.Drawing.SolidBrush]::new($Palette.EdgeGlow)
  $Graphics.FillEllipse($overlay, $Size * 0.08, $Size * 0.08, $Size * 0.84, $Size * 0.84)
  $overlay.Dispose()
}

function Draw-ConceptIcon {
  param(
    [string]$StyleKey,
    [hashtable]$Palette,
    [int]$Size,
    [bool]$Transparent,
    [string]$OutputPath
  )

  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  if ($Transparent) {
    $graphics.Clear([System.Drawing.Color]::Transparent)
  } else {
    Draw-Background -Graphics $graphics -Size $Size -Palette $Palette
  }

  switch ($StyleKey) {
    "node-a-mark" { Draw-NodeAMark -Graphics $graphics -Size $Size -Palette $Palette }
    "abstract-orbit" { Draw-AbstractOrbit -Graphics $graphics -Size $Size -Palette $Palette }
    "letter-monogram" { Draw-LetterMonogram -Graphics $graphics -Size $Size -Palette $Palette }
    default { throw "Unknown style '$StyleKey'" }
  }

  $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Build-Palette {
  param(
    [string]$Primary,
    [string]$Secondary,
    [string]$Accent,
    [string]$BackgroundA,
    [string]$BackgroundB
  )

  return @{
    Primary = ConvertTo-Color -Hex $Primary
    Secondary = ConvertTo-Color -Hex $Secondary
    Accent = ConvertTo-Color -Hex $Accent
    BackgroundA = ConvertTo-Color -Hex $BackgroundA
    BackgroundB = ConvertTo-Color -Hex $BackgroundB
    NodeGlow = ConvertTo-Color -Hex $Primary -Alpha 70
    EdgeGlow = ConvertTo-Color -Hex $Secondary -Alpha 55
    TextHint = ConvertTo-Color -Hex "E8F5FF" -Alpha 235
  }
}

function Build-PreviewBoard {
  param(
    [array]$Concepts,
    [string]$OutputPath
  )

  $columns = 3
  $rows = [Math]::Ceiling($Concepts.Count / $columns)
  $cell = 520
  $gutter = 42
  $padding = 56
  $boardWidth = ($padding * 2) + ($columns * $cell) + (($columns - 1) * $gutter)
  $boardHeight = ($padding * 2) + ($rows * ($cell + 62)) + (($rows - 1) * $gutter)

  $bitmap = [System.Drawing.Bitmap]::new($boardWidth, $boardHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.Clear((ConvertTo-Color -Hex "081022"))

  $font = [System.Drawing.Font]::new("Segoe UI", 19, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $labelBrush = [System.Drawing.SolidBrush]::new((ConvertTo-Color -Hex "D8EBFF"))

  for ($index = 0; $index -lt $Concepts.Count; $index++) {
    $row = [Math]::Floor($index / $columns)
    $col = $index % $columns

    $x = $padding + ($col * ($cell + $gutter))
    $y = $padding + ($row * ($cell + 62 + $gutter))

    $iconPath = $Concepts[$index].Path
    $label = $Concepts[$index].Label

    $image = [System.Drawing.Image]::FromFile($iconPath)
    $graphics.DrawImage($image, $x, $y, $cell, $cell)
    $image.Dispose()

    $graphics.DrawString($label, $font, $labelBrush, $x, $y + $cell + 12)
  }

  $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $labelBrush.Dispose()
  $font.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

$previewDir = Join-Path $OutputDir "previews"
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
New-Item -ItemType Directory -Path $previewDir -Force | Out-Null

$styles = @(
  @{ Key = "node-a-mark"; Label = "Node A Mark" },
  @{ Key = "abstract-orbit"; Label = "Abstract Orbit" },
  @{ Key = "letter-monogram"; Label = "Letter Monogram" }
)

$palettes = @(
  @{
    Key = "teal-cyan"
    Label = "Teal/Cyan"
    Colors = Build-Palette -Primary "5EDBFF" -Secondary "50E2C0" -Accent "A5F6FF" -BackgroundA "07182F" -BackgroundB "0D2F4D"
  },
  @{
    Key = "blue-indigo"
    Label = "Blue/Indigo"
    Colors = Build-Palette -Primary "69B7FF" -Secondary "7F8DFF" -Accent "B6DEFF" -BackgroundA "0C1331" -BackgroundB "1B2457"
  },
  @{
    Key = "coral-glow"
    Label = "Coral Glow"
    Colors = Build-Palette -Primary "FF8A72" -Secondary "FF6FAA" -Accent "FFC3A8" -BackgroundA "26112C" -BackgroundB "4A2042"
  }
)

$concepts = @()
foreach ($style in $styles) {
  foreach ($palette in $palettes) {
    $fileName = "$($style.Key)-$($palette.Key).png"
    $outputPath = Join-Path $previewDir $fileName
    Draw-ConceptIcon -StyleKey $style.Key -Palette $palette.Colors -Size 1024 -Transparent $false -OutputPath $outputPath

    $concepts += @{
      Path = $outputPath
      Label = "$($style.Label) - $($palette.Label)"
    }
  }
}

$conceptBoardPath = Join-Path $previewDir "allison-icon-concept-board.png"
Build-PreviewBoard -Concepts $concepts -OutputPath $conceptBoardPath

# Winner selected by visual criteria: strong small-size silhouette + mind-map semantics.
$winnerStyle = "node-a-mark"
$winnerPalette = ($palettes | Where-Object { $_.Key -eq "teal-cyan" } | Select-Object -First 1).Colors
$sizes = @(1024, 512, 192, 180, 64, 32, 16)

foreach ($size in $sizes) {
  $solidPath = Join-Path $OutputDir "allison-icon-$size.png"
  $transparentPath = Join-Path $OutputDir "allison-icon-$size-transparent.png"

  Draw-ConceptIcon -StyleKey $winnerStyle -Palette $winnerPalette -Size $size -Transparent $false -OutputPath $solidPath
  Draw-ConceptIcon -StyleKey $winnerStyle -Palette $winnerPalette -Size $size -Transparent $true -OutputPath $transparentPath
}

Copy-Item -LiteralPath (Join-Path $OutputDir "allison-icon-1024.png") -Destination (Join-Path $OutputDir "allison-icon.png") -Force
Copy-Item -LiteralPath (Join-Path $OutputDir "allison-icon-1024-transparent.png") -Destination (Join-Path $OutputDir "allison-icon-transparent.png") -Force

Write-Output "Generated concept previews in: $previewDir"
Write-Output "Generated final icon pack in: $OutputDir"

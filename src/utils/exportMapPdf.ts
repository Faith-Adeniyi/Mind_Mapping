import { jsPDF } from 'jspdf'
import { toPng } from 'html-to-image'

export type PdfPaperSize = 'a4' | 'a3'

type PaperConfig = {
  widthMm: number
  heightMm: number
  marginMm: number
}

const PAPER_CONFIG: Record<PdfPaperSize, PaperConfig> = {
  a4: {
    widthMm: 210,
    heightMm: 297,
    marginMm: 10,
  },
  a3: {
    widthMm: 297,
    heightMm: 420,
    marginMm: 12,
  },
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to decode export image.'))
    image.src = dataUrl
  })
}

function getCaptureScale() {
  const ratio = Number.isFinite(window.devicePixelRatio) ? window.devicePixelRatio : 1
  return Math.min(3, Math.max(2, ratio))
}

export async function downloadMapCardPdf(target: HTMLElement, paperSize: PdfPaperSize) {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    await document.fonts.ready
  }

  const imageDataUrl = await toPng(target, {
    cacheBust: true,
    pixelRatio: getCaptureScale(),
    backgroundColor: '#0b1020',
  })

  const image = await loadImage(imageDataUrl)
  const paper = PAPER_CONFIG[paperSize]
  const pdf = new jsPDF({
    unit: 'mm',
    orientation: 'portrait',
    format: [paper.widthMm, paper.heightMm],
    compress: true,
  })

  const contentWidth = paper.widthMm - (paper.marginMm * 2)
  const contentHeight = paper.heightMm - (paper.marginMm * 2)
  const imageRatio = image.naturalWidth / image.naturalHeight

  let renderWidth = contentWidth
  let renderHeight = renderWidth / imageRatio

  if (renderHeight > contentHeight) {
    renderHeight = contentHeight
    renderWidth = renderHeight * imageRatio
  }

  const offsetX = (paper.widthMm - renderWidth) / 2
  const offsetY = (paper.heightMm - renderHeight) / 2

  pdf.addImage(imageDataUrl, 'PNG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'FAST')
  pdf.save(`allisons-memory-clockray-${paperSize}.pdf`)
}

import QRCode from 'qrcode';

// Production public URL for Lowkey Cafe on Vercel
export const PRODUCTION_ORIGIN = 'https://lowkey-cafe-three.vercel.app';

/**
 * Returns the fully qualified URL to encode in QR codes.
 * Ensures that whenever someone scans a QR code with their mobile phone
 * (even if the QR is displayed on a local dev screen), the phone opens the live site!
 */
export const getLiveQrUrl = (targetPath: string): string => {
  // Ensure path starts with a slash
  const cleanPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // If running locally, encode the live production URL so mobile phone cameras can open it
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local') || host.startsWith('192.168.') || host.startsWith('10.')) {
      return `${PRODUCTION_ORIGIN}${cleanPath}`;
    }
    return `${window.location.origin}${cleanPath}`;
  }

  return `${PRODUCTION_ORIGIN}${cleanPath}`;
};

// Cache generated QR data URLs
const qrCache = new Map<string, string>();

/**
 * Generates a standard high-contrast black & white QR code Data URL (PNG).
 * Uses high error correction (Level H - 30% recovery) so all mobile cameras
 * (iPhone, Android, Google Lens, Paytm, Samsung) scan it in under 0.1s.
 */
export const generateQrDataUrl = async (targetPathOrUrl: string): Promise<string> => {
  const fullUrl = targetPathOrUrl.startsWith('http')
    ? targetPathOrUrl
    : getLiveQrUrl(targetPathOrUrl);

  if (qrCache.has(fullUrl)) {
    return qrCache.get(fullUrl)!;
  }

  try {
    const dataUrl = await QRCode.toDataURL(fullUrl, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000', // Pure black modules
        light: '#ffffff', // Pure white quiet zone & background for maximum scanner contrast
      },
    });

    qrCache.set(fullUrl, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate local QR code, falling back to public generator', err);
    // Reliable fallback
    const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=10&color=000000&bgcolor=ffffff&data=${encodeURIComponent(fullUrl)}`;
    return fallbackUrl;
  }
};

/**
 * Trigger immediate browser download of the generated QR code PNG
 */
export const downloadQrCode = async (targetPathOrUrl: string, filename = 'Lowkey_Cafe_QR.png') => {
  const dataUrl = await generateQrDataUrl(targetPathOrUrl);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

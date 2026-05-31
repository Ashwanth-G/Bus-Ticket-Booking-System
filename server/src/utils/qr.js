import QRCode from 'qrcode';

export const generateQRCode = async (text) => {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    console.error('Error generating QR Code:', err);
    throw err;
  }
};

import { Image } from 'image-js';

const RGB_DISTANCE_THRESHOLD = 108;
const LUMINANCE_DIFF_THRESHOLD = 60;

const luminance = (r: number, g: number, b: number): number =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;

const saturation = (r: number, g: number, b: number): number => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
};

const colors_match = (rgb1: number[], rgb2: number[]): boolean => {
  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;

  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  const s1 = saturation(r1, g1, b1);
  const s2 = saturation(r2, g2, b2);

  const oneGrayOneColored =
    (s1 < 0.15 && s2 > 0.3) || (s2 < 0.15 && s1 > 0.3);
  if (oneGrayOneColored) {
    return false;
  }

  if (Math.abs(l1 - l2) > LUMINANCE_DIFF_THRESHOLD) {
    return false;
  }

  const distanceSquared = (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
  const thresholdSquared = RGB_DISTANCE_THRESHOLD ** 2;

  return distanceSquared <= thresholdSquared;
};

export const getImageIntersect = (
  image1: Image,
  image2: Image,
): { result: Image; percentage: number } => {
  const result = new Image({ width: image1.width, height: image1.height });
  let counter = 0;
  let actualMax = 0;
  for (let x = 0; x < image1.width; x++) {
    for (let y = 0; y < image1.height; y++) {
      const p1 = image1.getPixelXY(x, y);
      const p2 = image2.getPixelXY(x, y);
      const match = colors_match(p1, p2);
      const p3 = match ? p1 : [0, 0, 0, 0];
      result.setPixelXY(x, y, p3);
      counter = match && p1.some((x) => x) ? counter + 1 : counter;
      actualMax = p1.some((x) => x) ? actualMax + 1 : actualMax;
    }
  }

  const percentage = Math.floor((counter / actualMax) * 100);

  return { result, percentage };
};

export const getImageUnion = (
  image1: Image | undefined,
  image2: Image,
): Image => {
  if (!image1) {
    return image2;
  }

  image2.resize({ width: image1.width, height: image1.height });
  const result = new Image({ width: image1.width, height: image1.height });

  for (let x = 0; x < image1.width; x++) {
    for (let y = 0; y < image1.height; y++) {
      const p1 = image1.getPixelXY(x, y);
      const p2 = image2.getPixelXY(x, y);

      if (p2.some((x) => x)) {
        result.setPixelXY(x, y, p2);
      } else {
        result.setPixelXY(x, y, p1);
      }
    }
  }

  return result;
};

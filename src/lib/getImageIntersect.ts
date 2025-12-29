import { Image } from 'image-js';

const THRESHOLD = 80;

const rgb_difference = (rgb1: number[], rgb2: number[]): number => {
  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;

  return Math.sqrt((r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2);
};

export const getImageIntersect = (
  image1: Image,
  image2: Image,
  imageScaleRatio: number
): { Image: Image; percent: number } => {
  image2.resize({ width: image1.width * imageScaleRatio, height: image1.height * imageScaleRatio });
  const result = new Image({ width: image1.width, height: image1.height });
  let counter = 0;
  let actualMax = 0;
  for (let x = 0; x < image1.width; x++) {
    for (let y = 0; y < image1.height; y++) {
      const p1 = image1.getPixelXY(x, y);
      const p2 = image2.getPixelXY(x, y);
      const diff = rgb_difference(p1, p2);
      const p3 = diff < THRESHOLD ? p1 : [0, 0, 0];
      result.setPixelXY(x, y, p3);
      counter = diff < THRESHOLD && p1.some((x) => x) ? counter + 1 : counter;
      actualMax = p1.some((x) => x) ? actualMax + 1 : actualMax;
    }
  }

  const percentage = Math.floor((counter / actualMax) * 100);

  return { Image: result, percent: percentage };
};

export const getImageUnion = (image1: Image | undefined, image2: Image): Image => {
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

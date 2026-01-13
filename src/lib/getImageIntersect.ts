import { Image } from 'image-js';

const HUE_THRESHOLD = 30; // Maximum hue difference in degrees (0-360)
const SATURATION_THRESHOLD = 0.5; // Maximum saturation difference (0-1)
const LIGHTNESS_THRESHOLD = 0.5; // Maximum lightness difference (0-1)

const rgb_to_hsl = (
  r: number,
  g: number,
  b: number,
): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6;
    } else {
      h = ((r - g) / delta + 4) / 6;
    }
  }

  return [h * 360, s, l];
};

const colors_match = (rgb1: number[], rgb2: number[]): boolean => {
  const [h1, s1, l1] = rgb_to_hsl(rgb1[0], rgb1[1], rgb1[2]);
  const [h2, s2, l2] = rgb_to_hsl(rgb2[0], rgb2[1], rgb2[2]);

  // Don't match if one color is very dark/light and the other isn't
  const very_dark_threshold = 0.15;
  const very_light_threshold = 0.85;
  const one_very_dark = l1 < very_dark_threshold !== l2 < very_dark_threshold;
  const one_very_light =
    l1 > very_light_threshold !== l2 > very_light_threshold;

  if (one_very_dark || one_very_light) {
    return false;
  }

  // Handle hue wraparound (359° and 1° are very close)
  let hue_diff = Math.abs(h1 - h2);
  if (hue_diff > 180) {
    hue_diff = 360 - hue_diff;
  }

  // If both colors are very desaturated (nearly gray), ignore hue
  const both_desaturated = s1 < 0.1 && s2 < 0.1;

  return (
    (hue_diff < HUE_THRESHOLD || both_desaturated) &&
    Math.abs(s1 - s2) < SATURATION_THRESHOLD &&
    Math.abs(l1 - l2) < LIGHTNESS_THRESHOLD
  );
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

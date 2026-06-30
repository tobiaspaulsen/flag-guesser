import { Image } from 'image-js';

const HUE_THRESHOLD = 30; // Maximum hue difference in degrees (0-360)
const SATURATION_THRESHOLD = 0.5; // Maximum saturation difference (0-1)
const LIGHTNESS_THRESHOLD = 0.5; // Maximum lightness difference (0-1)

const rgb_to_hsl = (r: number, g: number, b: number): [number, number, number] => {
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

// TODO: Orange matches red and green doesn't match green — hue thresholding
// issue where nearby hues on the color wheel bleed into adjacent ranges.
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
  const channels = image1.channels;
  const data1 = image1.data;
  const data2 = image2.data;
  const dataOut = result.data;

  let counter = 0;
  let actualMax = 0;

  for (let i = 0; i < data1.length; i += channels) {
    const r1 = data1[i], g1 = data1[i + 1], b1 = data1[i + 2];
    const r2 = data2[i], g2 = data2[i + 1], b2 = data2[i + 2];

    const nonTransparent = channels < 4 || data1[i + 3] > 0;
    const match = nonTransparent && colors_match([r1, g1, b1], [r2, g2, b2]);

    if (match) {
      dataOut[i] = r1;
      dataOut[i + 1] = g1;
      dataOut[i + 2] = b1;
      if (channels >= 4) dataOut[i + 3] = data1[i + 3];
      counter++;
    } else {
      dataOut[i] = 0;
      dataOut[i + 1] = 0;
      dataOut[i + 2] = 0;
      if (channels >= 4) dataOut[i + 3] = 0;
    }

    if (nonTransparent) actualMax++;
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

  // Clone image2 to avoid mutating the caller's image
  const resized = image2.resize({ width: image1.width, height: image1.height });
  const result = new Image({ width: image1.width, height: image1.height });
  const channels = image1.channels;
  const data1 = image1.data;
  const data2 = resized.data;
  const dataOut = result.data;

  for (let i = 0; i < data1.length; i += channels) {
    const hasP2 = channels < 4 || data2[i + 3] > 0;
    const src = hasP2 ? data2 : data1;
    dataOut[i] = src[i];
    dataOut[i + 1] = src[i + 1];
    dataOut[i + 2] = src[i + 2];
    if (channels >= 4) dataOut[i + 3] = src[i + 3];
  }

  return result;
};

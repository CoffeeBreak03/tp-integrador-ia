// Placeholder para lib/scale.ts
// Implementar según T2.5 en 2_FRONTEND_MOCK_DRIVEN.md

export const normalizedBoxToPixels = (
  box: [number, number, number, number],
  imageWidth: number,
  imageHeight: number
): [number, number, number, number] => {
  const [ymin, xmin, ymax, xmax] = box;
  return [
    (ymin / 1000) * imageHeight,
    (xmin / 1000) * imageWidth,
    (ymax / 1000) * imageHeight,
    (xmax / 1000) * imageWidth,
  ];
};

export const pixelsToNormalizedBox = (
  ymin: number,
  xmin: number,
  ymax: number,
  xmax: number,
  imageWidth: number,
  imageHeight: number
): [number, number, number, number] => {
  return [
    (ymin / imageHeight) * 1000,
    (xmin / imageWidth) * 1000,
    (ymax / imageHeight) * 1000,
    (xmax / imageWidth) * 1000,
  ];
};

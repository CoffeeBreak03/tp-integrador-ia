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

export const normalizedBoxToStyle = (box: [number, number, number, number]) => {
  const [ymin, xmin, ymax, xmax] = box;
  return {
    top: `${ymin / 10}%`,
    left: `${xmin / 10}%`,
    width: `${(xmax - xmin) / 10}%`,
    height: `${(ymax - ymin) / 10}%`,
  } as const;
};

export const isNormalizedBox = (box: unknown): box is [number, number, number, number] => {
  return (
    Array.isArray(box) &&
    box.length === 4 &&
    box.every(
      (value) => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1000
    )
  );
};

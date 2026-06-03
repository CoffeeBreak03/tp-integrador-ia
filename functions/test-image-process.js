const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { handler } = require('./dist/process.js');

(async () => {
  try {
    const imagePath = path.resolve(__dirname, '../frontend/src/mock/imagen manga.jpeg');
    const expectedPath = path.resolve(__dirname, '../frontend/src/mock/mock-data.json');
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = 'data:image/jpeg;base64,' + imageBuffer.toString('base64');
    const event = { httpMethod: 'POST', body: JSON.stringify({ imageBase64 }) };
    const response = await handler(event, {});
    console.log('STATUS', response.statusCode);
    console.log('BODY', response.body);
    const actual = JSON.parse(response.body);
    const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
    const util = require('util');

    const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();
    const sortBoxes = (items) => [...items].sort((a, b) => {
      if (a.box[1] !== b.box[1]) return b.box[1] - a.box[1];
      return a.box[0] - b.box[0];
    });
    const iou = (a, b) => {
      const y1 = Math.max(a.box[0], b.box[0]);
      const x1 = Math.max(a.box[1], b.box[1]);
      const y2 = Math.min(a.box[2], b.box[2]);
      const x2 = Math.min(a.box[3], b.box[3]);
      const interArea = Math.max(0, y2 - y1) * Math.max(0, x2 - x1);
      const areaA = (a.box[2] - a.box[0]) * (a.box[3] - a.box[1]);
      const areaB = (b.box[2] - b.box[0]) * (b.box[3] - b.box[1]);
      return areaA + areaB - interArea === 0 ? 0 : interArea / (areaA + areaB - interArea);
    };
    const boxDistance = (a, b) => {
      const dy1 = Math.abs(a.box[0] - b.box[0]);
      const dx1 = Math.abs(a.box[1] - b.box[1]);
      const dy2 = Math.abs(a.box[2] - b.box[2]);
      const dx2 = Math.abs(a.box[3] - b.box[3]);
      return dy1 + dx1 + dy2 + dx2;
    };

    const isEqual = JSON.stringify(actual) === JSON.stringify(expected);
    const sortedActual = sortBoxes(actual);
    const sortedExpected = sortBoxes(expected);
    const maxPairs = Math.min(sortedActual.length, sortedExpected.length);
    const distances = [];
    const ious = [];
    for (let i = 0; i < maxPairs; i += 1) {
      distances.push(boxDistance(sortedActual[i], sortedExpected[i]));
      ious.push(iou(sortedActual[i], sortedExpected[i]));
    }
    const avgDistance = distances.reduce((sum, v) => sum + v, 0) / (distances.length || 1);
    const avgIou = ious.reduce((sum, v) => sum + v, 0) / (ious.length || 1);

    console.log('EQUAL:', isEqual);
    console.log('BOX COUNT', { actual: actual.length, expected: expected.length });
    console.log('AVG BOX DISTANCE:', avgDistance.toFixed(2));
    console.log('AVG IOU:', avgIou.toFixed(3));

    if (!isEqual) {
      console.log('EXPECTED', util.inspect(expected, { depth: null, colors: false }));
      console.log('ACTUAL', util.inspect(actual, { depth: null, colors: false }));
      console.log('DISTANCES PER PAIR:', distances);
      console.log('IOU PER PAIR:', ious.map((v) => v.toFixed(3)));
    }
  } catch (error) {
    console.error('ERROR', error);
    process.exit(1);
  }
})();

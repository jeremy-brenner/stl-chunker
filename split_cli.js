const slice = require('./split');

const file = process.argv[2];
const outDir = process.argv[3];
const xSlices = process.argv[4];
const ySlices = process.argv[5];
const zSlices = process.argv[6];

slice(file,outDir,xSlices,ySlices,zSlices);
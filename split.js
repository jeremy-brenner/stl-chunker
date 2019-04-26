const fs = require('fs');
const stlDeSerializer = require('@jscad/stl-deserializer');
const stlSerializer = require('@jscad/stl-serializer');
const { CSG } = require('@jscad/csg');

const slice = (file,outDir,xSlices,ySlices,zSlices) => {

  if(!file || !file.match(/\.stl$/) ) {
    console.log("specify an input stl to slice");
    return;
  }

  console.log('Loading model...');

  const baseName = file.replace('.stl','').split('/').pop();

  const rawData = fs.readFileSync(file);
  const inputCsg = stlDeSerializer.deserialize(rawData, undefined, {output: 'csg'}).center([true,true,true]);

  const bounds = inputCsg.getBounds();

  const box = {
    x: bounds[1]._x - bounds[0]._x,
    y: bounds[1]._y - bounds[0]._y,
    z: bounds[1]._z - bounds[0]._z
  }

  const sliceThicknessX = box.x/xSlices;
  const sliceThicknessY = box.y/ySlices;
  const sliceThicknessZ = box.z/zSlices;

  const boundsObject = (x,y,z) => ({
    corner2: [bounds[0].x +  sliceThicknessX*x, bounds[0].y + sliceThicknessY*y, bounds[0].z + sliceThicknessZ*z ],
    corner1: [bounds[0].x + sliceThicknessX*x + sliceThicknessX, bounds[0].y + sliceThicknessY*y + sliceThicknessY, bounds[0].z + sliceThicknessZ*z + sliceThicknessZ]
  });

  const cubeSlice = (x,y,z) => CSG.cube(boundsObject(x,y,z)).intersect(inputCsg);

  console.log('Slicing...');
  
  const promises = coordArray(xSlices,ySlices,zSlices)
    .map( ({x,y,z}) => {
      const filename = `${outDir}/${baseName}-${x}-${y}-${z}.stl`;
      console.log(`Slicing ${filename}`);
      const stl = stlSerializer.serialize(cubeSlice(x,y,z), {binary: false});
      return saveFile(filename, stl);
    })
  
  return Promise.all(promises).then( () => console.log('Done!'));
}

function saveFile(filename, data) {
  console.log(`Saving ${filename}`);
  return new Promise( (resolve,reject) => {
    fs.writeFile( filename, data, (err) => err ? reject(err): resolve());
  })
  .then(() => console.log(`Saved ${filename}`))
  .catch((err) => console.error(`Problem saving ${filename}: ${err}`));
}

function coordArray(xCount,yCount,zCount) {
  let stuff = [];
  for( x=0; x<xCount; x++) {
    for( y=0; y<yCount; y++) {
      for( z=0; z<zCount; z++) {
        stuff.push({x,y,z});
      }
    }
  }
  return stuff;
}

module.exports = slice;
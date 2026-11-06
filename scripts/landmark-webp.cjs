'use strict';
function dimensions(buffer){
 if(buffer.length<30||buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WEBP')throw Error('Not a valid WebP header');
 const format=buffer.toString('ascii',12,16);
 if(format==='VP8X')return [1+buffer.readUIntLE(24,3),1+buffer.readUIntLE(27,3)];
 if(format==='VP8 '){
  if(buffer.toString('hex',23,26)!=='9d012a')throw Error('Invalid VP8 frame');
  return [buffer.readUInt16LE(26)&0x3fff,buffer.readUInt16LE(28)&0x3fff];
 }
 if(format==='VP8L'){
  if(buffer[20]!==0x2f)throw Error('Invalid VP8L signature');
  const bits=buffer.readUInt32LE(21);
  return [(bits&0x3fff)+1,((bits>>>14)&0x3fff)+1];
 }
 throw Error('Unsupported WebP format: '+format);
}
module.exports={dimensions};

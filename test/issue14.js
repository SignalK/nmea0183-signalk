var Parser = require('../').Parser;
var parser = new Parser({ selfType: 'uuid', selfId: 'ABCDEFGH' });

parser.write("!AIVDM,1,1,,B,13aENmgP1CPH`N`NJ2L0Mwwb2@Nj,0*00\n!AIVDM,1,1,,A,33aI:?@P00PHq;fNL0@P0?w`2311,0*14\n!AIVDM,1,1,,B,13aGra0P00PHid>NK9<2FOw`R61p,0*50\n!AIVDM,1,1,,B,34h`9r50000HnN>NKhjLeq1`0P00,0*6C");

console.log("SHOULD OUTPUT DATA OBJECTS");
parser.on('data', function(data) {
  console.log('data', data);
});
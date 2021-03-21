const fs = require('fs');

const brands = ["h2O", "glycerin", "cetyl", "ethylhexanoate"]

const writeStream = fs.createWriteStream('data.csv');

export const writeCSV = (items, filename) => {
  const writeStream = fs.createWriteStream(filename || 'dump.csv');
  const headers = Object.keys(items[0]);
  writeStream.write(headers.join(',') + '\n');
  items.forEach(item => {
    writeStream.write(Object.values(item).join(',')) + '\n';
  })
}
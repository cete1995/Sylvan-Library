const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/mtg-inventory').then(async () => {
  const Card = mongoose.model('Card', new mongoose.Schema({}, {strict: false}));
  
  const sets = await Card.aggregate([
    {
      $group: {
        _id: '$setCode',
        setName: { $first: '$setName' },
        hasImage: { $sum: { $cond: [{ $ne: ['$imageUrl', null] }, 1, 0] } },
        noImage: { $sum: { $cond: [{ $eq: ['$imageUrl', null] }, 1, 0] } },
        total: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  console.log('\nSets in database:\n');
  sets.forEach(s => {
    const jsonUploaded = s.hasImage > 0;
    const status = jsonUploaded ? '✓ JSON Uploaded' : '✗ Seller Only';
    console.log(`${s._id.padEnd(6)} (${s.setName})`);
    console.log(`  ${status} - ${s.hasImage} with images, ${s.noImage} without, total: ${s.total} cards\n`);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

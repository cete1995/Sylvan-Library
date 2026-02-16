const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/mtg-inventory').then(async () => {
  const Card = mongoose.model('Card', new mongoose.Schema({}, {strict: false}));
  
  // Get sets with their most recent upload date
  const sets = await Card.aggregate([
    {
      $match: { imageUrl: { $ne: null } }
    },
    {
      $group: {
        _id: '$setCode',
        setName: { $first: '$setName' },
        cardCount: { $sum: 1 },
        latestUpdate: { $max: '$updatedAt' },
        oldestUpdate: { $min: '$updatedAt' }
      }
    },
    { $sort: { latestUpdate: -1 } }
  ]);
  
  console.log('\nSets ordered by most recent upload/update:\n');
  sets.slice(0, 20).forEach(s => {
    const date = s.latestUpdate ? new Date(s.latestUpdate).toLocaleString() : 'Unknown';
    console.log(`${s._id.padEnd(6)} (${s.setName.padEnd(40)}) - ${s.cardCount.toString().padStart(4)} cards - Last updated: ${date}`);
  });
  
  console.log('\n\nDSK and FIN specifically:');
  const dskFin = sets.filter(s => ['DSK', 'FIN', 'PDSK', 'PFIN', 'DSC'].includes(s._id));
  dskFin.forEach(s => {
    const date = s.latestUpdate ? new Date(s.latestUpdate).toLocaleString() : 'Unknown';
    console.log(`${s._id.padEnd(6)} (${s.setName.padEnd(40)}) - ${s.cardCount.toString().padStart(4)} cards - Last updated: ${date}`);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

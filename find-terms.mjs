import fs from 'fs';

async function findTerms() {
  const res = await fetch('https://style-hub-brown.vercel.app/assets/index-BC7pucNm.js');
  const text = await res.text();

  ['Orders & Sales', 'Dashboard Overview', 'All Products', 'Back to Home', 'Attributes', 'Alerts & Notifications'].forEach(term => {
    const idx = text.indexOf(term);
    console.log(term, '=>', idx);
    if (idx !== -1) {
      const chunk = text.slice(Math.max(0, idx - 1000), Math.min(text.length, idx + 3000));
      fs.writeFileSync(`C:/Users/ARAFAT/.gemini/antigravity-ide/brain/dff3f10f-6371-4da4-a540-758ae6f8ca6e/scratch/term_${term.replace(/[^a-zA-Z]/g, '_')}.txt`, chunk);
    }
  });
}

findTerms().catch(console.error);

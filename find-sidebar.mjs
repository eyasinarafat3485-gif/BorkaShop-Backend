import fs from 'fs';

async function findSidebarCode() {
  const res = await fetch('https://style-hub-brown.vercel.app/assets/index-BC7pucNm.js');
  const text = await res.text();

  const idx = text.indexOf('MAIN MANAGEMENT');
  console.log('MAIN MANAGEMENT index:', idx);
  if (idx !== -1) {
    const chunk = text.slice(Math.max(0, idx - 1500), Math.min(text.length, idx + 6000));
    fs.writeFileSync('C:/Users/ARAFAT/.gemini/antigravity-ide/brain/dff3f10f-6371-4da4-a540-758ae6f8ca6e/scratch/sidebar_code.txt', chunk);
    console.log('Wrote sidebar code to scratch!');
  }
}

findSidebarCode().catch(console.error);

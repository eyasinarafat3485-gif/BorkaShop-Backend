import fs from 'fs';

async function printFullSidebar() {
  const res = await fetch('https://style-hub-brown.vercel.app/assets/index-BC7pucNm.js');
  const text = await res.text();

  const start = 516000;
  const end = 523500;
  const slice = text.slice(start, end);
  fs.writeFileSync('C:/Users/ARAFAT/.gemini/antigravity-ide/brain/dff3f10f-6371-4da4-a540-758ae6f8ca6e/scratch/exact_sidebar.txt', slice);
  console.log('Saved exact sidebar slice!');
}

printFullSidebar().catch(console.error);

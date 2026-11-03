import fs from 'fs';

async function getPArray() {
  const res = await fetch('https://style-hub-brown.vercel.app/assets/index-BC7pucNm.js');
  const text = await res.text();

  const idx = text.indexOf('Reviews');
  console.log('Reviews index:', idx);
  if (idx !== -1) {
    const chunk = text.slice(Math.max(0, idx - 500), Math.min(text.length, idx + 500));
    console.log('Reviews chunk:', chunk);
  }
}

getPArray().catch(console.error);

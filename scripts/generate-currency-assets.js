/* Build-time generator only. Output files are SVG and JSON; never embed media in runtime JS.
   These are educational illustrations, NOT photographic reproductions of legal tender. */
function makeCurrencyAsset(code, value, label, countryName, kind = 'coin') {
  const xml = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const palettes = {
    us:['#dce5f1','#7d94b0','#3c5e85'],uk:['#f9e2a7','#bf8f55','#795331'],
    ca:['#fae1ca','#c99369','#9d5e41'],au:['#fbe0ae','#c4a06b','#8d6b45'],
    nz:['#e4edf2','#9ab2c2','#5f8298'],in:['#f5d1c4','#c98778','#8d4e56'],
    ie:['#d3e8d6','#8eaf96','#4f7c69']
  };
  const p=palettes[code]||palettes.us;
  const name=xml(countryName);
  const val=xml(label);
  const n=String(value);
  if(kind === 'note') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 188" role="img" aria-labelledby="t"><title id="t">Illustrated ${name} ${val} banknote</title>
      <defs><linearGradient id="paper"><stop stop-color="${p[0]}"/><stop offset=".57" stop-color="#fdfef5"/><stop offset="1" stop-color="${p[1]}"/></linearGradient></defs>
      <rect x="8" y="8" width="344" height="172" rx="18" fill="${p[2]}" opacity=".2"/>
      <rect x="6" y="6" width="344" height="170" rx="17" fill="url(#paper)" stroke="${p[2]}" stroke-width="4"/>
      <rect x="21" y="20" width="314" height="140" rx="9" fill="none" stroke="${p[2]}" stroke-dasharray="4 5" stroke-width="2" opacity=".6"/>
      <circle cx="263" cy="89" r="52" fill="${p[0]}" stroke="${p[2]}" stroke-width="4" opacity=".65"/>
      <path d="M229 109Q264 34 299 109Q264 85 229 109Z" fill="${p[2]}" opacity=".32"/>
      <text x="35" y="60" font-family="system-ui,sans-serif" font-size="17" font-weight="800" fill="${p[2]}">${name.toUpperCase()}</text>
      <text x="35" y="123" font-family="system-ui,sans-serif" font-size="52" font-weight="900" fill="${p[2]}">${val}</text>
      <text x="180" y="156" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="${p[2]}">LEARNING ILLUSTRATION · NOT LEGAL TENDER</text>
    </svg>`;
  }
  const sided = code === 'uk' && [20,50].includes(value);
  const shape = sided ? '<polygon points="'+Array.from({length:7},(_,i)=>{const a=Math.PI*2*i/7-Math.PI/2;return (120+101*Math.cos(a)).toFixed(1)+','+(120+101*Math.sin(a)).toFixed(1)}).join(' ')+'" fill="url(#metal)" stroke="'+p[2]+'" stroke-width="4"/>' :
    '<circle cx="120" cy="120" r="103" fill="url(#metal)" stroke="'+p[2]+'" stroke-width="5"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-labelledby="t"><title id="t">Illustrated ${name} ${val} coin</title>
    <defs><radialGradient id="metal" cx=".35" cy=".25" r=".85"><stop stop-color="#fffdf3"/><stop offset=".24" stop-color="${p[0]}"/><stop offset=".72" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/></radialGradient><filter id="s"><feGaussianBlur stdDeviation="4"/></filter></defs>
    <ellipse cx="121" cy="223" rx="91" ry="10" fill="#304050" opacity=".15" filter="url(#s)"/>
    ${shape}
    <circle cx="120" cy="120" r="88" fill="none" stroke="#fff" opacity=".55" stroke-width="3" stroke-dasharray="2 5"/>
    <circle cx="120" cy="120" r="81" fill="none" stroke="${p[2]}" stroke-width="2" opacity=".44"/>
    <path d="M56 88Q119 29 186 85" stroke="#fff" stroke-width="8" fill="none" opacity=".25" stroke-linecap="round"/>
    <path d="M64 175Q120 206 176 175" stroke="${p[2]}" stroke-width="5" fill="none" opacity=".24" stroke-linecap="round"/>
    <text x="120" y="122" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="${val.length>3?'46':'61'}" fill="${p[2]}">${val}</text>
    <text x="120" y="150" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="13" fill="${p[2]}">${name.toUpperCase()}</text>
    <text x="120" y="172" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="600" font-size="10" fill="${p[2]}">COIN · LEARNING ART</text>
  </svg>`;
}

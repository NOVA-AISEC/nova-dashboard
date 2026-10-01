import { writeFile } from 'node:fs/promises'
const person = (x, y, color = '#919d98') =>
  `<g transform="translate(${x} ${y})"><circle cy="-14" r="8" fill="${color}"/><path d="M-10 0Q0-8 10 0L13 27H-13Z" fill="${color}"/><path d="M-7 25V45M7 25V45" stroke="${color}" stroke-width="7" stroke-linecap="round"/></g>`
const vehicle = (x, y, color) =>
  `<g transform="translate(${x} ${y})"><rect width="185" height="87" rx="23" fill="${color}" stroke="#ccd3cf" stroke-width="2"/><rect x="42" y="9" width="85" height="68" rx="8" fill="#45625b"/><path d="M89 12V72" stroke="#7b8b84" stroke-width="2"/><rect x="6" y="19" width="12" height="49" rx="4" fill="#eff0d9"/><rect x="168" y="19" width="7" height="49" rx="3" fill="#c27062"/></g>`
const road = `<path d="M0 270H960" stroke="#47544f" stroke-width="260"/><path d="M0 269H960" stroke="#b8b9a4" stroke-width="3" stroke-dasharray="32 20"/><path d="M0 138H960M0 397H960" stroke="#bdc8bd" stroke-width="3"/>`
const lobby = `<rect x="85" y="115" width="730" height="305" fill="#60716a" stroke="#a4b0a6" stroke-width="4"/><path d="M325 115V420M580 115V420M85 265H815" stroke="#73847a" stroke-width="2"/><rect x="92" y="112" width="220" height="100" rx="4" fill="#394e46"/><rect x="99" y="119" width="204" height="84" fill="#77938a"/><path d="M200 118V204" stroke="#bac6bc" stroke-width="3"/><rect x="650" y="155" width="100" height="190" rx="9" fill="#a5aa90"/>`
const scenes = [
  {
    file: 'demo-gate.svg',
    camera: 'STR-MG-01',
    zone: 'MAIN GATE',
    time: '09:12:00',
    box: [269, 200, 375, 122],
    subject: 'VEHICLE',
    scene:
      road +
      vehicle(285, 214, '#acb5b4') +
      '<path d="M708 164V387" stroke="#d8c39b" stroke-width="13" stroke-dasharray="32 19"/>' +
      person(759, 209) +
      '<path d="M204 370l12-29 12 29Z" fill="#de9157"/>',
  },
  {
    file: 'demo-library.svg',
    camera: 'STR-LIB-02',
    zone: 'LIBRARY ENTRANCE',
    time: '10:05:00',
    box: [393, 240, 114, 132],
    subject: 'UNATTENDED ITEM',
    scene:
      lobby +
      '<rect x="415" y="271" width="65" height="74" rx="12" fill="#bc986b"/><path d="M428 273V257Q449 240 467 257V273" fill="none" stroke="#cfb491" stroke-width="5"/><path d="M426 311H469" stroke="#846848" stroke-width="3"/>' +
      person(590, 265),
  },
  {
    file: 'demo-residence.svg',
    camera: 'STR-RB-03',
    zone: 'RESIDENCE LOBBY',
    time: '08:44:00',
    box: [199, 154, 324, 205],
    subject: 'ACCESS EXCEPTION',
    scene:
      lobby +
      person(252, 217) +
      person(365, 249, '#b3b09a') +
      person(469, 272, '#b39479') +
      '<path d="M195 366H530" stroke="#d5b886" stroke-width="3" stroke-dasharray="12 8"/>',
  },
  {
    file: 'demo-parking.svg',
    camera: 'STR-PK-04',
    zone: 'PARKING A EAST',
    time: '11:10:00',
    box: [225, 204, 415, 149],
    subject: 'EXIT OBSTRUCTION',
    scene:
      road +
      vehicle(295, 220, '#6d8796') +
      vehicle(19, 228, '#96a88e') +
      '<path d="M732 143V405" stroke="#bba478" stroke-width="16"/>' +
      person(690, 326),
  },
  {
    file: 'demo-perimeter.svg',
    camera: 'STR-PER-05',
    zone: 'NORTH PERIMETER',
    time: '07:16:00',
    box: [475, 179, 123, 212],
    subject: 'FENCE-LINE MOVEMENT',
    scene:
      '<path d="M0 383L960 206" stroke="#465c50" stroke-width="134"/><path d="M0 236L960 77" stroke="#7d9182" stroke-width="6"/>' +
      Array.from(
        { length: 17 },
        (_, i) => `<path d="M${i * 60} ${236 - i * 10}l10-66" stroke="#98aa9a" stroke-width="3"/>`,
      ).join('') +
      person(534, 260, '#c4b287') +
      '<circle cx="534" cy="280" r="80" fill="#edb35c" opacity=".05"/>',
  },
  {
    file: 'demo-cafeteria.svg',
    camera: 'STR-CAF-02',
    zone: 'CAFETERIA WALKWAY',
    time: '14:42:00',
    box: [198, 183, 525, 228],
    subject: 'CROWD PRESSURE',
    scene:
      lobby +
      Array.from({ length: 13 }, (_, i) =>
        person(231 + (i % 5) * 95, 210 + Math.floor(i / 5) * 66, i % 2 ? '#b0ab91' : '#8da295'),
      ).join(''),
  },
  {
    file: 'demo-property.svg',
    camera: 'STR-LB-07',
    zone: 'LECTURE BLOCK DESK',
    time: '12:18:00',
    box: [387, 250, 183, 112],
    subject: 'LOST PROPERTY',
    scene:
      lobby +
      '<rect x="275" y="231" width="360" height="136" rx="12" fill="#a6a390" stroke="#bdc0ac" stroke-width="2"/><rect x="417" y="279" width="118" height="56" rx="5" fill="#324843" stroke="#ccd3c5" stroke-width="3"/><rect x="428" y="286" width="96" height="40" fill="#738f85"/>' +
      person(717, 365),
  },
]
for (const item of scenes) {
  const [x, y, w, h] = item.box
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#597066" opacity=".25"/></pattern></defs><rect width="960" height="540" fill="#31463d"/><rect width="960" height="540" fill="url(#grid)"/>${item.scene}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#e9b878" stroke-width="2" stroke-dasharray="9 5"/><rect x="${x}" y="${y - 24}" width="${item.subject.length * 8 + 20}" height="24" rx="3" fill="#e9b878"/><text x="${x + 9}" y="${y - 8}" font-family="monospace" font-size="12" fill="#29362f">${item.subject}</text><rect width="960" height="65" fill="#17231e" opacity=".88"/><circle cx="31" cy="31" r="5" fill="#e7b47b"/><text x="48" y="38" fill="#e6ede4" font-family="monospace" font-size="16">${item.camera} / ${item.zone}</text><text x="747" y="38" fill="#a6b6aa" font-family="monospace" font-size="13">28 FEB 2026 ${item.time}</text><rect y="478" width="960" height="62" fill="#17231e" opacity=".9"/><text x="28" y="515" fill="#e7b47b" font-family="monospace" font-size="15">ILLUSTRATIVE SAMPLE</text><text x="580" y="515" fill="#9fac9f" font-family="monospace" font-size="13">NOVA / NO LIVE CAMERA CONNECTION</text></svg>`
  await writeFile(new URL(`../public/evidence/${item.file}`, import.meta.url), svg)
}
console.log('Created seven labeled illustrative sample scenes.')

import { linesRaw as linesRawHots } from './linesRawHots.js';
import { linesRaw as linesRawLol } from './linesRaw.js';
import { isHots } from './isHots.js';

const linesRaw = isHots ? linesRawHots : linesRawLol;

// Filter out miscategorized lines (e.g. yasuo in ahri's folder)
export const lines = linesRaw.filter(line => {
  if (isHots) {
    return true;
  }
  if (line.includes('BasicAttack')) {
    return false;
  }
  let champ = getChampion(line);
  let fileName = line.split('/').at(-1);
  return fileName.startsWith(champ);
});

export const champions = getChampions();

export function getChampion(line) {
  const name = line.split('/')[1];
  return name;
}

function getChampions() {
  const champsPresent = {};
  for (const line of lines) {
    champsPresent[getChampion(line)] = true;
  }
  return Object.keys(champsPresent);
}

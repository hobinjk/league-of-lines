import './style.css';

import {linesRaw} from './lines.js';
// Filter out miscategorized lines (e.g. yasuo in ahri's folder)
const lines = linesRaw.filter(line => {
  let champ = getChampion(line);
  let fileName = line.split('/').at(-1);
  return fileName.startsWith(champ);
});

const champions = getChampions();

function getChampion(line) {
  const name = line.split('/')[2];
  return name;
}
function getChampions() {
  const champsPresent = {};
  for (const line of lines) {
    champsPresent[getChampion(line)] = true;
  }
  return Object.keys(champsPresent);
}

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

let minAudioDuration = 2;
let audio;
function play(src) {
  audio = document.createElement('audio');
  audio.controls = true;
  audio.addEventListener('canplay', function() {
    if (audio.duration < minAudioDuration) {
      game();
      return;
    }
    audio.play();
  });
  audio.src = src;
}

function waitForAudioStop() {
  return new Promise(resolve => {
    function checkPlaying() {
      if (!audio.ended) {
        setTimeout(checkPlaying, 100);
        return;
      }
      resolve();
    }
    checkPlaying();
  });
}

let correctChampion = null;

async function onChoice(elt, champion) {
  if (champion === correctChampion) {
    elt.classList.add('correct');
    delete champElements[champion];
    await waitForAudioStop();
    if (Object.keys(champElements).length > 0) {
      setTimeout(() => {
        game();
      }, 500);
    } else {
      setTimeout(() => {
        reset();
        game();
      }, 2000);
    }
  } else {
    elt.classList.add('wrong');
    if (audio) {
      audio.play();
    }
  }
}

function flipChampCard(elt, delayMs) {
  elt.classList.add('undealt');
  let first = elt.getBoundingClientRect();
  elt.classList.remove('undealt');
  let last = elt.getBoundingClientRect();
  let dx = first.left - last.left;
  let dy = first.top - last.top;
  let cardSpeed = 3;
  let moveDuration = Math.sqrt(dx * dx + dy * dy) / cardSpeed;
  let totalDuration = moveDuration + delayMs;

  elt.animate([{
    transform: `translate(${dx}px, ${dy}px)`,
  }, {
    transform: `translate(${dx}px, ${dy}px)`,
    offset: delayMs / totalDuration,
  }, {
    transform: `none`
  }], {
    duration: totalDuration,
    easing: 'ease-in-out',
    fill: 'both',
  });
  // elt.animate([{
  //   top: `${dy}px`
  // }, {
  //   top: `${dy}px`,
  //   offset: delayMs / totalDuration,
  // }, {
  //   top: `0px`
  // }], {
  //   duration: totalDuration,
  //   easing: 'ease-in-out',
  //   fill: 'both',
  // });
}

function createElements(champsPresent) {
  let container = document.createElement('div');
  container.classList.add('cards');
  document.body.appendChild(container);

  let delay = 0;
  for (const champion of Object.keys(champsPresent)) {
    let elt = document.createElement('div');
    elt.classList.add('champion-container');
    elt.style.backgroundImage = `url("/images/${champion.replace(/_/g, '+')}/${champion}_OriginalLoading.jpg")`;
    // elt.textContent = champion;
    elt.addEventListener('click', function() {
      onChoice(elt, champion);
    });
    container.appendChild(elt);
    champElements[champion] = elt;
  }
  for (const champion of Object.keys(champsPresent)) {
    let elt = champElements[champion];
    flipChampCard(elt, delay);
    delay += 50;
  }


  return delay;
}

function reset() {
  let cards = document.body.querySelector('.cards');
  cards.parentNode.removeChild(cards);
  champElements = null;
  dealButton.classList.remove('dealing', 'dealt');
}

let champElements = null;
let dealButton;

function onLoad() {
  dealButton = document.createElement('div');
  dealButton.classList.add('deck');
  dealButton.addEventListener('click', function() {
    deal();
  });
  document.body.appendChild(dealButton);
}

function deal() {
  if (champElements) {
    reset();
  }

  champElements = {};
  let champsPresent = {};
  let remainingChampChoices = 24;
  while (remainingChampChoices > 0) {
    let choice = random(champions);
    if (champsPresent[choice]) {
      continue;
    }
    champsPresent[choice] = true;
    remainingChampChoices -= 1;
  }

  let dealDurationMs = createElements(champsPresent);
  dealButton.classList.add('dealing');

  setTimeout(() => {
    dealButton.classList.add('dealt');
    game();
  }, dealDurationMs);
}


function game() {
  choose(champElements);
}

function choose(champElements) {
  Array.from(document.body.querySelectorAll('.wrong')).forEach(e => {
    e.classList.remove('wrong');
  });

  let line = null;
  while (!line || line.includes('SFX') || !champElements[getChampion(line)]) {
    line = random(lines);
  }
  correctChampion = getChampion(line);
  play(line);
}

onLoad();

import './style.css';

import {linesRaw} from './lines.js';
// Filter out miscategorized lines (e.g. yasuo in ahri's folder)
const lines = linesRaw.filter(line => {
  let champ = getChampion(line);
  let fileName = line.split('/').at(-1);
  return fileName.startsWith(champ);
});
function sleep(ms) {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
}

let wrongSfx = document.createElement('audio');
wrongSfx.src = 'sfx/Enemy_Missing_ping_SFX.ogg';

let correctSfx = document.createElement('audio');
correctSfx.src = 'sfx/Wallet Close.wav';
correctSfx.volume = 0.7;

const champions = getChampions();

function getChampion(line) {
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

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

let minAudioDuration = 2;
let audio;
function play(src) {
  audio = document.createElement('audio');
  audio.controls = true;
  audio.addEventListener('canplay', function onCanPlay() {
    if (audio.duration < minAudioDuration) {
      game();
      return;
    }
    audio.play();
    correctChampion = getChampion(src);
    audioStartTime = Date.now();
    audio.removeEventListener('canplay', onCanPlay);
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
let scoreElt = null;

let audioStartTime = 0;

async function onChoice(elt, champion) {
  if (champion === correctChampion) {
    correctSfx.play();
    elt.classList.add('correct');
    let timeFormatted = ((Date.now() - audioStartTime) / 1000).toFixed(2);
    champElements[champion].textContent = timeFormatted;
    delete champElements[champion];
    await waitForAudioStop();
    if (Object.keys(champElements).length > 0) {
      setTimeout(() => {
        game();
      }, 500);
    } else {
      setTimeout(() => {
        let total = Array.from(document.querySelectorAll('.champion-container')).reduce((total, elt) => {
          return total + parseFloat(elt.textContent);
        }, 0);
        scoreElt.classList.add('showing-total');
        scoreElt.textContent = `Score: ${total.toFixed(2)}s`;
        resetDealButton();
      }, 2000);
    }
  } else {
    elt.classList.add('wrong');
    if (audio) {
      wrongSfx.play();
      setTimeout(() => {
        audio.play();
      }, 500);
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
  let cardSpeed = 2;
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

  let delay = Object.keys(champsPresent).length * 80 + 100;
  let originalDelay = delay;
  let i = 0;
  for (const champion of Object.keys(champsPresent)) {
    let elt = document.createElement('div');
    elt.classList.add('champion-container');
    elt.style.backgroundImage = `url("images/${champion.replace(/_/g, '+')}/${champion}_OriginalLoading.jpg")`;
    // elt.textContent = champion;
    elt.addEventListener('click', function() {
      onChoice(elt, champion);
    });
    elt.addEventListener('touchstart', function() {
      onChoice(elt, champion);
    });
    container.appendChild(elt);
    champElements[champion] = elt;
    if (i === 11) {
      scoreElt = document.createElement('div');
      scoreElt.classList.add('score');
      scoreElt.textContent = '';
      container.appendChild(scoreElt);
    }
    i += 1;
  }
  for (const champion of Object.keys(champsPresent)) {
    let elt = champElements[champion];
    flipChampCard(elt, delay);
    delay -= 80;
  }


  return originalDelay;
}

function resetDealButton() {
  dealButton.parentNode.removeChild(dealButton);
  onLoad();
}

function resetBoard() {
  let cards = document.body.querySelector('.cards');
  cards.parentNode.removeChild(cards);
  scoreElt.parentNode.removeChild(scoreElt);
  champElements = null;
}

let champElements = null;
let dealButton;

function onLoad() {
  dealButton = document.createElement('div');
  dealButton.classList.add('deck', 'button');
  dealButton.textContent = 'Play';
  function onDealClick() {
    if (scoreElt) {
      scoreElt.classList.remove('showing-total');
      scoreElt.textContent = '';
    }

    function onTransitionEnd() {
      dealButton.textContent = '';
      deal();
      dealButton.removeEventListener('transitionend', onTransitionEnd);
    }
    dealButton.classList.remove('button');
    dealButton.addEventListener('transitionend', onTransitionEnd);
    dealButton.removeEventListener('click', onDealClick);
    dealButton.removeEventListener('touchstart', onDealClick);
  }
  dealButton.addEventListener('click', onDealClick);
  dealButton.addEventListener('touchstart', onDealClick);
  document.body.appendChild(dealButton);
}

function deal() {
  if (champElements) {
    resetBoard();
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

  setTimeout(async () => {
    dealButton.classList.add('dealt');
    for (let i = 10; i > 0; i--) {
      scoreElt.textContent = i;
      await sleep(1000);
    }
    scoreElt.textContent = '';
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
  while (!line || line.includes('SFX') ||
      line.includes('Death') || !champElements[getChampion(line)]) {
    line = random(lines);
  }
  play(line);
}

onLoad();

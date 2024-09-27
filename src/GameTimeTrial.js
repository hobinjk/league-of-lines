import './style.css';

import { wrongSfx, correctSfx, audio, waitForAudioStop } from './Audio.js';

import { lines, champions, getChampion } from './lines.js';

import { Board } from './Board.js';

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const minAudioDuration = 2;

export class GameTimeTrial {
  constructor() {
    this.board = new Board(audio);

    this.correctChampion = null;
    this.audioStartTime = 0;

    this.game = this.game.bind(this);
    this.play = this.play.bind(this);
    this.onLoad = this.onLoad.bind(this);
    this.onChoice = this.onChoice.bind(this);
  }

  play(src) {
    const onCanPlay = () => {
      let audioChampion = getChampion(src);
      if (audio.duration < minAudioDuration && audioChampion !== 'Rammus') {
        this.game();
        return;
      }
      audio.play();
      this.correctChampion = audioChampion;
      this.audioStartTime = Date.now();
      audio.removeEventListener('canplay', onCanPlay);
    };

    audio.innerHTML = '';
    audio.addEventListener('canplay', onCanPlay);
    let srcNormal = {
      src: `https://hobinjk.github.io/lines-of-league/${src}`,
      type: 'audio/ogg',
    };
    let srcBad = {
      src: `https://hobinjk.github.io/lines-of-league/${src}.mp3`,
      type: 'audio/mpeg',
    };
    for (let src of [srcNormal, srcBad]) {
      let source = document.createElement('source');
      source.src = src.src;
      source.type = src.type;
      audio.appendChild(source);
    }
    audio.load();
  }

  async onChoice(elt, champion) {
    if (elt.classList.contains('correct')) {
      return;
    }
    if (!this.correctChampion) {
      return;
    }
    if (champion === this.correctChampion) {
      correctSfx.play();
      elt.classList.add('correct');
      let timeFormatted = ((Date.now() - this.audioStartTime) / 1000).toFixed(2);
      this.board.champElements[champion].textContent = timeFormatted;
      delete this.board.champElements[champion];
      await waitForAudioStop();
      if (Object.keys(this.board.champElements).length > 0) {
        setTimeout(() => {
          this.game();
        }, 500);
      } else {
        setTimeout(() => {
          let total = Array.from(document.querySelectorAll('.champion-container')).reduce((total, elt) => {
            return total + parseFloat(elt.textContent);
          }, 0);
          this.board.scoreElt.classList.add('showing-total');
          this.board.scoreElt.textContent = `Score: ${total.toFixed(2)}s`;
          this.board.resetDealButton();
        }, 2000);
      }
    } else {
      elt.classList.add('wrong');
      this.audioStartTime -= 5000;
      this.board.scoreElt.textContent = '+5';
      setTimeout(() => {
        if (this.board.scoreElt.textContent === '+5') {
          this.board.scoreElt.textContent = '';
        }
      }, 1000);
      if (audio) {
        wrongSfx.play();
        setTimeout(() => {
          audio.play();
        }, 500);
      }
    }
  }

  onLoad() {
    this.board.champsPresent = {};
    let remainingChampChoices = 24;
    while (remainingChampChoices > 0) {
      let choice = random(champions);
      if (this.board.champsPresent[choice]) {
        continue;
      }
      this.board.champsPresent[choice] = true;
      remainingChampChoices -= 1;
    }
    this.board.createDealButton();
    this.board.onDealt = () => {
      this.board.deal(this.game, this.onChoice);
    };
  }

  game() {
    this.choose(this.board.champElements);
  }

  choose(champElements) {
    this.board.resetWrong();

    let line = null;
    while (!line || line.includes('SFX') ||
      line.includes('Death') || !champElements[getChampion(line)]) {
      line = random(lines);
    }
    this.play(line);
  }
}

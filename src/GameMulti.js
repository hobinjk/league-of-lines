import './style.css';

import { wrongSfx, correctSfx, audio, waitForAudioStop, setAudioSrc } from './Audio.js';

import { lines, champions, getChampion } from './lines.js';

import { Board } from './Board.js';
import { Comms } from './Comms.js';

const minAudioDuration = 2;

export class GameMulti {
  constructor() {
    this.board = new Board(audio);

    this.correctChampion = null;
    this.audioStartTime = 0;

    this.comms = new Comms(this);

    this.getNextLine = this.getNextLine.bind(this);
    this.play = this.play.bind(this);
    this.onChoice = this.onChoice.bind(this);
    this.onClickReady = this.onClickReady.bind(this);
    this.onStart = this.onStart.bind(this);

    this.createReadyComponent();
  }

  createReadyComponent() {
    this.nameInput = document.createElement('input');
    this.nameInput.placeholder = 'Username';
    this.nameInput.classList.add('name-input');
    document.body.appendChild(this.nameInput);

    this.readyButton = document.createElement('div');
    this.readyButton.classList.add('ready-button');
    this.readyButton.textContent = 'Ready';
    this.readyButton.addEventListener('click', this.onClickReady);
    this.readyButton.addEventListener('touchstart', this.onClickReady);
    document.body.appendChild(this.readyButton);
  }

  onClickReady() {
    let name = this.nameInput.value.replace(/[^a-zA-Z0-9]/g, '') || ('Player' + Math.floor(Math.random() * 1000));

    this.nameInput.parentNode.removeChild(this.nameInput);
    this.readyButton.parentNode.removeChild(this.readyButton);

    this.comms.id = name;
    this.comms.joinRoom('ffa');

    this.board.createDealButton();
    this.board.onDealt = () => {
      this.comms.start();
    };
  }

  play(src) {
    const onCanPlay = () => {
      let audioChampion = getChampion(src);
      if (audio.duration < minAudioDuration && audioChampion !== 'Rammus') {
        this.getRandomLine();
        return;
      }
      this.correctChampion = audioChampion;
      audio.removeEventListener('canplay', onCanPlay);
    };

    setAudioSrc(src);
    audio.addEventListener('canplay', onCanPlay);
  }

  async onChoice(elt, champion) {
    if (elt.classList.contains('correct')) {
      return;
    }
    if (!this.correctChampion) {
      return;
    }
    if (champion === this.correctChampion) {
      this.comms.correct(champion);
      correctSfx.play();

      let timeFormatted = ((Date.now() - this.audioStartTime) / 1000).toFixed(2);
      this.board.champElements[champion].textContent = timeFormatted;

      this.board.markCorrect(champion, true);
    } else {
      this.comms.wrong(champion);
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

  startGame() {
    this.board.champsPresent = {};
    let remainingChampChoices = 24;
    while (remainingChampChoices > 0) {
      let choice = this.comms.random(champions);
      if (this.board.champsPresent[choice]) {
        continue;
      }
      this.board.champsPresent[choice] = true;
      remainingChampChoices -= 1;
    }

    this.board.deal(this.onStart, this.onChoice);

    let line = null;
    while (!line || line.includes('SFX') ||
        line.includes('Death') || !this.board.champElements[getChampion(line)]) {
      line = this.comms.random(lines);
    }
    this.play(line);
  }

  onStart() {
    this.board.resetWrong();

    audio.play();
    this.audioStartTime = Date.now();
  }

  getRandomLine() {
    let line = null;
    while (!line || line.includes('SFX') ||
        line.includes('Death') || !this.board.champElements[getChampion(line)]) {
      line = this.comms.random(lines);
    }
    this.play(line);
  }

  getNextLine() {
    this.board.resetWrong();

    this.getRandomLine();

    (async () => {
      await this.board.countdown(5);
      audio.play();
      this.audioStartTime = Date.now();
    })();
  }
}

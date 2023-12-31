import './style.css';

import { wrongSfx, correctSfx, audio, setAudioSrc, safariWorkAround } from './Audio.js';

import { lines, champions, getChampion } from './lines.js';

import { Board } from './Board.js';
import { Comms } from './Comms.js';

const minAudioDuration = 2;

export class GameMulti {
  constructor() {

    this.correctChampion = null;
    this.audioStartTime = 0;

    this.comms = new Comms(this);
    this.board = new Board(this.comms);

    this.getNextLine = this.getNextLine.bind(this);
    this.play = this.play.bind(this);
    this.onChoice = this.onChoice.bind(this);
    this.onClickReady = this.onClickReady.bind(this);
    this.onStart = this.onStart.bind(this);

    this.createReadyComponent();

    this.scoresElt = document.createElement('div');
    this.scoresElt.classList.add('scores');
    document.body.appendChild(this.scoresElt);
    this.scoreElts = {};
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
    safariWorkAround();

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

    this.comms.zeroScores();
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

  gameOver() {
    let winners = {
      ids: [],
      score: 0,
    };

    for (let id in this.comms.scores) {
      let score = this.comms.scores[id];
      if (score > winners.score) {
        winners.ids = [id];
        winners.score = score;
      } else if (score === winners.score) {
        winners.ids.push(id);
      }
    }

    let message = '';
    if (winners.ids.length > 1) {
      message = `Tie: ${winners.ids.join(', ')} win!`;
    } else {
      message = `${winners.ids[0]} wins!`;
    }

    this.board.gameOver(message);
  }

  getNextLine() {
    this.board.resetWrong();
    if (Object.keys(this.board.champElements).length === 0) {
      this.gameOver();
      return;
    }

    this.getRandomLine();

    (async () => {
      await this.board.countdown(5);
      audio.play();
      this.audioStartTime = Date.now();
    })();
  }

  updateScores() {
    for (const id in this.comms.scores) {
      if (!this.scoreElts[id]) {
        let newElt = document.createElement('div');
        newElt.classList.add('score-multi');
        newElt.style.color = this.comms.getIdColor(id);
        newElt.textContent = id + ': ';
        let newScoreElt = document.createElement('span');
        newElt.appendChild(newScoreElt);
        this.scoresElt.appendChild(newElt);
        this.scoreElts[id] = newScoreElt;
      }
      this.scoreElts[id].textContent = this.comms.scores[id];
    }
  }
}

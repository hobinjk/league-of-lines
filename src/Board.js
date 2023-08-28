import { sleep } from './utilities.js';

import { safariWorkAround } from './Audio.js';

export class Board {
  constructor(comms) {
    this.comms = comms;

    this.dealButton = null;
    this.scoreElt = null;
    this.cursors = {};
    this.lastMouseMove = Date.now();

    this.onDealClick = this.onDealClick.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.update = this.update.bind(this);
  }

  createDealButton() {
    this.dealButton = document.createElement('div');
    this.dealButton.classList.add('deck', 'button');
    this.dealButton.textContent = 'Play';
    this.dealButton.addEventListener('click', this.onDealClick);
    this.dealButton.addEventListener('touchstart', this.onDealClick);
    document.body.appendChild(this.dealButton);
  }

  resetDealButton() {
    this.dealButton.parentNode.removeChild(this.dealButton);
    this.createDealButton();
  }

  reset() {
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.parentNode.removeChild(this.container);
    this.scoreElt.parentNode.removeChild(this.scoreElt);
    this.champElements = null;
  }

  preloadChampImages(champsPresent) {
    for (const champion of Object.keys(champsPresent)) {
      const img = document.createElement('img');
      img.src = `images/${champion.replace(/_/g, '+')}/${champion}_OriginalLoading.jpg`;
    }
  }

  gameOver(result) {
    this.scoreElt.classList.add('showing-total');
    this.scoreElt.textContent = result;
    this.resetDealButton();
  }

  onDealClick() {
    safariWorkAround();

    if (this.scoreElt) {
      this.scoreElt.classList.remove('showing-total');
      this.scoreElt.textContent = '';
    }

    const onTransitionEnd = () => {
      this.dealButton.textContent = '';
      this.onDealt();
      this.dealButton.removeEventListener('transitionend', onTransitionEnd);
    }
    this.dealButton.classList.remove('button');
    this.dealButton.addEventListener('transitionend', onTransitionEnd);
    this.dealButton.removeEventListener('click', this.onDealClick);
    this.dealButton.removeEventListener('touchstart', this.onDealClick);
  }

  flipChampCard(elt, delayMs) {
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
  }

  createElements(onChoice) {
    this.container = document.createElement('div');
    this.container.classList.add('cards');
    document.body.appendChild(this.container);

    this.container.addEventListener('mousemove', this.onMouseMove);

    let delay = Object.keys(this.champsPresent).length * 80 + 100;
    let originalDelay = delay;
    let i = 0;
    for (const champion of Object.keys(this.champsPresent)) {
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
      this.container.appendChild(elt);
      this.champElements[champion] = elt;
      if (i === 11) {
        this.scoreElt = document.createElement('div');
        this.scoreElt.classList.add('score');
        this.scoreElt.textContent = '';
        this.container.appendChild(this.scoreElt);
      }
      i += 1;
    }
    for (const champion of Object.keys(this.champsPresent)) {
      let elt = this.champElements[champion];
      this.flipChampCard(elt, delay);
      delay -= 80;
    }

    if (this.updateRequest) {
      cancelAnimationFrame(this.updateRequest);
    }
    this.update();

    return originalDelay;
  }

  markWrong(champion) {
    console.log('wrong!', champion);
    this.champElements[champion].classList.add('wrongOther');
  }

  markCorrect(champion, isOurs) {
    console.log('not wrong!', champion);
    this.champElements[champion].classList.add(
      isOurs ? 'correct' : 'correctOther');
    delete this.champElements[champion];
  }

  deal(onStart, onChoice) {
    if (this.champElements) {
      this.reset();
    }

    this.champElements = {};

    let dealDurationMs = this.createElements(onChoice);
    this.dealButton.classList.add('dealing');

    setTimeout(async () => {
      await this.countdown(10);
      onStart();
      this.dealButton.classList.add('dealt');
    }, dealDurationMs);
  }

  async countdown(seconds) {
    for (let i = seconds; i > 0; i--) {
      this.scoreElt.textContent = i;
      await sleep(1000);
    }
    this.scoreElt.textContent = 'Select the matching champion';
    setTimeout(() => {
      if (this.scoreElt.textContent === 'Select the matching champion') {
        this.scoreElt.textContent = '';
      }
    }, 4000);
  }

  resetWrong() {
    Array.from(document.body.querySelectorAll('.wrong, .wrongOther')).forEach(e => {
      e.classList.remove('wrong', 'wrongOther');
    });
  }

  update() {
    let now = Date.now();
    for (let id in this.cursors) {
      let cursor = this.cursors[id];
      if (now - cursor.lastUpdate > 2000) {
        cursor.elt.classList.add('inactive');
      } else {
        cursor.elt.classList.remove('inactive');
      }
    }

    this.updateRequest = requestAnimationFrame(this.update);
  }

  onMouseMove(event) {
    if (Date.now() - this.lastMouseMove < 100) {
      return;
    }
    this.lastMouseMove = Date.now();
    let rect = this.container.getBoundingClientRect();
    let x = Math.round((event.clientX - rect.left) / rect.width * 1000) / 1000;
    let y = Math.round((event.clientY - rect.top) / rect.height * 1000) / 1000;
    if (this.comms) {
      this.comms.cursor({x, y});
    }
  }

  updateCursor(id, coords) {
    if (!this.cursors[id]) {
      let color = this.comms.getIdColor(id);
      let elt = document.createElement('img');
      elt.classList.add('cursor');
      console.log('color', color);
      elt.style.filter = `drop-shadow(0 0 0.75rem ${color})`;
      elt.src = 'images/normal.png';
      this.container.appendChild(elt);
      this.cursors[id] = {
        lastUpdate: 0,
        elt,
      };
    }
    this.cursors[id].lastUpdate = Date.now();
    this.cursors[id].elt.style.top = `${coords.y * 100}%`;
    this.cursors[id].elt.style.left = `${coords.x * 100}%`;
  }
}


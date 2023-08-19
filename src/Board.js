import { sleep } from './utilities.js';

import { safariWorkAround } from './Audio.js';

export class Board {
  constructor() {
    this.dealButton = null;
    this.scoreElt = null;

    this.onDealClick = this.onDealClick.bind(this);
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
    let cards = document.body.querySelector('.cards');
    cards.parentNode.removeChild(cards);
    this.scoreElt.parentNode.removeChild(this.scoreElt);
    this.champElements = null;
  }

  preloadChampImages(champsPresent) {
    for (const champion of Object.keys(champsPresent)) {
      const img = document.createElement('img');
      img.src = `images/${champion.replace(/_/g, '+')}/${champion}_OriginalLoading.jpg`;
    }
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
    let container = document.createElement('div');
    container.classList.add('cards');
    document.body.appendChild(container);

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
      container.appendChild(elt);
      this.champElements[champion] = elt;
      if (i === 11) {
        this.scoreElt = document.createElement('div');
        this.scoreElt.classList.add('score');
        this.scoreElt.textContent = '';
        container.appendChild(this.scoreElt);
      }
      i += 1;
    }
    for (const champion of Object.keys(this.champsPresent)) {
      let elt = this.champElements[champion];
      this.flipChampCard(elt, delay);
      delay -= 80;
    }

    return originalDelay;
  }

  deal(onStart, onChoice) {
    if (this.champElements) {
      this.reset();
    }

    this.champElements = {};

    let dealDurationMs = this.createElements(onChoice);
    this.dealButton.classList.add('dealing');

    setTimeout(async () => {
      this.dealButton.classList.add('dealt');
      for (let i = 10; i > 0; i--) {
        this.scoreElt.textContent = i;
        await sleep(1000);
      }
      this.scoreElt.textContent = 'Select the matching champion';
      setTimeout(() => {
        this.scoreElt.textContent = '';
      }, 4000);
      onStart();
    }, dealDurationMs);
  }

  resetWrong() {
    Array.from(document.body.querySelectorAll('.wrong')).forEach(e => {
      e.classList.remove('wrong');
    });
  }
}


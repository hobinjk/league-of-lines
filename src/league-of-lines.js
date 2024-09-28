import './style.css';

import { GameTimeTrial } from './GameTimeTrial.js';
import { GameMulti } from './GameMulti.js';
import { isHots } from './isHots.js';

function startTimeTrial() {
  let gameTimeTrial = new GameTimeTrial();
  gameTimeTrial.onLoad();
  document.body.removeChild(buttonContainer);
  document.body.removeChild(modeSwitchLink);
}

function startMulti() {
  new GameMulti();
  document.body.removeChild(buttonContainer);
  document.body.removeChild(modeSwitchLink);
}

let buttonContainer = document.createElement('div');
buttonContainer.classList.add('button-container');

const trialButton = document.createElement('div');
trialButton.classList.add('game-button');
trialButton.textContent = 'Time Trial';
trialButton.addEventListener('click', startTimeTrial);
trialButton.addEventListener('touchstart', startTimeTrial);
buttonContainer.appendChild(trialButton);


const multiButton = document.createElement('div');
multiButton.classList.add('game-button');
multiButton.textContent = 'Multiplayer';
multiButton.addEventListener('click', startMulti);
multiButton.addEventListener('touchstart', startMulti);
buttonContainer.appendChild(multiButton);

document.body.appendChild(buttonContainer);

const modeSwitchLink = document.createElement('a');
modeSwitchLink.classList.add('mode-switch-link');
const switchUrl = new URL(window.location);
// Toggle mode parameter (or provide it if missing)
switchUrl.search = '?mode=' + (isHots ? 'lol' : 'hots');
modeSwitchLink.href = switchUrl.toString();
if (isHots) {
  modeSwitchLink.textContent = 'Switch to League of Legends';
} else {
  modeSwitchLink.textContent = 'Switch to Heroes of the Storm';
}
document.body.appendChild(modeSwitchLink);

import * as seedrandom from 'seedrandom';

export class Comms {
  constructor(game) {
    this.game = game;
    this.onMessage = this.onMessage.bind(this);
    this.ws = new WebSocket('ws://127.0.0.1:8080/ws');
    this.ws.addEventListener('message', this.onMessage);
    this.scores = {};
    this.colors = {};
    this.id = '';
  }

  joinRoom(room) {
    if (this.ws.readyState !== WebSocket.OPEN) {
      const onOpen = () => {
        this.joinRoom(room);
        this.ws.removeEventListener('open', onOpen);
      };
      this.ws.addEventListener('open', onOpen);
    } else {
      this.send(`/name ${this.id}`);
      this.send(`/join ${room}`);
      this.send(`ready ${this.id}`);
      this.scores[this.id] = 0;
    }
  }

  start() {
    this.send(`/start ${this.id}`);
    this.scores = {[this.id]: 0};
  }

  correct(champion) {
    this.send(`/correct ${this.id} ${champion}`);
    this.addScore(this.id, 1);
  }

  cursor(coords) {
    this.send(`cursor ${this.id} ${coords.x} ${coords.y}`);
  }

  addScore(id, val) {
    if (!this.scores[id]) {
      this.scores[id] = 0;
    }
    this.scores[id] += val;
    this.game.updateScores();
  }

  zeroScores() {
    for (let id in this.scores) {
      this.scores[id] = 0;
    }
    this.game.updateScores();
  }

  wrong(champion) {
    this.send(`wrong ${this.id} ${champion}`);
    this.addScore(this.id, -1);
  }

  send(msg) {
    console.log('send msg', msg);
    this.ws.send(msg);
  }

  onMessage(event) {
    let msg = event.data;
    msg = msg.split(': ').at(-1);
    let parts = msg.split(' ');
    let command = parts[0];
    console.log('msg', command, parts);
    switch (command) {
      case 'startGame': {
        let seed = parseInt(parts[1]);
        this.setSeed(seed);
        this.game.startGame();
      }
        break;
      case 'startRound': {
        let seed = parseInt(parts[1]);
        this.setSeed(seed);
        this.game.getNextLine();
      }
        break;
      case 'cursor': {
        let id = parts[1];
        let x = parseFloat(parts[2]);
        let y = parseFloat(parts[3]);
        this.game.board.updateCursor(id, {x, y});
      }
        break;
      case 'wrong': {
        this.addScore(parts[1], -1);
        this.game.board.markWrong(parts[2], false);
      }
        break;
      case '/correct': {
        this.addScore(parts[1], 1);
        this.game.board.markCorrect(parts[2], false);
      }
        break;
      case 'ready': {
        let id = parts[1];
        if (!this.scores.hasOwnProperty(id) && id !== this.id) {
          this.scores[id] = 0;
          this.send(`ready ${this.id}`);
          this.game.updateScores();
        }
      }
        break;
    }
  }

  setSeed(seed) {
    this.rng = seedrandom(seed.toString());
  }

  random(arr) {
    return arr[Math.floor(arr.length * this.rng())];
  }

  getIdColor(id) {
    if (!this.colors[id]) {
      let hue = 47 * Object.keys(this.colors).length;
      this.colors[id] = `hsl(${hue} 100% 50%)`;
    }
    return this.colors[id];
  }
}

import * as seedrandom from 'seedrandom';

export class Comms {
  constructor(game) {
    this.game = game;
    this.onMessage = this.onMessage.bind(this);
    this.ws = new WebSocket('ws://127.0.0.1:8080/ws');
    this.ws.addEventListener('message', this.onMessage);
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
    }
  }

  start() {
    this.send(`/start ${this.id}`);
  }

  correct(champion) {
    this.send(`/correct ${this.id} ${champion}`);
  }

  wrong(champion) {
    this.send(`wrong ${this.id} ${champion}`);
  }

  send(msg) {
    console.log('send msg', msg);
    this.ws.send(msg);
  }

  onMessage(event) {
    let msg = event.data;
    console.log('msg', msg);
    msg = msg.split(': ').at(-1);
    let parts = msg.split(' ');
    let command = parts[0];
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
      case 'mouse': {
        let id = parts[1];
        let x = parseFloat(parts[2]);
        let y = parseFloat(parts[3]);
        this.game.updateCursor(id, x, y);
      }
        break;
      case 'wrong': {
        this.game.board.markWrong(parts[2], false);
      }
        break;
      case '/correct': {
        this.game.board.markCorrect(parts[2], false);
      }
        break;
      case 'list': {
        let ids = parts.slice(1);
        this.game.setIds(ids);
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
}

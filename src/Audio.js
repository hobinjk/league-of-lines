let wrongSfx = document.createElement('audio');
wrongSfx.src = 'sfx/Enemy_Missing_ping_SFX.wav';

let correctSfx = document.createElement('audio');
correctSfx.src = 'sfx/Wallet Close.wav';
correctSfx.volume = 0.7;

let audio = document.createElement('audio');
export function safariWorkAround() {
  audio.innerHTML = '';
  let correctSfxSrc = document.createElement('source');
  correctSfxSrc.src = correctSfx.src;
  audio.appendChild(correctSfxSrc);

  audio.load();
  audio.play();
}

export function waitForAudioStop() {
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

export {
  wrongSfx,
  correctSfx,
  audio,
};

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

export function setAudioSrc(src) {
  audio.innerHTML = '';
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


export {
  wrongSfx,
  correctSfx,
  audio,
};

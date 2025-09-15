let currentList = 'bangla'; // bangla বা english
let musicData = [];
let currentIndex = 0;

const musicListEl = document.getElementById('music-list');
const audioEl = document.getElementById('audio');
const miniPlayer = document.getElementById('mini-player');
const miniTitle = document.getElementById('mini-title');
const fullscreenPlayer = document.getElementById('fullscreen-player');
const fsTitle = document.getElementById('fs-title');

fetch(`data/${currentList}.json`)
  .then(res => res.json())
  .then(data => {
    musicData = data;
    renderMusicList();
  });

function renderMusicList() {
  musicListEl.innerHTML = '';
  musicData.forEach((song, index) => {
    const div = document.createElement('div');
    div.classList.add('song');
    div.textContent = song.name;
    div.addEventListener('click', () => playSong(index));
    musicListEl.appendChild(div);
  });
}

function playSong(index) {
  currentIndex = index;
  const song = musicData[index];
  audioEl.src = `songs/${currentList}/${song.file}`;
  audioEl.play();
  miniTitle.textContent = song.name;
  fsTitle.textContent = song.name;
}

// Mini player click opens fullscreen
miniPlayer.addEventListener('click', () => {
  fullscreenPlayer.style.display = 'flex';
});

// Close fullscreen
document.getElementById('fs-close').addEventListener('click', () => {
  fullscreenPlayer.style.display = 'none';
});

// Play/Pause buttons
document.getElementById('play').addEventListener('click', () => {
  if(audioEl.paused) audioEl.play();
  else audioEl.pause();
});
document.getElementById('mini-play').addEventListener('click', (e)=>{
  e.stopPropagation();
  if(audioEl.paused) audioEl.play();
  else audioEl.pause();
});

// Next/Prev
document.getElementById('next').addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % musicData.length;
  playSong(currentIndex);
});
document.getElementById('prev').addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + musicData.length) % musicData.length;
  playSong(currentIndex);
});

let currentList = 'bangla';
let musicData = [];
let filteredData = [];
let currentIndex = 0;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 'none';

const musicListEl = document.getElementById('music-list');
const audioEl = document.getElementById('audio');
const miniPlayer = document.getElementById('mini-player');
const miniTitle = document.getElementById('mini-title');
const fullscreenPlayer = document.getElementById('fullscreen-player');
const fsTitle = document.getElementById('fs-title');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const shuffleBtn = document.getElementById('shuffle');
const repeatBtn = document.getElementById('repeat');
const fsCloseBtn = document.getElementById('fs-close');
const searchInput = document.getElementById('searchInput');
const tabs = document.querySelectorAll('.tab');

// --------------------
// Load JSON
// --------------------
function loadSongs(lang){
  fetch(`data/${lang}.json`)
    .then(res => res.json())
    .then(data => {
      musicData = data;
      filteredData = [...musicData];
      renderMusicList();
    });
}

loadSongs(currentList);

// --------------------
// Render Music List
// --------------------
function renderMusicList(){
  musicListEl.innerHTML = '';
  filteredData.forEach((song,index)=>{
    const li = document.createElement('li');
    li.classList.add('music-item');
    li.innerHTML = `<div class="info"><span class="title">${song.name}</span></div>`;
    li.addEventListener('click',()=>playSong(index));
    musicListEl.appendChild(li);
  });
}

// --------------------
// Play Song
// --------------------
function playSong(index){
  currentIndex = index;
  const song = filteredData[index];
  audioEl.src = `songs/${currentList}/${song.file}`;
  audioEl.play();
  isPlaying=true;
  updateMiniPlayer(song.name);
  updateFullscreenPlayer(song.name);
  updatePlayButton();
}

// --------------------
// Update UI
// --------------------
function updateMiniPlayer(title){ miniTitle.textContent=title; }
function updateFullscreenPlayer(title){ fsTitle.textContent=title; }
function updatePlayButton(){
  if(isPlaying){
    playBtn.innerHTML='<i class="fa fa-pause"></i>';
    document.getElementById('mini-play').innerHTML='<i class="fa fa-pause"></i>';
  }else{
    playBtn.innerHTML='<i class="fa fa-play"></i>';
    document.getElementById('mini-play').innerHTML='<i class="fa fa-play"></i>';
  }
}

// --------------------
// Mini → Fullscreen
// --------------------
miniPlayer.addEventListener('click',()=>fullscreenPlayer.style.display='flex');
fsCloseBtn.addEventListener('click',()=>fullscreenPlayer.style.display='none');

// --------------------
// Play/Pause
// --------------------
playBtn.addEventListener('click',togglePlay);
document.getElementById('mini-play').addEventListener('click',(e)=>{e.stopPropagation(); togglePlay();});
function togglePlay(){ if(isPlaying){ audioEl.pause(); }else{ audioEl.play(); } }
audioEl.addEventListener('play',()=>{ isPlaying=true; updatePlayButton(); });
audioEl.addEventListener('pause',()=>{ isPlaying=false; updatePlayButton(); });

// --------------------
// Next / Prev
// --------------------
nextBtn.addEventListener('click',playNext);
prevBtn.addEventListener('click',playPrev);

function playNext(){
  if(isShuffle) currentIndex = Math.floor(Math.random()*filteredData.length);
  else currentIndex=(currentIndex+1)%filteredData.length;
  playSong(currentIndex);
}
function playPrev(){
  if(isShuffle) currentIndex = Math.floor(Math.random()*filteredData.length);
  else currentIndex=(currentIndex-1+filteredData.length)%filteredData.length;
  playSong(currentIndex);
}

// --------------------
// Shuffle & Repeat
// --------------------
shuffleBtn.addEventListener('click',()=>{
  isShuffle=!isShuffle;
  shuffleBtn.style.color = isShuffle?'var(--accent-1)':'var(--white)';
});
repeatBtn.addEventListener('click',()=>{
  if(repeatMode==='none') repeatMode='all';
  else if(repeatMode==='all') repeatMode='one';
  else repeatMode='none';
  updateRepeatUI();
});
function updateRepeatUI(){
  repeatBtn.style.color = repeatMode==='none'?'var(--white)':(repeatMode==='all'?'var(--accent-2)':'var(--accent-1)');
}

// --------------------
// Auto Next / Repeat
// --------------------
audioEl.addEventListener('ended',()=>{
  if(repeatMode==='one') playSong(currentIndex);
  else if(repeatMode==='all') playNext();
  else{ if(currentIndex<filteredData.length-1) playNext(); else { audioEl.pause(); isPlaying=false; updatePlayButton(); } }
});

// --------------------
// Progress Bar
// --------------------
const progressContainer = document.createElement('div');
progressContainer.style.width='80%';
progressContainer.style.height='5px';
progressContainer.style.background='rgba(255,255,255,0.2)';
progressContainer.style.borderRadius='3px';
progressContainer.style.cursor='pointer';
progressContainer.style.margin='0 auto 20px';
fullscreenPlayer.insertBefore(progressContainer,audioEl);

const progressBar = document.createElement('div');
progressBar.style.height='100%';
progressBar.style.width='0%';
progressBar.style.background='var(--accent-1)';
progressBar.style.borderRadius='3px';
progressContainer.appendChild(progressBar);

audioEl.addEventListener('timeupdate',()=>{
  const progressPercent = (audioEl.currentTime/audioEl.duration)*100;
  progressBar.style.width=progressPercent+'%';
});
progressContainer.addEventListener('click',(e)=>{
  const rect = progressContainer.getBoundingClientRect();
  const clickX = e.clientX-rect.left;
  audioEl.currentTime = (clickX/rect.width)*audioEl.duration;
});

// --------------------
// Search
// --------------------
searchInput.addEventListener('input',(e)=>{
  const query = e.target.value.toLowerCase();
  filteredData = musicData.filter(song => song.name.toLowerCase().includes(query));
  renderMusicList();
});

// --------------------
// Tabs
// --------------------
tabs.forEach(tab=>{
  tab.addEventListener('click',()=>{
    tabs.forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    currentList = tab.dataset.lang;
    searchInput.value='';
    loadSongs(currentList);
  });
});

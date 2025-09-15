// ====== index.js ======
const types = ['anime','arabic','bangla','edit audio','english','hindi','lofi','phonk','slowed-reverbed'];
let musicData = [];
let currentSongIndex = null;
let isPlaying = false;

// DOM Elements
const musicList = document.getElementById('music-list');
const alphaIndex = document.getElementById('alphaIndex');
const searchInput = document.getElementById('searchInput');
const tabs = document.querySelectorAll('.tab');

// Mini Player DOM
const miniPlayer = document.getElementById('mini-player');
const miniTitle = document.getElementById('mini-title');
const miniAudio = document.getElementById('mini-audio');
const miniPlayBtn = document.getElementById('mini-play');
const miniPlayIcon = document.getElementById('mini-play-icon');
const miniProgressBar = document.getElementById('mini-progress-filled');
const miniCurrentTime = document.getElementById('mini-current-time');
const miniDuration = document.getElementById('mini-duration');

// Load all JSON music data
async function loadAllMusic() {
  let allSongs = [];
  for (const type of types) {
    try {
      const res = await fetch(`data/${type}.json`);
      const data = await res.json();
      data.forEach(song => song.type = type);
      allSongs = allSongs.concat(data);
    } catch (e) {
      console.error(`Failed to load ${type}.json`, e);
    }
  }
  musicData = allSongs;
}

// Sort songs alphabetically
function sortSongs(list) {
  return list.slice().sort((a,b)=>{
    const aChar = a.name.charAt(0).toUpperCase();
    const bChar = b.name.charAt(0).toUpperCase();
    const isALetter = /^[A-Z]$/.test(aChar);
    const isBLetter = /^[A-Z]$/.test(bChar);
    if(isALetter && !isBLetter) return -1;
    if(!isALetter && isBLetter) return 1;
    return a.name.toUpperCase() < b.name.toUpperCase() ? -1 : a.name.toUpperCase() > b.name.toUpperCase() ? 1 : 0;
  });
}

// Display songs list
function displaySongs(list) {
  const sortedList = sortSongs(list);
  if(sortedList.length === 0){
    musicList.innerHTML = `<li style="color:white;text-align:center;padding:20px;">No results found</li>`;
    return;
  }

  musicList.innerHTML = sortedList.map((song,index)=>`
    <li class="music-item" data-index="${index}">
      <span class="title">${song.name}</span>
      <span style="font-size:12px;color:rgba(255,255,255,0.5)"> [${song.type}]</span>
    </li>
  `).join('');

  addPlayHandler();
}

// Display folders view
const folderOpenState = {};
function displayFolders(list){
  const sortedList = sortSongs(list);
  let html = '';

  types.forEach(type=>{
    const songs = sortedList.filter(s=>s.type===type);
    if(songs.length){
      folderOpenState[type]=false;
      html += `
      <div class="folder-title" data-type="${type}">${type.toUpperCase()}</div>
      <ul class="folder-songs" data-type="${type}">
        ${songs.map((song,index)=>`
          <li class="music-item" data-index="${musicData.indexOf(song)}">${song.name}</li>
        `).join('')}
      </ul>`;
    }
  });

  musicList.innerHTML = html;

  document.querySelectorAll('.folder-title').forEach(title=>{
    title.addEventListener('click',()=>{
      const type = title.getAttribute('data-type');
      folderOpenState[type]=!folderOpenState[type];
      const ul = document.querySelector(`.folder-songs[data-type="${type}"]`);
      ul.classList.toggle('open');
    });
  });

  addPlayHandler();
}

// Handle clicking songs to play in mini player
function addPlayHandler(){
  document.querySelectorAll('.music-item').forEach(item=>{
    item.onclick = ()=>{
      const index = parseInt(item.dataset.index);
      if(!isNaN(index)){
        playSong(index);
      }
    };
  });
}

// Mini Player controls
function playSong(index){
  const song = musicData[index];
  if(!song) return;
  currentSongIndex = index;
  miniAudio.src = `songs/${song.file}`;
  miniTitle.textContent = song.name;
  miniAudio.play();
  isPlaying = true;
  miniPlayIcon.classList.remove('fa-play');
  miniPlayIcon.classList.add('fa-pause');
  miniPlayer.style.display = 'flex';
  requestAnimationFrame(updateMiniProgress);
}

function toggleMiniPlay(){
  if(!currentSongIndex && currentSongIndex!==0) return;
  if(isPlaying){
    miniAudio.pause();
    isPlaying=false;
    miniPlayIcon.classList.remove('fa-pause');
    miniPlayIcon.classList.add('fa-play');
  } else {
    miniAudio.play();
    isPlaying=true;
    miniPlayIcon.classList.remove('fa-play');
    miniPlayIcon.classList.add('fa-pause');
    requestAnimationFrame(updateMiniProgress);
  }
}

// Mini player progress
function updateMiniProgress(){
  if(miniAudio.duration){
    const percent = (miniAudio.currentTime/miniAudio.duration)*100;
    miniProgressBar.style.width = percent + '%';
    miniCurrentTime.textContent = formatTime(miniAudio.currentTime);
    miniDuration.textContent = formatTime(miniAudio.duration);
  }
  if(isPlaying){
    requestAnimationFrame(updateMiniProgress);
  }
}

// Format time
function formatTime(sec){
  const m = Math.floor(sec/60);
  const s = Math.floor(sec%60);
  return m+':'+(s<10?'0'+s:s);
}

// Search input
searchInput.addEventListener('input',()=>{
  const q = searchInput.value.toLowerCase();
  const filtered = musicData.filter(s=>s.name.toLowerCase().includes(q));
  const activeTab = document.querySelector('.tab.active').dataset.tab;
  if(activeTab==='songs') displaySongs(filtered);
  else displayFolders(filtered);
});

// Tabs
tabs.forEach(tab=>{
  tab.addEventListener('click',()=>{
    tabs.forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    searchInput.value='';
    const activeTab = tab.dataset.tab;
    if(activeTab==='songs') displaySongs(musicData);
    else displayFolders(musicData);
  });
});

// A-Z index
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
alphabet.forEach(letter=>{
  const div = document.createElement('div');
  div.textContent = letter;
  div.addEventListener('click',()=>scrollToLetter(letter));
  alphaIndex.appendChild(div);
});

function scrollToLetter(letter){
  const listItems = [...document.querySelectorAll('.music-item')];
  let target;
  if(letter===' # '){
    target=listItems.find(li=>{
      const first = li.querySelector('.title').textContent.charAt(0).toUpperCase();
      return !(/[A-Z]/.test(first));
    });
  } else {
    target=listItems.find(li=>li.querySelector('.title').textContent.charAt(0).toUpperCase()===letter);
  }
  if(target) target.scrollIntoView({behavior:'smooth',block:'start'});
}

// Mini player buttons
miniPlayBtn.addEventListener('click',toggleMiniPlay);

// Load music and initialize
loadAllMusic().then(()=>{
  displaySongs(musicData);
});

/* ========= Global Variables ========= */
const types = ['anime','arabic','bangla','edit audio','english','hindi','lofi','phonk','slowed-reverbed'];
let musicData = [];
let currentSong = null;
let isPlayerView = false;

/* ========= Elements ========= */
const searchInput = document.getElementById('searchInput');
const tabs = document.querySelectorAll('.tab');
const alphaIndex = document.getElementById('alphaIndex');
const libraryContainer = document.querySelector('.container.library');
const playerContainer = document.querySelector('.container.player');

/* Player Elements */
const audio = document.getElementById("audio");
const title = document.getElementById("title");
const playBtn = document.getElementById("play");
const playIcon = document.getElementById("play-icon");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const shuffleBtn = document.getElementById("shuffle");
const repeatBtn = document.getElementById("repeat");
const repeatIcon = document.getElementById("repeat-icon");
const progressBarContainer = document.getElementById("progress-bar-container");
const progressFilled = document.getElementById("progress-filled");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const volumeSlider = document.getElementById("volume");
const backBtn = document.querySelector('.back-btn');

/* ========= Load All Songs ========= */
async function loadAllMusic() {
  let allSongs = [];
  for(const type of types){
    try{
      const res = await fetch(`data/${type}.json`);
      const data = await res.json();
      data.forEach(song => { song.type = type; });
      allSongs = allSongs.concat(data);
    } catch(e){
      console.error(`Failed to load ${type}.json`, e);
    }
  }
  musicData = allSongs;
  displaySongs(musicData);
  highlightActiveLetter();
}

/* ========= Sort Songs Alphabetically ========= */
function sortSongs(list) {
  return list.slice().sort((a,b) => {
    const aChar = a.name.charAt(0).toUpperCase();
    const bChar = b.name.charAt(0).toUpperCase();
    const isALetter = /^[A-Z]$/.test(aChar);
    const isBLetter = /^[A-Z]$/.test(bChar);

    if(isALetter && !isBLetter) return -1;
    if(!isALetter && isBLetter) return 1;
    if(a.name.toUpperCase() < b.name.toUpperCase()) return -1;
    if(a.name.toUpperCase() > b.name.toUpperCase()) return 1;
    return 0;
  });
}

/* ========= Display Songs ========= */
function displaySongs(list){
  const sortedList = sortSongs(list);
  const musicList = document.getElementById('music-list');
  if(sortedList.length === 0){
    musicList.innerHTML = `<li style="color:white; text-align:center; padding:20px;">No results found</li>`;
    return;
  }
  musicList.innerHTML = sortedList.map(song => `
    <li class="music-item" data-name="${song.name}" data-file="${song.file}" data-type="${song.type}">
      <div class="info">
        <span class="title">${song.name}</span>
        <span style="font-size:12px;color:rgba(255,255,255,0.5)"> [${song.type}]</span>
      </div>
    </li>
  `).join('');
  addPlayHandler();
}

/* ========= Display Folders ========= */
const folderOpenState = {};
function displayFolders(list){
  const musicList = document.getElementById('music-list');
  const sortedList = sortSongs(list);
  let html = '';
  types.forEach(type=>{
    const songs = sortedList.filter(s => s.type === type);
    if(songs.length > 0){
      folderOpenState[type] = folderOpenState[type] || false;
      html += `
        <div class="folder-title" data-type="${type}">${type.toUpperCase()}</div>
        <ul class="folder-songs ${folderOpenState[type] ? 'open' : ''}" data-type="${type}">
          ${songs.map(song=>`
            <li class="music-item" data-name="${song.name}" data-file="${song.file}" data-type="${type}">
              <div class="info">${song.name}</div>
            </li>
          `).join('')}
        </ul>
      `;
    }
  });
  musicList.innerHTML = html;

  document.querySelectorAll('.folder-title').forEach(title => {
    title.addEventListener('click', () => {
      const type = title.getAttribute('data-type');
      folderOpenState[type] = !folderOpenState[type];
      const ul = document.querySelector(`.folder-songs[data-type="${type}"]`);
      ul.classList.toggle('open');
    });
  });

  addPlayHandler();
}

/* ========= Alphabet Index ========= */
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
alphabet.forEach(letter => {
  const div = document.createElement('div');
  div.textContent = letter;
  div.addEventListener('click', () => scrollToLetter(letter));
  alphaIndex.appendChild(div);
});

function scrollToLetter(letter) {
  const listItems = [...document.querySelectorAll('.music-item')];
  let targetItem;
  if(letter === '#'){
    targetItem = listItems.find(li => {
      const firstChar = li.getAttribute('data-name').charAt(0).toUpperCase();
      return !(/[A-Z]/.test(firstChar));
    });
  } else {
    targetItem = listItems.find(li => li.getAttribute('data-name').charAt(0).toUpperCase() === letter);
  }
  if(targetItem){
    targetItem.scrollIntoView({behavior: 'smooth', block: 'start'});
  }
}

function highlightActiveLetter(){
  const listItems = [...document.querySelectorAll('.music-item')];
  if(listItems.length === 0) return;
  const scrollY = window.scrollY || window.pageYOffset;
  let currentLetter = null;

  for(let i = 0; i < listItems.length; i++){
    const li = listItems[i];
    const rect = li.getBoundingClientRect();
    if(rect.top + window.scrollY > scrollY + 10){
      const name = li.getAttribute('data-name');
      const firstChar = name.charAt(0).toUpperCase();
      currentLetter = /[A-Z]/.test(firstChar) ? firstChar : '#';
      break;
    }
  }
  if(!currentLetter){
    const lastName = listItems[listItems.length-1].getAttribute('data-name');
    const firstChar = lastName.charAt(0).toUpperCase();
    currentLetter = /[A-Z]/.test(firstChar) ? firstChar : '#';
  }
  [...alphaIndex.children].forEach(div => {
    div.classList.remove('active');
    if(div.textContent === currentLetter){
      div.classList.add('active');
    }
  });
}

/* ========= Tabs ========= */
tabs.forEach(tab=>{
  tab.addEventListener('click', ()=>{
    tabs.forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    const activeTab = tab.dataset.tab;
    searchInput.value = '';
    if(activeTab==='songs') displaySongs(musicData);
    else if(activeTab==='folders') displayFolders(musicData);
    highlightActiveLetter();
  });
});

/* ========= Search ========= */
searchInput.addEventListener('input', ()=>{
  const query = searchInput.value.toLowerCase();
  const filtered = musicData.filter(song => song.name.toLowerCase().includes(query));
  const activeTab = document.querySelector('.tab.active').dataset.tab;
  if(activeTab==='songs') displaySongs(filtered);
  else if(activeTab==='folders') displayFolders(filtered);
  highlightActiveLetter();
});
window.addEventListener('scroll', ()=>highlightActiveLetter());

/* ========= Play Song Handler ========= */
function addPlayHandler(){
  document.querySelectorAll('.music-item').forEach(item=>{
    item.onclick = () => {
      const name = item.dataset.name;
      const file = item.dataset.file;
      const folder = item.dataset.type;
      playSelectedSong(name, file, folder);
    };
  });
}

/* ========= Player Functions ========= */
let isPlaying = false;
let rafId;
function loadSong(name, file, folder) {
  audio.src = "songs/" + folder + "/" + file;
  title.textContent = name;
  resetProgress();
}
function resetProgress() {
  progressFilled.style.width = "0%";
  currentTimeEl.textContent = "0:00";
  durationEl.textContent = "0:00";
}
function playSong() {
  audio.play();
  isPlaying = true;
  playIcon.classList.remove("fa-play");
  playIcon.classList.add("fa-pause");
  updateProgress();
}
function pauseSong() {
  audio.pause();
  isPlaying = false;
  playIcon.classList.remove("fa-pause");
  playIcon.classList.add("fa-play");
}
function togglePlayPause() {
  if (isPlaying) {
    pauseSong();
    cancelAnimationFrame(rafId);
  } else {
    playSong();
  }
}
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins + ":" + (secs < 10 ? "0" + secs : secs);
}
function updateProgress() {
  if (audio.duration) {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFilled.style.width = percent + "%";
    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationEl.textContent = formatTime(audio.duration);
  }
  if (isPlaying) {
    rafId = requestAnimationFrame(updateProgress);
  }
}

/* ========= Event Listeners ========= */
progressBarContainer.addEventListener("click", (e) => {
  const rect = progressBarContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const width = rect.width;
  audio.currentTime = (clickX / width) * audio.duration;
});
playBtn.addEventListener("click", togglePlayPause);
volumeSlider.addEventListener("input", () => { audio.volume = volumeSlider.value; });
window.addEventListener("keydown", e => {
  if (e.code === "Space") {
    e.preventDefault();
    togglePlayPause();
  }
});
backBtn.addEventListener("click", ()=>{
  playerContainer.style.display = "none";
  libraryContainer.style.display = "block";
  isPlayerView = false;
});

/* ========= Switch View ========= */
function playSelectedSong(name, file, folder){
  currentSong = {name, file, folder};
  loadSong(name, file, folder);
  playSong();
  libraryContainer.style.display = "none";
  playerContainer.style.display = "block";
  isPlayerView = true;
}

/* ========= Init ========= */
loadAllMusic();

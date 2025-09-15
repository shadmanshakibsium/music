// ================= Global Data =================
const types = ['anime','arabic','bangla','edit audio','english','hindi','lofi','phonk','slowed-reverbed'];
let musicData = [];

const audio = new Audio();
let currentSong = null;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;

// ================= DOM Elements =================
const searchInput = document.getElementById("searchInput");
const tabs = document.querySelectorAll(".tab");
const musicList = document.getElementById("music-list");
const alphaIndex = document.getElementById("alphaIndex");

const miniPlayer = document.getElementById("mini-player");
const miniTitle = document.getElementById("mini-title");
const miniTime = document.getElementById("mini-time");
const miniPlay = document.getElementById("mini-play");

const fullPlayer = document.getElementById("full-player");
const fullTitle = document.getElementById("full-title");
const playPauseBtn = document.getElementById("play-pause");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const progressFilled = document.getElementById("progress-filled");
const progressBarContainer = document.getElementById("progress-bar-container");
const volumeSlider = document.getElementById("volume");
const backToLibrary = document.getElementById("back-to-library");

const shuffleBtn = document.getElementById("shuffle");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const repeatBtn = document.getElementById("repeat");


// ================= Load Music Data =================
async function loadAllMusic() {
  let allSongs = [];
  for(const type of types){
    try{
      const res = await fetch(`data/${type}.json`);
      const data = await res.json();
      data.forEach(song => song.type = type);
      allSongs = allSongs.concat(data);
    } catch(e){
      console.error(`Failed to load ${type}.json`, e);
    }
  }
  musicData = allSongs;
  displaySongs(musicData);
  highlightActiveLetter();
}


// ================= Display =================
function sortSongs(list) {
  return list.slice().sort((a,b) => a.name.localeCompare(b.name));
}

function displaySongs(list){
  const sorted = sortSongs(list);
  if(sorted.length === 0){
    musicList.innerHTML = `<li style="color:white; text-align:center; padding:20px;">No results found</li>`;
    return;
  }
  musicList.innerHTML = sorted.map(song => `
    <li class="music-item" data-name="${song.name}" data-file="${song.file}" data-type="${song.type}">
      <span class="info">
        ${song.name} <small>[${song.type}]</small>
      </span>
    </li>
  `).join("");

  addSongClickHandlers();
}

function displayFolders(list){
  const sorted = sortSongs(list);
  let html = "";
  types.forEach(type => {
    const songs = sorted.filter(s => s.type === type);
    if(songs.length > 0){
      html += `
        <div class="folder-title" data-type="${type}">${type.toUpperCase()}</div>
        <ul class="folder-songs" data-type="${type}">
          ${songs.map(song => `
            <li class="music-item" data-name="${song.name}" data-file="${song.file}" data-type="${song.type}">
              <span class="info">${song.name}</span>
            </li>
          `).join("")}
        </ul>
      `;
    }
  });
  musicList.innerHTML = html;

  document.querySelectorAll('.folder-title').forEach(title => {
    title.addEventListener("click", () => {
      const type = title.getAttribute("data-type");
      const ul = document.querySelector(`.folder-songs[data-type="${type}"]`);
      ul.classList.toggle("open");
    });
  });

  addSongClickHandlers();
}


// ================= Song Play =================
function addSongClickHandlers(){
  document.querySelectorAll(".music-item").forEach(item => {
    item.addEventListener("click", () => {
      const name = item.getAttribute("data-name");
      const file = item.getAttribute("data-file");
      const folder = item.getAttribute("data-type");
      playSong({ name, file, type: folder });
    });
  });
}

function playSong(song){
  currentSong = song;
  audio.src = `songs/${song.type}/${song.file}`;
  audio.play();
  isPlaying = true;

  // Mini player update
  miniTitle.textContent = song.name;
  miniPlay.textContent = "⏸";
  miniPlayer.style.display = "flex";

  // Full player update
  fullTitle.textContent = song.name;
}


// ================= Mini Player =================
miniPlay.addEventListener("click", () => {
  if(!currentSong) return;
  if(isPlaying){
    audio.pause();
    isPlaying = false;
    miniPlay.textContent = "▶";
    playPauseBtn.innerHTML = `<i class="fas fa-play"></i>`;
  } else {
    audio.play();
    isPlaying = true;
    miniPlay.textContent = "⏸";
    playPauseBtn.innerHTML = `<i class="fas fa-pause"></i>`;
  }
});

miniPlayer.addEventListener("click", (e) => {
  if(e.target.id !== "mini-play"){
    fullPlayer.style.display = "flex";
  }
});

backToLibrary.addEventListener("click", () => {
  fullPlayer.style.display = "none";
});


// ================= Full Player Controls =================
playPauseBtn.addEventListener("click", () => {
  if(!currentSong) return;
  if(isPlaying){
    audio.pause();
    isPlaying = false;
    playPauseBtn.innerHTML = `<i class="fas fa-play"></i>`;
    miniPlay.textContent = "▶";
  } else {
    audio.play();
    isPlaying = true;
    playPauseBtn.innerHTML = `<i class="fas fa-pause"></i>`;
    miniPlay.textContent = "⏸";
  }
});

volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});

progressBarContainer.addEventListener("click", (e) => {
  if(!audio.duration) return;
  const rect = progressBarContainer.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  audio.currentTime = percent * audio.duration;
});


// ================= Update Time =================
function formatTime(sec){
  const m = Math.floor(sec / 60) || 0;
  const s = Math.floor(sec % 60) || 0;
  return `${m}:${s<10 ? "0"+s : s}`;
}

audio.addEventListener("timeupdate", () => {
  if(audio.duration){
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFilled.style.width = percent + "%";
    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationEl.textContent = formatTime(audio.duration);
    miniTime.textContent = formatTime(audio.currentTime);
  }
});


// ================= Tabs & Search =================
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    searchInput.value = "";
    if(tab.dataset.tab === "songs") displaySongs(musicData);
    else displayFolders(musicData);
    highlightActiveLetter();
  });
});

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = musicData.filter(s => s.name.toLowerCase().includes(query));
  const activeTab = document.querySelector(".tab.active").dataset.tab;
  if(activeTab === "songs") displaySongs(filtered);
  else displayFolders(filtered);
  highlightActiveLetter();
});


// ================= Alpha Index =================
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");
alphabet.forEach(letter => {
  const div = document.createElement("div");
  div.textContent = letter;
  div.addEventListener("click", () => scrollToLetter(letter));
  alphaIndex.appendChild(div);
});

function scrollToLetter(letter){
  const listItems = [...document.querySelectorAll(".music-item")];
  let target;
  if(letter === "#"){
    target = listItems.find(li => !/^[A-Z]/i.test(li.dataset.name.charAt(0)));
  } else {
    target = listItems.find(li => li.dataset.name.charAt(0).toUpperCase() === letter);
  }
  if(target){
    target.scrollIntoView({behavior:"smooth", block:"start"});
  }
}

function highlightActiveLetter(){
  const listItems = [...document.querySelectorAll(".music-item")];
  if(listItems.length === 0) return;
  const scrollY = window.scrollY || window.pageYOffset;
  let currentLetter = null;
  for(const li of listItems){
    const rect = li.getBoundingClientRect();
    if(rect.top + window.scrollY > scrollY + 10){
      const firstChar = li.dataset.name.charAt(0).toUpperCase();
      currentLetter = /^[A-Z]$/.test(firstChar) ? firstChar : "#";
      break;
    }
  }
  if(!currentLetter){
    const last = listItems[listItems.length-1].dataset.name;
    const c = last.charAt(0).toUpperCase();
    currentLetter = /^[A-Z]$/.test(c) ? c : "#";
  }
  [...alphaIndex.children].forEach(div => {
    div.classList.toggle("active", div.textContent === currentLetter);
  });
}

window.addEventListener("scroll", highlightActiveLetter);


// ================= Init =================
loadAllMusic();

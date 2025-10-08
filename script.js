// --------------------
// Variables
// --------------------
const types = ['anime','arabic','bangla','edit audio','electronic','english','hindi','others','lofi','phonk','remix','slowed-reverbed'];
let currentView = 'all';
let musicData = [];
let filteredData = [];
let currentIndex = 0;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 'none';

const tabs = document.querySelectorAll('.tabs .tab');
const allSongsView = document.getElementById('all-songs-view');
const foldersView = document.getElementById('folders-view');
const musicListEl = document.getElementById('music-list');
const searchInput = document.getElementById('searchInput');
const folderListEl = document.getElementById('folder-list');
const miniPlayer = document.getElementById('mini-player');
const miniTitle = document.getElementById('mini-title');
const miniPlayBtn = document.getElementById('mini-play');
const fullscreenPlayer = document.getElementById('fullscreen-player');
const fsTitle = document.getElementById('fs-title');
const fsAudio = document.getElementById('fs-audio');
const fsPlayBtn = document.getElementById('fs-play');
const fsPrevBtn = document.getElementById('fs-prev');
const fsNextBtn = document.getElementById('fs-next');
const fsShuffleBtn = document.getElementById('fs-shuffle');
const fsRepeatBtn = document.getElementById('fs-repeat');
const fsCloseBtn = document.getElementById('fs-close');
const progressFilled = document.getElementById('progress-filled');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const progressBarContainer = document.getElementById('progress-bar-container');
const volumeSlider = document.getElementById('fs-volume');


// --------------------
// Load All Songs (A-Z) using Promise.all
// --------------------
function loadAllSongs() {
  const promises = types.map(lang =>
    fetch(`data/${lang}.json`)
      .then(res => res.json())
      .then(data => data.map(song => ({...song, folder: lang})))
      .catch(err => { console.error(`Failed to load ${lang}.json`, err); return []; })
  );

  Promise.all(promises).then(results => {
    musicData = results.flat();
    musicData.sort((a,b) => a.name.localeCompare(b.name));
    filteredData = [...musicData];
    renderMusicList();
  });
}

// --------------------
// Load Folders
// --------------------
function loadFolders() {
  folderListEl.innerHTML = '';
  types.forEach(folder => {
    const div = document.createElement('div');
    div.classList.add('folder-title');
    div.textContent = folder;

    div.addEventListener('click', () => toggleFolder(folder, div));
    folderListEl.appendChild(div);
  });
}

function toggleFolder(folderName, folderEl) {
  let listEl = folderEl.nextElementSibling;

  if (listEl && listEl.classList.contains('folder-songs')) {
    listEl.style.display = listEl.style.display === 'block' ? 'none' : 'block';
    return;
  }

  listEl = document.createElement('ul');
  listEl.classList.add('folder-songs');
  listEl.style.marginTop = '8px';
  folderListEl.insertBefore(listEl, folderEl.nextSibling);

  fetch(`data/${folderName}.json`)
    .then(res => res.json())
    .then(data => {
      const folderSongs = data
        .map(s => ({ ...s, folder: folderName }))
        .sort((a, b) => a.name.localeCompare(b.name)); 

      folderSongs.forEach((song, index) => {
        const li = document.createElement('li');
        li.classList.add('music-item');
        li.setAttribute('data-index', index);
        li.innerHTML = `<div class="info"><span class="title">${song.name}</span></div>`;

        if (musicData === folderSongs && index === currentIndex) {
          li.classList.add('playing');
        }

        li.addEventListener('click', (e) => {
          e.stopPropagation();
          musicData = folderSongs;
          filteredData = [...musicData];
          currentIndex = index;
          playSong(index);
        });

        listEl.appendChild(li);
      });

      listEl.style.display = 'block';
    })
    .catch(err => console.error(err));
}

// --------------------
// Render Music List
// --------------------
function renderMusicList() {
  musicListEl.innerHTML = '';

  const hasSeenAnimation = localStorage.getItem('hasSeenFadeInAnimation');

  filteredData.forEach((song, index) => {
    const li = document.createElement('li');
    li.classList.add('music-item');

    if (!hasSeenAnimation) {
      li.classList.add('fade-in');
      li.addEventListener('animationend', () => {
        li.classList.remove('fade-in');
      });
    }

    li.setAttribute('data-index', index);
    li.innerHTML = `
      <div class="info">
        <span class="title">${song.name}</span>
        <span style="font-size:12px; color:rgba(255,255,255,0.5); margin-left:8px;">[${song.folder}]</span>
      </div>`;

    if (index === currentIndex) {
      li.classList.add('playing');
    }

    li.addEventListener('click', () => playSong(index));
    musicListEl.appendChild(li);
  });

  if (!hasSeenAnimation) {
    localStorage.setItem('hasSeenFadeInAnimation', 'true');
  }

  const songCountEl = document.getElementById('songCount');
  if (songCountEl) {
    animateCountUp(songCountEl, filteredData.length, 6000);
  }
}

// --------------------
// Play Song
// --------------------
function playSong(index) {
  currentIndex = index;
  const song = filteredData[index];
  fsAudio.src = `songs/${song.folder}/${song.file}`;
  fsAudio.play();
  isPlaying = true;
  updateMiniPlayer(song.name);
  updateFullscreenPlayer(song.name);
  updatePlayButton();

  document.querySelectorAll('.music-item.playing').forEach(el => el.classList.remove('playing'));

  const currentPlayingEl = musicListEl.querySelector(`.music-item[data-index="${index}"]`);
  if (currentPlayingEl) currentPlayingEl.classList.add('playing');

  const folderLists = document.querySelectorAll('.folder-songs');
  folderLists.forEach(list => {
    const songEl = list.querySelector(`.music-item[data-index="${index}"]`);
    if (songEl) songEl.classList.add('playing');
  });
}

// --------------------
// Update UI
// --------------------
function updateMiniPlayer(title){ miniTitle.textContent = title; }
function updateFullscreenPlayer(title){ fsTitle.textContent = title; }
function updatePlayButton(){
  if(isPlaying){
    fsPlayBtn.innerHTML = '<i class="fa fa-pause"></i>';
    miniPlayBtn.innerHTML = '<i class="fa fa-pause"></i>';
  } else {
    fsPlayBtn.innerHTML = '<i class="fa fa-play"></i>';
    miniPlayBtn.innerHTML = '<i class="fa fa-play"></i>';
  }
}

// --------------------
// Mini → Fullscreen
// --------------------
miniPlayer.addEventListener('click', ()=>{
  fullscreenPlayer.style.display = 'flex';
  miniPlayer.style.display = 'none';
  document.querySelector('.site-header').style.display = 'none'; 
  document.querySelector('.tabs').style.display = 'none';
  allSongsView.style.display = 'none';
  foldersView.style.display = 'none';
});

// Close fullscreen
fsCloseBtn.addEventListener('click', () => {
  fullscreenPlayer.style.display = 'none';
  miniPlayer.style.display = 'flex';
  document.querySelector('.site-header').style.display = 'block';
  document.querySelector('.tabs').style.display = 'flex';

  if (currentView === 'all') {
    allSongsView.style.display = 'block';
    foldersView.style.display = 'none';

    const currentSongEl = musicListEl.querySelector(`.music-item[data-index="${currentIndex}"]`);

    if (currentSongEl) {
      currentSongEl.scrollIntoView({ behavior: 'auto', block: 'center' });
    } else {
      allSongsView.scrollTop = scrollPosition;
    }

  } else {
    allSongsView.style.display = 'none';
    foldersView.style.display = 'block';

    const folderLists = document.querySelectorAll('.folder-songs');
    let found = false;
    folderLists.forEach(list => {
      if (found) return;
      const songEl = list.querySelector(`.music-item[data-index="${currentIndex}"]`);
      if (songEl) {
        songEl.scrollIntoView({ behavior: 'auto', block: 'center' });
        found = true;
      }
    });

    if (!found) {
      foldersView.scrollTop = scrollPosition;
    }
  }
});

// --------------------
// Play/Pause
// --------------------
function togglePlay() {
  if(isPlaying){ fsAudio.pause(); }
  else { fsAudio.play(); }
}
fsPlayBtn.addEventListener('click', togglePlay);
miniPlayBtn.addEventListener('click', (e)=>{ e.stopPropagation(); togglePlay(); });
fsAudio.addEventListener('play', ()=>{ isPlaying = true; updatePlayButton(); });
fsAudio.addEventListener('pause', ()=>{ isPlaying = false; updatePlayButton(); });

// --------------------
// Next / Prev
// --------------------
function playNext(){
  if(isShuffle) currentIndex = Math.floor(Math.random()*filteredData.length);
  else currentIndex = (currentIndex+1)%filteredData.length;
  playSong(currentIndex);
}
function playPrev(){
  if(isShuffle) currentIndex = Math.floor(Math.random()*filteredData.length);
  else currentIndex = (currentIndex-1+filteredData.length)%filteredData.length;
  playSong(currentIndex);
}
fsNextBtn.addEventListener('click', playNext);
fsPrevBtn.addEventListener('click', playPrev);

// --------------------
// Shuffle & Repeat
// --------------------
fsShuffleBtn.addEventListener('click', ()=>{
  isShuffle = !isShuffle;
  fsShuffleBtn.style.color = isShuffle ? '#ff6b6b' : 'white';
});

fsRepeatBtn.addEventListener('click', ()=>{
  if(repeatMode==='none') repeatMode='all';
  else if(repeatMode==='all') repeatMode='one';
  else repeatMode='none';
  updateRepeatUI();
});
function updateRepeatUI(){
  fsRepeatBtn.style.color = repeatMode==='none'?'white':(repeatMode==='all'?'#fcb045':'#ff6b6b');
}

// --------------------
// Auto Next / Repeat
// --------------------
fsAudio.addEventListener('ended', ()=>{
  if(repeatMode==='one') playSong(currentIndex);
  else if(repeatMode==='all') playNext();
  else {
    if(currentIndex<filteredData.length-1) playNext();
    else { fsAudio.pause(); isPlaying=false; updatePlayButton(); }
  }
});

// --------------------
// Progress Bar
// --------------------
fsAudio.addEventListener('timeupdate', ()=>{
  if(fsAudio.duration){
    const percent = (fsAudio.currentTime/fsAudio.duration)*100;
    progressFilled.style.width = percent+'%';
    currentTimeEl.textContent = formatTime(fsAudio.currentTime);
    durationEl.textContent = formatTime(fsAudio.duration);
  }
});
progressBarContainer.addEventListener('click', (e) => {
  const rect = progressBarContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickPercent = (clickX / rect.width);
  const clickTime = clickPercent * fsAudio.duration;

  progressFilled.style.width = (clickPercent * 100) + '%';
  currentTimeEl.textContent = formatTime(clickTime);

  if (!fsAudio.readyState || fsAudio.readyState < 2) {
    const onCanPlay = () => {
      fsAudio.currentTime = clickTime;
      fsAudio.removeEventListener('canplay', onCanPlay);
    };
    fsAudio.addEventListener('canplay', onCanPlay);
  } else {
    fsAudio.currentTime = clickTime;
  }
});
function formatTime(seconds){
  const mins = Math.floor(seconds/60);
  const secs = Math.floor(seconds%60);
  return mins + ':' + (secs<10?'0'+secs:secs);
}

// --------------------
// Volume
// --------------------
volumeSlider.addEventListener('input', ()=>{
  fsAudio.volume = volumeSlider.value;
});

// --------------------
// Search
// --------------------
searchInput.addEventListener('input', (e)=>{
  const query = e.target.value.toLowerCase();
  filteredData = musicData.filter(song => song.name.toLowerCase().includes(query));
  renderMusicList();
});

// --------------------
// Tabs
// --------------------
tabs.forEach(tab=>{
  tab.addEventListener('click', ()=>{
    tabs.forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    currentView = tab.dataset.view;

    if(currentView==='all'){
      allSongsView.style.display='block';
      foldersView.style.display='none';
      loadAllSongs();
    } else {
      allSongsView.style.display='none';
      foldersView.style.display='block';
      loadFolders();
    }
  });
});

// --------------------
// Initial Load
// --------------------
loadAllSongs();

// --------------------
// animateCountUp
// --------------------
function animateCountUp(element, target, duration = 2500) {
  let start = 0;
  const stepTime = Math.abs(Math.floor(duration / target));

  const timer = setInterval(() => {
    start += 1;
    element.textContent = `Total Songs: ${start}`;
    if (start >= target) {
      clearInterval(timer);
    }
  }, stepTime);
}

// --------------------
// Keyboard Shortcut: Spacebar → Play/Pause
// --------------------
document.addEventListener('keydown', (e) => {
  const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
  if (e.code === 'Space' && !isInput) {
    e.preventDefault(); 
    togglePlay(); 
  }
});

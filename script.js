// --------------------
// Variables
// --------------------
const types = ['anime','arabic','bangla','edit audio','electronic','english','hindi','others','lofi','phonk','remix','slowed-reverbed'];
let currentView = 'all'; // 'all' or 'folders'
let musicData = [];
let filteredData = [];
let currentIndex = 0;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 'none';
let scrollPosition = 0;

const tabs = document.querySelectorAll('.tabs .tab');
const allSongsView = document.getElementById('all-songs-view');
const foldersView = document.getElementById('folders-view');
const musicListEl = document.getElementById('music-list');
const searchInput = document.getElementById('searchInput');
const folderListEl = document.getElementById('folder-list');

// Mini Player
const miniPlayer = document.getElementById('mini-player');
const miniTitle = document.getElementById('mini-title');
const miniPlayBtn = document.getElementById('mini-play');

// Fullscreen Player
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

// scroll ইভেন্ট লিসেনার বসাও এখানে
allSongsView.addEventListener('scroll', () => {
  if (currentView === 'all') {
    scrollPosition = allSongsView.scrollTop;
  }
});

foldersView.addEventListener('scroll', () => {
  if (currentView === 'folders') {
    scrollPosition = foldersView.scrollTop;
  }
});

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

  // ফোল্ডার ভিউ লোড হলে আগের scroll position রিস্টোর করো
  foldersView.scrollTop = scrollPosition;
}

function toggleFolder(folderName, folderEl) {
  let listEl = folderEl.nextElementSibling;

  if (listEl && listEl.classList.contains('folder-songs')) {
    // শুধু display toggle
    listEl.style.display = listEl.style.display === 'block' ? 'none' : 'block';
    return;
  }

  // প্রথমবার open করলে UL create
  listEl = document.createElement('ul');
  listEl.classList.add('folder-songs');
  listEl.style.marginTop = '8px';
  folderListEl.insertBefore(listEl, folderEl.nextSibling);

  fetch(`data/${folderName}.json`)
    .then(res => res.json())
    .then(data => {
      const folderSongs = data
        .map(s => ({ ...s, folder: folderName }))
        .sort((a, b) => a.name.localeCompare(b.name)); // ✅ গানগুলো A-Z অনুযায়ী সাজানো

      folderSongs.forEach((song, index) => {
        const li = document.createElement('li');
        li.classList.add('music-item');
        li.setAttribute('data-index', index);
        li.innerHTML = `<div class="info"><span class="title">${song.name}</span></div>`;

        li.addEventListener('click', (e) => {
          e.stopPropagation();
          musicData = folderSongs;
          filteredData = [...musicData];
          currentIndex = index;
          playSong(index);
        });

        listEl.appendChild(li);
      });

      // প্রথমবার open হলে display:block
      listEl.style.display = 'block';
    })
    .catch(err => console.error(err));
}
// --------------------
// Render Music List
// --------------------
function renderMusicList() {
  musicListEl.innerHTML = '';
  filteredData.forEach((song, index) => {
    const li = document.createElement('li');
    li.classList.add('music-item');
    li.setAttribute('data-index', index);
    li.innerHTML = `<div class="info"><span class="title">${song.name}</span></div>`;
    li.addEventListener('click', () => playSong(index));
    musicListEl.appendChild(li);
  });

  if (currentView === 'all') {
    allSongsView.scrollTop = scrollPosition;  // আগের জায়গায় স্ক্রল রাখবে
  }
}
// --------------------
// Play Song
// --------------------
function playSong(index){
  currentIndex = index;
  const song = filteredData[index];
  fsAudio.src = `songs/${song.folder}/${song.file}`;
  fsAudio.play();
  isPlaying = true;
  updateMiniPlayer(song.name);
  updateFullscreenPlayer(song.name);
  updatePlayButton();
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

// Mini → Fullscreen
miniPlayer.addEventListener('click', () => {
  // এইটা ফুলস্ক্রিনে যাওয়ার আগে স্ক্রল পজিশন সেভ করবে
  if (currentView === 'all') {
    scrollPosition = allSongsView.scrollTop;
  } else {
    scrollPosition = foldersView.scrollTop;
  }

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

    // এখানে কোনো renderMusicList() বা loadAllSongs() কল হবে না
    allSongsView.scrollTop = scrollPosition;  // আগের scroll position ঠিকমতো রিস্টোর করো
  } else {
    allSongsView.style.display = 'none';
    foldersView.style.display = 'block';

    // এখানে কোনো loadFolders() বা renderMusicList() কল হবে না
    foldersView.scrollTop = scrollPosition;
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

  // ভিজ্যুয়াল প্রগ্রেস আপডেট
  progressFilled.style.width = (clickPercent * 100) + '%';
  currentTimeEl.textContent = formatTime(clickTime);

  // গান যদি এখনও লোড না হয়, তাহলে wait করা হবে
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
  scrollPosition = 0;  // সার্চে নতুন লিস্ট, scroll শুরুতে যাবে
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

    scrollPosition = 0;  // এটাকে যোগ করতে পারো, নতুন ভিউ লোড হলে scroll শুরুতে যাবে

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

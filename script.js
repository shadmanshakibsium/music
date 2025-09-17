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
        .sort((a, b) => a.name.localeCompare(b.name)); // গানগুলো A-Z অনুযায়ী সাজানো

      folderSongs.forEach((song, index) => {
        const li = document.createElement('li');
        li.classList.add('music-item');
        li.setAttribute('data-index', index);
        li.innerHTML = `<div class="info"><span class="title">${song.name}</span></div>`;

        li.addEventListener('click', (e) => {
          e.stopPropagation();

          // ফোল্ডারের গানগুলো filteredData হিসাবে সেট
          filteredData = [...folderSongs];
          const clickedSong = folderSongs[index];

          // All Songs এর মধ্যে গানটার index বের করা
          currentIndex = musicData.findIndex(s =>
            s.name === clickedSong.name && s.folder === clickedSong.folder
          );

          // গান চালানো
          playSong(currentIndex);
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

    li.innerHTML = `
      <div class="info">
        <span class="title">${song.name}</span>
        <span style="font-size:12px; color:rgba(255,255,255,0.5); margin-left:8px;">[${song.folder}]</span>
      </div>`;

    if (index === currentIndex) {
      li.classList.add('playing');
    }

    li.addEventListener('click', () => {
      // All Songs থেকে গান বাজালে filteredData = musicData হওয়া দরকার
      filteredData = [...musicData];
      currentIndex = index;
      playSong(index);
    });

    musicListEl.appendChild(li);
  });

  // গান সংখ্যা আপডেট করা হচ্ছে
  const songCountEl = document.getElementById('songCount');
  if (songCountEl) {
    songCountEl.textContent = `Total Songs: ${filteredData.length}`;
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

  // আগের .playing ক্লাসগুলো সরাও (দুটি ভিউ থেকেই)
  document.querySelectorAll('.music-item.playing').forEach(el => el.classList.remove('playing'));

  // শুধু তখনই highlight করো, যখন আমরা "All Songs" ভিউতে আছি
  if (currentView === 'all') {
    const currentPlayingEl = musicListEl.querySelector(`.music-item[data-index="${currentIndex}"]`);
    if (currentPlayingEl) currentPlayingEl.classList.add('playing');
  }
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
miniPlayer.addEventListener('click', ()=> {
  fullscreenPlayer.style.display = 'flex';
  miniPlayer.style.display = 'none';           // মিনি প্লেয়ার লুকানো
  document.querySelector('.site-header').style.display = 'none'; // হেডার লুকানো
  document.querySelector('.tabs').style.display = 'none';        // ট্যাব লুকানো
  allSongsView.style.display = 'none';        // গান লিস্ট লুকানো
  foldersView.style.display = 'none';         // ফোল্ডার লিস্ট লুকানো
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

    // প্লে করা গানের এলিমেন্ট খুঁজে পাও
    const currentSongEl = musicListEl.querySelector(`.music-item[data-index="${currentIndex}"]`);

    if (currentSongEl) {
      // প্লে করা গান সামনে নিয়ে যাও, কোনো smooth animation ছাড়াই
      currentSongEl.scrollIntoView({ behavior: 'auto', block: 'center' });
    }
  } else {
    allSongsView.style.display = 'none';
    foldersView.style.display = 'block';

    // ফোল্ডার লিস্টের মধ্যে প্লে করা গান খুঁজো
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
fsShuffleBtn.addEventListener('click', () => {
  isShuffle = !isShuffle;
  fsShuffleBtn.classList.toggle('active', isShuffle);
});

fsRepeatBtn.addEventListener('click', () => {
  if(repeatMode === 'none') repeatMode = 'one';
  else if(repeatMode === 'one') repeatMode = 'all';
  else repeatMode = 'none';

  fsRepeatBtn.dataset.mode = repeatMode;
});

// --------------------
// Progress Bar
// --------------------
fsAudio.addEventListener('timeupdate', () => {
  if(fsAudio.duration){
    const percent = (fsAudio.currentTime / fsAudio.duration) * 100;
    progressFilled.style.width = percent + '%';

    // Update time display
    currentTimeEl.textContent = formatTime(fsAudio.currentTime);
    durationEl.textContent = formatTime(fsAudio.duration);
  }
});

progressBarContainer.addEventListener('click', e => {
  const width = progressBarContainer.clientWidth;
  const clickX = e.offsetX;
  const duration = fsAudio.duration;
  if(duration){
    fsAudio.currentTime = (clickX / width) * duration;
  }
});

function formatTime(sec) {
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// --------------------
// Volume Control
// --------------------
volumeSlider.addEventListener('input', () => {
  fsAudio.volume = volumeSlider.value;
});

// --------------------
// Search
// --------------------
searchInput.addEventListener('input', () => {
  const val = searchInput.value.toLowerCase();
  if(currentView === 'all'){
    filteredData = musicData.filter(s => s.name.toLowerCase().includes(val));
    currentIndex = 0;
    renderMusicList();
  }
});

// --------------------
// Tab Switching
// --------------------
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    if(tab.dataset.tab === 'all-songs'){
      currentView = 'all';
      allSongsView.style.display = 'block';
      foldersView.style.display = 'none';

      filteredData = [...musicData];
      currentIndex = 0;
      renderMusicList();

    } else if(tab.dataset.tab === 'folders'){
      currentView = 'folders';
      allSongsView.style.display = 'none';
      foldersView.style.display = 'block';
      loadFolders();
    }
  });
});

// --------------------
// Init
// --------------------
window.onload = () => {
  loadAllSongs();
  // প্রথমে All Songs দেখাবে
  currentView = 'all';
  filteredData = [...musicData];
  renderMusicList();
};

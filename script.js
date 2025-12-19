
// --------------------
// Variables
// --------------------
const types = ['anime','arabic','bangla','edit audio','electronic','english','hindi','instrumental','others','lofi','phonk','remix','slowed-reverbed','z'];
let currentView = 'all';
let musicData = [];
let filteredData = [];
let currentIndex = 0;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 'none';
let longPressTimer = null;
const LONG_PRESS_TIME = 900;

const metaModal = document.getElementById('meta-modal');
const metaCover = document.getElementById('meta-cover');
const metaName = document.getElementById('meta-name');
const metaArtist = document.getElementById('meta-artist');
const metaAlbum = document.getElementById('meta-album');
const metaClose = document.getElementById('meta-close');
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
const genreListEl = document.getElementById('genre-list');
const genreView = document.getElementById('genre-view');
// Added fsCover element
const fsCover = document.getElementById('fs-cover');


// Set a fallback (placeholder) if cover fails to load
if (fsCover) {
  fsCover.onerror = () => {
    // fallback to app icon or any placeholder you have
    fsCover.src = getRandomFallbackCover();
  };
  // hide initially if no src
  if (!fsCover.src) {
    fsCover.style.display = 'none';
  }
}
const fallbackCovers = [
  'covers/aassdd.png',
  'covers/1.png',
  'covers/2.png',
  'covers/5.jpg',
'covers/6.jpg',
'covers/7.jpg',
'covers/8.jpg',
'covers/9.jpg',
'covers/10.jpg',
'covers/11.jpg',
'covers/12.jpg',
'covers/13.jpg',
'covers/14.jpg'
];

function getRandomFallbackCover() {
  return fallbackCovers[Math.floor(Math.random() * fallbackCovers.length)];
}


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
        // Long Press (1 second)
li.addEventListener('mousedown', () => {
  longPressTimer = setTimeout(() => {
    showMetadata(song);
  }, LONG_PRESS_TIME);
});
li.addEventListener('mouseup', () => clearTimeout(longPressTimer));
li.addEventListener('mouseleave', () => clearTimeout(longPressTimer));

/* Mobile */
li.addEventListener('touchstart', () => {
  longPressTimer = setTimeout(() => {
    showMetadata(song);
  }, LONG_PRESS_TIME);
});
li.addEventListener('touchend', () => clearTimeout(longPressTimer));


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
// Load Genre View
// --------------------
function loadGenreView() {
  genreListEl.innerHTML = ''; 

  const promises = types.map(lang =>
    fetch(`data/${lang}.json`)
      .then(res => res.json())
      .then(data => data.map(song => ({ ...song, folder: lang })))
      .catch(err => { 
        console.error(`Failed to load ${lang}.json`, err); 
        return []; 
      })
  );

  Promise.all(promises).then(results => {
    const allSongs = results.flat();

    const genreGroups = {};

    allSongs.forEach(song => {
      if (!song.genre) return;

     
      const genres = song.genre.split(',').map(g => g.trim().toLowerCase());

      genres.forEach(genre => {
        if (!genreGroups[genre]) genreGroups[genre] = [];
        genreGroups[genre].push(song);
      });
    });

    const sortedGenres = Object.keys(genreGroups).sort();

    sortedGenres.forEach(genre => {
      // Genre Title
      const genreTitle = document.createElement('div');
      genreTitle.classList.add('genre-title');
      genreTitle.textContent = genre.toUpperCase();
      genreListEl.appendChild(genreTitle);

      // Songs List
      const genreSongsEl = document.createElement('ul');
      genreSongsEl.classList.add('genre-songs');
      genreSongsEl.style.display = 'none';
      genreListEl.appendChild(genreSongsEl);

      genreTitle.addEventListener('click', () => {
        genreSongsEl.style.display = genreSongsEl.style.display === 'block' ? 'none' : 'block';
      });

      // Songs
      genreGroups[genre]
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((song, index) => {
          const li = document.createElement('li');
          li.classList.add('music-item');
          li.setAttribute('data-index', index);
          li.innerHTML = `<div class="info"><span class="title">${song.name}</span></div>`;

          // Long Press (1 second)
li.addEventListener('mousedown', () => {
  longPressTimer = setTimeout(() => {
    showMetadata(song);
  }, LONG_PRESS_TIME);
});
li.addEventListener('mouseup', () => clearTimeout(longPressTimer));
li.addEventListener('mouseleave', () => clearTimeout(longPressTimer));

/* Mobile */
li.addEventListener('touchstart', () => {
  longPressTimer = setTimeout(() => {
    showMetadata(song);
  }, LONG_PRESS_TIME);
});
li.addEventListener('touchend', () => clearTimeout(longPressTimer));

          li.addEventListener('click', (e) => {
            e.stopPropagation();
            filteredData = genreGroups[genre];
            musicData = filteredData;
            currentIndex = index;
            playSong(index);
          });

          genreSongsEl.appendChild(li);
        });
    });
  });
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
// -------- Long Press (1 second) --------
li.addEventListener('mousedown', () => {
  longPressTimer = setTimeout(() => {
    showMetadata(song);
  }, LONG_PRESS_TIME);
});

li.addEventListener('mouseup', () => {
  clearTimeout(longPressTimer);
});

li.addEventListener('mouseleave', () => {
  clearTimeout(longPressTimer);
});

/* Mobile */
li.addEventListener('touchstart', () => {
  longPressTimer = setTimeout(() => {
    showMetadata(song);
  }, LONG_PRESS_TIME);
});

li.addEventListener('touchend', () => {
  clearTimeout(longPressTimer);
});

    li.addEventListener('click', () => playSong(index));
    musicListEl.appendChild(li);
  });

  if (!hasSeenAnimation) {
    localStorage.setItem('hasSeenFadeInAnimation', 'true');
  }

  const songCountEl = document.getElementById('songCount');
  if (songCountEl) {
    animateCountUp(songCountEl, filteredData.length, 1000);
  }
}

// --------------------
// Play Song
// --------------------
function playSong(index) {
  currentIndex = index;
  const song = filteredData[index];

  // Set cover (show/hide + fallback)
  if (fsCover) {
    if (song && song.cover) {
      fsCover.style.display = 'block';
      fsCover.src = `covers/${song.folder}/${song.cover}`;
      fsCover.alt = `${song.name} cover`;
    } else {
      fsCover.style.display = 'block';
      fsCover.src = getRandomFallbackCover(); 
      fsCover.alt = 'Cover not available';
    }
  }

  fsAudio.src = `songs/${song.folder}/${song.file}`;
  fsAudio.play();
  if ('mediaSession' in navigator) {
    const artworkSrc = (song && song.cover)
  ? `covers/${song.folder}/${song.cover}`
  : getRandomFallbackCover();

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.name || '',
      artist: song.artist || '',
      album: song.album || '',
      artwork: [
        { src: artworkSrc, sizes: '250x250', type: 'image/png' }
      ]
    });
  }
  isPlaying = true;
  updateMiniPlayer(song.name);
  updateFullscreenPlayer(song.name);
  updatePlayButton();


  document.querySelectorAll('.music-item.playing').forEach(el => el.classList.remove('playing'));

  // All Songs view
  const currentPlayingEl = musicListEl.querySelector(`.music-item[data-index="${index}"]`);
  if (currentPlayingEl) currentPlayingEl.classList.add('playing');

  // Folder view
  const folderLists = document.querySelectorAll('.folder-songs');
  folderLists.forEach(list => {
    const songEl = list.querySelector(`.music-item[data-index="${index}"]`);
    if (songEl) songEl.classList.add('playing');
  });

  // Genre view
  const genreLists = document.querySelectorAll('.genre-songs');
  genreLists.forEach(list => {
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
miniPlayer.addEventListener('click', () => {
  fullscreenPlayer.style.display = 'flex';
  miniPlayer.style.display = 'none';

  document.querySelector('.site-header').style.display = 'none';
  document.querySelector('.tabs').style.display = 'none';

  allSongsView.style.display = 'none';
  foldersView.style.display = 'none';
  genreView.style.display = 'none';
});


// Close fullscreen
fsCloseBtn.addEventListener('click', () => {
  fullscreenPlayer.style.display = 'none';
  miniPlayer.style.display = 'flex';
  document.querySelector('.site-header').style.display = 'block';
  document.querySelector('.tabs').style.display = 'flex';

  allSongsView.style.display = 'none';
  foldersView.style.display = 'none';
  genreView.style.display = 'none';


  if (currentView === 'all') {
    allSongsView.style.display = 'block';

    const currentSongEl = musicListEl.querySelector(`.music-item[data-index="${currentIndex}"]`);
    if (currentSongEl) {
      currentSongEl.scrollIntoView({ behavior: 'auto', block: 'center' });
    }

  } else if (currentView === 'folders') {
    foldersView.style.display = 'block';

    const folderLists = document.querySelectorAll('.folder-songs');
    folderLists.forEach(list => {
      const songEl = list.querySelector(`.music-item[data-index="${currentIndex}"]`);
      if (songEl) {
        songEl.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    });

  } else if (currentView === 'genre') {
    genreView.style.display = 'block';

    const genreLists = document.querySelectorAll('.genre-songs');
    genreLists.forEach(list => {
      const songEl = list.querySelector(`.music-item[data-index="${currentIndex}"]`);
      if (songEl) {
        songEl.scrollIntoView({ behavior: 'auto', block: 'center' });
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
let isDraggingProgress = false;

function seekByX(clientX) {
  if (!fsAudio.duration) return;

  const rect = progressBarContainer.getBoundingClientRect();
  const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
  const percent = x / rect.width;

  fsAudio.currentTime = percent * fsAudio.duration;
  progressFilled.style.width = (percent * 100) + '%';
}

/* Click */
progressBarContainer.addEventListener('click', (e) => {
  seekByX(e.clientX);
});

/* Desktop drag */
progressBarContainer.addEventListener('mousedown', (e) => {
  isDraggingProgress = true;
  seekByX(e.clientX);
});

document.addEventListener('mousemove', (e) => {
  if (isDraggingProgress) seekByX(e.clientX);
});

document.addEventListener('mouseup', () => {
  isDraggingProgress = false;
});

/* Mobile swipe */
progressBarContainer.addEventListener('touchstart', (e) => {
  isDraggingProgress = true;
  seekByX(e.touches[0].clientX);
});

document.addEventListener('touchmove', (e) => {
  if (isDraggingProgress) seekByX(e.touches[0].clientX);
});

document.addEventListener('touchend', () => {
  isDraggingProgress = false;
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
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
 
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    currentView = tab.dataset.view;

    // View switch logic
    if (currentView === 'all') {
      allSongsView.style.display = 'block';
      foldersView.style.display = 'none';
      genreView.style.display = 'none';
      loadAllSongs();

    } else if (currentView === 'folders') {
      allSongsView.style.display = 'none';
      foldersView.style.display = 'block';
      genreView.style.display = 'none';
      loadFolders();

    } else if (currentView === 'genre') {
      allSongsView.style.display = 'none';
      foldersView.style.display = 'none';
      genreView.style.display = 'block';
      loadGenreView();
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
  if (target <= 0) {
    element.textContent = `Total Songs: 0`;
    return;
  }
  const stepTime = Math.max(10, Math.abs(Math.floor(duration / target)));

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
// ArrowLeft → Previous Song
// ArrowRight → Next Song
// --------------------
document.addEventListener('keydown', (e) => {
  const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

  if (!isInput) {
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;

      case 'ArrowRight':
        e.preventDefault();
        playNext();
        break;

      case 'ArrowLeft':
        e.preventDefault();
        playPrev();
        break;
    }
  }
});

// --------------------
// Media Session API — Enable Bluetooth next/prev buttons
// --------------------
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', togglePlay);
  navigator.mediaSession.setActionHandler('pause', togglePlay);
  navigator.mediaSession.setActionHandler('previoustrack', playPrev);
  navigator.mediaSession.setActionHandler('nexttrack', playNext);
}

function showMetadata(song) {
  metaName.textContent = song.name || 'Unknown';
  metaArtist.textContent = song.artist || 'Unknown';
  metaAlbum.textContent = song.album || 'Unknown';

 metaCover.src = song.cover 
  ? `covers/${song.folder}/${song.cover}` 
  : getRandomFallbackCover();

  metaModal.style.display = 'flex';
}

metaClose.addEventListener('click', () => {
  metaModal.style.display = 'none';
});

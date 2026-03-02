// -------------------
// Variables
// -------------------
const types = ['anime','arabic','bangla','edit audio','electronic','english','hindi','instrumental','others','phonk','remix','slowed-reverbed','z'];
let currentView = 'all';
let musicData = [];
let filteredData = [];
let currentIndex = null;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 'none';
let longPressTimer = null;
let playHistory = [];
let futureStack = [];
let currentSongUID = null;

const LONG_PRESS_TIME = 500;
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
const fsCover = document.getElementById('fs-cover');

if (fsCover) {
  fsCover.onerror = () => {
    fsCover.src = getRandomFallbackCover();
  };

  if (!fsCover.src) {
    fsCover.style.display = 'none';
  }
}
const fallbackCovers = [
  'covers/5.jpg',
'covers/6.jpg',
'covers/7.jpg',
'covers/8.jpg',
'covers/9.jpg',
'covers/10.jpg',
'covers/5.png',
'covers/12.jpg',
'covers/13.jpg',
'covers/14.jpg',
'covers/15.jpg',
'covers/16.jpg',
'covers/17.jpg',
'covers/18.jpg',
'covers/19.jpg',
'covers/20.jpg',
'covers/21.jpg',
'covers/22.jpg',
'covers/23.jpg'
];

function getRandomFallbackCover() {
  return fallbackCovers[Math.floor(Math.random() * fallbackCovers.length)];
}

// --------------------
// Long Press Setup Function
// --------------------
function setupLongPressForItem(li, song) {
  let pressTimer = null;
  let touchMoved = false;
  let startX = 0;
  let startY = 0;
  const MOVE_THRESHOLD = 10; 
  
  // Desktop
  li.addEventListener('mousedown', (e) => {
    pressTimer = setTimeout(() => {
      showMetadata(song);
    }, LONG_PRESS_TIME);
  });
  
  li.addEventListener('mouseup', () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  });
  
  li.addEventListener('mouseleave', () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  });
  
  // Mobile - with proper touch handling
  li.addEventListener('touchstart', (e) => {
    touchMoved = false;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    
    pressTimer = setTimeout(() => {
      if (!touchMoved) {
        showMetadata(song);
      }
    }, LONG_PRESS_TIME);
  });
  
  li.addEventListener('touchmove', (e) => {
    if (!pressTimer) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = Math.abs(currentX - startX);
    const deltaY = Math.abs(currentY - startY);
    
    // If user moved finger significantly (scrolling), cancel long press
    if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
      touchMoved = true;
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  });
  
  li.addEventListener('touchend', () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  });
  
  li.addEventListener('touchcancel', () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  });
}

// --------------------
// Show Metadata Modal
// --------------------
function showMetadata(song) {
  if (song.cover) {
    metaCover.src = `covers/${song.folder}/${song.cover}`;
    metaCover.onerror = () => {
      metaCover.src = getRandomFallbackCover();
    };
  } else {
    metaCover.src = getRandomFallbackCover();
  }
  
  metaName.textContent = song.name || 'Unknown';
  metaArtist.textContent = `Artist: ${song.artist || 'Unknown'}`;
  metaAlbum.textContent = `Album: ${song.album || 'Unknown'}`;
  metaModal.style.display = 'flex';
}

// Close metadata modal
metaClose.addEventListener('click', () => {
  metaModal.style.display = 'none';
});

// Close modal when clicking outside
metaModal.addEventListener('click', (e) => {
  if (e.target === metaModal) {
    metaModal.style.display = 'none';
  }
});

// --------------------
// Load All Songs (A-Z) using Promise.all
// --------------------
function loadAllSongs() {
  const promises = types.map(lang =>
    fetch(`data/${lang}.json`)
      .then(res => res.json())
      .then(data => data.map(song => ({   ...song,   folder: lang,   uid: `${lang}/${song.file}` })))
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

// --------------------
// Toggle Folder (Updated)
// --------------------
function toggleFolder(folderName, folderEl) {
  let listEl = folderEl.nextElementSibling;

  if (listEl && listEl.classList.contains('folder-songs')) {
    listEl.style.display = listEl.style.display === 'block' ? 'none' : 'block';
    

    if (listEl.style.display === 'block' && currentSongUID) {
      const songFolder = currentSongUID.split('/')[0];
      if (songFolder === folderName) {
        setTimeout(() => {
          const currentSongEl = listEl.querySelector(`.music-item[data-uid="${currentSongUID}"]`);
          if (currentSongEl) {
            currentSongEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
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
        .map(s => ({ ...s, folder: folderName, uid: `${folderName}/${s.file}` }))
        .sort((a, b) => a.name.localeCompare(b.name));

      folderSongs.forEach((song, index) => {
        const li = document.createElement('li');
        li.classList.add('music-item');
        li.setAttribute('data-uid', song.uid);
        li.innerHTML = `<div class="info"><span class="title">${song.name}</span></div>`;

        setupLongPressForItem(li, song);

        // 🎯 HIGHLIGHT currently playing song
        if (song.uid === currentSongUID) {
          li.classList.add('playing');
        }

        li.addEventListener('click', (e) => {
          e.stopPropagation();
          musicData = folderSongs;
          filteredData = [...musicData];
          currentIndex = index;
          playSong(index);

          listEl.querySelectorAll('.music-item').forEach(el => el.classList.remove('playing'));
          li.classList.add('playing');
        });

        listEl.appendChild(li);
      });

      listEl.style.display = 'block';
      

      if (currentSongUID) {
        const songFolder = currentSongUID.split('/')[0];
        if (songFolder === folderName) {
          setTimeout(() => {
            const currentSongEl = listEl.querySelector(`.music-item[data-uid="${currentSongUID}"]`);
            if (currentSongEl) {
              currentSongEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }
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
      .then(data => data.map(song => ({ ...song, folder: lang, uid: `${lang}/${song.file}` })))
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
      const genreTitle = document.createElement('div');
      genreTitle.classList.add('genre-title');
      genreTitle.textContent = genre.toUpperCase();
      genreListEl.appendChild(genreTitle);

      const genreSongsEl = document.createElement('ul');
      genreSongsEl.classList.add('genre-songs');
      genreSongsEl.style.display = 'none';
      genreListEl.appendChild(genreSongsEl);

      genreTitle.addEventListener('click', () => {
        genreSongsEl.style.display = genreSongsEl.style.display === 'block' ? 'none' : 'block';
      });

      genreGroups[genre]
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((song, index) => {
          const li = document.createElement('li');
          li.classList.add('music-item');
          li.setAttribute('data-uid', song.uid);
          li.innerHTML = `<div class="info"><span class="title">${song.name}</span></div>`;

          setupLongPressForItem(li, song);

          // 🎯 HIGHLIGHT currently playing song
          if (song.uid === currentSongUID) {
            li.classList.add('playing');
          }

          li.addEventListener('click', (e) => {
            e.stopPropagation();
            filteredData = genreGroups[genre];
            musicData = filteredData;
            currentIndex = index;
            playSong(index);

            // Update highlight
            genreSongsEl.querySelectorAll('.music-item').forEach(el => el.classList.remove('playing'));
            li.classList.add('playing');
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

    li.setAttribute('data-uid', song.uid);
    li.innerHTML = `
      <div class="info">
        <span class="title">${song.name}</span>
        <span style="font-size:12px; color:rgba(255,255,255,0.5); margin-left:8px;">[${song.folder}]</span>
      </div>`;
    if (song.uid === currentSongUID) {
  li.classList.add('playing');
}



    
    // Setup long press with new function
    setupLongPressForItem(li, song);

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
function playSong(index, resetFuture = true) {
  currentIndex = index;
  const song = filteredData[index];
  currentSongUID = song.uid;

  if (isShuffle && resetFuture) futureStack = [];

  // 🎵 Set Audio Source
  fsAudio.src = `songs/${song.folder}/${song.file}`;
  fsAudio.play();

  // 🎵 Set Cover
  if (fsCover) {
    fsCover.src = song.cover 
      ? `covers/${song.folder}/${song.cover}` 
      : getRandomFallbackCover();
  }

  // 🎵 Update UI
  updateMiniPlayer(song.name);
  updateFullscreenPlayer(song.name);
  updatePlayButton();

  // 🎵 Highlight Playing Song
  document.querySelectorAll('.music-item.playing')
    .forEach(el => el.classList.remove('playing'));

  document.querySelectorAll(`.music-item[data-uid="${currentSongUID}"]`)
    .forEach(el => el.classList.add('playing'));

  // 🎵 ANDROID NOTIFICATION FIX (Media Session Metadata)
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.name || 'Unknown',
      artist: song.artist || 'Unknown',
      album: song.album || 'Unknown',
      artwork: [
        {
          src: song.cover
            ? `covers/${song.folder}/${song.cover}`
            : getRandomFallbackCover(),
          sizes: '512x512',
          type: 'image/jpeg'
        }
      ]
    });
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
miniPlayer.addEventListener('click', () => {
  fullscreenPlayer.style.display = 'flex';
  miniPlayer.style.display = 'none';

  document.querySelector('.site-header').style.display = 'none';
  document.querySelector('.tabs').style.display = 'none';

  allSongsView.style.display = 'none';
  foldersView.style.display = 'none';
  genreView.style.display = 'none';
});


// --------------------
// Close fullscreen (Updated - no smooth animation)
// --------------------
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
    const currentSongEl = document.querySelector(`.music-item[data-uid="${currentSongUID}"]`);
    if (currentSongEl) {

      currentSongEl.scrollIntoView({ behavior: 'auto', block: 'center' });
    }
  } else if (currentView === 'folders') {
    foldersView.style.display = 'block';
    
    if (currentSongUID) {
      const folderName = currentSongUID.split('/')[0];
      const folderEl = Array.from(document.querySelectorAll('.folder-title'))
        .find(el => el.textContent === folderName);
      
      if (folderEl) {
        let listEl = folderEl.nextElementSibling;
        

        if (!listEl || !listEl.classList.contains('folder-songs') || listEl.style.display === 'none') {
          toggleFolder(folderName, folderEl);
          

          setTimeout(() => {
            listEl = folderEl.nextElementSibling;
            if (listEl && listEl.classList.contains('folder-songs')) {
              const currentSongEl = listEl.querySelector(`.music-item[data-uid="${currentSongUID}"]`);
              if (currentSongEl) {

                currentSongEl.scrollIntoView({ behavior: 'auto', block: 'center' });
                

                document.querySelectorAll('.folder-songs .music-item').forEach(el => {
                  el.classList.remove('playing');
                });
                currentSongEl.classList.add('playing');
              }
            }
          }, 100);
        } else {

          const currentSongEl = listEl.querySelector(`.music-item[data-uid="${currentSongUID}"]`);
          if (currentSongEl) {

            currentSongEl.scrollIntoView({ behavior: 'auto', block: 'center' });
            

            document.querySelectorAll('.folder-songs .music-item').forEach(el => {
              el.classList.remove('playing');
            });
            currentSongEl.classList.add('playing');
          }
        }
      }
    }
  } else if (currentView === 'genre') {
    genreView.style.display = 'block';
    
    if (currentSongUID) {
      const genreTitle = Array.from(document.querySelectorAll('.genre-title'))
        .find(el => {
          const genreSongs = el.nextElementSibling;
          if (genreSongs && genreSongs.classList.contains('genre-songs')) {
            return genreSongs.querySelector(`.music-item[data-uid="${currentSongUID}"]`);
          }
          return false;
        });
      
      if (genreTitle) {
        const genreSongsEl = genreTitle.nextElementSibling;
        genreSongsEl.style.display = 'block';
        
        const currentSongEl = genreSongsEl.querySelector(`.music-item[data-uid="${currentSongUID}"]`);
        if (currentSongEl) {

          currentSongEl.scrollIntoView({ behavior: 'auto', block: 'center' });
          

          document.querySelectorAll('.genre-songs .music-item').forEach(el => {
            el.classList.remove('playing');
          });
          currentSongEl.classList.add('playing');
        }
      }
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
function playNext() {
  if (isShuffle) {
    if (currentIndex !== null) playHistory.push(currentIndex);
    let nextIndex;
    if (futureStack.length > 0) {
      nextIndex = futureStack.shift();
    } else {
      do {
        nextIndex = Math.floor(Math.random() * filteredData.length);
      } while (nextIndex === currentIndex && filteredData.length > 1);
    }
    currentIndex = nextIndex;
  } else {
    currentIndex = (currentIndex + 1) % filteredData.length;
  }
  playSong(currentIndex, false);
}



function playPrev() {
  if (isShuffle && playHistory.length > 0) {
    if (currentIndex !== null) futureStack.unshift(currentIndex);
    currentIndex = playHistory.pop();
  } else {
    currentIndex = (currentIndex - 1 + filteredData.length) % filteredData.length;
  }
  playSong(currentIndex, false);
}



fsNextBtn.addEventListener('click', playNext);
fsPrevBtn.addEventListener('click', playPrev);

// --------------------
// Shuffle & Repeat
// --------------------
fsShuffleBtn.addEventListener('click', ()=>{
  isShuffle = !isShuffle;

  if (!isShuffle) {
    playHistory = [];
  }

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
function animateCountUp(element, target, duration = 6700) {
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const current = Math.floor(progress * target);
    element.textContent = `Total Songs: ${current}`;
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = `Total Songs: ${target}`;
    }
  }

  requestAnimationFrame(step);
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


const infoLogo = document.getElementById('info-logo');
const aboutModal = document.getElementById('about-modal');
const aboutClose = document.getElementById('about-close');

// Open modal when clicking icon
infoLogo.addEventListener('click', () => {
  aboutModal.style.display = 'flex';
});

// Close modal with Close button
aboutClose.addEventListener('click', () => {
  aboutModal.style.display = 'none';
});

// Close modal when clicking outside the card
aboutModal.addEventListener('click', (e) => {
  if (e.target === aboutModal) {
    aboutModal.style.display = 'none';
  }
});

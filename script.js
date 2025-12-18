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

// Detect device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// --------------------
// Load All Songs
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

        li.addEventListener('mousedown', () => {
          longPressTimer = setTimeout(() => {
            showMetadata(song);
          }, LONG_PRESS_TIME);
        });
        li.addEventListener('mouseup', () => clearTimeout(longPressTimer));
        li.addEventListener('mouseleave', () => clearTimeout(longPressTimer));

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
          li.setAttribute('data-index', index);
          li.innerHTML = `<div class="info"><span class="title">${song.name}</span></div>`;

          li.addEventListener('mousedown', () => {
            longPressTimer = setTimeout(() => {
              showMetadata(song);
            }, LONG_PRESS_TIME);
          });
          li.addEventListener('mouseup', () => clearTimeout(longPressTimer));
          li.addEventListener('mouseleave', () => clearTimeout(longPressTimer));

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

    li.addEventListener('mousedown', () => {
      longPressTimer = setTimeout(() => {
        showMetadata(song);
      }, LONG_PRESS_TIME);
    });
    li.addEventListener('mouseup', () => clearTimeout(longPressTimer));
    li.addEventListener('mouseleave', () => clearTimeout(longPressTimer));

    li.addEventListener('touchstart', () => {
      longPressTimer = setTimeout(() => {
        showMetadata(song);
      }, LONG_PRESS_TIME);
    });
    li.addEventListener('touchend', () => clearTimeout(longPressTimer));

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

  // Fullscreen cover
  if (fsCover) {
    if (song && song.cover) {
      fsCover.style.display = 'block';
      fsCover.src = `covers/${song.folder}/${song.cover}`;
      fsCover.alt = `${song.name} cover`;
    } else {
      fsCover.style.display = 'block';
      fsCover.src = 'covers/aassdd.png'; 
      fsCover.alt = 'Cover not available';
    }
  }

  // PC mini player cover and info
  if (!isMobile) {
    const pcCover = document.getElementById('pc-cover');
    const pcArtist = document.getElementById('pc-artist');
    
    if (pcCover) {
      if (song && song.cover) {
        pcCover.src = `covers/${song.folder}/${song.cover}`;
        pcCover.style.display = 'block';
      } else {
        pcCover.src = 'covers/aassdd.png';
        pcCover.style.display = 'block';
      }
    }
    
    if (pcArtist) {
      pcArtist.textContent = song.artist || 'Unknown Artist';
    }
  }

  fsAudio.src = `songs/${song.folder}/${song.file}`;
  fsAudio.play();
  
  if ('mediaSession' in navigator) {
    const artworkSrc = (song && song.cover) ? `covers/${song.folder}/${song.cover}` : 'covers/aassdd.png';
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
  updatePCPlayer(song.name);
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

  const genreLists = document.querySelectorAll('.genre-songs');
  genreLists.forEach(list => {
    const songEl = list.querySelector(`.music-item[data-index="${index}"]`);
    if (songEl) songEl.classList.add('playing');
  });
}

// --------------------
// Initialize PC Player
// --------------------
function initPCPlayer() {
  if (isMobile) return;
  
miniPlayer.innerHTML = `
  <div style="display: flex; flex-direction: column; width: 100%; height: 100%; padding: 10px 30px; justify-content: center;">
    <!-- Progress Bar on TOP -->
    <div style="width: 100%; margin-bottom: 15px;">
      <div id="pc-progress-container" style="width: 100%; height: 8px; background: rgba(255,255,255,0.15); border-radius: 4px; cursor: pointer; position: relative;">
        <div id="pc-progress-filled" style="height: 100%; width: 0%; background: linear-gradient(90deg, #ff6b6b, #583D91); border-radius: 4px;"></div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 8px;">
        <span id="pc-current-time" style="font-size: 12px; color: rgba(255,255,255,0.8);">0:00</span>
        <span id="pc-duration" style="font-size: 12px; color: rgba(255,255,255,0.8);">0:00</span>
      </div>
    </div>
    
    <!-- Main Content - Cover on Left, Buttons in Center -->
    <div style="display: flex; align-items: center; width: 100%; justify-content: space-between;">
      <!-- Left: Cover Image and Song Info -->
      <div style="flex: 1; display: flex; align-items: center; gap: 15px; min-width: 0;">
        <!-- Cover Image -->
        <img id="pc-cover" src="covers/aassdd.png" alt="Cover" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover; flex-shrink: 0;">
        
        <!-- Song Info -->
        <div style="min-width: 0;">
          <div id="pc-title" style="font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: white; font-weight: 500; margin-bottom: 3px;">No song playing</div>
          <div id="pc-artist" style="font-size: 13px; color: rgba(255,255,255,0.7); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Unknown Artist</div>
        </div>
      </div>
      
      <!-- Center: Control Buttons (Fixed shadow and icon alignment) -->
      <div style="display: flex; align-items: center; gap: 15px; flex-wrap: nowrap; justify-content: center; flex: 1;">
        <button id="pc-shuffle" style="width:50px; height:40px; border-radius:22px; display:flex; justify-content:center; align-items:center; cursor:pointer; background: linear-gradient(135deg, #ff6b6b, #fcb045); border:none; box-shadow: 0 2px 6px rgba(0,0,0,0.3); transition: all 0.3s ease; font-size:18px; color:white; position: relative;" title="Shuffle">
          <i class="fas fa-random" style="position: relative; top: 0px;"></i>
        </button>
        <button id="pc-prev" style="width:50px; height:40px; border-radius:22px; display:flex; justify-content:center; align-items:center; cursor:pointer; background: linear-gradient(135deg, #ff6b6b, #fcb045); border:none; box-shadow: 0 2px 6px rgba(0,0,0,0.3); transition: all 0.3s ease; font-size:18px; color:white; position: relative;" title="Previous">
          <i class="fas fa-backward" style="position: relative; top: 0px;"></i>
        </button>
        <button id="pc-play" style="width:74px; height:48px; font-size:22px; border-radius:26px; background: linear-gradient(135deg, #583D91, #7E5CD9); box-shadow: 0 3px 10px rgba(88,61,145,0.5); display:flex; justify-content:center; align-items:center; transition: all 0.3s ease; border:none; color:white; cursor:pointer; position: relative;" title="Play/Pause">
          <i class="fas fa-play" id="pc-play-icon" style="position: relative; top: 0px; left: 1px;"></i>
        </button>
        <button id="pc-next" style="width:50px; height:40px; border-radius:22px; display:flex; justify-content:center; align-items:center; cursor:pointer; background: linear-gradient(135deg, #ff6b6b, #fcb045); border:none; box-shadow: 0 2px 6px rgba(0,0,0,0.3); transition: all 0.3s ease; font-size:18px; color:white; position: relative;" title="Next">
          <i class="fas fa-forward" style="position: relative; top: 0px;"></i>
        </button>
        <button id="pc-repeat" style="width:50px; height:40px; border-radius:22px; display:flex; justify-content:center; align-items:center; cursor:pointer; background: linear-gradient(135deg, #ff6b6b, #fcb045); border:none; box-shadow: 0 2px 6px rgba(0,0,0,0.3); transition: all 0.3s ease; font-size:18px; color:white; position: relative;" title="Repeat">
          <i class="fas fa-redo" style="position: relative; top: 0px;"></i>
        </button>
      </div>
      
      <!-- Right: Volume Control -->
      <div style="flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 6px; margin-left: 10px;">
        <i class="fas fa-volume-down" style="font-size: 12px; color: rgba(255,255,255,0.7);"></i>
        <input type="range" id="pc-volume" min="0" max="1" step="0.01" value="1.0" style="width: 80px; cursor: pointer;">
        <i class="fas fa-volume-up" style="font-size: 12px; color: rgba(255,255,255,0.7);"></i>
      </div>
    </div>
  </div>
`;
  
  // PC Controls Event Listeners
  const pcShuffleBtn = document.getElementById('pc-shuffle');
  const pcPrevBtn = document.getElementById('pc-prev');
  const pcPlayBtn = document.getElementById('pc-play');
  const pcNextBtn = document.getElementById('pc-next');
  const pcRepeatBtn = document.getElementById('pc-repeat');
  const pcVolumeSlider = document.getElementById('pc-volume');
  const pcProgressContainer = document.getElementById('pc-progress-container');
  
  pcShuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    pcShuffleBtn.style.color = isShuffle ? '#ff6b6b' : 'white';
    fsShuffleBtn.style.color = isShuffle ? '#ff6b6b' : 'white';
  });
  
  pcPrevBtn.addEventListener('click', playPrev);
  pcNextBtn.addEventListener('click', playNext);
  
  pcPlayBtn.addEventListener('click', () => {
    togglePlay();
  });
  
  pcRepeatBtn.addEventListener('click', () => {
    if (repeatMode === 'none') repeatMode = 'all';
    else if (repeatMode === 'all') repeatMode = 'one';
    else repeatMode = 'none';
    updateRepeatUI();
    updatePCRepeatUI();
  });
  
  pcVolumeSlider.addEventListener('input', () => {
    fsAudio.volume = pcVolumeSlider.value;
    volumeSlider.value = pcVolumeSlider.value;
  });
  
  pcProgressContainer.addEventListener('click', (e) => {
    const rect = pcProgressContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    fsAudio.currentTime = percent * fsAudio.duration;
  });
  
  // PC progress initial update
  updatePCProgress();
  
  // Volume sync
  fsAudio.volume = 1.0;
  if (pcVolumeSlider) pcVolumeSlider.value = 1.0;
}

// --------------------
// Update PC Player
// --------------------
function updatePCPlayer(title) {
  if (!isMobile) {
    const pcTitle = document.getElementById('pc-title');
    if (pcTitle) pcTitle.textContent = title;
  }
}

function updatePCPlayButton() {
  if (!isMobile) {
    const pcPlayIcon = document.getElementById('pc-play-icon');
    if (pcPlayIcon) {
      pcPlayIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
  }
}

function updatePCRepeatUI() {
  if (!isMobile) {
    const pcRepeatBtn = document.getElementById('pc-repeat');
    if (pcRepeatBtn) {
      pcRepeatBtn.style.color = repeatMode === 'none' ? 'white' : 
                                (repeatMode === 'all' ? '#fcb045' : '#ff6b6b');
    }
  }
}

function updatePCProgress() {
  if (!isMobile && fsAudio.duration) {
    const pcCurrentTime = document.getElementById('pc-current-time');
    const pcDuration = document.getElementById('pc-duration');
    const pcProgressFilled = document.getElementById('pc-progress-filled');
    
    if (pcCurrentTime) pcCurrentTime.textContent = formatTime(fsAudio.currentTime);
    if (pcDuration) pcDuration.textContent = formatTime(fsAudio.duration);
    if (pcProgressFilled) {
      const percent = (fsAudio.currentTime / fsAudio.duration) * 100;
      pcProgressFilled.style.width = percent + '%';
    }
  }
}

// --------------------
// Update UI
// --------------------
function updateFullscreenPlayer(title){ 
  fsTitle.textContent = title; 
}

function updatePlayButton(){
  if(isPlaying){
    fsPlayBtn.innerHTML = '<i class="fa fa-pause"></i>';
    if (isMobile) miniPlayBtn.innerHTML = '<i class="fa fa-pause"></i>';
  } else {
    fsPlayBtn.innerHTML = '<i class="fa fa-play"></i>';
    if (isMobile) miniPlayBtn.innerHTML = '<i class="fa fa-play"></i>';
  }
  updatePCPlayButton();
}

// --------------------
// Mini → Fullscreen (Mobile Only)
// --------------------
if (isMobile) {
  miniPlayer.addEventListener('click', () => {
    fullscreenPlayer.style.display = 'flex';
    miniPlayer.style.display = 'none';

    document.querySelector('.site-header').style.display = 'none';
    document.querySelector('.tabs').style.display = 'none';

    allSongsView.style.display = 'none';
    foldersView.style.display = 'none';
    genreView.style.display = 'none';
  });
} else {
  // PC-তে mini player ক্লিক করলে কিছু না হোক
  miniPlayer.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// Close fullscreen
fsCloseBtn.addEventListener('click', () => {
  if (!isMobile) return;
  
  fullscreenPlayer.style.display = 'none';
  miniPlayer.style.display = 'flex';
  document.querySelector('.site-header').style.display = 'block';
  document.querySelector('.tabs').style.display = 'flex';

  if (currentView === 'all') {
    allSongsView.style.display = 'block';
    const currentSongEl = musicListEl.querySelector(`.music-item[data-index="${currentIndex}"]`);
    if (currentSongEl) currentSongEl.scrollIntoView({ behavior: 'auto', block: 'center' });
  } else if (currentView === 'folders') {
    foldersView.style.display = 'block';
    const folderLists = document.querySelectorAll('.folder-songs');
    folderLists.forEach(list => {
      const songEl = list.querySelector(`.music-item[data-index="${currentIndex}"]`);
      if (songEl) songEl.scrollIntoView({ behavior: 'auto', block: 'center' });
    });
  } else if (currentView === 'genre') {
    genreView.style.display = 'block';
    const genreLists = document.querySelectorAll('.genre-songs');
    genreLists.forEach(list => {
      const songEl = list.querySelector(`.music-item[data-index="${currentIndex}"]`);
      if (songEl) songEl.scrollIntoView({ behavior: 'auto', block: 'center' });
    });
  }
});

// --------------------
// Play/Pause
// --------------------
function togglePlay() {
  if(isPlaying){ 
    fsAudio.pause(); 
  } else { 
    fsAudio.play(); 
  }
}

fsPlayBtn.addEventListener('click', togglePlay);
if (isMobile) {
  miniPlayBtn.addEventListener('click', (e)=>{ 
    e.stopPropagation(); 
    togglePlay(); 
  });
}

fsAudio.addEventListener('play', ()=>{ 
  isPlaying = true; 
  updatePlayButton(); 
  updatePCProgress();
});

fsAudio.addEventListener('pause', ()=>{ 
  isPlaying = false; 
  updatePlayButton(); 
  updatePCProgress();
});

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
  updatePCRepeatUI();
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
    updatePCProgress();
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

progressBarContainer.addEventListener('click', (e) => {
  seekByX(e.clientX);
});

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
  if (!isMobile) {
    const pcVolumeSlider = document.getElementById('pc-volume');
    if (pcVolumeSlider) pcVolumeSlider.value = volumeSlider.value;
  }
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
// Metadata
// --------------------
function showMetadata(song) {
  metaName.textContent = song.name || 'Unknown';
  metaArtist.textContent = song.artist || 'Unknown';
  metaAlbum.textContent = song.album || 'Unknown';
  metaCover.src = song.cover ? `covers/${song.folder}/${song.cover}` : 'covers/aassdd.png';
  metaModal.style.display = 'flex';
}

metaClose.addEventListener('click', () => {
  metaModal.style.display = 'none';
});

// --------------------
// Initial Load
// --------------------
loadAllSongs();
initPCPlayer();

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
// Keyboard Shortcuts
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
// Media Session API
// --------------------
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', togglePlay);
  navigator.mediaSession.setActionHandler('pause', togglePlay);
  navigator.mediaSession.setActionHandler('previoustrack', playPrev);
  navigator.mediaSession.setActionHandler('nexttrack', playNext);
}

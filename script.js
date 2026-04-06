
function generateUID(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}


// -------------------
// Variables
// -------------------
const types = ['anime', 'arabic', 'bangla', 'edit audio', 'electronic', 'english', 'hindi', 'instrumental', 'others',
    'phonk', 'remix', 'slowed-reverbed', 'z'
];
let isDeepLinkLoad = false;
let currentView = 'all';
let hasAnimated = false;
let songQueue = [];
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
const fsCycleBtn = document.getElementById('fs-cycle');
const fsCycleIcon = document.getElementById('fs-cycle-icon');
const fsQueueControlBtn = document.getElementById('fs-queue-btn');
const fsCloseBtn = document.getElementById('fs-close');
const progressFilled = document.getElementById('progress-filled');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const progressBarContainer = document.getElementById('progress-bar-container');
const volumeSlider = document.getElementById('fs-volume');
const genreListEl = document.getElementById('genre-list');
const genreView = document.getElementById('genre-view');
const fsCover = document.getElementById('fs-cover');
const artistView = document.getElementById('artist-view');
const artistListEl = document.getElementById('artist-list');

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
            showSongOptions(song);
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
                showSongOptions(song);
            }
        }, LONG_PRESS_TIME);
    });

    li.addEventListener('touchmove', (e) => {
        if (!pressTimer) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = Math.abs(currentX - startX);
        const deltaY = Math.abs(currentY - startY);

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

function showSongOptions(song) {
    showMetadata(song);
}

function addToQueue(song) {
    songQueue.push(song);
    showQueueToast(song.name);
    renderQueuePanel();
    updateQueueBadge();
    saveQueue();
}

function saveQueue() {
    localStorage.setItem('songQueue', JSON.stringify(songQueue));
}

function showQueueToast(name) {
    let toast = document.getElementById('queue-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'queue-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = `"${name}" added to queue`;
    toast.classList.remove('hide');
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
    }, 2000);
}

function renderQueuePanel() {
    const list = document.getElementById('queue-list');
    if (!list) return;
    list.innerHTML = '';

    if (songQueue.length === 0) {
        list.innerHTML = '<li class="queue-empty">Queue is empty</li>';
        return;
    }

    songQueue.forEach((song, i) => {
        const li = document.createElement('li');
        li.classList.add('queue-item');
        li.dataset.index = i;

        li.innerHTML = `
      <span class="queue-drag-handle" data-handle="true"><i class="fas fa-grip-lines"></i></span>
      <span class="queue-item-name">${song.name}</span>
      <button class="queue-remove-btn"><i class="fas fa-times"></i></button>
    `;

        // Remove button
        li.querySelector('.queue-remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            songQueue.splice(i, 1);
            renderQueuePanel();
            updateQueueBadge();
            saveQueue();
        });

        // Click to play
        li.querySelector('.queue-item-name').addEventListener('click', () => {
            const qSong = songQueue.splice(i, 1)[0];
            const existingIdx = filteredData.findIndex(s => s.uid === qSong.uid);
            if (existingIdx !== -1) {
                currentIndex = existingIdx;
            }
            else {
                filteredData.splice(currentIndex + 1, 0, qSong);
                currentIndex = currentIndex + 1;
            }
            playSong(currentIndex);
            renderQueuePanel();
            updateQueueBadge();
            saveQueue();
        });

        // Desktop Drag
        li.setAttribute('draggable', 'true');
        li.addEventListener('dragstart', (e) => {
            li.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', i);
        });
        li.addEventListener('dragend', () => {
            li.classList.remove('dragging');
            document.querySelectorAll('.queue-item').forEach(el => el.classList.remove('drag-over'));
        });
        li.addEventListener('dragover', (e) => {
            e.preventDefault();
            document.querySelectorAll('.queue-item').forEach(el => el.classList.remove('drag-over'));
            li.classList.add('drag-over');
        });
        li.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const toIndex = parseInt(li.dataset.index);
            if (fromIndex !== toIndex) {
                const moved = songQueue.splice(fromIndex, 1)[0];
                songQueue.splice(toIndex, 0, moved);
                renderQueuePanel();
                updateQueueBadge();
                saveQueue();
            }
        });

        // Mobile Touch Drag
        const handle = li.querySelector('.queue-drag-handle');
        let isDragging = false;
        let touchClone = null;
        let dragFromIndex = null;

        handle.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            isDragging = true;
            dragFromIndex = i;
            const touch = e.touches[0];

            touchClone = li.cloneNode(true);
            touchClone.style.cssText = `
        position: fixed;
        z-index: 999999;
        width: ${li.offsetWidth}px;
        opacity: 0.9;
        pointer-events: none;
        border-radius: 10px;
        background: rgba(255,255,255,0.15);
        backdrop-filter: blur(6px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        top: ${touch.clientY - li.offsetHeight / 2}px;
        left: ${li.getBoundingClientRect().left}px;
        transition: none;
      `;
            document.body.appendChild(touchClone);
            li.style.opacity = '0.3';
        },
            {
                passive: true
            });

        handle.addEventListener('touchmove', (e) => {
            if (!isDragging || !touchClone) return;
            e.preventDefault();

            const touch = e.touches[0];
            touchClone.style.top = (touch.clientY - li.offsetHeight / 2) + 'px';

            touchClone.style.display = 'none';
            const el = document.elementFromPoint(touch.clientX, touch.clientY);
            touchClone.style.display = '';

            const hoverItem = el?.closest('.queue-item');
            document.querySelectorAll('.queue-item').forEach(el => el.classList.remove('drag-over'));
            if (hoverItem && hoverItem !== li) {
                hoverItem.classList.add('drag-over');
            }
        },
            {
                passive: false
            });

        handle.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;

            if (touchClone) {
                touchClone.remove();
                touchClone = null;
            }
            li.style.opacity = '1';

            const overItem = document.querySelector('.queue-item.drag-over');
            if (overItem) {
                const toIndex = parseInt(overItem.dataset.index);
                overItem.classList.remove('drag-over');
                if (dragFromIndex !== null && dragFromIndex !== toIndex) {
                    const moved = songQueue.splice(dragFromIndex, 1)[0];
                    songQueue.splice(toIndex, 0, moved);
                    renderQueuePanel();
                    updateQueueBadge();
                    saveQueue();
                }
            }
            dragFromIndex = null;
        });

        handle.addEventListener('touchcancel', () => {
            isDragging = false;
            if (touchClone) {
                touchClone.remove();
                touchClone = null;
            }
            li.style.opacity = '1';
            document.querySelectorAll('.queue-item').forEach(el => el.classList.remove('drag-over'));
            dragFromIndex = null;
        });

        list.appendChild(li);
    });
}

function toggleQueuePopup() {
    const popup = document.getElementById('queue-popup');
    if (!popup) return;
    if (popup.classList.contains('open')) {
        popup.classList.remove('open');
        fsCover.style.display = 'block';
    }
    else {
        renderQueuePanel();
        popup.classList.add('open');
        fsCover.style.display = 'none';
    }
}

function updateQueueBadge() {
    const badge = document.getElementById('queue-badge');
    if (!badge) return;
    badge.textContent = songQueue.length;
    badge.style.display = songQueue.length > 0 ? 'flex' : 'none';
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
    }
    else {
        metaCover.src = getRandomFallbackCover();
    }

    metaName.textContent = song.name || 'Unknown';
    metaName.style.cursor = 'pointer';
    metaName.onclick = () => {
        navigator.clipboard.writeText(song.name).then(() => {
            showToast('Name copied!');
        });
    };
    metaArtist.textContent = `Artist: ${song.artist || 'Unknown'}`;
    metaAlbum.textContent = `Album: ${song.album || 'Unknown'}`;
    const shareUrl = `${location.origin}${location.pathname}?song=${song.uid}`;
    const shareBtn = document.getElementById('meta-share');
    shareBtn.onclick = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('Link copied');
        });
    };
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


function showToast(message) {
    let toast = document.getElementById('queue-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'queue-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('hide');
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
    }, 2000);
}


// --------------------
// Load All Songs (A-Z) using Promise.all
// --------------------
function loadAllSongs() {
    const promises = types.map(lang =>
        fetch(`data/${lang}.json`)
            .then(res => res.json())
            .then(data => data.map(song => (
                {
                    ...song,
                    folder: lang,
                    path: `${lang}/${song.file}`,
                    uid: generateUID(`${lang}/${song.file}`)
                })))
            .catch(err => {
                console.error(`Failed to load ${lang}.json`, err);
                return [];
            })
    );

    return Promise.all(promises).then(results => {
        musicData = results.flat();
        musicData.forEach(song => {
            if (song.artist) song.artist = song.artist.replace(/\uFEFF/g, '').trim();
            if (song.name) song.name = song.name.replace(/\uFEFF/g, '').trim();
            if (song.album) song.album = song.album.replace(/\uFEFF/g, '').trim();
        });
        musicData.sort((a, b) => a.name.localeCompare(b.name));
        filteredData = [...musicData];
        renderMusicList();

        const songCountEl = document.getElementById('songCount');
        if (songCountEl) {
            animateCountUp(songCountEl, filteredData.length, 6000);
        }
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
                        currentSongEl.scrollIntoView(
                            {
                                behavior: 'smooth',
                                block: 'center'
                            });
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
                .map(s => ({
                    ...s,
                    folder: folderName,
                    uid: generateUID(`${folderName}/${s.file}`),
                    path: `${folderName}/${s.file}`
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            folderSongs.forEach((song, index) => {
                const li = document.createElement('li');
                li.classList.add('music-item');
                li.setAttribute('data-uid', song.uid);
                li.innerHTML = `
        <div class="info"><span class="title">${song.name}</span></div>
        <button class="add-queue-btn" title="Add to Queue"><i class="fas fa-plus"></i></button>`;

                li.querySelector('.add-queue-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    addToQueue(song);
                });
                setupLongPressForItem(li, song);

                if (song.uid === currentSongUID) {
                    li.classList.add('playing');
                }

                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    filteredData = [...folderSongs];
                    currentIndex = index;
                    playSong(index);

                    listEl.querySelectorAll('.music-item').forEach(el => el.classList.remove(
                        'playing'));
                    li.classList.add('playing');
                });

                listEl.appendChild(li);
            });

            listEl.style.display = 'block';


            if (currentSongUID) {
                const songFolder = currentSongUID.split('/')[0];
                if (songFolder === folderName) {
                    setTimeout(() => {
                        const currentSongEl = listEl.querySelector(
                            `.music-item[data-uid="${currentSongUID}"]`);
                        if (currentSongEl) {
                            currentSongEl.scrollIntoView(
                                {
                                    behavior: 'smooth',
                                    block: 'center'
                                });
                        }
                    }, 100);
                }
            }
        })
        .catch(err => console.error(err));
}

function loadArtistView() {
    artistListEl.innerHTML = '';

    const allSongs = musicData;
    const artistGroups = {};

    allSongs.forEach(song => {
        const rawArtist = (song.artist || 'Unknown Artist').replace(/\uFEFF/g, '').trim();
        const artists = rawArtist.split(',').map(a => a.trim()).filter(a => a);
        artists.forEach(artist => {
            if (!artistGroups[artist]) artistGroups[artist] = [];
            artistGroups[artist].push(song);
        });
    });

    const sortedArtists = Object.keys(artistGroups).sort((a, b) => a.localeCompare(b));

    sortedArtists.forEach(artist => {
        const artistTitle = document.createElement('div');
        artistTitle.classList.add('genre-title');
        const count = artistGroups[artist].length;
        artistTitle.innerHTML = `${artist} <span style="font-size:13px;opacity:0.5;font-weight:400;margin-left:8px;">${count} song${count > 1 ? 's' : ''}</span>`;
        artistListEl.appendChild(artistTitle);

        const artistSongsEl = document.createElement('ul');
        artistSongsEl.classList.add('genre-songs');
        artistSongsEl.style.display = 'none';
        artistListEl.appendChild(artistSongsEl);

        artistTitle.addEventListener('click', () => {
            artistSongsEl.style.display = artistSongsEl.style.display === 'block' ? 'none' : 'block';
        });

        artistGroups[artist]
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((song, index) => {
                const li = document.createElement('li');
                li.classList.add('music-item');
                li.setAttribute('data-uid', song.uid);
                li.innerHTML = `
                        <div class="info"><span class="title">${song.name}</span></div>
                        <button class="add-queue-btn" title="Add to Queue"><i class="fas fa-plus"></i></button>`;

                li.querySelector('.add-queue-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    addToQueue(song);
                });
                setupLongPressForItem(li, song);

                if (song.uid === currentSongUID) li.classList.add('playing');

                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    filteredData = [...artistGroups[artist]];
                    
                    currentIndex = index;
                    playSong(index);
                    artistSongsEl.querySelectorAll('.music-item').forEach(el => el.classList.remove('playing'));
                    li.classList.add('playing');
                });

                artistSongsEl.appendChild(li);
            });
    });
}



// --------------------
// Load Genre View
// --------------------
function loadGenreView() {
    genreListEl.innerHTML = '';

    const promises = types.map(lang =>
        fetch(`data/${lang}.json`)
            .then(res => res.json())
            .then(data => data.map(song => ({
                ...song,
                folder: lang,
                uid: generateUID(`${lang}/${song.file}`),
                path: `${lang}/${song.file}`
            })))
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
                genreSongsEl.style.display = genreSongsEl.style.display === 'block' ? 'none' :
                    'block';
            });

            genreGroups[genre]
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach((song, index) => {
                    const li = document.createElement('li');
                    li.classList.add('music-item');
                    li.setAttribute('data-uid', song.uid);
                    li.innerHTML = `
          <div class="info"><span class="title">${song.name}</span></div>
          <button class="add-queue-btn" title="Add to Queue"><i class="fas fa-plus"></i></button>`;

                    li.querySelector('.add-queue-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        addToQueue(song);
                    });
                    setupLongPressForItem(li, song);

                    if (song.uid === currentSongUID) {
                        li.classList.add('playing');
                    }

                    li.addEventListener('click', (e) => {
                        e.stopPropagation();
                        filteredData = genreGroups[genre];
                        
                        currentIndex = index;
                        playSong(index);

                        // Update highlight
                        genreSongsEl.querySelectorAll('.music-item').forEach(el => el
                            .classList.remove('playing'));
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

    filteredData.forEach((song, index) => {
        const li = document.createElement('li');
        li.classList.add('music-item');

        if (!hasAnimated) {
            li.classList.add('fade-in');
            li.addEventListener('animationend', () => {
                li.classList.remove('fade-in');
            }, { once: true });
        }

        li.setAttribute('data-uid', song.uid);
        li.innerHTML = `
      <div class="info">
        <span class="title">${song.name}</span>
        <span style="font-size:12px; color:rgba(255,255,255,0.5); margin-left:8px;">[${song.folder}]</span>
      </div>
      <button class="add-queue-btn" title="Add to Queue"><i class="fas fa-plus"></i></button>`;

        li.querySelector('.add-queue-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            addToQueue(song);
        });

        if (song.uid === currentSongUID) {
            li.classList.add('playing');
        }

        setupLongPressForItem(li, song);

        li.addEventListener('click', () => {
            filteredData = [...musicData];
            const newIndex = filteredData.findIndex(s => s.uid === song.uid);
            playSong(newIndex);
        });
        musicListEl.appendChild(li);
    });
    hasAnimated = true;
}
// --------------------
// Play Song
// --------------------
function playSong(index, resetFuture = true) {
    currentIndex = index;
    const song = filteredData[index];
    currentSongUID = song.uid;

    if (isShuffle && resetFuture) futureStack = [];

    fsAudio.src = `songs/${song.path}`;
    localStorage.setItem('lastSong', JSON.stringify(
        {
            uid: song.uid,
            time: fsAudio.currentTime
        }));
    fsAudio.play();

    if (fsCover) {
        fsCover.src = song.cover ?
            `covers/${song.folder}/${song.cover}` :
            getRandomFallbackCover();
    }

    updateMiniPlayer(song.name);
    document.title = song.name + ' | Song Archive';
    updateFullscreenPlayer(song.name);
    updatePlayButton();

    document.querySelectorAll('.music-item.playing')
        .forEach(el => el.classList.remove('playing'));

    document.querySelectorAll(`.music-item[data-uid="${currentSongUID}"]`)
        .forEach(el => el.classList.add('playing'));

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata(
            {
                title: song.name || 'Unknown',
                artist: song.artist || 'Unknown',
                album: song.album || 'Unknown',
                artwork: [
                    {
                        src: song.cover ?
                            `covers/${song.folder}/${song.cover}` :
                            getRandomFallbackCover(),
                        sizes: '512x512',
                        type: 'image/jpeg'
                    }]
            });
    }
}

// --------------------
// Update UI
// --------------------
function updateMiniPlayer(title) {
    miniTitle.textContent = title;
}

function updateFullscreenPlayer(title) {
    const song = filteredData[currentIndex];
    fsTitle.innerHTML = `
        <span class="fs-song-title">${title}</span>
        <span class="fs-artist-name">${song?.artist || 'Unknown Artist'}</span>
    `;
}

function updatePlayButton() {
    if (isPlaying) {
        fsPlayBtn.innerHTML = '<i class="fa fa-pause"></i>';
        miniPlayBtn.innerHTML = '<i class="fa fa-pause"></i>';
    }
    else {
        fsPlayBtn.innerHTML = '<i class="fa fa-play"></i>';
        miniPlayBtn.innerHTML = '<i class="fa fa-play"></i>';
    }
}

// --------------------
// Mini → Fullscreen
// --------------------
// --------------------
// Mini → Fullscreen
// --------------------
let touchStartY = null;

miniPlayer.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
});

miniPlayer.addEventListener('touchend', (e) => {
    if (touchStartY === null) return;
    const deltaY = touchStartY - e.changedTouches[0].clientY;

    if (deltaY > 40) {
        miniPlayer.classList.add('swipe-hint');
        setTimeout(() => miniPlayer.classList.remove('swipe-hint'), 400);

        fullscreenPlayer.style.display = 'flex';
        fullscreenPlayer.classList.remove('slide-down');
        fullscreenPlayer.classList.add('slide-up');
        miniPlayer.style.display = 'none';
        document.querySelector('.site-header').style.display = 'none';
        document.querySelector('.tabs').style.display = 'none';
        allSongsView.style.display = 'none';
        foldersView.style.display = 'none';
        genreView.style.display = 'none';
        artistView.style.display = 'none';
    }
    touchStartY = null;
});

miniPlayer.addEventListener('click', () => {
    fullscreenPlayer.style.display = 'flex';
    fullscreenPlayer.classList.remove('slide-down');
    fullscreenPlayer.classList.add('slide-up');
    miniPlayer.style.display = 'none';
    document.querySelector('.site-header').style.display = 'none';
    document.querySelector('.tabs').style.display = 'none';
    allSongsView.style.display = 'none';
    foldersView.style.display = 'none';
    genreView.style.display = 'none';
    artistView.style.display = 'none';
});
// --------------------
// Close fullscreen (Updated - no smooth animation)
// --------------------
fsCloseBtn.addEventListener('click', () => {
    fullscreenPlayer.classList.remove('slide-up');
    fullscreenPlayer.classList.add('slide-down');

    setTimeout(() => {
        fullscreenPlayer.style.display = 'none';
        fullscreenPlayer.classList.remove('slide-down');
        miniPlayer.style.display = 'flex';
        document.querySelector('.site-header').style.display = 'block';
        document.querySelector('.tabs').style.display = 'flex';

        allSongsView.style.display = 'none';
        foldersView.style.display = 'none';
        genreView.style.display = 'none';
        artistView.style.display = 'none';

        if (currentView === 'all') {
            allSongsView.style.display = 'block';
            const currentSongEl = document.querySelector(`.music-item[data-uid="${currentSongUID}"]`);
            if (currentSongEl) {
                currentSongEl.scrollIntoView(
                    {
                        behavior: 'auto',
                        block: 'center'
                    });
            }
        }
        else if (currentView === 'folders') {
            foldersView.style.display = 'block';
            if (currentSongUID) {
                const currentSong = filteredData[currentIndex] || musicData.find(s => s.uid === currentSongUID);
                const folderName = currentSong?.folder;
                const folderEl = Array.from(document.querySelectorAll('.folder-title'))
                    .find(el => el.textContent === folderName);
                if (folderEl) {
                    let listEl = folderEl.nextElementSibling;
                    if (!listEl || !listEl.classList.contains('folder-songs') || listEl.style
                        .display === 'none') {
                        toggleFolder(folderName, folderEl);
                        setTimeout(() => {
                            listEl = folderEl.nextElementSibling;
                            if (listEl && listEl.classList.contains('folder-songs')) {
                                const currentSongEl = listEl.querySelector(
                                    `.music-item[data-uid="${currentSongUID}"]`);
                                if (currentSongEl) {
                                    currentSongEl.scrollIntoView(
                                        {
                                            behavior: 'auto',
                                            block: 'center'
                                        });
                                    document.querySelectorAll('.folder-songs .music-item')
                                        .forEach(el => el.classList.remove('playing'));
                                    currentSongEl.classList.add('playing');
                                }
                            }
                        }, 100);
                    }
                    else {
                        const currentSongEl = listEl.querySelector(
                            `.music-item[data-uid="${currentSongUID}"]`);
                        if (currentSongEl) {
                            currentSongEl.scrollIntoView(
                                {
                                    behavior: 'auto',
                                    block: 'center'
                                });
                            document.querySelectorAll('.folder-songs .music-item').forEach(el => el
                                .classList.remove('playing'));
                            currentSongEl.classList.add('playing');
                        }
                    }
                }
            }
        }
        else if (currentView === 'genre') {
            genreView.style.display = 'block';
            if (currentSongUID) {
                const genreTitle = Array.from(document.querySelectorAll('.genre-title'))
                    .find(el => {
                        const genreSongs = el.nextElementSibling;
                        if (genreSongs && genreSongs.classList.contains('genre-songs')) {
                            return genreSongs.querySelector(
                                `.music-item[data-uid="${currentSongUID}"]`);
                        }
                        return false;
                    });
                if (genreTitle) {
                    const genreSongsEl = genreTitle.nextElementSibling;
                    genreSongsEl.style.display = 'block';
                    const currentSongEl = genreSongsEl.querySelector(
                        `.music-item[data-uid="${currentSongUID}"]`);
                    if (currentSongEl) {
                        currentSongEl.scrollIntoView(
                            {
                                behavior: 'auto',
                                block: 'center'
                            });
                        document.querySelectorAll('.genre-songs .music-item').forEach(el => el.classList
                            .remove('playing'));
                        currentSongEl.classList.add('playing');
                    }
                }
            }
        }
    }, 280);
});




// --------------------
// Fullscreen → Mini (Swipe Down)
// --------------------
let fsSwipeTouchStartY = null;

fullscreenPlayer.addEventListener('touchstart', (e) => {
    const popup = document.getElementById('queue-popup');
    if (popup && popup.classList.contains('open')) return;
    if (e.target.closest('#progress-bar-container')) return;
    fsSwipeTouchStartY = e.touches[0].clientY;
}, { passive: false });

fullscreenPlayer.addEventListener('touchmove', (e) => {
    if (fsSwipeTouchStartY === null) return;
    const deltaY = e.touches[0].clientY - fsSwipeTouchStartY;
    if (deltaY > 0) e.preventDefault();
}, { passive: false });

fullscreenPlayer.addEventListener('touchend', (e) => {
    if (fsSwipeTouchStartY === null) return;

    const deltaY = e.changedTouches[0].clientY - fsSwipeTouchStartY;

    if (deltaY > 40) {
        fullscreenPlayer.classList.remove('slide-up');
        fullscreenPlayer.classList.add('slide-down');

        setTimeout(() => {
            fullscreenPlayer.style.display = 'none';
            fullscreenPlayer.classList.remove('slide-down');
            miniPlayer.style.display = 'flex';
            document.querySelector('.site-header').style.display = 'block';
            document.querySelector('.tabs').style.display = 'flex';

            allSongsView.style.display = 'none';
            foldersView.style.display = 'none';
            genreView.style.display = 'none';
            artistView.style.display = 'none';

            if (currentView === 'all') {
                allSongsView.style.display = 'block';
                const currentSongEl = document.querySelector(
                    `.music-item[data-uid="${currentSongUID}"]`);
                if (currentSongEl) {
                    currentSongEl.scrollIntoView(
                        {
                            behavior: 'auto',
                            block: 'center'
                        });
                }

            }
            else if (currentView === 'folders') {
                foldersView.style.display = 'block';
                if (currentSongUID) {
                    const currentSong = filteredData[currentIndex] || musicData.find(s => s.uid === currentSongUID);
                    const folderName = currentSong?.folder;
                    const folderEl = Array.from(document.querySelectorAll('.folder-title'))
                        .find(el => el.textContent === folderName);
                    if (folderEl) {
                        let listEl = folderEl.nextElementSibling;
                        if (!listEl || !listEl.classList.contains('folder-songs') || listEl.style
                            .display === 'none') {
                            toggleFolder(folderName, folderEl);
                            setTimeout(() => {
                                listEl = folderEl.nextElementSibling;
                                if (listEl && listEl.classList.contains('folder-songs')) {
                                    const currentSongEl = listEl.querySelector(
                                        `.music-item[data-uid="${currentSongUID}"]`);
                                    if (currentSongEl) {
                                        currentSongEl.scrollIntoView(
                                            {
                                                behavior: 'smooth',
                                                block: 'center'
                                            });
                                        document.querySelectorAll('.folder-songs .music-item')
                                            .forEach(el => el.classList.remove('playing'));
                                        currentSongEl.classList.add('playing');
                                    }
                                }
                            }, 100);
                        }
                        else {
                            const currentSongEl = listEl.querySelector(
                                `.music-item[data-uid="${currentSongUID}"]`);
                            if (currentSongEl) {
                                currentSongEl.scrollIntoView(
                                    {
                                        behavior: 'auto',
                                        block: 'center'
                                    });
                                document.querySelectorAll('.folder-songs .music-item').forEach(el => el
                                    .classList.remove('playing'));
                                currentSongEl.classList.add('playing');
                            }
                        }
                    }
                }

            }
            else if (currentView === 'genre') {
                genreView.style.display = 'block';
                if (currentSongUID) {
                    const genreTitle = Array.from(document.querySelectorAll('.genre-title'))
                        .find(el => {
                            const genreSongs = el.nextElementSibling;
                            if (genreSongs && genreSongs.classList.contains('genre-songs')) {
                                return genreSongs.querySelector(
                                    `.music-item[data-uid="${currentSongUID}"]`);
                            }
                            return false;
                        });
                    if (genreTitle) {
                        const genreSongsEl = genreTitle.nextElementSibling;
                        genreSongsEl.style.display = 'block';
                        const currentSongEl = genreSongsEl.querySelector(
                            `.music-item[data-uid="${currentSongUID}"]`);
                        if (currentSongEl) {
                            currentSongEl.scrollIntoView(
                                {
                                    behavior: 'smooth',
                                    block: 'center'
                                });
                            document.querySelectorAll('.genre-songs .music-item').forEach(el => el
                                .classList.remove('playing'));
                            currentSongEl.classList.add('playing');
                        }
                    }
                }
            }

        }, 280);
    }

    fsSwipeTouchStartY = null;
});
// --------------------
// Play/Pause
// --------------------
function togglePlay() {
    if (isPlaying) {
        fsAudio.pause();
    }
    else {
        fsAudio.play();
    }
}
fsPlayBtn.addEventListener('click', togglePlay);
miniPlayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlay();
});
fsAudio.addEventListener('play', () => {
    isPlaying = true;
    updatePlayButton();
});
fsAudio.addEventListener('pause', () => {
    isPlaying = false;
    updatePlayButton();
});

// --------------------
// Next / Prev
// --------------------
function playNext() {
    if (songQueue.length > 0) {
        const nextSong = songQueue.shift();
        const existingIdx = filteredData.findIndex(s => s.uid === nextSong.uid);
        if (existingIdx !== -1) {
            currentIndex = existingIdx;
        }
        else {
            filteredData.splice(currentIndex + 1, 0, nextSong);
            currentIndex = currentIndex + 1;
        }
        playSong(currentIndex);
        updateQueueBadge();
        renderQueuePanel();
        return;
    }

    if (isShuffle) {
        if (currentIndex !== null) playHistory.push(currentIndex);
        let nextIndex;
        if (futureStack.length > 0) {
            nextIndex = futureStack.shift();
        }
        else {
            do {
                nextIndex = Math.floor(Math.random() * filteredData.length);
            } while (nextIndex === currentIndex && filteredData.length > 1);
        }
        currentIndex = nextIndex;
    }
    else {
        currentIndex = (currentIndex + 1) % filteredData.length;
    }
    playSong(currentIndex, false);
}


function playPrev() {
    if (isShuffle && playHistory.length > 0) {
        if (currentIndex !== null) futureStack.unshift(currentIndex);
        currentIndex = playHistory.pop();
    }
    else {
        currentIndex = (currentIndex - 1 + filteredData.length) % filteredData.length;
    }
    playSong(currentIndex, false);
}



fsNextBtn.addEventListener('click', playNext);
fsPrevBtn.addEventListener('click', playPrev);

// --------------------
// Shuffle & Repeat
// --------------------
fsCycleBtn.addEventListener('click', () => {
    if (!isShuffle && repeatMode === 'none') {
        isShuffle = true;
        repeatMode = 'none';
    }
    else if (isShuffle && repeatMode === 'none') {
        isShuffle = false;
        repeatMode = 'one';
    }
    else {
        isShuffle = false;
        repeatMode = 'none';
        playHistory = [];
    }
    localStorage.setItem('cycleMode', JSON.stringify({ isShuffle, repeatMode }));
    updateCycleUI();
});

function updateCycleUI() {
    if (isShuffle) {
        fsCycleIcon.className = 'fas fa-random';
        fsCycleBtn.style.color = 'white';
        fsCycleBtn.title = 'Shuffle ON';
    }
    else if (repeatMode === 'one') {
        fsCycleIcon.className = 'fas fa-redo';
        fsCycleBtn.style.color = 'white';
        fsCycleBtn.title = 'Repeat ON';
    }
    else {
        fsCycleIcon.className = 'fa-solid fa-repeat';
        fsCycleBtn.style.color = 'white';
        fsCycleBtn.title = 'Off';
    }
}


// --------------------
// Auto Next / Repeat
// --------------------
fsAudio.addEventListener('ended', () => {
    if (repeatMode === 'one') playSong(currentIndex);
    else if (songQueue.length > 0) playNext();
    else if (repeatMode === 'all') playNext();
    else {
        if (currentIndex < filteredData.length - 1) playNext();
        else {
            fsAudio.pause();
            isPlaying = false;
            updatePlayButton();
        }
    }
});

// --------------------
// Progress Bar
// --------------------
fsAudio.addEventListener('timeupdate', () => {
    if (fsAudio.duration) {
        const percent = (fsAudio.currentTime / fsAudio.duration) * 100;
        progressFilled.style.width = percent + '%';
        currentTimeEl.textContent = formatTime(fsAudio.currentTime);
        durationEl.textContent = formatTime(fsAudio.duration);
        localStorage.setItem('lastSong', JSON.stringify(
            {
                uid: currentSongUID,
                time: fsAudio.currentTime
            }));
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

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' + secs : secs);
}

// --------------------
// Volume
// --------------------
volumeSlider.addEventListener('input', () => {
    fsAudio.volume = volumeSlider.value;
});

// --------------------
// Search
// --------------------
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    filteredData = musicData.filter(song => song.name.toLowerCase().includes(query));
    renderMusicList();
});

// --------------------
// Tabs
// --------------------

const viewScrollPos = {
    'all': 0,
    'folders': 0,
    'genre': 0,
    'artist': 0
};

const viewLoaded = {
    'all': true,
    'folders': false,
    'genre': false,
    'artist': false
};

const viewOrder = ['all', 'folders', 'genre', 'artist'];

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
if (tab.dataset.view === currentView) {
    if (currentView === 'all') {
        filteredData = [...musicData];
        renderMusicList();
    }
    return;
}

        const oldView = currentView;
        const newView = tab.dataset.view;

        const viewMap = {
            'all': allSongsView,
            'folders': foldersView,
            'genre': genreView,
            'artist': artistView
        };

        const outEl = viewMap[oldView];
        const inEl = viewMap[newView];

        // পুরনো view এর scroll save করো — element এর scrollTop
        viewScrollPos[oldView] = outEl.scrollTop;

        const oldIndex = viewOrder.indexOf(oldView);
        const newIndex = viewOrder.indexOf(newView);
        const goingRight = newIndex > oldIndex;

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        inEl.style.display = 'block';
        inEl.style.position = 'absolute';
        inEl.style.top = '0';
        inEl.style.left = '0';
        inEl.style.width = '100%';

        outEl.classList.add(goingRight ? 'slide-out-left' : 'slide-out-right');
        inEl.classList.add(goingRight ? 'slide-in-right' : 'slide-in-left');

        currentView = newView;

        setTimeout(() => {
            outEl.style.display = 'none';
            outEl.classList.remove('slide-out-left', 'slide-out-right');

            inEl.style.position = '';
            inEl.style.top = '';
            inEl.style.left = '';
            inEl.style.width = '';
            inEl.classList.remove('slide-in-right', 'slide-in-left');

            if (!viewLoaded[currentView]) {
                viewLoaded[currentView] = true;
                if (currentView === 'folders') loadFolders();
                else if (currentView === 'artist' && artistListEl.innerHTML === '') loadArtistView();
                else if (currentView === 'genre' && genreListEl.innerHTML === '') loadGenreView();
            }

            requestAnimationFrame(() => {
                inEl.scrollTop = viewScrollPos[currentView] || 0;
                if (inEl.scrollTop === 0) window._makeNormal();
            });

        }, 200);
    });
});


function checkDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const songUID = params.get('song');
    if (!songUID) return;

    const index = filteredData.findIndex(s => s.uid === songUID);
    if (index !== -1) {
        isDeepLinkLoad = true;
        localStorage.removeItem('lastSong');
        playSong(index);
        fsAudio.addEventListener('loadedmetadata', () => {
            fsAudio.currentTime = 0;
            fsAudio.play();
        }, { once: true });
        fullscreenPlayer.style.display = 'flex';
        fullscreenPlayer.classList.add('slide-up');
        miniPlayer.style.display = 'none';
        document.querySelector('.site-header').style.display = 'none';
        document.querySelector('.tabs').style.display = 'none';
        allSongsView.style.display = 'none';
        history.replaceState(null, '', location.pathname);
    }
}

// --------------------
// Initial Load
// --------------------
loadAllSongs().then(() => {
    const savedQueue = localStorage.getItem('songQueue');
    if (savedQueue) {
        songQueue = JSON.parse(savedQueue);
        updateQueueBadge();
    }

    const savedCycle = localStorage.getItem('cycleMode');
    if (savedCycle) {
        const { isShuffle: s, repeatMode: r } = JSON.parse(savedCycle);
        isShuffle = s;
        repeatMode = r;
        updateCycleUI();
    }

    // Last song restore
    const saved = localStorage.getItem('lastSong');
    if (saved) {
        const
            {
                uid,
                time
            } = JSON.parse(saved);
        const index = filteredData.findIndex(s => s.uid === uid);
        if (index !== -1) {
            currentIndex = index;
            currentSongUID = filteredData[index].uid;
            const song = filteredData[index];

            updateMiniPlayer(song.name);
            updateFullscreenPlayer(song.name);

            if (fsCover) {
                fsCover.src = song.cover ?
                    `covers/${song.folder}/${song.cover}` :
                    getRandomFallbackCover();
            }

            fsAudio.src = `songs/${song.folder}/${song.file}`;

            fsAudio.addEventListener('loadedmetadata', () => {
                if (!isDeepLinkLoad) {
                    fsAudio.currentTime = time || 0;
                }
            }, { once: true });

            document.querySelectorAll(`.music-item[data-uid="${currentSongUID}"]`)
                .forEach(el => el.classList.add('playing'));
        }
    }

    window.scrollTo(
        {
            top: 0,
            behavior: 'auto'
        });
    checkDeepLink();
});

// --------------------
// animateCountUp
// --------------------
function animateCountUp(element, target, duration = 2000) {
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const current = Math.floor(ease * target);
        element.textContent = `Total Songs: ${current}`;
        if (progress < 1) {
            requestAnimationFrame(step);
        }
        else {
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


metaClose.addEventListener('click', () => {
    metaModal.style.display = 'none';
});

window.addEventListener('DOMContentLoaded', () => {
    fsQueueControlBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleQueuePopup();
    });

    document.getElementById('queue-clear').addEventListener('click', () => {
        songQueue = [];
        renderQueuePanel();
        updateQueueBadge();
        saveQueue();
    });

    document.addEventListener('click', (e) => {
        const popup = document.getElementById('queue-popup');
        if (popup && popup.classList.contains('open') && !popup.contains(e.target) && e.target.id !==
            'fs-queue-btn') {
            popup.classList.remove('open');
            fsCover.style.display = 'block';
        }
    });
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



// // Service Worker Register
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register('/service-worker.js')
//     .then(() => console.log('SW registered'))
//     .catch(err => console.error('SW error:', err));
// }





// --------------------
// Sticky Tabs on Scroll
// --------------------
(function () {
    const tabsEl = document.querySelector('.tabs');
    const viewMap = {
        'all': allSongsView,
        'folders': foldersView,
        'genre': genreView,
        'artist': artistView
    };

    function getCurrentViewEl() {
        return viewMap[currentView];
    }

    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'height:1px; pointer-events:none;';
    tabsEl.parentNode.insertBefore(sentinel, tabsEl);

    const placeholder = document.createElement('div');
    placeholder.style.display = 'none';
    tabsEl.parentNode.insertBefore(placeholder, tabsEl);

    let isSticky = false;
    window._makeNormal = function () { makeNormal(); };

    function makeSticky() {
        if (isSticky) return;
        isSticky = true;
        document.querySelector('.site-header').style.display = 'none';
        const h = tabsEl.offsetHeight;
        placeholder.style.cssText = `display:block; height:0px;`;

        const bodyPadding = parseInt(window.getComputedStyle(document.body).paddingLeft) || 0;

        tabsEl.style.position = 'fixed';
        tabsEl.style.top = '0';
        tabsEl.style.left = bodyPadding + 'px';
        tabsEl.style.right = bodyPadding + 'px';
        tabsEl.style.width = 'auto';
        tabsEl.style.zIndex = '500';
        tabsEl.style.marginTop = '0';
        tabsEl.style.marginBottom = '0';
        tabsEl.style.background = 'transparent';
        tabsEl.style.backdropFilter = 'blur(20px) saturate(180%)';
        tabsEl.style.webkitBackdropFilter = 'blur(20px) saturate(180%)';
        tabsEl.querySelectorAll('.tab i').forEach(i => i.style.display = 'none');
        tabsEl.style.paddingTop = '8px';
        tabsEl.style.paddingBottom = '8px';
        tabsEl.style.borderRadius = '0 0 16px 16px';
    }

    function makeNormal() {
        if (!isSticky) return;
        isSticky = false;
        document.querySelector('.site-header').style.display = 'block';

        placeholder.style.display = 'none';
        tabsEl.style.position = '';
        tabsEl.style.top = '';
        tabsEl.style.left = '';
        tabsEl.style.right = '';
        tabsEl.style.width = '';
        tabsEl.style.zIndex = '';
        tabsEl.style.marginTop = '';
        tabsEl.style.marginBottom = '';
        tabsEl.style.background = '';
        tabsEl.style.backdropFilter = '';
        tabsEl.style.webkitBackdropFilter = '';
        tabsEl.style.paddingTop = '';
        tabsEl.style.paddingBottom = '';
        tabsEl.style.borderRadius = '';
        tabsEl.querySelectorAll('.tab i').forEach(i => i.style.display = '');
        musicListEl.style.paddingTop = '';
        folderListEl.style.paddingTop = '';
        genreListEl.style.paddingTop = '';
        artistListEl.style.paddingTop = '';
    }

    function onViewScroll() {
        const el = getCurrentViewEl();
        if (!el) return;
        if (el.scrollTop > 10) makeSticky();
        else makeNormal();
    }

    Object.values(viewMap).forEach(el => {
        el.addEventListener('scroll', onViewScroll, { passive: true });
    });

    window.addEventListener('resize', () => {
        if (isSticky) {
            const bodyPadding = parseInt(window.getComputedStyle(document.body).paddingLeft) || 0;
            tabsEl.style.left = bodyPadding + 'px';
            tabsEl.style.right = bodyPadding + 'px';
        }
    });
})();

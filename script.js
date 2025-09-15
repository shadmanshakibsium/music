// ---- Config ----
const types = ['anime','arabic','bangla','edit audio','english','hindi','lofi','phonk','slowed-reverbed'];
let musicData = [];
let currentIndex = 0;
let isPlaying = false;

// ---- Elements ----
const audio = document.getElementById('audioPlayer');
const musicListEl = document.getElementById('music-list');
const searchInput = document.getElementById('searchInput');
const tabs = document.querySelectorAll('.tab');
const miniPlayer = document.getElementById('mini-player');
const miniSongTitle = document.getElementById('miniSongTitle');
const miniTime = document.getElementById('miniTime');
const miniPlayPause = document.getElementById('miniPlayPause');
const playerView = document.getElementById('player-view');
const currentSongTitle = document.getElementById('currentSongTitle');
const backToLibraryBtn = document.getElementById('backToLibrary');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBarContainer = document.getElementById('progress-bar-container');
const progressFilled = document.getElementById('progress-filled');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');

// ---- Load all JSON files ----
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

// ---- Sort Songs Alphabetically ----
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

// ---- Display Songs ----
function displaySongs(list) {
    const sortedList = sortSongs(list);
    if(sortedList.length === 0){
        musicListEl.innerHTML = '<li class="no-results">No results found</li>';
        return;
    }
    musicListEl.innerHTML = sortedList.map((song,index)=>`
        <li class="music-item" data-index="${index}">
            <div class="info">
                <span class="title">${song.name}</span>
                <span class="meta">[${song.type}]</span>
            </div>
        </li>
    `).join('');
    addMusicItemHandlers();
}

// ---- Display Folders ----
const folderState = {};
function displayFolders(list){
    const sortedList = sortSongs(list);
    let html = '';
    types.forEach(type=>{
        const songs = sortedList.filter(s=>s.type===type);
        if(songs.length){
            folderState[type] = false;
            html += `
                <div class="folder-title" data-type="${type}">${type.toUpperCase()}</div>
                <ul class="folder-songs" data-type="${type}">
                    ${songs.map((song,index)=>`
                        <li class="music-item" data-index="${index}">
                            <div class="info">
                                <span class="title">${song.name}</span>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `;
        }
    });
    musicListEl.innerHTML = html;

    document.querySelectorAll('.folder-title').forEach(title=>{
        title.addEventListener('click', ()=>{
            const type = title.dataset.type;
            folderState[type] = !folderState[type];
            const ul = document.querySelector(`.folder-songs[data-type="${type}"]`);
            ul.classList.toggle('open');
        });
    });

    addMusicItemHandlers();
}

// ---- Tabs ----
tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
        tabs.forEach(t=>t.classList.remove('active'));
        tab.classList.add('active');
        searchInput.value='';
        const activeTab = tab.dataset.tab;
        if(activeTab==='songs') displaySongs(musicData);
        else displayFolders(musicData);
    });
});

// ---- Search ----
searchInput.addEventListener('input', ()=>{
    const query = searchInput.value.toLowerCase();
    const filtered = musicData.filter(song=>song.name.toLowerCase().includes(query));
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    if(activeTab==='songs') displaySongs(filtered);
    else displayFolders(filtered);
});

// ---- Music Item Click ----
function addMusicItemHandlers(){
    document.querySelectorAll('.music-item').forEach(item=>{
        item.addEventListener('click', ()=>{
            const index = parseInt(item.dataset.index);
            if(isNaN(index)) return;
            currentIndex = index;
            loadSong(currentIndex);
            showMiniPlayer();
        });
    });
}

// ---- Load Song ----
function loadSong(index){
    const song = musicData[index];
    if(!song) return;
    audio.src = `songs/${song.type}/${song.file}`;
    currentSongTitle.textContent = song.name;
    miniSongTitle.textContent = song.name;
    resetProgress();
    playSong();
}

// ---- Progress ----
function resetProgress(){
    progressFilled.style.width='0%';
    currentTimeEl.textContent='0:00';
    durationEl.textContent='0:00';
    miniTime.textContent='0:00';
}

function formatTime(sec){
    const m = Math.floor(sec/60);
    const s = Math.floor(sec%60);
    return `${m}:${s<10?'0'+s:s}`;
}

let rafId;
function updateProgress(){
    if(audio.duration){
        const percent = (audio.currentTime/audio.duration)*100;
        progressFilled.style.width = percent+'%';
        currentTimeEl.textContent = formatTime(audio.currentTime);
        durationEl.textContent = formatTime(audio.duration);
        miniTime.textContent = formatTime(audio.currentTime);
    }
    if(isPlaying) rafId = requestAnimationFrame(updateProgress);
}

progressBarContainer.addEventListener('click',(e)=>{
    const rect = progressBarContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    audio.currentTime = (clickX/rect.width)*audio.duration;
    updateProgress();
});

// ---- Play/Pause ----
function playSong(){
    audio.play();
    isPlaying=true;
    playPauseBtn.textContent='⏸';
    miniPlayPause.textContent='⏸';
    updateProgress();
}
function pauseSong(){
    audio.pause();
    isPlaying=false;
    playPauseBtn.textContent='▶';
    miniPlayPause.textContent='▶';
}
playPauseBtn.addEventListener('click', ()=>{ isPlaying?pauseSong():playSong(); });
miniPlayPause.addEventListener('click', ()=>{ isPlaying?pauseSong():playSong(); });

// ---- Prev/Next ----
prevBtn.addEventListener('click', ()=>{
    currentIndex = (currentIndex-1+musicData.length)%musicData.length;
    loadSong(currentIndex);
});
nextBtn.addEventListener('click', ()=>{
    currentIndex = (currentIndex+1)%musicData.length;
    loadSong(currentIndex);
});

// ---- Mini → Full Player ----
function showMiniPlayer(){
    miniPlayer.classList.remove('hidden');
    miniPlayer.setAttribute('aria-hidden','false');
}

miniPlayer.addEventListener('click', ()=>{
    playerView.classList.remove('hidden');
    playerView.setAttribute('aria-hidden','false');
    miniPlayer.classList.add('hidden'); // hide mini when full player visible
});

// ---- Full Player → Back to Library ----
backToLibraryBtn.addEventListener('click', ()=>{
    playerView.classList.add('hidden');
    playerView.setAttribute('aria-hidden','true');
    miniPlayer.classList.remove('hidden'); // show mini again
});

// ---- Audio End ----
audio.addEventListener('ended', ()=>{
    nextBtn.click();
});

// ---- Init ----
window.addEventListener('load', async ()=>{
    await loadAllMusic();
    displaySongs(musicData);
});

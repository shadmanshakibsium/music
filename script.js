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
const libraryView = document.getElementById('library-view');

// ---- Load all JSON files ----
async function loadAllMusic() {
    let allSongs = [];
    for (const type of types) {
        try {
            const res = await fetch(`data/${type}.json`);
            const data = await res.json();
            data.forEach(song => {
                song.type = type;
            });
            allSongs = allSongs.concat(data);
        } catch (e) {
            console.error(`Failed to load ${type}.json`, e);
        }
    }
    musicData = allSongs;
}

// ---- Display Songs ----
function displaySongs(list) {
    if(list.length === 0){
        musicListEl.innerHTML = '<li class="no-results">No results found</li>';
        return;
    }
    musicListEl.innerHTML = list.map((song,index)=>`
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
function displayFolders(list){
    let html = '';
    types.forEach(type=>{
        const songs = list.filter(s=>s.type===type);
        if(songs.length){
            html += `
                <div class="folder-title" data-type="${type}">${type.toUpperCase()}</div>
                <ul class="folder-songs" data-type="${type}">
                    ${songs.map(song=>{
                        const dataIndex = musicData.indexOf(song);
                        return `
                            <li class="music-item" data-index="${dataIndex}">
                                <div class="info">
                                    <span class="title">${song.name}</span>
                                </div>
                            </li>
                        `;
                    }).join('')}
                </ul>
            `;
        }
    });
    musicListEl.innerHTML = html;

    document.querySelectorAll('.folder-title').forEach(title=>{
        title.addEventListener('click', ()=>{
            const ul = document.querySelector(`.folder-songs[data-type="${title.dataset.type}"]`);
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

    // Load audio
    audio.src = `songs/${song.type}/${song.file}`;

    // Update titles
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
    playerView.classList.add('hidden');
    libraryView.classList.remove('blur');
}
function openFullPlayer(e){
    if(e.target.closest('.control-btn, #miniPlayPause')) return;

    playerView.classList.remove('hidden');
    libraryView.classList.add('blur');
    miniPlayer.classList.add('hidden');
    document.body.classList.add('player-fullscreen');

    playerView.style.opacity='0';
    playerView.style.transform='scale(0.9)';
    requestAnimationFrame(()=>{
        playerView.style.opacity='1';
        playerView.style.transform='scale(1)';
    });
}
miniPlayer.addEventListener('click', openFullPlayer);

// ---- Full Player → Back ----
function closeFullPlayer(){
    playerView.style.opacity='1';
    playerView.style.transform='scale(1)';
    requestAnimationFrame(()=>{
        playerView.style.opacity='0';
        playerView.style.transform='scale(0.9)';
    });
    setTimeout(()=>{
        playerView.classList.add('hidden');
        libraryView.classList.remove('blur');
        miniPlayer.classList.remove('hidden');
        document.body.classList.remove('player-fullscreen');
    }, 300);
}
backToLibraryBtn.addEventListener('click', closeFullPlayer);

// ---- Swipe gestures ----
let startY = 0;
playerView.addEventListener('touchstart', e => { startY = e.touches[0].clientY; });
playerView.addEventListener('touchend', e => {
    const endY = e.changedTouches[0].clientY;
    if(endY - startY > 60) closeFullPlayer();
});
miniPlayer.addEventListener('touchstart', e => { startY = e.touches[0].clientY; });
miniPlayer.addEventListener('touchend', e => {
    const endY = e.changedTouches[0].clientY;
    if(startY - endY > 60) openFullPlayer();
});

// ---- Audio End ----
audio.addEventListener('ended', ()=>{ nextBtn.click(); });

// ---- Init ----
window.addEventListener('load', async ()=>{
    await loadAllMusic();
    displaySongs(musicData);
});

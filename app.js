// --- ΡΥΘΜΙΣΕΙΣ ΣΥΝΔΕΣΗΣ ---
const BASE_URL = 'https://jackscores-api.onrender.com/matches'; 

// Βοηθητική συνάρτηση ημερομηνίας (YYYY-MM-DD)
function getDateString(offsetDays = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split('T')[0];
}

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);

    console.log("Η εφαρμογή ξεκίνησε στη σελίδα:", page || "index.html");

    if (page === 'index.html' || page === '') {
        loadHomePage();
        setInterval(loadHomePage, 60000); 
    } 
    else if (page === 'past.html') {
        loadPastMatches();
    } 
    else if (page === 'future.html') {
        loadFutureMatches();
    }
});

// --- 1. HOME PAGE (ΜΟΝΟ ΣΗΜΕΡΙΝΑ & LIVE) ---
async function loadHomePage() {
    const today = getDateString(0);
    const tomorrow = getDateString(1);

    
    // ΑΛΛΑΓΗ: Ζητάμε μόνο τη σημερινή μέρα (today εως today)
    // Έτσι δεν θα εμφανίζονται αγώνες άλλων ημερών.
    const url = `${BASE_URL}?dateFrom=${today}&dateTo=${tomorrow}`; 
    
    await fetchAndRender(url, true, true); 
}

// --- 2. PAST MATCHES --- 
async function loadPastMatches() {
    const dateFrom = getDateString(-3); 
    const dateTo = getDateString(-1);   
    const url = `${BASE_URL}?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    await fetchAndRender(url, true, false); 
}

/*



*/ 
// --- 3. FUTURE MATCHES ---
async function loadFutureMatches() {
    const dateFrom = getDateString(1);   
    const dateTo = getDateString(10); 
    const url = `${BASE_URL}?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    await fetchAndRender(url, false, false); 
}

// --- Η ΚΕΝΤΡΙΚΗ ΜΗΧΑΝΗ ---
async function fetchAndRender(targetUrl, checkForVideos, splitLiveSection) {
    const container = document.getElementById('matches-container');
    
    try {
        console.log("📡 Ζητάω δεδομένα:", targetUrl);

        const response = await fetch(targetUrl);

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();
        const matches = data.matches;

        if (!matches || matches.length === 0) {
            container.innerHTML = '<p style="color:white; text-align:center; margin-top:20px;">Δεν υπάρχουν αγώνες σήμερα.</p>';
            return;
        }

        let videos = [];
        if (checkForVideos) {
            try {
                const videoRes = await fetch('https://www.scorebat.com/video-api/v3/');
                const videoData = await videoRes.json();
                videos = videoData.response;
            } catch (err) {
                console.warn("Video fetch error:", err);
            }
        }

        container.innerHTML = ''; 

        // --- ΔΙΑΧΩΡΙΣΜΟΣ LIVE vs SCHEDULED ---
        if (splitLiveSection) {
            const liveMatches = matches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED');
            const scheduledMatches = matches.filter(m => m.status !== 'IN_PLAY' && m.status !== 'PAUSED');

            // 1. Ενότητα LIVE
            if (liveMatches.length > 0) {
                container.innerHTML += `
                    <div class="section-separator">
                        <span class="live-dot" style="width:12px; height:12px;"></span> 
                        <span class="section-title-live">LIVE ΤΩΡΑ</span>
                    </div>`;
                renderGroupedMatches(liveMatches, container, videos);
            }

            // 2. Ενότητα ΣΗΜΕΡΙΝΑ (Αφού ζητήσαμε μόνο today, εδώ θα έχει μόνο τα σημερινά)
            if (scheduledMatches.length > 0) {
                const marginTop = liveMatches.length > 0 ? 'margin-top: 50px;' : '';
                container.innerHTML += `
                    <div class="section-separator" style="${marginTop}">
                        <i class="fas fa-calendar-day" style="color:white"></i>
                        <span class="section-title-today">ΑΓΩΝΕΣ ΣΗΜΕΡΑ</span>
                    </div>`;
                renderGroupedMatches(scheduledMatches, container, videos);
            }
        } else {
            renderGroupedMatches(matches, container, videos);
        }

    } catch (error) {
        console.error("Σφάλμα:", error);
        container.innerHTML = `
            <div style="color:#ff4757; text-align:center; margin-top:20px;">
                <h3>Προέκυψε Σφάλμα</h3>
                <p>${error.message}</p>
            </div>`;
    }
}

// --- ΒΟΗΘΗΤΙΚΕΣ ΣΥΝΑΡΤΗΣΕΙΣ (ΙΔΙΕΣ) ---
function renderGroupedMatches(matchesList, container, videos) {
    const groupedMatches = {};
    matchesList.forEach(match => {
        const country = match.area.name;
        if (!groupedMatches[country]) {
            groupedMatches[country] = { flag: match.area.flag, matches: [] };
        }
        groupedMatches[country].matches.push(match);
    });

    const sortedCountries = Object.keys(groupedMatches).sort();

    for (const countryName of sortedCountries) {
        const group = groupedMatches[countryName];
        const flagUrl = group.flag || 'https://via.placeholder.com/30?text=?';
        
        const sectionHTML = document.createElement('div');
        sectionHTML.className = 'country-section';
        sectionHTML.innerHTML = `
            <div class="country-header">
                <img src="${flagUrl}" class="country-flag" onerror="this.style.display='none'">
                <span class="country-name">${translateCountry(countryName)}</span>
            </div>
            <div class="matches-grid"></div>
        `;
        
        container.appendChild(sectionHTML);
        const specificGrid = sectionHTML.querySelector('.matches-grid');
        
        group.matches.forEach(match => {
            const videoMatch = videos.find(v => 
                v.title.toLowerCase().includes(match.homeTeam.name.toLowerCase()) || 
                v.title.toLowerCase().includes(match.awayTeam.name.toLowerCase())
            );
            specificGrid.innerHTML += createMatchCard(match, videoMatch);
        });
    }
}

function createMatchCard(match, video) {
    let scoreDisplay, statusDisplay;
    const dateObj = new Date(match.utcDate);

    // 1. Φτιάχνουμε τα String για Ημερομηνία και Ώρα
    const dateStr = dateObj.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' }); // π.χ. 30/01
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // π.χ. 22:00

    // 2. Ελέγχουμε αν το ματς είναι μελλοντικό ή τελειωμένο/live
    if (match.status === 'SCHEDULED' || match.status === 'TIMED') {
        // --- ΓΙΑ ΜΕΛΛΟΝΤΙΚΑ ΜΑΤΣ ---
        // Δείχνουμε: Ημερομηνία (μικρά) + Ώρα (μεγάλα)
        scoreDisplay = `
            <div style="font-size:0.85rem; color:#aaa; margin-bottom:4px;">${dateStr}</div>
            <div style="font-size:1.2rem; color:#fff; font-weight:bold;">${timeStr}</div>
        `;
        statusDisplay = 'Προσεχώς';
    } else {
        // --- ΓΙΑ LIVE ή ΤΕΛΕΙΩΜΕΝΑ ---
        // Δείχνουμε: Ημερομηνία (πολύ διακριτικά) + Σκορ
        const scoreHome = match.score.fullTime.home ?? 0;
        const scoreAway = match.score.fullTime.away ?? 0;
        
        scoreDisplay = `
            <div style="font-size:0.75rem; color:#666; margin-bottom:2px;">${dateStr}</div>
            <div style="font-size:1.4rem; color:#fff; font-weight:bold;">${scoreHome} - ${scoreAway}</div>
        `;
        
        statusDisplay = translateStatus(match.status);
        if(match.status === 'IN_PLAY' || match.status === 'PAUSED') {
             statusDisplay = `<span style="color:#03dac6; font-weight:bold;">${statusDisplay}</span>`;
        }
    }

    // Κουμπί Βίντεο (Highlights)
    let videoButton = video ? `<a href="${video.matchviewUrl}" target="_blank" class="video-btn"><i class="fas fa-play-circle"></i> Highlights</a>` : '';
    const noImg = "https://via.placeholder.com/30?text=⚽";

    // Επιστροφή του HTML της κάρτας
    return `
        <div class="match-card">
            <span class="league-name">${match.competition.name}</span>
            <div class="teams-container">
                <div class="team">
                    <img src="${match.homeTeam.crest}" onerror="this.src='${noImg}'">
                    <span class="team-name">${match.homeTeam.shortName || match.homeTeam.name}</span>
                </div>
                
                <div class="score-board">${scoreDisplay}</div>
                
                <div class="team">
                    <img src="${match.awayTeam.crest}" onerror="this.src='${noImg}'">
                    <span class="team-name">${match.awayTeam.shortName || match.awayTeam.name}</span>
                </div>
            </div>
            <div class="match-status">${match.status === 'IN_PLAY' ? '<span class="live-dot"></span>' : ''} ${statusDisplay}</div>
            ${videoButton}
        </div>
    `;
}

function translateStatus(status) {
    const dict = { 'IN_PLAY': 'Live', 'PAUSED': 'Ημίχρονο', 'FINISHED': 'Τελικό', 'SCHEDULED': 'Προσεχώς' };
    return dict[status] || status;
}

function translateCountry(name) {
    const dict = { 'England': 'Αγγλία 🇬🇧', 'Spain': 'Ισπανία 🇪🇸', 'Germany': 'Γερμανία 🇩🇪', 'Italy': 'Ιταλία 🇮🇹', 'France': 'Γαλλία 🇫🇷', 'Greece': 'Ελλάδα 🇬🇷', 'Europe': 'Ευρώπη 🇪🇺', 'Brazil': 'Βραζιλία 🇧🇷' };
    return dict[name] || name;
}
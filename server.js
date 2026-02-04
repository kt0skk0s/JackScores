require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://api.football-data.org/v4/matches';

// --- Η "ΑΠΟΘΗΚΗ" ΔΕΔΟΜΕΝΩΝ ---
const DATA_STORE = {
    today: [],
    past: [],
    future: []
};

// --- ΒΟΗΘΗΤΙΚΕΣ ΣΥΝΑΡΤΗΣΕΙΣ ---
function getDateString(offsetDays = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split('T')[0];
}

// --- ΟΙ "ΕΡΓΑΤΕΣ" (Background Workers) ---

// 1. Fetch Today (Τρέχει ΠΟΛΥ συχνά - κάθε 10 δευτερόλεπτα)
async function updateToday() {
    try {
        const today = getDateString(0);
        const tomorrow = getDateString(1);
        console.log("⚡ Updating LIVE/TODAY matches (Fast)...");
        
        const response = await axios.get(BASE_URL, {
            headers: { 'X-Auth-Token': API_KEY },
            params: { dateFrom: today, dateTo: tomorrow }
        });
        
        DATA_STORE.today = response.data;
        console.log("✅ TODAY updated.");
    } catch (err) {
        console.error("❌ Failed to update TODAY:", err.message);
    }
}

// 2. Fetch Past (Τρέχει σπάνια - κάθε 6 ώρες)
async function updatePast() {
    try {
        const dateFrom = getDateString(-3);
        const dateTo = getDateString(-1);
        console.log("⏳ Updating PAST matches...");

        const response = await axios.get(BASE_URL, {
            headers: { 'X-Auth-Token': API_KEY },
            params: { dateFrom, dateTo }
        });

        DATA_STORE.past = response.data;
        console.log("✅ PAST updated.");
    } catch (err) {
        console.error("❌ Failed to update PAST:", err.message);
    }
}

// 3. Fetch Future (Τρέχει σπάνια - κάθε 6 ώρες)
async function updateFuture() {
    try {
        const dateFrom = getDateString(1);
        const dateTo = getDateString(10);
        console.log("🔮 Updating FUTURE matches...");

        const response = await axios.get(BASE_URL, {
            headers: { 'X-Auth-Token': API_KEY },
            params: { dateFrom, dateTo }
        });

        DATA_STORE.future = response.data;
        console.log("✅ FUTURE updated.");
    } catch (err) {
        console.error("❌ Failed to update FUTURE:", err.message);
    }
}

// --- ΕΚΚΙΝΗΣΗ ---
updateToday();
updatePast();
updateFuture();

// --- ΧΡΟΝΟΔΙΑΚΟΠΤΕΣ (TIMERS) ---

// ΑΛΛΑΓΗ ΕΔΩ: Κάθε 10 δευτερόλεπτα (10 * 1000 ms)
setInterval(updateToday, 10 * 1000);          

setInterval(updatePast, 6 * 60 * 60 * 1000);   // Κάθε 6 ώρες
setInterval(updateFuture, 6 * 60 * 60 * 1000); // Κάθε 6 ώρες


// --- API ENDPOINT ---
app.get('/matches', (req, res) => {
    const { dateFrom } = req.query;
    
    const todayStr = getDateString(0);
    const pastStr = getDateString(-3);
    const futureStr = getDateString(1);

    if (dateFrom === pastStr) {
        if (!DATA_STORE.past.matches) return res.json({ matches: [] });
        return res.json(DATA_STORE.past);
    } 
    else if (dateFrom === futureStr) {
        if (!DATA_STORE.future.matches) return res.json({ matches: [] });
        return res.json(DATA_STORE.future);
    } 
    else {
        // Default: Today
        if (!DATA_STORE.today.matches) return res.json({ matches: [] });
        return res.json(DATA_STORE.today);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Ultra-Fast Server (10s refresh) running on port ${PORT}`);
});
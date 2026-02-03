const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

// --- ΡΥΘΜΙΣΕΙΣ ---
const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://api.football-data.org/v4/matches';

// --- ΝΕΑ ΜΝΗΜΗ (ΠΟΛΛΑΠΛΗ CACHE) ---
// Αντί για μια μεταβλητή, χρησιμοποιούμε ένα αντικείμενο {} 
// για να αποθηκεύουμε πολλές διαφορετικές απαντήσεις.
const cache = {}; 
const CACHE_TIME = 60 * 1000; // 60 δευτερόλεπτα

app.get('/matches', async (req, res) => {
    const { dateFrom, dateTo } = req.query;
    const now = Date.now();

    // 1. ΔΗΜΙΟΥΡΓΙΑ ΜΟΝΑΔΙΚΗΣ ΤΑΥΤΟΤΗΤΑΣ (KEY)
    // Φτιάχνουμε ένα μοναδικό όνομα για αυτό που ζήτησε ο χρήστης.
    // Π.χ. "2024-01-30_2024-02-06"
    const cacheKey = `${dateFrom}_${dateTo}`;

    // 2. ΕΛΕΓΧΟΣ: Έχουμε δεδομένα ΓΙΑ ΑΥΤΟ ΤΟ ΣΥΓΚΕΚΡΙΜΕΝΟ KEY;
    if (cache[cacheKey] && (now - cache[cacheKey].timestamp < CACHE_TIME)) {
        console.log(`✅ Serving CACHE for: ${cacheKey}`);
        return res.json({ ...cache[cacheKey].data, source: 'cache' });
    }

    // 3. ΑΝ ΟΧΙ, ΖΗΤΑΜΕ ΑΠΟ ΤΟ API
    try {
        console.log(`🔄 Fetching API for: ${cacheKey}`);
        
        const response = await axios.get(BASE_URL, {
            headers: { 'X-Auth-Token': API_KEY },
            params: { dateFrom, dateTo }
        });

        // Αποθηκεύουμε τα αποτελέσματα στο συγκεκριμένο κουτάκι (cacheKey)
        cache[cacheKey] = {
            data: response.data,
            timestamp: now
        };

        res.json({ ...response.data, source: 'api' });

    } catch (error) {
        console.error('❌ API Error:', error.message);
        
        // Αν αποτύχει το API, προσπαθούμε να δώσουμε παλιά δεδομένα αν υπάρχουν
        if (cache[cacheKey]) {
            console.log('⚠️ API Failed. Serving old cache.');
            return res.json(cache[cacheKey].data);
        }
        
        res.status(500).json({ error: 'Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
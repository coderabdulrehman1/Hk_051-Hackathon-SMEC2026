const form = document.getElementById('songForm');
const canvas = document.getElementById('wordcloud');
const errorDiv = document.getElementById('error');
const loadingSpinner = document.getElementById('loadingSpinner');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.textContent = '';

    const artist = document.getElementById('artist').value.trim();
    const song = document.getElementById('song').value.trim();

    if (!artist || !song) {
        errorDiv.textContent = 'Please enter both artist and song title.';
        return;
    }

    loadingSpinner.classList.add('active');
    canvas.style.opacity = '0.3';

    const MIN_LOADER_TIME = 2500;
    const startTime = Date.now();

    try {
        const proxyUrl = 'https://corsproxy.io/?';
        const targetUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`;

        const response = await fetch(proxyUrl + targetUrl);

        const elapsed = Date.now() - startTime;
        if (elapsed < MIN_LOADER_TIME) {
            await new Promise(resolve => setTimeout(resolve, MIN_LOADER_TIME - elapsed));
        }

        if (response.status === 429) {
            throw new Error('Rate limit reached (~50/hour). Try again later!');
        }
        if (!response.ok) {
            throw new Error(`Lyrics not found (status ${response.status}). Try another song!`);
        }

        const data = await response.json();
        const lyrics = data.lyrics;

        if (!lyrics || lyrics.trim() === '') {
            throw new Error('No lyrics returned for this song.');
        }

        const stopWords = new Set([
            'a','an','the','and','or','but','if','then','else','for','of','to','in','on','by',
            'with','about','as','at','be','this','that','have','from','is','it','its',"it's",
            'you','your','my','me','i','we','us','they','them'
        ]);

        const words = lyrics.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word));

        const wordFreq = {};
        words.forEach(word => wordFreq[word] = (wordFreq[word] || 0) + 1);

        let wordList = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 120);

        console.log('Top words:', wordList);

        canvas.width = 800;
        canvas.height = 550;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        wordList.push([song.toUpperCase(), 8]);

        WordCloud(canvas, {
            list: wordList,
            gridSize: 6,
            weightFactor: 12,
            rotateRatio: 0.2,
            rotationSteps: 1,
            backgroundColor: 'white',
            color: 'random-dark',
            shrinkToFit: true,
            drawOutOfBound: false
        });

        alert(`Word cloud generated successfully for "${song}" by ${artist}!`);

    } catch (error) {

        const elapsed = Date.now() - startTime;
        if (elapsed < MIN_LOADER_TIME) {
            await new Promise(resolve => setTimeout(resolve, MIN_LOADER_TIME - elapsed));
        }

        errorDiv.textContent = error.message;
        alert(`Error: ${error.message}`);
        console.error('Error:', error);
    } finally {
       
        loadingSpinner.classList.remove('active');
        canvas.style.opacity = '1';
    }
});
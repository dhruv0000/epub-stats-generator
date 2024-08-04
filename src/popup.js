let words = [];
let currentIndex = 0;
let scrollSize = 1;

document.getElementById('file-input').addEventListener('change', handleFileSelect);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file.type !== 'application/epub+zip') {
        alert('Please select an EPUB file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = e.target.result;
        processEpub(data);
    };
    reader.readAsArrayBuffer(file);
}

async function processEpub(data) {
    try {
        const zip = await JSZip.loadAsync(data);
        const containerXml = await zip.file('META-INF/container.xml').async('text');
        const parser = new DOMParser();
        const containerDoc = parser.parseFromString(containerXml, 'application/xml');
        const contentPath = containerDoc.querySelector('rootfile').getAttribute('full-path');
        const contentOpf = await zip.file(contentPath).async('text');
        const contentDoc = parser.parseFromString(contentOpf, 'application/xml');
        const spineItems = Array.from(contentDoc.querySelectorAll('spine itemref')).map(item => item.getAttribute('idref'));
        const manifest = Array.from(contentDoc.querySelectorAll('manifest item'));

        let allText = '';
        for (const itemId of spineItems) {
            const item = manifest.find(i => i.getAttribute('id') === itemId);
            if (item) {
                console.log(item)
                const filePath = item.getAttribute('href');
                const fileContent = await zip.file(filePath).async('text');
                const fileDoc = parser.parseFromString(fileContent, 'text/html');
                allText += fileDoc.body.textContent + ' ';
            }
        }

        words = allText.trim().split(/\s+/);
        currentIndex = 0;
        displayWord();
    } catch (error) {
        console.error('Error processing EPUB:', error);
        alert('Error processing EPUB file. Please try again.');
    }
}

function displayWord() {
    const wordDisplay = document.getElementById('word-display');
    wordDisplay.textContent = words[currentIndex] || 'No words to display';
}

function moveWords(direction) {
    currentIndex += direction * scrollSize;
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= words.length) currentIndex = words.length - 1;
    displayWord();
}

window.addEventListener('wheel', (event) => {
    if (event.deltaY < 0) {
        moveWords(-1); // Scroll up, move backwards
    } else {
        moveWords(1); // Scroll down, move forwards
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        moveWords(-1);
    } else if (event.key === 'ArrowRight') {
        moveWords(1);
    } else if (event.key === 'ArrowUp') {
        scrollSize = Math.min(scrollSize + 1, 10);
    } else if (event.key === 'ArrowDown') {
        scrollSize = Math.max(scrollSize - 1, 1);
    }
});
const root = document.getElementById('root');
const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8RdyKtIYzbBlLfxbgazlAcGm8deLRwnvEcyp_xYd9NrUQS54pJYbJwAG3Mr7wIQ/pub?output=csv'; // Jouw Sheet-link

async function fetchData() {
  try {
    const res = await fetch(sheetUrl);
    if (!res.ok) throw new Error('Fout bij het ophalen van data');
    const csvText = await res.text();
    
    // Parse CSV met Papa Parse
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transform: (value) => value.trim()
    });
    
    if (parsed.errors.length) {
      throw new Error('Fout bij het parsen van CSV: ' + parsed.errors[0].message);
    }
    
    return parsed.data;
  } catch (error) {
    console.error(error);
    root.innerHTML = '<p class="error">Fout bij het laden van de data. Probeer het later opnieuw.</p>';
    return [];
  }
}

async function render() {
  const data = await fetchData();
  if (!data.length) return;

  // Unieke weeknummers ophalen voor de dropdown
  const weeknummers = [...new Set(data.map(item => item.weeknummer))].sort((a, b) => a - b);

  // HTML voor de filter en inhoud
  root.innerHTML = `
    <h1>Scratch Messiah Studieapp</h1>
    <div class="filter">
      <label for="weekFilter">Kies weeknummer: </label>
      <select id="weekFilter">
        <option value="">Alle weken</option>
        ${weeknummers.map(week => `<option value="${week}">${week}</option>`).join('')}
      </select>
    </div>
    <div id="content"></div>
  `;

  const weekFilter = document.getElementById('weekFilter');
  const content = document.getElementById('content');

  function updateContent(selectedWeek) {
    const filteredData = selectedWeek
      ? data.filter(item => item.weeknummer === selectedWeek)
      : data;

    content.innerHTML = filteredData.length
      ? filteredData.map(item => {
          // Lijst van MP3's voor dit stuk
          const mp3s = [
            { label: 'Sopraan', url: item.sopraan_mp3 },
            { label: 'Alt', url: item.alt_mp3 },
            { label: 'Tenor', url: item.tenor_mp3 },
            { label: 'Bas', url: item.bas_mp3 },
            { label: 'Extra', url: item.extra_mp3 }
          ].filter(mp3 => mp3.url);

          return `
            <div class="stuk">
              <h2>${item.stuk}</h2>
              <h3>Uitleg:</h3>
              <textarea readonly rows="4">${item.uitleg || ''}</textarea>
              <h3>Studiepunten:</h3>
              <textarea readonly rows="4">${item.studiepunten || ''}</textarea>
              <h3>Audio:</h3>
              ${mp3s.map(mp3 => `
                <div class="audio-item">
                  <strong>${mp3.label}:</strong>
                  <audio controls src="${mp3.url}"></audio>
                </div>
              `).join('')}
              <br>
              <a href="${item.video_url}" target="_blank">Bekijk video</a>
            </div>
          `;
        }).join('')
      : '<p class="error">Geen stukken gevonden voor dit weeknummer.</p>';
  }

  // Initiële weergave
  updateContent(weekFilter.value);

  // Luister naar veranderingen in de weekfilter
  weekFilter.addEventListener('change', () => updateContent(weekFilter.value));
}

render();
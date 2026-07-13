const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQO8fE_rxMOnosorZSTsmhScq8BLX38AQV4DXOJ5aahu2Bt9a8vjbEotgFhDx4iFe0BgCt9sL3c741O/pub?gid=0&single=true&output=csv";


function formatDateRange(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);

  const opts = {
    year: "numeric",
    month: "short",
    day: "numeric"
  };

  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString(undefined, opts);
  }

  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  ) {
    return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString(undefined, {
      month: "short",
      year: "numeric"
    })}`;
  }

  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}


function createCard(event, extraClass = "") {
  return `
    <div class="event-card ${extraClass}">
      <div class="event-logo">
        <img src="${event.image}" alt="${event.title}">
      </div>

      <div class="event-info">
        <div class="event-date">
          🕑 ${formatDateRange(event.start, event.end)}
        </div>

        <div class="event-title">
          ${event.title}
        </div>

        <div class="event-location">
          📍${event.location}
        </div>
      </div>
    </div>
  `;
}


function parseCSVLine(line) {

  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {

    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    }

    else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    }

    else {
      current += char;
    }
  }

  result.push(current);

  return result.map(v =>
    v.trim().replace(/^"|"$/g, "")
  );
}


function csvToJSON(csv) {

  const lines = csv.trim().split("\n");

  const headers = parseCSVLine(lines[0]);

  return lines.slice(1).map(line => {

    const values = parseCSVLine(line);

    let obj = {};

    headers.forEach((h,i)=>{
      obj[h.trim()] = values[i] || "";
    });

    return obj;

  });
}


async function getEvents() {

  const res = await fetch(sheetURL);
  const csv = await res.text();

  const events = csvToJSON(csv);

  const now = new Date();

  const upcoming = [];
  const past = [];


  events.forEach(event => {

    const startDate = new Date(event.start.replaceAll("/", "-"));
    const endDate = new Date(event.end.replaceAll("/", "-"));

    const data = {
      ...event,
      startDate
    };


    if(endDate >= now){
      upcoming.push(data);
    }
    else{
      past.push(data);
    }

  });


  upcoming.sort((a,b)=>a.startDate-b.startDate);
  past.sort((a,b)=>b.startDate-a.startDate);


  return {upcoming,past};
}

const age = Math.floor((new Date() - new Date("2005-02-19")) / 31557600000);
document.getElementById("age").textContent = age;

const nextEventContainer = document.getElementById("next-event");

// Show loading card immediately
nextEventContainer.innerHTML = `
  <div class="event-card loading-card">
    <div class="event-info">
      <div class="event-title">
        Loading events...
      </div>
    </div>
  </div>
`;


async function loadNextEvent() {
  try {
    const { upcoming } = await getEvents();

    if (upcoming.length > 0) {
      nextEventContainer.innerHTML = createCard(upcoming[0]);
    } else {
      nextEventContainer.innerHTML = `
        <div class="event-card">
          <div class="event-info">
            <div class="event-title">
              No upcoming events
            </div>
          </div>
        </div>
      `;
    }

  } catch (error) {
    nextEventContainer.innerHTML = `
      <div class="event-card">
        <div class="event-info">
          <div class="event-title">
            Unable to load events
          </div>
        </div>
      </div>
    `;
    console.error(error);
  }
}

loadNextEvent();
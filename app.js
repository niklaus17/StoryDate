const API_URL =
  "https://script.google.com/macros/s/AKfycbwA3WJ0UmxvB4CS8wXyGfCZvk-8j0ToSdLKXfa8rmwY7z8EasY-nRrMqDOovTB785rW0g/exec";

const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user || {};

const state = {
  telegram_id: user.id || "",
  username: user.username || "",
  first_name: user.first_name || "Hei",
  status: "",
  date: "",
  time: "",
  activity: "",
  meeting_type: "",
  location: "",
  completed: "No",
};

const allowedTimes = ["19:00", "20:00", "21:00", "22:00"];
const dateInput = document.getElementById("dateInput");
const calendarGrid = document.getElementById("calendarGrid");

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
}

let minDate = "";
let maxDate = "";

function updateDateLimits() {
  const today = new Date();

  minDate = formatDate(today);
  maxDate = formatDate(addDays(today, 14));
}

function isAllowedDate(date) {
  return date >= minDate && date <= maxDate;
}

function validateSelectedDate() {
  updateDateLimits();

  if (!dateInput.value || isAllowedDate(dateInput.value)) {
    return true;
  }

  dateInput.value = "";
  alert("Alege o dată de azi până în următoarele 14 zile 😊");
  return false;
}

function getDateLabel(date, index) {
  if (index === 0) {
    return "Azi";
  }

  if (index === 1) {
    return "Mâine";
  }

  return date.toLocaleDateString("ro-RO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function renderCalendar() {
  updateDateLimits();
  calendarGrid.innerHTML = "";

  for (let index = 0; index <= 14; index += 1) {
    const date = addDays(new Date(), index);
    const value = formatDate(date);
    const button = document.createElement("button");

    button.type = "button";
    button.className = "calendar-day";
    button.dataset.date = value;
    button.innerText = getDateLabel(date, index);

    if (dateInput.value === value) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      dateInput.value = value;
      calendarGrid.classList.add("hidden");
      renderCalendar();
    });

    calendarGrid.appendChild(button);
  }
}

updateDateLimits();
renderCalendar();
dateInput.addEventListener("click", () => {
  renderCalendar();
  calendarGrid.classList.remove("hidden");
});
dateInput.addEventListener("change", validateSelectedDate);
dateInput.addEventListener("input", validateSelectedDate);

document.getElementById("title").innerText =
  state.first_name + ", ieși cu mine la o întâlnire? ❤️";

function showScreen(id) {
  document
    .querySelectorAll(".card")
    .forEach((card) => card.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function sendData() {
  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
}

function acceptInvite() {
  state.status = "accepted";
  sendData();
  showScreen("screen-date");
}

function maybeInvite() {
  state.status = "maybe";
  state.completed = "No";
  sendData();
  showScreen("screen-maybe");
}

function saveDateTime() {
  updateDateLimits();

  const date = document.getElementById("dateInput").value;
  const time = document.getElementById("timeInput").value;

  if (!date || !time) {
    alert("Alege data și ora 😊");
    return;
  }

  if (!isAllowedDate(date)) {
    document.getElementById("dateInput").value = "";
    alert("Alege o dată de azi până în următoarele 14 zile 😊");
    return;
  }

  if (!allowedTimes.includes(time)) {
    alert("Alege o oră între 19:00 și 22:00 😊");
    return;
  }

  state.date = date;
  state.time = time;
  showScreen("screen-activity");
}

function selectActivity(btn, value) {
  document
    .querySelectorAll("#screen-activity .option")
    .forEach((el) => el.classList.remove("active"));

  btn.classList.add("active");
  state.activity = value;
}

function goMeeting() {
  if (!state.activity) {
    alert("Alege o activitate 😊");
    return;
  }

  showScreen("screen-meeting");
}

function selectMeeting(value) {
  state.meeting_type = value;

  if (value.includes("Vin")) {
    showScreen("screen-location");
  } else {
    state.location = "Ne întâlnim la locație";
    buildSummary();
    showScreen("screen-confirm");
  }
}

function saveLocation() {
  const location = document.getElementById("locationInput").value.trim();

  if (!location) {
    alert("Scrie localitatea sau zona 😊");
    return;
  }

  state.location = location;
  buildSummary();
  showScreen("screen-confirm");
}

function buildSummary() {
  document.getElementById("summaryBox").innerHTML = `
        👤 Nume: ${state.first_name}<br>
        📅 Data: ${state.date}<br>
        🕒 Ora: ${state.time}<br>
        🎯 Activitate: ${state.activity}<br>
        🚗 Format: ${state.meeting_type}<br>
        📍 Locație: ${state.location}
      `;
}

function confirmInvite() {
  state.completed = "Yes";
  sendData();
  showScreen("screen-success");
}

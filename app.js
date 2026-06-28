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
let visibleMonth = new Date();

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

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
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

function getSelectedDate() {
  return dateInput.dataset.date || "";
}

function getDisplayDate(date) {
  return date.toLocaleDateString("ro-RO", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

function validateSelectedDate() {
  updateDateLimits();

  if (!getSelectedDate() || isAllowedDate(getSelectedDate())) {
    return true;
  }

  dateInput.value = "";
  dateInput.dataset.date = "";
  alert("Alege o dată de azi până în următoarele 14 zile 😊");
  return false;
}

function monthHasAllowedDates(date) {
  const monthStart = formatDate(getMonthStart(date));
  const monthEnd = formatDate(getMonthEnd(date));

  return monthStart <= maxDate && monthEnd >= minDate;
}

function renderCalendar() {
  updateDateLimits();
  calendarGrid.innerHTML = "";

  if (!monthHasAllowedDates(visibleMonth)) {
    visibleMonth = getMonthStart(new Date());
  }

  const header = document.createElement("div");
  const prevButton = document.createElement("button");
  const title = document.createElement("div");
  const nextButton = document.createElement("button");
  const weekdays = document.createElement("div");
  const days = document.createElement("div");
  const previousMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() - 1,
    1
  );
  const nextMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    1
  );

  header.className = "calendar-header";
  prevButton.type = "button";
  prevButton.className = "calendar-nav";
  prevButton.innerText = "‹";
  prevButton.disabled = !monthHasAllowedDates(previousMonth);
  prevButton.addEventListener("click", () => {
    visibleMonth = previousMonth;
    renderCalendar();
  });

  title.className = "calendar-title";
  title.innerText = visibleMonth.toLocaleDateString("ro-RO", {
    month: "long",
    year: "numeric",
  });

  nextButton.type = "button";
  nextButton.className = "calendar-nav";
  nextButton.innerText = "›";
  nextButton.disabled = !monthHasAllowedDates(nextMonth);
  nextButton.addEventListener("click", () => {
    visibleMonth = nextMonth;
    renderCalendar();
  });

  header.append(prevButton, title, nextButton);

  weekdays.className = "calendar-weekdays";
  ["L", "M", "M", "J", "V", "S", "D"].forEach((day) => {
    const item = document.createElement("span");
    item.innerText = day;
    weekdays.appendChild(item);
  });

  days.className = "calendar-days";

  const monthStart = getMonthStart(visibleMonth);
  const offset = (monthStart.getDay() + 6) % 7;
  const daysInMonth = getMonthEnd(visibleMonth).getDate();

  for (let index = 0; index < offset; index += 1) {
    const empty = document.createElement("span");
    empty.className = "calendar-empty";
    days.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      day
    );
    const value = formatDate(date);
    const button = document.createElement("button");
    const isAllowed = isAllowedDate(value);

    button.type = "button";
    button.className = "calendar-day";
    button.dataset.date = value;
    button.innerText = String(day);
    button.disabled = !isAllowed;

    if (getSelectedDate() === value) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      dateInput.value = getDisplayDate(date);
      dateInput.dataset.date = value;
      calendarGrid.classList.add("hidden");
      renderCalendar();
    });

    days.appendChild(button);
  }

  calendarGrid.append(header, weekdays, days);
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

  const date = getSelectedDate();
  const time = document.getElementById("timeInput").value;

  if (!date || !time) {
    alert("Alege data și ora 😊");
    return;
  }

  if (!isAllowedDate(date)) {
    document.getElementById("dateInput").value = "";
    document.getElementById("dateInput").dataset.date = "";
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

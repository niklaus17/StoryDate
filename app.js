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
const timeInput = document.getElementById("timeInput");
const timeOptions = document.getElementById("timeOptions");
let visibleMonth = new Date();

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
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
  const now = new Date();
  const lastSlotMinutes = 22 * 60;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const firstAvailableDate =
    currentMinutes > lastSlotMinutes ? addDays(now, 1) : now;

  minDate = formatDate(firstAvailableDate);
  maxDate = formatDate(addDays(now, 14));
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getTimeMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function isAllowedTime(time, date) {
  const today = new Date();

  if (!allowedTimes.includes(time)) {
    return false;
  }

  if (date !== formatDate(today)) {
    return true;
  }

  const currentMinutes = today.getHours() * 60 + today.getMinutes();

  return getTimeMinutes(time) >= currentMinutes;
}

function showMessage(id, message, type = "error") {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  element.innerText = message;
  element.classList.toggle("visible", Boolean(message));
  element.classList.toggle("success", Boolean(message) && type === "success");
}

function showError(id, message) {
  showMessage(id, message);
}

function updateTimeOptions() {
  const selectedDate = getSelectedDate();
  timeOptions.innerHTML = "";
  timeOptions.classList.toggle("hidden", !selectedDate);

  if (!selectedDate) {
    timeInput.value = "";
    return;
  }

  allowedTimes.forEach((time) => {
    const button = document.createElement("button");
    const isAvailable = isAllowedTime(time, selectedDate);

    button.type = "button";
    button.className = "time-option";
    button.innerText = time;
    button.disabled = !isAvailable;

    if (timeInput.value === time) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => selectTime(time));
    timeOptions.appendChild(button);
  });

  if (timeInput.value && !isAllowedTime(timeInput.value, selectedDate)) {
    timeInput.value = "";
  }
}

function selectTime(time) {
  if (!getSelectedDate()) {
    showError("dateTimeError", "Alege întâi data.");
    return;
  }

  if (!isAllowedTime(time, getSelectedDate())) {
    showError("dateTimeError", "Alege o oră disponibilă pentru data selectată.");
    return;
  }

  timeInput.value = time;
  showError("dateTimeError", "");
  updateTimeOptions();
}

function validateSelectedDate() {
  updateDateLimits();

  if (!getSelectedDate() || isAllowedDate(getSelectedDate())) {
    return true;
  }

  dateInput.value = "";
  dateInput.dataset.date = "";
  showError("dateTimeError", "Alege o dată de azi până în următoarele 14 zile.");
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
    visibleMonth = getMonthStart(parseDate(minDate));
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
      showError("dateTimeError", "");
      updateTimeOptions();
      calendarGrid.classList.add("hidden");
      renderCalendar();
    });

    days.appendChild(button);
  }

  calendarGrid.append(header, weekdays, days);
}

updateDateLimits();
renderCalendar();
updateTimeOptions();
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
    .forEach((card) => {
      card.classList.add("hidden");
      card.classList.remove("is-entering");
    });

  const screen = document.getElementById(id);
  screen.classList.remove("hidden");
  screen.classList.add("is-entering");

  if (id === "screen-date") {
    validateSelectedDate();
    renderCalendar();
    updateTimeOptions();
  }
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
  const time = timeInput.value;

  if (!date || !time) {
    showError("dateTimeError", "Alege data și ora.");
    return;
  }

  if (!isAllowedDate(date)) {
    document.getElementById("dateInput").value = "";
    document.getElementById("dateInput").dataset.date = "";
    showError("dateTimeError", "Alege o dată de azi până în următoarele 14 zile.");
    return;
  }

  if (!allowedTimes.includes(time)) {
    showError("dateTimeError", "Alege o oră între 19:00 și 22:00.");
    return;
  }

  if (!isAllowedTime(time, date)) {
    timeInput.value = "";
    updateTimeOptions();
    showError("dateTimeError", "Alege o oră disponibilă.");
    return;
  }

  showError("dateTimeError", "");
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
  showError("activityError", "");
}

function goMeeting() {
  if (!state.activity) {
    showError("activityError", "Alege o activitate.");
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
    showError("locationError", "Scrie localitatea/zona sau trimite locația din Telegram.");
    return;
  }

  state.location = location;
  showError("locationError", "");
  buildSummary();
  showScreen("screen-confirm");
}

function saveTelegramLocation(location) {
  const latitude = location.latitude;
  const longitude = location.longitude;

  if (latitude == null || longitude == null) {
    showError("locationError", "Nu am primit locația. Încearcă din nou sau scrie manual.");
    return;
  }

  state.location = `https://maps.google.com/?q=${latitude},${longitude}`;
  document.getElementById("locationInput").value = state.location;
  showMessage("locationError", "Locația a fost preluată.", "success");
}

function requestTelegramLocation() {
  const locationManager = tg.LocationManager || tg.locationManager;

  if (!locationManager || typeof locationManager.getLocation !== "function") {
    showError(
      "locationError",
      "Telegram nu permite locația aici. Scrie localitatea sau zona manual."
    );
    return;
  }

  showError("locationError", "Se cere permisiunea pentru locație...");

  const getLocation = () => {
    locationManager.getLocation((location) => {
      if (!location) {
        showError("locationError", "Nu am primit locația. Poți scrie manual.");
        return;
      }

      saveTelegramLocation(location);
    });
  };

  if (typeof locationManager.init === "function" && !locationManager.isInited) {
    locationManager.init(getLocation);
    return;
  }

  getLocation();
}

function buildSummary() {
  document.getElementById("summaryBox").innerHTML = `
        <div class="summary-row">
          <span>👤</span>
          <div><strong>Nume</strong><small>${escapeHtml(state.first_name)}</small></div>
        </div>
        <div class="summary-row">
          <span>📅</span>
          <div><strong>Data</strong><small>${escapeHtml(getDisplayDate(parseDate(state.date)))}</small></div>
        </div>
        <div class="summary-row">
          <span>🕒</span>
          <div><strong>Ora</strong><small>${escapeHtml(state.time)}</small></div>
        </div>
        <div class="summary-row">
          <span>🎯</span>
          <div><strong>Activitate</strong><small>${escapeHtml(state.activity)}</small></div>
        </div>
        <div class="summary-row">
          <span>🚶</span>
          <div><strong>Format</strong><small>${escapeHtml(state.meeting_type)}</small></div>
        </div>
        <div class="summary-row">
          <span>📍</span>
          <div><strong>Locație</strong><small>${escapeHtml(state.location)}</small></div>
        </div>
      `;
}

function confirmInvite() {
  state.completed = "Yes";
  sendData();
  showScreen("screen-success");
}


const STORAGE_KEY = "people_records";

let people = loadPeople();
let selectedPersonId = null;

/* ---------- Elements ---------- */

const searchInput = document.getElementById("searchInput");

const listView = document.getElementById("listView");
const detailsView = document.getElementById("detailsView");

const nameInput = document.getElementById("nameInput");
const addBtn = document.getElementById("addBtn");
const peopleList = document.getElementById("peopleList");

const backBtn = document.getElementById("backBtn");
const saveBtn = document.getElementById("saveBtn");
const birthdayBtn = document.getElementById("birthdayBtn");
const deleteBtn = document.getElementById("deleteBtn");

const firstNameInput = document.getElementById("firstName");
const middleNameInput = document.getElementById("middleName");
const lastNameInput = document.getElementById("lastName");
const birthdayInput = document.getElementById("birthday");
const lastSeenInput = document.getElementById("lastSeen");
const maxDaysInput = document.getElementById("maxDaysBetween");
const addressInput = document.getElementById("address");
const notesInput = document.getElementById("notes");

/* ---------- Storage ---------- */

function loadPeople() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
}

function savePeople() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
}

/* ---------- View Helpers ---------- */

function showListView() {
    listView.classList.remove("hidden");
    detailsView.classList.add("hidden");
}

function showDetailsView() {
    listView.classList.add("hidden");
    detailsView.classList.remove("hidden");
}

/* ---------- Overdue Helpers ------*/
function daysBetween(date1, date2) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.floor((utc2 - utc1) / msPerDay);
}

function isOverdue(person) {
    if (!person.lastSeen || !person.maxDaysBetween) return false;

    const lastSeenDate = new Date(person.lastSeen);
    const today = new Date();

    const daysSince = daysBetween(lastSeenDate, today);
    return daysSince > person.maxDaysBetween;
}

/* ---------- Calendar Helpers ------- */

function openBirthdayInGoogleCalendar(person) {
    if (!person.birthday) {
        alert("Please add a birthday first.");
        return;
    }

    const name = [person.firstName, person.lastName]
        .filter(Boolean)
        .join(" ");

    // Format date as YYYYMMDD (Google Calendar format)
    const date = person.birthday.replaceAll("-", "");

    const title = encodeURIComponent(`🎂 ${name}'s Birthday`);
    const details = encodeURIComponent("Birthday reminder");

    const url =
        `https://calendar.google.com/calendar/render?action=TEMPLATE` +
        `&text=${title}` +
        `&dates=${date}/${date}` +
        `&details=${details}` +
        `&recur=RRULE:FREQ=YEARLY`;

    window.open(url, "_blank");
}


/* ---------- Rendering ---------- */

function renderList() {
    peopleList.innerHTML = "";

    const query = searchInput.value.toLowerCase();

    const filteredPeople = people.filter(person => {
        const first = person.firstName.toLowerCase();
        const last = person.lastName.toLowerCase();
        return first.includes(query) || last.includes(query);
    });

    filteredPeople.forEach(person => {
        const li = document.createElement("li");
        li.textContent = `${person.firstName} ${person.lastName}`;

        if(isOverdue(person)) {
            li.classList.add("overdue"); 

            const label = document.createElement("span");
            label.textContent = "OVERDUE";
            label.className = "overdue-label"; 
            li.appendChild(label);
        }

        li.addEventListener("click", () => openDetails(person.id));
        peopleList.appendChild(li);
    });
}

/* ---------- Actions ---------- */

function openDetails(personId) {
    selectedPersonId = personId;
    const person = people.find(p => p.id === personId);

    firstNameInput.value = person.firstName || "";
    middleNameInput.value = person.middleName || "";
    lastNameInput.value = person.lastName || "";
    birthdayInput.value = person.birthday || "";
    lastSeenInput.value = person.lastSeen || "";
    maxDaysInput.value = person.maxDaysBetween || "";
    addressInput.value = person.address || "";
    notesInput.value = person.notes || "";

    showDetailsView();
}

function saveDetails() {
    const person = people.find(p => p.id === selectedPersonId);
    if (!person) return;

    person.firstName = firstNameInput.value.trim();
    person.middleName = middleNameInput.value.trim();
    person.lastName = lastNameInput.value.trim();
    person.birthday = birthdayInput.value;
    person.lastSeen = lastSeenInput.value;
    person.maxDaysBetween = Number(maxDaysInput.value) || null;
    person.address = addressInput.value.trim();
    person.notes = notesInput.value.trim();

    savePeople();
    renderList();
    showListView();

    // --- Generate next reminder for Google Calendar ---
if (person.lastSeen && person.maxDaysBetween) {
    const nextDate = new Date(person.lastSeen);
    nextDate.setDate(nextDate.getDate() + person.maxDaysBetween);

    // Set event time: 10:00 AM – 10:30 AM (local time)
    const startDate = new Date(nextDate);
    startDate.setHours(10, 0, 0, 0);

    const endDate = new Date(nextDate);
    endDate.setHours(10, 30, 0, 0);

    // Format as YYYYMMDDTHHMMSS
    const formatDateTime = (date) =>
        date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const start = formatDateTime(startDate);
    const end = formatDateTime(endDate);

    const title = encodeURIComponent(
        `Reach out to ${person.firstName} ${person.lastName}`
    );

    const details = encodeURIComponent(
        `Relationship reminder.\n\nSuggested: enable a notification for this event.`
    );

    const calendarUrl =
        `https://calendar.google.com/calendar/render?action=TEMPLATE` +
        `&text=${title}` +
        `&dates=${start}/${end}` +
        `&details=${details}`;

    if (confirm("Add a reminder to visit this person to your calendar?")) {
        window.open(calendarUrl, "_blank");
    }
}
}

/* ---------- Events ---------- */

addBtn.addEventListener("click", () => {
    const fullName = nameInput.value.trim();
    if (!fullName) return;

    const parts = fullName.split(" ");
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || "";

    people.push({
        id: Date.now(),
        firstName,
        middleName: "",
        lastName,
        birthday: "",
        lastSeen: "",
        maxDaysBetween: null,
        address: "",
        notes: ""
    });

    nameInput.value = "";
    savePeople();
    renderList();
});

backBtn.addEventListener("click", showListView);
saveBtn.addEventListener("click", saveDetails);
searchInput.addEventListener("input", renderList);

birthdayBtn.addEventListener("click", () => {
    const person = people.find(p => p.id === selectedPersonId);
    if (person) {
        openBirthdayInGoogleCalendar(person);
    }
});



deleteBtn.addEventListener("click", () => {
    if (!selectedPersonId) return;

    const person = people.find(p => p.id === selectedPersonId);
    if (!person) return;

    const confirmed = confirm(
        `Are you sure you want to delete ${person.firstName} ${person.lastName}?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    // Remove the person
    people = people.filter(p => p.id !== selectedPersonId);
    savePeople();

    // Reset state and show list
    selectedPersonId = null;
    renderList();
    showListView();
});


/* ---------- Init ---------- */

renderList();
showListView();

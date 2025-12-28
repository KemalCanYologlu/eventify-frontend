import { fetchText, parseCSV } from "./parser.js";
import { Event, Session, Participant, TicketSummary } from "./models.js";

const paths = {
  events: "data/events.csv",
  sessions: "data/sessions.csv",
  participants: "data/participants.csv",
  tickets: "data/tickets_summary.csv",
};

let EVENTS = [];
let SESSIONS = [];
let PARTICIPANTS = [];
let TICKETS = [];

const $eventSelect = document.getElementById("eventSelect");
const $participantSearch = document.getElementById("participantSearch");

const $eventsList = document.getElementById("eventsList");
const $sessionsBody = document.querySelector("#sessionsTable tbody");
const $participantsBody = document.querySelector("#participantsTable tbody");
const $ticketsBody = document.querySelector("#ticketsTable tbody");

const $eventsMeta = document.getElementById("eventsMeta");
const $sessionsMeta = document.getElementById("sessionsMeta");
const $participantsMeta = document.getElementById("participantsMeta");
const $ticketsMeta = document.getElementById("ticketsMeta");

init().catch(err => {
  console.error(err);
  alert("Failed to load CSV data. Check console and file paths.");
});

async function init() {
  const [eventsText, sessionsText, participantsText, ticketsText] = await Promise.all([
    fetchText(paths.events),
    fetchText(paths.sessions),
    fetchText(paths.participants),
    fetchText(paths.tickets),
  ]);

  EVENTS = parseCSV(eventsText).map(r => new Event(r));
  SESSIONS = parseCSV(sessionsText).map(r => new Session(r));
  PARTICIPANTS = parseCSV(participantsText).map(r => new Participant(r));
  TICKETS = parseCSV(ticketsText).map(r => new TicketSummary(r));

  populateEventSelect(EVENTS);
  wireControls();
  renderAll();
}

function wireControls() {
  $eventSelect.addEventListener("change", renderAll);
  $participantSearch.addEventListener("input", renderParticipants);
}

function populateEventSelect(events) {
  // unique by event_id
  const seen = new Set();
  const unique = [];
  for (const e of events) {
    if (!seen.has(e.event_id)) {
      seen.add(e.event_id);
      unique.push(e);
    }
  }

  unique.sort((a, b) => (a.event_id ?? 0) - (b.event_id ?? 0));
  for (const e of unique) {
    const opt = document.createElement("option");
    opt.value = String(e.event_id);
    opt.textContent = `${e.event_name} (ID: ${e.event_id})`;
    $eventSelect.appendChild(opt);
  }
}

function getSelectedEventId() {
  const v = $eventSelect.value;
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function renderAll() {
  renderEvents();
  renderSessions();
  renderTickets();
  renderParticipants();
}

/* -------- Events -------- */
function renderEvents() {
  const selectedEventId = getSelectedEventId();
  const data = selectedEventId ? EVENTS.filter(e => e.event_id === selectedEventId) : EVENTS;

  $eventsMeta.textContent = `Loaded ${EVENTS.length} event rows • Showing ${data.length}`;
  $eventsList.innerHTML = "";

  for (const e of data) {
    const div = document.createElement("div");
    div.className = "eventCard";
    div.innerHTML = `
      <h3 class="eventTitle">${escapeHtml(e.event_name)}</h3>
      <div>
        <span class="badge">${escapeHtml(e.event_type || "type")}</span>
        <span class="badge">ID: ${e.event_id ?? "-"}</span>
      </div>
      <p class="small">
        <strong>Venue:</strong> ${escapeHtml(e.venue_name || "-")} • ${escapeHtml(e.city || "-")}<br/>
        <strong>Dates:</strong> ${escapeHtml(e.start_date || "-")} → ${escapeHtml(e.end_date || "-")}
      </p>
    `;
    $eventsList.appendChild(div);
  }
}

/* -------- Sessions -------- */
function renderSessions() {
  const selectedEventId = getSelectedEventId();
  const data = selectedEventId ? SESSIONS.filter(s => s.event_id === selectedEventId) : SESSIONS;

  $sessionsMeta.textContent = `Loaded ${SESSIONS.length} sessions • Showing ${data.length}`;
  $sessionsBody.innerHTML = "";

  for (const s of data) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(s.event_name || `Event ${s.event_id}`)}</td>
      <td>${escapeHtml(s.session_title)}</td>
      <td>${escapeHtml(s.hall_name)}</td>
      <td>${escapeHtml(s.start_time)}</td>
      <td>${escapeHtml(s.end_time)}</td>
    `;
    $sessionsBody.appendChild(tr);
  }
}

/* -------- Tickets -------- */
function renderTickets() {
  const selectedEventId = getSelectedEventId();
  const data = selectedEventId ? TICKETS.filter(t => t.event_id === selectedEventId) : TICKETS;

  $ticketsMeta.textContent = `Loaded ${TICKETS.length} ticket-type rows • Showing ${data.length}`;
  $ticketsBody.innerHTML = "";

  for (const t of data) {
    const ratio = t.fillRatio();
    const pct = Math.round(ratio * 100);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(t.event_name || `Event ${t.event_id}`)}</td>
      <td>${escapeHtml(t.ticket_type)}</td>
      <td>${t.capacity}</td>
      <td>${t.sold_tickets}</td>
      <td>
        <div class="progress" title="${pct}%">
          <div style="width:${pct}%"></div>
        </div>
      </td>
    `;
    $ticketsBody.appendChild(tr);
  }
}

/* -------- Participants -------- */
function renderParticipants() {
  const q = ($participantSearch.value || "").trim().toLowerCase();
  let data = PARTICIPANTS;

  if (q) {
    data = data.filter(p =>
      p.fullName().toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q)
    );
  }

  $participantsMeta.textContent = `Loaded ${PARTICIPANTS.length} participants • Showing ${data.length}`;
  $participantsBody.innerHTML = "";

  for (const p of data.slice(0, 200)) { // keep UI snappy
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.participant_id ?? "-"}</td>
      <td>${escapeHtml(p.fullName())}</td>
      <td>${escapeHtml(p.email)}</td>
    `;
    $participantsBody.appendChild(tr);
  }

  if (data.length > 200) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="3" style="color:#9bb0c6;">Showing first 200 results… refine search to narrow down.</td>`;
    $participantsBody.appendChild(tr);
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

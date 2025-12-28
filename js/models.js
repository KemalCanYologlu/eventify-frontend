import { toInt } from "./parser.js";

export class Event {
  constructor(row) {
    this.event_id = toInt(row.event_id);
    this.event_name = row.event_name;
    this.event_type = row.event_type;
    this.start_date = row.start_date;
    this.end_date = row.end_date;
    this.venue_name = row.venue_name;
    this.city = row.city;
  }
}

export class Session {
  constructor(row) {
    this.session_id = toInt(row.session_id);
    this.event_id = toInt(row.event_id);
    this.event_name = row.event_name;
    this.session_title = row.session_title;
    this.start_time = row.start_time;
    this.end_time = row.end_time;
    this.hall_name = row.hall_name;
  }
}

export class Participant {
  constructor(row) {
    this.participant_id = toInt(row.participant_id);
    this.first_name = row.first_name;
    this.last_name = row.last_name;
    this.email = row.email;
  }
  fullName() { return `${this.first_name} ${this.last_name}`.trim(); }
}

export class TicketSummary {
  constructor(row) {
    this.event_id = toInt(row.event_id);
    this.event_name = row.event_name;
    this.ticket_type = row.ticket_type;
    this.capacity = toInt(row.capacity) ?? 0;
    this.sold_tickets = toInt(row.sold_tickets) ?? 0;
  }
  fillRatio() {
    if (!this.capacity) return 0;
    return Math.min(1, this.sold_tickets / this.capacity);
  }
}

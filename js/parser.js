export async function fetchText(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return await res.text();
}

/**
 * Basic CSV parser:
 * - supports quoted fields
 * - returns array of objects (header row -> keys)
 */
export function parseCSV(csvText) {
  const lines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim() !== "");
  if (lines.length < 2) return [];

  const rows = lines.map(parseCSVLine);
  const header = rows[0].map(h => h.trim());
  const dataRows = rows.slice(1);

  return dataRows.map(cols => {
    const obj = {};
    for (let i = 0; i < header.length; i++) {
      obj[header[i]] = (cols[i] ?? "").trim();
    }
    return obj;
  });
}

function parseCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"' ) {
      // handle escaped quote ""
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function toInt(val) {
  const n = Number.parseInt(val, 10);
  return Number.isFinite(n) ? n : null;
}

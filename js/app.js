(() => {
  "use strict";

  // Neonfarben mit Namen; bei mehr Teams werden weitere Farbtöne per Goldenem Winkel erzeugt.
  const PALETTE = [
    { name: "Neonpink", value: "#ff2e93" },
    { name: "Cyan", value: "#00f0ff" },
    { name: "Zitronengelb", value: "#ffe94d" },
    { name: "Limette", value: "#7dff3a" },
    { name: "Orange", value: "#ff8a1f" },
    { name: "Lila", value: "#b04dff" },
    { name: "Rot", value: "#ff3b3b" },
    { name: "Türkis", value: "#1fffc0" },
    { name: "Himmelblau", value: "#3d8bff" },
    { name: "Magenta", value: "#ff4df0" },
    { name: "Gold", value: "#ffc21f" },
    { name: "Mint", value: "#9bffd6" },
    { name: "Koralle", value: "#ff7a6b" },
    { name: "Lavendel", value: "#c9a6ff" },
    { name: "Giftgrün", value: "#c6ff1f" },
    { name: "Pfirsich", value: "#ffb38a" },
    { name: "Eisblau", value: "#a6f0ff" },
    { name: "Himbeere", value: "#e0115f" },
    { name: "Smaragd", value: "#22d97a" },
    { name: "Kaugummi", value: "#ff9ed8" },
  ];

  const STORAGE_KEY = "teambuilder.v1";
  const $ = (id) => document.getElementById(id);
  const els = {
    form: $("addForm"), player: $("player"), list: $("players"), size: $("size"), minus: $("minus"), plus: $("plus"),
    count: $("count"), hint: $("hint"), error: $("error"), build: $("build"),
    clear: $("clear"), setup: $("setup"), result: $("result"), teams: $("teams"),
    reshuffle: $("reshuffle"), copy: $("copy"), back: $("back"),
  };

  let players = [];
  let lastTeams = [];

  // ---------- Hilfsfunktionen ----------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Eingegebene Namen hinzufügen; "Anna, Ben" fügt beide auf einmal hinzu.
  function addPlayers(raw) {
    const added = raw.split(/[\n,;]+/).map((n) => n.trim()).filter(Boolean);
    if (!added.length) return;
    const from = players.length;
    players.push(...added);
    renderPlayers(from);
    els.list.lastElementChild?.scrollIntoView({ block: "nearest" });
  }

  function removePlayer(index) {
    players.splice(index, 1);
    renderPlayers();
  }

  // Nur Chips ab Index "animateFrom" bekommen die Einblend-Animation.
  function renderPlayers(animateFrom = Infinity) {
    els.list.replaceChildren(...players.map((name, i) => {
      const li = document.createElement("li");
      li.className = i >= animateFrom ? "chip fresh" : "chip";
      const label = document.createElement("span");
      label.textContent = name;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "×";
      btn.setAttribute("aria-label", `${name} entfernen`);
      btn.addEventListener("click", () => removePlayer(i));
      li.append(label, btn);
      return li;
    }));
    updateInfo();
    save();
  }

  function getSize() {
    const n = parseInt(els.size.value, 10);
    return Number.isFinite(n) && n > 0 ? Math.min(n, 50) : 1;
  }

  // Anzahl Teams = abgerundet; Restspieler werden reihum auf die Teams verteilt,
  // damit niemand allein bleibt (z. B. 7 Spieler, 2 pro Team -> 2 + 2 + 3).
  function plan(playerCount, size) {
    const teamCount = Math.max(1, Math.floor(playerCount / size));
    const rest = playerCount - teamCount * size;
    return { teamCount, rest };
  }

  function pickColors(count) {
    const colors = shuffle(PALETTE);
    const golden = 137.508;
    for (let i = colors.length; i < count; i++) {
      const hue = Math.round((i * golden) % 360);
      colors.push({ name: `Farbe ${i + 1}`, value: `hsl(${hue} 100% 62%)` });
    }
    return colors.slice(0, count);
  }

  function pickTeamNames(count) {
    const pool = shuffle(TEAM_NAMES);
    const out = [];
    for (let i = 0; i < count; i++) {
      const round = Math.floor(i / pool.length);
      const base = pool[i % pool.length];
      out.push(round === 0 ? base : `${base} ${round + 1}.0`);
    }
    return out;
  }

  function buildTeams(players, size) {
    const shuffled = shuffle(players);
    const { teamCount } = plan(players.length, size);
    const names = pickTeamNames(teamCount);
    const colors = pickColors(teamCount);
    const teams = names.map((name, i) => ({ name, color: colors[i], members: [] }));
    shuffled.forEach((p, i) => teams[i % teamCount].members.push(p));
    return teams;
  }

  // ---------- Darstellung ----------
  function updateInfo() {
    const size = getSize();
    els.count.textContent = `${players.length} Mitspieler`;
    els.error.textContent = "";

    if (players.length < 2) { els.hint.textContent = ""; return; }
    if (players.length < size) {
      els.hint.textContent = `Zu wenige Spieler für ${size}er-Teams – es gibt 1 Team mit allen.`;
      return;
    }
    const { teamCount, rest } = plan(players.length, size);
    let txt = `→ ${teamCount} Team${teamCount === 1 ? "" : "s"} à ${size}`;
    if (rest > 0) txt += ` (${rest} Team${rest === 1 ? "" : "s"} mit ${size + 1}, damit keiner allein bleibt)`;
    els.hint.textContent = txt;
  }

  function render(teams) {
    els.teams.replaceChildren();
    teams.forEach((team, i) => {
      const card = document.createElement("article");
      card.className = "team";
      card.style.setProperty("--c", team.color.value);
      card.style.animationDelay = `${i * 90}ms`;

      const no = document.createElement("div");
      no.className = "team-no";
      no.textContent = String(i + 1);

      const h = document.createElement("h3");
      h.className = "team-name";
      h.textContent = team.name;

      const color = document.createElement("div");
      color.className = "team-color";
      const sw = document.createElement("span");
      sw.className = "swatch";
      color.append(sw, document.createTextNode(team.color.name));

      const ul = document.createElement("ul");
      ul.className = "members";
      team.members.forEach((m) => {
        const li = document.createElement("li");
        const av = document.createElement("span");
        av.className = "avatar";
        av.textContent = m.charAt(0).toUpperCase();
        li.append(av, document.createTextNode(m));
        ul.append(li);
      });

      card.append(no, h, color, ul);
      els.teams.append(card);
    });
  }

  function generate() {
    if (players.length < 2) {
      els.error.textContent = "Mindestens 2 Mitspieler eintragen!";
      return;
    }
    lastTeams = buildTeams(players, getSize());
    render(lastTeams);
    els.setup.hidden = true;
    els.result.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
    confetti();
  }

  // ---------- Konfetti ----------
  const canvas = $("confetti");
  const ctx = canvas.getContext("2d");
  let pieces = [];
  let rafId = null;

  function confetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = PALETTE.map((c) => c.value);
    for (let i = 0; i < 160; i++) {
      pieces.push({
        x: innerWidth / 2 + (Math.random() - 0.5) * 120,
        y: innerHeight * 0.35,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 14 - 4,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        c: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pieces = pieces.filter((p) => p.y < innerHeight + 40);
    for (const p of pieces) {
      p.vy += 0.35;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    rafId = pieces.length ? requestAnimationFrame(tick) : null;
  }

  // ---------- Speicher (nur Komfort, darf fehlschlagen) ----------
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, size: els.size.value }));
    } catch (_) { /* ignorieren */ }
  }

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (data) {
        if (Array.isArray(data.players)) players = data.players.filter((p) => typeof p === "string");
        els.size.value = data.size || 2;
      }
    } catch (_) { /* ignorieren */ }
  }

  // ---------- Events ----------
  function stepSize(delta) {
    els.size.value = Math.max(1, Math.min(50, getSize() + delta));
    updateInfo();
    save();
  }

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    addPlayers(els.player.value);
    els.player.value = "";
    els.player.focus();
  });
  els.size.addEventListener("input", () => { updateInfo(); save(); });
  els.size.addEventListener("blur", () => { els.size.value = getSize(); updateInfo(); });
  els.minus.addEventListener("click", () => stepSize(-1));
  els.plus.addEventListener("click", () => stepSize(1));
  els.clear.addEventListener("click", () => { players = []; renderPlayers(); els.player.focus(); });
  els.build.addEventListener("click", generate);
  els.reshuffle.addEventListener("click", generate);
  els.back.addEventListener("click", () => {
    els.result.hidden = true;
    els.setup.hidden = false;
    els.player.focus();
  });
  els.copy.addEventListener("click", async () => {
    const text = lastTeams
      .map((t, i) => `${i + 1}. ${t.name} (${t.color.name})\n   ${t.members.join(", ")}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      els.copy.textContent = "✅ Kopiert!";
    } catch (_) {
      els.copy.textContent = "❌ Nicht möglich";
    }
    setTimeout(() => { els.copy.textContent = "📋 Kopieren"; }, 1800);
  });

  load();
  renderPlayers();
})();

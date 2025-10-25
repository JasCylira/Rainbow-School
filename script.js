/* ===== Rainbow School — script.js ===== */
/* Thème, popup SoundCloud, Vote matière (FAB+modale), Contact (prévisualisation + backends optionnels),
   checklist étude, formulaires mailto (participate/register) */

/* ---------- BACKEND CONTACT (facultatif) ---------- */
// "mailto" (par défaut), "formspree" ou "supabase"
const BACKEND_MODE = "mailto";
// Si "formspree": colle l'endpoint (ex: https://formspree.io/f/xxxxxxx)
const FORMSPREE_ENDPOINT = "";
// Si "supabase": configure ces champs + table "contacts"
const SUPABASE_URL = "";         // ex: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "";    // ex: eyJhbGciOi...
const SUPABASE_CONTACT_TABLE = "contacts";

/* ---------- MATIÈRES (pour le vote) ---------- */
const subjects = [
  "Informatique","Musique","Art & Design","Game Dev","Écriture & Lore","Langues (EN)"
];

/* ========== Thème light/dark ========== */
(function(){
  const saved = localStorage.getItem("theme");
  if(saved) document.documentElement.setAttribute("data-theme", saved);
  const btn = document.getElementById("themeToggle");
  if(btn){
    btn.addEventListener("click", ()=>{
      const cur = document.documentElement.getAttribute("data-theme");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }
})();

/* ========== SoundCloud popup ========== */
(function(){
  const popup = document.getElementById("scPopup");
  if(!popup) return;
  popup.querySelector(".close").addEventListener("click", ()=> popup.remove());
})();

/* ========== Vote matière — FAB + Modale (discret) ========== */
(function(){
  const fab = document.createElement("button");
  fab.className = "vote-fab"; fab.type = "button"; fab.title = "Voter pour ta matière préférée"; fab.textContent = "🗳️ Voter";

  const backdrop = document.createElement("div"); backdrop.className = "vote-modal-backdrop";
  const modal = document.createElement("div"); modal.className = "vote-modal glass";
  modal.innerHTML = `
    <div class="top">
      <h3>💗 Matière préférée</h3>
      <button class="vote-close" title="Fermer">×</button>
    </div>
    <form id="voteForm" class="row-gap">
      <select id="voteSelect" required>
        <option value="" disabled selected>Choisis une matière…</option>
        ${subjects.map(s=>`<option>${s}</option>`).join("")}
      </select>
      <button class="btn small" type="submit">Enregistrer</button>
      <div id="voteYou" class="muted small"></div>
    </form>
    <div class="bar-stats" id="voteBars"></div>
    <p class="tiny muted">Stats locales au navigateur.</p>
  `;
  backdrop.appendChild(modal);
  document.body.appendChild(fab); document.body.appendChild(backdrop);

  const open = ()=> { backdrop.style.display = "flex"; renderBars(); loadMine(); };
  const close = ()=> { backdrop.style.display = "none"; };
  fab.addEventListener("click", open);
  modal.querySelector(".vote-close").addEventListener("click", close);
  backdrop.addEventListener("click", (e)=> { if(e.target === backdrop) close(); });

  const form = modal.querySelector("#voteForm");
  const select = modal.querySelector("#voteSelect");
  const you = modal.querySelector("#voteYou");
  const bars = modal.querySelector("#voteBars");

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const value = select.value;
    if(!value) return;
    localStorage.setItem("favoriteSubject", value);
    incrementLocalCount(value);
    you.textContent = `Ta matière actuelle : ${value} ✨`;
    renderBars();
  });

  function loadMine(){
    const myFav = localStorage.getItem("favoriteSubject") || "";
    if(myFav){
      [...select.options].forEach(o=>o.selected = o.value === myFav);
      you.textContent = `Ta matière actuelle : ${myFav} ✨`;
    } else { select.selectedIndex = 0; you.textContent = ""; }
  }
  function renderBars(){
    const totals = getLocalTotals();
    const max = Math.max(1, ...Object.values(totals));
    bars.innerHTML = "";
    subjects.forEach(sub=>{
      const count = totals[sub] || 0;
      const pct = Math.round((count / max) * 100);
      const row = document.createElement("div");
      row.className = "bar";
      row.innerHTML = `
        <div class="label small">${sub}</div>
        <div class="track"><div class="fill" style="width:${pct}%"></div></div>
        <div class="count small">${count}</div>
      `;
      bars.appendChild(row);
    });
  }
  function getLocalTotals(){
    const json = localStorage.getItem("favoriteTotals");
    return json ? JSON.parse(json) : {};
  }
  function incrementLocalCount(sub){
    const totals = getLocalTotals();
    totals[sub] = (totals[sub] || 0) + 1;
    localStorage.setItem("favoriteTotals", JSON.stringify(totals));
  }
})();

/* ========== Helpers ========== */
function setAlert(el, type, msg){
  if(!el) return; el.hidden = !msg;
  el.className = `alert ${type||""}`.trim(); el.textContent = msg || "";
}
function toMailto({to, subject, body}){
  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

/* ========== Contact : modale de confirmation + backends ========== */
(function(){
  const form = document.getElementById("contactForm");
  if(!form) return;

  const alertBox = document.getElementById("contactAlert");
  const submitBtn = document.getElementById("contactSubmit");
  const messageArea = document.getElementById("contactMessage");
  const counter = document.getElementById("msgCount");

  if(messageArea && counter){
    const updateCount = ()=> counter.textContent = `${messageArea.value.length}/1000`;
    messageArea.addEventListener("input", updateCount); updateCount();
  }

  const backdrop = document.getElementById("confirmBackdrop");
  const modalClose = backdrop?.querySelector(".modal-close");
  const confirmSummary = document.getElementById("confirmSummary");
  const confirmEdit = document.getElementById("confirmEdit");
  const confirmSend = document.getElementById("confirmSend");
  const openModal = ()=> { if(backdrop) backdrop.style.display = "flex"; };
  const closeModal = ()=> { if(backdrop) backdrop.style.display = "none"; };

  modalClose?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", (e)=> { if(e.target === backdrop) closeModal(); });
  confirmEdit?.addEventListener("click", closeModal);

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    setAlert(alertBox, "", "");

    if((form.website?.value || "").trim() !== ""){ // honeypot
      setAlert(alertBox, "error", "Erreur : détection anti-spam.");
      return;
    }

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const topic = form.topic.value;
    const message = form.message.value.trim();
    const consent = form.consent.checked;

    if(!name || !email || !topic || !message || !consent){
      setAlert(alertBox, "error", "Merci de compléter tous les champs obligatoires.");
      return;
    }

    const when = new Date().toLocaleString();
    const preview =
`De : ${name}
Email : ${email}
Sujet : ${topic}
Date : ${when}

Message :
${message}`;
    if(confirmSummary){ confirmSummary.textContent = preview; }
    openModal();

    confirmSend.onclick = async ()=>{
      closeModal();
      submitBtn.disabled = true;
      try{
        if(BACKEND_MODE === "mailto"){
          const body = `${preview}\n\n— Envoyé depuis Rainbow School`;
          setAlert(alertBox, "success", "Ouverture de ton client mail… Merci ! 💌");
          toMailto({to:"JasCylira@outlook.fr", subject:`[Rainbow School] ${topic}`, body});
        } else if(BACKEND_MODE === "formspree"){
          if(!FORMSPREE_ENDPOINT) throw new Error("FORMSPREE_ENDPOINT manquant.");
          const res = await fetch(FORMSPREE_ENDPOINT, {
            method:"POST", headers:{"Accept":"application/json","Content-Type":"application/json"},
            body: JSON.stringify({ name, email, topic, message, consent })
          });
          if(!res.ok) throw new Error("Formspree a renvoyé une erreur.");
          setAlert(alertBox, "success", "Message envoyé ✅ Merci !");
          form.reset(); if(counter) counter.textContent = "0/1000";
        } else if(BACKEND_MODE === "supabase"){
          if(!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Clés Supabase manquantes.");
          const res = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_CONTACT_TABLE}`, {
            method:"POST",
            headers:{
              "Content-Type":"application/json",
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
              "Prefer":"return=minimal"
            },
            body: JSON.stringify({ name, email, topic, message })
          });
          if(!res.ok) throw new Error("Erreur d’insertion Supabase.");
          setAlert(alertBox, "success", "Message enregistré ✅ Merci !");
          form.reset(); if(counter) counter.textContent = "0/1000";
        } else {
          throw new Error("BACKEND_MODE invalide.");
        }
      } catch(err){
        console.error(err);
        setAlert(alertBox, "error", "Oups, échec de l’envoi. Réessaie ou utilise l’email direct.");
      } finally {
        submitBtn.disabled = false;
      }
    };
  });
})();

/* ========== Formulaires Participate / Register (mailto) ========== */
(function(){
  // Disponibilités
  const avail = document.getElementById("availabilityForm");
  if(avail){
    avail.addEventListener("submit",(e)=>{
      e.preventDefault();
      const pseudo = avail.pseudo.value.trim();
      const matter = avail.matter.value;
      const days = [...avail.querySelectorAll('input[name="days"]:checked')].map(i=>i.value).join(", ");
      const slot = avail.slot.value;
      const note = avail.notes.value.trim();
      const body = `Pseudo: ${pseudo}\nMatière: ${matter}\nJours: ${days}\nCréneau: ${slot}\nNotes: ${note}`;
      toMailto({to:"JasCylira@outlook.fr", subject:"[Rainbow School] Disponibilités proposées", body});
    });
  }

  // Enregistrement membre
  const reg = document.getElementById("registerForm");
  if(reg){
    reg.addEventListener("submit",(e)=>{
      e.preventDefault();
      const pseudo = reg.pseudo.value.trim();
      const email = reg.email.value.trim();
      const fav = reg.favorite.value;
      const why = reg.why.value.trim();
      const body = `Pseudo: ${pseudo}\nEmail: ${email}\nMatière préférée: ${fav}\nMotivation:\n${why}`;
      toMailto({to:"JasCylira@outlook.fr", subject:"[Rainbow School] Nouvelle inscription membre", body});
    });
  }
})();

/* ========== Study checklist (localStorage) ========== */
(function(){
  const checklist = document.getElementById("studyChecklist");
  if(!checklist) return;
  const key = "studyChecklistItems";
  const input = document.getElementById("newTask");
  const list = document.getElementById("taskList");

  function load(){
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    list.innerHTML = "";
    items.forEach((it, idx)=>{
      const li = document.createElement("li");
      li.innerHTML = `
        <label class="task" style="display:flex;gap:8px;align-items:center;justify-content:space-between;background:var(--card);padding:8px 10px;border:1px solid var(--border);border-radius:12px;">
          <span style="display:flex;gap:8px;align-items:center;">
            <input type="checkbox" ${it.done?"checked":""} data-idx="${idx}">
            <span>${it.text}</span>
          </span>
          <button class="remove" data-idx="${idx}" title="Supprimer" style="border:0;background:transparent;cursor:pointer;">🗑️</button>
        </label>
      `;
      list.appendChild(li);
    });
  }
  function save(items){ localStorage.setItem(key, JSON.stringify(items)); }
  checklist.addEventListener("submit",(e)=>{
    e.preventDefault();
    const txt = (input.value||"").trim();
    if(!txt) return;
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    items.push({text:txt, done:false});
    save(items); input.value=""; load();
  });
  list.addEventListener("click",(e)=>{
    const idx = e.target.getAttribute("data-idx");
    if(idx===null) return;
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    if(e.target.matches('input[type="checkbox"]')){ items[idx].done = e.target.checked; save(items); }
    if(e.target.matches('.remove')){ items.splice(Number(idx),1); save(items); load(); }
  });
  load();
})();

(function () {
  var $ = function (id) { return document.getElementById(id); };

  function h(tag, props) {
    var el = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k.indexOf("on") === 0) el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, v);
    });
    var kids = Array.prototype.slice.call(arguments, 2);
    (function add(list) {
      list.forEach(function (kid) {
        if (kid == null || kid === false) return;
        if (Array.isArray(kid)) return add(kid);
        el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
      });
    })(kids);
    return el;
  }

  var API_URL = window.TRIP_API_URL || "/api/generate";
  var backendAvailable = true;
  // The backend owns the actual instructions and does real web search (see api/prompt.js,
  // api/generate.js) — this just posts the current trip/draft/feedback and streams back JSONL.
  function generate(payload, opts) {
    opts = opts || {};
    return fetch(API_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload), signal: opts.signal })
      .then(function (r) {
        if (r.status === 404 || r.status === 405 || r.status === 501) throw { code: "no_backend" };
        if (r.status === 429) throw { code: "rate_limited" };
        if (r.status === 400) throw { code: "invalid_request" };
        if (!r.ok) throw { code: "upstream_error" };
        return r.json();
      })
      .then(function (d) {
        var text = String((d && d.text) || "");
        if (!text.trim()) throw { code: "empty_completion" };
        return { text: text };
      })
      .catch(function (e) {
        if (e && e.name === "AbortError") throw { code: "cancelled" };
        if (e && e.code) throw e;
        throw { code: "upstream_error" };
      });
  }

  var state = {
    stage: "form",
    trip: null,
    meta: null,
    items: [],
    feedbackLog: [],
    fbText: "",
    busy: false,
    ctl: null,
    status: "",
    error: "",
    approved: false
  };

  var PHOTO_RULES = [
    [/temple square/i, ["temple1", "temple2"]],
    [/natural history museum of utah|nhmu|utah museum of natural/i, ["nhmu2"]],
    [/red butte/i, ["rbg2", "rbg1"]],
    [/ensign peak/i, ["ensign1", "ensign2"]],
    [/antelope island/i, ["ai1", "ai2"]],
    [/alpine loop/i, ["alpine1"]],
    [/snowbird|little cottonwood|oktoberfest/i, ["lcc1", "lcc2"]],
    [/state capitol/i, ["capitol1"]],
    [/bonneville|salt flats/i, ["salt1"]],
    [/hogle/i, ["zoo1"]]
  ];
  function inRegion() { return !!(state.trip && /salt lake|slc|utah/i.test(state.trip.destination)); }
  function photosFor(name) {
    if (!inRegion()) return [];
    for (var n = 0; n < PHOTO_RULES.length; n++) {
      if (PHOTO_RULES[n][0].test(name)) return PHOTO_RULES[n][1].map(function (k) { return PHOTOS[k]; }).filter(Boolean);
    }
    return [];
  }
  function extLink(text, url) { return h("a", { href: url, target: "_blank", rel: "noopener noreferrer" }, text); }
  function photosNode(ps) {
    if (!ps.length) return null;
    return h("div", { class: "photos" + (ps.length === 1 ? " one" : "") }, ps.map(function (p) {
      return h("figure", null,
        h("img", { src: p.src, alt: p.alt, loading: "lazy" }),
        h("figcaption", null, "Photo: ", extLink(p.artist + " · " + p.license, p.page))
      );
    }));
  }
  function linkRow(name) {
    var q = encodeURIComponent(name + " " + (state.trip ? state.trip.destination : ""));
    return h("div", { class: "links" },
      extLink("See photos ↗", "https://www.google.com/search?tbm=isch&q=" + q),
      extLink("Open in Maps ↗", "https://www.google.com/maps/search/?api=1&query=" + q),
      extLink("Search the web ↗", "https://www.google.com/search?q=" + q + "+official+site")
    );
  }

  var EXAMPLE_TRIP = { destination: "Salt Lake City, Utah", start: "2026-10-16", end: "2026-10-18", days: 3, size: 3, who: "3 adult women, ages 30s to 50s", notes: "One medium-level hike. A mix of tourist highlights and local favorites. Fall colors if possible." };
  var EXAMPLE = {
    meta: {
      assumptions: "3 adults in their 30s to 50s, treated as a general adult audience with moderate fitness. No reference doc was provided, so there are no duplicate or conflict flags.",
      weather: "October highs near 62°F and lows near 40°F, with a few frosty nights; the canyons run cooler. Fall color peaks in early to mid October. These are seasonal norms, not a live forecast."
    },
    items: [
      { type: "item", location: "Downtown", cluster: "Early days", name: "Temple Square grounds and Visitors' Center", desc: "Free walk-through of the grounds and the newly opened Visitors' Center.", accommodates: "All adults; flat and easy.", alternate: "", reservation: "no", reservation_note: "Visitors' Center open daily 9am to 9pm, no tickets.", favorite: "tourist", status: "verify", status_note: "The Salt Lake Temple interior, Beehive House and Lion House are closed for renovation until 2027." },
      { type: "item", location: "Downtown", cluster: "Early days", name: "Ken Sanders Rare Books", desc: "Rare and out-of-print books, maps and postcards in a quirky shop.", accommodates: "All adults.", alternate: "", reservation: "no", reservation_note: "Tue to Sun 10am to 6pm; closed Mondays.", favorite: "local", status: "ok", status_note: "" },
      { type: "item", location: "University foothills and neighborhoods", cluster: "Middle days", name: "Natural History Museum of Utah", desc: "Dinosaur fossils and Utah natural history, with a valley view.", accommodates: "All adults; a good cold or rainy-day option.", alternate: "", reservation: "unclear", reservation_note: "Timed tickets online are likely worth it.", favorite: "tourist", status: "ok", status_note: "" },
      { type: "item", location: "University foothills and neighborhoods", cluster: "Middle days", name: "Red Butte Garden", desc: "Foothill gardens and trails, a 5-minute walk from the museum. Pair the two.", accommodates: "All adults; gentle paths.", alternate: "", reservation: "no", reservation_note: "Only the ticketed Garden After Dark (Oct 15 to 30) needs tickets.", favorite: "local", status: "ok", status_note: "" },
      { type: "item", location: "University foothills and neighborhoods", cluster: "Middle days", name: "The Living Room hike", desc: "Medium hike: about 2.3 to 2.5 miles round trip, roughly 1,000 ft of climbing, to natural rock \"furniture\" with a valley view. Allow 1.5 to 2 hours.", accommodates: "Adults with moderate fitness; steep and mostly unshaded.", alternate: "Ensign Peak (shorter, also steep) or Lower Bells Canyon Reservoir (longer, harder).", reservation: "no", reservation_note: "Trailhead parking is tight; the museum lot is only usable after 5pm.", favorite: "local", status: "verify", status_note: "Distances vary by source; check current trail conditions." },
      { type: "item", location: "University foothills and neighborhoods", cluster: "Middle days", name: "Sugar House and 9th & 9th", desc: "Coffee shops, record stores and indie boutiques.", accommodates: "All adults; walkable.", alternate: "", reservation: "no", reservation_note: "", favorite: "local", status: "verify", status_note: "Single-source recommendation; confirm the hours of specific shops." },
      { type: "item", location: "University foothills and neighborhoods", cluster: "Middle days", name: "The Avenues and Rye Diner", desc: "Historic-homes neighborhood with a retro diner and cocktails.", accommodates: "All adults.", alternate: "", reservation: "unclear", reservation_note: "Check for a wait at peak times.", favorite: "local", status: "verify", status_note: "Single-source recommendation; check current hours." },
      { type: "item", location: "University foothills and neighborhoods", cluster: "Middle days", name: "Ensign Peak", desc: "About a half-mile hike to a skyline view over the city and the Great Salt Lake.", accommodates: "Adults with moderate fitness; short but steep.", alternate: "The views from Red Butte Garden.", reservation: "no", reservation_note: "", favorite: "local", status: "ok", status_note: "" },
      { type: "item", location: "Day trips", cluster: "Later days", name: "Antelope Island State Park", desc: "Causeway drive with wild bison, mule deer and pronghorn; fall is prime wildlife viewing.", accommodates: "All adults; easy drive, optional hikes.", alternate: "", reservation: "no", reservation_note: "", favorite: "local", status: "ok", status_note: "" },
      { type: "item", location: "Day trips", cluster: "Later days", name: "Alpine Loop scenic drive", desc: "Canyon drive at peak fall color in early to mid October.", accommodates: "All adults; driving only.", alternate: "", reservation: "no", reservation_note: "", favorite: "local", status: "verify", status_note: "The road normally closes for winter around November 1; check UDOT for the 2026 date." },
      { type: "item", location: "Day trips", cluster: "Later days", name: "Snowbird Oktoberfest (optional)", desc: "Beer and Bavarian food against fall foliage, up Little Cottonwood Canyon.", accommodates: "Adults.", alternate: "", reservation: "unclear", reservation_note: "", favorite: "tourist", status: "verify", status_note: "2026 dates are unconfirmed; one source said \"through October 11.\" Verify against your dates." }
    ]
  };
  function loadExample() {
    if (state.busy) return;
    $("destination").value = EXAMPLE_TRIP.destination;
    $("start").value = EXAMPLE_TRIP.start;
    $("end").value = EXAMPLE_TRIP.end;
    $("size").value = EXAMPLE_TRIP.size;
    $("who").value = EXAMPLE_TRIP.who;
    $("notes").value = EXAMPLE_TRIP.notes;
    syncForm();
    state.trip = EXAMPLE_TRIP;
    state.meta = EXAMPLE.meta;
    state.items = EXAMPLE.items.slice();
    state.stage = "draft";
    state.feedbackLog = [];
    state.fbText = "";
    state.error = "";
    state.approved = false;
    render();
  }

  function parseDate(v) { return v ? new Date(v + "T00:00:00") : null; }
  function fmt(d) { return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  function dayCount() {
    var s = parseDate($("start").value), e = parseDate($("end").value);
    if (!s || !e || e < s) return 0;
    return Math.round((e - s) / 86400000) + 1;
  }
  function syncForm() {
    var n = parseInt($("size").value, 10);
    if (!(n >= 1)) n = 0;
    $("size-readout").textContent = n === 1 ? "1 traveler" : n + " travelers";
    var d = dayCount();
    $("days-note").textContent = d ? d + (d === 1 ? " day" : " days") : "Pick a start and end date";
  }
  $("size-minus").addEventListener("click", function () { $("size").value = Math.max(1, (parseInt($("size").value, 10) || 1) - 1); syncForm(); });
  $("size-plus").addEventListener("click", function () { $("size").value = Math.min(60, (parseInt($("size").value, 10) || 0) + 1); syncForm(); });
  ["size", "start", "end"].forEach(function (id) { $(id).addEventListener("input", syncForm); });
  syncForm();

  function readTrip() {
    var dest = $("destination").value.trim();
    var n = parseInt($("size").value, 10);
    var d = dayCount();
    if (!dest) return { error: "Enter a destination." };
    if (!d) return { error: "Choose a start date and an end date that is on or after it." };
    if (!(n >= 1)) return { error: "Group size must be at least 1." };
    return {
      destination: dest,
      start: $("start").value,
      end: $("end").value,
      days: d,
      size: n,
      who: $("who").value.trim(),
      notes: $("notes").value.trim()
    };
  }

  var ERR = {
    no_backend: "Live generation needs the optional backend (see README). The example result works without it.",
    invalid_request: "That request wasn't valid. Shorten your notes or feedback and try again.",
    rate_limited: "You've hit a usage limit. Wait a bit, then try again.",
    empty_completion: "The model returned nothing. Try rephrasing your notes.",
    refused: "The model declined this request. Rephrase your notes and try again."
  };

  function handleLine(line, acc) {
    line = line.trim();
    if (!line || line.charAt(0) !== "{") return;
    var o;
    try { o = JSON.parse(line); } catch (e) { return; }
    if (o.type === "meta") acc.meta = { assumptions: String(o.assumptions || ""), weather: String(o.weather || "") };
    else if (o.type === "item" && o.name) acc.items.push(o);
  }

  function run(kind, fb) {
    if (state.busy) return;
    if (!backendAvailable) { state.error = "Revising needs the optional backend."; render(); return; }
    var snapshot = { stage: state.stage, meta: state.meta, items: state.items, feedbackLog: state.feedbackLog.slice() };
    if (fb) state.feedbackLog.push(fb);
    if (kind === "draft") { state.feedbackLog = []; state.meta = null; }
    var payload = {
      stage: kind,
      trip: state.trip,
      meta: (kind === "revise-draft" || kind === "enrich" || kind === "revise-final") ? state.meta : undefined,
      items: (kind === "revise-draft" || kind === "enrich" || kind === "revise-final") ? state.items : undefined,
      feedback: fb || undefined,
      feedbackLog: state.feedbackLog.length ? state.feedbackLog : undefined
    };
    var acc = { meta: null, items: [] };
    state.busy = true;
    state.error = "";
    state.approved = false;
    state.status = "Searching and writing the shortlist. This can take up to a minute.";
    if (kind === "draft" || kind === "revise-draft") state.stage = "draft";
    if (kind === "enrich" || kind === "revise-final") state.stage = "final";
    state.ctl = new AbortController();
    render();

    generate(payload, { signal: state.ctl.signal }).then(function (result) {
      result.text.split("\n").forEach(function (l) { handleLine(l, acc); });
      if (acc.meta) state.meta = acc.meta;
      if (acc.items.length) state.items = acc.items.slice();
      if (!acc.items.length) throw { code: "empty_completion" };
      state.busy = false;
      state.status = "";
      state.fbText = "";
      render();
    }).catch(function (e) {
      state.busy = false;
      state.status = "";
      state.stage = snapshot.stage;
      state.meta = snapshot.meta;
      state.items = snapshot.items;
      state.feedbackLog = snapshot.feedbackLog;
      if (e && e.code === "cancelled") state.error = snapshot.items.length ? "Stopped. Your previous version is back." : "Stopped.";
      else state.error = (e && ERR[e.code]) || "Something interrupted the request. Your previous version is untouched. Try again.";
      render();
    });
  }

  $("trip-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var t = readTrip();
    $("form-error").textContent = t.error || "";
    if (t.error) return;
    state.trip = t;
    state.items = [];
    state.stage = "form";
    run("draft");
  });

  function chip(cls, text, title) { return h("span", { class: "chip " + cls, title: title }, text); }

  function itemNode(i) {
    var fav = String(i.favorite).toLowerCase() === "local";
    var res = String(i.reservation || "").toLowerCase();
    var resText = res === "yes" ? "Reservation needed" : res === "no" ? "No reservation" : "Reservation unclear";
    var chips = h("div", { class: "chips" },
      chip(fav ? "local" : "tourist", fav ? "Local favorite" : "Tourist favorite"),
      chip("res", resText),
      String(i.status).toLowerCase() === "verify" ? chip("verify", "Verify", "Confirm before you plan around it") : null
    );
    var facts = [];
    if (i.accommodates) facts.push(h("dt", null, "Suits"), h("dd", null, i.accommodates));
    if (i.alternate) facts.push(h("dt", null, "Alternate"), h("dd", null, i.alternate));
    if (i.reservation_note) facts.push(h("dt", null, "Booking"), h("dd", null, i.reservation_note));
    var logi = null;
    if (i.weather || i.travel || i.transport || i.cost) {
      logi = h("div", { class: "logi" },
        i.weather ? h("div", null, h("b", null, "Weather"), i.weather) : null,
        i.travel ? h("div", null, h("b", null, "Travel time"), i.travel) : null,
        i.transport ? h("div", null, h("b", null, "Getting there"), i.transport) : null,
        i.cost ? h("div", null, h("b", null, "Est. cost"), i.cost) : null
      );
    }
    return h("article", { class: "item" },
      h("div", { class: "item-head" }, h("h4", null, i.name), chips),
      i.desc ? h("p", { class: "desc" }, i.desc) : null,
      photosNode(photosFor(String(i.name))),
      facts.length ? h("dl", { class: "facts" }, facts) : null,
      String(i.status).toLowerCase() === "verify" && i.status_note ? h("p", { class: "check" }, "Check: " + i.status_note) : null,
      logi,
      linkRow(String(i.name))
    );
  }

  function groupedNodes(items) {
    var locs = [], byLoc = {};
    items.forEach(function (i) {
      var l = i.location || "Other";
      if (!byLoc[l]) { byLoc[l] = { clusters: [], by: {} }; locs.push(l); }
      var c = i.cluster || "";
      if (!byLoc[l].by[c]) { byLoc[l].by[c] = []; byLoc[l].clusters.push(c); }
      byLoc[l].by[c].push(i);
    });
    return locs.map(function (l) {
      return h("div", { class: "loc" },
        h("h3", null, l),
        byLoc[l].clusters.map(function (c) {
          return h("div", null, c ? h("p", { class: "cluster" }, c) : null, byLoc[l].by[c].map(itemNode));
        })
      );
    });
  }

  function stepper() {
    var idx = state.stage === "final" ? 2 : state.stage === "draft" ? 1 : 0;
    var labels = ["Trip details", "Review draft", "Final shortlist"];
    return h("ol", { class: "steps", style: "list-style:none;padding:0" }, labels.map(function (l, n) {
      var cls = "step" + (n === idx ? " now" : n < idx ? " done" : "");
      return h("li", { class: cls, "aria-current": n === idx ? "step" : null }, h("span", { class: "dot" }, n < idx ? "✓" : String(n + 1)), l);
    }));
  }

  function feedbackPanel() {
    var isDraft = state.stage === "draft";
    var ta = h("textarea", {
      id: "fb", "aria-label": "Your feedback",
      placeholder: isDraft ? "e.g. Swap the museum for something outdoors. Add a coffee spot. Cut anything that needs a reservation." : "e.g. Shorten the drive times, or add a rainy-day backup.",
      oninput: function (e) { state.fbText = e.target.value; }
    });
    ta.value = state.fbText;
    function send() {
      var v = ta.value.trim();
      if (!v) { ta.focus(); ta.setAttribute("aria-invalid", "true"); return; }
      run(isDraft ? "revise-draft" : "revise-final", v);
    }
    var actions = h("div", { class: "actions" },
      h("button", { type: "button", class: "btn secondary", onclick: send }, isDraft ? "Revise this draft" : "Revise this shortlist"),
      isDraft
        ? h("button", { type: "button", class: "btn primary", onclick: function () { run("enrich"); } }, "Approve and add details")
        : h("button", { type: "button", class: "btn primary", onclick: function () { state.approved = true; render(); } }, "Looks good")
    );
    return h("div", { class: "feedback" },
      h("h3", null, isDraft ? "Feedback on the draft" : "Feedback on the final shortlist"),
      h("p", { class: "hint" }, isDraft
        ? "Places and activities only so far. Tell me what to add, cut or swap, or approve to add weather, travel time, transport and costs."
        : "Tell me what to adjust, or approve it to hand it to lodging search and day-by-day planning."),
      ta, actions
    );
  }

  function render() {
    var root = $("results");
    var gen = $("generate");
    gen.disabled = state.busy;
    root.textContent = "";

    if (state.stage === "form" && !state.busy && !state.items.length) {
      root.append(stepper(), h("div", { class: "intro" },
        h("h2", null, "From a rough idea to a shortlist you can trust"),
        h("ol", null,
          h("li", null, h("strong", null, "Fill in the trip. "), "Destination, dates, group size and any expectations."),
          h("li", null, h("strong", null, "Review the draft. "), "You get places and activities grouped by area and loose day range. Tell me what to change."),
          h("li", null, h("strong", null, "Approve to add logistics. "), "Weather, travel time, transport and cost per item, then a final round of feedback.")
        ),
        h("div", { class: "example-row" },
          h("button", { type: "button", class: "btn secondary", onclick: loadExample }, "See an example result"),
          h("span", { class: "hint" }, "Instant. A researched Salt Lake City run, with photos.")
        ),
        null
      ));
      if (state.error) root.append(h("p", { class: "error" }, state.error));
      return;
    }

    var t = state.trip;
    root.append(stepper());
    if (inRegion() && PHOTOS.city1) {
      root.append(h("div", { class: "hero" },
        h("img", { src: PHOTOS.city1.src, alt: PHOTOS.city1.alt }),
        h("div", { class: "shade" }),
        h("div", { class: "cap" },
          h("h2", null, t.destination),
          h("span", null, "Photo: ", extLink(PHOTOS.city1.artist + " · " + PHOTOS.city1.license, PHOTOS.city1.page))
        )
      ));
    }
    root.append(h("div", { class: "result-head" },
      h("div", null,
        h("h2", null, state.stage === "final" ? "Final shortlist" : "Draft shortlist"),
        t ? h("p", { class: "trip-line" }, t.destination + " · " + fmt(parseDate(t.start)) + " to " + fmt(parseDate(t.end)) + " · " + t.days + "d · " + t.size + (t.size === 1 ? " traveler" : " travelers")) : null
      ),
      h("span", { class: "stage-pill" }, state.stage === "final" ? "Step 3 of 3" : "Step 2 of 3")
    ));
    root.append(h("p", { class: "notice" }, "Backed by real web search when the optional backend is configured. Hours, closures and event dates still change, so anything marked Verify needs a check before you plan around it."));

    if (state.meta && (state.meta.assumptions || state.meta.weather)) {
      root.append(h("div", { class: "brief" },
        state.meta.assumptions ? h("div", null, h("b", null, "Assumptions"), state.meta.assumptions) : null,
        state.meta.weather ? h("div", null, h("b", null, "Weather and season"), state.meta.weather) : null
      ));
    }

    groupedNodes(state.items).forEach(function (n) { root.append(n); });

    if (state.busy) {
      root.append(h("div", { class: "status", role: "status" },
        h("span", { class: "pulse" }), h("span", null, state.status),
        h("button", { type: "button", class: "btn secondary", onclick: function () { if (state.ctl) state.ctl.abort(); } }, "Stop")
      ));
    }
    if (state.error) root.append(h("p", { class: "error", role: "alert" }, state.error));

    if (!state.busy && state.items.length) {
      if (state.approved) {
        root.append(h("div", { class: "approved" },
          h("h3", null, "Shortlist approved"),
          h("p", null, "This is ready to feed the next two steps: accommodation search for each area, then the day-by-day itinerary. Anything marked Verify still needs a check first."),
          h("div", null, h("button", { type: "button", class: "btn secondary", onclick: function () { state.approved = false; render(); } }, "Keep editing"))
        ));
      } else {
        root.append(feedbackPanel());
      }
    }
  }

  render();
  if (/[?&]example/.test(location.search)) loadExample();
})();

/* Lodging comparison view with a built-in group poll. Used by planner.js (the trip owner's view)
   and stay.js (the shared link the group opens). It renders once and then updates votes and
   comments in place, so polling never wipes what someone is typing. */
(function () {
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
    (function add(list) {
      list.forEach(function (kid) {
        if (kid == null || kid === false) return;
        if (Array.isArray(kid)) return add(kid);
        el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
      });
    })(Array.prototype.slice.call(arguments, 2));
    return el;
  }

  var ICON = {
    up: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M2 21h4V9H2v12zm20-11a2 2 0 0 0-2-2h-6.3l1-4.6v-.3a1.5 1.5 0 0 0-.4-1L13.2 1 7.6 6.6A2 2 0 0 0 7 8v11a2 2 0 0 0 2 2h9a2 2 0 0 0 1.8-1.2l3-7A2 2 0 0 0 23 12v-2z"/></svg>',
    down: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M22 3h-4v12h4V3zM2 14a2 2 0 0 0 2 2h6.3l-1 4.6v.3c0 .4.1.7.4 1l1.1 1.1 5.6-5.6A2 2 0 0 0 17 16V5a2 2 0 0 0-2-2H6a2 2 0 0 0-1.8 1.2l-3 7A2 2 0 0 0 1 12v2z"/></svg>'
  };
  function icon(kind) { var s = h("span", { class: "st-ico" }); s.innerHTML = ICON[kind]; return s; }

  function safeUrl(u) { return /^https?:\/\//i.test(String(u || "")) ? u : null; }
  function ext(text, url, cls) {
    var href = safeUrl(url);
    return href ? h("a", { href: href, target: "_blank", rel: "noopener noreferrer", class: cls }, text) : null;
  }
  function day(iso) {
    var d = new Date(iso + "T00:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  function stored(key, val) {
    try { if (val === undefined) return localStorage.getItem(key) || ""; localStorage.setItem(key, val); } catch (e) { /* storage blocked */ }
    return "";
  }

  var TIER = {
    budget: { label: "Budget-friendly", cls: "t-budget" },
    comfort: { label: "Comfort", cls: "t-comfort" },
    stretch: { label: "Stretch pick", cls: "t-stretch" },
    over: { label: "Over budget", cls: "t-over" }
  };

  function mount(root, data, opts) {
    opts = opts || {};
    var adapter = opts.adapter || null;
    var refs = {};          // option id -> element handles for in-place poll updates
    var favs = {};          // base location -> { chips: {optId: node}, ids: [optId] }
    var lastPoll = { votes: {}, tally: {}, comments: [] };
    var timer = 0;
    var busy = false;
    var nameInput;
    var statusEl;

    function viewer() { return nameInput ? nameInput.value.trim() : ""; }
    function say(msg) { if (statusEl) statusEl.textContent = msg || ""; }

    function needName() {
      if (viewer()) return false;
      say("Add your name first so the group can tell who said what.");
      if (nameInput) nameInput.focus();
      return true;
    }

    function guard(promise) {
      busy = true;
      return promise.then(function (poll) { busy = false; say(""); if (poll) applyPoll(poll); })
        .catch(function (e) { busy = false; say((e && e.message) || "That didn't go through. Try again."); });
    }

    function myVote(optId) {
      var me = viewer().toLowerCase();
      var list = lastPoll.votes[optId] || [];
      for (var i = 0; i < list.length; i++) if (String(list[i].name).toLowerCase() === me) return list[i].value;
      return "none";
    }

    function vote(optId, value) {
      if (!adapter || busy || needName()) return;
      var next = myVote(optId) === value ? "none" : value;
      guard(adapter.vote(optId, viewer(), next));
    }

    function applyPoll(poll) {
      lastPoll = { votes: poll.votes || {}, tally: poll.tally || {}, comments: poll.comments || [] };
      Object.keys(refs).forEach(function (id) {
        var r = refs[id];
        var t = lastPoll.tally[id] || { up: 0, down: 0 };
        r.upN.textContent = String(t.up);
        r.downN.textContent = String(t.down);
        var mine = myVote(id);
        r.up.setAttribute("aria-pressed", mine === "up" ? "true" : "false");
        r.down.setAttribute("aria-pressed", mine === "down" ? "true" : "false");
        var voters = lastPoll.votes[id] || [];
        var ups = voters.filter(function (v) { return v.value === "up"; }).map(function (v) { return v.name; });
        var downs = voters.filter(function (v) { return v.value === "down"; }).map(function (v) { return v.name; });
        r.who.textContent = [ups.length ? "Liked by " + ups.join(", ") : "", downs.length ? "Passed by " + downs.join(", ") : ""].filter(Boolean).join(" · ");
        var mineComments = lastPoll.comments.filter(function (c) { return c.option === id; });
        r.list.textContent = "";
        mineComments.forEach(function (c) {
          r.list.append(h("li", null, h("strong", null, c.name), " ", c.text));
        });
        r.commentCount.textContent = mineComments.length ? "Comments (" + mineComments.length + ")" : "Comments";
      });
      Object.keys(favs).forEach(function (loc) {
        var f = favs[loc], best = null, bestScore = 0;
        f.ids.forEach(function (id) {
          var t = lastPoll.tally[id] || { up: 0, down: 0 };
          var score = t.up - t.down;
          if (score > bestScore) { best = id; bestScore = score; }
          else if (score === bestScore && score > 0) best = null;     // a tie is not a favorite
        });
        f.ids.forEach(function (id) { f.chips[id].hidden = id !== best; });
      });
    }

    function optionCard(o, base) {
      var tier = TIER[o.tier];
      var ref = {};
      var head = h("div", { class: "st-head" },
        h("h4", null, o.name),
        h("div", { class: "st-badges" },
          tier ? h("span", { class: "st-tier " + tier.cls }, tier.label + (o.tier === "over" && o.over_pct > 0 ? " by " + o.over_pct + "%" : "")) : null,
          (function () { var c = h("span", { class: "st-tier t-fav", hidden: true }, "Group favorite"); (favs[base.location] = favs[base.location] || { chips: {}, ids: [] }); favs[base.location].chips[o.id] = c; favs[base.location].ids.push(o.id); return c; })()
        )
      );
      var photoHref = safeUrl(o.photo);
      var photo = photoHref ? h("img", { class: "st-photo pending", src: photoHref, alt: o.name, referrerpolicy: "no-referrer",
        onload: function (e) { e.target.classList.remove("pending"); }, onerror: function (e) { e.target.remove(); } }) : null;

      var must = h("div", { class: "st-must" },
        o.met && o.met.length ? h("ul", { class: "st-met" }, o.met.map(function (m) { return h("li", null, m); })) : null,
        o.missed && o.missed.length ? h("ul", { class: "st-missed" }, o.missed.map(function (m) { return h("li", null, m); })) : null
      );

      var flags = [];
      if (o.non_refundable === true) flags.push(h("span", { class: "st-flag warn" }, "Non-refundable"));
      if (o.over_budget && o.tier !== "over") flags.push(h("span", { class: "st-flag warn" }, "Over budget" + (o.over_pct > 0 ? " by " + o.over_pct + "%" : "")));
      if (o.kid_friendly === "yes") flags.push(h("span", { class: "st-flag" }, "Kid-friendly"));
      if (o.kid_friendly === "no") flags.push(h("span", { class: "st-flag warn" }, "Not kid-friendly"));
      if (o.group_fit === "single") flags.push(h("span", { class: "st-flag" }, "Fits everyone in one unit"));
      if (o.group_fit === "split") flags.push(h("span", { class: "st-flag warn" }, "Split across " + o.units + " units"));

      var facts = h("dl", { class: "st-facts" });
      function fact(k, v) { if (v) facts.append(h("dt", null, k), h("dd", null, v)); }
      fact("Rating", o.rating_text);
      fact("Distance", o.distance);
      fact("Cancellation", o.cancellation);
      fact("Group fit", o.group_fit === "split" || o.group_fit === "unclear" ? o.group_note : "");
      fact("Kids", o.kid_note);
      fact("Amenities", (o.amenities || []).join(", "));

      ref.up = h("button", { type: "button", class: "st-vote", "aria-pressed": "false", "aria-label": "Like " + o.name, disabled: !adapter, onclick: function () { vote(o.id, "up"); } }, icon("up"), ref.upN = h("span", null, "0"));
      ref.down = h("button", { type: "button", class: "st-vote", "aria-pressed": "false", "aria-label": "Pass on " + o.name, disabled: !adapter, onclick: function () { vote(o.id, "down"); } }, icon("down"), ref.downN = h("span", null, "0"));
      ref.who = h("span", { class: "st-who" });
      ref.list = h("ul", { class: "st-comments" });
      ref.commentCount = h("span", null, "Comments");
      var input = h("input", { type: "text", maxlength: "500", placeholder: "Add a comment", "aria-label": "Comment on " + o.name, disabled: !adapter });
      function post() {
        var text = input.value.trim();
        if (!text || !adapter || busy || needName()) return;
        input.value = "";
        guard(adapter.comment(o.id, viewer(), text));
      }
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); post(); } });
      var poll = adapter ? h("div", { class: "st-poll" },
        h("div", { class: "st-votes" }, ref.up, ref.down, ref.who),
        h("details", { class: "st-cdetails" }, h("summary", null, ref.commentCount), ref.list,
          h("div", { class: "st-cform" }, input, h("button", { type: "button", class: "btn secondary", onclick: post }, "Post")))
      ) : null;
      refs[o.id] = ref;

      return h("article", { class: "st-card" + (o.tier === "stretch" ? " is-stretch" : "") },
        photo, head,
        h("p", { class: "st-price" }, o.price_text),
        o.tier === "stretch" && o.tier_reason ? h("p", { class: "st-why" }, "Worth the stretch: " + o.tier_reason) : null,
        flags.length ? h("div", { class: "st-flags" }, flags) : null,
        must, facts,
        ext("View and book on the listing ↗", o.link, "btn primary st-book"),
        poll
      );
    }

    function baseBlock(base) {
      var res = (data.results || {})[base.location] || {};
      var block = h("section", { class: "st-base", "aria-label": base.location },
        h("div", { class: "st-base-head" },
          h("h3", null, base.location),
          h("p", { class: "st-sub" }, day(base.check_in) + " to " + day(base.check_out) + " · " + base.nights + (base.nights === 1 ? " night" : " nights") +
            (base.activities && base.activities.length ? " · near " + base.activities.slice(0, 3).join(", ") + (base.activities.length > 3 ? " and more" : "") : ""))
        )
      );
      if (res.error) {
        block.append(h("p", { class: "error" }, "Couldn't finish this search. " + res.error),
          opts.owner ? h("button", { type: "button", class: "btn secondary", onclick: function () { opts.owner.onRetry(base.location); } }, "Try " + base.location + " again") : null);
        return block;
      }
      if (res.market && res.market !== "normal") {
        block.append(h("p", { class: "st-market" }, h("strong", null, res.market === "thin" ? "Thin market. " : "Nothing close by. "), res.note || ""));
      }
      var grid = h("div", { class: "st-grid" });
      (res.options || []).forEach(function (o) { grid.append(optionCard(o, base)); });
      block.append(grid);

      if (opts.owner) {
        var ta = h("textarea", { rows: "2", "aria-label": "What to change for " + base.location, placeholder: "e.g. None of these have a pool. Look for somewhere with a kitchen." });
        var btn = h("button", { type: "button", class: "btn secondary", onclick: function () {
          var t = ta.value.trim();
          if (!t) { ta.focus(); return; }
          btn.disabled = true; btn.textContent = "Searching…";
          opts.owner.onMore(base.location, t);
        } }, "Search again for " + base.location);
        block.append(h("details", { class: "st-more" }, h("summary", null, "Not quite right? Ask for different options"),
          h("p", { class: "hint" }, "New matches are added below the current ones; nothing already shown is removed."), ta, btn));
      }
      return block;
    }

    // ----- assemble -----
    var t = data.trip || {};
    root.textContent = "";
    root.append(h("div", { class: "st-title" },
      h("h2", null, "Where to stay"),
      h("p", { class: "trip-line" }, [t.destination, t.start && t.end ? day(t.start) + " to " + day(t.end) : "", t.size ? t.size + (t.size === 1 ? " traveler" : " travelers") : ""].filter(Boolean).join(" · "))
    ));
    if (data.demo) root.append(h("p", { class: "st-demo", role: "note" }, "Demo data. These are placeholder entries, not real listings, shown so you can try the page."));
    root.append(h("p", { class: "notice" }, "Prices and ratings come from web search and are estimates for your whole group per night. Confirm price, availability and cancellation terms on the listing before anyone books. Nothing is booked from this page."));

    var m = data.meta || {};
    if (m.assumptions || m.budget_interpretation || m.target_nightly) {
      root.append(h("div", { class: "brief" },
        m.target_nightly ? h("div", null, h("b", null, "Target"), "About " + money(m.target_nightly) + " per night for the whole group" + (m.budget_interpretation ? ". " + m.budget_interpretation : "")) : null,
        m.assumptions ? h("div", null, h("b", null, "Assumptions"), m.assumptions) : null
      ));
    }

    if (opts.shareUrl || adapter) {
      nameInput = h("input", { type: "text", id: "st-name", maxlength: "40", autocomplete: "name", placeholder: "Your name", value: stored("tripViewerName") });
      nameInput.addEventListener("change", function () { stored("tripViewerName", nameInput.value.trim()); if (adapter) applyPoll(lastPoll); });
      statusEl = h("p", { class: "st-status", role: "status" });
      var linkInput = opts.shareUrl ? h("input", { type: "text", readonly: true, value: opts.shareUrl, "aria-label": "Link to share with your group" }) : null;
      var copy = opts.shareUrl ? h("button", { type: "button", class: "btn secondary", onclick: function () {
        function ok() { copy.textContent = "Copied"; setTimeout(function () { copy.textContent = "Copy link"; }, 1800); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(opts.shareUrl).then(ok, function () { linkInput.select(); });
        else linkInput.select();
      } }, "Copy link") : null;
      root.append(h("div", { class: "st-group" },
        opts.shareUrl ? h("div", null, h("h3", null, "Share with your group"),
          h("p", { class: "hint" }, "Anyone with the link can vote and comment. It expires a few days after the last activity."),
          h("div", { class: "st-linkrow" }, linkInput, copy)) : null,
        adapter ? h("div", { class: "field" }, h("label", { for: "st-name" }, "Your name ", h("span", { class: "hint" }, "Shown next to your votes and comments")), nameInput) :
          h("p", { class: "hint" }, "Voting and comments need the optional storage service (see the README). The comparison works without it."),
        statusEl
      ));
    }

    (data.bases || []).forEach(function (b) { root.append(baseBlock(b)); });

    function tick() {
      if (!adapter || document.visibilityState !== "visible" || busy) return;
      adapter.fetch().then(function (p) { if (p) applyPoll(p); }).catch(function () { /* keep last known tally */ });
    }
    if (adapter) { tick(); timer = setInterval(tick, 6000); }

    return { applyPoll: applyPoll, destroy: function () { if (timer) clearInterval(timer); timer = 0; } };
  }

  // Honors the same override the shortlist step uses (window.TRIP_API_URL pointing at .../generate).
  function apiBase() {
    if (window.TRIP_API_BASE) return window.TRIP_API_BASE;
    if (window.TRIP_API_URL) return String(window.TRIP_API_URL).replace(/\/generate\/?$/, "");
    return "/api";
  }

  function request(path, init) {
    return fetch(apiBase() + path, init).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) {
        if (r.status === 501) throw Object.assign(new Error("Voting needs the optional storage service."), { code: "no_backend" });
        if (!r.ok) throw Object.assign(new Error(body.error || "That didn't go through. Try again."), { code: "error", status: r.status });
        return body;
      });
    });
  }
  function postJson(path, body) {
    return request(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  }

  // Talks to api/poll.js for one shared comparison.
  function pollAdapter(share) {
    return {
      fetch: function () { return request("/poll?share=" + encodeURIComponent(share)); },
      vote: function (option, name, value) { return postJson("/poll", { action: "vote", share: share, option: option, name: name, value: value }); },
      comment: function (option, name, text) { return postJson("/poll", { action: "comment", share: share, option: option, name: name, text: text }); }
    };
  }

  // In-memory stand-in so the demo page can show voting without any backend.
  function demoAdapter() {
    var votes = {}, comments = [];
    function state() {
      var v = {}, tally = {};
      Object.keys(votes).forEach(function (field) {
        var i = field.indexOf("|"), opt = field.slice(0, i), rec = votes[field];
        (v[opt] = v[opt] || []).push({ name: rec.n, value: rec.v });
        var t = (tally[opt] = tally[opt] || { up: 0, down: 0 });
        t[rec.v === "up" ? "up" : "down"]++;
      });
      return { votes: v, tally: tally, comments: comments.slice() };
    }
    return {
      fetch: function () { return Promise.resolve(state()); },
      vote: function (option, name, value) {
        var field = option + "|" + name.toLowerCase();
        if (value === "none") delete votes[field]; else votes[field] = { n: name, v: value };
        return Promise.resolve(state());
      },
      comment: function (option, name, text) { comments.push({ option: option, name: name, text: text, ts: Date.now() }); return Promise.resolve(state()); }
    };
  }

  window.Lodging = { mount: mount, pollAdapter: pollAdapter, demoAdapter: demoAdapter, request: request, postJson: postJson, apiBase: apiBase };
})();

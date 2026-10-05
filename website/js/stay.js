/* The page a group opens from a shared link: stay.html?share=ID (or ?demo=1 for placeholder data). */
(function () {
  var root = document.getElementById("stay-root");
  var params = new URLSearchParams(location.search);

  function message(text, linkText, href) {
    root.textContent = "";
    var p = document.createElement("p");
    p.className = "intro";
    p.textContent = text + " ";
    if (linkText) { var a = document.createElement("a"); a.href = href; a.textContent = linkText; p.append(a); }
    root.append(p);
  }

  function opt(location, n, o) {
    var base = {
      id: location.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-sample-" + n, location: location, name: "Sample property " + n + " (demo)",
      kind: "hotel", price_text: "~$400/night total (estimate)", price_value: 400, rating_text: "4.5 (200 reviews)", rating_value: 4.5,
      link: "https://example.com/", photo: "", amenities: ["Kitchen", "Parking", "Wi-Fi"], distance: "10 min drive to the main sights",
      kid_friendly: "n/a", kid_note: "", cancellation: "Free cancellation until 5 days before", non_refundable: false,
      met: ["Sleeps everyone"], missed: [], over_pct: -33, over_budget: false, tier: "budget", tier_reason: "", units: 1, group_fit: "single", group_note: ""
    };
    return Object.assign(base, o);
  }

  function demoData() {
    return {
      demo: true,
      trip: { destination: "Sample trip", start: "2026-10-16", end: "2026-10-19", days: 4, size: 4 },
      meta: { assumptions: "Placeholder data to show the layout.", budget_interpretation: "$150 per person per night, times 4 people.", target_nightly: 600 },
      bases: [
        { location: "Sample town A", check_in: "2026-10-16", check_out: "2026-10-18", nights: 2, activities: ["Sample activity one", "Sample activity two"] },
        { location: "Sample town B", check_in: "2026-10-18", check_out: "2026-10-19", nights: 1, activities: ["Sample activity three"] }
      ],
      results: {
        "Sample town A": { market: "normal", note: "", options: [
          opt("Sample town A", 1, {}),
          opt("Sample town A", 2, { price_text: "~$560/night total (estimate)", price_value: 560, over_pct: -7, tier: "comfort", amenities: ["Pool", "Kitchen"], met: ["Sleeps everyone", "Pool"], non_refundable: true, cancellation: "Non-refundable" }),
          opt("Sample town A", 3, { price_text: "~$650/night total (estimate)", price_value: 650, over_pct: 8, over_budget: true, tier: "stretch", tier_reason: "Five minutes from every planned activity", met: ["Sleeps everyone", "Pool", "Kitchen"], rating_text: "4.8 (410 reviews)" })
        ] },
        "Sample town B": { market: "thin", note: "Only two reasonable options turned up in this small town, so this is everything that fit.", options: [
          opt("Sample town B", 4, { group_fit: "split", units: 2, group_note: "2 adjacent cottages: 2 + 2 beds", missed: ["Pool"], tier: "comfort", over_pct: -12, price_value: 530, price_text: "~$530/night total (estimate)" }),
          opt("Sample town B", 5, { price_text: "~$760/night total (estimate)", price_value: 760, over_pct: 27, over_budget: true, tier: "over", missed: ["Kitchen not confirmed"] })
        ] }
      }
    };
  }

  if (params.get("demo")) {
    window.Lodging.mount(root, demoData(), { adapter: window.Lodging.demoAdapter() });
    return;
  }

  var share = params.get("share") || "";
  if (!share) { message("This page needs a share link from a trip.", "Plan a trip", "planner.html"); return; }

  var adapter = window.Lodging.pollAdapter(share);
  adapter.fetch().then(function (poll) {
    var snap = poll.snapshot || {};
    var ctl = window.Lodging.mount(root, snap, { adapter: adapter });
    ctl.applyPoll(poll);
  }).catch(function (e) {
    if (e && e.code === "no_backend") message("Comparison links need the optional storage service, which isn't set up on this site yet.");
    else if (e && e.status === 404) message("This link has expired or doesn't exist. Ask whoever shared it to send a new one.");
    else message("Couldn't load the comparison. Check your connection and reload.");
  });
})();

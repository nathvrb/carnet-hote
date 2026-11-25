/* Vitrine : héros en 3D (suit la souris) et livret dont l'écran défile sous le doigt ou la molette. */
(function () {
  "use strict";
  var OFFS = [[0.0, 0.12303], [0.12303, 0.25799], [0.25799, 0.45507], [0.45507, 0.64812], [0.64812, 0.74491], [0.74491, 0.83398], [0.83398, 1.0]];
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- héros : la scène suit la souris ---------- */
  var sc = document.getElementById("vx-scene"), hero = document.getElementById("vx-hero");
  if (sc && hero && !reduce) {
    hero.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      sc.style.setProperty("--ry", (x * 18) + "deg"); sc.style.setProperty("--rx", (-y * 11) + "deg");
    });
    hero.addEventListener("pointerleave", function () { sc.style.setProperty("--ry", "0deg"); sc.style.setProperty("--rx", "0deg"); });
    if (window.matchMedia("(hover: none)").matches) {
      var t0 = performance.now();
      (function sway(t) {
        if (document.hidden) { requestAnimationFrame(sway); return; }
        sc.style.setProperty("--ry", (Math.sin((t - t0) / 1800) * 8) + "deg");
        sc.style.setProperty("--rx", (Math.cos((t - t0) / 2300) * 3) + "deg");
        requestAnimationFrame(sway);
      })(t0);
    }
  }

  /* ---------- le livret : on fait défiler l'écran du téléphone, les textes suivent ---------- */
  var sc2 = document.getElementById("vx-scroll"), reel = document.getElementById("vx-reel"), ph = document.getElementById("vx-sphone"), hint = document.getElementById("vx-hint");
  if (sc2 && reel && ph) {
    var steps = [].slice.call(document.querySelectorAll("#vx-stack .vx-stp")), ticks = [].slice.call(document.querySelectorAll("#vx-ticks li"));
    var N = OFFS.length, active = -1, hinted = false;
    function setActive(act) {
      if (act === active) return;
      active = act;
      steps.forEach(function (s, k) { s.classList.toggle("on", k === act); });
      ticks.forEach(function (t, k) { t.classList.toggle("on", k === act); });
    }
    function compute() {
      var dispH = reel.offsetHeight || 1, sh = sc2.clientHeight, max = Math.max(1, dispH - sh), top = sc2.scrollTop;
      var line = (top + sh * .3) / dispH, act = N - 1;
      for (var k = 0; k < N; k++) { if (line < OFFS[k][1]) { act = k; break; } }
      if (top >= max - 6) act = N - 1;
      setActive(act);
      ph.style.setProperty("--sy", (-11 + 18 * Math.min(1, top / max)).toFixed(1) + "deg");
      if (!hinted && top > 24) { hinted = true; if (hint) hint.classList.add("off"); }
    }
    function goTo(k) {
      var dispH = reel.offsetHeight || 1, max = dispH - sc2.clientHeight;
      sc2.scrollTo({ top: Math.max(0, Math.min(max, OFFS[k][0] * dispH)), behavior: reduce ? "auto" : "smooth" });
    }
    sc2.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    ticks.forEach(function (t, k) { t.addEventListener("click", function () { goTo(k); }); });
    if (reel.complete) compute(); else reel.addEventListener("load", compute);
    compute();
    /* l'indice disparaît aussi dès qu'on touche ou survole l'écran */
    ["pointerdown", "wheel", "keydown"].forEach(function (ev) { sc2.addEventListener(ev, function () { hinted = true; if (hint) hint.classList.add("off"); }, { passive: true }); });
  }

  /* cartes d'exemples : léger relief au survol */
  if (!reduce) [].forEach.call(document.querySelectorAll(".vx-tilt"), function (c) {
    c.addEventListener("pointermove", function (e) { var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = "rotateY(" + (x * 9) + "deg) rotateX(" + (-y * 7) + "deg)"; });
    c.addEventListener("pointerleave", function () { c.style.transform = ""; });
  });
})();

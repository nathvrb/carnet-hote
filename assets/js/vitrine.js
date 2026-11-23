/* Vitrine : héros en 3D (suit la souris) et livret qui défile avec la page. */
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

  /* ---------- le livret défile tout seul avec la page ---------- */
  var story = document.getElementById("livret"), reel = document.getElementById("vx-reel"), ph = document.getElementById("vx-sphone");
  if (!story || !reel || !ph) return;
  var steps = [].slice.call(document.querySelectorAll("#vx-stack .vx-stp")), ticks = [].slice.call(document.querySelectorAll("#vx-ticks li"));
  var N = OFFS.length, cur = 0, target = 0, active = -1, READ = .78, visible = true;
  function lerp(a, b, t) { return a + (b - a) * t; }
  function compute() {
    var scr = reel.parentElement, dispH = reel.offsetHeight || 1, sf = scr.clientHeight / dispH;
    var r = story.getBoundingClientRect(), total = Math.max(1, story.offsetHeight - window.innerHeight);
    var p = Math.min(1, Math.max(0, -r.top / total));
    var f = p * N, i = Math.min(N - 1, Math.floor(f)), u = f - i;
    var A = OFFS[i][0], B = Math.max(A, Math.min(OFFS[i][1] - sf, 1 - sf)), top;
    if (i === N - 1 || u < READ) top = lerp(A, B, Math.min(1, u / READ));
    else top = lerp(B, OFFS[i + 1][0], (u - READ) / (1 - READ));
    target = top * dispH;
    var act = (u >= READ && i < N - 1 && u > .92) ? i + 1 : i;
    if (act !== active) {
      active = act;
      steps.forEach(function (s, k) { s.classList.toggle("on", k === act); });
      ticks.forEach(function (t, k) { t.classList.toggle("on", k === act); });
    }
    ph.style.setProperty("--sy", lerp(-11, 7, p).toFixed(1) + "deg");
  }
  function frame() {
    if (visible) {
      cur += (target - cur) * (reduce ? 1 : .14);
      reel.style.transform = "translate3d(0," + (-cur).toFixed(1) + "px,0)";
    }
    requestAnimationFrame(frame);
  }
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) compute(); }, { rootMargin: "200px 0px" }).observe(story);
  window.addEventListener("scroll", compute, { passive: true }); window.addEventListener("resize", compute);
  if (reel.complete) compute(); else reel.addEventListener("load", compute);
  compute(); cur = target; frame();

  /* cartes d'exemples : léger relief au survol */
  if (!reduce) [].forEach.call(document.querySelectorAll(".vx-tilt"), function (c) {
    c.addEventListener("pointermove", function (e) { var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = "rotateY(" + (x * 9) + "deg) rotateX(" + (-y * 7) + "deg)"; });
    c.addEventListener("pointerleave", function () { c.style.transform = ""; });
  });
})();

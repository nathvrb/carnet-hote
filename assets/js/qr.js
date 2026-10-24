/* QR codes : rendu SVG (affichage) et canvas (téléchargement PNG).
   S'appuie sur qrcode-generator (MIT, Kazuhiko Arase), copié dans assets/js/vendor. */
(function () {
  if (window.qrcode && qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs["UTF-8"]) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
  }

  function build(text, ecl) {
    var qr = qrcode(0, ecl || "M");
    qr.addData(String(text || " "));
    qr.make();
    return qr;
  }

  function inFinder(r, c, n) {
    return (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  }

  /* SVG : modules carrés + repères d'angle arrondis */
  window.cdhQrSvg = function (text, opts) {
    opts = opts || {};
    var fg = opts.fg || "currentColor";
    var bg = opts.bg || "none";
    var m = opts.margin == null ? 2 : opts.margin;
    var qr = build(text, opts.ecl);
    var n = qr.getModuleCount();
    var size = n + m * 2;
    var d = "";
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c) && !inFinder(r, c, n)) d += "M" + (c + m) + " " + (r + m) + "h1v1h-1z";
      }
    }
    function finder(x, y) {
      x += m; y += m;
      return '<rect x="' + (x + 0.5) + '" y="' + (y + 0.5) + '" width="6" height="6" rx="1.6" fill="none" stroke="' + fg + '" stroke-width="1"/>' +
             '<rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" rx=".8" fill="' + fg + '"/>';
    }
    var label = opts.label ? ' role="img" aria-label="' + String(opts.label).replace(/[&<>"]/g, "") + '"' : ' aria-hidden="true"';
    var dims = opts.size ? ' width="' + opts.size + '" height="' + opts.size + '"' : "";
    return '<svg class="' + (opts.cls || "qr") + '"' + dims + ' viewBox="0 0 ' + size + " " + size + '" shape-rendering="crispEdges"' + label + '>' +
      (bg !== "none" ? '<rect width="' + size + '" height="' + size + '" fill="' + bg + '"/>' : "") +
      '<path d="' + d + '" fill="' + fg + '"/>' +
      '<g shape-rendering="geometricPrecision">' + finder(0, 0) + finder(n - 7, 0) + finder(0, n - 7) + "</g></svg>";
  };

  /* Canvas : pour exporter en PNG */
  window.cdhQrDraw = function (ctx, text, x, y, px, fg, bg) {
    var qr = build(text, "M");
    var n = qr.getModuleCount();
    var m = 2, size = n + m * 2, u = px / size;
    ctx.save();
    ctx.fillStyle = bg || "#fff";
    ctx.fillRect(x, y, px, px);
    ctx.fillStyle = fg || "#000";
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      if (qr.isDark(r, c) && !inFinder(r, c, n)) ctx.fillRect(x + (c + m) * u, y + (r + m) * u, Math.ceil(u), Math.ceil(u));
    }
    function rr(cx, cy, w, h, rad) {
      ctx.beginPath();
      ctx.moveTo(cx + rad, cy); ctx.arcTo(cx + w, cy, cx + w, cy + h, rad); ctx.arcTo(cx + w, cy + h, cx, cy + h, rad);
      ctx.arcTo(cx, cy + h, cx, cy, rad); ctx.arcTo(cx, cy, cx + w, cy, rad); ctx.closePath();
    }
    [[0, 0], [n - 7, 0], [0, n - 7]].forEach(function (p) {
      var fx = x + (p[0] + m) * u, fy = y + (p[1] + m) * u;
      ctx.lineWidth = u; ctx.strokeStyle = fg || "#000";
      rr(fx + u / 2, fy + u / 2, 6 * u, 6 * u, 1.6 * u); ctx.stroke();
      rr(fx + 2 * u, fy + 2 * u, 3 * u, 3 * u, 0.8 * u); ctx.fill();
    });
    ctx.restore();
  };

  /* Chaîne standard pour un QR code Wi-Fi */
  window.cdhWifiString = function (ssid, pass) {
    function esc(s) { return String(s || "").replace(/([\\;,:"])/g, "\\$1"); }
    return "WIFI:T:" + (pass ? "WPA" : "nopass") + ";S:" + esc(ssid) + ";P:" + esc(pass) + ";;";
  };
})();

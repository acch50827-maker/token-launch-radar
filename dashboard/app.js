// Token Launch Radar dashboard: board, detail view, filters, sorting.
// Reads window.RADAR from data.js (written beside this page by main.ts).
// State lives in the URL hash, so a detail or filtered view has its own link:
//   #p=<slug>                 one protocol's detail view
//   #q=<text>&chain=<c>&cat=<c>&sort=<k>&wl=1   a filtered board

(function () {
  'use strict';
  var data = window.RADAR;
  var rowsEl = document.getElementById('rows');
  var detailEl = document.getElementById('detail');

  if (!data || !Array.isArray(data.rows)) {
    document.getElementById('meta').textContent = 'No data loaded: run main.ts first.';
    return;
  }
  var rows = data.rows;

  function money(n) {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }
  function pct(c) {
    if (c === null || c === undefined) return ['\u2014', 'flat'];
    var s = (c > 0 ? '+' : '') + c.toFixed(1) + '%';
    return [s, c > 0.05 ? 'up' : c < -0.05 ? 'down' : 'flat'];
  }
  function age(listed) {
    if (!listed) return '\u2014';
    var days = Math.round((Date.parse(data.as_of) - Date.parse(listed)) / 86400000);
    if (days < 365) return Math.max(1, Math.round(days / 30)) + ' mo';
    return (days / 365).toFixed(1) + ' yr';
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Fill the chain / category filters from the board itself.
  var chainSet = {}, catSet = {};
  rows.forEach(function (r) {
    r.chains.forEach(function (c) { chainSet[c] = true; });
    if (r.category) catSet[r.category] = true;
  });
  function fillSelect(id, values) {
    var el = document.getElementById(id);
    Object.keys(values).sort().forEach(function (v) {
      var o = document.createElement('option');
      o.value = v; o.textContent = v; el.appendChild(o);
    });
  }
  fillSelect('chain', chainSet);
  fillSelect('cat', catSet);

  var watchlist = rows.filter(function (r) { return r.watchlist; });
  var topValue = rows[0] ? rows[0].implied_value_usd : 0;
  var totalValue = rows.reduce(function (a, r) { return a + r.implied_value_usd; }, 0);
  document.getElementById('meta').textContent = 'Snapshot ' + data.as_of + ' \u00b7 ' + rows.length + ' protocols \u00b7 floor $' + (data.floor_usd / 1e6) + 'M';
  document.getElementById('stats').innerHTML =
    '<div class="stat"><b>' + rows.length + '</b><span>protocols ranked</span></div>' +
    '<div class="stat"><b>' + watchlist.length + '</b><span>on the watchlist</span></div>' +
    '<div class="stat"><b>' + money(topValue) + '</b><span>top implied value</span></div>' +
    '<div class="stat"><b>' + money(totalValue) + '</b><span>combined implied value</span></div>';

  function readHash() {
    var h = location.hash.replace(/^#/, '');
    var out = { p: '', q: '', chain: '', cat: '', sort: 'value', wl: false };
    h.split('&').forEach(function (part) {
      var kv = part.split('=');
      if (kv.length !== 2) return;
      var k = decodeURIComponent(kv[0]), v = decodeURIComponent(kv[1]);
      if (k === 'p') out.p = v;
      else if (k === 'q') out.q = v;
      else if (k === 'chain') out.chain = v;
      else if (k === 'cat') out.cat = v;
      else if (k === 'sort') out.sort = v;
      else if (k === 'wl') out.wl = v === '1';
    });
    return out;
  }
  function writeHash(s) {
    var parts = [];
    if (s.p) parts.push('p=' + encodeURIComponent(s.p));
    if (s.q) parts.push('q=' + encodeURIComponent(s.q));
    if (s.chain) parts.push('chain=' + encodeURIComponent(s.chain));
    if (s.cat) parts.push('cat=' + encodeURIComponent(s.cat));
    if (s.sort && s.sort !== 'value') parts.push('sort=' + encodeURIComponent(s.sort));
    if (s.wl) parts.push('wl=1');
    var h = parts.join('&');
    if (location.hash.replace(/^#/, '') !== h) history.replaceState(null, '', h ? '#' + h : '#');
  }

  var sorters = {
    rank: function (a, b) { return a.rank - b.rank; },
    value: function (a, b) { return b.implied_value_usd - a.implied_value_usd || a.rank - b.rank; },
    tvl: function (a, b) { return b.tvl_usd - a.tvl_usd || a.rank - b.rank; },
    change: function (a, b) { return (b.change_7d || 0) - (a.change_7d || 0) || a.rank - b.rank; },
    newest: function (a, b) { return String(b.listed_at || '') < String(a.listed_at || '') ? -1 : 1; },
    oldest: function (a, b) { return String(a.listed_at || '') < String(b.listed_at || '') ? -1 : 1; },
    name: function (a, b) { return a.name < b.name ? -1 : 1; },
    category: function (a, b) { return String(a.category || '') < String(b.category || '') ? -1 : 1; },
    chains: function (a, b) { return String(a.chains[0] || '') < String(b.chains[0] || '') ? -1 : 1; },
  };

  function render() {
    var s = readHash();
    document.getElementById('q').value = s.q;
    document.getElementById('chain').value = s.chain;
    document.getElementById('cat').value = s.cat;
    document.getElementById('sort').value = s.sort;
    document.getElementById('wl').checked = s.wl;

    var q = s.q.trim().toLowerCase();
    var list = rows.filter(function (r) {
      if (s.wl && !r.watchlist) return false;
      if (s.chain && r.chains.indexOf(s.chain) === -1) return false;
      if (s.cat && r.category !== s.cat) return false;
      if (q && r.name.toLowerCase().indexOf(q) === -1 && r.slug.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    list.sort(sorters[s.sort] || sorters.value);

    rowsEl.innerHTML = list.map(function (r) {
      var ch = pct(r.change_7d);
      return '<tr data-slug="' + esc(r.slug) + '"' + (s.p === r.slug ? ' class="sel"' : '') + '>' +
        '<td>' + r.rank + '</td>' +
        '<td><b>' + esc(r.name) + '</b>' + (r.watchlist ? '<span class="badge">WATCHLIST</span>' : '') + '<br><span class="slug">' + esc(r.slug) + '</span></td>' +
        '<td>' + esc(r.category || '\u2014') + '</td>' +
        '<td>' + esc(r.chains.slice(0, 3).join(', ')) + (r.chains.length > 3 ? ' +' + (r.chains.length - 3) : '') + '</td>' +
        '<td class="num">' + money(r.tvl_usd) + '</td>' +
        '<td class="num ' + ch[1] + '">' + ch[0] + '</td>' +
        '<td class="num"><b>' + money(r.implied_value_usd) + '</b></td></tr>';
    }).join('');
    document.getElementById('count').textContent = 'Showing ' + list.length + ' of ' + rows.length + ' protocols' +
      (s.chain || s.cat || q || s.wl ? ' (filtered)' : '') + '. Click a row for its farm plan.';

    var picked = s.p ? rows.filter(function (r) { return r.slug === s.p; })[0] : null;
    // A detail view focuses on the protocol: fold the explainer away so the
    // farm plan sits above the fold.
    document.getElementById('model').style.display = picked ? 'none' : '';
    if (picked) {
      var ch2 = pct(picked.change_7d);
      detailEl.hidden = false;
      detailEl.innerHTML =
        '<button class="back" id="back">&larr; Back to the board</button>' +
        '<h2>' + esc(picked.name) + (picked.watchlist ? '<span class="badge">WATCHLIST</span>' : '') + '</h2>' +
        '<p class="sub">Rank #' + picked.rank + ' &middot; ' + esc(picked.slug) + ' &middot; ' + esc(picked.category || 'uncategorised') + ' &middot; ' + esc(picked.chains.join(', ')) + '</p>' +
        '<div class="grid">' +
        '<div><b>' + money(picked.implied_value_usd) + '</b><span>implied value</span></div>' +
        '<div><b>' + money(picked.tvl_usd) + '</b><span>TVL</span></div>' +
        '<div><b class="' + ch2[1] + '">' + ch2[0] + '</b><span>7-day TVL change</span></div>' +
        '<div><b>' + age(picked.listed_at) + '</b><span>tracked since ' + esc(picked.listed_at || 'unknown') + '</span></div>' +
        '</div>' +
        '<h3>How to farm it</h3><ol>' + picked.farm_steps.map(function (st) { return '<li>' + esc(st) + '</li>'; }).join('') + '</ol>';
      document.getElementById('back').addEventListener('click', function () {
        var s2 = readHash(); s2.p = ''; writeHash(s2); render();
      });
    } else {
      detailEl.hidden = true;
      detailEl.innerHTML = '';
    }
  }

  function syncFromControls() {
    var s = readHash();
    s.q = document.getElementById('q').value;
    s.chain = document.getElementById('chain').value;
    s.cat = document.getElementById('cat').value;
    s.sort = document.getElementById('sort').value;
    s.wl = document.getElementById('wl').checked;
    writeHash(s);
    render();
  }
  ['q', 'chain', 'cat', 'sort', 'wl'].forEach(function (id) {
    document.getElementById(id).addEventListener(id === 'q' ? 'input' : 'change', syncFromControls);
  });
  rowsEl.addEventListener('click', function (e) {
    var tr = e.target.closest ? e.target.closest('tr') : null;
    if (!tr) return;
    var s = readHash();
    s.p = s.p === tr.getAttribute('data-slug') ? '' : tr.getAttribute('data-slug');
    writeHash(s);
    render();
    if (s.p) detailEl.scrollIntoView({ behavior: 'auto', block: 'start' });
  });
  document.querySelectorAll('th[data-sort]').forEach(function (th) {
    th.addEventListener('click', function () {
      var s = readHash();
      var key = th.getAttribute('data-sort');
      s.sort = key === 'rank' ? 'value' : key;
      if (key === 'name' || key === 'category' || key === 'chains') s.sort = key;
      writeHash(s);
      render();
    });
  });
  window.addEventListener('hashchange', render);
  render();
})();

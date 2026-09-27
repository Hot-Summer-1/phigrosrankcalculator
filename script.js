(function () {
  'use strict';

  var NOTE_LIMIT = 10000;
  var S_UNITS_MIN = 9112;      // 单位 0.01%，取得 S 的理论最低 ACC
  var LIST_UNITS_MIN = 9600;   // 参考表展示下限
  var TOTAL_SCORE = 920000;
  var ACC_UNIT_SCORE = 90;     // 每 0.01% ACC 对应的准度分

  var notesEl = document.getElementById('notes');
  var accEl = document.getElementById('acc');
  var resultEl = document.getElementById('result');
  var listBody = document.getElementById('list-body');

  // accUnits 以 0.01% 为单位
  function minCombo(notes, accUnits) {
    var need = TOTAL_SCORE - ACC_UNIT_SCORE * accUnits;
    return Math.ceil((need * notes) / 100000);
  }

  // 判断物量 n 下能否精确达成 accUnits 的 ACC（四舍五入到 0.01%）
  function isAchievable(n, accUnits) {
    var low = 2 * n * accUnits - n;
    var high = low + 2 * n - 1;
    for (var s = 0; s <= n; s++) {
      var base = 13000 * s;
      if (base > high) break;
      var lo = Math.max(0, Math.ceil((low - base) / 7000));
      var hi = Math.min(s, Math.floor((high - base) / 7000));
      if (lo <= hi) return true;
    }
    return false;
  }

  function buildAccList(n) {
    var arr = [];
    var d;
    if (n >= NOTE_LIMIT) {
      for (d = LIST_UNITS_MIN; d <= 10000; d++) arr.push(d);
      return arr;
    }
    for (d = LIST_UNITS_MIN; d <= 10000; d++) {
      if (isAchievable(n, d)) arr.push(d);
    }
    return arr;
  }

  function clearResult() {
    resultEl.className = 'result';
    resultEl.innerHTML = '<p class="hint">输入物量与 ACC 后自动计算</p>';
  }

  function showError(msg) {
    resultEl.className = 'result result--error';
    resultEl.innerHTML = '<p class="error">' + msg + '</p>';
  }

  function renderResult() {
    var nRaw = notesEl.value.trim();
    var n = parseInt(nRaw, 10);
    if (!nRaw || !Number.isFinite(n) || n <= 0) {
      clearResult();
      return;
    }
    var aRaw = accEl.value.trim();
    if (!aRaw) {
      clearResult();
      return;
    }
    var accVal = parseFloat(aRaw);
    if (!Number.isFinite(accVal) || accVal < 0) {
      showError('请输入有效的 ACC。');
      return;
    }
    if (accVal > 100) {
      showError('ACC 不能超过 100%。');
      return;
    }
    var units = Math.round(accVal * 100);
    if (units < S_UNITS_MIN) {
      showError('无法取得 S 评级。');
      return;
    }
    var combo = minCombo(n, units);
    var pct = (combo / n * 100).toFixed(2);
    var full = combo >= n;
    resultEl.className = 'result result--ok';
    resultEl.innerHTML =
      '<p class="result-label">达到 S 评级至少需要</p>' +
      '<p class="result-combo">' + combo.toLocaleString() + '<span>连击</span></p>' +
      '<p class="result-sub">约占总物量的 ' + pct + '%' + (full ? '（需要全连）' : '') + '</p>';
  }

  var listTimer = null;
  function scheduleList() {
    if (listTimer) clearTimeout(listTimer);
    listTimer = setTimeout(renderList, 180);
  }

  function renderList() {
    var nRaw = notesEl.value.trim();
    var n = parseInt(nRaw, 10);
    if (!nRaw || !Number.isFinite(n) || n <= 0) {
      listBody.innerHTML = '';
      return;
    }
    var list = buildAccList(n);
    var rows = '';
    for (var i = 0; i < list.length; i++) {
      var d = list[i];
      var combo = minCombo(n, d);
      var pct = (combo / n * 100).toFixed(2);
      rows += '<tr><td>' + (d / 100).toFixed(2) + '%</td><td>' +
        combo.toLocaleString() + '</td><td>' + pct + '%</td></tr>';
    }
    listBody.innerHTML = rows;
  }

  notesEl.addEventListener('input', function () {
    renderResult();
    scheduleList();
  });
  accEl.addEventListener('input', renderResult);

  clearResult();
})();

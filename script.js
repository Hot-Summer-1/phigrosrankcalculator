(function () {
  'use strict';

  var NOTE_LIMIT = 10000;
  var S_SCORE = 920000;        // S 评级分数线
  var V_SCORE = 960000;        // V 评级分数线
  var S_UNITS_MIN = 9112;      // 单位 0.01%，取得 S 的理论最低 ACC
  var V_UNITS_MIN = 9556;      // 单位 0.01%，取得 V 的理论最低 ACC
  var LIST_UNITS_MIN = 9600;   // S 参考表展示下限
  var V_LIST_UNITS_MIN = 9800; // V 参考表展示下限
  var ACC_UNIT_SCORE = 90;     // 每 0.01% ACC 对应的准度分

  var notesEl = document.getElementById('notes');
  var accEl = document.getElementById('acc');
  var resultEl = document.getElementById('result');
  var listBody = document.getElementById('list-body');

  // accUnits 以 0.01% 为单位
  function minCombo(notes, accUnits, targetScore) {
    var need = targetScore - ACC_UNIT_SCORE * accUnits;
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

  function buildAccList(n, minUnits) {
    var arr = [];
    var d;
    if (n >= NOTE_LIMIT) {
      for (d = minUnits; d <= 10000; d++) arr.push(d);
      return arr;
    }
    for (d = minUnits; d <= 10000; d++) {
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

  function resultBlock(grade, scoreLabel, combo, n) {
    var pct = (combo / n * 100).toFixed(2);
    var full = combo >= n;
    return '<div class="rating-block">' +
      '<p class="result-label">达到 ' + grade + ' 评级（' + scoreLabel + '）至少需要</p>' +
      '<p class="result-combo">' + combo +
        '<span>连击</span></p>' +
      '<p class="result-sub">约占总物量的 ' + pct + '%' +
        (full ? '（需要全连）' : '') + '</p>' +
      '</div>';
  }

  function unavailableBlock(grade, scoreLabel) {
    return '<div class="rating-block">' +
      '<p class="result-label">达到 ' + grade + ' 评级（' + scoreLabel + '）</p>' +
      '<p class="result-unavailable">当前 ACC 不足，无法取得 ' + grade + ' 评级</p>' +
      '</div>';
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
      showError('该 ACC 无法取得 S 或 V 评级。');
      return;
    }

    var html = resultBlock('S', '920000', minCombo(n, units, S_SCORE), n);
    if (units >= V_UNITS_MIN) {
      html += resultBlock('V', '960000', minCombo(n, units, V_SCORE), n);
    } else {
      html += unavailableBlock('V', '960000');
    }

    resultEl.className = 'result result--ok';
    resultEl.innerHTML = html;
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
    var list = buildAccList(n, LIST_UNITS_MIN);
    var rows = '';
    for (var i = 0; i < list.length; i++) {
      var d = list[i];
      var sCombo = minCombo(n, d, S_SCORE);
      var sPct = (sCombo / n * 100).toFixed(2);
      var vCombo = '-';
      var vPct = '-';
      if (d >= V_LIST_UNITS_MIN) {
        var vc = minCombo(n, d, V_SCORE);
        vCombo = vc;
        vPct = (vc / n * 100).toFixed(2) + '%';
      }
      rows += '<tr><td>' + (d / 100).toFixed(2) + '%</td><td>' +
        sCombo + '</td><td>' + sPct + '%</td><td>' +
        vCombo + '</td><td>' + vPct + '</td></tr>';
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

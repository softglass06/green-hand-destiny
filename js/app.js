/* ===== 小白算命 · 界面控制器 ===== */
(function () {
  'use strict';

  var smCat = 'career';
  var smHourOverride = null;
  var cqCat = null;
  var cqLines = [];
  var cqTossing = false;
  var countdownTimer = null;

  var SHICHEN = [
    { zhi: '子', hour: 23 }, { zhi: '丑', hour: 1 }, { zhi: '寅', hour: 3 },
    { zhi: '卯', hour: 5 }, { zhi: '辰', hour: 7 }, { zhi: '巳', hour: 9 },
    { zhi: '午', hour: 11 }, { zhi: '未', hour: 13 }, { zhi: '申', hour: 15 },
    { zhi: '酉', hour: 17 }, { zhi: '戌', hour: 19 }, { zhi: '亥', hour: 21 }
  ];

  function $(id) { return document.getElementById(id); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  // ---- 存储 ----
  function getDraw() {
    var s = localStorage.getItem('xsq-draw');
    if (!s) return null;
    try {
      var o = JSON.parse(s);
      return o.date === todayStr() ? o : null;
    } catch (e) { return null; }
  }
  function saveDraw(o) { localStorage.setItem('xsq-draw', JSON.stringify(o)); }
  function getHistory() {
    try { return JSON.parse(localStorage.getItem('xsq-history') || '[]'); }
    catch (e) { return []; }
  }
  function saveHistory(o) {
    var h = getHistory();
    h.unshift(o);
    localStorage.setItem('xsq-history', JSON.stringify(h.slice(0, 80)));
  }

  // ---- 标签页 ----
  function initTabs() {
    var tabs = document.querySelectorAll('.tab');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        $('panel-suanming').classList.toggle('active', t.dataset.tab === 'suanming');
        $('panel-chouqian').classList.toggle('active', t.dataset.tab === 'chouqian');
      });
    });
  }

  // ---- 类别 chips ----
  function renderCats(container, selected, onChange) {
    container.innerHTML = '';
    YJ.CATS.forEach(function (c) {
      var b = document.createElement('button');
      b.textContent = c.label;
      b.dataset.key = c.key;
      if (c.key === selected) b.classList.add('on');
      b.addEventListener('click', function () { onChange(c.key); });
      container.appendChild(b);
    });
  }

  // ---- 时辰 ----
  function autoShichenIndex(hour) { return Math.floor((hour + 1) / 2) % 12; }
  function currentShichenIndex() {
    if (smHourOverride !== null) {
      for (var i = 0; i < SHICHEN.length; i++) if (SHICHEN[i].hour === smHourOverride) return i;
    }
    var t = $('sm-time').value;
    var h = t ? parseInt(t.split(':')[0], 10) : 12;
    return autoShichenIndex(h);
  }
  function renderShichen() {
    var box = $('sm-shichen');
    box.innerHTML = '';
    var cur = currentShichenIndex();
    SHICHEN.forEach(function (s, i) {
      var b = document.createElement('button');
      b.textContent = s.zhi + '时';
      if (i === cur) b.classList.add('on');
      b.addEventListener('click', function () { smHourOverride = s.hour; renderShichen(); });
      box.appendChild(b);
    });
  }

  // ---- 算命 ----
  function doSuanming() {
    var dateVal = $('sm-date').value;
    if (!dateVal) { alert('请选择出生日期'); return; }
    var parts = dateVal.split('-');
    var y = +parts[0], m = +parts[1], d = +parts[2];
    var hour;
    if (smHourOverride !== null) hour = smHourOverride;
    else {
      var t = $('sm-time').value;
      hour = t ? parseInt(t.split(':')[0], 10) : 12;
    }
    var pp = BZ.paipan(y, m, d, hour);
    var interp = INTERP.bazi(pp, smCat);
    renderSuanmingResult(pp, interp, smCat);
  }

  function renderSuanmingResult(pp, interp, catKey) {
    var catLabel = '';
    YJ.CATS.forEach(function (c) { if (c.key === catKey) catLabel = c.label; });

    var pillars = pp.pillars.map(function (p, i) {
      var ss = pp.shishen[i];
      var ssCls = ss === '日主' ? ' style="color:var(--gold-2);font-weight:700"' : '';
      return '<div class="pillar"><div class="pos">' + p.pos + '</div>' +
        '<div class="gz serif">' + p.gan + ' <span style="color:var(--muted)">' + p.zhi + '</span></div>' +
        '<div class="hint"' + ssCls + '>' + ss + '</div></div>';
    }).join('');

    var wxTags = '';
    BZ.WU_ORDER.forEach(function (w) {
      wxTags += '<span>' + w + ' ' + pp.wuxing[w] + '</span>';
    });

    var wxBars = '';
    var maxN = Math.max.apply(null, BZ.WU_ORDER.map(function (w) { return pp.wuxing[w]; }));
    BZ.WU_ORDER.forEach(function (w) {
      var n = pp.wuxing[w];
      var wPct = maxN > 0 ? Math.round(n / maxN * 100) : 0;
      wxBars += '<div class="wx-bar-row"><span class="wx-name">' + w + '</span>' +
        '<span class="track"><span class="fill" style="width:' + wPct + '%"></span></span>' +
        '<span style="color:var(--muted)">' + n + '</span></div>';
    });

    var html =
      '<div class="card answer">' +
      '<h2><span class="dot">◆</span>排盘结果</h2>' +
      '<div class="pillars">' + pillars + '</div>' +
      '<div class="wuxing">' + wxTags + '</div>' +
      '<div class="section-title">五行分布</div>' + wxBars +
      '<div class="section-title">命理解读 · ' + catLabel + '</div>' +
      '<p class="body">' + interp.overview + '</p>' +
      '<p class="body" style="margin-top:10px">' + interp.reading + '</p>' +
      '<div class="warn">⚠ 警示：' + interp.warning + '</div>' +
      '<div class="tip">' + interp.xiyong + '</div>' +
      '</div>';

    var res = $('sm-result');
    res.innerHTML = html;
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- 抽签 ----
  function onCqCat(key) {
    cqCat = key;
    cqLines = [];
    renderCats($('cq-cats'), cqCat, onCqCat);
    renderTossArea();
  }

  function renderChouqian() {
    var draw = getDraw();
    if (draw) {
      renderDrawResult(draw);
    } else {
      renderDrawPrompt();
    }
    renderHistory();
  }

  function renderDrawPrompt() {
    var status = $('cq-status');
    status.innerHTML =
      '<h2><span class="dot">◆</span>今日一签</h2>' +
      '<div class="section-title">想求哪方面（每日仅此一签）</div>' +
      '<div id="cq-cats" class="cats"></div>' +
      '<div id="cq-toss-area"></div>';

    renderCats($('cq-cats'), cqCat, onCqCat);
    if (cqCat) renderTossArea();
    $('cq-result').innerHTML = '';
  }

  function renderTossArea() {
    var area = $('cq-toss-area');
    if (!area) return;
    area.innerHTML =
      '<div class="coins">' +
      '<div class="coin"><div class="inner"><div class="side front">背</div><div class="side back">字</div></div></div>' +
      '<div class="coin"><div class="inner"><div class="side front">背</div><div class="side back">字</div></div></div>' +
      '<div class="coin"><div class="inner"><div class="side front">背</div><div class="side back">字</div></div></div>' +
      '</div>' +
      '<div class="toss-hint" id="cq-hint">三枚铜钱，背面为阳、字面为阴，共摇六次成卦</div>' +
      '<div class="round-label" id="cq-round"></div>' +
      '<div id="cq-log" style="margin:8px 0"></div>' +
      '<button class="btn" id="cq-toss-btn">摇铜钱</button>';

    $('cq-toss-btn').addEventListener('click', doToss);
    updateRoundLabel();
    renderTossLog();
  }

  function updateRoundLabel() {
    var el = $('cq-round');
    if (el) el.textContent = cqLines.length >= 6 ? '六爻已成，卦象显现' : '第 ' + (cqLines.length + 1) + ' / 6 爻';
  }

  function lineNameOf(i, yang) {
    var pos = ['初', '二', '三', '四', '五', '上'][i];
    return pos + (yang ? '九' : '六');
  }

  function renderTossLog() {
    var el = $('cq-log');
    if (!el) return;
    var html = '';
    cqLines.forEach(function (l, i) {
      var type = { 6: '老阴', 7: '少阳', 8: '少阴', 9: '老阳' }[l.val];
      html += '<div class="hint">' + (i + 1) + '爻 ' + lineNameOf(i, l.yang) + ' · ' + type +
        (l.moving ? '（动）' : '') + '</div>';
    });
    el.innerHTML = html;
  }

  function doToss() {
    if (cqTossing || cqLines.length >= 6 || !cqCat) return;
    cqTossing = true;
    var coins = YJ.toss3Coins();
    var line = YJ.lineFromCoins(coins);
    var coinEls = document.querySelectorAll('#cq-toss-area .coin');

    coinEls.forEach(function (el) { el.classList.remove('result-yang', 'result-yin', 'spin'); el.classList.add('spin'); });
    $('cq-toss-btn').disabled = true;
    $('cq-hint').textContent = '铜钱翻飞……';

    setTimeout(function () {
      coinEls.forEach(function (el, i) {
        el.classList.remove('spin');
        el.classList.add(coins[i] ? 'result-yang' : 'result-yin');
      });
      cqLines.push(line);
      cqTossing = false;
      $('cq-toss-btn').disabled = false;
      $('cq-hint').textContent = coins.map(function (c) { return c ? '背' : '字'; }).join('、');
      updateRoundLabel();
      renderTossLog();

      if (cqLines.length >= 6) {
        $('cq-toss-btn').disabled = true;
        $('cq-toss-btn').textContent = '卦成';
        setTimeout(finalizeDraw, 700);
      }
    }, 600);
  }

  function finalizeDraw() {
    var derived = YJ.deriveHexagram(cqLines);
    var draw = {
      date: todayStr(),
      cat: cqCat,
      lines: cqLines,
      ben: derived.ben,
      bian: derived.bian,
      movingIndexes: derived.movingIndexes
    };
    saveDraw(draw);
    saveHistory(draw);
    renderChouqian();
  }

  function renderDrawResult(draw) {
    var ben = YJ.getHexagram(draw.ben);
    var bian = YJ.getHexagram(draw.bian);
    var interp = INTERP.hexagram(draw, draw.cat);

    var status = $('cq-status');
    status.innerHTML =
      '<div class="card" style="text-align:center">' +
      '<h2 style="text-align:center"><span class="dot">◆</span>今日一签已求</h2>' +
      '<p class="hint">每日仅此一签 · 明日 0 点后可再求</p>' +
      '<div class="cd-digits">' +
      '<div class="blk"><div class="num" id="cd-h">00</div><div class="lbl">时</div></div>' +
      '<div class="blk"><div class="num" id="cd-m">00</div><div class="lbl">分</div></div>' +
      '<div class="blk"><div class="num" id="cd-s">00</div><div class="lbl">秒</div></div>' +
      '</div>' +
      '<button class="btn ghost" id="cq-retry" style="margin-top:12px">再求一签</button>' +
      '</div>';

    startCountdown();
    $('cq-retry').addEventListener('click', showSecret);

    var catLabel = interp.catLabel;
    var resultHTML =
      '<div class="card answer">' +
      '<h2><span class="dot">◆</span>今日卦象 · ' + catLabel + '</h2>' +
      '<div class="hexagram">' +
      '<div class="hx-name serif">' + ben.full + '（' + ben.name + '）</div>' +
      '<div class="hx-sub">' + trigramLabel(ben) + '</div>' +
      hexLinesHTML(ben, draw.movingIndexes) +
      '</div>' +
      '<div class="body"><b>卦辞：</b>' + ben.judgement + '</div>' +
      '<div class="body" style="color:var(--muted)">' + ben.jPlain + '</div>';

    if (interp.useExtra) {
      resultHTML += '<div class="section-title">' + interp.useExtra.name + '</div>' +
        '<div class="body"><b>爻辞：</b>' + interp.useExtra.t + '</div>' +
        '<div class="body" style="color:var(--muted)">' + interp.useExtra.p + '</div>';
    }

    if (interp.movingLines.length) {
      resultHTML += '<div class="section-title">动爻</div>';
      interp.movingLines.forEach(function (ml) {
        resultHTML += '<div class="line-item moving"><div class="ln">' + ml.name + '</div>' +
          '<div class="lt">' + ml.text + '</div><div class="lp">' + ml.plain + '</div></div>';
      });
    }

    if (draw.movingIndexes.length && bian) {
      resultHTML += '<div class="section-title">变卦 · ' + bian.full + '（' + bian.name + '）</div>' +
        '<div class="body"><b>卦辞：</b>' + bian.judgement + '</div>' +
        '<div class="body" style="color:var(--muted)">' + bian.jPlain + '</div>';
    }

    resultHTML +=
      '<div class="section-title">卦意总纲</div>' +
      '<p class="body">' + ben.summary + '</p>' +
      '<div class="section-title">' + catLabel + '启示</div>' +
      '<p class="body">' + interp.catText + '</p>' +
      '<div class="tip">卦象仅供参考，事在人为，请理性看待。</div>' +
      '</div>';

    $('cq-result').innerHTML = resultHTML;
    $('cq-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // 当天想再抽一次时弹出的提示
  function showSecret() {
    var status = $('cq-status');
    status.innerHTML =
      '<div class="countdown-wrap">' +
      '<div class="secret serif">天机不可泄露</div>' +
      '<div class="secret-sub">一日一签，今日已求，静待明日再来</div>' +
      '<div class="cd-digits">' +
      '<div class="blk"><div class="num" id="cd-h">00</div><div class="lbl">时</div></div>' +
      '<div class="blk"><div class="num" id="cd-m">00</div><div class="lbl">分</div></div>' +
      '<div class="blk"><div class="num" id="cd-s">00</div><div class="lbl">秒</div></div>' +
      '</div></div>';
    startCountdown();
  }

  function trigramLabel(hex) {
    var lo = YJ.trigramOf(hex.bin, 'lower');
    var up = YJ.trigramOf(hex.bin, 'upper');
    return '下' + lo.name + lo.nat + ' · 上' + up.name + up.nat;
  }

  function hexLinesHTML(hex, movingIdx) {
    var html = '<div class="lines">';
    for (var i = 0; i < 6; i++) {
      html += lineHTML(hex.bin[i] === '1', movingIdx && movingIdx.indexOf(i) >= 0);
    }
    html += '</div>';
    return html;
  }
  function lineHTML(yang, moving) {
    var cls = 'yao ' + (yang ? 'yang' : 'yin') + (moving ? ' moving' : '');
    var tag = moving ? '<span class="tag">' + (yang ? '○' : '×') + '</span>' : '';
    if (yang) return '<div class="' + cls + '">' + tag + '<span class="bar"></span></div>';
    return '<div class="' + cls + '">' + tag + '<span class="bar"></span><span class="bar"></span></div>';
  }

  // ---- 倒计时 ----
  function nextMidnight() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 0);
  }
  function startCountdown() {
    stopCountdown();
    function tick() {
      var el = $('cd-h');
      if (!el) { stopCountdown(); return; }
      var ms = nextMidnight() - new Date();
      var s = Math.max(0, Math.floor(ms / 1000));
      $('cd-h').textContent = pad(Math.floor(s / 3600));
      $('cd-m').textContent = pad(Math.floor((s % 3600) / 60));
      $('cd-s').textContent = pad(s % 60);
      if (s <= 0) { renderChouqian(); }
    }
    tick();
    countdownTimer = setInterval(tick, 1000);
  }
  function stopCountdown() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  }

  // ---- 历史 ----
  function renderHistory() {
    var box = $('cq-history');
    var h = getHistory();
    if (!h.length) { box.innerHTML = '<div class="hint" style="padding:8px">暂无记录</div>'; return; }
    var html = '';
    h.forEach(function (o) {
      var ben = YJ.getHexagram(o.ben);
      var catLabel = '';
      YJ.CATS.forEach(function (c) { if (c.key === o.cat) catLabel = c.label; });
      if (!ben) return;
      html += '<div class="hist-item" data-date="' + o.date + '">' +
        '<div class="hi-left"><div class="hi-name">' + ben.full + ' · ' + catLabel + '</div>' +
        '<div class="hi-date">' + o.date + '</div></div>' +
        '<div class="hi-cat">查看</div></div>';
    });
    box.innerHTML = html;
    box.querySelectorAll('.hist-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var o = h.filter(function (x) { return x.date === item.dataset.date; })[0];
        if (o) showHistoryDetail(o);
      });
    });
  }

  function showHistoryDetail(o) {
    var ben = YJ.getHexagram(o.ben);
    var bian = YJ.getHexagram(o.bian);
    var catLabel = '';
    YJ.CATS.forEach(function (c) { if (c.key === o.cat) catLabel = c.label; });
    var interp = INTERP.hexagram(o, o.cat);
    var html = '<div class="card answer"><h2><span class="dot">◆</span>' + o.date + ' · ' + catLabel + '</h2>' +
      '<div class="hexagram"><div class="hx-name serif">' + ben.full + '</div>' + hexLinesHTML(ben, o.movingIndexes) + '</div>' +
      '<div class="body"><b>卦辞：</b>' + ben.judgement + '</div>' +
      '<div class="body" style="color:var(--muted)">' + ben.jPlain + '</div>';
    if (o.movingIndexes.length && bian) {
      html += '<div class="section-title">变卦 · ' + bian.full + '</div>' +
        '<div class="body"><b>卦辞：</b>' + bian.judgement + '</div>';
    }
    html += '<p class="body" style="margin-top:10px">' + ben.summary + '</p>' +
      '<div class="tip">' + interp.catText + '</div></div>';
    $('cq-result').innerHTML = html;
    $('cq-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- 初始化 ----
  function init() {
    initTabs();
    renderShichen();
    function onSmCat(key) { smCat = key; renderCats($('sm-cats'), smCat, onSmCat); }
    renderCats($('sm-cats'), smCat, onSmCat);
    $('sm-time').addEventListener('change', function () { smHourOverride = null; renderShichen(); });
    $('sm-date').addEventListener('change', renderShichen);
    $('sm-btn').addEventListener('click', doSuanming);
    renderChouqian();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

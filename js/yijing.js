/* ===== 小白算命 · 周易核心引擎 ===== */
(function () {
  'use strict';

  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // 八卦：键为三爻二进制（下→上），1=阳 0=阴
  var TRIGRAMS = {
    '111': { name: '乾', symbol: '☰', nat: '天', wu: '金', de: '健' },
    '110': { name: '兑', symbol: '☱', nat: '泽', wu: '金', de: '悦' },
    '101': { name: '离', symbol: '☲', nat: '火', wu: '火', de: '丽' },
    '100': { name: '震', symbol: '☳', nat: '雷', wu: '木', de: '动' },
    '011': { name: '巽', symbol: '☴', nat: '风', wu: '木', de: '入' },
    '010': { name: '坎', symbol: '☵', nat: '水', wu: '水', de: '陷' },
    '001': { name: '艮', symbol: '☶', nat: '山', wu: '土', de: '止' },
    '000': { name: '坤', symbol: '☷', nat: '地', wu: '土', de: '顺' }
  };

  var CATS = [
    { key: 'career', label: '事业' },
    { key: 'wealth', label: '财运' },
    { key: 'love', label: '情感' },
    { key: 'marriage', label: '姻缘' },
    { key: 'health', label: '健康' },
    { key: 'study', label: '学业' },
    { key: 'overall', label: '综合运势' }
  ];

  // 六十四卦数据由 data 文件依次 push 进来
  var HEXAGRAMS = [];

  // 爻名：i 为 0..5（自下而上）
  function lineName(bin, i) {
    var pos = ['初', '二', '三', '四', '五', '上'][i];
    return pos + (bin[i] === '1' ? '九' : '六');
  }

  function getHexagram(bin) {
    for (var i = 0; i < HEXAGRAMS.length; i++) {
      if (HEXAGRAMS[i].bin === bin) return HEXAGRAMS[i];
    }
    return null;
  }

  // 掷三枚铜钱：true=背（阳），false=字（阴）
  function toss3Coins() {
    return [0, 1, 2].map(function () { return Math.random() < 0.5; });
  }

  // 由三枚铜钱定一爻
  // 背数 0→老阴(6,动) 1→少阳(7,静) 2→少阴(8,静) 3→老阳(9,动)
  function lineFromCoins(coins) {
    var backs = coins.filter(Boolean).length;
    return {
      yang: backs % 2 === 1,
      moving: backs === 0 || backs === 3,
      backs: backs,
      val: [6, 7, 8, 9][backs]
    };
  }

  // 由六爻得本卦/变卦/动爻位置
  function deriveHexagram(lines) {
    var ben = '', bian = '', moving = [];
    lines.forEach(function (l, i) {
      ben += l.yang ? '1' : '0';
      bian += (l.moving ? !l.yang : l.yang) ? '1' : '0';
      if (l.moving) moving.push(i);
    });
    return { ben: ben, bian: bian, movingIndexes: moving };
  }

  function trigramOf(bin, which) {
    var sub = which === 'upper' ? bin.slice(3, 6) : bin.slice(0, 3);
    return TRIGRAMS[sub];
  }

  window.YJ = {
    GAN: GAN, ZHI: ZHI, TRIGRAMS: TRIGRAMS, CATS: CATS, HEXAGRAMS: HEXAGRAMS,
    lineName: lineName, getHexagram: getHexagram,
    toss3Coins: toss3Coins, lineFromCoins: lineFromCoins,
    deriveHexagram: deriveHexagram, trigramOf: trigramOf
  };
})();

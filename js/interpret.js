/* ===== 小白算命 · 解读引擎 ===== */
(function () {
  'use strict';

  var WU = BZ.WU_ORDER; // ['木','火','土','金','水']
  var GAN_WU = BZ.GAN_WU, ZHI_WU = BZ.ZHI_WU;

  var WU_INFO = {
    '木': { dir: '东方', color: '青色 / 绿色', body: '肝胆、筋络' },
    '火': { dir: '南方', color: '红色', body: '心脏、小肠、血脉' },
    '土': { dir: '本地 / 中央', color: '黄色', body: '脾胃、肌肉' },
    '金': { dir: '西方', color: '白色', body: '肺、大肠、皮肤' },
    '水': { dir: '北方', color: '黑色 / 蓝色', body: '肾、膀胱、骨骼' }
  };

  var DAY_MASTER_PERSONA = {
    '木': '仁厚正直，有理想抱负，生机勃勃、能屈能伸；但有时偏于理想化、易犹豫。',
    '火': '热情开朗，重礼有礼，行动力强、富有感染力；但易急躁、好表现。',
    '土': '稳重踏实，讲信义，包容力强、重实际；但易固执、不喜变动。',
    '金': '果断刚毅，讲义气，原则性强、执行力强；但易强硬、缺乏变通。',
    '水': '聪慧灵活，善于变通，思虑深远、适应力强；但易多虑、情绪化。'
  };

  // 五行喜用（身强喜克泄耗，身弱喜生扶）
  function xiyongList(pp) {
    var strong = pp.dayMaster.strong === '身强';
    var dw = pp.dayMaster.wu, di = WU.indexOf(dw);
    if (strong) {
      return [WU[(di - 2 + 5) % 5], WU[(di + 1) % 5], WU[(di + 2) % 5]]; // 官杀、食伤、财
    }
    return [WU[(di - 1 + 5) % 5], dw]; // 印、比劫
  }

  // 主十神（四天干中除日主外出现最多的）
  function dominantShishen(pp) {
    var counts = {};
    pp.shishen.forEach(function (s, i) {
      if (i === 2 || s === '日主') return; // 跳过日柱
      counts[s] = (counts[s] || 0) + 1;
    });
    var best = null, bestN = -1;
    Object.keys(counts).forEach(function (k) { if (counts[k] > bestN) { best = k; bestN = counts[k]; } });
    return best;
  }

  function hasShishen(pp, name) { return pp.shishen.indexOf(name) >= 0; }

  // 五行最弱（缺失或最少）
  function weakestWu(pp) {
    var min = 99, w = '木';
    Object.keys(pp.wuxing).forEach(function (k) {
      if (pp.wuxing[k] < min) { min = pp.wuxing[k]; w = k; }
    });
    return { wu: w, n: min };
  }

  // 五行最旺
  function strongestWu(pp) {
    var max = -1, w = '木';
    Object.keys(pp.wuxing).forEach(function (k) {
      if (pp.wuxing[k] > max) { max = pp.wuxing[k]; w = k; }
    });
    return { wu: w, n: max };
  }

  // ---- 八字整体解读 ----
  function interpretBazi(pp, catKey) {
    var strong = pp.dayMaster.strong === '身强';
    var dw = pp.dayMaster.wu;
    var xy = xiyongList(pp);
    var dom = dominantShishen(pp);
    var weakest = weakestWu(pp), strongest = strongestWu(pp);

    var xiyongText = '喜用：' + xy.join('、') +
      '（' + xy.map(function (w) { return WU_INFO[w].dir + '·' + WU_INFO[w].color; }).join('；') + '）';

    // 命局总述
    var overview = '日主为' + pp.dayMaster.gan + '（' + dw + '），' + DAY_MASTER_PERSONA[dw] +
      ' 八字' + pp.dayMaster.strong + '。' +
      (strong ? '精力旺盛、主见强，宜主动开拓、独当一面，但需防刚愎自用、过刚易折。'
              : '谨慎内敛、心思细腻，宜借力而行、依托贵人，勿强出头，稳中求进。') +
      ' 五行之中' + strongest.wu + '偏旺、' + weakest.wu + '偏弱，' + xiyongText + '。';

    var reading = categoryReading(catKey, pp, { strong: strong, dw: dw, dom: dom, weakest: weakest, strongest: strongest, xy: xy });

    var warning = warningFor(pp, { strongest: strongest, weakest: weakest, strong: strong });

    return { overview: overview, reading: reading, warning: warning, xiyong: xiyongText };
  }

  function categoryReading(cat, pp, c) {
    switch (cat) {
      case 'career':
        return careerText(pp, c);
      case 'wealth':
        return wealthText(pp, c);
      case 'love':
        return loveText(pp, c);
      case 'marriage':
        return marriageText(pp, c);
      case 'health':
        return healthText(pp, c);
      case 'study':
        return studyText(pp, c);
      default:
        return overallText(pp, c);
    }
  }

  function careerText(pp, c) {
    var s = '';
    if (hasShishen(pp, '正官')) s += '命带正官，宜在规范、稳定的平台发展，如公职、大机构、管理岗，规矩中求上进。';
    else if (hasShishen(pp, '七杀')) s += '命带七杀，宜从事有挑战、重竞争的行当，如创业、军警法、销售攻坚，越挫越勇。';
    else if (hasShishen(pp, '正印') || hasShishen(pp, '偏印')) s += '命带印星，宜走文教、学术、研究或专业技术路线，靠专业和口碑立身。';
    else if (hasShishen(pp, '食神') || hasShishen(pp, '伤官')) s += '命带食伤，宜发挥创意与才华，如技术、设计、艺术、自由职业。';
    else s += '命带比劫，宜借人脉与团队之力，合伙经营、抱团发展。';
    s += c.strong ? ' 你' + '身强能扛事，适合挑大梁、扛指标，但勿锋芒太露，注意与人和气。'
                   : ' 你身弱宜借势，跟对平台与贵人，避免单打独斗、硬扛压力。';
    return s;
  }

  function wealthText(pp, c) {
    var s = '';
    if (hasShishen(pp, '正财')) s += '命带正财，宜以正职、稳定经营为主，细水长流、量入为出，财富靠积累。';
    else if (hasShishen(pp, '偏财')) s += '命带偏财，有投资与外财之机，财路灵活，但须防投机冒进、见好就收。';
    else s += '财星不显，宜先求稳再谋利，靠手艺或专业稳步生财。';
    s += c.strong ? ' 身强能担财，敢于进取求财，可适当拓展财路。'
                   : ' 财多身弱反成负担，宜守成，勿贪大、勿加杠杆。';
    return s;
  }

  function loveText(pp, c) {
    var s = '';
    if (hasShishen(pp, '正官') || hasShishen(pp, '七杀')) s += '你重感情、对关系认真，欣赏有能力、有担当的伴侣，但易在感情中较真。';
    else if (hasShishen(pp, '正财') || hasShishen(pp, '偏财')) s += '你温柔务实，愿意为感情付出，看重安稳与踏实，但勿一味迁就。';
    else s += '你在感情中较为独立，慢热但长情，需要时间建立信任。';
    s += c.strong ? ' 主动性较强，宜大胆表达，但别太强势。' : ' 较为被动，宜多表达、别把话藏在心里。';
    return s;
  }

  function marriageText(pp, c) {
    var s = '婚姻重在经营与磨合。';
    if (hasShishen(pp, '正官') || hasShishen(pp, '正财')) s += ' 你正缘较稳，宜珍惜踏实、可靠的对象，婚后多包容、少计较。';
    else s += ' 姻缘稍晚或需耐心，切勿仓促将就，缘分成熟时自会水到渠成。';
    s += c.strong ? ' 你个性较强，婚姻中宜多让一步，家和万事兴。' : ' 你温柔随和，但需坚定底线，避免一味迁就。';
    return s;
  }

  function healthText(pp, c) {
    var w = c.weakest;
    var s = '五行之中' + w.wu + '偏弱，需留意' + WU_INFO[w.wu].body + '方面的保养。';
    if (c.strongest.wu !== w.wu) s += ' 而' + c.strongest.wu + '偏旺，也忌过亢失衡。';
    s += ' 规律作息、清淡饮食、适度运动，保持情绪平和最养身。';
    return s;
  }

  function studyText(pp, c) {
    var s = '';
    if (hasShishen(pp, '正印') || hasShishen(pp, '偏印')) s += '命带印星，学习力与记忆力佳，宜静心读书、考学进修，师长贵人多助。';
    else if (hasShishen(pp, '食神') || hasShishen(pp, '伤官')) s += '思维活跃、悟性高，宜发挥创意与兴趣，把热爱化为专长。';
    else s += '宜稳扎稳打、勤能补拙，坚持积累必有突破。';
    s += c.strong ? ' 精力充沛，可适当加压、深钻难题。' : ' 注意劳逸结合，别透支，稳步推进。';
    return s;
  }

  function overallText(pp, c) {
    var s = '综合来看，' + pp.dayMaster.strong + '的你，' +
      (c.strong ? '当前气运宜进取，主动把握机会、勇于担当，但须戒骄戒躁、留有余地。'
                : '当前宜稳中求进，多结善缘、借力贵人，蓄势待发，切忌冒进。');
    s += ' 有利方位为' + c.xy.map(function (w) { return WU_INFO[w].dir; }).join('、') +
         '，宜多亲近' + c.xy.map(function (w) { return WU_INFO[w].color; }).join('、') + '等颜色。';
    return s;
  }

  function warningFor(pp, c) {
    var parts = [];
    parts.push('勿把命理当作行动的绝对依据，重大决定仍要靠理性判断。');
    if (c.strongest.n >= 3) parts.push('你' + c.strongest.wu + '过旺，' + (c.strong ? '易刚愎自用、过刚易折，' : '') + '注意别走极端。');
    if (c.weakest.n <= 1) parts.push('你' + c.weakest.wu + '偏弱，注意' + WU_INFO[c.weakest.wu].body + '的养护，别过度消耗。');
    return parts.join(' ');
  }

  // ---- 抽签（周易）解读组装 ----
  function interpretHexagram(toss, catKey) {
    var ben = YJ.getHexagram(toss.ben);
    var bian = YJ.getHexagram(toss.bian);
    var moving = toss.movingIndexes;

    var allMoving = moving.length === 6;
    var useExtra = null;
    if (allMoving && ben.name === '乾') useExtra = ben.extra;
    if (allMoving && ben.name === '坤') useExtra = ben.extra;

    var movingLines = moving.map(function (i) {
      return { name: YJ.lineName(ben.bin, i), text: ben.lines[i].t, plain: ben.lines[i].p };
    });

    var catLabel = null;
    YJ.CATS.forEach(function (c) { if (c.key === catKey) catLabel = c.label; });

    return {
      ben: ben, bian: bian,
      moving: moving, movingLines: movingLines, useExtra: useExtra,
      catLabel: catLabel, catText: ben.cats[catKey]
    };
  }

  window.INTERP = { bazi: interpretBazi, hexagram: interpretHexagram };
})();

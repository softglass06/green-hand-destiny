/* ===== 小白算命 · 八字排盘 ===== */
(function () {
  'use strict';

  var GAN = YJ.GAN, ZHI = YJ.ZHI;

  // 天干五行
  var GAN_WU = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
  // 地支五行
  var ZHI_WU = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];
  var WU_ORDER = ['木', '火', '土', '金', '水'];

  // 十二「节」（用于定年柱/月柱）month 为公历月，c21/c20 为世纪常数，zhi 为起始月支
  var JIE = [
    { name: '立春', month: 2,  c21: 3.87,   c20: 4.6295, yMinus1: true,  zhi: 2  },
    { name: '惊蛰', month: 3,  c21: 5.63,   c20: 6.3926, yMinus1: false, zhi: 3  },
    { name: '清明', month: 4,  c21: 4.81,   c20: 5.59,   yMinus1: false, zhi: 4  },
    { name: '立夏', month: 5,  c21: 5.52,   c20: 6.318,  yMinus1: false, zhi: 5  },
    { name: '芒种', month: 6,  c21: 5.678,  c20: 6.5,    yMinus1: false, zhi: 6  },
    { name: '小暑', month: 7,  c21: 7.108,  c20: 7.928,  yMinus1: false, zhi: 7  },
    { name: '立秋', month: 8,  c21: 7.5,    c20: 8.35,   yMinus1: false, zhi: 8  },
    { name: '白露', month: 9,  c21: 7.646,  c20: 8.44,   yMinus1: false, zhi: 9  },
    { name: '寒露', month: 10, c21: 8.318,  c20: 9.098,  yMinus1: false, zhi: 10 },
    { name: '立冬', month: 11, c21: 7.438,  c20: 8.218,  yMinus1: false, zhi: 11 },
    { name: '大雪', month: 12, c21: 7.18,   c20: 7.9,    yMinus1: false, zhi: 0  },
    { name: '小寒', month: 1,  c21: 5.4055, c20: 6.11,   yMinus1: true,  zhi: 1  }
  ];

  // 寿星公式求「节」的日期（返回当天的 0 点 Date）
  function jieDate(year, term) {
    var Y = ((year % 100) + 100) % 100;
    var c = year >= 2000 ? term.c21 : term.c20;
    var L = term.yMinus1 ? Math.floor((Y - 1) / 4) : Math.floor(Y / 4);
    var day = Math.floor(Y * 0.2422 + c) - L;
    return new Date(year, term.month - 1, day);
  }

  // 公历 → 儒略日数（整数，正午）
  function toJDN(y, m, d) {
    var a = Math.floor((14 - m) / 12);
    var y2 = y + 4800 - a;
    var m2 = m + 12 * a - 3;
    return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2
      + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
  }

  // 年柱（立春换年）
  function yearPillar(y, m, d) {
    var lichun = jieDate(y, JIE[0]); // 立春
    var effYear = (new Date(y, m - 1, d) < lichun) ? y - 1 : y;
    var gi = ((effYear - 4) % 10 + 10) % 10;
    var zi = ((effYear - 4) % 12 + 12) % 12;
    return { gan: GAN[gi], zhi: ZHI[zi], ganIdx: gi, zhiIdx: zi, effYear: effYear };
  }

  // 月柱（十二节定月支，五虎遁定月干）
  function monthPillar(y, m, d, yearGanIdx) {
    var dt = new Date(y, m - 1, d);
    // 取 <= 当前日期的最近一个「节」，其月支即当前月支
    var best = null;
    for (var yy = y - 1; yy <= y + 1; yy++) {
      for (var i = 0; i < JIE.length; i++) {
        var sd = jieDate(yy, JIE[i]);
        if (sd <= dt && (!best || sd > best.date)) best = { date: sd, zhi: JIE[i].zhi };
      }
    }
    var zhiIdx = best ? best.zhi : 1;
    // 五虎遁：寅月天干 = (年干%5)*2+2
    var yinGan = ((yearGanIdx % 5) * 2 + 2) % 10;
    var n = (zhiIdx - 2 + 12) % 12; // 相对寅月的偏移
    var ganIdx = (yinGan + n) % 10;
    return { gan: GAN[ganIdx], zhi: ZHI[zhiIdx], ganIdx: ganIdx, zhiIdx: zhiIdx };
  }

  // 日柱（JDN 定日干支）
  function dayPillar(y, m, d) {
    var jdn = toJDN(y, m, d);
    var idx = ((jdn - 2451491) % 60 + 60) % 60;
    return { gan: GAN[idx % 10], zhi: ZHI[idx % 12], ganIdx: idx % 10, zhiIdx: idx % 12 };
  }

  // 时柱（时辰定支，五鼠遁定干）
  function hourPillar(hour, dayGanIdx) {
    var zhiIdx = Math.floor((hour + 1) / 2) % 12;
    var ziGan = (dayGanIdx % 5) * 2; // 子时天干
    var ganIdx = (ziGan + zhiIdx) % 10;
    return { gan: GAN[ganIdx], zhi: ZHI[zhiIdx], ganIdx: ganIdx, zhiIdx: zhiIdx };
  }

  // 五行统计（八字八个字的五行）
  function wuxingCount(pillars) {
    var c = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    pillars.forEach(function (p) {
      c[GAN_WU[p.ganIdx]]++;
      c[ZHI_WU[p.zhiIdx]]++;
    });
    return c;
  }

  // 十神（相对日干，只看四天干）
  function shishen(ganIdx, dayGanIdx) {
    if (ganIdx === dayGanIdx) return '日主';
    var sameYinYang = (ganIdx % 2) === (dayGanIdx % 2); // 同阴阳
    var g = GAN_WU[ganIdx], d = GAN_WU[dayGanIdx];
    var di = WU_ORDER.indexOf(d), gi = WU_ORDER.indexOf(g);
    var rel = (gi - di + 5) % 5; // 0同 1我生 2我克 3克我 4生我
    if (rel === 0) return sameYinYang ? '比肩' : '劫财';
    if (rel === 1) return sameYinYang ? '食神' : '伤官';
    if (rel === 2) return sameYinYang ? '偏财' : '正财';
    if (rel === 3) return sameYinYang ? '七杀' : '正官';
    return sameYinYang ? '偏印' : '正印';
  }

  // 日主强弱（同党=比劫+印，异党=食伤+财+官杀）
  function dayStrength(pillars, dayGanIdx) {
    var same = 0, diff = 0;
    var dw = GAN_WU[dayGanIdx], di = WU_ORDER.indexOf(dw);
    var sheng = WU_ORDER[(di - 1 + 5) % 5]; // 生我
    var wosheng = WU_ORDER[(di + 1) % 5];   // 我生
    var woke = WU_ORDER[(di + 2) % 5];      // 我克
    var kewo = WU_ORDER[(di - 2 + 5) % 5];  // 克我
    pillars.forEach(function (p) {
      [GAN_WU[p.ganIdx], ZHI_WU[p.zhiIdx]].forEach(function (w) {
        if (w === dw || w === sheng) same++;
        else diff++;
      });
    });
    return same >= diff ? '身强' : '身弱';
  }

  // 主排盘入口
  function paipan(y, m, d, hour) {
    var yp = yearPillar(y, m, d);
    var mp = monthPillar(y, m, d, yp.ganIdx);
    var dp = dayPillar(y, m, d);
    var hp = hourPillar(hour, dp.ganIdx);

    var pillars = [
      { pos: '年柱', gan: yp.gan, zhi: yp.zhi, ganIdx: yp.ganIdx, zhiIdx: yp.zhiIdx },
      { pos: '月柱', gan: mp.gan, zhi: mp.zhi, ganIdx: mp.ganIdx, zhiIdx: mp.zhiIdx },
      { pos: '日柱', gan: dp.gan, zhi: dp.zhi, ganIdx: dp.ganIdx, zhiIdx: dp.zhiIdx },
      { pos: '时柱', gan: hp.gan, zhi: hp.zhi, ganIdx: hp.ganIdx, zhiIdx: hp.zhiIdx }
    ];

    var ss = pillars.map(function (p) { return shishen(p.ganIdx, dp.ganIdx); });

    return {
      pillars: pillars,
      ganzi: pillars.map(function (p) { return p.gan + p.zhi; }),
      shishen: ss,
      wuxing: wuxingCount(pillars),
      dayMaster: {
        gan: dp.gan, zhi: dp.zhi,
        wu: GAN_WU[dp.ganIdx],
        strong: dayStrength(pillars, dp.ganIdx)
      },
      dayGanIdx: dp.ganIdx
    };
  }

  // 时辰（由小时求时辰名）
  function shichenName(hour) {
    var zhiIdx = Math.floor((hour + 1) / 2) % 12;
    return ZHI[zhiIdx] + '时';
  }

  window.BZ = { paipan: paipan, shichenName: shichenName, GAN_WU: GAN_WU, ZHI_WU: ZHI_WU, WU_ORDER: WU_ORDER };
})();

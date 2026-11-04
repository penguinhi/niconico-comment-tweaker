// ==UserScript==
// @name         ニコニコ動画 コメント表示調整
// @name:ja      ニコニコ動画 コメント表示調整
// @name:en      Niconico Comment Tweaker
// @name:zh-CN   niconico 弹幕显示调整
// @name:zh-TW   niconico 彈幕顯示調整
// @namespace    https://github.com/penguinhi/niconico-comment-tweaker
// @version      2.3.0
// @author       penguinhi
// @license      MIT
// @homepageURL  https://github.com/penguinhi/niconico-comment-tweaker
// @supportURL   https://github.com/penguinhi/niconico-comment-tweaker/issues
// @icon         https://www.nicovideo.jp/favicon.ico
// @description        コメントの大きさ（文字サイズ変更／描画の拡大縮小の2方式）と透明度を調整します。Alt+C または左下のボタンで設定を開きます。
// @description:en     Adjust comment size (via font size or sprite scaling) and opacity. Press Alt+C or click the bottom-left button to open settings.
// @description:zh-CN  调整弹幕大小（可选改字号或缩放贴图两种方式）和透明度。按 Alt+C 或点击左下角按钮打开设置。
// @description:zh-TW  調整彈幕大小（可選改字體大小或縮放貼圖兩種方式）與透明度。按 Alt+C 或點擊左下角按鈕開啟設定。
// @match        https://www.nicovideo.jp/watch/*
// @match        https://sp.nicovideo.jp/watch/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

// @grant none + document-start：ページのコンテキストで実行し、
// プレーヤーの読み込み前に canvas フックを仕込むために必須。

(function () {
  'use strict';

  const KEY = 'nct-settings-v2';
  const DEFAULTS = {
    mode: 'font',   // font = 文字サイズ変更 / sprite = 描画済みコメントを拡大縮小 / off = 変更しない
    scale: 1.0,
    opacity: 0.8,
    lang: 'auto',   // auto = ブラウザの言語に従う
  };
  let settings = { ...DEFAULTS };
  try { Object.assign(settings, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) {} };

  const stats = { font: 0, sprite: 0 };

  const I18N = {
    'zh-CN': {
      title: '弹幕设置', modeLabel: '大小调整方式：',
      modeFont: '字体模式（修改字号）', modeSprite: '贴图模式（缩放每条弹幕）', modeOff: '不调整大小',
      size: '字号：', opacity: '不透明度：', reset: '恢复默认', fab: '弹',
      lang: '语言：', auto: '自动（跟随浏览器）',
      stat: (f, s) => `诊断：字体钩子命中 ${f} 次，贴图钩子命中 ${s} 次`,
    },
    'zh-TW': {
      title: '彈幕設定', modeLabel: '大小調整方式：',
      modeFont: '字體模式（修改字體大小）', modeSprite: '貼圖模式（縮放每條彈幕）', modeOff: '不調整大小',
      size: '字體大小：', opacity: '不透明度：', reset: '恢復預設', fab: '彈',
      lang: '語言：', auto: '自動（跟隨瀏覽器）',
      stat: (f, s) => `診斷：字體鉤子命中 ${f} 次，貼圖鉤子命中 ${s} 次`,
    },
    ja: {
      title: 'コメント設定', modeLabel: 'サイズ調整方式：',
      modeFont: 'フォントモード（文字サイズを変更）', modeSprite: 'スプライトモード（各コメントを拡大縮小）', modeOff: 'サイズを変更しない',
      size: 'サイズ：', opacity: '不透明度：', reset: '初期設定に戻す', fab: 'コ',
      lang: '言語：', auto: '自動（ブラウザに従う）',
      stat: (f, s) => `診断：フォントフック ${f} 回、スプライトフック ${s} 回`,
    },
    en: {
      title: 'Comment Settings', modeLabel: 'Size adjustment:',
      modeFont: 'Font mode (change font size)', modeSprite: 'Sprite mode (scale each comment)', modeOff: 'No size change',
      size: 'Size: ', opacity: 'Opacity: ', reset: 'Reset to defaults', fab: 'C',
      lang: 'Language:', auto: 'Auto (follow browser)',
      stat: (f, s) => `Diagnostics: font hook ${f} hits, sprite hook ${s} hits`,
    },
  };
  function pickLang() {
    if (I18N[settings.lang]) return I18N[settings.lang];
    const lang = (navigator.language || '').toLowerCase();
    if (lang.startsWith('ja')) return I18N.ja;
    if (/^zh-(tw|hk|mo|hant)/.test(lang)) return I18N['zh-TW'];
    if (lang.startsWith('zh')) return I18N['zh-CN'];
    return I18N.en;
  }
  let T = pickLang();

  const commentCanvases = new WeakSet();

  function scanCanvases() {
    const video = document.querySelector('video');
    if (!video) return;
    const v = video.getBoundingClientRect();
    if (!v.width) return;
    for (const c of document.querySelectorAll('canvas')) {
      const r = c.getBoundingClientRect();
      const w = Math.min(r.right, v.right) - Math.max(r.left, v.left);
      const h = Math.min(r.bottom, v.bottom) - Math.max(r.top, v.top);
      if (w > 0 && h > 0 && (w * h) / (v.width * v.height) > 0.8) {
        commentCanvases.add(c);
        c.style.setProperty('opacity', String(settings.opacity), 'important');
      }
    }
  }

  // 表示中でもコメント層ではない canvas は対象外（他の UI を巻き込まないため）
  function isTargetForFont(ctx) {
    const c = ctx.canvas;
    if (!c) return false;
    if (typeof OffscreenCanvas !== 'undefined' && c instanceof OffscreenCanvas) return true;
    return !c.isConnected || commentCanvases.has(c);
  }

  function scaleFont(font) {
    return font.replace(/(\d*\.?\d+)px/, (_, n) => (parseFloat(n) * settings.scale).toFixed(2) + 'px');
  }

  function hookFont(proto) {
    if (!proto) return;
    const desc = Object.getOwnPropertyDescriptor(proto, 'font');
    if (!desc || !desc.set) return;
    const original = new WeakMap(); // 元のフォントを保持し、読み出し→再代入による多重拡大を防ぐ
    Object.defineProperty(proto, 'font', {
      configurable: true,
      enumerable: desc.enumerable,
      get() {
        return original.has(this) ? original.get(this) : desc.get.call(this);
      },
      set(value) {
        original.set(this, value);
        if (settings.mode === 'font' && settings.scale !== 1 && isTargetForFont(this)) {
          stats.font++;
          desc.set.call(this, scaleFont(String(value)));
        } else {
          desc.set.call(this, value);
        }
      },
    });
  }

  hookFont(window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype);
  hookFont(window.OffscreenCanvasRenderingContext2D && OffscreenCanvasRenderingContext2D.prototype);

  const origDrawImage = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (img, ...a) {
    const s = settings.scale;
    if (settings.mode !== 'sprite' || s === 1 || !commentCanvases.has(this.canvas)) {
      return origDrawImage.call(this, img, ...a);
    }
    stats.sprite++;
    let sx, sy, sw, sh, dx, dy, dw, dh;
    if (a.length === 2) {            // drawImage(img, dx, dy)
      [dx, dy] = a; dw = img.width; dh = img.height;
    } else if (a.length === 4) {     // drawImage(img, dx, dy, dw, dh)
      [dx, dy, dw, dh] = a;
    } else if (a.length === 8) {     // drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
      [sx, sy, sw, sh, dx, dy, dw, dh] = a;
    } else {
      return origDrawImage.call(this, img, ...a);
    }
    // 左端・垂直中央を基準に拡大縮小し、位置を保ったままサイズだけ変える
    const ndw = dw * s, ndh = dh * s;
    const ndy = dy + (dh - ndh) / 2;
    if (a.length === 8) return origDrawImage.call(this, img, sx, sy, sw, sh, dx, ndy, ndw, ndh);
    return origDrawImage.call(this, img, dx, ndy, ndw, ndh);
  };

  function startObservers() {
    buildButton();
    scanCanvases();
    new MutationObserver(scanCanvases).observe(document.body, { childList: true, subtree: true });
    setInterval(scanCanvases, 1500);
    window.addEventListener('resize', scanCanvases);
    document.addEventListener('fullscreenchange', () => setTimeout(scanCanvases, 300));
  }

  let panel = null, statTimer = null;

  function buildPanel() {
    panel = document.createElement('div');
    panel.id = 'nct-panel';
    panel.style.cssText = `
      position: fixed; right: 16px; bottom: 16px; z-index: 2147483647;
      background: rgba(28,28,30,.96); color: #f2f2f2; padding: 14px 16px;
      border: 1px solid rgba(255,255,255,.18); color-scheme: dark;
      border-radius: 10px; font: 13px/1.6 sans-serif; width: 250px;
      box-shadow: 0 4px 16px rgba(0,0,0,.4); display: none;`;
    const style = document.createElement('style');
    style.textContent = `
      #nct-panel select, #nct-panel button {
        background: #3a3a3c; color: #f2f2f2; border: 1px solid #5a5a5e;
        border-radius: 6px; padding: 4px 6px; font: inherit; cursor: pointer;
      }
      #nct-panel select option { background: #2c2c2e; color: #f2f2f2; }
      #nct-panel button:hover, #nct-panel select:hover { background: #48484a; }
      #nct-panel input[type=range] { accent-color: #4da3ff; }`;
    panel.appendChild(style);
    const body = document.createElement('div');
    body.innerHTML = `
      <div style="font-weight:bold;margin-bottom:8px;display:flex;justify-content:space-between">
        ${T.title} <span id="nct-close" style="cursor:pointer">✕</span>
      </div>
      <label>${T.modeLabel}</label>
      <select id="nct-mode" style="width:100%;margin-bottom:6px">
        <option value="font">${T.modeFont}</option>
        <option value="sprite">${T.modeSprite}</option>
        <option value="off">${T.modeOff}</option>
      </select>
      <label>${T.size}<span id="nct-sc-v"></span></label>
      <input id="nct-sc" type="range" min="0.5" max="1.5" step="0.05" style="width:100%">
      <label>${T.opacity}<span id="nct-op-v"></span></label>
      <input id="nct-op" type="range" min="0.1" max="1" step="0.05" style="width:100%">
      <label>${T.lang}</label>
      <select id="nct-lang" style="width:100%;margin-bottom:6px">
        <option value="auto">${T.auto}</option>
        <option value="ja">日本語</option>
        <option value="zh-CN">简体中文</option>
        <option value="zh-TW">繁體中文</option>
        <option value="en">English</option>
      </select>
      <button id="nct-reset" style="width:100%;margin-top:6px">${T.reset}</button>
      <div id="nct-stat" style="margin-top:8px;font-size:11px;color:#aaa"></div>`;
    panel.appendChild(body);
    document.body.appendChild(panel);

    const $ = (s) => panel.querySelector(s);
    const refresh = () => {
      $('#nct-mode').value = settings.mode;
      $('#nct-sc').value = settings.scale;
      $('#nct-op').value = settings.opacity;
      $('#nct-lang').value = settings.lang;
      $('#nct-sc-v').textContent = Math.round(settings.scale * 100) + '%';
      $('#nct-op-v').textContent = Math.round(settings.opacity * 100) + '%';
    };
    const update = (k, v) => { settings[k] = v; save(); refresh(); scanCanvases(); };

    $('#nct-mode').addEventListener('change', (e) => update('mode', e.target.value));
    $('#nct-sc').addEventListener('input', (e) => update('scale', +e.target.value));
    $('#nct-op').addEventListener('input', (e) => update('opacity', +e.target.value));
    $('#nct-lang').addEventListener('change', (e) => { settings.lang = e.target.value; save(); applyLang(); });
    // 初期化は表示設定のみ。言語設定は保持する
    $('#nct-reset').addEventListener('click', () => { settings = { ...DEFAULTS, lang: settings.lang }; save(); refresh(); scanCanvases(); });
    $('#nct-close').addEventListener('click', togglePanel);
    panel.addEventListener('keydown', (e) => e.stopPropagation());
    refresh();
  }

  function applyLang() {
    T = pickLang();
    if (fab) {
      fab.textContent = T.fab;
      fab.title = `${T.title} (Alt+C)`;
    }
    if (panel) {
      const wasOpen = panel.style.display !== 'none';
      clearInterval(statTimer);
      panel.remove();
      panel = null;
      if (wasOpen) togglePanel();
    }
  }

  function togglePanel() {
    if (!panel) buildPanel();
    reparentUI();
    const show = panel.style.display === 'none';
    panel.style.display = show ? 'block' : 'none';
    clearInterval(statTimer);
    if (show) {
      statTimer = setInterval(() => {
        panel.querySelector('#nct-stat').textContent = T.stat(stats.font, stats.sprite);
      }, 500);
    }
  }

  // キャプチャフェーズで捕捉し、プレーヤーより先にキーを処理する
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.code === 'KeyC') {
      e.preventDefault();
      e.stopImmediatePropagation();
      togglePanel();
    }
  }, true);

  let fab = null;
  function buildButton() {
    if (fab) return;
    fab = document.createElement('div');
    fab.textContent = T.fab;
    fab.title = `${T.title} (Alt+C)`;
    fab.style.cssText = `
      position: fixed; left: 12px; bottom: 12px; z-index: 2147483647;
      width: 34px; height: 34px; border-radius: 50%;
      background: #0080ff; color: #fff; font: bold 15px/34px sans-serif;
      border: 2px solid #fff; box-sizing: content-box;
      text-align: center; cursor: pointer; user-select: none;
      box-shadow: 0 2px 8px rgba(0,0,0,.4); opacity: .75; transition: opacity .2s;`;
    fab.addEventListener('mouseenter', () => (fab.style.opacity = '1'));
    fab.addEventListener('mouseleave', () => (fab.style.opacity = '.75'));
    fab.addEventListener('click', (e) => { e.stopPropagation(); togglePanel(); });
    document.body.appendChild(fab);
  }

  // 全画面中は全画面要素の内側しか表示されないため、ボタンとパネルをそこへ移す
  function reparentUI() {
    const host = document.fullscreenElement || document.body;
    for (const el of [fab, panel]) {
      if (el && el.parentElement !== host) host.appendChild(el);
    }
  }
  document.addEventListener('fullscreenchange', reparentUI);

  if (document.body) startObservers();
  else document.addEventListener('DOMContentLoaded', startObservers);
})();
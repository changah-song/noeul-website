/* Noeul — minimal vanilla JS: mobile nav, scroll state, lightbox, reveal.
   No dependencies. Everything degrades gracefully if JS is disabled. */
(function () {
  'use strict';

  /* ---------- sticky header hairline on scroll ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 4);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- mobile nav toggle ---------- */
  var toggle = document.querySelector('.nav__toggle');
  var menu = document.getElementById('mobile-menu');

  if (toggle && menu) {
    var closeMenu = function () {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    var openMenu = function () {
      menu.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      if (expanded) { closeMenu(); } else { openMenu(); }
    });

    // close when a link inside the menu is tapped
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) { closeMenu(); }
    });

    // ESC closes the menu and returns focus to the toggle
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  /* ---------- screenshot lightbox (optional, accessible) ---------- */
  var lightbox = document.getElementById('lightbox');
  if (lightbox) {
    var lbImg = lightbox.querySelector('img');
    var lbClose = lightbox.querySelector('.lightbox__close');
    var lastFocused = null;

    var openLightbox = function (src, alt) {
      lastFocused = document.activeElement;
      lbImg.setAttribute('src', src);
      lbImg.setAttribute('alt', alt || '');
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      lbClose.focus();
    };
    var closeLightbox = function () {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      lbImg.setAttribute('src', '');
      if (lastFocused) { lastFocused.focus(); }
    };

    document.querySelectorAll('[data-lightbox]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var img = trigger.querySelector('img');
        if (img) { openLightbox(img.getAttribute('src'), img.getAttribute('alt')); }
      });
    });

    lbClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) { closeLightbox(); } // backdrop click
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) { closeLightbox(); }
    });
  }

  /* ---------- gentle scroll reveal (respects reduced motion) ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealables = document.querySelectorAll('.reveal');
  if (!reduce && 'IntersectionObserver' in window && revealables.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- light / dark theme toggle ---------- */
  (function () {
    var root = document.documentElement;
    var toggles = document.querySelectorAll('.theme-toggle');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!toggles.length) { return; }

    function label(theme) {
      toggles.forEach(function (b) {
        b.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      });
      if (meta) { meta.setAttribute('content', theme === 'dark' ? '#15161a' : '#fbf9f8'); }
    }
    function set(theme) {
      root.setAttribute('data-theme', theme);
      try { localStorage.setItem('noeul-theme', theme); } catch (e) {}
      label(theme);
    }
    // sync labels with whatever the head script already applied
    label(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    toggles.forEach(function (b) {
      b.addEventListener('click', function () {
        set(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      });
    });
  })();

  /* ---------- interactive reader demo ---------- */
  (function () {
    var reader = document.getElementById('reader');
    if (!reader) { return; }

    var track = document.getElementById('reader-track');
    var viewport = document.getElementById('reader-viewport');
    var sheet = document.getElementById('sheet');
    var scrim = document.getElementById('sheet-scrim');
    var pctEl = document.getElementById('reader-pct');
    var fillEl = document.getElementById('reader-progress-fill');
    var focusBtn = reader.querySelector('.reader__focus-btn');
    var prevBtn = reader.querySelector('.reader__pageflip--prev');
    var nextBtn = reader.querySelector('.reader__pageflip--next');
    var tabs = document.querySelectorAll('.reader-tab');
    var guideItems = document.querySelectorAll('.demo-guide__item');
    var pages = track.querySelectorAll('.reader__page');
    var sentences = track.querySelectorAll('.rs');
    var beamPosEl = document.getElementById('beam-pos');
    var beamBtns = reader.querySelectorAll('.reader__beam-btn');
    var wordsBody = document.getElementById('wordsview-body');
    var wordsTabs = reader.querySelectorAll('.wordsview__tab');
    var hintEl = document.getElementById('demo-hint');

    var HINTS = {
      read: 'Tip: tap any <span class="demo-hint__word">underlined</span> word.',
      focus: 'Tip: swipe, tap the arrows, or tap a sentence to move.',
      words: 'Tip: save a suggestion — it joins your list.'
    };

    var ICON = {
      save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>',
      meaning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l1.6 3.8L17.5 9l-3.9 1.2L12 15l-1.6-4.8L6.5 9l3.9-1.2z"/><path d="M18 15l.8 1.9L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.9z"/></svg>',
      translate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 5h5.5c-.3 4.2-2 7.2-5.5 9"/><path d="M12 3.5v11.5M12 8.5h2.8"/><path d="M13.5 20.5l3.75-9 3.75 9M14.9 17.3h4.7"/></svg>'
    };

    var WORDS = {
      cheonjae: {
        hw: '천재', hanja: '天才', roman: 'cheonjae', pos: 'NOUN', def: 'genius',
        aiDef: 'genius; talented person',
        ai: 'Here 천재 means "genius" or "a person of exceptional talent." In this line it refers to a brilliant person whose potential has been stifled — a "genius who has become taxidermied," like a preserved specimen. The word keeps its ordinary sense, but the poetic context stresses what is lost when such talent is no longer alive.',
        sentence: '‘박제(剝製)가 되어 버린 천재’를 아시오?',
        trans: '"Do you know of a genius who has become a stuffed specimen?"',
        related: [
          { k: '천재적', h: '天才的', m: 'genius (adj.)' },
          { k: '천재지변', h: '天災地變', m: 'natural disaster' },
          { k: '천재성', h: '天才性', m: 'giftedness' }
        ],
        roots: [ { c: '天', m: '하늘 천', e: 'sky' }, { c: '才', m: '재주 재', e: 'talent' } ]
      },
      yeonae: {
        hw: '연애', hanja: '戀愛', roman: 'yeonae', pos: 'NOUN', def: 'love; romance',
        aiDef: 'romantic love; dating',
        ai: 'In this line 연애 means romantic love. The narrator remarks that in his listless state even romance strikes him as amusing — a detached, ironic pleasure rather than genuine feeling.',
        sentence: '이런 때 연애까지가 유쾌하오.',
        trans: 'At times like this, even romance feels pleasant.',
        related: [
          { k: '연애편지', h: '戀愛便紙', m: 'love letter' },
          { k: '연애결혼', h: '戀愛結婚', m: 'love marriage' }
        ],
        roots: [ { c: '戀', m: '그리워할 련', e: 'to long for' }, { c: '愛', m: '사랑 애', e: 'love' } ]
      },
      bakje: {
        hw: '박제', hanja: '剝製', roman: 'bakje', pos: 'NOUN', def: 'taxidermy; a stuffed specimen',
        aiDef: 'a stuffed, preserved specimen',
        ai: 'In this famous opening, 박제 (a taxidermied animal) is a metaphor: a once-living talent preserved but lifeless — brilliance that has been hollowed out and put on display.',
        sentence: '‘박제(剝製)가 되어 버린 천재’를 아시오?',
        trans: '"Do you know of a genius who has become a stuffed specimen?"',
        related: [],
        roots: [ { c: '剝', m: '벗길 박', e: 'to strip' }, { c: '製', m: '지을 제', e: 'to make' } ]
      },
      yukwae: {
        hw: '유쾌', hanja: '愉快', roman: 'yukwae', pos: 'ADJ', def: 'cheerful; pleasant',
        aiDef: 'cheerful; in good spirits',
        ai: 'Here 유쾌하오 is an old, formal way of saying "I feel good / cheerful." The archaic -오 ending gives the narrator his distinctive dry, self-satisfied voice.',
        sentence: '나는 유쾌하오.',
        trans: 'I feel cheerful.',
        related: [],
        roots: [ { c: '愉', m: '즐거울 유', e: 'joyful' }, { c: '快', m: '쾌할 쾌', e: 'pleased' } ]
      },
      baekji: {
        hw: '백지', hanja: '白紙', roman: 'baekji', pos: 'NOUN', def: 'blank paper',
        aiDef: 'a blank sheet of paper',
        ai: 'Literally "white paper." The narrator means his mind goes clear and blank — a fresh page — whenever the nicotine takes effect.',
        sentence: '머릿속에 으레 백지가 준비되는 법이오.',
        trans: 'A blank sheet is invariably readied in my mind.',
        related: [],
        roots: [ { c: '白', m: '흰 백', e: 'white' }, { c: '紙', m: '종이 지', e: 'paper' } ]
      }
    };

    var OPENING = {
      k: '‘박제(剝製)가 되어 버린 천재’를 아시오? 나는 유쾌하오.',
      e: '"Do you know of a genius who has become a stuffed specimen?" As for me — I feel quite cheerful.'
    };

    // Suggested words: the model flags words it's unsure the reader knows AND
    // that the book won't teach by repetition. Badges mirror the app's reasons.
    var CANDIDATES = [
      {
        id: 'eunhwa', hw: '은화', hanja: '銀貨', gloss: 'silver coin',
        reason: 'Rare in this book',
        sentence: '육신이 흐느적흐느적하도록 피로했을 때만 정신이 은화처럼 맑소.'
      },
      {
        id: 'poseok', hw: '포석', hanja: '布石', gloss: 'opening moves; groundwork',
        reason: 'Worth a closer look',
        sentence: '그 위에다 나는 위트와 파라독스를 바둑 포석처럼 늘어 놓소.'
      },
      {
        id: 'hoetbae', hw: '횟배', hanja: '', gloss: 'roundworm colic; bellyache',
        reason: 'New here',
        sentence: '니코틴이 내 횟배 앓는 뱃속으로 스미면 머릿속에 으레 백지가 준비되는 법이오.'
      }
    ];

    var current = null;      // current word id
    var page = 0;
    var mode = 'read';
    var saved = { yeonae: true };          // words saved from the lookup sheet
    var savedList = ['yeonae'];            // newest-first ids (WORDS or CANDIDATES)
    var candSaved = {};                    // suggestions saved from the panel
    var wtab = 'saved';
    var beam = 0;
    var aiToken = 0;

    /* ---- rendering ---- */
    function head(w) {
      return '<div class="sheet__head"><span class="sheet__hw">' + w.hw + '</span>' +
        (w.hanja ? '<span class="sheet__hanja">' + w.hanja + '</span>' : '') +
        '<span class="sheet__roman">' + w.roman + '</span></div>';
    }
    function actions(active, id) {
      var isSaved = !!saved[id];
      return '<div class="sheet__actions">' +
        '<button class="sheet__btn' + (isSaved ? ' is-active' : '') + '" data-act="save">' + ICON.save + (isSaved ? ' SAVED' : ' SAVE') + '</button>' +
        '<button class="sheet__btn' + (active === 'meaning' ? ' is-active' : '') + '" data-act="meaning">' + ICON.meaning + ' MEANING</button>' +
        '<button class="sheet__btn' + (active === 'translate' ? ' is-active' : '') + '" data-act="translate">' + ICON.translate + ' TRANSLATE</button>' +
        '</div>';
    }
    function hint(w, target, label) {
      if (target === 'roots' && !(w.roots && w.roots.length)) { return ''; }
      return '<button class="sheet__hint" data-act="' + target + '">' + label + '</button>';
    }

    function renderDefine(id) {
      var w = WORDS[id];
      sheet.innerHTML = '<div class="sheet__handle" data-act="close"></div>' +
        hint(w, 'roots', '▲ Slide up for roots') +
        head(w) +
        '<div class="sheet__defline"><span class="sheet__pos">' + w.pos + '</span><span class="sheet__def">' + w.def + '</span></div>' +
        actions('', id);
    }
    function renderRoots(id) {
      var w = WORDS[id];
      var related = w.related.length ? '<div class="sheet__related">' + w.related.map(function (r) {
        return '<div class="sheet__related-item"><span class="k">' + r.k + '</span><span class="h">' + r.h + '</span><span class="m">' + r.m + '</span><button class="sheet__add" aria-label="Add ' + r.k + '">+</button></div>';
      }).join('') + '</div>' : '';
      var roots = '<div class="sheet__roots">' + w.roots.map(function (c) {
        return '<div class="sheet__root"><span class="sheet__root-glyph">' + c.c + '</span><span><span class="rm">' + c.m + '</span><br><span class="re">' + c.e + '</span></span></div>';
      }).join('') + '</div>';
      sheet.innerHTML = '<div class="sheet__handle" data-act="close"></div>' +
        hint(w, 'define', '▼ Slide down') +
        head(w) +
        '<div class="sheet__defline"><span class="sheet__pos">' + w.pos + '</span><span class="sheet__def">' + w.def + '</span></div>' +
        related +
        '<p class="sheet__label">Root characters</p>' + roots +
        actions('', id);
    }
    function renderAi(id) {
      var w = WORDS[id];
      sheet.innerHTML = '<div class="sheet__handle" data-act="close"></div>' +
        hint(w, 'roots', '▲ Slide up for roots') +
        head(w) +
        '<div class="sheet__defline"><span class="sheet__def sheet__def--big">' + (w.aiDef || w.def) + '</span></div>' +
        '<div class="sheet__divider"></div>' +
        '<p class="sheet__label">In this sentence</p>' +
        '<div class="sheet__ai-slot"><div class="sheet__loading"><span></span><span></span><span></span></div></div>' +
        actions('meaning', id);
      var slot = sheet.querySelector('.sheet__ai-slot');
      var token = ++aiToken;
      setTimeout(function () {
        if (token === aiToken && slot) { slot.innerHTML = '<p class="sheet__ai">' + w.ai + '</p>'; }
      }, 720);
    }
    function renderTranslate(id) {
      var w = WORDS[id];
      sheet.innerHTML = '<div class="sheet__handle" data-act="close"></div>' +
        head(w) +
        '<div class="sheet__divider"></div>' +
        '<p class="sheet__label">Sentence</p>' +
        '<p class="sheet__ai" style="font-family:var(--font-kr)">' + w.sentence + '</p>' +
        '<p class="sheet__label" style="margin-top:12px">Translation</p>' +
        '<p class="sheet__ai">' + w.trans + '</p>' +
        actions('translate', id);
    }
    var VIEWS = { define: renderDefine, roots: renderRoots, ai: renderAi, translate: renderTranslate };

    /* ---- sheet open / close ---- */
    function openSheet() {
      sheet.classList.add('is-open');
      sheet.setAttribute('aria-hidden', 'false');
      scrim.hidden = false;
    }
    function closeSheet() {
      sheet.classList.remove('is-open');
      sheet.setAttribute('aria-hidden', 'true');
      scrim.hidden = true;
      current = null;
      highlight(null);
    }
    function highlight(id) {
      track.querySelectorAll('.rw').forEach(function (b) {
        b.classList.toggle('is-active', id != null && b.getAttribute('data-word') === id);
      });
    }
    function openWord(id, view) {
      if (!WORDS[id]) { return; }
      current = id;
      (VIEWS[view] || renderDefine)(id);
      highlight(id);
      openSheet();
    }
    function openSentence() {
      current = null;
      highlight(null);
      sheet.innerHTML = '<div class="sheet__handle" data-act="close"></div>' +
        '<p class="sheet__label">Sentence</p>' +
        '<p class="sheet__ai" style="font-family:var(--font-kr);font-size:15px">' + OPENING.k + '</p>' +
        '<div class="sheet__divider"></div>' +
        '<p class="sheet__label">Translation</p>' +
        '<p class="sheet__ai">' + OPENING.e + '</p>';
      openSheet();
    }

    /* ---- paging ---- */
    function setPage(n) {
      page = Math.max(0, Math.min(pages.length - 1, n));
      track.style.transform = 'translateX(' + (-page * 100) + '%)';
      var pct = [4, 9][page] || 4;
      if (pctEl) { pctEl.textContent = pct + '%'; }
      if (fillEl) { fillEl.style.width = pct + '%'; }
      if (prevBtn) { prevBtn.hidden = page === 0; }
      if (nextBtn) { nextBtn.hidden = page === pages.length - 1; }
    }

    /* ---- focus mode: the sentence beam ---- */
    function pageIndexOf(i) {
      var pg = sentences[i] && sentences[i].closest('.reader__page');
      return Array.prototype.indexOf.call(pages, pg);
    }
    function firstSentenceOfPage(p) {
      for (var i = 0; i < sentences.length; i++) {
        if (pageIndexOf(i) === p) { return i; }
      }
      return 0;
    }
    function setBeam(i) {
      beam = Math.max(0, Math.min(sentences.length - 1, i));
      sentences.forEach(function (s, idx) { s.classList.toggle('is-beam', idx === beam); });
      if (beamPosEl) { beamPosEl.textContent = (beam + 1) + ' / ' + sentences.length; }
      positionBeam();
    }
    // Keep the beamed sentence in the lower half of the screen (one-hand reach):
    // scroll the continuous text so the sentence sits ~55% down the viewport.
    function positionBeam(instant) {
      var s = sentences[beam];
      if (!s) { return; }
      var target = Math.max(0, s.offsetTop - viewport.clientHeight * 0.55);
      viewport.scrollTo({ top: target, behavior: instant ? 'instant' : 'smooth' });
    }
    function clearBeam() {
      sentences.forEach(function (s) { s.classList.remove('is-beam'); });
    }

    /* ---- your-words panel: saved + suggested ---- */
    function savedEntries() {
      return savedList.map(function (id) {
        if (WORDS[id]) {
          var w = WORDS[id];
          return { hw: w.hw, hanja: w.hanja, gloss: w.def };
        }
        var c = null;
        CANDIDATES.forEach(function (x) { if (x.id === id) { c = x; } });
        return c ? { hw: c.hw, hanja: c.hanja, gloss: c.gloss } : null;
      }).filter(Boolean);
    }
    function savedRowHtml(e) {
      return '<div class="wv-row"><div class="wv-row__top"><span class="k">' + e.hw + '</span>' +
        (e.hanja ? '<span class="h">' + e.hanja + '</span>' : '') +
        '<span class="m">' + e.gloss + '</span></div>' +
        '<div class="src">from 날개</div></div>';
    }
    function candCardHtml(c) {
      var isSaved = !!candSaved[c.id];
      var idx = c.sentence.indexOf(c.hw);
      var sent = idx === -1 ? c.sentence
        : c.sentence.slice(0, idx) + '<b>' + c.hw + '</b>' + c.sentence.slice(idx + c.hw.length);
      return '<div class="wv-card"><div class="wv-card__top"><span class="k">' + c.hw + '</span>' +
        (c.hanja ? '<span class="h">' + c.hanja + '</span>' : '') +
        '<span class="wv-badge">' + c.reason + '</span></div>' +
        '<div class="m">' + c.gloss + '</div>' +
        '<p class="wv-card__sentence">' + sent + '</p>' +
        '<button class="wv-card__save' + (isSaved ? ' is-saved' : '') + '" type="button" data-cand="' + c.id + '"' +
        (isSaved ? ' disabled' : '') + '>' + (isSaved ? '✓ SAVED' : 'SAVE') + '</button></div>';
    }
    function renderWords() {
      wordsTabs.forEach(function (t) {
        var on = t.getAttribute('data-wtab') === wtab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (!wordsBody) { return; }
      if (wtab === 'saved') {
        var entries = savedEntries();
        wordsBody.innerHTML = entries.length
          ? entries.map(savedRowHtml).join('') +
            '<p class="wv-note">Words you save while reading land here, with the book they came from.</p>'
          : '<p class="wv-note">Nothing saved yet — tap a word in the reader and hit SAVE.</p>';
      } else {
        wordsBody.innerHTML =
          '<p class="wv-note">Picked from this book, for you: words the app isn\'t sure you know — and that the story is too sparing with to teach on its own. The list refreshes daily.</p>' +
          CANDIDATES.map(candCardHtml).join('');
      }
    }

    /* ---- modes ---- */
    var wordsBtn = reader.querySelector('.reader__words-btn');
    function setMode(m) {
      var prev = mode;
      mode = m;
      reader.setAttribute('data-mode', m);
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-mode') === m;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (focusBtn) { focusBtn.setAttribute('aria-pressed', m === 'focus' ? 'true' : 'false'); }
      if (wordsBtn) { wordsBtn.setAttribute('aria-pressed', m === 'words' ? 'true' : 'false'); }
      if (m === 'focus') {
        if (prev !== 'focus') { setBeam(firstSentenceOfPage(page)); positionBeam(true); }
      } else {
        if (prev === 'focus') {
          // hand the paged reader the page the beam ended on
          var p = pageIndexOf(beam);
          if (p !== -1) { page = p; }
          viewport.scrollTop = 0;
        }
        clearBeam();
      }
      if (m === 'words') { renderWords(); }
      if (hintEl && HINTS[m]) { hintEl.innerHTML = HINTS[m]; }
      setPage(page);
      closeSheet();
    }

    /* ---- events ---- */
    track.addEventListener('click', function (e) {
      var w = e.target.closest('.rw');
      var s = e.target.closest('.rs');
      if (w) {
        e.preventDefault();
        if (mode === 'focus' && s) { setBeam(Array.prototype.indexOf.call(sentences, s)); }
        openWord(w.getAttribute('data-word'), 'define');
        return;
      }
      if (mode === 'focus' && s) {
        closeSheet();
        setBeam(Array.prototype.indexOf.call(sentences, s));
      }
    });

    beamBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        closeSheet();
        setBeam(beam + Number(b.getAttribute('data-beam')));
      });
    });

    wordsTabs.forEach(function (t) {
      t.addEventListener('click', function () {
        wtab = t.getAttribute('data-wtab');
        renderWords();
      });
    });
    if (wordsBody) {
      wordsBody.addEventListener('click', function (e) {
        var b = e.target.closest('[data-cand]');
        if (!b) { return; }
        var id = b.getAttribute('data-cand');
        if (candSaved[id]) { return; }
        candSaved[id] = true;
        savedList.unshift(id);
        renderWords();
      });
    }

    sheet.addEventListener('click', function (e) {
      var el = e.target.closest('[data-act]');
      if (!el) { return; }
      var act = el.getAttribute('data-act');
      if (act === 'close') { closeSheet(); return; }
      if (act === 'save') {
        if (current) {
          saved[current] = !saved[current];
          var pos = savedList.indexOf(current);
          if (saved[current] && pos === -1) { savedList.unshift(current); }
          if (!saved[current] && pos !== -1) { savedList.splice(pos, 1); }
          VIEWS[currentView()](current);
        }
        return;
      }
      if (!current) { return; }
      if (act === 'meaning') { renderAi(current); }
      else if (act === 'translate') { renderTranslate(current); }
      else if (act === 'roots') { renderRoots(current); }
      else if (act === 'define') { renderDefine(current); }
    });
    // remember which view is showing so SAVE re-renders in place
    function currentView() {
      if (sheet.querySelector('.sheet__ai-slot')) { return 'ai'; }
      if (sheet.querySelector('.sheet__roots')) { return 'roots'; }
      if (sheet.querySelector('.sheet__actions .is-active[data-act="translate"]')) { return 'translate'; }
      return 'define';
    }

    scrim.addEventListener('click', closeSheet);
    if (prevBtn) { prevBtn.addEventListener('click', function () { closeSheet(); setPage(page - 1); }); }
    if (nextBtn) { nextBtn.addEventListener('click', function () { closeSheet(); setPage(page + 1); }); }
    if (focusBtn) { focusBtn.addEventListener('click', function () { setMode(mode === 'focus' ? 'read' : 'focus'); }); }
    if (wordsBtn) { wordsBtn.addEventListener('click', function () { setMode(mode === 'words' ? 'read' : 'words'); }); }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () { setMode(t.getAttribute('data-mode')); });
    });

    /* ---- pointer: swipe to page (or beam), long-press to translate ---- */
    var sx = 0, sy = 0, st = 0, onWord = false, moved = false, lp = null;
    viewport.addEventListener('pointerdown', function (e) {
      sx = e.clientX; sy = e.clientY; st = Date.now(); moved = false;
      onWord = !!e.target.closest('.rw');
      clearTimeout(lp);
      if (!onWord && mode !== 'words') {
        lp = setTimeout(function () { if (!moved) { moved = true; openSentence(); } }, 500);
      }
    });
    viewport.addEventListener('pointermove', function (e) {
      if (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10) { moved = true; clearTimeout(lp); }
    });
    viewport.addEventListener('pointerup', function (e) {
      clearTimeout(lp);
      if (onWord || mode === 'words') { return; }
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) {
        closeSheet();
        if (mode === 'focus') { setBeam(dx < 0 ? beam + 1 : beam - 1); }
        else { setPage(dx < 0 ? page + 1 : page - 1); }
      }
    });
    viewport.addEventListener('pointercancel', function () { clearTimeout(lp); });

    /* ---- side guide triggers ---- */
    var narrow = window.matchMedia('(max-width: 899px)');
    function flashGuide(item) {
      guideItems.forEach(function (g) { g.classList.remove('is-active'); });
      item.classList.add('is-active');
      if (narrow.matches) { reader.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }
    guideItems.forEach(function (item) {
      var run = function () {
        var demo = item.getAttribute('data-demo');
        if (demo === 'focus') { setMode(mode === 'focus' ? 'read' : 'focus'); flashGuide(item); return; }
        if (demo === 'words') { setMode('words'); flashGuide(item); return; }
        if (mode !== 'read') { setMode('read'); }
        if (demo === 'define') { openWord('cheonjae', 'define'); }
        else if (demo === 'roots') { openWord('cheonjae', 'roots'); }
        else if (demo === 'ai') { openWord('cheonjae', 'ai'); }
        else if (demo === 'translate') { openSentence(); }
        flashGuide(item);
      };
      item.addEventListener('click', run);
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); }
      });
    });

    /* init */
    setMode('read');
    setPage(0);
  })();
})();

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

  /* ---------- headline: rotate through the languages Noeul teaches ---------- */
  (function () {
    var cycle = document.querySelector('.lang-cycle');
    if (!cycle) { return; }
    var langs = cycle.getAttribute('data-langs').split(',').map(function (l) { return l.trim(); }).filter(Boolean);
    var title = cycle.closest('h1');
    if (title) {
      var list = langs.length > 1 ? langs.slice(0, -1).join(', ') + ' and ' + langs[langs.length - 1] : langs[0];
      title.setAttribute('aria-label', 'Learn ' + list + ' the smart way.');
    }
    if (langs.length < 2) { return; }

    var sizer = cycle.querySelector('.lang-cycle__sizer');
    cycle.querySelectorAll('.lang-cycle__word').forEach(function (w) { w.remove(); });
    var words = langs.map(function (l) {
      var w = document.createElement('span');
      w.className = 'lang-cycle__word';
      w.textContent = l;
      cycle.appendChild(w);
      return w;
    });
    var i = 0;

    function show(n) {
      var prev = i;
      i = n % words.length;
      var next = (i + 1) % words.length;
      words.forEach(function (w, k) {
        w.classList.toggle('is-front', k === i);
        w.classList.toggle('is-next', k === next);
        // with two languages the outgoing word is also the next one: it drops back behind instead
        w.classList.toggle('is-leaving', k === prev && k !== i && k !== next);
      });
      // the new front word rises up and over the old one, like turning a flashcard
      var front = words[i];
      front.classList.remove('is-entering');
      if (prev !== i) { void front.offsetWidth; front.classList.add('is-entering'); }
      sizer.textContent = langs[i];
      cycle.style.width = words[i].offsetWidth + 'px';
    }
    show(0);
    // re-measure once the display font has loaded, and on resize
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { show(i); }); }
    window.addEventListener('resize', function () { cycle.style.width = words[i].offsetWidth + 'px'; });

    var timer = null;
    function start() { if (!timer) { timer = setInterval(function () { show(i + 1); }, 2800); } }
    function stop() { clearInterval(timer); timer = null; }
    document.addEventListener('visibilitychange', function () { if (document.hidden) { stop(); } else { start(); } });
    start();
  })();

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
    var pctEl = document.getElementById('reader-pct');
    var fillEl = document.getElementById('reader-progress-fill');
    var badgeEl = document.getElementById('words-badge');
    var focusBtn = reader.querySelector('.reader__focus-btn');
    var listenBtn = reader.querySelector('.reader__listen-btn');
    var wordsBtn = reader.querySelector('.reader__words-btn');
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
    var paneEl = document.getElementById('transpane');
    var listenbar = document.getElementById('listenbar');
    var captionEl = document.getElementById('listen-caption');
    var speedEl = document.getElementById('listen-speed');

    var HINTS = {
      read: 'Tip: tap any <span class="demo-hint__word">coloured</span> word, tap it again to save it, or press and hold a sentence.',
      focus: 'Tip: swipe, tap the arrows, or tap a sentence to move.',
      listen: 'Tip: press play. Turn on translations to hear each line in English too.',
      words: 'Tip: save a suggestion — it joins your list.'
    };

    var ICON = {
      save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M7 3.5h10a1 1 0 0 1 1 1v16l-6-3.6-6 3.6v-16a1 1 0 0 1 1-1z"/></svg>',
      saved: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3.5h10a1 1 0 0 1 1 1v16l-6-3.6-6 3.6v-16a1 1 0 0 1 1-1z"/></svg>',
      meaning: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25z"/></svg>',
      translate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 5h5.5c-.3 4.2-2 7.2-5.5 9"/><path d="M12 3.5v11.5M12 8.5h2.8"/><path d="M13.5 20.5l3.75-9 3.75 9M14.9 17.3h4.7"/></svg>'
    };

    var WORDS = {
      cheonjae: {
        hw: '천재', hanja: '天才', roman: 'cheonjae', pos: 'Noun', def: 'genius', wt: 'genius; prodigy',
        ai: 'Here 천재 is a brilliant person whose gift has gone still — a "genius turned taxidermy," preserved but no longer alive.',
        related: [
          { k: '천재적', h: '天才的', m: 'of genius', known: true },
          { k: '천국', h: '天國', m: 'heaven', known: true },
          { k: '재능', h: '才能', m: 'talent' }
        ],
        roots: [ { c: '天', m: '하늘 천', e: 'sky, heaven' }, { c: '才', m: '재주 재', e: 'talent' } ]
      },
      yeonae: {
        hw: '연애', hanja: '戀愛', roman: 'yeonae', pos: 'Noun', def: 'love; romance', wt: 'dating; a romance',
        ai: 'Romantic love. The narrator is so listless that even romance only amuses him — an ironic, detached pleasure.',
        related: [ { k: '사랑', h: '', m: 'love', known: true }, { k: '애정', h: '愛情', m: 'affection' } ],
        roots: [ { c: '戀', m: '그리워할 련', e: 'to long for' }, { c: '愛', m: '사랑 애', e: 'love' } ]
      },
      bakje: {
        hw: '박제', hanja: '剝製', roman: 'bakje', pos: 'Noun', def: 'taxidermy; a stuffed specimen', wt: 'stuffed animal',
        ai: 'A metaphor in this famous opening: talent that was once alive, now preserved and hollow — kept for display.',
        related: [ { k: '제품', h: '製品', m: 'product', known: true }, { k: '제작', h: '製作', m: 'production' } ],
        roots: [ { c: '剝', m: '벗길 박', e: 'to strip' }, { c: '製', m: '지을 제', e: 'to make' } ]
      },
      yukwae: {
        hw: '유쾌', hanja: '愉快', roman: 'yukwae', pos: 'Noun', def: 'cheerfulness; pleasantness', wt: 'pleasant',
        ai: '유쾌하오 is an old, formal "I feel cheerful." The archaic -오 ending gives the narrator his dry, self-satisfied voice.',
        related: [ { k: '불쾌', h: '不快', m: 'displeasure' }, { k: '상쾌', h: '爽快', m: 'refreshing', known: true } ],
        roots: [ { c: '愉', m: '즐거울 유', e: 'joyful' }, { c: '快', m: '쾌할 쾌', e: 'pleased, quick' } ]
      },
      baekji: {
        hw: '백지', hanja: '白紙', roman: 'baekji', pos: 'Noun', def: 'blank paper', wt: 'a blank sheet',
        ai: 'Literally "white paper": his mind goes clear and blank — a fresh page — whenever the nicotine takes hold.',
        related: [ { k: '종이', h: '', m: 'paper', known: true }, { k: '백색', h: '白色', m: 'white' } ],
        roots: [ { c: '白', m: '흰 백', e: 'white' }, { c: '紙', m: '종이 지', e: 'paper' } ]
      }
    };

    // whole-sentence translations, in reading order (press-and-hold, Listen captions)
    var TRANS = [
      '"Do you know the genius who became a stuffed specimen?"',
      'I feel cheerful.',
      'At times like this, even romance is cheerful.',
      'Only when my body is so tired it goes limp is my mind as clear as a silver coin.',
      'When nicotine seeps into my worm-sick belly, a blank sheet is always laid out in my head.',
      'On it I set out wit and paradox like the opening stones of a game of baduk.',
      'It is a terrible disease of common sense.',
      'I also plan a life with a woman.',
      'Someone who has glanced at the height of an intellect grown awkward even at the art of love — a kind of mental drifter, so to speak.'
    ];

    // Suggested words: ones the app isn't sure you know AND that the book won't teach by repetition.
    var CANDIDATES = [
      { id: 'eunhwa', hw: '은화', hanja: '銀貨', gloss: 'silver coin', reason: 'Rare in this book',
        sentence: '육신이 흐느적흐느적하도록 피로했을 때만 정신이 은화처럼 맑소.' },
      { id: 'poseok', hw: '포석', hanja: '布石', gloss: 'opening moves; groundwork', reason: 'Worth a closer look',
        sentence: '그 위에다 나는 위트와 파라독스를 바둑 포석처럼 늘어 놓소.' },
      { id: 'hoetbae', hw: '횟배', hanja: '', gloss: 'roundworm colic; bellyache', reason: 'New here',
        sentence: '니코틴이 내 횟배 앓는 뱃속으로 스미면 머릿속에 으레 백지가 준비되는 법이오.' }
    ];
    var LEARNED_START = [ { hw: '정신', hanja: '精神', gloss: 'mind; spirit' } ];

    var current = null;      // current word id
    var view = 'define';     // define | roots | ai | translate
    var rootOn = -1;         // highlighted hanja in the roots view
    var page = 0;
    var mode = 'read';
    var savedList = ['yeonae'];            // newest-first ids (WORDS or CANDIDATES)
    var fade = { yeonae: 2 };              // saved word -> fade step (0 solid … 6 learned)
    var learned = LEARNED_START.slice();
    var candSaved = {};
    var wtab = 'saved';
    var beam = 0;
    var aiToken = 0;

    function isSaved(id) { return savedList.indexOf(id) !== -1; }

    /* ---- marks in the text: saved words are grey blocks that fade ---- */
    function paintMarks() {
      track.querySelectorAll('.rw').forEach(function (b) {
        var id = b.getAttribute('data-word');
        var on = isSaved(id);
        var step = fade[id] || 0;
        b.classList.toggle('is-saved', on && step === 0);
        if (on && step > 0) { b.setAttribute('data-fade', step); } else { b.removeAttribute('data-fade'); }
      });
      if (badgeEl) {
        badgeEl.textContent = savedList.length;
        badgeEl.hidden = savedList.length === 0;
      }
    }
    // each page you see a saved word on (without looking it up) takes it one step closer to Learned
    function fadeOnPage(p) {
      var seen = {};
      pages[p].querySelectorAll('.rw').forEach(function (b) { seen[b.getAttribute('data-word')] = true; });
      savedList.slice().forEach(function (id) {
        if (!seen[id] || !WORDS[id]) { return; }
        fade[id] = (fade[id] || 0) + 1;
        if (fade[id] >= 6) {
          savedList.splice(savedList.indexOf(id), 1);
          delete fade[id];
          learned.unshift({ hw: WORDS[id].hw, hanja: WORDS[id].hanja, gloss: WORDS[id].def });
        }
      });
      paintMarks();
    }

    /* ---- sheet rendering ---- */
    function head(w) {
      var hanja = '';
      if (w.hanja) {
        hanja = '<span class="sheet__hanja">' + w.hanja.split('').map(function (c, i) {
          return '<button type="button" data-act="char" data-i="' + i + '" class="' + (view === 'roots' && rootOn === i ? 'is-on' : '') +
            '" aria-label="Look up ' + c + '">' + c + '</button>';
        }).join('') + '</span>';
      }
      var saved = isSaved(current);
      return '<button class="sheet__handle" type="button" data-act="handle" aria-label="' + (view === 'roots' ? 'Hide roots' : 'Show roots') + '"></button>' +
        '<button class="sheet__save" type="button" data-act="save" aria-pressed="' + (saved ? 'true' : 'false') + '" aria-label="' + (saved ? 'Remove from saved' : 'Save word') + '">' + (saved ? ICON.saved : ICON.save) + '</button>' +
        '<div class="sheet__head"><span class="sheet__hw">' + w.hw + '</span>' + hanja + '</div>' +
        '<span class="sheet__roman">' + w.roman + '</span>' +
        '<div class="sheet__defline"><span class="sheet__pos">' + w.pos + '</span><span class="sheet__def">' + w.def + '</span></div>';
    }
    function actions() {
      return '<div class="sheet__actions">' +
        '<button class="sheet__btn' + (view === 'ai' ? ' is-active' : '') + '" data-act="meaning">' + ICON.meaning + ' What it means here<sup>AI</sup></button>' +
        '</div>';
    }
    function render() {
      var w = WORDS[current];
      if (!w) { return; }
      var body = '';
      if (view === 'ai') {
        body = '<div class="sheet__divider"></div><p class="sheet__label">In this sentence</p>' +
          '<div class="sheet__ai-slot"><div class="sheet__loading"><span></span><span></span><span></span></div></div>';
      } else if (view === 'roots') {
        body = '<div class="sheet__divider"></div><p class="sheet__label">Root characters</p><div class="sheet__roots">' +
          w.roots.map(function (c, i) {
            return '<div class="sheet__root' + (rootOn === i ? ' is-on' : '') + '"><span class="sheet__root-glyph">' + c.c +
              '</span><span><span class="rm">' + c.m + '</span><br><span class="re">' + c.e + '</span></span></div>';
          }).join('') + '</div>' +
          (w.related.length ? '<p class="sheet__label" style="margin-top:14px">Related words</p>' + w.related.map(function (r) {
            return '<div class="sheet__related-item"><span class="k">' + r.k + '</span>' + (r.h ? '<span class="h">' + r.h + '</span>' : '') +
              '<span class="m">' + r.m + '</span>' + (r.known ? '<span class="known">Known</span>' : '') + '</div>';
          }).join('') : '');
      }
      sheet.innerHTML = head(w) + body + actions();
      if (view === 'ai') {
        var slot = sheet.querySelector('.sheet__ai-slot');
        var token = ++aiToken;
        setTimeout(function () {
          if (token === aiToken && slot) { slot.innerHTML = '<p class="sheet__ai">' + w.ai + '</p>'; }
        }, 650);
      }
    }

    /* ---- panel open / close; the sentence translation rides in a pane across the top ---- */
    function showPane(idx) {
      sentences.forEach(function (s, k) { s.classList.toggle('is-selected', k === idx); });
      reader.classList.add('has-word');
      if (paneEl) { paneEl.textContent = TRANS[idx] || ''; paneEl.classList.toggle('is-on', !!TRANS[idx]); }
    }
    function openSheet() {
      sheet.classList.add('is-open');
      sheet.setAttribute('aria-hidden', 'false');
    }
    function closeSheet() {
      sheet.classList.remove('is-open');
      sheet.setAttribute('aria-hidden', 'true');
      current = null;
      highlight(null);
      reader.classList.remove('has-word');
      if (paneEl) { paneEl.classList.remove('is-on'); }
      track.querySelectorAll('.rs.is-selected').forEach(function (s) { s.classList.remove('is-selected'); });
    }
    function highlight(btn) {
      track.querySelectorAll('.rw').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
    }
    function toggleSave(id) {
      var pos = savedList.indexOf(id);
      if (pos === -1) { savedList.unshift(id); fade[id] = 0; }
      else { savedList.splice(pos, 1); delete fade[id]; }
      paintMarks();
    }
    function openWord(id, v, btn) {
      if (!WORDS[id]) { return; }
      btn = btn || track.querySelector('.rw[data-word="' + id + '"]');
      current = id; view = v || 'define'; rootOn = view === 'roots' ? 0 : -1;
      render();
      highlight(btn);
      if (mode === 'read') { showPane(Array.prototype.indexOf.call(sentences, btn.closest('.rs'))); }
      openSheet();
    }
    function openSentence(idx) {
      closeSheet();
      showPane(idx);
    }

    /* ---- paging ---- */
    function setPage(n) {
      var next = Math.max(0, Math.min(pages.length - 1, n));
      var changed = next !== page;
      page = next;
      track.style.transform = 'translateX(' + (-page * 100) + '%)';
      var pct = [4, 9][page] || 4;
      if (pctEl) { pctEl.textContent = pct + '%'; }
      if (fillEl) { fillEl.style.width = pct + '%'; }
      if (prevBtn) { prevBtn.hidden = page === 0; }
      if (nextBtn) { nextBtn.hidden = page === pages.length - 1; }
      if (changed) { fadeOnPage(page); if (mode === 'words') { renderWords(); } }
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
      if (beamPosEl) { beamPosEl.textContent = 'Sentence ' + (beam + 1) + ' of ' + sentences.length; }
      if (mode === 'focus') { positionBeam(); }
      if (mode === 'listen') {
        var p = pageIndexOf(beam);
        if (p !== -1 && p !== page) { setPage(p); }
        showCaption();
      }
    }
    // keep the beamed sentence in the lower half of the screen (one-hand reach)
    function positionBeam(instant) {
      var s = sentences[beam];
      if (!s) { return; }
      var target = Math.max(0, s.offsetTop - viewport.clientHeight * 0.55);
      viewport.scrollTo({ top: target, behavior: instant ? 'instant' : 'smooth' });
    }
    function clearBeam() {
      sentences.forEach(function (s) { s.classList.remove('is-beam'); });
    }

    /* ---- listen mode: the phone's voice reads sentence by sentence ---- */
    var playing = false, speed = 1, withTrans = false, listenTimer = null, listenToken = 0;
    var SPEEDS = [0.8, 1, 1.2, 1.5];
    var synth = window.speechSynthesis;
    var koVoice = null;
    function pickVoice() {
      if (!synth) { return; }
      var v = synth.getVoices();
      for (var i = 0; i < v.length; i++) { if (/^ko/i.test(v[i].lang)) { koVoice = v[i]; return; } }
    }
    if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }
    function showCaption() {
      if (!captionEl) { return; }
      captionEl.textContent = withTrans ? (TRANS[beam] || '') : '';
      captionEl.classList.toggle('is-on', mode === 'listen' && withTrans);
    }
    function stopSpeech() {
      listenToken++;
      clearTimeout(listenTimer);
      if (synth) { synth.cancel(); }
    }
    function speakCurrent() {
      var token = ++listenToken;
      var text = sentences[beam].textContent;
      var advance = function () {
        if (token !== listenToken || !playing) { return; }
        if (beam >= sentences.length - 1) { setPlaying(false); return; }
        setBeam(beam + 1);
        speakCurrent();
      };
      if (synth && koVoice) {
        var u = new SpeechSynthesisUtterance(text);
        u.voice = koVoice; u.lang = koVoice.lang; u.rate = speed;
        u.onend = function () { listenTimer = setTimeout(advance, 250); };
        u.onerror = function () { listenTimer = setTimeout(advance, 250); };
        synth.speak(u);
      } else {
        // no Korean voice in this browser: step through at a reading pace
        listenTimer = setTimeout(advance, (900 + text.length * 95) / speed);
      }
    }
    function setPlaying(on) {
      playing = on;
      listenbar.classList.toggle('is-playing', on);
      var play = listenbar.querySelector('[data-listen="play"]');
      play.setAttribute('aria-label', on ? 'Pause' : 'Play');
      stopSpeech();
      if (on) { speakCurrent(); }
    }
    listenbar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-listen]');
      if (!b) { return; }
      var act = b.getAttribute('data-listen');
      if (act === 'play') { setPlaying(!playing); }
      else if (act === 'prev' || act === 'next') {
        setBeam(beam + (act === 'next' ? 1 : -1));
        if (playing) { stopSpeech(); speakCurrent(); }
      } else if (act === 'speed') {
        speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
        speedEl.textContent = speed.toFixed(1) + '×';
        if (playing) { stopSpeech(); speakCurrent(); }
      } else if (act === 'trans') {
        withTrans = !withTrans;
        b.setAttribute('aria-pressed', withTrans ? 'true' : 'false');
        showCaption();
      } else if (act === 'close') { setMode('read'); }
    });

    /* ---- your-words panel: saved + suggested + learned ---- */
    function savedRowHtml(id) {
      var e;
      if (WORDS[id]) { e = { hw: WORDS[id].hw, hanja: WORDS[id].hanja, gloss: WORDS[id].def }; }
      else { CANDIDATES.forEach(function (x) { if (x.id === id) { e = x; } }); }
      if (!e) { return ''; }
      var step = fade[id] || 0, dots = '';
      for (var i = 0; i < 6; i++) { dots += '<i class="' + (i < step ? 'off' : '') + '"></i>'; }
      return '<div class="wv-row"><div class="wv-row__top"><span class="k">' + e.hw + '</span>' +
        (e.hanja ? '<span class="h">' + e.hanja + '</span>' : '') +
        '<span class="m">' + e.gloss + '</span><span class="wv-steps" title="Fades a step each page you read past it">' + dots + '</span></div>' +
        '<div class="src">from 날개</div></div>';
    }
    function candCardHtml(c) {
      var s = !!candSaved[c.id];
      var idx = c.sentence.indexOf(c.hw);
      var sent = idx === -1 ? c.sentence
        : c.sentence.slice(0, idx) + '<b>' + c.hw + '</b>' + c.sentence.slice(idx + c.hw.length);
      return '<div class="wv-card"><div class="wv-card__top"><span class="k">' + c.hw + '</span>' +
        (c.hanja ? '<span class="h">' + c.hanja + '</span>' : '') +
        '<span class="wv-badge">' + c.reason + '</span></div>' +
        '<div class="m">' + c.gloss + '</div>' +
        '<p class="wv-card__sentence">' + sent + '</p>' +
        '<button class="wv-card__save' + (s ? ' is-saved' : '') + '" type="button" data-cand="' + c.id + '"' +
        (s ? ' disabled' : '') + '>' + (s ? '✓ Saved' : 'Save') + '</button></div>';
    }
    function renderWords() {
      wordsTabs.forEach(function (t) {
        var on = t.getAttribute('data-wtab') === wtab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        if (t.getAttribute('data-wtab') === 'learned') { t.textContent = 'Learned ' + learned.length; }
      });
      if (!wordsBody) { return; }
      if (wtab === 'saved') {
        wordsBody.innerHTML = savedList.length
          ? savedList.map(savedRowHtml).join('') +
            '<p class="wv-note">Each saved word fades a step every page you read past it. After six, it moves to Learned.</p>'
          : '<p class="wv-note">Nothing saved yet — tap a word in the reader, then tap it again.</p>';
      } else if (wtab === 'suggested') {
        wordsBody.innerHTML =
          '<p class="wv-note">Picked from this book, for you: words the app isn\'t sure you know — and that the story is too sparing with to teach on its own.</p>' +
          CANDIDATES.map(candCardHtml).join('');
      } else {
        wordsBody.innerHTML = learned.map(function (e) {
          return '<div class="wv-row"><div class="wv-row__top"><span class="k">' + e.hw + '</span>' +
            (e.hanja ? '<span class="h">' + e.hanja + '</span>' : '') + '<span class="m">' + e.gloss + '</span></div></div>';
        }).join('') + '<p class="wv-note">These faded out while you read.</p>';
      }
    }

    /* ---- modes ---- */
    function setMode(m) {
      var prev = mode;
      if (prev === 'listen' && m !== 'listen') { setPlaying(false); }
      mode = m;
      reader.setAttribute('data-mode', m);
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-mode') === m;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (focusBtn) { focusBtn.setAttribute('aria-pressed', m === 'focus' ? 'true' : 'false'); }
      if (wordsBtn) { wordsBtn.setAttribute('aria-pressed', m === 'words' ? 'true' : 'false'); }
      if (listenBtn) { listenBtn.setAttribute('aria-pressed', m === 'listen' ? 'true' : 'false'); }
      if (prev === 'focus' && m !== 'focus') {
        // hand the paged reader the page the beam ended on
        var p = pageIndexOf(beam);
        if (p !== -1) { page = p; }
        viewport.scrollTop = 0;
      }
      if (m === 'focus' || m === 'listen') {
        if (prev !== 'focus' && prev !== 'listen') { beam = firstSentenceOfPage(page); }
        setBeam(beam);
        if (m === 'focus') { positionBeam(true); }
      } else {
        clearBeam();
      }
      if (m !== 'listen') { showCaption(); }
      if (m === 'words') { renderWords(); }
      if (hintEl && HINTS[m]) { hintEl.innerHTML = HINTS[m]; }
      setPage(page);
      closeSheet();
    }

    /* ---- events ---- */
    track.addEventListener('click', function (e) {
      if (suppressClick) { suppressClick = false; return; }
      var w = e.target.closest('.rw');
      var s = e.target.closest('.rs');
      if (w) {
        e.preventDefault();
        if (s && (mode === 'focus' || mode === 'listen')) { setBeam(Array.prototype.indexOf.call(sentences, s)); }
        // a second tap on the open word saves it
        if (w.classList.contains('is-active')) { toggleSave(current); render(); return; }
        openWord(w.getAttribute('data-word'), 'define', w);
        return;
      }
      if (reader.classList.contains('has-word')) { closeSheet(); return; }
      if (s && (mode === 'focus' || mode === 'listen')) {
        closeSheet();
        setBeam(Array.prototype.indexOf.call(sentences, s));
        if (mode === 'listen' && playing) { stopSpeech(); speakCurrent(); }
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
        paintMarks();
        renderWords();
      });
    }

    sheet.addEventListener('click', function (e) {
      var el = e.target.closest('[data-act]');
      if (!el) { return; }
      var act = el.getAttribute('data-act');
      if (act === 'close') { closeSheet(); return; }
      if (!current) { return; }
      if (act === 'save') { toggleSave(current); render(); return; }
      if (act === 'handle') { view = view === 'roots' ? 'define' : 'roots'; rootOn = view === 'roots' ? 0 : -1; }
      else if (act === 'char') { view = 'roots'; rootOn = Number(el.getAttribute('data-i')); }
      else if (act === 'meaning') { view = view === 'ai' ? 'define' : 'ai'; }
      render();
    });

    if (paneEl) { paneEl.addEventListener('click', closeSheet); }
    if (prevBtn) { prevBtn.addEventListener('click', function () { closeSheet(); setPage(page - 1); }); }
    if (nextBtn) { nextBtn.addEventListener('click', function () { closeSheet(); setPage(page + 1); }); }
    if (focusBtn) { focusBtn.addEventListener('click', function () { setMode(mode === 'focus' ? 'read' : 'focus'); }); }
    if (listenBtn) { listenBtn.addEventListener('click', function () { setMode(mode === 'listen' ? 'read' : 'listen'); }); }
    if (wordsBtn) { wordsBtn.addEventListener('click', function () { setMode(mode === 'words' ? 'read' : 'words'); }); }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () { setMode(t.getAttribute('data-mode')); });
    });

    /* ---- pointer: swipe to page (or beam), press and hold to select a sentence ---- */
    var sx = 0, sy = 0, onWord = false, moved = false, lp = null, suppressClick = false;
    viewport.addEventListener('pointerdown', function (e) {
      sx = e.clientX; sy = e.clientY; moved = false; suppressClick = false;
      onWord = !!e.target.closest('.rw');
      var s = e.target.closest('.rs');
      clearTimeout(lp);
      if (s && mode === 'read') {
        lp = setTimeout(function () {
          if (!moved) { moved = true; suppressClick = true; openSentence(Array.prototype.indexOf.call(sentences, s)); }
        }, 500);
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
        if (mode === 'focus' || mode === 'listen') { setBeam(dx < 0 ? beam + 1 : beam - 1); }
        else { setPage(dx < 0 ? page + 1 : page - 1); }
      }
    });
    viewport.addEventListener('pointercancel', function () { clearTimeout(lp); });
    viewport.addEventListener('contextmenu', function (e) { e.preventDefault(); });

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
        if (demo === 'listen') { setMode('listen'); flashGuide(item); return; }
        if (demo === 'words') { setMode('words'); flashGuide(item); return; }
        if (mode !== 'read') { setMode('read'); }
        if (demo === 'define') { openWord('cheonjae', 'define'); }
        else if (demo === 'roots') { openWord('cheonjae', 'roots'); }
        else if (demo === 'ai') { openWord('cheonjae', 'ai'); }
        else if (demo === 'translate') { openSentence(0); }
        else if (demo === 'fade') { closeSheet(); setPage(page === 0 ? 1 : 0); }
        flashGuide(item);
      };
      item.addEventListener('click', run);
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); }
      });
    });

    /* init */
    paintMarks();
    setMode('read');
    setPage(0);
  })();
})();

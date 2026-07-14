(function () {
  'use strict';

  document.querySelectorAll('.footer__copy-btn').forEach(function (btn) {
    var resetTimer = null;

    function markCopied() {
      btn.classList.add('is-copied');
      btn.setAttribute('aria-label', 'Copied');
      btn.setAttribute('title', 'Copied');
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () {
        btn.classList.remove('is-copied');
        btn.setAttribute('aria-label', 'Copy email address');
        btn.setAttribute('title', 'Copy email address');
      }, 1600);
    }

    function legacyCopy(email) {
      var ta = document.createElement('textarea');
      ta.value = email;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      markCopied();
    }

    btn.addEventListener('click', function () {
      var email = btn.getAttribute('data-copy');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(markCopied, function () { legacyCopy(email); });
      } else {
        legacyCopy(email);
      }
    });
  });
})();

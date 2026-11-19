// The invite page (invite.html). A friend's link is noeul.app/invite?c=CODE;
// this points the button at the app (noeul://invite/CODE) and shows the code
// for typing in by hand. Nothing is sent anywhere.
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var code = (params.get('c') || '').trim().toUpperCase();
  // The same shape the app accepts: 6 to 32 letters and digits.
  if (!/^[0-9A-Z]{6,32}$/.test(code)) return;

  document.getElementById('invite-missing').hidden = true;
  document.getElementById('invite-ready').hidden = false;
  document.getElementById('invite-open').href = 'noeul://invite/' + code;
  document.getElementById('invite-code').textContent = code;

  var copy = document.getElementById('invite-copy');
  var resetTimer = null;
  function markCopied() {
    copy.textContent = 'Copied';
    clearTimeout(resetTimer);
    resetTimer = setTimeout(function () { copy.textContent = 'Copy code'; }, 1600);
  }
  function legacyCopy() {
    var ta = document.createElement('textarea');
    ta.value = code;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    markCopied();
  }
  copy.addEventListener('click', function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(markCopied, legacyCopy);
    } else {
      legacyCopy();
    }
  });
})();

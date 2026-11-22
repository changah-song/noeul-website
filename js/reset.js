// The password reset page (reset.html).
//
// Without a link: asks for the account's email and has Supabase send the reset
// email. From the emailed link (noeul.app/reset?token_hash=...&type=recovery):
// asks for a new password, then trades the link's token for a session and sets
// the password with it.
//
// The token is only used when the form is sent, not when the page opens: mail
// scanners open links to check them, and a token that was spent on page load
// would be gone before the person arrived.
(function () {
  'use strict';

  // The same public project address and key the app ships with.
  var SUPABASE_URL = 'https://ougxlrkbnvjbnflszqaa.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_dv6I5gXFp_C752GrRR74PA_s1r1JEMS';
  var MIN_PASSWORD = 8;

  function el(id) { return document.getElementById(id); }
  function show(id) {
    ['reset-request', 'reset-sent', 'reset-new', 'reset-done', 'reset-expired'].forEach(function (other) {
      el(other).hidden = other !== id;
    });
    if (id === 'reset-expired') el('reset-title').textContent = 'Reset your password';
    if (id === 'reset-done') el('reset-title').textContent = 'Password changed';
  }
  function setError(id, message) {
    var node = el(id);
    node.textContent = message || '';
    node.hidden = !message;
  }
  function setBusy(button, busy, idleText, busyText) {
    button.disabled = busy;
    button.textContent = busy ? busyText : idleText;
  }

  function call(method, path, body, accessToken) {
    var headers = { 'Content-Type': 'application/json', apikey: SUPABASE_KEY };
    if (accessToken) headers.Authorization = 'Bearer ' + accessToken;
    return fetch(SUPABASE_URL + '/auth/v1' + path, {
      method: method,
      headers: headers,
      body: JSON.stringify(body),
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        return { ok: response.ok, status: response.status, data: data };
      });
    });
  }

  var params = new URLSearchParams(window.location.search);
  var tokenHash = (params.get('token_hash') || '').trim();
  var fromLink = params.get('type') === 'recovery' && /^[A-Za-z0-9_-]{16,200}$/.test(tokenHash);

  // ---- Asking for the link -------------------------------------------------
  el('reset-request').addEventListener('submit', function (event) {
    event.preventDefault();
    var email = el('reset-email').value.trim();
    var button = el('reset-request-submit');
    setError('reset-request-error', '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('reset-request-error', 'Enter the email address of your account.');
      return;
    }
    setBusy(button, true, 'Send the link', 'Sending…');
    call('POST', '/recover', { email: email }).then(function (result) {
      setBusy(button, false, 'Send the link', 'Sending…');
      if (result.status === 429) {
        setError('reset-request-error', 'Too many tries just now. Wait a minute and try again.');
        return;
      }
      if (!result.ok) {
        setError('reset-request-error', 'That did not work. Try again in a moment.');
        return;
      }
      // The same answer whether or not the address has an account.
      el('reset-sent-email').textContent = email;
      show('reset-sent');
    }, function () {
      setBusy(button, false, 'Send the link', 'Sending…');
      setError('reset-request-error', 'No connection. Check your internet and try again.');
    });
  });

  // ---- Choosing the new password -------------------------------------------
  el('reset-new').addEventListener('submit', function (event) {
    event.preventDefault();
    var password = el('reset-password').value;
    var again = el('reset-password-again').value;
    var button = el('reset-new-submit');
    setError('reset-new-error', '');
    if (password.length < MIN_PASSWORD) {
      setError('reset-new-error', 'Use at least ' + MIN_PASSWORD + ' characters.');
      return;
    }
    if (password !== again) {
      setError('reset-new-error', 'The two passwords are not the same.');
      return;
    }
    setBusy(button, true, 'Change password', 'Changing…');
    var failed = function (message) {
      setBusy(button, false, 'Change password', 'Changing…');
      setError('reset-new-error', message);
    };
    call('POST', '/verify', { type: 'recovery', token_hash: tokenHash }).then(function (verified) {
      var accessToken = verified.data && verified.data.access_token;
      if (!verified.ok || !accessToken) {
        show('reset-expired');
        return null;
      }
      return call('PUT', '/user', { password: password }, accessToken).then(function (updated) {
        if (!updated.ok) {
          var code = updated.data && (updated.data.error_code || updated.data.code);
          // The link is spent now, so a refused password needs a new link.
          if (code === 'weak_password') {
            el('reset-expired').firstElementChild.textContent =
              'That password was not accepted (too short or too common), and the link can only be used once.';
          } else if (code === 'same_password') {
            el('reset-expired').firstElementChild.textContent =
              'That is already your password. You can sign in with it; the link has now been used.';
          }
          show('reset-expired');
          return;
        }
        // The page keeps no session; sign the one-off session out as well.
        call('POST', '/logout', {}, accessToken).catch(function () {});
        el('reset-password').value = '';
        el('reset-password-again').value = '';
        // Drop the spent token from the address bar.
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        show('reset-done');
      });
    }).catch(function () {
      failed('No connection. Check your internet and try again.');
    });
  });

  if (fromLink) {
    el('reset-title').textContent = 'Choose a new password';
    show('reset-new');
  }
})();

// script.js — Interactive behaviors for Pro Cyberpunk Profile
// Author: Ayushi (for Aashoo)
// Usage: Drop this file as script.js and ensure it's included with `defer` in HTML.

(() => {
  /* -------------------------
     Lightweight DOM helpers
     ------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* -------------------------
     Read initial user/data state from DOM
     ------------------------- */
  const shell = $('#profile-shell');
  const levelNumEl = $('#level-num');
  const xpCurrentEl = $('#xp-current');
  const xpNeededEl = $('#xp-needed');
  const progressFill = $('#progress-fill');
  const progressBar = $('.progress-bar');
  const progressAttrXP = parseInt(shell?.dataset.xp ?? 0, 10);
  const profileLevel = parseInt(shell?.dataset.level ?? 1, 10);

  // Demo coins (will be replaced by backend value)
  let userCoins = Number(shell?.dataset.coins ?? 1200); // if you set data-coins on main, it will read that
  // Fallback: if no data-coins attribute, default 1200:
  if (isNaN(userCoins)) userCoins = 1200;

  // XP goal calculation (simple: next level at round 20k increments or derive from attribute)
  const xpGoal = (() => {
    // If site provides xp goal via attribute, use it. Otherwise compute next round number.
    const providedGoal = Number(shell?.dataset.xpGoal ?? 20000);
    if (!isNaN(providedGoal) && providedGoal > 0) return providedGoal;
    // default: next milestone at ceil(xp / 10000) * 10000
    const base = Math.ceil((progressAttrXP + 1) / 10000) * 10000;
    return base;
  })();

  /* -------------------------
     Initial UI Elements
     ------------------------- */
  const followBtn = $('#follow-btn');
  const levelBubble = $('#level-bubble');
  const avatarFrame = $('#avatar-frame');
  const previewToggleBtn = $('#preview-toggle');
  const exportBtn = $('#export-profile');
  const openStoreBtn = $('#open-store');
  const buyBtns = $$('.buy-btn');
  const previewGlowClass = 'preview-glow';
  const animatedToggle = $('#toggle-animated');
  const msgfxToggle = $('#toggle-msgfx');
  const probStatSolved = $('#stat-solved');
  const followersStat = $('#stat-followers');

  /* -------------------------
     Utility functions
     ------------------------- */
  function formatCoins(n) {
    return `${n.toLocaleString()} coins`;
  }

  function showToast(msg, time = 2200) {
    // small toast at bottom-right
    let t = document.createElement('div');
    t.className = 'ax-toast';
    t.style.cssText = `
      position:fixed;right:18px;bottom:18px;
      background:rgba(6,10,18,0.9);color:#e8f1f8;padding:10px 14px;border-radius:10px;
      box-shadow:0 8px 30px rgba(3,6,20,0.6);z-index:9999;font-weight:600;
    `;
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('ax-toast-hide'), time - 200);
    setTimeout(() => t.remove(), time);
  }

  /* -------------------------
     Progress Bar / XP logic
     ------------------------- */
  function updateProgressUI() {
    const xp = progressAttrXP;
    const cur = xp;
    const need = xpGoal;
    const pct = Math.min(100, Math.round((cur / need) * 10000) / 100);
    xpCurrentEl.textContent = `${cur.toLocaleString()} XP`;
    xpNeededEl.textContent = `/ ${need.toLocaleString()} XP`;
    const left = Math.max(0, need - cur);
    $('#xp-left').textContent = `${left.toLocaleString()} XP`;
    progressFill.style.width = `${pct}%`;
    progressFill.setAttribute('aria-valuenow', pct);
  }

  /* -------------------------
     Follow button toggle
     ------------------------- */
  function initFollow() {
    if (!followBtn) return;
    followBtn.addEventListener('click', (e) => {
      const following = followBtn.dataset.following === 'true' || followBtn.classList.contains('following');
      if (following) {
        // unfollow
        followBtn.classList.remove('following');
        followBtn.textContent = 'Follow';
        followBtn.dataset.following = 'false';
        // decrease follower count on UI (demo)
        const f = Number(followersStat.textContent) || Number(shell.dataset.followers || 0);
        followersStat.textContent = Math.max(0, f - 1);
        showToast('Unfollowed');
      } else {
        followBtn.classList.add('following');
        followBtn.textContent = 'Following';
        followBtn.dataset.following = 'true';
        const f = Number(followersStat.textContent) || Number(shell.dataset.followers || 0);
        followersStat.textContent = f + 1;
        showToast('Followed — you will see updates in your feed');
      }
      // TODO: call backend follow/unfollow API here
    });
  }

  /* -------------------------
     Preview Effects toggle (global glow)
     ------------------------- */
  function initPreviewToggle() {
    if (!previewToggleBtn) return;
    previewToggleBtn.addEventListener('click', () => {
      // toggle a preview glow overlay on avatar-frame for demo
      const has = avatarFrame.querySelector('.' + previewGlowClass);
      if (has) {
        has.remove();
        previewToggleBtn.textContent = 'Preview Effects';
      } else {
        const glow = document.createElement('div');
        glow.className = previewGlowClass;
        avatarFrame.appendChild(glow);
        previewToggleBtn.textContent = 'Hide Preview';
      }
    });
  }

  /* -------------------------
     Export profile JSON (download)
     ------------------------- */
  function initExport() {
    if (!exportBtn) return;
    exportBtn.addEventListener('click', () => {
      const json = {
        uid: shell.dataset.uid || null,
        name: $('#profile-name')?.textContent || '',
        title: $('#title-pill')?.dataset.title || $('#title-pill')?.textContent || '',
        level: shell.dataset.level,
        xp: shell.dataset.xp,
        followers: shell.dataset.followers || $('#stat-followers')?.textContent,
        problems: $('#stat-solved')?.textContent,
        skills: Array.from($$('.skill-tags .tag')).map(t => t.textContent),
        cosmetics: {
          frame: avatarFrame.dataset.frameId || null,
          badges: $$('.badges-row .badge-item').map(b => b.dataset.badgeId || b.querySelector('strong')?.textContent)
        }
      };
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${json.name?.replace(/\s+/g, '_') || 'profile'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Profile exported (demo)');
    });
  }

  /* -------------------------
     Store / Buy handlers (mock)
     ------------------------- */
  function initStore() {
    if (!openStoreBtn) return;
    openStoreBtn.addEventListener('click', () => {
      // scroll to store area (col-right) if exists
      const store = $('.store-card');
      if (store) {
        store.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // brief pulse
        store.animate([{ transform: 'translateY(6px)' }, { transform: 'translateY(0)' }], { duration: 450 });
      }
    });

    buyBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = btn.closest('.store-item');
        const itemId = item?.dataset.itemId;
        const priceText = item?.querySelector('.store-meta small')?.textContent || '';
        const price = parseInt((priceText.match(/\d+/) || [0])[0], 10);
        if (isNaN(price) || price <= 0) {
          showToast('Invalid item price');
          return;
        }
        if (userCoins < price) {
          showToast('Not enough coins — earn or buy more');
          return;
        }
        // Deduct (mock)
        userCoins -= price;
        // Update UI / create transaction log (demo)
        showToast(`Purchased ${item.querySelector('.store-meta strong')?.textContent || itemId} — ${formatCoins(price)} spent`);
        // Add cosmetic preview to badges row (demo)
        const newBadge = document.createElement('div');
        newBadge.className = 'badge-item';
        newBadge.dataset.badgeId = itemId;
        newBadge.innerHTML = `
          <img src="https://via.placeholder.com/48" alt="${itemId}">
          <div class="badge-meta"><strong>${item.querySelector('.store-meta strong')?.textContent}</strong><small>Owned</small></div>
        `;
        $('#badges-row')?.appendChild(newBadge);
        // In real app send POST /api/purchase and refresh wallet balance from backend
      });
    });
  }

  /* -------------------------
     Message highlight / small animation
     ------------------------- */
  function initMessageEffects() {
    const msgButtons = $$('.post-actions button[data-flag-msg-effect="true"]');
    msgButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rect = btn.getBoundingClientRect();
        // create a floating message animation originating from button
        const bubble = document.createElement('div');
        bubble.textContent = '✨ Message Highlighted';
        bubble.style.cssText = `
          position:fixed;left:${rect.left + rect.width / 2}px;top:${rect.top - 10}px;
          transform:translate(-50%, -60%);background:linear-gradient(90deg,#00eaff,#7b2cff);
          color:#031018;padding:8px 12px;border-radius:20px;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,0.6);z-index:9999;
        `;
        document.body.appendChild(bubble);
        bubble.animate([{ opacity: 1, transform: 'translate(-50%, -60%) translateY(0)' }, { opacity: 0, transform: 'translate(-50%, -160%) translateY(-40px)' }], { duration: 1100, easing: 'cubic-bezier(.2,.9,.2,1)' });
        setTimeout(() => bubble.remove(), 1100);
        showToast('Message will be highlighted for this user (demo)');
      });
    });
  }

  /* -------------------------
     Toggles: animated avatar / message fx / pro badge
     These reflect the quick-settings toggles in right column
     ------------------------- */
  function initToggles() {
    if (animatedToggle) {
      animatedToggle.addEventListener('change', (e) => {
        const on = animatedToggle.checked;
        if (on) shell.setAttribute('data-animated-avatar', 'true');
        else shell.setAttribute('data-animated-avatar', 'false');
        showToast(`Animated Avatar ${on ? 'Enabled' : 'Disabled'}`);
        // TODO: persist to backend
      });
    }
    if (msgfxToggle) {
      msgfxToggle.addEventListener('change', (e) => {
        const on = msgfxToggle.checked;
        if (on) shell.setAttribute('data-message-effect', 'spark');
        else shell.setAttribute('data-message-effect', 'none');
        showToast(`Message Effects ${on ? 'Enabled' : 'Disabled'}`);
      });
    }
    if ($('#toggle-probadge')) {
      $('#toggle-probadge').addEventListener('change', (e) => {
        const on = $('#toggle-probadge').checked;
        const el = document.querySelector('.pro-badge');
        if (el) el.style.display = on ? 'inline-block' : 'none';
        showToast(`PRO Badge ${on ? 'Visible' : 'Hidden'}`);
      });
    }
  }

  /* -------------------------
     Misc: update year, wire up other small bits
     ------------------------- */
  function initMisc() {
    // site year
    $('#site-year').textContent = new Date().getFullYear();

    // set level text from data attributes
    if (shell?.dataset.level) {
      levelNumEl.textContent = shell.dataset.level;
    }

    // set quick stats from DOM dataset fallback
    const solved = shell.dataset.solved || $('#stat-solved')?.textContent || '0';
    if ($('#stat-solved')) $('#stat-solved').textContent = solved;
    const followers = shell.dataset.followers || $('#stat-followers')?.textContent || '0';
    if ($('#stat-followers')) $('#stat-followers').textContent = followers;

    // Animate progress on load
    setTimeout(() => updateProgressUI(), 120);

    // Keyboard shortcut: press "p" to preview effects (dev shortcut)
    window.addEventListener('keydown', (ev) => {
      if (ev.key === 'p' || ev.key === 'P') {
        previewToggleBtn?.click();
      }
    });
  }

  /* -------------------------
     Initialize all
     ------------------------- */
  function init() {
    initFollow();
    initPreviewToggle();
    initExport();
    initStore();
    initMessageEffects();
    initToggles();
    initMisc();

    // show initial coins as toast for demo
    showToast(`Wallet: ${formatCoins(userCoins)}`, 1800);
  }

  // Run when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* -------------------------
     Exports (optional global hooks)
     ------------------------- */
  window.DevProfile = {
    buyItemMock: (itemId, price) => {
      // public helper to buy item via JS console for quick testing
      if (userCoins >= price) {
        userCoins -= price;
        showToast(`Bought ${itemId} (${formatCoins(price)})`);
        return true;
      }
      showToast('Insufficient coins');
      return false;
    },
    getUserCoins: () => userCoins,
    addXP: (amount) => {
      const cur = Number(shell.dataset.xp || 0);
      shell.dataset.xp = cur + Number(amount);
      updateProgressUI();
      showToast(`+${Number(amount)} XP`);
    }
  };

})();
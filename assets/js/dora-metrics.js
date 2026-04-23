/*
 * DORA metrics tracker — live widget for this repository.
 * ---------------------------------------------------------
 * Pulls real data from the public GitHub REST API and renders
 * the four DORA software-delivery metrics:
 *
 *   - Deployment Frequency
 *   - Lead Time for Changes
 *   - Change Failure Rate
 *   - Time to Restore Service (MTTR)
 *
 * Design notes:
 *
 * - Vanilla JS, no build step, no framework. This is a Jekyll
 *   site on GitHub Pages — the smaller and more boring the
 *   client code is, the less there is to break under Pages'
 *   build constraints.
 *
 * - Unauthenticated API access. GitHub caps this at 60 requests
 *   per hour per source IP. Responses are cached in localStorage
 *   for five minutes so a refresh does not burn the budget.
 *
 * - Graceful failure. On rate-limit or network error the widget
 *   renders an explanatory message instead of silently showing
 *   stale or wrong numbers.
 *
 * - Thresholds come from Google Cloud DORA's 2022 State of
 *   DevOps report (Elite / High / Medium / Low bands).
 */
(() => {
  'use strict';

  const REPO = 'Eliza-French/level6-cicd-pipeline';
  const API = `https://api.github.com/repos/${REPO}`;
  const CACHE_PREFIX = 'dora-cache-v1:';
  const CACHE_TTL_MS = 5 * 60 * 1000;

  // Path of the workflow we treat as "the production deploy".
  // On this repo, pushing to main triggers jekyll-gh-pages which
  // publishes the built site to GitHub Pages.
  const DEPLOY_WF_PATH = '.github/workflows/jekyll-gh-pages.yml';

  // 2022 DORA State of DevOps report thresholds.
  // For df (throughput) higher is better, matched by `min`.
  // For lt / cfr / mttr lower is better, matched by `max`.
  //
  // Lead Time and Time to Restore share the same hour-based
  // bands in the 2022 report (< 1h, < 1d, < 1 week, else), so
  // the two tier tables are defined once and reused.
  const TIME_TIERS = [
    { max: 1, label: 'Elite', cls: 'tier-elite' },
    { max: 24, label: 'High', cls: 'tier-high' },
    { max: 24 * 7, label: 'Medium', cls: 'tier-medium' },
    { max: Infinity, label: 'Low', cls: 'tier-low' }
  ];

  const TIERS = {
    df: [
      { min: 1, label: 'Elite', cls: 'tier-elite' },
      { min: 1 / 7, label: 'High', cls: 'tier-high' },
      { min: 1 / 30, label: 'Medium', cls: 'tier-medium' },
      { min: 0, label: 'Low', cls: 'tier-low' }
    ],
    lt: TIME_TIERS,
    cfr: [
      { max: 15, label: 'Elite', cls: 'tier-elite' },
      { max: 30, label: 'High', cls: 'tier-high' },
      { max: 45, label: 'Medium', cls: 'tier-medium' },
      { max: 100, label: 'Low', cls: 'tier-low' }
    ],
    mttr: TIME_TIERS
  };

  const tierFor = (metric, value) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return { label: '—', cls: 'tier-unknown' };
    }
    const buckets = TIERS[metric];
    if (metric === 'df') {
      return buckets.find((b) => value >= b.min) || buckets[buckets.length - 1];
    }
    return buckets.find((b) => value <= b.max) || buckets[buckets.length - 1];
  };

  const median = (nums) => {
    if (!nums.length) return null;
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const formatHours = (h) => {
    if (h < 1) return `${Math.round(h * 60)} min`;
    if (h < 48) return `${h.toFixed(1)} hours`;
    return `${(h / 24).toFixed(1)} days`;
  };

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);

  const fetchCached = async (url) => {
    const key = CACHE_PREFIX + url;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const entry = JSON.parse(raw);
        if (Date.now() - entry.ts < CACHE_TTL_MS) return entry.data;
      }
    } catch (_) { /* ignore malformed cache */ }

    const res = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!res.ok) {
      throw new Error(`GitHub API ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    try {
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    } catch (_) { /* quota full — skip caching */ }
    return data;
  };

  const loadData = async (windowDays) => {
    const sinceDate = new Date(Date.now() - windowDays * 24 * 3600 * 1000);
    const runsUrl = `${API}/actions/runs?branch=main&per_page=100`;
    const prsUrl = `${API}/pulls?state=closed&base=main&per_page=100&sort=updated&direction=desc`;

    const [runsResp, prsResp] = await Promise.all([
      fetchCached(runsUrl),
      fetchCached(prsUrl)
    ]);

    const runs = (runsResp.workflow_runs || []).filter(
      (r) => new Date(r.created_at) >= sinceDate
    );
    const prs = (prsResp || []).filter(
      (p) => p.merged_at && new Date(p.merged_at) >= sinceDate
    );
    return { runs, prs, windowDays };
  };

  const computeMetrics = ({ runs, prs, windowDays }) => {
    // Deployment Frequency — successful deploy runs per day.
    const deployRuns = runs.filter(
      (r) => r.path === DEPLOY_WF_PATH && r.conclusion === 'success'
    );
    const dfPerDay = deployRuns.length / windowDays;

    // Lead Time for Changes — median hours from PR open to merge.
    const leadHours = prs.map(
      (p) => (new Date(p.merged_at) - new Date(p.created_at)) / 3600000
    );
    const ltMedian = median(leadHours);

    // Change Failure Rate — % of completed deploys that didn't succeed.
    const deployCompleted = runs.filter(
      (r) => r.path === DEPLOY_WF_PATH && r.status === 'completed'
    );
    const deployFailed = deployCompleted.filter(
      (r) => r.conclusion !== 'success'
    );
    const cfrPct = deployCompleted.length
      ? (deployFailed.length / deployCompleted.length) * 100
      : null;

    // MTTR — median gap from a failed deploy to the next successful one.
    const chron = [...deployCompleted].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
    const recoveryHours = [];
    for (let i = 0; i < chron.length; i += 1) {
      if (chron[i].conclusion === 'success') continue;
      const failedAt = new Date(chron[i].created_at);
      const next = chron.slice(i + 1).find((r) => r.conclusion === 'success');
      if (next) {
        recoveryHours.push((new Date(next.created_at) - failedAt) / 3600000);
      }
    }
    const mttrMedian = recoveryHours.length ? median(recoveryHours) : null;

    const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

    return {
      df: {
        value: dfPerDay,
        display: dfPerDay > 0 ? `${dfPerDay.toFixed(2)}/day` : '0/day',
        sample: `${plural(deployRuns.length, 'deploy')} in ${windowDays}d`
      },
      lt: {
        value: ltMedian,
        display: ltMedian === null ? '—' : formatHours(ltMedian),
        sample: `n = ${plural(prs.length, 'PR')}`
      },
      cfr: {
        value: cfrPct,
        display: cfrPct === null ? '—' : `${Math.round(cfrPct)}%`,
        sample: plural(deployCompleted.length, 'run')
      },
      mttr: {
        value: mttrMedian,
        display: mttrMedian === null ? '—' : formatHours(mttrMedian),
        sample: `n = ${recoveryHours.length}`
      }
    };
  };

  const card = (title, value, tier, tooltip, sample) => `
    <div class="dora-card">
      <div class="dora-card-title" title="${escapeHtml(tooltip)}">${escapeHtml(title)}</div>
      <div class="dora-card-value">${escapeHtml(value)}</div>
      <div class="dora-card-tier ${tier.cls}">${escapeHtml(tier.label)}</div>
      <div class="dora-card-sample">${escapeHtml(sample)}</div>
    </div>
  `;

  const renderControls = (windowDays) => {
    const windows = [7, 30, 90].map((d) => {
      const active = d === windowDays ? ' is-active' : '';
      return `<button class="dora-window${active}" data-window="${d}">${d}d</button>`;
    }).join('');
    return `
      <div class="dora-controls">
        ${windows}
        <button class="dora-refresh" title="Refresh (clears cache)" aria-label="Refresh metrics">↻</button>
      </div>
    `;
  };

  const render = (container, windowDays, data, err) => {
    if (err) {
      const hint = /403|429/.test(err.message)
        ? ' GitHub\'s unauthenticated API allows 60 requests per hour per IP. Try again shortly.'
        : '';
      container.innerHTML = `
        <div class="dora-header">
          <h3>Live DORA metrics — this repo</h3>
          ${renderControls(windowDays)}
        </div>
        <div class="dora-error">Could not load metrics: ${escapeHtml(err.message)}.${hint}</div>
      `;
    } else {
      const m = computeMetrics(data);
      const tiers = {
        df:   tierFor('df',   m.df.value),
        lt:   tierFor('lt',   m.lt.value),
        cfr:  tierFor('cfr',  m.cfr.value),
        mttr: tierFor('mttr', m.mttr.value)
      };
      container.innerHTML = `
        <div class="dora-header">
          <h3>Live DORA metrics — this repo</h3>
          ${renderControls(windowDays)}
        </div>
        <div class="dora-grid">
          ${card('Deployment Frequency', m.df.display, tiers.df,
                 'Successful deploys of the GitHub Pages workflow per day, averaged over the window.',
                 m.df.sample)}
          ${card('Lead Time for Changes', m.lt.display, tiers.lt,
                 'Median time from PR opened to PR merged, for PRs merged in the window.',
                 m.lt.sample)}
          ${card('Change Failure Rate', m.cfr.display, tiers.cfr,
                 'Percentage of completed deploy runs on main that did not succeed.',
                 m.cfr.sample)}
          ${card('Time to Restore', m.mttr.display, tiers.mttr,
                 'Median gap from a failed deploy to the next successful deploy. A dash means no failures.',
                 m.mttr.sample)}
        </div>
        <p class="dora-meta">
          Window: last ${windowDays} days.
          Data: GitHub REST API (cached 5 min).
          Computed: ${new Date().toLocaleTimeString()}.
        </p>
      `;
    }
    wireControls(container, windowDays);
  };

  const wireControls = (container, windowDays) => {
    container.querySelectorAll('.dora-window').forEach((btn) => {
      btn.addEventListener('click', () => {
        load(container, Number(btn.getAttribute('data-window')));
      });
    });
    const refresh = container.querySelector('.dora-refresh');
    if (refresh) {
      refresh.addEventListener('click', () => {
        // Drop cache so the refresh actually hits the API.
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i += 1) {
          const k = localStorage.key(i);
          if (k && k.indexOf(CACHE_PREFIX) === 0) keysToRemove.push(k);
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        load(container, windowDays);
      });
    }
  };

  const load = async (container, windowDays) => {
    container.classList.add('is-loading');
    try {
      const data = await loadData(windowDays);
      render(container, windowDays, data, null);
    } catch (e) {
      render(container, windowDays, null, e);
    } finally {
      container.classList.remove('is-loading');
    }
  };

  const init = () => {
    const container = document.getElementById('dora-tracker');
    if (!container) return;
    load(container, 30);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

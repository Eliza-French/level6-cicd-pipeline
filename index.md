---
layout: page
title: My DevOps Blog
---

<!-- markdownlint-disable MD033 -->

<p class="site-intro">
  A Jekyll blog on GitHub Pages, wrapped in a full CI/CD pipeline and
  graded against its own delivery metrics.
</p>

## Posts

{% include post-list.liquid %}

## Live DORA metrics

<div id="dora-tracker">
  <noscript>
    This widget needs JavaScript. The posts above work without it.
  </noscript>
  <p>Loading metrics from the GitHub API…</p>
</div>

The four *DORA* metrics — **Deployment Frequency**, **Lead Time for
Changes**, **Change Failure Rate**, and **Time to Restore Service** —
measure the throughput and stability of a delivery pipeline. The
widget pulls them live from the GitHub REST API and grades each one
against the 2022 *State of DevOps* Elite, High, Medium and Low bands.

Results are cached in the browser for five minutes to stay under
the 60-per-hour rate limit that GitHub imposes on unauthenticated
requests.

<link rel="stylesheet" href="assets/css/dora-metrics.css">
<link rel="stylesheet" href="assets/css/home.css">
<script src="assets/js/dora-metrics.js" defer></script>

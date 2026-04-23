---
layout: home
title: My DevOps Blog
---

<!-- markdownlint-disable MD033 -->
<!-- MD033 forbids inline HTML, but the DORA widget below is
     deliberately embedded HTML + JS; the rest of the file is
     plain markdown. -->

## Live DORA metrics for this repository

Below is a live widget that pulls the four DORA metrics for this
repository from the GitHub REST API and grades each one against the
2022 *State of DevOps* thresholds. The numbers are recomputed on
every page load, so the homepage cannot silently drift away from
what the pipeline is actually doing.

<div id="dora-tracker">
  <noscript>
    This tracker needs JavaScript. It is a progressive enhancement
    on top of the static blog — the posts below work without it.
  </noscript>
  <p>Loading metrics from the GitHub API…</p>
</div>

<link rel="stylesheet" href="assets/css/dora-metrics.css">
<script src="assets/js/dora-metrics.js" defer></script>

### What DORA metrics are, and why they live on the homepage

The DORA — DevOps Research and Assessment — team, led by
Dr Nicole Forsgren, spent roughly a decade studying what
separates high-performing software teams from low-performing ones.
Four outcome metrics kept coming out as the best predictors of
both delivery speed and wider organisational performance:

- **Deployment Frequency** — how often changes reach production.
- **Lead Time for Changes** — how long a change takes to get from
  a commit to running in production.
- **Change Failure Rate** — the percentage of deploys that cause a
  problem needing a hotfix, rollback, or patch.
- **Time to Restore Service** — how long it takes to recover when
  something does break. Also known as MTTR.

The first two measure throughput, the second two measure stability.
A central finding from the *Accelerate* book and the annual *State
of DevOps* reports is that these are not a trade-off: elite teams
score well on all four at once. Improving throughput without
wrecking stability is the whole point of a mature CI/CD pipeline,
and these four numbers are the industry-standard way of telling
whether it is actually working.

Putting them on the homepage is a commitment device. This
repository is built to demonstrate CI/CD practice, so it should
be happy to be measured by CI/CD yardsticks. The widget above
recomputes the numbers on demand straight from the GitHub API,
so it cannot quietly lie.

### How this widget computes each metric

The widget calls two public GitHub REST endpoints:

- `GET /repos/{owner}/{repo}/actions/runs?branch=main` — workflow
  runs on the default branch.
- `GET /repos/{owner}/{repo}/pulls?state=closed&base=main` — the
  pull requests that produced those changes.

From that raw data it derives:

- **Deployment Frequency** — successful runs of the
  `jekyll-gh-pages.yml` workflow on `main` in the selected window,
  divided by the window length in days.
- **Lead Time for Changes** — the median number of hours from PR
  opened to PR merged, across PRs merged in the window. The
  canonical DORA definition uses *first commit → production*;
  PR-opened is the closest proxy that the API makes cheap to
  compute, and on a small repository the two numbers are usually
  within minutes of each other.
- **Change Failure Rate** — the percentage of completed deploy
  runs on `main` that did not conclude successfully. On a service
  with real users the formal definition is narrower — a deploy
  that caused an incident — but on a static site, "the deploy
  failed" is the most useful proxy available.
- **Time to Restore Service** — the median gap between a failed
  deploy on `main` and the next successful deploy. A dash means
  there were no failed deploys in the window, which is the
  outcome we want.

The Elite, High, Medium and Low badges come from Google Cloud
DORA's 2022 *State of DevOps* report.

### Honest caveats

This is a small teaching repository with a handful of commits and
deploys, not a production service. The *absolute numbers* will
often look either flattering or alarming simply because the scope
is tiny and a single bad day moves the needle a long way. The
point of putting the widget here is not to claim a benchmark — it
is to show the *measurement plumbing*. The same widget, pointed
at a real service, would turn into a trend chart that drives
improvement conversations.

The widget is entirely client-side and uses the public GitHub API
without authentication, which caps it at 60 requests per IP per
hour. Results are cached in browser storage for five minutes. If
you hit a rate limit, wait a few minutes and press refresh.

References:

- Forsgren, Humble and Kim. *Accelerate: The Science of Lean
  Software and DevOps* (IT Revolution, 2018).
- Google Cloud DORA. *2022 State of DevOps Report* — source of
  the Elite / High / Medium / Low threshold bands.

## Posts

{% include post-list.liquid %}

# ADT DevOps - GitHub Actions
## Building a Full DevOps Pipeline with GitHub Actions

> **Repository purpose:** This is the starting-point repository for a guided learning journey through DevOps practices. You will use GitHub Actions workflow templates to build a realistic, incremental pipeline — stage by stage — around a Jekyll blog. The technical skills you develop here are transferable to any software project.

---

## Contents

- [How to Use This Guide](#how-to-use-this-guide)
- [Prerequisites](#prerequisites)
- [Repository Structure](#repository-structure)
- [Stage 1 — Foundations: Getting Something Live](#stage-1--foundations-getting-something-live)
- [Stage 2 — Containerisation: Reproducible Builds](#stage-2--containerisation-reproducible-builds)
- [Stage 3 — Continuous Integration: Testing Before Deploying](#stage-3--continuous-integration-testing-before-deploying)
- [Stage 4 — Security: Shifting Left](#stage-4--security-shifting-left)
- [Stage 5 — Infrastructure as Code](#stage-5--infrastructure-as-code-defining-infrastructure-in-version-control)
- [Stage 6 — Release Automation](#stage-6--configuration-management--release-automation)
- [Stage 7 — Automation & Feedback Loops](#stage-7--automation--feedback-loops)
- [Assessment Guidance](#assessment-guidance)
- [Workflow Reference Table](#workflow-reference-table)

---

## How to Use This Guide

Each stage builds directly on the last. **Do not skip ahead** — later stages assume the repository structure and workflows from earlier ones are already in place.

At each stage you will:

1. **Add** a GitHub Actions workflow from the templates available in this repository
2. **Observe** what changes in the Actions tab when you push or open a pull request
3. **Reflect** on what problem the workflow solves and what the risk would be without it

The reflection prompts at each stage are not optional extras — they are directly relevant to your summative assessment.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| A GitHub account | Free tier is sufficient |
| Git installed locally | Or use GitHub's web editor / Codespaces |
| Basic command-line familiarity | `cd`, `ls`, `git add/commit/push` |
| A text editor | VS Code recommended |

No prior DevOps experience is assumed. 

---

## Repository Structure

After completing all stages, your repository will look something like this:

```
.
├── .github/
│   └── workflows/
│       ├── pages.yml           # Stage 1
│       ├── jekyll-docker.yml   # Stage 2
│       ├── super-linter.yml    # Stage 3
│       ├── dependency-review.yml
│       ├── codeql.yml          # Stage 4
│       ├── trivy.yml
│       ├── scorecard.yml
│       ├── terraform.yml       # Stage 5
│       ├── docker-publish.yml  # Stage 6
│       ├── slsa.yml
│       ├── labeler.yml         # Stage 7
│       ├── stale.yml
│       └── ai-issue-summary.yml
├── _posts/
│   └── 2024-01-01-hello-world.md
├── _config.yml
├── index.md
├── Gemfile
└── README.md
```

The `_posts/`, `_config.yml`, `index.md`, and `Gemfile` files make up the minimal Jekyll site. Everything else is added as you work through the stages.

---

## Stage 1 — Foundations: Getting Something Live

**Core concepts:** Source control · Static site generators · GitHub Pages · Basic CI/CD

---

### What you are doing

The journey begins with the simplest possible deployment: publishing a Jekyll blog on GitHub Pages. This gives you a tangible, publicly visible outcome immediately and introduces the fundamental CI/CD loop:

```
code → commit → push → build → deploy
```

### Step-by-step

**1. Confirm your Jekyll site files are in place.** Your repository should already contain:

```
_config.yml
_posts/
    2024-01-01-hello-world.md
index.md
Gemfile
```

If any of these are missing, create them now. A minimal `_config.yml` looks like:

```yaml
title: My DevOps Blog
description: Built as part of a Level 5 DevOps learning guide.
theme: minima
```

A minimal post (`_posts/2024-01-01-hello-world.md`):

```markdown
---
layout: post
title: "Hello, World"
date: 2024-01-01
---

This is my first post. The pipeline that published it is the point.
```

**2. Add the workflow.** In GitHub, go to **Actions → New workflow** and search for **"GitHub Pages Jekyll"** (under the *Pages* category). The description reads: *"Package a Jekyll site with GitHub Pages dependencies preinstalled."*

Click **Configure**, review the YAML, and commit it to `main`.

**3. Enable GitHub Pages.** Go to **Settings → Pages** and set the source to **GitHub Actions**.

**4. Push a change.** Edit a post, commit, and push to `main`. Watch the **Actions** tab — you should see the workflow run, build the site, and deploy it. Your blog will be live at `https://<your-username>.github.io/<repo-name>/`.

### What to look for in the workflow YAML

```yaml
on:
  push:
    branches: ["main"]
```

This `on:` block is the **trigger**. It tells GitHub Actions to run this workflow whenever code is pushed to `main`. You will see this pattern in every workflow you add.

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/jekyll-build-pages@v1
```

Each **job** runs on a **runner** (a temporary virtual machine). Each job contains **steps** — individual actions or shell commands run in sequence.

### 💬 Reflection prompts

- What would happen if the workflow had no `on:` trigger? When would it run?
- What is the difference between a **build** step and a **deploy** step?
- Who (or what) is the "runner" in this pipeline, and where does it come from?

---

## Stage 2 — Containerisation: Reproducible Builds

**Core concepts:** Docker · Containerisation · Environment reproducibility

---

### What you are doing

The Stage 1 workflow uses GitHub-hosted dependencies that could change at any time. This stage introduces a containerised build, where the build environment itself is defined in code.

### Step-by-step

**1. Add the workflow.** Go to **Actions → New workflow** and search for **"Jekyll using Docker image"** (under *Continuous Integration / Suggested*). The description reads: *"Package a Jekyll site using the jekyll/builder Docker image."*

Commit this as a second workflow file — do not replace the Pages workflow.

**2. Compare the two YAML files side by side.** Open both workflow files and look for these key differences:

| Stage 1 (Pages) | Stage 2 (Docker) |
|---|---|
| Uses GitHub-managed action | Specifies a Docker image explicitly |
| Build environment is implicit | Build environment is defined in the YAML |
| Dependencies could drift | Dependencies are pinned to the image tag |

Look for the `container:` or `image:` key in the Docker workflow. This is the line that says: *"run this job inside this specific Docker image."*

**3. Trigger both workflows** by pushing a change and compare the results in the Actions tab.

### Key concept: "Works on my machine" is not good enough

In DevOps, an environment that exists only in one developer's head (or on one specific laptop) is a liability. If a dependency updates, your build should fail **loudly**, not silently produce a different result. Containers solve this by making the build environment explicit, version-controlled, and reproducible.

This connects directly to the DevOps principle of **immutable infrastructure**: the environment is treated like code — defined once, deployed consistently, never modified in place.

### 💬 Reflection prompts

- What is the risk of relying on `ubuntu-latest` as your runner without pinning dependency versions?
- If a colleague clones this repository and runs the Docker workflow, will they get the same result as you? Why?
- How does containerisation connect to the idea of *infrastructure as code* that you will encounter in Stage 5?

---

## Stage 3 — Continuous Integration: Testing Before Deploying

**Core concepts:** CI pipelines · Linting · Automated testing · Quality gates

---

### What you are doing

Before deploying anything, we should verify it is correct. This stage introduces **quality gates** — automated checks that must pass before code can be merged into `main`.

### Step-by-step

**1. Add the Super Linter workflow.** Go to **Actions → New workflow** and search for **"Super Linter"** (under *CI*). The description reads: *"Run linters for several languages on your code base for changed files."*

Super Linter is ideal for a Jekyll repository because it checks HTML, Markdown, YAML, and optionally JavaScript — all in a single workflow.

Set the trigger to run on `pull_request` events:

```yaml
on:
  pull_request:
    branches: ["main"]
```

**2. Add the Dependency Review workflow.** Search for **"Dependency Review"** (under *Security*). The description reads: *"Scans Pull Requests on each push for the introduction and/or resolution of vulnerable dependencies."*

This treats every dependency change as a potential security event. It runs on `pull_request` and will block a merge if a newly introduced dependency has a known vulnerability.

**3. Enable branch protection rules.** Go to **Settings → Branches → Add rule** for `main`. Enable:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
- Add your linting and dependency review workflows as required checks

From now on, code can only reach `main` if it passes your quality gates.

**4. Test your gates.** Create a new branch, introduce a deliberate Markdown error (e.g. a broken heading structure), and open a Pull Request. Watch Super Linter catch it before the code can be merged.

### CI vs CD: Understanding the distinction

| Continuous Integration (CI) | Continuous Deployment/Delivery (CD) |
|---|---|
| Checks and validates code | Releases code to an environment |
| Runs on pull requests | Runs on merges to main |
| *Should* something be merged? | *How* does it get deployed? |
| Fail fast, fail visibly | Deploy confidently, repeatedly |

Stage 1 gave you CD. Stage 3 gives you CI. Together, they form a proper CI/CD pipeline.

### 💬 Reflection prompts

- What is the difference between a **linter** and a **test**? Are both valuable? Why?
- What would happen to your team's workflow without branch protection rules?
- Why is it important that CI checks run on `pull_request` rather than on `push` to `main`?

---

## Stage 4 — Security: Shifting Left

**Core concepts:** DevSecOps · SAST · Supply chain security · Container scanning

---

### What you are doing

Security is introduced here as a **first-class part of the pipeline**, not an afterthought bolted on at the end. You will add three security-focused workflows that run automatically.

### The "shift left" principle

In traditional software development, security testing happened late — often after deployment. "Shifting left" means moving security checks earlier in the pipeline, closer to where code is written. The earlier a vulnerability is found, the cheaper it is to fix.

```
[Write code] → [Commit] → [PR] → [Merge] → [Build] → [Deploy] → [Production]
     ↑                      ↑                  ↑                       ↑
  Cheapest                  │               Expensive             Very expensive
  to fix                    │               to fix                to fix
                     Shift left means
                     catching issues HERE
```

### Step-by-step

**1. Add CodeQL Analysis.** Go to **Actions → New workflow** and search for **"CodeQL Analysis"** (under *Security*). This is GitHub's own semantic code analysis engine. Even for a Jekyll site with Ruby and JavaScript files, CodeQL can identify logic flaws, injection vulnerabilities, and unsafe patterns.

After adding this workflow, go to **Security → Code scanning** in your repository to see results displayed alongside your code.

**2. Add Trivy.** Search for **"Trivy"** (under *Security*). The description reads: *"Scan Docker container images for vulnerabilities in OS packages and language dependencies."*

Because your project now uses a Docker image (from Stage 2), Trivy can scan that image for known CVEs (Common Vulnerabilities and Exposures) in its OS packages and language dependencies. A vulnerability in a base image is your problem, even if you did not write the vulnerable code.

**3. Add OSSF Scorecard.** Search for **"OSSF Scorecard"** (under *Security*). The description reads: *"Static supply-chain security analysis tool to assess the security posture of your project."*

Scorecard does not just scan code — it assesses your *practices*: Are your dependencies pinned? Are workflow permissions minimal? Is branch protection enabled? It assigns your repository a score. Run it and review the output carefully — it will flag things you have already set up as well as things to improve.

### Understanding SARIF output

CodeQL and Trivy both produce results in **SARIF format** (Static Analysis Results Interchange Format). GitHub reads these files and displays findings directly in the **Security → Code scanning alerts** tab, with line-level annotations in pull requests. You do not need to parse the SARIF files yourself — just know that this is what connects the workflow output to the Security tab.

### 💬 Reflection prompts

- What is the difference between **SAST** (Static Application Security Testing) and scanning a Docker image with Trivy?
- Your OSSF Scorecard result is likely imperfect. Pick one failing check: what would you need to change to improve it, and why does it matter?
- If a critical vulnerability is found in a base Docker image you depend on, whose responsibility is it to fix it? How would your pipeline alert you to this?

---

## Stage 5 — Infrastructure as Code: Defining Infrastructure in Version Control

**Core concepts:** IaC · Terraform · Cloud infrastructure · Idempotency · Plan/apply separation

---

### What you are doing

Your blog is now well-tested and secure. This stage steps back from the application and considers the infrastructure it runs on. Even if GitHub Pages handles your hosting, real-world systems run on cloud infrastructure — and that infrastructure should be defined in code, not clicked together in a web console.

### Step-by-step

**1. Add the Terraform workflow.** Go to **Actions → New workflow** and search for **"Terraform"** by HashiCorp (under *Deployment*). The description reads: *"Set up Terraform CLI in your GitHub Actions workflow."*

**2. Write a minimal Terraform configuration.** Create a `terraform/` directory in your repository with a simple configuration. A good starting example is provisioning a cloud storage bucket (e.g. an AWS S3 bucket or a Google Cloud Storage bucket) — something that has no running cost but demonstrates the full Terraform workflow. Your facilitator will provide the specific cloud provider and credentials to use.

A minimal `terraform/main.tf` might look like:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_s3_bucket" "blog_assets" {
  bucket = "my-devops-blog-assets"

  tags = {
    Environment = "learning"
    ManagedBy   = "terraform"
  }
}
```

**3. Configure the workflow for plan/apply separation.** This is the most important practice in this stage. Edit the Terraform workflow YAML so that:

- On **pull request** → run `terraform plan` only (show what *would* change — do not make any changes)
- On **push to main** → run `terraform apply` (make the changes)

```yaml
- name: Terraform Plan
  if: github.event_name == 'pull_request'
  run: terraform plan -no-color

- name: Terraform Apply
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  run: terraform apply -auto-approve
```

This separation means a human reviews the plan output in the PR before any infrastructure is changed. It is the IaC equivalent of a code review.

**4. (Extension) Add IaC security scanning.** Search for **"tfsec"** or **"Snyk Infrastructure as Code"** (both under *Security*) to scan your Terraform files for misconfigurations before `terraform apply` is ever run. Common findings include overly permissive IAM policies, unencrypted storage buckets, and publicly accessible resources.

### Key concept: Idempotency

Terraform is **idempotent**: running `terraform apply` twice against unchanged configuration produces no second change. The tool calculates the difference between your *desired state* (the code) and the *actual state* (the cloud) and only makes the changes needed to close the gap. This makes infrastructure management predictable and safe to automate.

### 💬 Reflection prompts

- What is the risk of managing cloud infrastructure through a web console rather than code? Think about audit trails, team collaboration, and reproducibility.
- Why is plan/apply separation important? What could go wrong if `apply` ran automatically on every commit?
- How does IaC connect to the containerisation principle from Stage 2?

---

## Stage 6 — Configuration Management & Release Automation

**Core concepts:** Release management · Artefact publishing · Software provenance · Supply chain integrity

---

### What you are doing

With infrastructure defined as code and a secure CI pipeline in place, this stage focuses on how software is **packaged and released** in a way that is verifiable, versioned, and trustworthy.

### Step-by-step

**1. Add the Publish Docker Container workflow.** Go to **Actions → New workflow** and search for **"Publish Docker Container"** (under *CI*). The description reads: *"Build, test and push Docker image to GitHub Packages."*

This workflow builds your Jekyll Docker image (from Stage 2) and publishes it to **GitHub Container Registry (GHCR)** as a versioned, reusable artefact. Configure it to trigger on **release** events or on tagged commits (e.g. `v1.0.0`):

```yaml
on:
  push:
    tags:
      - 'v*.*.*'
```

After the workflow runs, go to your repository's **Packages** tab — you will see your Docker image listed there, tagged with the version number.

**2. Create a release tag** and watch the workflow publish the image:

```bash
git tag v1.0.0
git push origin v1.0.0
```

**3. Add the SLSA Generic Generator.** Search for **"SLSA Generic Generator"** (under *CI*). The description reads: *"Generate SLSA3 provenance for your existing release workflows."*

This is a sophisticated but important addition. **SLSA** (Supply chain Levels for Software Artefacts, pronounced "salsa") is a framework for proving *how* a software artefact was built — what source code it came from, which workflow built it, and that the build process was not tampered with. The generated provenance is attached to your release as a verifiable attestation.

### Why provenance matters

Imagine downloading a Docker image and having no way to verify whether it was built from the source code you can see, or whether someone injected malicious code into the build process. SLSA provenance provides a cryptographically verifiable chain from source to artefact. This is increasingly required in enterprise and government software supply chains.

The [SLSA framework](https://slsa.dev) defines four levels (0–3). Level 3, which this workflow targets, requires a hardened, isolated build environment with verifiable provenance — exactly what GitHub Actions provides when configured correctly.

### 💬 Reflection prompts

- What is the difference between a **Docker image** stored in a registry and the **source code** stored in your repository? Why do both need version control?
- If someone downloaded your published Docker image, how could SLSA provenance help them trust it?
- What does **semantic versioning** (e.g. `v1.2.3`) communicate to a consumer of your artefact? Why is it preferable to tagging every commit as `latest`?

---

## Stage 7 — Automation & Feedback Loops

**Core concepts:** Toil reduction · Workflow automation · DORA metrics · Team practices

---

### What you are doing

The final stage shifts focus from automating the *build* to automating the *process* around the build. These workflows reduce **toil** — the manual, repetitive work that keeps a project running but adds no lasting value — and help enforce healthy team norms at scale.

### Step-by-step

**1. Add the Labeler workflow.** Go to **Actions → New workflow** and search for **"Labeler"** (under *Automation*). This workflow automatically applies labels to pull requests based on which files were changed.

Create a `.github/labeler.yml` configuration file to define your label rules:

```yaml
content:
  - _posts/**
  - index.md

infrastructure:
  - terraform/**

ci:
  - .github/workflows/**

dependencies:
  - Gemfile
  - Gemfile.lock
```

Now when a contributor opens a PR touching `_posts/`, it is automatically labelled `content`. A PR touching `terraform/` is labelled `infrastructure`. This makes triage effortless — especially in a team with many open PRs.

**2. Add the Stale workflow.** Search for **"Stale"** (under *Automation*). This workflow automatically marks issues and pull requests as stale if they have had no activity for a configurable number of days, and optionally closes them after a further period.

```yaml
- uses: actions/stale@v9
  with:
    stale-issue-message: 'This issue has had no activity for 30 days and has been marked as stale.'
    stale-pr-message: 'This PR has had no activity for 14 days and has been marked as stale.'
    days-before-stale: 30
    days-before-close: 7
```

A healthy backlog is not just about adding things — it is about removing things that are no longer relevant.

**3. Add the AI Issue Summary workflow.** Search for **"AI Issue Summary"** (under *Automation*). This workflow uses an AI model to automatically generate a structured summary whenever a new issue is opened, helping maintainers and triagers quickly understand the context without reading every detail.

This is a useful discussion point: AI-augmented DevOps workflows are increasingly common. The automation still requires human judgement — the AI produces a summary, not a decision.

### Connecting to DORA metrics

The [DORA metrics](https://dora.dev) are the industry-standard measures of DevOps performance:

| Metric | What it measures | How your pipeline affects it |
|---|---|---|
| **Deployment frequency** | How often you deploy | Automated CD (Stage 1) removes the friction |
| **Lead time for changes** | Time from commit to production | CI gates (Stage 3) prevent long-running rework cycles |
| **Change failure rate** | % of deployments causing failures | Quality gates and security scanning reduce failures |
| **Time to restore service** | How quickly you recover | IaC (Stage 5) means infrastructure can be rebuilt quickly |

The automation in this stage directly reduces **lead time** by removing manual triage steps. Stale issue management improves team **flow** — one of the human factors that DORA research consistently identifies as a predictor of high performance.

### 💬 Reflection prompts

- What is **toil** in a DevOps context? Give one example from your own workflow that could be automated with a GitHub Actions trigger.
- Which DORA metric do you think your pipeline has improved the most? Which is hardest to measure from your pipeline alone?
- The AI Issue Summary workflow uses AI to assist a human process. What are the risks of over-relying on this kind of automation?

---

## Assessment Guidance

Your summative assessment asks you to demonstrate a working DevOps pipeline and reflect on it. Here is how each stage of this guide maps to the assessment criteria.

> Refer to your Assessment Brief for the full criteria descriptions and weightings.

| Assessment criterion | Relevant stages | What to demonstrate |
|---|---|---|
| **Practical Skills (40%)** | All stages | Working workflows in the Actions tab; successful deployments; pipeline artefacts |
| **Knowledge & Understanding (20%)** | Stages 1–4 | Explain what each workflow does and why it exists in the pipeline |
| **Design & Architecture (20%)** | Stages 3–6 | Explain the pipeline as a system: how stages interact, why the order matters |
| **Reflection on Practice (20%)** | All stages | Use the reflection prompts; discuss what you would change and what you learned |

### Suggested demonstration structure

A strong summative demo will show the **full pipeline running end-to-end**:

1. **Open a pull request** with a new blog post
   - Super Linter runs and reports on the PR ✅
   - Dependency Review runs and reports on the PR ✅
   - Terraform plan output appears as a PR comment (if infrastructure is touched) ✅
2. **Merge the pull request**
   - GitHub Pages deployment triggers automatically ✅
   - OSSF Scorecard runs on main ✅
3. **Create a release tag**
   - Docker image is published to GitHub Packages ✅
   - SLSA provenance is generated and attached ✅
4. **Walk through your reflection**
   - For each workflow: what does it do, what problem does it solve, what would be the risk without it?

### A note on reflection

The strongest reflections in DevOps do not just describe what a tool does — they articulate **why a practice exists** and what **trade-offs** it involves. For example:

- *Not this:* "Super Linter checks the code for errors."
- *But this:* "Super Linter enforces consistent code quality automatically, which reduces the cognitive load on reviewers and catches issues before they reach main. The trade-off is that configuring it too strictly can generate noise and slow down the feedback loop — so the linting rules should be agreed on by the team."

---

## Workflow Reference Table

| Stage | Workflow | Category | Key concept introduced |
|---|---|---|---|
| 1 | GitHub Pages Jekyll | Pages | Basic CD; triggers; runners; steps |
| 2 | Jekyll using Docker image | CI / Suggested | Containerised builds; reproducibility |
| 3 | Super Linter | CI | Linting; automated quality gates |
| 3 | Dependency Review | Security | PR-time security checks |
| 4 | CodeQL Analysis | Security | SAST; shift left; SARIF |
| 4 | Trivy | Security | Container image vulnerability scanning |
| 4 | OSSF Scorecard | Security | Supply chain posture; security practices |
| 5 | Terraform | Deployment | IaC; plan/apply separation; idempotency |
| 5 | tfsec / Snyk IaC | Security | IaC misconfiguration scanning |
| 6 | Publish Docker Container | CI | Artefact management; container registries |
| 6 | SLSA Generic Generator | CI | Software provenance; supply chain integrity |
| 7 | Labeler | Automation | PR triage automation; toil reduction |
| 7 | Stale | Automation | Backlog hygiene |
| 7 | AI Issue Summary | Automation | AI-augmented DevOps workflows |

---

## Useful References

- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [GitHub Actions workflow templates](https://github.com/actions/starter-workflows)
- [DORA metrics](https://dora.dev)
- [SLSA framework](https://slsa.dev)
- [OSSF Scorecard](https://securityscorecards.dev)
- [Terraform documentation](https://developer.hashicorp.com/terraform/docs)
- [Docker documentation](https://docs.docker.com)

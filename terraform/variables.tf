variable "repository_owner" {
  description = "The GitHub user or organisation that owns the repository."
  type        = string
  default     = "Eliza-French"
}

variable "repository_name" {
  description = "The repository name (slug) under the owner."
  type        = string
  default     = "level6-cicd-pipeline"
}

variable "required_status_checks" {
  description = <<-EOT
    Status check names that must pass before a PR can be merged to main.
    Each entry must match the "context" string GitHub reports for that
    check — which, for workflows in this repo, is simply the bare job
    name (or the job's display `name:`). GitHub does NOT prefix the
    workflow name, and does NOT append the event trigger. Example:

      workflow: "Jekyll site CI"  job: "build"  →  context: "build"
      workflow: "CodeQL Advanced" job: "analyze" with a matrix on
        `language: actions` →  context: "Analyze (actions)"

    The authoritative list is what `gh pr view <N> --json
    statusCheckRollup` returns for a recent PR, or the left-hand
    labels under "All checks have passed" on the PR's checks tab.
    A mismatched context never matches and leaves branch protection
    waiting forever with no UI indication of the typo.
  EOT
  type        = list(string)
  default = [
    "run-lint",
    "dependency-review",
    "Analyze (actions)",
    "build",
  ]
}

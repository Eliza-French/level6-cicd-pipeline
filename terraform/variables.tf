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
    Each entry must match the full GitHub context string exactly as it
    appears on the PR's checks tab, including any event qualifier that
    GitHub appends when a workflow is triggered by multiple events
    (push + pull_request, etc.). The format is:

      "<workflow name> / <job name> (<event>)"

    A bare workflow name or a name missing the "(pull_request)" suffix
    will never match and will leave the check waiting forever. The
    safest way to populate this list is to copy the strings straight
    from the "Successful checks" section of a recent PR.
  EOT
  type        = list(string)
  default = [
    "Lint Code Base / run-lint (pull_request)",
    "Dependency Review / dependency-review (pull_request)",
    "CodeQL Advanced / Analyze (actions) (pull_request)",
    "Jekyll site CI / build (pull_request)",
  ]
}

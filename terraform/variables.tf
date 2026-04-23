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
    Each entry must be the full GitHub context string, which is
    "<workflow name> / <job name>" as reported on the PR's checks tab.
    A bare workflow name (e.g. "Lint Code Base") will never match and
    will leave the check waiting forever.
  EOT
  type        = list(string)
  default = [
    "Lint Code Base / run-lint",
    "Dependency Review / dependency-review",
    "CodeQL Advanced / Analyze (actions)",
    "Jekyll site CI / build",
  ]
}

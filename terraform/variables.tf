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
  description = "Status check names that must pass before a PR can be merged to main."
  type        = list(string)
  default = [
    "Lint Code Base",
    "dependency-review",
    "Analyze (actions)",
    "Build",
  ]
}

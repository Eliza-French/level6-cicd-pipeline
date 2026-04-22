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

variable "required_approving_review_count" {
  description = "How many approving reviews a PR needs before it can be merged."
  type        = number
  default     = 1
}

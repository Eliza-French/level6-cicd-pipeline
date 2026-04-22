# The GitHub provider authenticates via the GITHUB_TOKEN env var. A
# fine-grained personal access token with Contents:read and
# Administration:write on this repository is the minimum required to
# manage branch protection. In CI, a PAT stored as a secret (not the
# default GITHUB_TOKEN, which lacks admin scope) is required for apply.
provider "github" {
  owner = var.repository_owner
}

# Reference the existing repository as a data source rather than managing
# it as a resource. This keeps Terraform's scope intentionally narrow:
# only the governance rules below are under IaC for now; repo metadata
# (description, topics, visibility) stays out until it is explicitly
# migrated in a later increment.
data "github_repository" "this" {
  name = var.repository_name
}

# Branch protection for main. This is the codified equivalent of the
# Settings -> Branches rule you would otherwise configure by hand.
# Required status checks are declared here once; any future change
# goes through a PR against this file, producing the audit trail that
# click-ops cannot.
#
# Required pull request reviews are deliberately omitted: this is a
# single-contributor project and a self-approval gate would only add
# friction. In a team setting the block below would be re-enabled.
resource "github_branch_protection" "main" {
  repository_id = data.github_repository.this.node_id
  pattern       = "main"

  required_status_checks {
    strict   = true
    contexts = var.required_status_checks
  }

  enforce_admins      = true
  allows_deletions    = false
  allows_force_pushes = false
}

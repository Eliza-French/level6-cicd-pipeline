# The GitHub provider authenticates via the GITHUB_TOKEN env var. A
# fine-grained personal access token with Contents:read and
# Administration:write on this repository is the minimum required to
# manage branch protection. In CI, a PAT stored as a secret (not the
# default GITHUB_TOKEN, which lacks admin scope) is required for apply.
provider "github" {
  owner = var.repository_owner
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
#
# repository_id accepts either a node_id (resolved via a data source)
# or the bare repository name. The name form is used here because the
# github_repository data source fetches /pages, which can return 404
# under some token-scope configurations even when Pages is working,
# blocking the plan with no useful diagnostic.
resource "github_branch_protection" "main" {
  repository_id = var.repository_name
  pattern       = "main"

  required_status_checks {
    strict   = true
    contexts = var.required_status_checks
  }

  enforce_admins      = true
  allows_deletions    = false
  allows_force_pushes = false
}

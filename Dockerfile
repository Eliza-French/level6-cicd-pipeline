# Reproducible Jekyll image. Version-pinned so the build is deterministic
# and so Trivy has a stable target to scan for CVEs on every push and PR.
FROM jekyll/builder:3.8.5

WORKDIR /srv/jekyll

COPY . .

EXPOSE 4000

CMD ["jekyll", "serve", "--host", "0.0.0.0"]

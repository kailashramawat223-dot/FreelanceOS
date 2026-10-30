#!/usr/bin/env bash
# Usage: ./push-to-github.sh https://github.com/<you>/freelanceos.git
set -e
[ -z "$1" ] && echo "Usage: $0 <github-repo-url>" && exit 1
git init -q 2>/dev/null || true
git add -A
git commit -qm "FreelanceOS prototype - SPHINX'26" || true
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin "$1"
git push -u origin main
echo "Pushed. Now connect the repo on https://render.com (New > Blueprint) - render.yaml is already included."

#!/usr/bin/env bash
set -euo pipefail

apply=false
if [[ "${1:-}" == "--apply" ]]; then
  apply=true
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd "${script_dir}/.." && pwd)"
current_name="$(basename "${repo_dir}")"
parent_dir="$(dirname "${repo_dir}")"
target_dir="${parent_dir}/dama-dashboard"

echo "Repository: ${repo_dir}"
echo "Current folder name: ${current_name}"

if [[ "${current_name}" == "dama-dashboard" ]]; then
  echo "Folder already matches dama-dashboard."
  exit 0
fi

if [[ -e "${target_dir}" ]]; then
  echo "Target path already exists: ${target_dir}"
  exit 1
fi

echo
echo "Planned folder rename command:"
echo "  mv \"${repo_dir}\" \"${target_dir}\""

remote_url=""
if git -C "${repo_dir}" remote get-url origin >/dev/null 2>&1; then
  remote_url="$(git -C "${repo_dir}" remote get-url origin)"
fi

new_remote_url=""
if [[ -n "${remote_url}" && "${remote_url}" == *"nova-dashboard"* ]]; then
  new_remote_url="${remote_url//nova-dashboard/dama-dashboard}"
  echo
  echo "Planned git remote update command:"
  echo "  git -C \"${target_dir}\" remote set-url origin \"${new_remote_url}\""
fi

if [[ "${apply}" != true ]]; then
  echo
  echo "Dry run only. Re-run with --apply to execute after prompts."
  exit 0
fi

read -r -p "Rename the parent folder to dama-dashboard? [y/N] " rename_confirm
if [[ ! "${rename_confirm}" =~ ^([yY]|yes|YES)$ ]]; then
  echo "Folder rename skipped."
  exit 0
fi

mv "${repo_dir}" "${target_dir}"
echo "Folder renamed to: ${target_dir}"

if [[ -n "${new_remote_url}" ]]; then
  read -r -p "Update git origin remote to the dama-dashboard URL? [y/N] " remote_confirm
  if [[ "${remote_confirm}" =~ ^([yY]|yes|YES)$ ]]; then
    git -C "${target_dir}" remote set-url origin "${new_remote_url}"
    echo "Git origin remote updated."
  else
    echo "Git origin remote unchanged."
  fi
fi

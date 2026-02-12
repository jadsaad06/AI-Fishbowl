#!/usr/bin/env bash
set -euo pipefail

MIC_MATCH="${MIC_MATCH:-LavMicro}"

usage() {
  cat <<EOF
Usage: $(basename "$0") <mute|unmute|status>

Examples:
  $(basename "$0") mute
  $(basename "$0") unmute
  $(basename "$0") status
EOF
}

require_pactl() {
  if ! command -v pactl >/dev/null 2>&1; then
    echo "Error: pactl not found. Install PulseAudio/PipeWire tools." >&2
    exit 1
  fi
}

resolve_source() {
  local source

  # Fast path: source name contains LavMicro and is not a sink monitor.
  source="$(
    pactl list short sources | awk -v pat="$MIC_MATCH" '
      BEGIN { IGNORECASE=1 }
      $0 ~ pat && $2 !~ /\.monitor$/ { print $2; exit }
    '
  )"
  if [[ -n "$source" ]]; then
    printf '%s\n' "$source"
    return 0
  fi

  # Fallback: any matching source name, including monitor sources.
  source="$(pactl list short sources | awk -v pat="$MIC_MATCH" 'BEGIN{IGNORECASE=1} $0 ~ pat {print $2; exit}')"
  if [[ -n "$source" ]]; then
    printf '%s\n' "$source"
    return 0
  fi

  # Fallback: source description contains the LavMicro identifier.
  source="$(
    pactl list sources | awk -v pat="$MIC_MATCH" '
      BEGIN { IGNORECASE=1; name="" }
      /^Source #[0-9]+/ { name="" }
      /^[[:space:]]*Name:[[:space:]]*/ { name=$2 }
      /^[[:space:]]*Description:[[:space:]]*/ && name !~ /\.monitor$/ {
        desc=$0
        sub(/^[[:space:]]*Description:[[:space:]]*/, "", desc)
        if (desc ~ pat && name != "") {
          print name
          exit
        }
      }
    '
  )"
  if [[ -n "$source" ]]; then
    printf '%s\n' "$source"
    return 0
  fi

  return 1
}

main() {
  local action="${1:-}"
  local source

  case "$action" in
    mute|unmute|status) ;;
    *)
      usage >&2
      exit 1
      ;;
  esac

  require_pactl

  if ! source="$(resolve_source)"; then
    echo "Error: no source matched '$MIC_MATCH'." >&2
    echo "Tip: set MIC_MATCH to a different identifier if needed." >&2
    exit 1
  fi

  case "$action" in
    mute)
      pactl set-source-mute "$source" true
      ;;
    unmute)
      pactl set-source-mute "$source" false
      ;;
    status)
      ;;
  esac

  echo "Source: $source"
  pactl get-source-mute "$source"
}

main "$@"

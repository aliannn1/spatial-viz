#!/bin/sh
set -eu

WEB_ROOT="/usr/share/nginx/html"
DATA_DIR="${SPATIALVIZ_DATA_DIR:-/data}"

echo "[spatial-viz] web root: ${WEB_ROOT}"
echo "[spatial-viz] data dir: ${DATA_DIR}"

rm -rf "${WEB_ROOT:?}/spatial-viz"
ln -s "${WEB_ROOT}" "${WEB_ROOT}/spatial-viz"
echo "[spatial-viz] path prefix enabled: /spatial-viz/"

if [ -d "${DATA_DIR}" ]; then
  if [ -f "${DATA_DIR}/datasets.config.json" ]; then
    echo "[spatial-viz] using mounted datasets.config.json"
    cp "${DATA_DIR}/datasets.config.json" "${WEB_ROOT}/datasets.config.json"
  fi

  for path in "${DATA_DIR}"/*; do
    [ -e "${path}" ] || continue
    name="$(basename "${path}")"
    case "${name}" in
      datasets.config.json|README.md|*.md)
        continue
        ;;
    esac
    if [ -d "${path}" ]; then
      echo "[spatial-viz] linking dataset: ${name}"
      rm -rf "${WEB_ROOT:?}/${name}"
      ln -s "${path}" "${WEB_ROOT}/${name}"
    fi
  done
else
  echo "[spatial-viz] data dir does not exist, starting with packaged demo/config only"
fi

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

UNIT_TESTS=$(rg --files "$ROOT_DIR/services" "$ROOT_DIR/nodeops" | rg "\.test\.ts$" | tr '\n' ' ')
INTEGRATION_TESTS=$(rg --files "$ROOT_DIR/tests/integration" | rg "\.test\.ts$" | tr '\n' ' ')
E2E_TESTS=$(rg --files "$ROOT_DIR/tests/e2e" | rg "\.test\.ts$" | tr '\n' ' ')

if [[ -z "${UNIT_TESTS// }" ]]; then
  echo "no unit tests found"
  exit 1
fi

echo "[gate] unit tests"
node --test $UNIT_TESTS

if [[ -n "${INTEGRATION_TESTS// }" ]]; then
  echo "[gate] integration tests"
  node --test $INTEGRATION_TESTS
fi

if [[ -n "${E2E_TESTS// }" ]]; then
  echo "[gate] e2e tests"
  node --test $E2E_TESTS
fi

echo "[gate] all checks passed"

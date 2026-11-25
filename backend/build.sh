#!/usr/bin/env bash
# Render build command: ./build.sh
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

if [ "${SEED_DEMO_DATA:-False}" = "True" ]; then
  python manage.py seed_data
fi

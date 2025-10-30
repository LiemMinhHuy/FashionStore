#!/bin/bash
# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Start the server
gunicorn fashion_store.fashion_store.wsgi:application --bind 0.0.0.0:$PORT
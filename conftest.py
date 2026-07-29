# Presence of this file at the project root puts the root on sys.path, so the
# tests can `import app` whether invoked as `pytest` or `python -m pytest`.
import os

# app.py refuses to import without SECRET_KEY unless it is being run as a script
# (see the comment there). The tests import it as a module — the same path a real
# server takes — so hand them a throwaway key. setdefault, so a key already in the
# environment still wins.
os.environ.setdefault('SECRET_KEY', 'test-only-key')

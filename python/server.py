# Simple dynamic-function API server
# PORT can be changed here
PORT = 3100

import os
import importlib.util
from flask import Flask, request, jsonify

APP = Flask(__name__)
FUNCTIONS_DIR = os.path.join(os.path.dirname(__file__), "functions")

def load_module_from_path(name, path):
  spec = importlib.util.spec_from_file_location(name, path)
  mod = importlib.util.module_from_spec(spec)
  spec.loader.exec_module(mod)
  return mod

def create_endpoint(func_name, func):
  route = f"/{func_name}"
  def handler():
    data = request.get_json(force=True, silent=True) or {}
    # call function with keyword args if possible, otherwise positional
    try:
      result = func(**data)
    except TypeError:
      # fallback: pass whole body as single arg
      result = func(data)
    return jsonify({"input": data, "output": result})
  handler.__name__ = f"handler_{func_name}"
  APP.route(route, methods=["POST"])(handler)

def discover_and_register():
  if not os.path.isdir(FUNCTIONS_DIR):
    return
  for fname in os.listdir(FUNCTIONS_DIR):
    if not fname.endswith(".py") or fname.startswith("_"):
      continue
    func_name = os.path.splitext(fname)[0]
    path = os.path.join(FUNCTIONS_DIR, fname)
    mod = load_module_from_path(func_name, path)
    # expect each module to expose a callable named "run" or the module-level function with same name
    target = None
    if hasattr(mod, "run") and callable(getattr(mod, "run")):
      target = getattr(mod, "run")
    elif hasattr(mod, func_name) and callable(getattr(mod, func_name)):
      target = getattr(mod, func_name)
    else:
      # look for any single callable in module
      callables = [getattr(mod, a) for a in dir(mod) if callable(getattr(mod, a)) and not a.startswith("_")]
      if callables:
        target = callables[0]
    if target:
      create_endpoint(func_name, target)

discover_and_register()

if __name__ == "__main__":
  APP.run(host="0.0.0.0", port=PORT)

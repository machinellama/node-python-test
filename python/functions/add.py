# Exposes add(a, b) or run({...}) depending how server calls it

def add(first: int, second: int):
  return {"result": first + second}

# support run(...) signature if desired
def run(first: int, second: int):
  return add(first, second)

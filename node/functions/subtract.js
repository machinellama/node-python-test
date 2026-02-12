// Expects an object { first, second }
function subtract({ first, second }) {
  first = Number(first) || 0;
  second = Number(second) || 0;
  return { result: first - second };
}

module.exports = { run: subtract, subtract };

// Expects an object { first, second }
function add({ first, second }) {
  first = Number(first) || 0;
  second = Number(second) || 0;
  return { result: first + second };
}

module.exports = { run: add, add };

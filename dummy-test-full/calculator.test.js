const add = require('./calculator');

test('add(2, 3) should return 5', () => {
  expect(add(2, 3)).toBe(5);
});
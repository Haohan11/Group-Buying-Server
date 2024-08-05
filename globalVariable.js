export const routesSet = (() => {
  const signCount = 15;
  const warningCount = 5;
  const warning = (...message) =>
    console.log(
      "\n" +
        `${"!".repeat(signCount)} ${[...message].join(" ")} ${"!".repeat(
          signCount
        )} \n`.repeat(warningCount)
    );

  const dict = new Set();
  const add = dict.add.bind(dict);

  dict.add = function (key) {
    if (dict.has(key)) warning("Duplicate regist route:", key);

    add(key);
  };

  return dict;
})();

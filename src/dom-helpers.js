export function includes(item, nodeList) {
  for (let i = 0; i < nodeList.length; i++) {
    if (item === nodeList[i]) {
      return true;
    }
  }
  return false;
}

export function flatten(arrayOfArrays) {
  return arrayOfArrays.reduce((result, arr) => {
    result.push(...arr);
    return result;
  }, []);
}

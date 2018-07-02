function getTransformValue(to) {
  return Object.keys(to)
    .filter(prop => prop === 'translateX' || prop === 'translateY')
    .reduce((acc, prop) => {
      acc.push(`${prop}(${to[prop]}px)`);
      return acc;
    }, [])
    .join(' ');
}

export function animate({ targets, to, duration, transition }) {
  let timer1;
  let timer2;
  const animationData = {
    animations: [],
    completed: false,
    pause: () => {},
    destroy: () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    },
  };
  const promise = new Promise(resolve => {
    timer1 = setTimeout(() => {
      targets.forEach(node => {
        node.style.transition = transition;
        const transformValue = getTransformValue(to);

        if (transformValue) {
          node.style.transform = transformValue;
        }
        if (to.opacity != null) {
          node.style.opacity = 1;
        }
      });
      timer2 = setTimeout(resolve, duration);
    });
  });
  animationData.finished = promise.then(res => {
    animationData.completed = true;
    return res;
  });
  return animationData;
}

const elem = (type = 'div', className = '') => {
  const el = document.createElement(type);

  if (className) {
    el.className = className;
  }

  return el;
};

const icon = (name) => {
  const i = elem('i', 'material-icons material-inline');

  if (name) {
    i.appendChild(document.createTextNode(name));
  } else {
    i.appendChild(document.createTextNode('cancel'));
    i.classList.add('invisible');
  }

  return i;
};

export default (...items) => {
  return new Promise((resolve) => {
    const container = elem('div', 'menu');
    const menu = elem('ul', 'limit');

    container.appendChild(menu);

    const hasIcons = !!items.find(i => !!i.icon);

    items.forEach(item => {
      const el = elem('li');

      if (item.meta === true) {
        el.classList.add('meta');
      } else if (hasIcons) {
        el.appendChild(icon(item.icon));
      }

      el.appendChild(document.createTextNode(item.text));

      if (item.meta !== true) {
        el.onclick = () => {
          resolve(item);
          container.remove();
        };
      }

      menu.appendChild(el);
    });

    document.body.appendChild(container);
  });
};

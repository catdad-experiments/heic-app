const key = 'heic-app';
const read = () => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : {};
  } catch (e) {
    return {};
  }
};
const write = (obj) => {
  localStorage.setItem(key, JSON.stringify(obj));
};

export default {
  get(name) {
    return read()[name];
  },
  set(name, value) {
    const obj = read();
    obj[name] = value;
    write(obj);
  }
};

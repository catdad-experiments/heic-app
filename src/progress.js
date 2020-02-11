const elem = document.createElement('div');
elem.classList.add('progress');
const spinner = document.createElement('div');
spinner.classList.add('ring');

elem.appendChild(spinner);

export default {
  show() {
    if (!elem.parentElement) {
      document.body.appendChild(elem);
    }
  },
  hide() {
    if (elem.parentElement) {
      document.body.removeChild(elem);
    }
  }
};

const progress = document.querySelector('#progress');

export default {
  show() {
    progress.classList.add('in-progress');
  },
  hide() {
    progress.classList.remove('init');
    progress.classList.remove('in-progress');
  }
};

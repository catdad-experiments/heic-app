export default ({ events }) => {
  const onDrop = ev => {
    ev.stopPropagation();
    ev.preventDefault();

    const { files } = ev.dataTransfer;

    events.emit('open', { files });
  };

  const onDrag = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
  };

  window.addEventListener('drop', onDrop);
  window.addEventListener('dragover', onDrag);

  return () => {
    window.removeEventListener('drop', onDrop);
    window.removeEventListener('dragover', onDrag);
  };
};

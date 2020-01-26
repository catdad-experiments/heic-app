/* global libheif */

const readFile = file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = e => {
      reject(e);
    };

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.readAsArrayBuffer(file);
  });
};

const series = async (items, iterator) => {
  for (let i = 0, l = items.length; i < l; i++) {
    await iterator(items[i], i);
  }
};

const render = async (arrayBuffer) => {
  const canvas = document.createElement('canvas');

  const { image, width, height } = await new Promise((resolve, reject) => {
    const decoder = new libheif.HeifDecoder();
    const data = decoder.decode(arrayBuffer);

    if (!data.length) {
      return reject(new Error('HEIF image not found'));
    }

    const image = data[0];
    const width = image.get_width();
    const height = image.get_height();

    resolve({ image, width, height });
  });

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  const imageData = context.createImageData(width, height);

  await new Promise((resolve, reject) => {
    image.display(imageData, (displayData) => {
      if (!displayData) {
        return reject(new Error('HEIF processing error'));
      }

      // get the ArrayBuffer from the Uint8Array
      resolve(displayData.data.buffer);
    });
  });

  context.putImageData(imageData, 0, 0);

  return canvas;
};

export default ({ events }) => {
  const onDrop = ev => {
    ev.stopPropagation();
    ev.preventDefault();

    const { files } = ev.dataTransfer;

    series(files, async file => {
      const arrayBuffer = await readFile(file);

      // TODO check if is heic

      const canvas = await render(arrayBuffer);

      console.log(file.name, arrayBuffer, canvas);
    }).catch(err => {
      events.emit('error', err);
    });
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

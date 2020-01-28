/* global libheif */
/* eslint-disable no-console */

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

const loadUrl = (img, url) => {
  return new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = e => reject(e);
    img.src = url;
  });
};

// based on https://github.com/oaleynik/is-heic
const isHeic = function (buffer) {
  if (!buffer || buffer.length < 24) {
    return false;
  }

  return buffer[20] === 0x68 && buffer[21] === 0x65 && buffer[22] === 0x69 && buffer[23] === 0x63;
};

export default ({ events }) => {
  const container = document.querySelector('#main');

  const onConvert = ({ files }) => {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    series(files, async file => {
      console.log('reading', file.name);
      const arrayBuffer = await readFile(file);

      const valid = isHeic(new Uint8Array(arrayBuffer.slice(0, 24)));
      console.log('is heic?', file.name, valid);
      // TODO if not heic, do something

      console.log('converting', file.name);
      const canvas = await render(arrayBuffer);

      console.log('displaying', file.name);
      const img = document.createElement('img');
      await loadUrl(img, canvas.toDataURL('image/jpeg'));
      img.setAttribute('data-name', file.name.split('.').slice(0, -1).join('.').concat('.jpg'));

      console.log('downloading', file.name);
      container.appendChild(img);
    }).catch(err => {
      events.emit('error', err);
    });
  };

  events.on('convert', onConvert);

  return () => {
    events.off('convert', onConvert);
  };
};

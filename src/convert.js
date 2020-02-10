/* global libheif */
/* eslint-disable no-console */

const EXTENSIONS = {
  'image/png': 'png',
  'image/jpeg': 'jpg'
};

const series = async (items, iterator) => {
  for (let i = 0, l = items.length; i < l; i++) {
    await iterator(items[i], i);
  }
};

const readFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader();

  reader.onerror = e => {
    reject(e);
  };

  reader.onload = () => {
    resolve(reader.result);
  };

  reader.readAsArrayBuffer(file);
});

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

const loadUrl = (img, url) => new Promise((resolve, reject) => {
  img.onload = () => resolve();
  img.onerror = e => reject(e);
  img.src = url;
});

const toBlob = (canvas, mime = 'image/jpeg', quality = 0.92) => new Promise(resolve => {
  canvas.toBlob(blob => resolve(blob), mime, quality);
});

const uint8ArrayUtf8ByteString = (array, start, end) => {
  return String.fromCharCode(...array.slice(start, end));
};

// code adapted from: https://github.com/sindresorhus/file-type/blob/6f901bd82b849a85ca4ddba9c9a4baacece63d31/core.js#L428-L438
const isHeic = (buffer) => {
  const brandMajor = uint8ArrayUtf8ByteString(buffer, 8, 12).replace('\0', ' ').trim();

  switch (brandMajor) {
    case 'mif1':
    case 'msf1':
    case 'heic':
    case 'heix':
    case 'hevc':
    case 'hevx':
      return true;
  }

  return false;
};

export default ({ events }) => {
  const container = document.querySelector('#main');

  const onConvert = ({ files, quality, result }) => {
    const extension = EXTENSIONS[quality.mime];

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    series(files, async file => {
      const output = file.name.split('.').slice(0, -1).join('.').concat(`.${extension}`);

      console.log(`reading ${file.name} to ${output}`);
      const arrayBuffer = await readFile(file);

      const valid = isHeic(new Uint8Array(arrayBuffer.slice(0, 24)));

      if (!valid) {
        return void events.emit('warn', new Error(`"${file.name}" is not a HEIC image`));
      }

      console.log(`converting ${file.name} to ${output}`);
      const canvas = await render(arrayBuffer);

      if (result === 'display') {
        console.log(`displaying ${file.name} to ${output}`);
        const img = document.createElement('img');
        await loadUrl(img, canvas.toDataURL(quality.mime, quality.quality));

        // TODO figure out if I can set the name of an image
        img.setAttribute('data-name', output);
        //  img.setAttribute('download', output);
        //  img.setAttribute('filename', output);
        //  img.setAttribute('alt', output);
        //  img.setAttribute('name', output);

        container.appendChild(img);
      } else {
        console.log(`downloading ${file.name} to ${output}`);
        const blob = await toBlob(canvas, quality.mime, quality.quality);
        events.emit('download', { blob, filename: output });
      }
    }).then(() => {
      if (result === 'display') {
        events.emit('info', `Right-click or long press to save ${files.length > 1 ? 'images' : 'image'}`);
      }
    }).catch(err => {
      events.emit('error', err);
    });
  };

  events.on('convert', onConvert);

  return () => {
    events.off('convert', onConvert);
  };
};

/* eslint-disable no-console */

let events = (function () {
  let collection = [];

  return {
    emit: (...args) => {
      collection.push(args);
    },
    flush: function (emitter) {
      collection.forEach((args) => {
        emitter.emit(...args);
      });
    }
  };
}());

//window.addEventListener('beforeinstallprompt', (ev) => {
//  console.log('👀 we can install the app now');
//  events.emit('can-install', { prompt: ev });
//});
//
//window.addEventListener('appinstalled', () => {
//  events.emit('info', '🎊 installed 🎊');
//});
//
//if ('serviceWorker' in navigator) {
//  console.log('👍', 'navigator.serviceWorker is supported');
//
//  navigator.serviceWorker.register('./service-worker.js', { scope: './' }).then(() => {
//    console.log('👍', 'worker registered');
//  }).catch(err => {
//    console.warn('👎', 'worker errored', err);
//  });
//
//  navigator.serviceWorker.addEventListener('message', (ev) => {
//    const data = ev.data;
//
//    if (data.action === 'log') {
//      return void console.log('worker:', ...data.args);
//    }
//
//    if (data.action === 'load-image') {
//      events.emit('file-share', { file: data.file });
//    }
//
//    console.log('worker message', ev.data);
//  });
//}

export default () => {
  function onMissingFeatures(missing) {
    const text = `<p>It seems your browser is not supported. The following features are missing:</p>
                  <p>${missing.join(', ')}</p>`;

    // eslint-disable-next-line no-console
    console.log(text);
  }

  function onError(err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  // detect missing features in the browser
  const missingFeatures = [
    'Promise',
    'Map',
    'FileReader',
    ['dynamic import', () => {
      try {
        new Function('import("").catch(() => {})')();
        return true;
      } catch (err) {
        return false;
      }
    }],
    ['async/await', () => {
      try {
        new Function('async () => {}');
        return true;
      } catch (err) {
        return false;
      }
    }]
  ].filter(function (name) {
    if (Array.isArray(name)) {
      const [, test] = name;

      return !test();
    }

    return !name.split('.').reduce(function (obj, path) {
      return (obj || {})[path];
    }, window);
  }).map(v => Array.isArray(v) ? v[0] : v);

  if (missingFeatures.length) {
    return onMissingFeatures(missingFeatures);
  }

  // ------------------------------------------------
  // we've validated modules... we can use fancy
  // things now
  // ------------------------------------------------

  function load(name) {
    // get around eslint@5 not supporting dynamic import
    // this is ugly, but I also don't care
    return (new Function(`return import('${name}')`))().then(m => m.default);
  }

  async function map(arr, func) {
    const results = [];

    for (let i = 0; i < arr.length; i++) {
      results.push(await func(arr[i], i, arr));
    }

    return results;
  }

  // load all the modules from the server directly
  Promise.all([
    load('./event-emitter.js'),
    load('./open.js'),
  ]).then(async ([
    eventEmitter,
    ...modules
  ]) => {
    // set up a global event emitter
    const context = { events: eventEmitter(), load };
    const destroys = await map(modules, mod => mod(context));

    context.events.on('error', function (err) {
      onError(err, -1);
      destroys.forEach(d => d());
    });

    context.events.on('warn', function (err) {
      onError(err);
    });

    events.flush(context.events);
    events = context.events;
  }).catch(function catchErr(err) {
    events.emit('error', err);
    onError(err);
  });
};

const find = selector => document.querySelector(selector);

const QUALITY_OPTIONS = [
  { mime: 'image/png', quality: 1, text: 'PNG at 100%' },
  { mime: 'image/jpeg', quality: 1, text: 'JPG at 100%' },
  { mime: 'image/jpeg', quality: 0.92, text: 'JPG at 92%' },
  { mime: 'image/jpeg', quality: 0.8, text: 'JPG at 80%' },
];

const RESULTS_OPTIONS = [
  { text: 'display images', value: 'display' },
  { text: 'download images', value: 'download' },
];

export default ({ events, menu, storage }) => {
  let DEFAULT_EXPORT_QUALITY = storage.get('export-quality') || QUALITY_OPTIONS[2];
  let DEFAULT_RESULT = storage.get('result-action') || RESULTS_OPTIONS[0];
  let deferredPrompt;

  const controls = find('.controls');
  const install = find('#install');
  const open = find('#open');
  const openInput = find('#open-input');
  const intro = find('#intro');
  const quality = find('#quality');
  const results = find('#results');
  const qualityValue = find('[data-for=quality]');
  const resultsValue = find('[data-for=results]');

  qualityValue.innerHTML = DEFAULT_EXPORT_QUALITY.text;
  resultsValue.innerHTML = DEFAULT_RESULT.text;

  const help = find('#help');

  const onHelp = () => {
    if (controls.classList.contains('help')) {
      controls.classList.remove('help');
    } else {
      controls.classList.add('help');
    }
  };

  const onOpenInput = (ev) => {
    if (!ev.target.files[0]) {
      return;
    }

    events.emit('open', { files: [...ev.target.files] });
  };

  const onOpenClick = () => void openInput.click();
  const onQuality = () => {
    const choices = [
      { meta: true, text: 'Choose output format and quality' },
    ].concat(QUALITY_OPTIONS).map(choice => {
      if (choice.mime === DEFAULT_EXPORT_QUALITY.mime && choice.quality === DEFAULT_EXPORT_QUALITY.quality) {
        return Object.assign({ icon: 'check' }, choice);
      }

      return choice;
    });

    menu(...choices).then(({ mime, quality, text }) => {
      DEFAULT_EXPORT_QUALITY = { mime, quality, text };
      storage.set('export-quality', DEFAULT_EXPORT_QUALITY);
      events.emit('controls-quality', DEFAULT_EXPORT_QUALITY);
      qualityValue.innerHTML = DEFAULT_EXPORT_QUALITY.text;
    }).catch(err => {
      events.emit('warn', err);
    });
  };
  const onResults = () => {
    const choices = [
      { text: 'After conversion', meta: true },
    ].concat(RESULTS_OPTIONS).map(choice => {
      if (choice.value === DEFAULT_RESULT.value) {
        return Object.assign({ icon: 'check' }, choice);
      }

      return choice;
    });

    menu(...choices).then(({ value, text }) => {
      DEFAULT_RESULT = { text, value };
      storage.set('result-action', DEFAULT_RESULT);
      events.emit('controls-result', DEFAULT_RESULT);
      resultsValue.innerHTML = DEFAULT_RESULT.text;
    }).catch(err => {
      events.emit('warn', err);
    });
  };
  const onCanInstall = ({ prompt }) => {
    if (deferredPrompt === 0) {
      return;
    }

    deferredPrompt = prompt;
    install.classList.remove('hide');
  };
  const onInstall = () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(result => {
      deferredPrompt = 0;
      install.classList.add('hide');
      // eslint-disable-next-line no-console
      console.log('install prompt result', result, install.className, install);
    }).catch(e => {
      events.emit('warn', e);
    });
  };

  const onValuePicker = ({ target }) => {
    const control = target.getAttribute('data-for');

    if (control === 'quality') {
      onQuality();
    }

    if (control === 'results') {
      onResults();
    }
  };

  const onFileShare = ({ file }) => void events.emit('open', { files: [file] });
  const onOpen = ({ files }) => void events.emit('convert', {
    files,
    quality: DEFAULT_EXPORT_QUALITY,
    result: DEFAULT_RESULT
  });

  help.addEventListener('click', onHelp);
  install.addEventListener('click', onInstall);
  intro.addEventListener('click', onOpenClick);
  open.addEventListener('click', onOpenClick);
  openInput.addEventListener('change', onOpenInput);
  quality.addEventListener('click', onQuality);
  results.addEventListener('click', onResults);

  qualityValue.addEventListener('click', onValuePicker);
  resultsValue.addEventListener('click', onValuePicker);

  events.on('can-install', onCanInstall);
  events.on('file-share', onFileShare);
  events.on('open', onOpen);

  return () => {
    help.removeEventListener('click', onHelp);
    install.removeEventListener('click', onInstall);
    intro.removeEventListener('click', onOpenClick);
    open.removeEventListener('click', onOpenClick);
    openInput.removeEventListener('change', onOpenInput);
    quality.removeEventListener('click', onQuality);
    results.removeEventListener('click', onResults);

    qualityValue.addEventListener('click', onValuePicker);
    resultsValue.addEventListener('click', onValuePicker);

    events.off('can-install', onCanInstall);
    events.off('file-share', onFileShare);
    events.off('open', onOpen);
  };
};

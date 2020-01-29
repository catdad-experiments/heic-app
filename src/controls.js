const find = selector => document.querySelector(selector);

export default ({ events, menu, storage }) => {
  let DEFAULT_EXPORT_QUALITY = storage.get('export-quality') || { mime: 'image/png', quality: 1 };
  let deferredPrompt;

  const controls = find('.controls');
  const install = find('#install');
  const open = find('#open');
  const openInput = find('#open-input');
  const quality = find('#quality');

  const help = find('#help');

  const onHelp = () => {
    if (controls.classList.contains('help')) {
      controls.classList.remove('help');
    } else {
      controls.classList.add('help');
    }
  };

  const onOpen = (ev) => {
    if (!ev.target.files[0]) {
      return;
    }

    events.emit('convert', {
      files: [...ev.target.files],
      quality: DEFAULT_EXPORT_QUALITY
    });
  };

  const onClick = () => void openInput.click();
  const onQuality = () => {
    const choices = [
      { mime: 'image/png', quality: 1, text: 'PNG at 100%' },
      { mime: 'image/jpeg', quality: 1, text: 'JPG at 100%' },
      { mime: 'image/jpeg', quality: 0.92, text: 'JPG at 92%' },
      { mime: 'image/jpeg', quality: 0.8, text: 'JPG at 80%' },
    ].map(choice => {
      if (choice.mime === DEFAULT_EXPORT_QUALITY.mime && choice.quality === DEFAULT_EXPORT_QUALITY.quality) {
        return Object.assign({ icon: 'check' }, choice);
      }

      return choice;
    });

    menu(...choices).then(({ mime, quality }) => {
      DEFAULT_EXPORT_QUALITY = { mime, quality };
      storage.set('export-quality', DEFAULT_EXPORT_QUALITY);
      events.emit('controls-quality', DEFAULT_EXPORT_QUALITY);
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

  const onFileShare = ({ file }) => void events.emit('file-load', {
    file,
    quality: DEFAULT_EXPORT_QUALITY
  });

  help.addEventListener('click', onHelp);
  install.addEventListener('click', onInstall);
  open.addEventListener('click', onClick);
  openInput.addEventListener('change', onOpen);
  quality.addEventListener('click', onQuality);

  events.on('can-install', onCanInstall);
  events.on('file-share', onFileShare);

  return () => {
    help.removeEventListener('click', onHelp);
    install.removeEventListener('click', onInstall);
    open.removeEventListener('click', onClick);
    openInput.removeEventListener('change', onOpen);
    quality.removeEventListener('click', onQuality);

    events.off('can-install', onCanInstall);
    events.off('file-share', onFileShare);
  };
};

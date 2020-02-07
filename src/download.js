/* global saveAs */
export default ({ events }) => {
  const onDownload = ({ blob, filename }) => {
    console.log('downloading', filename);
    saveAs(blob, filename);
  };

  events.on('download', onDownload);

  return () => {
    events.off('download', onDownload);
  };
};

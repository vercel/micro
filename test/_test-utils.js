module.exports = ({ micro, listen }) => ({
  getUrl: (fn) => listen(micro(fn)),
});

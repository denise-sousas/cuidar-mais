// Permite usar async/await nos controllers sem try/catch em todo lugar.
module.exports = (funcao) => (req, res, next) => {
  Promise.resolve(funcao(req, res, next)).catch(next);
};

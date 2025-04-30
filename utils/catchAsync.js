module.exports = (func) => {
  return (req, res, next) => {
    func(req, res, next).catch(next); // Because func is async, it returns a Promise which we can catch
  }
}
module.exports = (req, res, next) => {
  res.jsend = {
    found(dataName, data) {
      const successTemp = {
        status: 'success',
        data: {
          [dataName]: data
        }
      }
      if (typeof dataName !== 'string' || typeof data !== 'object') {
        return res.jsend.serverErr('Type of data must be an object and type of data name must be a string.');
      } else if (Array.isArray(data)) {
        // return res.status(200).json(Object.assign({results: data.length}, successTemp));
        const objArray = Object.entries(successTemp);
        objArray.splice(1, 0, ['results', data.length]);
        return res.status(200).json(Object.fromEntries(objArray));
      } else {
        return res.status(200).json(successTemp)
      }
    },
    serverErr(err) {
      if (typeof err !== 'string') {
        return res.jsend.serverErr('Type of error message must be a string.');
      }
      return res.status(500).json({
        status: 'error',
        message: err,
      })
    },
    created(dataName, data) {
      if (typeof dataName !== 'string' || typeof data !== 'object') {
        return res.jsend.serverErr('Type of data must be an object and type of data name must be a string.');
      }
      return res.status(201).json({
        status: 'success',
        data: {
          [dataName]: data,
        }
      });
    },
    deleted() {
      return res.status(204).json({
        status: 'success',
        data: null
      });
    },
    notFound(msg = 'Not Found') {
      return res.status(404).json({
        status: 'fail',
        message: `${msg}`
      });
    },
    badRequest(msg = 'Invalid Request') {
      return res.status(400).json({
        status: 'fail',
        message: msg
      })
    }
  }
  next();
}
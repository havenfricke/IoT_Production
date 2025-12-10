const BaseController = require('../Utils/BaseController');
const gyroDataService = require('../Services/GyroDataService');

class GyroDataController extends BaseController {
  constructor() {
    super('/data/gyro'); // ensure app uses app.use('/api', new DataController().router)
    this.router
      .get('', this.getAllData)
      .get('/:id', this.getDataById)
      .post('', this.createData)
      .put('/:id', this.editData)
      .delete('/:id', this.deleteData);
  }

  async getAllData(req, res, next) {
    try { res.json({ data: await gyroDataService.getAllData() }); }
    catch (err) { next(err); }
  }

  async getDataById(req, res, next) {
    try { res.json({ data: await gyroDataService.getDataById(req.params.id) }); }
    catch (err) { next(err); }
  }

  async createData(req, res, next) {
    try { res.status(201).json({ data: await gyroDataService.createData(req.body) }); }
    catch (err) { next(err); }
  }

  async editData(req, res, next) {
    try { res.json({ data: await gyroDataService.editData(req.params.id, req.body) }); }
    catch (err) { next(err); }
  }

  async deleteData(req, res, next) {
    try { res.json({ result: await gyroDataService.deleteData(req.params.id) }); }
    catch (err) { next(err); }
  }
}

module.exports = GyroDataController;

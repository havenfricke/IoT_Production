const BaseController = require('../Utils/BaseController');
const dataService = require('../Services/DataService');

class DataController extends BaseController {
  constructor() {
    super('/data'); // ensure app uses app.use('/api', new DataController().router)
    this.router
      .get('', this.getAllData)
      // .get('/:id', this.getDataById)
      .post('', this.createData)
      // .put('/:id', this.editData)
      // .delete('/:id', this.deleteData);
  }

  async getAllData(req, res, next) {
    try { res.json({ data: await dataService.getAllData() }); }
    catch (err) { next(err); }
  }

  // async getDataById(req, res, next) {
  //   try { res.json({ data: await dataService.getDataById(req.params.id) }); }
  //   catch (err) { next(err); }
  // }

  async createData(req, res, next) {
    try { res.status(201).json({ data: await dataService.createData(req.body) }); }
    catch (err) { next(err); }
  }

  // async editData(req, res, next) {
  //   try { res.json({ data: await dataService.editData(req.params.id, req.body) }); }
  //   catch (err) { next(err); }
  // }

  // async deleteData(req, res, next) {
  //   try { res.json({ result: await dataService.deleteData(req.params.id) }); }
  //   catch (err) { next(err); }
  // }
}

module.exports = DataController;

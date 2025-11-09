const BaseController = require('../Utils/BaseController');
const dataService = require('../Services/DataService');

class DataController extends BaseController {
  constructor() {
    super('/data');
    this.router
      .get('', this.getAllData)
      .get('/:id', this.getDataById)
      .post('', this.createData)
      .put('/:id', this.editData)
      .delete('/:id', this.deleteData);
  }

  async getAllData(req, res, next) {
    try {
      const data = await dataService.getAllData();
      res.json({ data });
    } catch (err) { next(err); }
  }

  async getDataById(req, res, next) {
    try {
      const data = await dataService.getDataById(req.params.id);
      res.json({ data });
    } catch (err) { next(err); }
  }

  async createData(req, res, next) {
    try {
      const data = await dataService.createData(req.body);
      res.status(201).json({ data });
    } catch (err) { next(err); }
  }

  async editData(req, res, next) {
    try {
      const data = await dataService.editData(req.params.id, req.body);
      res.json({ data });
    } catch (err) { next(err); }
  }

  async deleteData(req, res, next) {
    try {
      const result = await dataService.deleteData(req.params.id);
      res.json({ result });
    } catch (err) { next(err); }
  }
}

module.exports = DataController;

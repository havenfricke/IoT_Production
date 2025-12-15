const BaseController = require('../Utils/BaseController');
const lidarDataService = require('../Services/LidarDataService');

class LidarDataController extends BaseController {
  constructor() {
    super('/data/lidar'); // ensure app uses app.use('/api', new DataController().router)
    this.router
      .get('', this.getAllData)
      .get('/:id', this.getDataById)
      .post('', this.createData)
      .put('/:id', this.editData)
      .delete('/:id', this.deleteData);
  }

  async getAllData(req, res, next) {
    try { 
      res.json({ 
        data: await lidarDataService.getAllData() 
      }); 
    }
    catch (err) { 
      next(err); 
    }
  }

  async getDataById(req, res, next) {
    try { 
      res.json({ 
        data: await lidarDataService.getDataById(req.params.id) 
      }); 
    }
    catch (err) { 
      next(err); 
    }
  }

  async createData(req, res, next) {
    try { 
      res.status(201).json({ 
        data: await lidarDataService.createData(req.body) 
      }); 
    }
    catch (err) { 
      next(err); 
    }
  }

  async editData(req, res, next) {
    try { 
      res.json({ 
        data: await lidarDataService.editData(req.params.id, req.body) 
      }); 
    }
    catch (err) { 
      next(err); 
    }
  }

  async deleteData(req, res, next) {
    try { 
      res.json({ 
        result: await lidarDataService.deleteData(req.params.id) 
      }); 
    }
    catch (err) { 
      next(err); 
    }
  }
}

module.exports = LidarDataController;

const path = require('path')
const BaseController = require('../Utils/BaseController')

class DataController extends BaseController {
  constructor() {
    super('/data')
    // Register the routes
    this.router
      .get('', this.getAllData)
      .get('/:id', this.getDataById)
      .post('', this.createData)
      .put('', this.editData)
      .delete('/:id', this.deleteData)
  }

  async getAllData(req, res, next) {
    try {
      const data = await dataService.getAllData(req.query)
      res.json({ data: data })
    } catch (error) {
      next(error)
    }
  }

  async getDataById(req, res, next) {
    try {
      const data = await dataService.getDataById(req.params.id)
      res.json({ data: data })
    } catch (error) {
      next(error)
    }
  }

  async createData(req, res, next) {
    try {
      const newData = await dataService.createData(req.body)
      res.status(201).json({ data: newData })
    } catch (error) {
      next(error)
    }
  }

  async editData(req, res, next){
    try {
      const data = await dataService.editData(req.body);
      res.json({ data: data })
    } catch (error){
      next(error);
    }
  }

  async deleteData(req, res, next) {
    try {
      const result = await dataService.deleteData(req.params.id, req.body.creatorId);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DataController

// In Express, the incoming request data is 
// separated into different objects based on 
// where the data comes from:

// req.params:
// This object contains route parameters—parts 
// of the URL that are defined in your route path. 
// For example, if you define a route as /pages/:id, 
// the value of :id is accessible via req.params.id.

// req.body:
// This object contains data that is sent in the 
// body of the request (commonly in POST or PUT requests). 
// This data is usually parsed from JSON or form data.

// We don't use something like body.params because 
// Express separates these concerns into different 
// properties (req.params for URL parameters and req.body 
// for request payload). This design helps to clarify 
// the source of the data in your request.
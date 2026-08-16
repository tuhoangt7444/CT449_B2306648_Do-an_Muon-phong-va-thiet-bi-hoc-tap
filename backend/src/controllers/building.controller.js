const buildingService = require('../services/building.service');

class BuildingController {
  async getBuildings(req, res, next) {
    try {
      const result = await buildingService.getBuildings(req.query);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getBuildingById(req, res, next) {
    try {
      const building = await buildingService.getBuildingById(req.params.id);
      return res.status(200).json({ data: building });
    } catch (error) {
      next(error);
    }
  }

  async createBuilding(req, res, next) {
    try {
      const building = await buildingService.createBuilding(req.body);
      return res.status(201).json({
        message: 'Tạo tòa nhà thành công',
        data: building
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBuilding(req, res, next) {
    try {
      const building = await buildingService.updateBuilding(req.params.id, req.body);
      return res.status(200).json({
        message: 'Cập nhật tòa nhà thành công',
        data: building
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBuilding(req, res, next) {
    try {
      await buildingService.deleteBuilding(req.params.id);
      return res.status(200).json({
        message: 'Xóa tòa nhà thành công'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BuildingController();

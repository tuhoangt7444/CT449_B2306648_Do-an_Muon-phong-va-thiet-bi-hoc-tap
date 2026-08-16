const buildingManagerService = require('../services/buildingManager.service');

class BuildingManagerController {
  async getBuildingManagers(req, res, next) {
    try {
      const result = await buildingManagerService.getBuildingManagers(req.query);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getBuildingManagerById(req, res, next) {
    try {
      const manager = await buildingManagerService.getBuildingManagerById(req.params.id);
      return res.status(200).json({ data: manager });
    } catch (error) {
      next(error);
    }
  }

  async createBuildingManager(req, res, next) {
    try {
      const manager = await buildingManagerService.createBuildingManager(req.body);
      return res.status(201).json({
        message: 'Tạo tài khoản quản lý tòa nhà thành công',
        data: manager
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBuildingManager(req, res, next) {
    try {
      const manager = await buildingManagerService.updateBuildingManager(req.params.id, req.body);
      return res.status(200).json({
        message: 'Cập nhật thông tin quản lý thành công',
        data: manager
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BuildingManagerController();

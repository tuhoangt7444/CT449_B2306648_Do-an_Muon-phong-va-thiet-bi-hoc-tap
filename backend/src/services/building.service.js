const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/db');
const collections = require('../config/collections');

class BuildingService {
  async getBuildings(query = {}) {
    const db = getDatabase();
    const {
      search,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { buildingCode: searchRegex },
        { name: searchRegex },
        { location: searchRegex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const totalItems = await db.collection(collections.BUILDINGS).countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    const buildings = await db.collection(collections.BUILDINGS)
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const buildingsWithDetails = await Promise.all(buildings.map(async (b) => {
      const roomCount = await db.collection(collections.ROOMS).countDocuments({ buildingId: b._id });
      const equipmentCount = await db.collection(collections.EQUIPMENT).countDocuments({ buildingId: b._id });
      const manager = await db.collection(collections.STAFF).findOne({
        buildingId: b._id,
        role: 'building_manager',
        status: 'active'
      }, { projection: { password: 0 } });

      return {
        ...b,
        roomCount,
        equipmentCount,
        manager: manager ? {
          _id: manager._id,
          staffCode: manager.staffCode,
          fullName: manager.fullName,
          email: manager.email
        } : null
      };
    }));

    return {
      data: buildingsWithDetails,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages
      }
    };
  }

  async getBuildingById(id) {
    const db = getDatabase();
    if (!ObjectId.isValid(id)) {
      const error = new Error('ID tòa nhà không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    const building = await db.collection(collections.BUILDINGS).findOne({ _id: new ObjectId(id) });
    if (!building) {
      const error = new Error('Không tìm thấy tòa nhà');
      error.statusCode = 404;
      throw error;
    }

    const roomCount = await db.collection(collections.ROOMS).countDocuments({ buildingId: building._id });
    const equipmentCount = await db.collection(collections.EQUIPMENT).countDocuments({ buildingId: building._id });
    const manager = await db.collection(collections.STAFF).findOne({
      buildingId: building._id,
      role: 'building_manager',
      status: 'active'
    }, { projection: { password: 0 } });

    return {
      ...building,
      roomCount,
      equipmentCount,
      manager: manager ? {
        _id: manager._id,
        staffCode: manager.staffCode,
        fullName: manager.fullName,
        email: manager.email
      } : null
    };
  }

  async createBuilding(data) {
    const db = getDatabase();
    const { buildingCode, name, location, description, status = 'active' } = data;

    if (!buildingCode || !buildingCode.trim()) {
      const error = new Error('Mã tòa nhà không được để trống');
      error.statusCode = 400;
      throw error;
    }

    const cleanCode = buildingCode.trim().toUpperCase();
    const codeRegex = /^[A-Z0-9-]{1,20}$/;
    if (!codeRegex.test(cleanCode)) {
      const error = new Error('Mã tòa nhà chỉ chứa chữ cái, chữ số và dấu gạch ngang (tối đa 20 ký tự)');
      error.statusCode = 400;
      throw error;
    }

    if (!name || !name.trim()) {
      const error = new Error('Tên tòa nhà không được để trống');
      error.statusCode = 400;
      throw error;
    }

    const existing = await db.collection(collections.BUILDINGS).findOne({ buildingCode: cleanCode });
    if (existing) {
      const error = new Error(`Mã tòa nhà ${cleanCode} đã tồn tại`);
      error.statusCode = 409;
      throw error;
    }

    const now = new Date();
    const newBuilding = {
      buildingCode: cleanCode,
      name: name.trim(),
      location: location ? location.trim() : 'Khu II Đại học Cần Thơ',
      description: description ? description.trim() : '',
      status: status === 'inactive' ? 'inactive' : 'active',
      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection(collections.BUILDINGS).insertOne(newBuilding);
    return {
      _id: result.insertedId,
      ...newBuilding
    };
  }

  async updateBuilding(id, data) {
    const db = getDatabase();
    if (!ObjectId.isValid(id)) {
      const error = new Error('ID tòa nhà không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    const buildingId = new ObjectId(id);
    const existing = await db.collection(collections.BUILDINGS).findOne({ _id: buildingId });
    if (!existing) {
      const error = new Error('Không tìm thấy tòa nhà');
      error.statusCode = 404;
      throw error;
    }

    const updateFields = {};

    if (data.buildingCode !== undefined && data.buildingCode.trim()) {
      const cleanCode = data.buildingCode.trim().toUpperCase();
      const codeRegex = /^[A-Z0-9-]{1,20}$/;
      if (!codeRegex.test(cleanCode)) {
        const error = new Error('Mã tòa nhà chỉ chứa chữ cái, chữ số và dấu gạch ngang (tối đa 20 ký tự)');
        error.statusCode = 400;
        throw error;
      }

      if (cleanCode !== existing.buildingCode) {
        const duplicate = await db.collection(collections.BUILDINGS).findOne({ buildingCode: cleanCode });
        if (duplicate) {
          const error = new Error(`Mã tòa nhà ${cleanCode} đã tồn tại`);
          error.statusCode = 409;
          throw error;
        }
        updateFields.buildingCode = cleanCode;
      }
    }

    if (data.name !== undefined && data.name.trim()) {
      updateFields.name = data.name.trim();
    }

    if (data.location !== undefined) {
      updateFields.location = data.location.trim();
    }

    if (data.description !== undefined) {
      updateFields.description = data.description.trim();
    }

    if (data.status !== undefined) {
      updateFields.status = data.status === 'inactive' ? 'inactive' : 'active';
    }

    updateFields.updatedAt = new Date();

    await db.collection(collections.BUILDINGS).updateOne(
      { _id: buildingId },
      { $set: updateFields }
    );

    return this.getBuildingById(id);
  }

  async deleteBuilding(id) {
    const db = getDatabase();
    if (!ObjectId.isValid(id)) {
      const error = new Error('ID tòa nhà không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    const buildingId = new ObjectId(id);
    const existing = await db.collection(collections.BUILDINGS).findOne({ _id: buildingId });
    if (!existing) {
      const error = new Error('Không tìm thấy tòa nhà');
      error.statusCode = 404;
      throw error;
    }

    const roomCount = await db.collection(collections.ROOMS).countDocuments({ buildingId });
    const equipmentCount = await db.collection(collections.EQUIPMENT).countDocuments({ buildingId });
    const staffCount = await db.collection(collections.STAFF).countDocuments({ buildingId });
    const bookingCount = await db.collection(collections.BOOKINGS).countDocuments({ buildingId });

    if (roomCount > 0 || equipmentCount > 0 || staffCount > 0 || bookingCount > 0) {
      const error = new Error('Không thể xóa tòa nhà đã có dữ liệu tham chiếu (phòng/thiết bị/nhân viên/phiếu mượn). Vui lòng chuyển trạng thái sang ngưng hoạt động (inactive).');
      error.statusCode = 409;
      throw error;
    }

    await db.collection(collections.BUILDINGS).deleteOne({ _id: buildingId });
    return true;
  }
}

module.exports = new BuildingService();

const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../config/db');
const collections = require('../config/collections');

class BuildingManagerService {
  async getBuildingManagers(query = {}) {
    const db = getDatabase();
    const {
      search,
      status,
      buildingId,
      page = 1,
      limit = 10
    } = query;

    const filter = { role: 'building_manager' };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (buildingId && ObjectId.isValid(buildingId)) {
      filter.buildingId = new ObjectId(buildingId);
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { staffCode: searchRegex },
        { fullName: searchRegex },
        { email: searchRegex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const totalItems = await db.collection(collections.STAFF).countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    const managers = await db.collection(collections.STAFF)
      .find(filter, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const managersWithBuilding = await Promise.all(managers.map(async (m) => {
      let building = null;
      if (m.buildingId) {
        building = await db.collection(collections.BUILDINGS).findOne(
          { _id: m.buildingId },
          { projection: { buildingCode: 1, name: 1, location: 1 } }
        );
      }
      return {
        ...m,
        building
      };
    }));

    return {
      data: managersWithBuilding,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages
      }
    };
  }

  async getBuildingManagerById(id) {
    const db = getDatabase();
    if (!ObjectId.isValid(id)) {
      const error = new Error('ID người quản lý không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    const manager = await db.collection(collections.STAFF).findOne(
      { _id: new ObjectId(id), role: 'building_manager' },
      { projection: { password: 0 } }
    );

    if (!manager) {
      const error = new Error('Không tìm thấy tài khoản quản lý tòa nhà');
      error.statusCode = 404;
      throw error;
    }

    let building = null;
    if (manager.buildingId) {
      building = await db.collection(collections.BUILDINGS).findOne({ _id: manager.buildingId });
    }

    return {
      ...manager,
      building
    };
  }

  async createBuildingManager(data) {
    const db = getDatabase();
    const { staffCode, fullName, email, password, buildingId, status = 'active' } = data;

    if (!staffCode || !staffCode.trim()) {
      const error = new Error('Mã nhân viên không được để trống');
      error.statusCode = 400;
      throw error;
    }

    if (!fullName || !fullName.trim()) {
      const error = new Error('Họ tên không được để trống');
      error.statusCode = 400;
      throw error;
    }

    if (!email || !email.trim()) {
      const error = new Error('Email không được để trống');
      error.statusCode = 400;
      throw error;
    }

    if (!password || password.length < 6) {
      const error = new Error('Mật khẩu phải từ 6 ký tự trở lên');
      error.statusCode = 400;
      throw error;
    }

    if (!buildingId || !ObjectId.isValid(buildingId)) {
      const error = new Error('Vui lòng chọn tòa nhà hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    const bId = new ObjectId(buildingId);
    const building = await db.collection(collections.BUILDINGS).findOne({ _id: bId });
    if (!building) {
      const error = new Error('Tòa nhà không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    if (building.status === 'inactive') {
      const error = new Error('Tòa nhà đang ở trạng thái ngưng hoạt động. Vui lòng kích hoạt tòa nhà trước khi tạo quản lý.');
      error.statusCode = 400;
      throw error;
    }

    const cleanStaffCode = staffCode.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    const existingCode = await db.collection(collections.STAFF).findOne({ staffCode: cleanStaffCode });
    if (existingCode) {
      const error = new Error(`Mã nhân viên ${cleanStaffCode} đã tồn tại`);
      error.statusCode = 409;
      throw error;
    }

    const existingEmail = await db.collection(collections.STAFF).findOne({ email: cleanEmail });
    if (existingEmail) {
      const error = new Error(`Email ${cleanEmail} đã tồn tại`);
      error.statusCode = 409;
      throw error;
    }

    if (status !== 'inactive') {
      const activeManager = await db.collection(collections.STAFF).findOne({
        buildingId: bId,
        role: 'building_manager',
        status: 'active'
      });

      if (activeManager) {
        const error = new Error(`Tòa nhà ${building.buildingCode} đã có quản lý đang hoạt động (${activeManager.fullName}). Vui lòng chuyển tài khoản cũ sang ngưng hoạt động trước.`);
        error.statusCode = 409;
        throw error;
      }
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const now = new Date();

    const newManager = {
      staffCode: cleanStaffCode,
      fullName: fullName.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'building_manager',
      buildingId: bId,
      status: status === 'inactive' ? 'inactive' : 'active',
      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection(collections.STAFF).insertOne(newManager);
    return this.getBuildingManagerById(result.insertedId);
  }

  async updateBuildingManager(id, data) {
    const db = getDatabase();
    if (!ObjectId.isValid(id)) {
      const error = new Error('ID người quản lý không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    const mId = new ObjectId(id);
    const existing = await db.collection(collections.STAFF).findOne({ _id: mId, role: 'building_manager' });
    if (!existing) {
      const error = new Error('Không tìm thấy tài khoản quản lý tòa nhà');
      error.statusCode = 404;
      throw error;
    }

    const updateFields = {};

    if (data.fullName !== undefined && data.fullName.trim()) {
      updateFields.fullName = data.fullName.trim();
    }

    if (data.email !== undefined && data.email.trim()) {
      const cleanEmail = data.email.trim().toLowerCase();
      if (cleanEmail !== existing.email) {
        const duplicate = await db.collection(collections.STAFF).findOne({ email: cleanEmail });
        if (duplicate) {
          const error = new Error(`Email ${cleanEmail} đã tồn tại`);
          error.statusCode = 409;
          throw error;
        }
        updateFields.email = cleanEmail;
      }
    }

    let targetBuildingId = existing.buildingId;
    if (data.buildingId !== undefined && ObjectId.isValid(data.buildingId)) {
      targetBuildingId = new ObjectId(data.buildingId);
      const building = await db.collection(collections.BUILDINGS).findOne({ _id: targetBuildingId });
      if (!building) {
        const error = new Error('Tòa nhà không tồn tại');
        error.statusCode = 404;
        throw error;
      }
      updateFields.buildingId = targetBuildingId;
    }

    const targetStatus = data.status !== undefined ? (data.status === 'inactive' ? 'inactive' : 'active') : existing.status;
    if (data.status !== undefined) {
      updateFields.status = targetStatus;
    }

    if (targetStatus === 'active') {
      const activeManager = await db.collection(collections.STAFF).findOne({
        _id: { $ne: mId },
        buildingId: targetBuildingId,
        role: 'building_manager',
        status: 'active'
      });

      if (activeManager) {
        const error = new Error(`Tòa nhà đã có quản lý đang hoạt động (${activeManager.fullName}). Vui lòng ngưng hoạt động tài khoản đó trước.`);
        error.statusCode = 409;
        throw error;
      }
    }

    if (data.password && data.password.trim()) {
      if (data.password.trim().length < 6) {
        const error = new Error('Mật khẩu mới phải từ 6 ký tự trở lên');
        error.statusCode = 400;
        throw error;
      }
      updateFields.password = bcrypt.hashSync(data.password.trim(), 10);
    }

    updateFields.updatedAt = new Date();

    await db.collection(collections.STAFF).updateOne(
      { _id: mId },
      { $set: updateFields }
    );

    return this.getBuildingManagerById(id);
  }
}

module.exports = new BuildingManagerService();

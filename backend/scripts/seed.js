require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectToDatabase, closeDatabaseConnection } = require('../src/config/db');
const collections = require('../src/config/collections');

async function seed() {
  try {
    const db = await connectToDatabase();
    console.log('Connected to database for seeding...');

    await db.collection(collections.STUDENTS).deleteMany({});
    await db.collection(collections.STAFF).deleteMany({});
    await db.collection(collections.ROOMS).deleteMany({});
    await db.collection(collections.EQUIPMENT).deleteMany({});
    await db.collection(collections.BOOKINGS).deleteMany({});
    await db.collection(collections.REVIEWS).deleteMany({});

    await db.collection(collections.STUDENTS).createIndex({ studentCode: 1 }, { unique: true });
    await db.collection(collections.STUDENTS).createIndex({ email: 1 }, { unique: true });
    await db.collection(collections.STAFF).createIndex({ staffCode: 1 }, { unique: true });
    await db.collection(collections.STAFF).createIndex({ email: 1 }, { unique: true });
    await db.collection(collections.ROOMS).createIndex({ roomCode: 1 }, { unique: true });
    await db.collection(collections.EQUIPMENT).createIndex({ equipmentCode: 1 }, { unique: true });
    await db.collection(collections.REVIEWS).createIndex({ bookingId: 1 }, { unique: true });

    await db.collection(collections.BOOKINGS).createIndex({ roomId: 1, startTime: 1, endTime: 1 });
    await db.collection(collections.BOOKINGS).createIndex({ studentId: 1, createdAt: -1 });
    await db.collection(collections.BOOKINGS).createIndex({ status: 1, startTime: 1 });

    const now = new Date();
    const defaultHashedPassword = bcrypt.hashSync('123456', 10);

    const roomsData = [
      {
        roomCode: 'P101',
        name: 'Phòng tự học A1.01',
        description: 'Phòng tự học nhỏ thích hợp cho nhóm ít người',
        location: 'Tầng 1, Nhà A1',
        capacity: 4,
        facilities: ['Máy lạnh', 'Bảng trắng'],
        images: [],
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        roomCode: 'P102',
        name: 'Phòng tự học A1.02',
        description: 'Phòng học nhóm trung bình trang bị máy chiếu',
        location: 'Tầng 1, Nhà A1',
        capacity: 6,
        facilities: ['Máy lạnh', 'Bảng trắng', 'Máy chiếu'],
        images: [],
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        roomCode: 'P103',
        name: 'Phòng nhóm B2.01',
        description: 'Phòng học trang bị Tivi LCD và ổ cắm tiện lợi',
        location: 'Tầng 2, Nhà B2',
        capacity: 8,
        facilities: ['Máy lạnh', 'Tivi LCD', 'Ổ cắm nối dài'],
        images: [],
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        roomCode: 'P104',
        name: 'Phòng nhóm B2.02',
        description: 'Phòng thảo luận nhóm có sức chứa 10 người',
        location: 'Tầng 2, Nhà B2',
        capacity: 10,
        facilities: ['Máy lạnh', 'Bảng trắng', 'Máy chiếu'],
        images: [],
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        roomCode: 'P105',
        name: 'Phòng tự học C1.01',
        description: 'Phòng yên tĩnh phù hợp ôn tập cá nhân và nhóm nhỏ',
        location: 'Tầng 1, Nhà C1',
        capacity: 6,
        facilities: ['Máy lạnh', 'Loa di động'],
        images: [],
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        roomCode: 'P106',
        name: 'Phòng thảo luận C1.02',
        description: 'Phòng lớn cho hội thảo nhóm sinh viên',
        location: 'Tầng 1, Nhà C1',
        capacity: 12,
        facilities: ['Máy lạnh', 'Bảng trắng', 'Máy chiếu', 'Micro'],
        images: [],
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        roomCode: 'P107',
        name: 'Phòng nhóm D3.01',
        description: 'Phòng đang trong quá trình bảo trì hệ thống điện',
        location: 'Tầng 3, Nhà D3',
        capacity: 15,
        facilities: ['Máy lạnh'],
        images: [],
        status: 'maintenance',
        createdAt: now,
        updatedAt: now
      },
      {
        roomCode: 'P108',
        name: 'Phòng tự học D3.02',
        description: 'Phòng tạm ngưng hoạt động học kỳ này',
        location: 'Tầng 3, Nhà D3',
        capacity: 8,
        facilities: ['Bảng trắng'],
        images: [],
        status: 'inactive',
        createdAt: now,
        updatedAt: now
      }
    ];

    const roomsResult = await db.collection(collections.ROOMS).insertMany(roomsData);
    const roomIds = Object.values(roomsResult.insertedIds);

    const equipmentData = [
      {
        equipmentCode: 'EQ001',
        name: 'Máy chiếu di động',
        description: 'Máy chiếu độ phân giải Full HD',
        totalQuantity: 5,
        damagedQuantity: 0,
        lowStockThreshold: 2,
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        equipmentCode: 'EQ002',
        name: 'Dây HDMI 5m',
        description: 'Cáp kết nối HDMI độ dài 5m',
        totalQuantity: 10,
        damagedQuantity: 1,
        lowStockThreshold: 3,
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        equipmentCode: 'EQ003',
        name: 'Bút trình chiếu',
        description: 'Bút chỉ laser kèm chuyển slide',
        totalQuantity: 5,
        damagedQuantity: 3,
        lowStockThreshold: 3,
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        equipmentCode: 'EQ004',
        name: 'Micro không dây',
        description: 'Micro thu âm không dây có thu đầu USB',
        totalQuantity: 4,
        damagedQuantity: 2,
        lowStockThreshold: 2,
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        equipmentCode: 'EQ005',
        name: 'Loa di động',
        description: 'Loa bluetooth công suất 20W',
        totalQuantity: 6,
        damagedQuantity: 0,
        lowStockThreshold: 2,
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        equipmentCode: 'EQ006',
        name: 'Ổ cắm nối dài',
        description: 'Ổ cắm điện 5 chấu dây dài 3m',
        totalQuantity: 12,
        damagedQuantity: 1,
        lowStockThreshold: 4,
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        equipmentCode: 'EQ007',
        name: 'Bảng viết di động',
        description: 'Bảng mica trắng có chân xoay',
        totalQuantity: 3,
        damagedQuantity: 2,
        lowStockThreshold: 1,
        status: 'maintenance',
        createdAt: now,
        updatedAt: now
      },
      {
        equipmentCode: 'EQ008',
        name: 'Laptop thuyết trình',
        description: 'Laptop dự phòng hỗ trợ sinh viên',
        totalQuantity: 2,
        damagedQuantity: 2,
        lowStockThreshold: 1,
        status: 'inactive',
        createdAt: now,
        updatedAt: now
      }
    ];

    const equipmentResult = await db.collection(collections.EQUIPMENT).insertMany(equipmentData);
    const equipmentIds = Object.values(equipmentResult.insertedIds);

    const studentsData = [
      {
        studentCode: 'B2300001',
        fullName: 'Nguyễn Văn An',
        email: 'an.b2300001@student.ctu.edu.vn',
        phone: '0901234561',
        faculty: 'CNTT & TT',
        password: defaultHashedPassword,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        studentCode: 'B2300002',
        fullName: 'Trần Thị Bình',
        email: 'binh.b2300002@student.ctu.edu.vn',
        phone: '0901234562',
        faculty: 'CNTT & TT',
        password: defaultHashedPassword,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        studentCode: 'B2300003',
        fullName: 'Lê Hoàng Cường',
        email: 'cuong.b2300003@student.ctu.edu.vn',
        phone: '0901234563',
        faculty: 'Kinh tế',
        password: defaultHashedPassword,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        studentCode: 'B2300004',
        fullName: 'Phạm Minh Đức',
        email: 'duc.b2300004@student.ctu.edu.vn',
        phone: '0901234564',
        faculty: 'Nông nghiệp',
        password: defaultHashedPassword,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        studentCode: 'B2300005',
        fullName: 'Vũ Thị Giang',
        email: 'giang.b2300005@student.ctu.edu.vn',
        phone: '0901234565',
        faculty: 'Ngoại ngữ',
        password: defaultHashedPassword,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        studentCode: 'B2300006',
        fullName: 'Đỗ Văn Hải',
        email: 'hai.b2300006@student.ctu.edu.vn',
        phone: '0901234566',
        faculty: 'Luật',
        password: defaultHashedPassword,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        studentCode: 'B2300007',
        fullName: 'Ngô Thị Hương',
        email: 'huong.b2300007@student.ctu.edu.vn',
        phone: '0901234567',
        faculty: 'Sư phạm',
        password: defaultHashedPassword,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        studentCode: 'B2300008',
        fullName: 'Bùi Văn Khoa',
        email: 'khoa.b2300008@student.ctu.edu.vn',
        phone: '0901234568',
        faculty: 'CNTT & TT',
        password: defaultHashedPassword,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        studentCode: 'B2300009',
        fullName: 'Đặng Thị Lan',
        email: 'lan.b2300009@student.ctu.edu.vn',
        phone: '0901234569',
        faculty: 'Kỹ thuật',
        password: defaultHashedPassword,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        studentCode: 'B2300010',
        fullName: 'Hoàng Văn Minh',
        email: 'minh.b2300010@student.ctu.edu.vn',
        phone: '0901234570',
        faculty: 'Thủy sản',
        password: defaultHashedPassword,
        status: 'inactive',
        createdAt: now,
        updatedAt: now
      }
    ];

    const studentsResult = await db.collection(collections.STUDENTS).insertMany(studentsData);
    const studentIds = Object.values(studentsResult.insertedIds);

    const staffData = [
      {
        staffCode: 'ST001',
        fullName: 'Nguyễn Quản Lý',
        email: 'quanly@ctu.edu.vn',
        password: defaultHashedPassword,
        role: 'manager',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        staffCode: 'ST002',
        fullName: 'Trần Nhân Viên',
        email: 'nhanvien@ctu.edu.vn',
        password: defaultHashedPassword,
        role: 'staff',
        status: 'active',
        createdAt: now,
        updatedAt: now
      }
    ];

    const staffResult = await db.collection(collections.STAFF).insertMany(staffData);
    const staffIds = Object.values(staffResult.insertedIds);

    const createDateOffset = (dayOffset, hour, minute = 0) => {
      const date = new Date(now);
      date.setDate(date.getDate() + dayOffset);
      date.setHours(hour, minute, 0, 0);
      return date;
    };

    const bookingsData = [
      {
        studentId: studentIds[0],
        roomId: roomIds[0],
        startTime: createDateOffset(-7, 8, 0),
        endTime: createDateOffset(-7, 10, 0),
        purpose: 'Ôn tập môn Lập trình Web',
        numberOfPeople: 3,
        equipmentItems: [
          { equipmentId: equipmentIds[1], quantity: 1, damagedQuantity: 0 }
        ],
        status: 'completed',
        rejectionReason: '',
        studentNote: 'Cần ổ cắm gần bàn',
        staffNote: '',
        approvedBy: staffIds[0],
        approvedAt: createDateOffset(-7, 7, 30),
        checkedInAt: createDateOffset(-7, 8, 5),
        completedAt: createDateOffset(-7, 10, 0),
        cancelledAt: null,
        createdAt: createDateOffset(-8, 14, 0),
        updatedAt: createDateOffset(-7, 10, 0)
      },
      {
        studentId: studentIds[1],
        roomId: roomIds[0],
        startTime: createDateOffset(-7, 10, 0),
        endTime: createDateOffset(-7, 12, 0),
        purpose: 'Làm bài tập nhóm Cấu trúc dữ liệu',
        numberOfPeople: 4,
        equipmentItems: [],
        status: 'completed',
        rejectionReason: '',
        studentNote: '',
        staffNote: '',
        approvedBy: staffIds[1],
        approvedAt: createDateOffset(-7, 9, 0),
        checkedInAt: createDateOffset(-7, 10, 2),
        completedAt: createDateOffset(-7, 12, 0),
        cancelledAt: null,
        createdAt: createDateOffset(-8, 16, 0),
        updatedAt: createDateOffset(-7, 12, 0)
      },
      {
        studentId: studentIds[2],
        roomId: roomIds[1],
        startTime: createDateOffset(-6, 9, 0),
        endTime: createDateOffset(-6, 11, 0),
        purpose: 'Thuyết trình môn Nguyên lý Thống kê',
        numberOfPeople: 5,
        equipmentItems: [
          { equipmentId: equipmentIds[0], quantity: 1, damagedQuantity: 0 },
          { equipmentId: equipmentIds[2], quantity: 1, damagedQuantity: 0 }
        ],
        status: 'completed',
        rejectionReason: '',
        studentNote: '',
        staffNote: '',
        approvedBy: staffIds[0],
        approvedAt: createDateOffset(-6, 8, 0),
        checkedInAt: createDateOffset(-6, 9, 0),
        completedAt: createDateOffset(-6, 11, 0),
        cancelledAt: null,
        createdAt: createDateOffset(-7, 11, 0),
        updatedAt: createDateOffset(-6, 11, 0)
      },
      {
        studentId: studentIds[3],
        roomId: roomIds[1],
        startTime: createDateOffset(-6, 14, 0),
        endTime: createDateOffset(-6, 16, 0),
        purpose: 'Học nhóm Nông nghiệp công nghệ cao',
        numberOfPeople: 6,
        equipmentItems: [
          { equipmentId: equipmentIds[5], quantity: 2, damagedQuantity: 0 }
        ],
        status: 'completed',
        rejectionReason: '',
        studentNote: '',
        staffNote: '',
        approvedBy: staffIds[1],
        approvedAt: createDateOffset(-6, 12, 0),
        checkedInAt: createDateOffset(-6, 14, 1),
        completedAt: createDateOffset(-6, 16, 0),
        cancelledAt: null,
        createdAt: createDateOffset(-7, 15, 0),
        updatedAt: createDateOffset(-6, 16, 0)
      },
      {
        studentId: studentIds[4],
        roomId: roomIds[2],
        startTime: createDateOffset(-5, 8, 0),
        endTime: createDateOffset(-5, 10, 0),
        purpose: 'Luyện nói Tiếng Anh giao tiếp',
        numberOfPeople: 6,
        equipmentItems: [
          { equipmentId: equipmentIds[4], quantity: 1, damagedQuantity: 0 }
        ],
        status: 'completed',
        rejectionReason: '',
        studentNote: '',
        staffNote: '',
        approvedBy: staffIds[0],
        approvedAt: createDateOffset(-5, 7, 45),
        checkedInAt: createDateOffset(-5, 8, 0),
        completedAt: createDateOffset(-5, 10, 0),
        cancelledAt: null,
        createdAt: createDateOffset(-6, 10, 0),
        updatedAt: createDateOffset(-5, 10, 0)
      },
      {
        studentId: studentIds[5],
        roomId: roomIds[2],
        startTime: createDateOffset(-4, 13, 0),
        endTime: createDateOffset(-4, 15, 0),
        purpose: 'Thảo luận đề tài Luật Kinh tế',
        numberOfPeople: 7,
        equipmentItems: [],
        status: 'completed',
        rejectionReason: '',
        studentNote: '',
        staffNote: '',
        approvedBy: staffIds[1],
        approvedAt: createDateOffset(-4, 11, 0),
        checkedInAt: createDateOffset(-4, 13, 0),
        completedAt: createDateOffset(-4, 15, 0),
        cancelledAt: null,
        createdAt: createDateOffset(-5, 14, 0),
        updatedAt: createDateOffset(-4, 15, 0)
      },
      {
        studentId: studentIds[6],
        roomId: roomIds[3],
        startTime: createDateOffset(-3, 9, 0),
        endTime: createDateOffset(-3, 11, 0),
        purpose: 'Soạn giáo án thực tập Sư phạm',
        numberOfPeople: 8,
        equipmentItems: [
          { equipmentId: equipmentIds[0], quantity: 1, damagedQuantity: 0 }
        ],
        status: 'completed',
        rejectionReason: '',
        studentNote: '',
        staffNote: '',
        approvedBy: staffIds[0],
        approvedAt: createDateOffset(-3, 8, 30),
        checkedInAt: createDateOffset(-3, 9, 3),
        completedAt: createDateOffset(-3, 11, 0),
        cancelledAt: null,
        createdAt: createDateOffset(-4, 16, 0),
        updatedAt: createDateOffset(-3, 11, 0)
      },
      {
        studentId: studentIds[7],
        roomId: roomIds[4],
        startTime: createDateOffset(-2, 10, 0),
        endTime: createDateOffset(-2, 12, 0),
        purpose: 'Học nhóm Cơ sở dữ liệu nâng cao',
        numberOfPeople: 5,
        equipmentItems: [
          { equipmentId: equipmentIds[5], quantity: 1, damagedQuantity: 0 }
        ],
        status: 'completed',
        rejectionReason: '',
        studentNote: '',
        staffNote: '',
        approvedBy: staffIds[1],
        approvedAt: createDateOffset(-2, 9, 0),
        checkedInAt: createDateOffset(-2, 10, 0),
        completedAt: createDateOffset(-2, 12, 0),
        cancelledAt: null,
        createdAt: createDateOffset(-3, 10, 0),
        updatedAt: createDateOffset(-2, 12, 0)
      },
      {
        studentId: studentIds[8],
        roomId: roomIds[5],
        startTime: createDateOffset(-1, 14, 0),
        endTime: createDateOffset(-1, 16, 0),
        purpose: 'Hội thảo sinh viên nghiên cứu Kỹ thuật',
        numberOfPeople: 10,
        equipmentItems: [
          { equipmentId: equipmentIds[3], quantity: 2, damagedQuantity: 0 }
        ],
        status: 'completed',
        rejectionReason: '',
        studentNote: '',
        staffNote: '',
        approvedBy: staffIds[0],
        approvedAt: createDateOffset(-1, 13, 0),
        checkedInAt: createDateOffset(-1, 14, 0),
        completedAt: createDateOffset(-1, 16, 0),
        cancelledAt: null,
        createdAt: createDateOffset(-2, 14, 0),
        updatedAt: createDateOffset(-1, 16, 0)
      },
      {
        studentId: studentIds[0],
        roomId: roomIds[0],
        startTime: createDateOffset(0, 8, 0),
        endTime: createDateOffset(0, 18, 0),
        purpose: 'Học nhóm đồ án tốt nghiệp cả ngày',
        numberOfPeople: 4,
        equipmentItems: [
          { equipmentId: equipmentIds[1], quantity: 1, damagedQuantity: 0 }
        ],
        status: 'in_use',
        rejectionReason: '',
        studentNote: '',
        staffNote: '',
        approvedBy: staffIds[0],
        approvedAt: createDateOffset(0, 7, 30),
        checkedInAt: createDateOffset(0, 8, 0),
        completedAt: null,
        cancelledAt: null,
        createdAt: createDateOffset(-1, 10, 0),
        updatedAt: createDateOffset(0, 8, 0)
      },
      {
        studentId: studentIds[1],
        roomId: roomIds[1],
        startTime: createDateOffset(1, 8, 0),
        endTime: createDateOffset(1, 10, 0),
        purpose: 'Học nhóm Hệ quản trị CSDL',
        numberOfPeople: 5,
        equipmentItems: [
          { equipmentId: equipmentIds[0], quantity: 1, damagedQuantity: 0 }
        ],
        status: 'approved',
        rejectionReason: '',
        studentNote: '',
        staffNote: '',
        approvedBy: staffIds[1],
        approvedAt: createDateOffset(0, 9, 0),
        checkedInAt: null,
        completedAt: null,
        cancelledAt: null,
        createdAt: createDateOffset(0, 8, 30),
        updatedAt: createDateOffset(0, 9, 0)
      },
      {
        studentId: studentIds[2],
        roomId: roomIds[2],
        startTime: createDateOffset(1, 10, 0),
        endTime: createDateOffset(1, 12, 0),
        purpose: 'Ôn thi Marketing căn bản',
        numberOfPeople: 6,
        equipmentItems: [],
        status: 'approved',
        rejectionReason: '',
        studentNote: '',
        staffNote: '',
        approvedBy: staffIds[0],
        approvedAt: createDateOffset(0, 10, 0),
        checkedInAt: null,
        completedAt: null,
        cancelledAt: null,
        createdAt: createDateOffset(0, 9, 15),
        updatedAt: createDateOffset(0, 10, 0)
      },
      {
        studentId: studentIds[3],
        roomId: roomIds[3],
        startTime: createDateOffset(2, 14, 0),
        endTime: createDateOffset(2, 16, 0),
        purpose: 'Thuyết trình đề án Nông nghiệp xanh',
        numberOfPeople: 8,
        equipmentItems: [
          { equipmentId: equipmentIds[0], quantity: 1, damagedQuantity: 0 }
        ],
        status: 'approved',
        rejectionReason: '',
        studentNote: '',
        staffNote: '',
        approvedBy: staffIds[1],
        approvedAt: createDateOffset(0, 11, 0),
        checkedInAt: null,
        completedAt: null,
        cancelledAt: null,
        createdAt: createDateOffset(0, 10, 30),
        updatedAt: createDateOffset(0, 11, 0)
      },
      {
        studentId: studentIds[4],
        roomId: roomIds[0],
        startTime: createDateOffset(2, 8, 0),
        endTime: createDateOffset(2, 10, 0),
        purpose: 'Thảo luận bài tập Ngôn ngữ học',
        numberOfPeople: 4,
        equipmentItems: [],
        status: 'pending',
        rejectionReason: '',
        studentNote: '',
        staffNote: '',
        approvedBy: null,
        approvedAt: null,
        checkedInAt: null,
        completedAt: null,
        cancelledAt: null,
        createdAt: createDateOffset(0, 11, 0),
        updatedAt: createDateOffset(0, 11, 0)
      },
      {
        studentId: studentIds[5],
        roomId: roomIds[1],
        startTime: createDateOffset(2, 10, 0),
        endTime: createDateOffset(2, 12, 0),
        purpose: 'Học nhóm Tố tụng hình sự',
        numberOfPeople: 5,
        equipmentItems: [],
        status: 'pending',
        rejectionReason: '',
        studentNote: '',
        staffNote: '',
        approvedBy: null,
        approvedAt: null,
        checkedInAt: null,
        completedAt: null,
        cancelledAt: null,
        createdAt: createDateOffset(0, 11, 30),
        updatedAt: createDateOffset(0, 11, 30)
      },
      {
        studentId: studentIds[6],
        roomId: roomIds[4],
        startTime: createDateOffset(3, 9, 0),
        endTime: createDateOffset(3, 11, 0),
        purpose: 'Thảo luận phương pháp giảng dạy',
        numberOfPeople: 6,
        equipmentItems: [
          { equipmentId: equipmentIds[4], quantity: 1, damagedQuantity: 0 }
        ],
        status: 'pending',
        rejectionReason: '',
        studentNote: '',
        staffNote: '',
        approvedBy: null,
        approvedAt: null,
        checkedInAt: null,
        completedAt: null,
        cancelledAt: null,
        createdAt: createDateOffset(0, 12, 0),
        updatedAt: createDateOffset(0, 12, 0)
      },
      {
        studentId: studentIds[7],
        roomId: roomIds[0],
        startTime: createDateOffset(-4, 9, 0),
        endTime: createDateOffset(-4, 11, 0),
        purpose: 'Đăng ký trùng giờ sử dụng',
        numberOfPeople: 4,
        equipmentItems: [],
        status: 'rejected',
        rejectionReason: 'Phòng đã có lượt đăng ký trùng khung giờ được duyệt trước',
        studentNote: '',
        staffNote: 'Xung đột lịch với booking khác',
        approvedBy: staffIds[0],
        approvedAt: null,
        checkedInAt: null,
        completedAt: null,
        cancelledAt: null,
        createdAt: createDateOffset(-5, 9, 0),
        updatedAt: createDateOffset(-4, 8, 0)
      },
      {
        studentId: studentIds[8],
        roomId: roomIds[1],
        startTime: createDateOffset(-3, 14, 0),
        endTime: createDateOffset(-3, 16, 0),
        purpose: 'Vượt quá sức chứa phòng',
        numberOfPeople: 15,
        equipmentItems: [],
        status: 'rejected',
        rejectionReason: 'Số lượng người đăng ký (15) vượt quá sức chứa tối đa của phòng (6)',
        studentNote: '',
        staffNote: 'Số người vượt sức chứa',
        approvedBy: staffIds[1],
        approvedAt: null,
        checkedInAt: null,
        completedAt: null,
        cancelledAt: null,
        createdAt: createDateOffset(-4, 10, 0),
        updatedAt: createDateOffset(-3, 13, 0)
      },
      {
        studentId: studentIds[0],
        roomId: roomIds[2],
        startTime: createDateOffset(-2, 8, 0),
        endTime: createDateOffset(-2, 10, 0),
        purpose: 'Bận đột xuất không sử dụng',
        numberOfPeople: 4,
        equipmentItems: [],
        status: 'cancelled',
        rejectionReason: '',
        studentNote: 'Bận lịch đột xuất nên hủy phòng',
        staffNote: '',
        approvedBy: null,
        approvedAt: null,
        checkedInAt: null,
        completedAt: null,
        cancelledAt: createDateOffset(-2, 7, 0),
        createdAt: createDateOffset(-3, 8, 0),
        updatedAt: createDateOffset(-2, 7, 0)
      },
      {
        studentId: studentIds[1],
        roomId: roomIds[3],
        startTime: createDateOffset(1, 8, 0),
        endTime: createDateOffset(1, 10, 0),
        purpose: 'Đổi sang ngày khác',
        numberOfPeople: 5,
        equipmentItems: [],
        status: 'cancelled',
        rejectionReason: '',
        studentNote: 'Muốn hủy để chọn phòng lớn hơn',
        staffNote: '',
        approvedBy: null,
        approvedAt: null,
        checkedInAt: null,
        completedAt: null,
        cancelledAt: createDateOffset(0, 10, 0),
        createdAt: createDateOffset(0, 8, 0),
        updatedAt: createDateOffset(0, 10, 0)
      }
    ];

    const bookingsResult = await db.collection(collections.BOOKINGS).insertMany(bookingsData);
    const bookingIds = Object.values(bookingsResult.insertedIds);

    const reviewsData = [
      {
        bookingId: bookingIds[0],
        studentId: studentIds[0],
        roomId: roomIds[0],
        rating: 5,
        comment: 'Phòng học rất sạch sẽ và thoáng mát. Bảng trắng mới và dễ viết.',
        createdAt: createDateOffset(-7, 10, 30),
        updatedAt: createDateOffset(-7, 10, 30)
      },
      {
        bookingId: bookingIds[1],
        studentId: studentIds[1],
        roomId: roomIds[0],
        rating: 4,
        comment: 'Đầy đủ tiện nghi, wifi kết nối ổn định. Sẽ đăng ký lại.',
        createdAt: createDateOffset(-7, 12, 15),
        updatedAt: createDateOffset(-7, 12, 15)
      },
      {
        bookingId: bookingIds[2],
        studentId: studentIds[2],
        roomId: roomIds[1],
        rating: 5,
        comment: 'Máy chiếu nét, không gian yên tĩnh rất thích hợp thuyết trình thử.',
        createdAt: createDateOffset(-6, 11, 20),
        updatedAt: createDateOffset(-6, 11, 20)
      },
      {
        bookingId: bookingIds[3],
        studentId: studentIds[3],
        roomId: roomIds[1],
        rating: 4,
        comment: 'Phòng học nhóm tiện lợi, bàn ghế sắp xếp hợp lý.',
        createdAt: createDateOffset(-6, 16, 30),
        updatedAt: createDateOffset(-6, 16, 30)
      },
      {
        bookingId: bookingIds[4],
        studentId: studentIds[4],
        roomId: roomIds[2],
        rating: 5,
        comment: 'Tivi LCD to rõ, kết nối nhanh chóng. Rất hài lòng.',
        createdAt: createDateOffset(-5, 10, 10),
        updatedAt: createDateOffset(-5, 10, 10)
      },
      {
        bookingId: bookingIds[5],
        studentId: studentIds[5],
        roomId: roomIds[2],
        rating: 3,
        comment: 'Phòng tốt nhưng máy lạnh đôi lúc hoạt động hơi ồn.',
        createdAt: createDateOffset(-4, 15, 10),
        updatedAt: createDateOffset(-4, 15, 10)
      },
      {
        bookingId: bookingIds[6],
        studentId: studentIds[6],
        roomId: roomIds[3],
        rating: 5,
        comment: 'Không gian rộng rãi, sức chứa đủ cho cả nhóm 8 người.',
        createdAt: createDateOffset(-3, 11, 45),
        updatedAt: createDateOffset(-3, 11, 45)
      },
      {
        bookingId: bookingIds[7],
        studentId: studentIds[7],
        roomId: roomIds[4],
        rating: 4,
        comment: 'Phòng mát mẻ, nhân viên hỗ trợ mượn ổ cắm nhiệt tình.',
        createdAt: createDateOffset(-2, 12, 30),
        updatedAt: createDateOffset(-2, 12, 30)
      }
    ];

    await db.collection(collections.REVIEWS).insertMany(reviewsData);

    console.log('Seeding completed successfully!');
    console.log(`- Rooms: ${roomsData.length}`);
    console.log(`- Equipment: ${equipmentData.length}`);
    console.log(`- Students: ${studentsData.length}`);
    console.log(`- Staff: ${staffData.length}`);
    console.log(`- Bookings: ${bookingsData.length}`);
    console.log(`- Reviews: ${reviewsData.length}`);

    await closeDatabaseConnection();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    await closeDatabaseConnection();
    process.exit(1);
  }
}

seed();

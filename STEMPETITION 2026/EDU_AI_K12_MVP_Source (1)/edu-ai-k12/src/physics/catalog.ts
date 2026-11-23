import type { PhysicsCatalogItem } from '../types/physics';

export const PHYSICS_GROUPS: { id: string; name: string }[] = [
  { id: 'A', name: 'Nhóm A – Động học' },
  { id: 'B', name: 'Nhóm B – Động lực học' },
  { id: 'C', name: 'Nhóm C – Năng lượng và động lượng' },
  { id: 'D', name: 'Nhóm D – Chuyển động tròn và hấp dẫn' },
  { id: 'E', name: 'Nhóm E – Dao động cơ học' },
  { id: 'F', name: 'Nhóm F – Sóng cơ và âm học' },
  { id: 'G', name: 'Nhóm G – Nhiệt học' },
  { id: 'H', name: 'Nhóm H – Điện học' },
  { id: 'I', name: 'Nhóm I – Từ trường và cảm ứng điện từ' },
  { id: 'J', name: 'Nhóm J – Quang học' },
];

export const PHYSICS_CATALOG: PhysicsCatalogItem[] = [
  // Group A
  { id: 'phys-01', orderNumber: 1, name: 'Chuyển động thẳng đều', groupId: 'A', groupName: 'Động học', suggestedGrades: [10], isTimeDependent: true, previewType: 'motion', status: 'implemented' },
  { id: 'phys-02', orderNumber: 2, name: 'Chuyển động thẳng biến đổi đều', groupId: 'A', groupName: 'Động học', suggestedGrades: [10], isTimeDependent: true, previewType: 'motion', status: 'implemented' },
  { id: 'phys-03', orderNumber: 3, name: 'Chuyển động rơi tự do', groupId: 'A', groupName: 'Động học', suggestedGrades: [10], isTimeDependent: true, previewType: 'motion', status: 'implemented' },
  { id: 'phys-04', orderNumber: 4, name: 'Chuyển động ném ngang', groupId: 'A', groupName: 'Động học', suggestedGrades: [10], isTimeDependent: true, previewType: 'projectile', status: 'implemented' },
  { id: 'phys-05', orderNumber: 5, name: 'Chuyển động ném xiên', groupId: 'A', groupName: 'Động học', suggestedGrades: [10], isTimeDependent: true, previewType: 'projectile', status: 'implemented' },
  // Group B
  { id: 'phys-06', orderNumber: 6, name: 'Định luật II Newton – Lực, khối lượng và gia tốc', groupId: 'B', groupName: 'Động lực học', suggestedGrades: [10], isTimeDependent: true, previewType: 'force', status: 'implemented' },
  { id: 'phys-07', orderNumber: 7, name: 'Chuyển động của vật trên mặt phẳng nghiêng', groupId: 'B', groupName: 'Động lực học', suggestedGrades: [10], isTimeDependent: true, previewType: 'force', status: 'implemented' },
  { id: 'phys-08', orderNumber: 8, name: 'Lực ma sát nghỉ và lực ma sát trượt', groupId: 'B', groupName: 'Động lực học', suggestedGrades: [10], isTimeDependent: true, previewType: 'force', status: 'implemented' },
  { id: 'phys-09', orderNumber: 9, name: 'Hệ hai vật nối bằng dây qua ròng rọc lý tưởng', groupId: 'B', groupName: 'Động lực học', suggestedGrades: [10], isTimeDependent: true, previewType: 'force', status: 'implemented' },
  { id: 'phys-10', orderNumber: 10, name: 'Lực đẩy Archimedes và sự nổi – chìm của vật', groupId: 'B', groupName: 'Động lực học', suggestedGrades: [8, 10], isTimeDependent: true, previewType: 'force', status: 'implemented' },
  // Group C
  { id: 'phys-11', orderNumber: 11, name: 'Chuyển hóa giữa động năng và thế năng', groupId: 'C', groupName: 'Năng lượng và động lượng', suggestedGrades: [10], isTimeDependent: true, previewType: 'energy', status: 'implemented' },
  { id: 'phys-12', orderNumber: 12, name: 'Thế năng đàn hồi và năng lượng của lò xo', groupId: 'C', groupName: 'Năng lượng và động lượng', suggestedGrades: [10, 12], isTimeDependent: true, previewType: 'energy', status: 'implemented' },
  { id: 'phys-13', orderNumber: 13, name: 'Va chạm đàn hồi một chiều', groupId: 'C', groupName: 'Năng lượng và động lượng', suggestedGrades: [10], isTimeDependent: true, previewType: 'energy', status: 'implemented' },
  { id: 'phys-14', orderNumber: 14, name: 'Va chạm mềm một chiều', groupId: 'C', groupName: 'Năng lượng và động lượng', suggestedGrades: [10], isTimeDependent: true, previewType: 'energy', status: 'implemented' },
  { id: 'phys-15', orderNumber: 15, name: 'Chuyển động giật lùi do bảo toàn động lượng', groupId: 'C', groupName: 'Năng lượng và động lượng', suggestedGrades: [10], isTimeDependent: true, previewType: 'energy', status: 'implemented' },
  // Group D
  { id: 'phys-16', orderNumber: 16, name: 'Chuyển động tròn đều', groupId: 'D', groupName: 'Chuyển động tròn và hấp dẫn', suggestedGrades: [10], isTimeDependent: true, previewType: 'orbit', status: 'implemented' },
  { id: 'phys-17', orderNumber: 17, name: 'Lực hướng tâm và gia tốc hướng tâm', groupId: 'D', groupName: 'Chuyển động tròn và hấp dẫn', suggestedGrades: [10], isTimeDependent: true, previewType: 'orbit', status: 'implemented' },
  { id: 'phys-18', orderNumber: 18, name: 'Mômen lực và đòn bẩy', groupId: 'D', groupName: 'Chuyển động tròn và hấp dẫn', suggestedGrades: [8, 10], isTimeDependent: false, previewType: 'force', status: 'implemented' },
  { id: 'phys-19', orderNumber: 19, name: 'Chuyển động quay dưới tác dụng của mômen lực', groupId: 'D', groupName: 'Chuyển động tròn và hấp dẫn', suggestedGrades: [10, 12], isTimeDependent: true, previewType: 'orbit', status: 'implemented' },
  { id: 'phys-20', orderNumber: 20, name: 'Chuyển động quỹ đạo dưới tác dụng lực hấp dẫn Newton', groupId: 'D', groupName: 'Chuyển động tròn và hấp dẫn', suggestedGrades: [10, 11], isTimeDependent: true, previewType: 'orbit', status: 'implemented' },
  // Group E
  { id: 'phys-21', orderNumber: 21, name: 'Dao động điều hòa của con lắc lò xo', groupId: 'E', groupName: 'Dao động cơ học', suggestedGrades: [11], isTimeDependent: true, previewType: 'oscillation', status: 'implemented' },
  { id: 'phys-22', orderNumber: 22, name: 'Dao động con lắc đơn', groupId: 'E', groupName: 'Dao động cơ học', suggestedGrades: [11], isTimeDependent: true, previewType: 'oscillation', status: 'implemented' },
  { id: 'phys-23', orderNumber: 23, name: 'Dao động tắt dần', groupId: 'E', groupName: 'Dao động cơ học', suggestedGrades: [11], isTimeDependent: true, previewType: 'oscillation', status: 'implemented' },
  { id: 'phys-24', orderNumber: 24, name: 'Dao động cưỡng bức và hiện tượng cộng hưởng', groupId: 'E', groupName: 'Dao động cơ học', suggestedGrades: [11], isTimeDependent: true, previewType: 'oscillation', status: 'implemented' },
  { id: 'phys-25', orderNumber: 25, name: 'Tổng hợp hai dao động điều hòa cùng phương', groupId: 'E', groupName: 'Dao động cơ học', suggestedGrades: [11], isTimeDependent: true, previewType: 'oscillation', status: 'implemented' },
  // Group F
  { id: 'phys-26', orderNumber: 26, name: 'Sóng ngang truyền trên dây', groupId: 'F', groupName: 'Sóng cơ và âm học', suggestedGrades: [11], isTimeDependent: true, previewType: 'wave', status: 'implemented' },
  { id: 'phys-27', orderNumber: 27, name: 'Sóng dọc và sự lan truyền âm', groupId: 'F', groupName: 'Sóng cơ và âm học', suggestedGrades: [11], isTimeDependent: true, previewType: 'wave', status: 'implemented' },
  { id: 'phys-28', orderNumber: 28, name: 'Hiện tượng phản xạ sóng', groupId: 'F', groupName: 'Sóng cơ và âm học', suggestedGrades: [11], isTimeDependent: true, previewType: 'wave', status: 'implemented' },
  { id: 'phys-29', orderNumber: 29, name: 'Sóng dừng trên dây', groupId: 'F', groupName: 'Sóng cơ và âm học', suggestedGrades: [11], isTimeDependent: true, previewType: 'wave', status: 'implemented' },
  { id: 'phys-30', orderNumber: 30, name: 'Giao thoa sóng từ hai nguồn kết hợp', groupId: 'F', groupName: 'Sóng cơ và âm học', suggestedGrades: [11], isTimeDependent: true, previewType: 'wave', status: 'implemented' },
  // Group G
  { id: 'phys-31', orderNumber: 31, name: 'Quá trình đẳng nhiệt của khí lý tưởng', groupId: 'G', groupName: 'Nhiệt học', suggestedGrades: [12], isTimeDependent: false, previewType: 'thermo', status: 'implemented' },
  { id: 'phys-32', orderNumber: 32, name: 'Quá trình đẳng áp của khí lý tưởng', groupId: 'G', groupName: 'Nhiệt học', suggestedGrades: [12], isTimeDependent: false, previewType: 'thermo', status: 'implemented' },
  { id: 'phys-33', orderNumber: 33, name: 'Quá trình đẳng tích của khí lý tưởng', groupId: 'G', groupName: 'Nhiệt học', suggestedGrades: [12], isTimeDependent: false, previewType: 'thermo', status: 'implemented' },
  { id: 'phys-34', orderNumber: 34, name: 'Trao đổi nhiệt giữa hai vật', groupId: 'G', groupName: 'Nhiệt học', suggestedGrades: [8, 12], isTimeDependent: true, previewType: 'thermo', status: 'implemented' },
  { id: 'phys-35', orderNumber: 35, name: 'Truyền nhiệt bằng dẫn nhiệt trong vật rắn', groupId: 'G', groupName: 'Nhiệt học', suggestedGrades: [8, 12], isTimeDependent: true, previewType: 'thermo', status: 'implemented' },
  // Group H
  { id: 'phys-36', orderNumber: 36, name: 'Lực tương tác Coulomb giữa hai điện tích điểm', groupId: 'H', groupName: 'Điện học', suggestedGrades: [11], isTimeDependent: false, previewType: 'electric', status: 'implemented' },
  { id: 'phys-37', orderNumber: 37, name: 'Đường sức điện trường của các điện tích điểm', groupId: 'H', groupName: 'Điện học', suggestedGrades: [11], isTimeDependent: false, previewType: 'electric', status: 'implemented' },
  { id: 'phys-38', orderNumber: 38, name: 'Điện thế và đường đẳng thế', groupId: 'H', groupName: 'Điện học', suggestedGrades: [11], isTimeDependent: false, previewType: 'electric', status: 'implemented' },
  { id: 'phys-39', orderNumber: 39, name: 'Mạch điện một chiều có các điện trở mắc nối tiếp', groupId: 'H', groupName: 'Điện học', suggestedGrades: [9, 11], isTimeDependent: true, previewType: 'electric', status: 'implemented' },
  { id: 'phys-40', orderNumber: 40, name: 'Mạch điện một chiều có các điện trở mắc song song', groupId: 'H', groupName: 'Điện học', suggestedGrades: [9, 11], isTimeDependent: true, previewType: 'electric', status: 'implemented' },
  // Group I
  { id: 'phys-41', orderNumber: 41, name: 'Từ trường xung quanh dây dẫn thẳng có dòng điện', groupId: 'I', groupName: 'Từ trường và cảm ứng điện từ', suggestedGrades: [9, 12], isTimeDependent: false, previewType: 'magnetic', status: 'implemented' },
  { id: 'phys-42', orderNumber: 42, name: 'Từ trường của ống dây có dòng điện', groupId: 'I', groupName: 'Từ trường và cảm ứng điện từ', suggestedGrades: [9, 12], isTimeDependent: false, previewType: 'magnetic', status: 'implemented' },
  { id: 'phys-43', orderNumber: 43, name: 'Chuyển động của điện tích trong từ trường đều', groupId: 'I', groupName: 'Từ trường và cảm ứng điện từ', suggestedGrades: [12], isTimeDependent: true, previewType: 'magnetic', status: 'implemented' },
  { id: 'phys-44', orderNumber: 44, name: 'Hiện tượng cảm ứng điện từ và định luật Faraday – Lenz', groupId: 'I', groupName: 'Từ trường và cảm ứng điện từ', suggestedGrades: [12], isTimeDependent: true, previewType: 'magnetic', status: 'implemented' },
  { id: 'phys-45', orderNumber: 45, name: 'Nguyên lý hoạt động của máy biến áp lý tưởng', groupId: 'I', groupName: 'Từ trường và cảm ứng điện từ', suggestedGrades: [12], isTimeDependent: true, previewType: 'magnetic', status: 'implemented' },
  // Group J
  { id: 'phys-46', orderNumber: 46, name: 'Phản xạ ánh sáng trên gương phẳng', groupId: 'J', groupName: 'Quang học', suggestedGrades: [7, 9], isTimeDependent: false, previewType: 'optics', status: 'implemented' },
  { id: 'phys-47', orderNumber: 47, name: 'Khúc xạ ánh sáng tại mặt phân cách hai môi trường', groupId: 'J', groupName: 'Quang học', suggestedGrades: [9, 11], isTimeDependent: false, previewType: 'optics', status: 'implemented' },
  { id: 'phys-48', orderNumber: 48, name: 'Hiện tượng phản xạ toàn phần', groupId: 'J', groupName: 'Quang học', suggestedGrades: [9, 11], isTimeDependent: false, previewType: 'optics', status: 'implemented' },
  { id: 'phys-49', orderNumber: 49, name: 'Sự tạo ảnh qua thấu kính hội tụ mỏng', groupId: 'J', groupName: 'Quang học', suggestedGrades: [9, 11], isTimeDependent: false, previewType: 'optics', status: 'implemented' },
  { id: 'phys-50', orderNumber: 50, name: 'Sự tạo ảnh qua gương cầu lõm', groupId: 'J', groupName: 'Quang học', suggestedGrades: [8, 11], isTimeDependent: false, previewType: 'optics', status: 'implemented' },
];

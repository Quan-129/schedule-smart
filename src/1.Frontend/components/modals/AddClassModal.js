/**
 * @file AddClassModal.js
 * @description Component Modal Thêm / Chỉnh Sửa Tiết Học Nhanh vào từng Ngày trên Lịch Học
 *              Tích hợp cơ chế chọn giờ Con Lăn 3D chuẩn Báo Thức iPhone (iOS Alarm Drum Roller Wheel),
 *              Bộ Chọn Logo/Icon Môn Học (~120 Icon Tiêu Biểu Theo Ngành),
 *              và Tự Động Đồng Bộ Link Google Drive từ Chiếc Cặp & Lưu Môn Mới vào Chiếc Cặp
 * @module 1.Frontend/components/modals/AddClassModal
 */

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { formatSafeUrl } from '../../../4.Security/urlValidator.js';
import { state, persistDriveSubjects } from '../../../3.Database/state.js';
import { showToast } from '../Toast.js';

// ============================================================================
// 2. CONSTANTS, ICON LIBRARY & STATE
// ============================================================================
const MODAL_ID = 'add-class-modal';
const PICKER_MODAL_ID = 'ios-wheel-picker-modal';
const ICON_PICKER_MODAL_ID = 'subject-icon-picker-modal';
const ITEM_HEIGHT = 44; // Chiều cao mỗi nấc con lăn (chuẩn iOS)

let currentEditingClass = null; // { dayName, classIndex, classData }
let onSaveCallback = null;
let onDeleteCallback = null;
let isEventsBound = false;
let isPickerEventsBound = false;
let isIconPickerEventsBound = false;

// Trạng thái modal
const pickerState = {
  startTime: '07:00',
  endTime: '08:50',
  activeTarget: 'start', // 'start' | 'end'
  selectedIcon: 'fa-solid fa-book',
  activeIconCategory: 'all'
};

/**
 * Danh sách hơn 560+ Icons tiêu biểu chia theo 11 nhóm ngành học & đời sống sinh viên đa năng
 */
export const POPULAR_SUBJECT_ICONS = [
  // ==========================================================================
  // 🤖 1. CÔNG NGHỆ THÔNG TIN, LẬP TRÌNH & TRÍ TUỆ NHÂN TẠO (55 icons)
  // ==========================================================================
  { icon: 'fa-solid fa-robot', label: 'Robot / AI', category: 'tech' },
  { icon: 'fa-solid fa-code', label: 'Code / Lập trình', category: 'tech' },
  { icon: 'fa-solid fa-laptop-code', label: 'Laptop Code', category: 'tech' },
  { icon: 'fa-solid fa-terminal', label: 'Terminal / CLI', category: 'tech' },
  { icon: 'fa-solid fa-microchip', label: 'Vi mạch / Phần cứng', category: 'tech' },
  { icon: 'fa-solid fa-brain', label: 'Trí tuệ nhân tạo / Deep Learning', category: 'tech' },
  { icon: 'fa-solid fa-database', label: 'Cơ sở dữ liệu / SQL', category: 'tech' },
  { icon: 'fa-solid fa-server', label: 'Server / Máy chủ', category: 'tech' },
  { icon: 'fa-solid fa-network-wired', label: 'Mạng máy tính', category: 'tech' },
  { icon: 'fa-solid fa-cloud', label: 'Điện toán đám mây Cloud', category: 'tech' },
  { icon: 'fa-solid fa-cloud-arrow-up', label: 'Cloud Deploy / Upload', category: 'tech' },
  { icon: 'fa-solid fa-shield-halved', label: 'An ninh mạng / Cyber Security', category: 'tech' },
  { icon: 'fa-solid fa-lock', label: 'Bảo mật / Mã hóa dữ liệu', category: 'tech' },
  { icon: 'fa-solid fa-unlock', label: 'Giải mã bảo mật', category: 'tech' },
  { icon: 'fa-solid fa-bug', label: 'Kiểm thử / Debug phần mềm', category: 'tech' },
  { icon: 'fa-solid fa-mobile-screen', label: 'Lập trình Mobile App', category: 'tech' },
  { icon: 'fa-solid fa-tablet-screen-button', label: 'Ứng dụng Tablet', category: 'tech' },
  { icon: 'fa-solid fa-globe', label: 'Lập trình Web Frontend/Backend', category: 'tech' },
  { icon: 'fa-solid fa-wifi', label: 'Mạng IoT / Không dây', category: 'tech' },
  { icon: 'fa-solid fa-satellite-dish', label: 'Viễn thông / Radar', category: 'tech' },
  { icon: 'fa-solid fa-gamepad', label: 'Lập trình Game Dev', category: 'tech' },
  { icon: 'fa-solid fa-vr-cardboard', label: 'Thực tế ảo VR / AR', category: 'tech' },
  { icon: 'fa-solid fa-gears', label: 'Hệ điều hành / OS', category: 'tech' },
  { icon: 'fa-solid fa-file-code', label: 'Mã nguồn Script / Source', category: 'tech' },
  { icon: 'fa-solid fa-sitemap', label: 'Cấu trúc dữ liệu & Giải thuật', category: 'tech' },
  { icon: 'fa-solid fa-cubes', label: 'Kiến trúc Module / Microservices', category: 'tech' },
  { icon: 'fa-solid fa-key', label: 'Mật mã học / Cryptography', category: 'tech' },
  { icon: 'fa-solid fa-tower-broadcast', label: 'Truyền thông vô tuyến', category: 'tech' },
  { icon: 'fa-solid fa-laptop', label: 'Máy tính xách tay', category: 'tech' },
  { icon: 'fa-solid fa-desktop', label: 'Máy tính để bàn PC', category: 'tech' },
  { icon: 'fa-solid fa-display', label: 'Màn hình máy tính', category: 'tech' },
  { icon: 'fa-solid fa-keyboard', label: 'Bàn phím cơ', category: 'tech' },
  { icon: 'fa-solid fa-hard-drive', label: 'Ổ đĩa SSD / HDD', category: 'tech' },
  { icon: 'fa-solid fa-memory', label: 'Bộ nhớ RAM / Cache', category: 'tech' },
  { icon: 'fa-solid fa-sim-card', label: 'Chip nhúng / SIM', category: 'tech' },
  { icon: 'fa-solid fa-tower-cell', label: 'Trạm 5G / Di động', category: 'tech' },
  { icon: 'fa-solid fa-code-branch', label: 'Git Branch / Nhánh', category: 'tech' },
  { icon: 'fa-solid fa-code-commit', label: 'Git Commit', category: 'tech' },
  { icon: 'fa-solid fa-code-merge', label: 'Git Merge / Hợp nhất', category: 'tech' },
  { icon: 'fa-solid fa-code-pull-request', label: 'Pull Request PR', category: 'tech' },
  { icon: 'fa-solid fa-window-restore', label: 'Cửa sổ ứng dụng Window', category: 'tech' },
  { icon: 'fa-solid fa-window-maximize', label: 'Phần mềm toàn màn hình', category: 'tech' },
  { icon: 'fa-solid fa-barcode', label: 'Mã vạch Barcode', category: 'tech' },
  { icon: 'fa-solid fa-qrcode', label: 'Mã quét QR Code', category: 'tech' },
  { icon: 'fa-solid fa-fingerprint', label: 'Sinh trắc học Fingerprint', category: 'tech' },
  { icon: 'fa-solid fa-shield-virus', label: 'Phần mềm Diệt Virus', category: 'tech' },
  { icon: 'fa-solid fa-user-shield', label: 'Quản trị mạng Admin', category: 'tech' },
  { icon: 'fa-solid fa-folder-tree', label: 'Cây thư mục Source', category: 'tech' },
  { icon: 'fa-solid fa-binary', label: 'Hệ nhị phân 0101', category: 'tech' },
  { icon: 'fa-solid fa-chart-simple', label: 'Khai phá dữ liệu Data Mining', category: 'tech' },
  { icon: 'fa-solid fa-diagram-project', label: 'Quy trình Agile / Scrum', category: 'tech' },
  { icon: 'fa-solid fa-eye', label: 'Thị giác máy tính Computer Vision', category: 'tech' },
  { icon: 'fa-solid fa-headset', label: 'Hỗ trợ kỹ thuật IT Helpdesk', category: 'tech' },
  { icon: 'fa-solid fa-compact-disc', label: 'Cài đặt phần mềm OS', category: 'tech' },
  { icon: 'fa-solid fa-microchip', label: 'Bộ xử lý CPU / GPU', category: 'tech' },

  // ==========================================================================
  // ⚙️ 2. KỸ THUẬT, CƠ KHÍ, ĐIỆN & XÂY DỰNG (55 icons)
  // ==========================================================================
  { icon: 'fa-solid fa-gear', label: 'Cơ khí chế tạo / Bánh răng', category: 'eng' },
  { icon: 'fa-solid fa-screwdriver-wrench', label: 'Bảo trì cơ điện M&E', category: 'eng' },
  { icon: 'fa-solid fa-wrench', label: 'Cờ lê kỹ thuật', category: 'eng' },
  { icon: 'fa-solid fa-hammer', label: 'Gia công kim loại / Búa', category: 'eng' },
  { icon: 'fa-solid fa-toolbox', label: 'Hộp đồ nghề kỹ thuật', category: 'eng' },
  { icon: 'fa-solid fa-industry', label: 'Nhà máy / Công nghiệp', category: 'eng' },
  { icon: 'fa-solid fa-helmet-safety', label: 'An toàn lao động HSE', category: 'eng' },
  { icon: 'fa-solid fa-oil-well', label: 'Kỹ thuật Dầu khí / Giàn khoan', category: 'eng' },
  { icon: 'fa-solid fa-gas-pump', label: 'Nhiên liệu & Năng lượng', category: 'eng' },
  { icon: 'fa-solid fa-bridge', label: 'Cầu đường / Giao thông', category: 'eng' },
  { icon: 'fa-solid fa-building', label: 'Kỹ thuật Xây dựng dân dụng', category: 'eng' },
  { icon: 'fa-solid fa-road', label: 'Quy hoạch hạ tầng đô thị', category: 'eng' },
  { icon: 'fa-solid fa-compass-drafting', label: 'Vẽ kỹ thuật AutoCAD / SolidWorks', category: 'eng' },
  { icon: 'fa-solid fa-ruler-combined', label: 'Trắc địa / Đo lường', category: 'eng' },
  { icon: 'fa-solid fa-ruler-horizontal', label: 'Thước đo khoảng cách', category: 'eng' },
  { icon: 'fa-solid fa-temperature-high', label: 'Kỹ thuật Nhiệt - Lạnh', category: 'eng' },
  { icon: 'fa-solid fa-fan', label: 'Thông gió & Khí động', category: 'eng' },
  { icon: 'fa-solid fa-water', label: 'Thủy lực & Cấp thoát nước', category: 'eng' },
  { icon: 'fa-solid fa-faucet-drip', label: 'Hệ thống đường ống Pipeline', category: 'eng' },
  { icon: 'fa-solid fa-fire-extinguisher', label: 'Phòng cháy chữa cháy PCCC', category: 'eng' },
  { icon: 'fa-solid fa-bolt', label: 'Kỹ thuật Điện cao thế', category: 'eng' },
  { icon: 'fa-solid fa-bolt-lightning', label: 'Động cơ điện Motor', category: 'eng' },
  { icon: 'fa-solid fa-plug', label: 'Thiết bị điện tử công suất', category: 'eng' },
  { icon: 'fa-solid fa-solar-panel', label: 'Năng lượng tái tạo Solar', category: 'eng' },
  { icon: 'fa-solid fa-car', label: 'Kỹ thuật Ô tô Automotive', category: 'eng' },
  { icon: 'fa-solid fa-car-side', label: 'Động lực học xe hơi', category: 'eng' },
  { icon: 'fa-solid fa-car-battery', label: 'Xe điện EV & Pin Lithium', category: 'eng' },
  { icon: 'fa-solid fa-plane', label: 'Kỹ thuật Hàng không', category: 'eng' },
  { icon: 'fa-solid fa-plane-departure', label: 'Khí động lực máy bay', category: 'eng' },
  { icon: 'fa-solid fa-helicopter', label: 'Trực thăng / Động cơ đẩy', category: 'eng' },
  { icon: 'fa-solid fa-train', label: 'Đường sắt đô thị Metro', category: 'eng' },
  { icon: 'fa-solid fa-truck', label: 'Cơ giới công trình', category: 'eng' },
  { icon: 'fa-solid fa-ship', label: 'Kỹ thuật Đóng tàu', category: 'eng' },
  { icon: 'fa-solid fa-anchor', label: 'Cảng biển / Hàng hải', category: 'eng' },
  { icon: 'fa-solid fa-screwdriver', label: 'Tuốc nơ vít lắp ráp', category: 'eng' },
  { icon: 'fa-solid fa-gauge-high', label: 'Đồng hồ đo áp suất / RPM', category: 'eng' },
  { icon: 'fa-solid fa-magnet', label: 'Điện từ trường Lorentz', category: 'eng' },
  { icon: 'fa-solid fa-layer-group', label: 'Khoa học Vật liệu mới', category: 'eng' },
  { icon: 'fa-solid fa-cubes-stacked', label: 'Vật liệu xây dựng Bê tông', category: 'eng' },
  { icon: 'fa-solid fa-battery-full', label: 'Hệ thống Lưu trữ năng lượng', category: 'eng' },
  { icon: 'fa-solid fa-lightbulb', label: 'Hệ thống Chiếu sáng kỹ thuật', category: 'eng' },
  { icon: 'fa-solid fa-satellite', label: 'Công nghệ Vệ tinh quỹ đạo', category: 'eng' },
  { icon: 'fa-solid fa-rocket', label: 'Hàng không vũ trụ Rocket', category: 'eng' },
  { icon: 'fa-solid fa-person-digging', label: 'Khảo sát Địa chất công trình', category: 'eng' },
  { icon: 'fa-solid fa-trowel', label: 'Bay thợ nề xây dựng', category: 'eng' },
  { icon: 'fa-solid fa-power-off', label: 'Tự động hóa PLC / SCADA', category: 'eng' },
  { icon: 'fa-solid fa-recycle', label: 'Kỹ thuật Xử lý chất thải', category: 'eng' },
  { icon: 'fa-solid fa-tree', label: 'Kỹ thuật Môi trường sinh thái', category: 'eng' },
  { icon: 'fa-solid fa-shield', label: 'Vật liệu chống ăn mòn', category: 'eng' },
  { icon: 'fa-solid fa-boxes-packing', label: 'Dây chuyền Đóng gói tự động', category: 'eng' },
  { icon: 'fa-solid fa-truck-pickup', label: 'Xe bán tải công trường', category: 'eng' },
  { icon: 'fa-solid fa-fire', label: 'Nhiệt luyện kim loại', category: 'eng' },
  { icon: 'fa-solid fa-wind', label: 'Năng lượng Gió Wind Turbine', category: 'eng' },
  { icon: 'fa-solid fa-gears', label: 'Hệ thống Cơ điện tử Mechatronics', category: 'eng' },
  { icon: 'fa-solid fa-circle-nodes', label: 'Cảm biến Sensor công nghiệp', category: 'eng' },

  // ==========================================================================
  // 📐 3. TOÁN HỌC, VẬT LÝ, HÓA HỌC & SINH HỌC (50 icons)
  // ==========================================================================
  { icon: 'fa-solid fa-calculator', label: 'Toán cao cấp / Đại số', category: 'science' },
  { icon: 'fa-solid fa-square-root-variable', label: 'Giải tích Calculus / Căn bậc', category: 'science' },
  { icon: 'fa-solid fa-divide', label: 'Toán rời rạc / Phép chia', category: 'science' },
  { icon: 'fa-solid fa-plus-minus', label: 'Sai số đo lường / Thống kê', category: 'science' },
  { icon: 'fa-solid fa-infinity', label: 'Vô cực / Giới hạn Limit', category: 'science' },
  { icon: 'fa-solid fa-atom', label: 'Vật lý nguyên tử / Lượng tử', category: 'science' },
  { icon: 'fa-solid fa-flask', label: 'Hóa học vô cơ / Bình tam giác', category: 'science' },
  { icon: 'fa-solid fa-flask-vial', label: 'Hóa học hữu cơ / Phản ứng', category: 'science' },
  { icon: 'fa-solid fa-vial', label: 'Hóa phân tích / Ống nghiệm', category: 'science' },
  { icon: 'fa-solid fa-vials', label: 'Phòng thí nghiệm Hóa học', category: 'science' },
  { icon: 'fa-solid fa-dna', label: 'Sinh học phân tử / Di truyền', category: 'science' },
  { icon: 'fa-solid fa-microscope', label: 'Kính hiển vi / Vi sinh', category: 'science' },
  { icon: 'fa-solid fa-telescope', label: 'Thiên văn học / Vũ trụ', category: 'science' },
  { icon: 'fa-solid fa-wave-square', label: 'Vật lý Sóng & Dao động', category: 'science' },
  { icon: 'fa-solid fa-circle-nodes', label: 'Lý thuyết đồ thị Graph Theory', category: 'science' },
  { icon: 'fa-solid fa-shapes', label: 'Hình học không gian Topology', category: 'science' },
  { icon: 'fa-solid fa-chart-area', label: 'Tích phân vi phân Integral', category: 'science' },
  { icon: 'fa-solid fa-chart-line', label: 'Hàm số & Phương trình vi phân', category: 'science' },
  { icon: 'fa-solid fa-chart-pie', label: 'Xác suất thống kê xác thực', category: 'science' },
  { icon: 'fa-solid fa-chart-column', label: 'Phân phối chuẩn Gauss', category: 'science' },
  { icon: 'fa-solid fa-dice', label: 'Biến cố ngẫu nhiên Random', category: 'science' },
  { icon: 'fa-solid fa-dice-d20', label: 'Hình học đa chiều Dimension', category: 'science' },
  { icon: 'fa-solid fa-scale-unbalanced', label: 'Bất đẳng thức toán học', category: 'science' },
  { icon: 'fa-solid fa-circle-dot', label: 'Tọa độ cực & Lượng giác', category: 'science' },
  { icon: 'fa-solid fa-draw-polygon', label: 'Hình học Euclid', category: 'science' },
  { icon: 'fa-solid fa-cube', label: 'Hình lập phương / Tinh thể học', category: 'science' },
  { icon: 'fa-solid fa-vector-square', label: 'Không gian Vector / Ma trận', category: 'science' },
  { icon: 'fa-solid fa-radiation', label: 'Vật lý Hạt nhân phóng xạ', category: 'science' },
  { icon: 'fa-solid fa-droplet', label: 'Hóa học Dung dịch & pH', category: 'science' },
  { icon: 'fa-solid fa-fire-flame-curved', label: 'Nhiệt động lực học Thermody', category: 'science' },
  { icon: 'fa-solid fa-snowflake', label: 'Vật lý Siêu dẫn Cryogenics', category: 'science' },
  { icon: 'fa-solid fa-sun', label: 'Quang học & Sóng điện từ', category: 'science' },
  { icon: 'fa-solid fa-moon', label: 'Vũ trụ học Astrophysics', category: 'science' },
  { icon: 'fa-solid fa-meteor', label: 'Địa chất học & Khoáng vật', category: 'science' },
  { icon: 'fa-solid fa-volcano', label: 'Địa vật lý Núi lửa', category: 'science' },
  { icon: 'fa-solid fa-wind', label: 'Khí tượng & Thủy văn', category: 'science' },
  { icon: 'fa-solid fa-eye-dropper', label: 'Chuẩn độ Hóa lý', category: 'science' },
  { icon: 'fa-solid fa-bacterium', label: 'Vi khuẩn học Bacteriology', category: 'science' },
  { icon: 'fa-solid fa-virus', label: 'Virus học Virology', category: 'science' },
  { icon: 'fa-solid fa-seedling', label: 'Sinh thái học Thực vật', category: 'science' },
  { icon: 'fa-solid fa-feather', label: 'Động vật học Zoology', category: 'science' },
  { icon: 'fa-solid fa-fish', label: 'Thủy sinh học Hydrobiology', category: 'science' },
  { icon: 'fa-solid fa-magnet', label: 'Từ học & Vật liệu từ', category: 'science' },
  { icon: 'fa-solid fa-plug-circle-bolt', label: 'Điện hóa học Electrochemistry', category: 'science' },
  { icon: 'fa-solid fa-vial-circle-check', label: 'Kiểm nghiệm mẫu hóa học', category: 'science' },
  { icon: 'fa-solid fa-scale-balanced', label: 'Cân bằng phương trình Hóa học', category: 'science' },
  { icon: 'fa-solid fa-brain', label: 'Khoa học thần kinh Neuroscience', category: 'science' },
  { icon: 'fa-solid fa-cubes', label: 'Mạng tinh thể chất rắn', category: 'science' },
  { icon: 'fa-solid fa-lightbulb', label: 'Phát minh Khoa học mới', category: 'science' },
  { icon: 'fa-solid fa-compass', label: 'Định hướng Địa từ trường', category: 'science' },

  // ==========================================================================
  // 🧬 4. Y DƯỢC, SỨC KHỎE & NÔNG LÂM NGHIỆP (45 icons)
  // ==========================================================================
  { icon: 'fa-solid fa-heart-pulse', label: 'Y học lâm sàng / Tim mạch', category: 'med' },
  { icon: 'fa-solid fa-stethoscope', label: 'Khám bệnh / Bác sĩ đa khoa', category: 'med' },
  { icon: 'fa-solid fa-syringe', label: 'Gây mê / Tiêm chủng Vaccine', category: 'med' },
  { icon: 'fa-solid fa-prescription-bottle', label: 'Dược lý học / Lọ thuốc', category: 'med' },
  { icon: 'fa-solid fa-prescription-bottle-medical', label: 'Kê đơn thuốc Dược lâm sàng', category: 'med' },
  { icon: 'fa-solid fa-pills', label: 'Dược liệu học / Viên thuốc', category: 'med' },
  { icon: 'fa-solid fa-tablets', label: 'Bào chế thuốc Viên nén', category: 'med' },
  { icon: 'fa-solid fa-hospital', label: 'Quản lý Bệnh viện Y tế', category: 'med' },
  { icon: 'fa-solid fa-user-doctor', label: 'Bác sĩ chuyên khoa', category: 'med' },
  { icon: 'fa-solid fa-user-nurse', label: 'Điều dưỡng & Chăm sóc', category: 'med' },
  { icon: 'fa-solid fa-kit-medical', label: 'Cấp cứu ban đầu / First Aid', category: 'med' },
  { icon: 'fa-solid fa-bandage', label: 'Ngoại khoa / Vết thương', category: 'med' },
  { icon: 'fa-solid fa-crutch', label: 'Vật lý trị liệu Phục hồi chức năng', category: 'med' },
  { icon: 'fa-solid fa-wheelchair', label: 'Y học phục hồi khuyết tật', category: 'med' },
  { icon: 'fa-solid fa-truck-medical', label: 'Xe cứu thương 115', category: 'med' },
  { icon: 'fa-solid fa-hand-holding-medical', label: 'Bảo hiểm Y tế & Xã hội', category: 'med' },
  { icon: 'fa-solid fa-teeth', label: 'Răng Hàm Mặt / Nha khoa', category: 'med' },
  { icon: 'fa-solid fa-bone', label: 'Chấn thương Chỉnh hình / Xương', category: 'med' },
  { icon: 'fa-solid fa-lungs', label: 'Bệnh học Hô hấp / Phổi', category: 'med' },
  { icon: 'fa-solid fa-eye', label: 'Mắt / Nhãn khoa Ophthalmology', category: 'med' },
  { icon: 'fa-solid fa-ear-listen', label: 'Tai Mũi Họng / Thính giác', category: 'med' },
  { icon: 'fa-solid fa-head-side-virus', label: 'Tâm thần học & Tâm lý lâm sàng', category: 'med' },
  { icon: 'fa-solid fa-mask-face', label: 'Y tế dự phòng & Chống dịch', category: 'med' },
  { icon: 'fa-solid fa-wheat-awn', label: 'Khoa học Cây trồng / Nông học', category: 'med' },
  { icon: 'fa-solid fa-seedling', label: 'Công nghệ Sinh học Nông nghiệp', category: 'med' },
  { icon: 'fa-solid fa-plant-wilt', label: 'Bảo vệ thực vật & Bệnh cây', category: 'med' },
  { icon: 'fa-solid fa-leaf', label: 'Lâm sinh & Tài nguyên rừng', category: 'med' },
  { icon: 'fa-solid fa-tree', label: 'Quản lý Rừng & Môi trường', category: 'med' },
  { icon: 'fa-solid fa-apple-whole', label: 'Công nghệ Thực phẩm & Dinh dưỡng', category: 'med' },
  { icon: 'fa-solid fa-carrot', label: 'Nông nghiệp Công nghệ cao', category: 'med' },
  { icon: 'fa-solid fa-cow', label: 'Chăn nuôi gia súc Animal Science', category: 'med' },
  { icon: 'fa-solid fa-horse', label: 'Bác sĩ Thú y Veterinary', category: 'med' },
  { icon: 'fa-solid fa-dog', label: 'Thú y thú cưng Pet Care', category: 'med' },
  { icon: 'fa-solid fa-cat', label: 'Bệnh học động vật nhỏ', category: 'med' },
  { icon: 'fa-solid fa-fish', label: 'Nuôi trồng Thủy hải sản', category: 'med' },
  { icon: 'fa-solid fa-tractor', label: 'Cơ giới hóa Nông nghiệp', category: 'med' },
  { icon: 'fa-solid fa-spray-can', label: 'Thuốc bảo vệ thực vật sinh học', category: 'med' },
  { icon: 'fa-solid fa-droplet', label: 'Hệ thống tưới nhỏ giọt', category: 'med' },
  { icon: 'fa-solid fa-bottle-droplet', label: 'Dược liệu Tinh dầu tự nhiên', category: 'med' },
  { icon: 'fa-solid fa-cannabis', label: 'Dược học Cây thuốc cổ truyền', category: 'med' },
  { icon: 'fa-solid fa-shield-heart', label: 'Sức khỏe Cộng đồng Public Health', category: 'med' },
  { icon: 'fa-solid fa-temperature-arrow-up', label: 'Theo dõi Thân nhiệt bệnh nhân', category: 'med' },
  { icon: 'fa-solid fa-bed-pulse', label: 'Hồi sức cấp cứu ICU', category: 'med' },
  { icon: 'fa-solid fa-notes-medical', label: 'Bệnh án điện tử EMR', category: 'med' },
  { icon: 'fa-solid fa-dna', label: 'Giải mã Gen người Human Genome', category: 'med' },

  // ==========================================================================
  // 🏛️ 5. KINH TẾ, TÀI CHÍNH, KẾ TOÁN & QUẢN TRỊ (55 icons)
  // ==========================================================================
  { icon: 'fa-solid fa-chart-line', label: 'Kinh tế học vĩ mô / Vi mô', category: 'biz' },
  { icon: 'fa-solid fa-chart-pie', label: 'Phân tích tài chính & Thị phần', category: 'biz' },
  { icon: 'fa-solid fa-building-columns', label: 'Tài chính Ngân hàng Banking', category: 'biz' },
  { icon: 'fa-solid fa-landmark', label: 'Tài chính công / Kho bạc Nhà nước', category: 'biz' },
  { icon: 'fa-solid fa-piggy-bank', label: 'Tiết kiệm & Đầu tư tài chính', category: 'biz' },
  { icon: 'fa-solid fa-coins', label: 'Thị trường Tiền tệ Money Market', category: 'biz' },
  { icon: 'fa-solid fa-money-bill', label: 'Tiền mặt & Lưu thông tiền tệ', category: 'biz' },
  { icon: 'fa-solid fa-money-bill-wave', label: 'Quản trị Dòng tiền Cashflow', category: 'biz' },
  { icon: 'fa-solid fa-money-bills', label: 'Doanh thu & Lợi nhuận', category: 'biz' },
  { icon: 'fa-solid fa-money-bill-trend-up', label: 'Tăng trưởng Đầu tư ROI', category: 'biz' },
  { icon: 'fa-solid fa-money-bill-transfer', label: 'Kiều hối & Chuyển tiền quốc tế', category: 'biz' },
  { icon: 'fa-solid fa-hand-holding-dollar', label: 'Quỹ Đầu tư mạo hiểm VC / Gọi vốn', category: 'biz' },
  { icon: 'fa-solid fa-credit-card', label: 'Công nghệ Tài chính Fintech', category: 'biz' },
  { icon: 'fa-solid fa-wallet', label: 'Quản trị Ví điện tử E-Wallet', category: 'biz' },
  { icon: 'fa-solid fa-receipt', label: 'Hóa đơn & Chứng từ kế toán', category: 'biz' },
  { icon: 'fa-solid fa-file-invoice', label: 'Kế toán quản trị Doanh nghiệp', category: 'biz' },
  { icon: 'fa-solid fa-file-invoice-dollar', label: 'Thuế thu nhập & Báo cáo thuế', category: 'biz' },
  { icon: 'fa-solid fa-calculator', label: 'Kiểm toán & Kế toán tài chính', category: 'biz' },
  { icon: 'fa-solid fa-briefcase', label: 'Quản trị kinh doanh MBA', category: 'biz' },
  { icon: 'fa-solid fa-business-time', label: 'Kế hoạch kinh doanh & Chiến lược', category: 'biz' },
  { icon: 'fa-solid fa-handshake', label: 'Đàm phán & Thương lượng thương mại', category: 'biz' },
  { icon: 'fa-solid fa-user-tie', label: 'Lãnh đạo & Quản trị cấp cao CEO', category: 'biz' },
  { icon: 'fa-solid fa-users', label: 'Quản trị nguồn nhân lực HRM', category: 'biz' },
  { icon: 'fa-solid fa-users-gear', label: 'Quản trị Vận hành Operations', category: 'biz' },
  { icon: 'fa-solid fa-users-rectangle', label: 'Hội đồng Quản trị Board', category: 'biz' },
  { icon: 'fa-solid fa-bullhorn', label: 'Marketing & Truyền thông quảng cáo', category: 'biz' },
  { icon: 'fa-solid fa-ranking-star', label: 'Quản trị Thương hiệu Brand Manage', category: 'biz' },
  { icon: 'fa-solid fa-shop', label: 'Quản lý Bán lẻ Retail Store', category: 'biz' },
  { icon: 'fa-solid fa-store', label: 'Kinh doanh nhượng quyền Franchise', category: 'biz' },
  { icon: 'fa-solid fa-cart-shopping', label: 'Thương mại điện tử E-Commerce', category: 'biz' },
  { icon: 'fa-solid fa-bag-shopping', label: 'Hành vi Người tiêu dùng Consumer', category: 'biz' },
  { icon: 'fa-solid fa-truck-fast', label: 'Logistics & Quản lý Giao nhận', category: 'biz' },
  { icon: 'fa-solid fa-boxes-stacked', label: 'Quản lý Kho bãi Warehousing', category: 'biz' },
  { icon: 'fa-solid fa-pallet', label: 'Quản trị Chuỗi cung ứng SCM', category: 'biz' },
  { icon: 'fa-solid fa-clipboard-check', label: 'Quản lý Chất lượng QA / QC / ISO', category: 'biz' },
  { icon: 'fa-solid fa-magnifying-glass-dollar', label: 'Thẩm định giá tài sản', category: 'biz' },
  { icon: 'fa-solid fa-magnifying-glass-chart', label: 'Nghiên cứu thị trường Market Research', category: 'biz' },
  { icon: 'fa-solid fa-percent', label: 'Lãi suất Ngân hàng Interest Rate', category: 'biz' },
  { icon: 'fa-solid fa-badge-percent', label: 'Khuyến mãi & Chiết khấu Sales', category: 'biz' },
  { icon: 'fa-solid fa-tags', label: 'Chiến lược Định giá Pricing', category: 'biz' },
  { icon: 'fa-solid fa-stamp', label: 'Hợp đồng thương mại & Pháp lý', category: 'biz' },
  { icon: 'fa-solid fa-copyright', label: 'Sở hữu trí tuệ & Bản quyền', category: 'biz' },
  { icon: 'fa-solid fa-trademark', label: 'Nhãn hiệu độc quyền Trademark', category: 'biz' },
  { icon: 'fa-solid fa-scale-balanced', label: 'Cân đối kế toán Balance Sheet', category: 'biz' },
  { icon: 'fa-solid fa-shield-halved', label: 'Quản trị rủi ro Doanh nghiệp', category: 'biz' },
  { icon: 'fa-solid fa-arrow-trend-up', label: 'Thị trường Chứng khoán Stock Bull', category: 'biz' },
  { icon: 'fa-solid fa-arrow-trend-down', label: 'Phân tích Rủi ro thị trường Bear', category: 'biz' },
  { icon: 'fa-solid fa-chart-gantt', label: 'Quản lý Tiến độ Dự án Project', category: 'biz' },
  { icon: 'fa-solid fa-sitemap', label: 'Cơ cấu Tổ chức Doanh nghiệp', category: 'biz' },
  { icon: 'fa-solid fa-newspaper', label: 'Bản tin Kinh tế & Thời báo tài chính', category: 'biz' },
  { icon: 'fa-solid fa-gem', label: 'Quản lý Tài sản quý & Kim hoàn', category: 'biz' },
  { icon: 'fa-solid fa-building-flag', label: 'Tập đoàn Đa quốc gia MNC', category: 'biz' },
  { icon: 'fa-solid fa-earth-americas', label: 'Kinh doanh quốc tế Global Biz', category: 'biz' },
  { icon: 'fa-solid fa-file-contract', label: 'Thanh toán quốc tế L/C', category: 'biz' },
  { icon: 'fa-solid fa-address-card', label: 'Quan hệ đối tác B2B Networking', category: 'biz' },

  // ==========================================================================
  // ⚖️ 6. LUẬT PHÁP, CHÍNH TRỊ, TRIẾT HỌC & XÃ HỘI (45 icons)
  // ==========================================================================
  { icon: 'fa-solid fa-scale-balanced', label: 'Cán cân Công lý / Luật học', category: 'law' },
  { icon: 'fa-solid fa-gavel', label: 'Búa thẩm phán / Tố tụng Tòa án', category: 'law' },
  { icon: 'fa-solid fa-balance-scale-right', label: 'Luật Dân sự & Trọng tài kinh tế', category: 'law' },
  { icon: 'fa-solid fa-landmark', label: 'Lý luận Nhà nước & Pháp luật', category: 'law' },
  { icon: 'fa-solid fa-landmark-dome', label: 'Quốc hội & Cơ quan Lập pháp', category: 'law' },
  { icon: 'fa-solid fa-building-flag', label: 'Hành chính công & Quản lý Nhà nước', category: 'law' },
  { icon: 'fa-solid fa-book-journal-whills', label: 'Triết học Mác - Lênin', category: 'law' },
  { icon: 'fa-solid fa-monument', label: 'Tư tưởng Hồ Chí Minh', category: 'law' },
  { icon: 'fa-solid fa-flag', label: 'Lịch sử Đảng Cộng sản Việt Nam', category: 'law' },
  { icon: 'fa-solid fa-scroll', label: 'Hiến pháp & Văn bản Quy phạm pháp luật', category: 'law' },
  { icon: 'fa-solid fa-feather-pointed', label: 'Lịch sử Văn minh Thế giới', category: 'law' },
  { icon: 'fa-solid fa-pen-fancy', label: 'Kỹ thuật Soạn thảo Văn bản luật', category: 'law' },
  { icon: 'fa-solid fa-passport', label: 'Luật Quốc tế & Xuất nhập cảnh', category: 'law' },
  { icon: 'fa-solid fa-handshake', label: 'Điều ước quốc tế & Ngoại giao', category: 'law' },
  { icon: 'fa-solid fa-shield-halved', label: 'An ninh Quốc gia & Trật tự', category: 'law' },
  { icon: 'fa-solid fa-user-shield', label: 'Khoa học Hình sự & Điều tra', category: 'law' },
  { icon: 'fa-solid fa-stamp', label: 'Công chứng & Chứng thực Pháp lý', category: 'law' },
  { icon: 'fa-solid fa-file-contract', label: 'Luật Doanh nghiệp & Thương mại', category: 'law' },
  { icon: 'fa-solid fa-file-signature', label: 'Ký kết Thỏa thuận Pháp lý', category: 'law' },
  { icon: 'fa-solid fa-award', label: 'Huân chương & Thi đua khen thưởng', category: 'law' },
  { icon: 'fa-solid fa-ribbon', label: 'Quyền con người & Bình đẳng giới', category: 'law' },
  { icon: 'fa-solid fa-people-group', label: 'Xã hội học & Dân số học', category: 'law' },
  { icon: 'fa-solid fa-person-shelter', label: 'Chính sách An sinh Xã hội', category: 'law' },
  { icon: 'fa-solid fa-hand-holding-heart', label: 'Công tác Xã hội & Thiện nguyện', category: 'law' },
  { icon: 'fa-solid fa-earth-americas', label: 'Quan hệ Quốc tế & Địa chính trị', category: 'law' },
  { icon: 'fa-solid fa-newspaper', label: 'Báo chí & Truyền thông chính luận', category: 'law' },
  { icon: 'fa-solid fa-bullhorn', label: 'Tuyên truyền & Vận động chính sách', category: 'law' },
  { icon: 'fa-solid fa-quote-left', label: 'Trích dẫn Danh ngôn & Học thuyết', category: 'law' },
  { icon: 'fa-solid fa-book', label: 'Lưu trữ học & Thư tịch cổ', category: 'law' },
  { icon: 'fa-solid fa-box-archive', label: 'Lưu trữ Hồ sơ Tư liệu lịch sử', category: 'law' },
  { icon: 'fa-solid fa-signature', label: 'Bút tích & Giám định pháp y', category: 'law' },
  { icon: 'fa-solid fa-building-columns', label: 'Viện Kiểm sát Nhân dân', category: 'law' },
  { icon: 'fa-solid fa-users', label: 'Tâm lý học Xã hội & Hành vi', category: 'law' },
  { icon: 'fa-solid fa-masks-theater', label: 'Văn hóa học & Nhân học', category: 'law' },
  { icon: 'fa-solid fa-shield', label: 'Bảo vệ Chủ quyền biên giới', category: 'law' },
  { icon: 'fa-solid fa-dove', label: 'Hòa bình & Hợp tác quốc tế', category: 'law' },
  { icon: 'fa-solid fa-comments', label: 'Điều tra Xã hội học', category: 'law' },
  { icon: 'fa-solid fa-envelope-open-text', label: 'Tiếp nhận Đơn thư & Khiếu nại', category: 'law' },
  { icon: 'fa-solid fa-circle-info', label: 'Phổ biến Giáo dục Pháp luật', category: 'law' },
  { icon: 'fa-solid fa-scale-unbalanced', label: 'Nghiên cứu Bất bình đẳng xã hội', category: 'law' },
  { icon: 'fa-solid fa-tree-city', label: 'Đô thị học & Phát triển bền vững', category: 'law' },
  { icon: 'fa-solid fa-hands-holding-child', label: 'Luật Hôn nhân & Gia đình', category: 'law' },
  { icon: 'fa-solid fa-file-lines', label: 'Công báo & Nghị định pháp luật', category: 'law' },
  { icon: 'fa-solid fa-landmark-flag', label: 'Chủ nghĩa Xã hội khoa học', category: 'law' },
  { icon: 'fa-solid fa-handshake-angle', label: 'Hòa giải tranh chấp cơ sở', category: 'law' },

  // ==========================================================================
  // 🌍 7. NGOẠI NGỮ & NGÔN NGỮ HỌC (45 icons)
  // ==========================================================================
  { icon: 'fa-solid fa-language', label: 'Ngoại ngữ / Dịch thuật đa ngữ', category: 'lang' },
  { icon: 'fa-solid fa-earth-americas', label: 'Tiếng Anh quốc tế English', category: 'lang' },
  { icon: 'fa-solid fa-earth-asia', label: 'Ngôn ngữ Á Đông: Nhật, Hàn, Trung', category: 'lang' },
  { icon: 'fa-solid fa-earth-europe', label: 'Tiếng Pháp, Đức, Nga, Ý, TBN', category: 'lang' },
  { icon: 'fa-solid fa-earth-africa', label: 'Ngôn ngữ học văn hóa', category: 'lang' },
  { icon: 'fa-solid fa-torii-gate', label: 'Tiếng Nhật / JLPT N5-N1', category: 'lang' },
  { icon: 'fa-solid fa-temple', label: 'Tiếng Trung / HSK & HSKK', category: 'lang' },
  { icon: 'fa-solid fa-globe', label: 'Ngôn ngữ toàn cầu hóa', category: 'lang' },
  { icon: 'fa-solid fa-book-open', label: 'Đọc hiểu / Reading Skill', category: 'lang' },
  { icon: 'fa-solid fa-book-bookmark', label: 'Từ điển ngoại ngữ & Giáo trình', category: 'lang' },
  { icon: 'fa-solid fa-spell-check', label: 'Ngữ pháp & Chính tả Grammar', category: 'lang' },
  { icon: 'fa-solid fa-font', label: 'Từ vựng & Chữ cái Vocabulary', category: 'lang' },
  { icon: 'fa-solid fa-microphone', label: 'Luyện nói / Speaking & Phát âm', category: 'lang' },
  { icon: 'fa-solid fa-microphone-lines', label: 'Hùng biện & Thuyết trình tiếng Anh', category: 'lang' },
  { icon: 'fa-solid fa-headphones', label: 'Luyện nghe / Listening Skill', category: 'lang' },
  { icon: 'fa-solid fa-volume-high', label: 'Ngữ âm IPA Audio', category: 'lang' },
  { icon: 'fa-solid fa-pen-nib', label: 'Viết luận / Writing Task 1-2', category: 'lang' },
  { icon: 'fa-solid fa-pen-to-square', label: 'Biên tập & Hiệu đính bản dịch', category: 'lang' },
  { icon: 'fa-solid fa-comments', label: 'Giao tiếp phản xạ ngoại ngữ', category: 'lang' },
  { icon: 'fa-solid fa-comment-dots', label: 'Hội thoại đối thoại giao tiếp', category: 'lang' },
  { icon: 'fa-solid fa-message', label: 'Tin nhắn giao lưu quốc tế', category: 'lang' },
  { icon: 'fa-solid fa-bullhorn', label: 'Diễn thuyết trước công chúng', category: 'lang' },
  { icon: 'fa-solid fa-certificate', label: 'Chứng chỉ IELTS / TOEIC / VSTEP', category: 'lang' },
  { icon: 'fa-solid fa-graduation-cap', label: 'Cử nhân Ngôn ngữ Anh / Nhật / Hàn', category: 'lang' },
  { icon: 'fa-solid fa-newspaper', label: 'Đọc báo nước ngoài BBC/CNN', category: 'lang' },
  { icon: 'fa-solid fa-file-lines', label: 'Văn bản dịch thuật thuật ngữ', category: 'lang' },
  { icon: 'fa-solid fa-headphones-simple', label: 'Phòng Lab luyện nghe ngôn ngữ', category: 'lang' },
  { icon: 'fa-solid fa-quote-left', label: 'Văn học nước ngoài trích đoạn', category: 'lang' },
  { icon: 'fa-solid fa-circle-question', label: 'Hỏi đáp ngữ pháp ngoại ngữ', category: 'lang' },
  { icon: 'fa-solid fa-chalkboard-user', label: 'Sư phạm Ngoại ngữ TESOL / CELTA', category: 'lang' },
  { icon: 'fa-solid fa-user-check', label: 'Khảo thí đánh giá năng lực ngôn ngữ', category: 'lang' },
  { icon: 'fa-solid fa-music', label: 'Học ngoại ngữ qua âm nhạc', category: 'lang' },
  { icon: 'fa-solid fa-video', label: 'Xem phim luyện ngoại ngữ', category: 'lang' },
  { icon: 'fa-solid fa-film', label: 'Dịch thuật Phụ đề Subtitle', category: 'lang' },
  { icon: 'fa-solid fa-signature', label: 'Ký hiệu học & Ngôn ngữ ký hiệu', category: 'lang' },
  { icon: 'fa-solid fa-feather', label: 'Ngữ văn & Thơ ca cổ điển', category: 'lang' },
  { icon: 'fa-solid fa-scroll', label: 'Văn tự cổ Hán Nôm / Chữ tượng hình', category: 'lang' },
  { icon: 'fa-solid fa-arrow-right-arrow-left', label: 'Thông dịch Cabin song song', category: 'lang' },
  { icon: 'fa-solid fa-headset', label: 'Dịch vụ Khách hàng đa ngôn ngữ', category: 'lang' },
  { icon: 'fa-solid fa-plane-departure', label: 'Du học & Trao đổi sinh viên', category: 'lang' },
  { icon: 'fa-solid fa-passport', label: 'Hộ chiếu & Hội nhập quốc tế', category: 'lang' },
  { icon: 'fa-solid fa-icons', label: 'Chữ Hán Kanji / Hanzi / Hanja', category: 'lang' },
  { icon: 'fa-solid fa-glasses', label: 'Nghiên cứu Cổ thư ngoại văn', category: 'lang' },
  { icon: 'fa-solid fa-magnifying-glass', label: 'Tra cứu Từ điển chuyên ngành', category: 'lang' },
  { icon: 'fa-solid fa-a', label: 'Bảng chữ cái Latinh Alphabet', category: 'lang' },

  // ==========================================================================
  // 🎨 8. THIẾT KẾ, MỸ THUẬT, TRUYỀN THÔNG & ÂM NHẠC (55 icons)
  // ==========================================================================
  { icon: 'fa-solid fa-palette', label: 'Mỹ thuật / Hội họa / Bảng màu', category: 'arts' },
  { icon: 'fa-solid fa-paintbrush', label: 'Vẽ tranh sơn dầu / Digital Painting', category: 'arts' },
  { icon: 'fa-solid fa-paint-roller', label: 'Thiết kế Nội thất & Thi công', category: 'arts' },
  { icon: 'fa-solid fa-brush', label: 'Cọ vẽ thư pháp & Màu nước Watercolor', category: 'arts' },
  { icon: 'fa-solid fa-eye-dropper', label: 'Bắt mã màu HEX / RGB Color Picker', category: 'arts' },
  { icon: 'fa-solid fa-pen-nib', label: 'Đồ họa Vector Illustrator Pen Tool', category: 'arts' },
  { icon: 'fa-solid fa-pen-ruler', label: 'Thiết kế Kiến trúc / Diễn họa', category: 'arts' },
  { icon: 'fa-solid fa-pen-clip', label: 'Ký họa phác thảo Sketching', category: 'arts' },
  { icon: 'fa-solid fa-pencil', label: 'Dựng hình cơ bản Chì than', category: 'arts' },
  { icon: 'fa-solid fa-marker', label: 'Vẽ Marker / Concept Design', category: 'arts' },
  { icon: 'fa-solid fa-eraser', label: 'Tẩy nét & Tinh chỉnh tác phẩm', category: 'arts' },
  { icon: 'fa-solid fa-crop-simple', label: 'Cắt bố cục ảnh Crop Framing', category: 'arts' },
  { icon: 'fa-solid fa-vector-square', label: 'Thiết kế Logo & Bộ nhận diện', category: 'arts' },
  { icon: 'fa-solid fa-object-group', label: 'Nhóm đối tượng đồ họa Group', category: 'arts' },
  { icon: 'fa-solid fa-object-ungroup', label: 'Tách lớp đối tượng Ungroup', category: 'arts' },
  { icon: 'fa-solid fa-layer-group', label: 'Quản lý Layer Photoshop', category: 'arts' },
  { icon: 'fa-solid fa-bezier-curve', label: 'Đường cong Bezier / Node Vector', category: 'arts' },
  { icon: 'fa-solid fa-wand-magic-sparkles', label: 'Kỹ xảo hình ảnh VFX / AI Art', category: 'arts' },
  { icon: 'fa-solid fa-stamp', label: 'Đóng dấu Bản quyền Watermark', category: 'arts' },
  { icon: 'fa-solid fa-shapes', label: 'Nguyên lý Bố cục Composition', category: 'arts' },
  { icon: 'fa-solid fa-image', label: 'Nhiếp ảnh Đơn sắc Monochrome', category: 'arts' },
  { icon: 'fa-solid fa-images', label: 'Triển lãm & Gallery tác phẩm', category: 'arts' },
  { icon: 'fa-solid fa-file-image', label: 'Tệp tin hình ảnh đồ họa PSD/RAW', category: 'arts' },
  { icon: 'fa-solid fa-camera', label: 'Nhiếp ảnh Máy ảnh DSLR', category: 'arts' },
  { icon: 'fa-solid fa-camera-retro', label: 'Nhiếp ảnh Máy Film hoài cổ', category: 'arts' },
  { icon: 'fa-solid fa-film', label: 'Điện ảnh & Quay phim Cinematography', category: 'arts' },
  { icon: 'fa-solid fa-video', label: 'Dựng Video Premiere / After Effects', category: 'arts' },
  { icon: 'fa-solid fa-clapperboard', label: 'Đạo diễn & Sản xuất phim', category: 'arts' },
  { icon: 'fa-solid fa-masks-theater', label: 'Sân khấu kịch nghệ & Biểu diễn', category: 'arts' },
  { icon: 'fa-solid fa-music', label: 'Âm nhạc học & Ký xướng âm', category: 'arts' },
  { icon: 'fa-solid fa-guitar', label: 'Nhạc cụ Guitar & Dây đàn', category: 'arts' },
  { icon: 'fa-solid fa-drum', label: 'Bộ gõ & Bộ trống Percussion', category: 'arts' },
  { icon: 'fa-solid fa-headphones', label: 'Kiểm âm Mastering Studio', category: 'arts' },
  { icon: 'fa-solid fa-sliders', label: 'Bàn trộn âm Mixer / Equalizer', category: 'arts' },
  { icon: 'fa-solid fa-record-vinyl', label: 'Đĩa than Vinyl / Âm học', category: 'arts' },
  { icon: 'fa-solid fa-compact-disc', label: 'Sản xuất Album âm nhạc', category: 'arts' },
  { icon: 'fa-solid fa-radio', label: 'Sản xuất Phát thanh Podcast', category: 'arts' },
  { icon: 'fa-solid fa-tv', label: 'Truyền hình & Gameshow', category: 'arts' },
  { icon: 'fa-solid fa-microphone', label: 'Thanh nhạc & Ca hát Vocalist', category: 'arts' },
  { icon: 'fa-solid fa-microphone-lines', label: 'Lồng tiếng Voice Talent / ASMR', category: 'arts' },
  { icon: 'fa-solid fa-tower-broadcast', label: 'Truyền dẫn Phát sóng trực tiếp', category: 'arts' },
  { icon: 'fa-solid fa-newspaper', label: 'Báo chí & Tạp chí thời trang', category: 'arts' },
  { icon: 'fa-solid fa-bullhorn', label: 'Tổ chức Sự kiện Event PR', category: 'arts' },
  { icon: 'fa-solid fa-shirt', label: 'Thiết kế Thời trang Fashion', category: 'arts' },
  { icon: 'fa-solid fa-scissors', label: 'Cắt may & Tạo mẫu trang phục', category: 'arts' },
  { icon: 'fa-solid fa-cube', label: 'Tạo hình Mô hình 3D Maya/3dsMax', category: 'arts' },
  { icon: 'fa-solid fa-cubes', label: 'Diễn họa Kiến trúc 3D Lumion', category: 'arts' },
  { icon: 'fa-solid fa-compass-drafting', label: 'Quy hoạch Kiến trúc Cảnh quan', category: 'arts' },
  { icon: 'fa-solid fa-lightbulb', label: 'Sáng tạo Ý tưởng Creative Idea', category: 'arts' },
  { icon: 'fa-solid fa-glasses', label: 'Cảm thụ Nghệ thuật & Giám tuyển', category: 'arts' },
  { icon: 'fa-solid fa-font', label: 'Nghệ thuật Chữ Typography', category: 'arts' },
  { icon: 'fa-solid fa-icons', label: 'Thiết kế Biểu tượng Iconography', category: 'arts' },
  { icon: 'fa-solid fa-mobile-screen', label: 'Thiết kế Trải nghiệm UI/UX Mobile', category: 'arts' },
  { icon: 'fa-solid fa-table-columns', label: 'Dàn trang In ấn InDesign Layout', category: 'arts' },
  { icon: 'fa-solid fa-star', label: 'Tác phẩm đạt giải Thiết kế', category: 'arts' },

  // ==========================================================================
  // 🏃 9. THỂ THAO, GIÁO DỤC THỂ CHẤT & RÈN LUYỆN (45 icons)
  // ==========================================================================
  { icon: 'fa-solid fa-dumbbell', label: 'Thể hình / Tập Gym & Fitness', category: 'sport' },
  { icon: 'fa-solid fa-person-running', label: 'Điền kinh / Chạy bộ Marathon', category: 'sport' },
  { icon: 'fa-solid fa-person-walking', label: 'Đi bộ rèn luyện sức khỏe', category: 'sport' },
  { icon: 'fa-solid fa-person-swimming', label: 'Bơi lội / Thể thao dưới nước', category: 'sport' },
  { icon: 'fa-solid fa-person-biking', label: 'Đua xe đạp thể thao Cycling', category: 'sport' },
  { icon: 'fa-solid fa-person-hiking', label: 'Leo núi dã ngoại Trekking', category: 'sport' },
  { icon: 'fa-solid fa-person-skating', label: 'Trượt patin / Skateboard', category: 'sport' },
  { icon: 'fa-solid fa-person-skiing', label: 'Trượt tuyết thể thao Skiing', category: 'sport' },
  { icon: 'fa-solid fa-futbol', label: 'Bóng đá / Futsal sân mini', category: 'sport' },
  { icon: 'fa-solid fa-basketball', label: 'Bóng rổ Basketball', category: 'sport' },
  { icon: 'fa-solid fa-volleyball', label: 'Bóng chuyền Volleyball', category: 'sport' },
  { icon: 'fa-solid fa-baseball', label: 'Bóng chày Baseball', category: 'sport' },
  { icon: 'fa-solid fa-football', label: 'Bóng bầu dục Rugby', category: 'sport' },
  { icon: 'fa-solid fa-table-tennis-paddle-ball', label: 'Bóng bàn Table Tennis', category: 'sport' },
  { icon: 'fa-solid fa-golf-ball-tee', label: 'Đánh Golf thể thao', category: 'sport' },
  { icon: 'fa-solid fa-bowling-ball', label: 'Bowling giải trí', category: 'sport' },
  { icon: 'fa-solid fa-medal', label: 'Huy chương Thể thao Hội khỏe', category: 'sport' },
  { icon: 'fa-solid fa-trophy', label: 'Cúp vô địch Giải đấu', category: 'sport' },
  { icon: 'fa-solid fa-crown', label: 'Quán quân Vô địch Champion', category: 'sport' },
  { icon: 'fa-solid fa-award', label: 'Giấy chứng nhận Thành tích TDTT', category: 'sport' },
  { icon: 'fa-solid fa-ribbon', label: 'Ruy băng Giải đấu phong trào', category: 'sport' },
  { icon: 'fa-solid fa-stopwatch', label: 'Bấm giờ Kỷ lục điền kinh', category: 'sport' },
  { icon: 'fa-solid fa-stopwatch-20', label: 'Đếm ngược thời gian thi đấu', category: 'sport' },
  { icon: 'fa-solid fa-heart-pulse', label: 'Kiểm tra Thể lực & Nhịp tim', category: 'sport' },
  { icon: 'fa-solid fa-shoe-prints', label: 'Dặm chạy bước chân Pacer', category: 'sport' },
  { icon: 'fa-solid fa-fire', label: 'Đốt cháy Calo / Cardio HIIT', category: 'sport' },
  { icon: 'fa-solid fa-bullseye', label: 'Bắn cung / Bắn súng mục tiêu Target', category: 'sport' },
  { icon: 'fa-solid fa-flag-checkered', label: 'Vạch đích Cuộc đua cờ vua', category: 'sport' },
  { icon: 'fa-solid fa-shield-heart', label: 'Bảo hộ Thể thao An toàn', category: 'sport' },
  { icon: 'fa-solid fa-bottle-water', label: 'Bình nước thể thao Hydration', category: 'sport' },
  { icon: 'fa-solid fa-apple-whole', label: 'Dinh dưỡng Thể hình Macro', category: 'sport' },
  { icon: 'fa-solid fa-bicycle', label: 'Xe đạp đường trường Road Bike', category: 'sport' },
  { icon: 'fa-solid fa-person-rays', label: 'Yoga / Thiền định Thư giãn', category: 'sport' },
  { icon: 'fa-solid fa-ranking-star', label: 'Bảng xếp hạng Vận động viên', category: 'sport' },
  { icon: 'fa-solid fa-users', label: 'Đồng đội & Tinh thần thể thao', category: 'sport' },
  { icon: 'fa-solid fa-handshake-simple', label: 'Tinh thần Thể thao Fair Play', category: 'sport' },
  { icon: 'fa-solid fa-wind', label: 'Đua thuyền buồm / Sức gió', category: 'sport' },
  { icon: 'fa-solid fa-water', label: 'Chèo thuyền Kayak / SUP', category: 'sport' },
  { icon: 'fa-solid fa-shirt', label: 'Áo đấu Đồng phục Thể thao', category: 'sport' },
  { icon: 'fa-solid fa-mountain', label: 'Vượt chướng ngại vật Trail', category: 'sport' },
  { icon: 'fa-solid fa-gauge-high', label: 'Đo Tốc độ Chạy nước rút Speed', category: 'sport' },
  { icon: 'fa-solid fa-person-chalkboard', label: 'Huấn luyện viên Thể thao Coach', category: 'sport' },
  { icon: 'fa-solid fa-gem', label: 'Huy chương Vàng danh giá', category: 'sport' },
  { icon: 'fa-solid fa-star', label: 'Vận động viên Ngôi sao MVP', category: 'sport' },
  { icon: 'fa-solid fa-scale-balanced', label: 'Cân đo Trọng lượng cơ thể BMI', category: 'sport' },

  // ==========================================================================
  // ⭐ 10. KỸ NĂNG, HOẠT ĐỘNG ĐOÀN - HỘI & ĐỜI SỐNG SV (55 icons)
  // ==========================================================================
  { icon: 'fa-solid fa-graduation-cap', label: 'Tốt nghiệp Đại học / Cử nhân / Kỹ sư', category: 'life' },
  { icon: 'fa-solid fa-user-graduate', label: 'Thủ khoa & Sinh viên xuất sắc', category: 'life' },
  { icon: 'fa-solid fa-school', label: 'Trường học / Khuôn viên Giảng đường', category: 'life' },
  { icon: 'fa-solid fa-university', label: 'Đại học Bách Khoa / ĐHQG', category: 'life' },
  { icon: 'fa-solid fa-chalkboard-user', label: 'Thuyết trình Đồ án Tốt nghiệp', category: 'life' },
  { icon: 'fa-solid fa-chalkboard', label: 'Bảng phấn lớp học truyền thống', category: 'life' },
  { icon: 'fa-solid fa-book', label: 'Sách giáo trình Đại học', category: 'life' },
  { icon: 'fa-solid fa-book-open-reader', label: 'Tự học tại Thư viện trung tâm', category: 'life' },
  { icon: 'fa-solid fa-bookmark', label: 'Đánh dấu tài liệu ôn thi', category: 'life' },
  { icon: 'fa-solid fa-star', label: 'Danh hiệu Sinh viên 5 Tốt', category: 'life' },
  { icon: 'fa-solid fa-heart', label: 'Nhiệt huyết Tuổi trẻ Sinh viên', category: 'life' },
  { icon: 'fa-solid fa-thumbs-up', label: 'Động viên & Làm việc nhóm hiệu quả', category: 'life' },
  { icon: 'fa-solid fa-hand-holding-heart', label: 'Chiến dịch Mùa hè xanh / Tình nguyện', category: 'life' },
  { icon: 'fa-solid fa-hands-holding-child', label: 'Chương trình Tiếp sức Mùa thi', category: 'life' },
  { icon: 'fa-solid fa-fire', label: 'Cháy hết mình vì Deadline đồ án', category: 'life' },
  { icon: 'fa-solid fa-mug-hot', label: 'Cà phê thức đêm ôn thi cuối kỳ', category: 'life' },
  { icon: 'fa-solid fa-coffee', label: 'Gặp gỡ học nhóm Quán cà phê', category: 'life' },
  { icon: 'fa-solid fa-pizza-slice', label: 'Ăn đêm cùng bạn bè Ký túc xá', category: 'life' },
  { icon: 'fa-solid fa-burger', label: 'Bữa trưa nhanh tại Canteen', category: 'life' },
  { icon: 'fa-solid fa-utensils', label: 'Cơm sinh viên bình dân', category: 'life' },
  { icon: 'fa-solid fa-bed', label: 'Nghỉ ngơi tại Ký túc xá KTX', category: 'life' },
  { icon: 'fa-solid fa-bell', label: 'Chuông báo thức giờ vào lớp', category: 'life' },
  { icon: 'fa-solid fa-calendar', label: 'Lịch học thông minh kỳ học', category: 'life' },
  { icon: 'fa-solid fa-calendar-days', label: 'Lịch thi học kỳ chính thức', category: 'life' },
  { icon: 'fa-solid fa-calendar-check', label: 'Hoàn thành Kế hoạch tuần', category: 'life' },
  { icon: 'fa-solid fa-clock', label: 'Quản trị Thời gian Pomodoro', category: 'life' },
  { icon: 'fa-solid fa-hourglass-half', label: 'Thời gian nộp Bài tập lớn', category: 'life' },
  { icon: 'fa-solid fa-compass', label: 'Định hướng Nghề nghiệp tương lai', category: 'life' },
  { icon: 'fa-solid fa-map-location-dot', label: 'Vị trí Phòng học & Tòa nhà', category: 'life' },
  { icon: 'fa-solid fa-lightbulb', label: 'Ý tưởng Nghiên cứu Khoa học NCKH', category: 'life' },
  { icon: 'fa-solid fa-rocket', label: 'Bứt phá Điểm rèn luyện & GPA', category: 'life' },
  { icon: 'fa-solid fa-flag', label: 'Công tác Đoàn Thanh niên - Hội SV', category: 'life' },
  { icon: 'fa-solid fa-seedling', label: 'Phát triển Kỹ năng mềm Soft Skills', category: 'life' },
  { icon: 'fa-solid fa-tree', label: 'Hoạt động Ngày Chủ nhật xanh', category: 'life' },
  { icon: 'fa-solid fa-gem', label: 'Kỹ năng Vàng thuyết phục', category: 'life' },
  { icon: 'fa-solid fa-key', label: 'Chìa khóa Thành công học tập', category: 'life' },
  { icon: 'fa-solid fa-ticket', label: 'Vé tham dự Hội thảo & Workshop', category: 'life' },
  { icon: 'fa-solid fa-user-group', label: 'Sinh hoạt Câu lạc bộ Đội Nhóm', category: 'life' },
  { icon: 'fa-solid fa-users', label: 'Họp nhóm phân chia công việc', category: 'life' },
  { icon: 'fa-solid fa-handshake', label: 'Kết nối mạng lưới Cựu sinh viên', category: 'life' },
  { icon: 'fa-solid fa-briefcase', label: 'Thực tập sinh Doanh nghiệp Intern', category: 'life' },
  { icon: 'fa-solid fa-id-card', label: 'Thẻ sinh viên & Thẻ thư viện', category: 'life' },
  { icon: 'fa-solid fa-envelope', label: 'Email trao đổi với Giảng viên', category: 'life' },
  { icon: 'fa-solid fa-inbox', label: 'Hộp thư Thông báo Phòng Đào tạo', category: 'life' },
  { icon: 'fa-solid fa-cloud-arrow-down', label: 'Tải Slide bài giảng BK-LMS', category: 'life' },
  { icon: 'fa-solid fa-print', label: 'Photo in ấn Giáo trình & Đề thi', category: 'life' },
  { icon: 'fa-solid fa-shield-heart', label: 'Bảo hiểm Thân thể sinh viên', category: 'life' },
  { icon: 'fa-solid fa-suitcase', label: 'Kỳ nghỉ Hè về quê thăm nhà', category: 'life' },
  { icon: 'fa-solid fa-trophy', label: 'Giải Nhất Nghiên cứu Sinh viên', category: 'life' },
  { icon: 'fa-solid fa-medal', label: 'Học bổng Khuyến khích học tập', category: 'life' },
  { icon: 'fa-solid fa-wand-magic-sparkles', label: 'Vượt qua kỳ thi Qua môn xuất sắc', category: 'life' },
  { icon: 'fa-solid fa-music', label: 'Hội diễn Văn nghệ Sinh viên', category: 'life' },
  { icon: 'fa-solid fa-guitar', label: 'Hát acoustic đêm Hội trại', category: 'life' },
  { icon: 'fa-solid fa-camera', label: 'Kỷ yếu Lưu bút năm cuối', category: 'life' },
  { icon: 'fa-solid fa-hand-peace', label: 'Tự tin vượt qua thử thách', category: 'life' },

  // ==========================================================================
  // 🔷 11. KÝ HIỆU, BIỂU TƯỢNG ĐA NĂNG & HÌNH KHỐI (65 icons)
  // ==========================================================================
  { icon: 'fa-solid fa-circle-check', label: 'Đã hoàn thành / Xong', category: 'shapes' },
  { icon: 'fa-solid fa-circle-xmark', label: 'Chưa đạt / Hủy bỏ', category: 'shapes' },
  { icon: 'fa-solid fa-circle-exclamation', label: 'Cảnh báo quan trọng', category: 'shapes' },
  { icon: 'fa-solid fa-circle-question', label: 'Hỏi đáp / Trợ giúp', category: 'shapes' },
  { icon: 'fa-solid fa-circle-info', label: 'Thông tin chi tiết', category: 'shapes' },
  { icon: 'fa-solid fa-circle-plus', label: 'Thêm mới / Mở rộng', category: 'shapes' },
  { icon: 'fa-solid fa-circle-minus', label: 'Thu nhỏ / Giảm bớt', category: 'shapes' },
  { icon: 'fa-solid fa-square-check', label: 'Đã tích chọn Checklist', category: 'shapes' },
  { icon: 'fa-solid fa-square', label: 'Hình vuông biểu tượng', category: 'shapes' },
  { icon: 'fa-solid fa-circle', label: 'Hình tròn biểu tượng', category: 'shapes' },
  { icon: 'fa-solid fa-triangle-exclamation', label: 'Lưu ý khẩn cấp', category: 'shapes' },
  { icon: 'fa-solid fa-diamond', label: 'Kim cương / Đẳng cấp', category: 'shapes' },
  { icon: 'fa-solid fa-star', label: 'Ngôi sao Đánh giá', category: 'shapes' },
  { icon: 'fa-solid fa-star-half-stroke', label: 'Xếp hạng nửa sao', category: 'shapes' },
  { icon: 'fa-solid fa-heart', label: 'Trái tim Yêu thích', category: 'shapes' },
  { icon: 'fa-solid fa-bookmark', label: 'Lưu mục quan trọng', category: 'shapes' },
  { icon: 'fa-solid fa-tag', label: 'Gắn thẻ Tag phân loại', category: 'shapes' },
  { icon: 'fa-solid fa-tags', label: 'Nhiều thẻ danh mục', category: 'shapes' },
  { icon: 'fa-solid fa-thumbtack', label: 'Ghim mục lên đầu Pin', category: 'shapes' },
  { icon: 'fa-solid fa-location-dot', label: 'Định vị địa điểm', category: 'shapes' },
  { icon: 'fa-solid fa-paperclip', label: 'Đính kèm tệp tin', category: 'shapes' },
  { icon: 'fa-solid fa-link', label: 'Liên kết đường dẫn URL', category: 'shapes' },
  { icon: 'fa-solid fa-link-slash', label: 'Hủy liên kết URL', category: 'shapes' },
  { icon: 'fa-solid fa-scissors', label: 'Cắt đoạn nội dung', category: 'shapes' },
  { icon: 'fa-solid fa-trash-can', label: 'Thùng rác Xóa bỏ', category: 'shapes' },
  { icon: 'fa-solid fa-floppy-disk', label: 'Lưu dữ liệu Save', category: 'shapes' },
  { icon: 'fa-solid fa-download', label: 'Tải xuống Download', category: 'shapes' },
  { icon: 'fa-solid fa-upload', label: 'Tải lên Upload', category: 'shapes' },
  { icon: 'fa-solid fa-cloud-arrow-up', label: 'Đồng bộ Đám mây', category: 'shapes' },
  { icon: 'fa-solid fa-share-nodes', label: 'Chia sẻ bạn bè Share', category: 'shapes' },
  { icon: 'fa-solid fa-filter', label: 'Bộ lọc điều kiện Filter', category: 'shapes' },
  { icon: 'fa-solid fa-list-check', label: 'Danh sách việc cần làm To-Do', category: 'shapes' },
  { icon: 'fa-solid fa-table-list', label: 'Bảng dữ liệu Data Grid', category: 'shapes' },
  { icon: 'fa-solid fa-bars', label: 'Trình đơn Menu chính', category: 'shapes' },
  { icon: 'fa-solid fa-ellipsis', label: 'Tùy chọn khác More', category: 'shapes' },
  { icon: 'fa-solid fa-ellipsis-vertical', label: 'Tùy chọn dọc 3 chấm', category: 'shapes' },
  { icon: 'fa-solid fa-cube', label: 'Khối 3D lập phương', category: 'shapes' },
  { icon: 'fa-solid fa-cubes', label: 'Tập hợp các khối dữ liệu', category: 'shapes' },
  { icon: 'fa-solid fa-certificate', label: 'Chứng chỉ chính thức', category: 'shapes' },
  { icon: 'fa-solid fa-crosshairs', label: 'Tâm điểm ngắm bắn Target', category: 'shapes' },
  { icon: 'fa-solid fa-bullseye', label: 'Điểm số Mục tiêu chính', category: 'shapes' },
  { icon: 'fa-solid fa-power-off', label: 'Bật / Tắt nguồn Power', category: 'shapes' },
  { icon: 'fa-solid fa-toggle-on', label: 'Bật công tắc Toggle', category: 'shapes' },
  { icon: 'fa-solid fa-sliders', label: 'Tùy chỉnh Tham số Slider', category: 'shapes' },
  { icon: 'fa-solid fa-magnifying-glass', label: 'Kính lúp tìm kiếm Search', category: 'shapes' },
  { icon: 'fa-solid fa-magnifying-glass-plus', label: 'Phóng to Zoom In', category: 'shapes' },
  { icon: 'fa-solid fa-magnifying-glass-minus', label: 'Thu nhỏ Zoom Out', category: 'shapes' },
  { icon: 'fa-solid fa-arrow-rotate-right', label: 'Làm mới trang Reload', category: 'shapes' },
  { icon: 'fa-solid fa-arrows-rotate', label: 'Đồng bộ hai chiều Sync', category: 'shapes' },
  { icon: 'fa-solid fa-arrow-right', label: 'Chuyển tiếp Next', category: 'shapes' },
  { icon: 'fa-solid fa-arrow-left', label: 'Quay lại Back', category: 'shapes' },
  { icon: 'fa-solid fa-arrow-up', label: 'Cuộn lên đầu trang Top', category: 'shapes' },
  { icon: 'fa-solid fa-arrow-down', label: 'Cuộn xuống dưới Bottom', category: 'shapes' },
  { icon: 'fa-solid fa-angles-right', label: 'Tua nhanh Fast Forward', category: 'shapes' },
  { icon: 'fa-solid fa-repeat', label: 'Lặp lại chu kỳ Repeat', category: 'shapes' },
  { icon: 'fa-solid fa-shuffle', label: 'Trộn ngẫu nhiên Shuffle', category: 'shapes' },
  { icon: 'fa-solid fa-wand-magic-sparkles', label: 'Tự động thông minh AI Magic', category: 'shapes' },
  { icon: 'fa-solid fa-eye', label: 'Hiển thị xem trước Preview', category: 'shapes' },
  { icon: 'fa-solid fa-eye-slash', label: 'Ẩn nội dung riêng tư', category: 'shapes' },
  { icon: 'fa-solid fa-lock', label: 'Khóa bảo mật', category: 'shapes' },
  { icon: 'fa-solid fa-unlock', label: 'Mở khóa bảo mật', category: 'shapes' },
  { icon: 'fa-solid fa-gear', label: 'Cài đặt cấu hình Settings', category: 'shapes' },
  { icon: 'fa-solid fa-wrench', label: 'Công cụ sửa chữa Tools', category: 'shapes' },
  { icon: 'fa-solid fa-shapes', label: 'Bộ sưu tập hình khối Shapes', category: 'shapes' },
  { icon: 'fa-solid fa-circle-radiation', label: 'Cảnh báo Nguy hiểm Danger', category: 'shapes' }
];

const TIME_PRESETS = [
  { time: '07:00 - 08:50', period: 'Tiết 2 - 3', label: 'Sáng: Tiết 2-3 (7h-8h50)' },
  { time: '09:00 - 11:50', period: 'Tiết 4 - 6', label: 'Sáng: Tiết 4-6 (9h-11h50)' },
  { time: '07:00 - 09:50', period: 'Tiết 1 - 3', label: 'Sáng: Tiết 1-3 (7h-9h50)' },
  { time: '10:00 - 11:50', period: 'Tiết 5 - 6', label: 'Sáng: Tiết 5-6 (10h-11h50)' },
  { time: '13:00 - 14:50', period: 'Tiết 8 - 9', label: 'Chiều: Tiết 8-9 (13h-14h50)' },
  { time: '15:00 - 16:50', period: 'Tiết 10 - 11', label: 'Chiều: Tiết 10-11 (15h-16h50)' },
  { time: '13:00 - 15:50', period: 'Tiết 7 - 9', label: 'Chiều: Tiết 7-9 (13h-15h50)' },
  { time: '14:00 - 15:50', period: 'Tiết 9 - 10', label: 'Chiều: Tiết 9-10 (14h-15h50)' }
];

const ROOM_PRESETS = ['B1-305 (CS1)', 'B4-505 (CS1)', 'B9-202 (CS1)', 'C4-402 (CS1)', 'B4-301 (CS1)', 'B1-212 (CS1)', 'B4-303 (CS1)'];
const CUSTOM_TIME_PRESETS_KEY = 'smart_schedule_custom_time_presets';
const CUSTOM_ROOM_PRESETS_KEY = 'smart_schedule_custom_room_presets';

/**
 * Đọc danh sách ca học tùy chỉnh do người dùng lưu
 * @returns {Array<Object>}
 */
function getCustomTimePresets() {
  try {
    const raw = localStorage.getItem(CUSTOM_TIME_PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Lỗi đọc custom time presets:', e);
  }
  return [];
}

/**
 * Lưu danh sách ca học tùy chỉnh vào LocalStorage
 * @param {Array<Object>} presets 
 */
function saveCustomTimePresets(presets) {
  try {
    localStorage.setItem(CUSTOM_TIME_PRESETS_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error('Lỗi lưu custom time presets:', e);
  }
}

/**
 * Đọc danh sách phòng học tùy chỉnh do người dùng lưu
 * @returns {Array<string>}
 */
function getCustomRoomPresets() {
  try {
    const raw = localStorage.getItem(CUSTOM_ROOM_PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Lỗi đọc custom room presets:', e);
  }
  return [];
}

/**
 * Lưu danh sách phòng học tùy chỉnh vào LocalStorage
 * @param {Array<string>} presets 
 */
function saveCustomRoomPresets(presets) {
  try {
    localStorage.setItem(CUSTOM_ROOM_PRESETS_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error('Lỗi lưu custom room presets:', e);
  }
}

/**
 * Tự động tìm tên Tiết học từ khung giờ nếu khớp với ca học chuẩn
 * @param {string} timeRange 
 * @returns {string}
 */
function getPeriodFromTimeRange(timeRange = '') {
  const allPresets = [...TIME_PRESETS, ...getCustomTimePresets()];
  const matched = allPresets.find(p => p.time.trim() === timeRange.trim());
  return matched ? (matched.period || '') : '';
}

// ============================================================================
// 3. COMPONENT TEMPLATE / DOM GENERATION
// ============================================================================

/**
 * Đảm bảo khung DOM của Modal Thêm Tiết Học đã tồn tại
 */
export function ensureAddClassModalDom() {
  if (document.getElementById(MODAL_ID)) return;

  const modalRoot = document.getElementById('modal-root') || document.body;
  const modalWrapper = document.createElement('div');
  modalWrapper.id = MODAL_ID;
  modalWrapper.className = 'modal-backdrop hidden';
  modalWrapper.innerHTML = `
    <div class="modal-card modal-card-md add-class-modal-card" role="dialog" aria-modal="true">
      <!-- HEADER -->
      <div class="modal-header">
        <div class="modal-title-group">
          <div class="modal-icon-glow" style="background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);">
            <i class="fa-solid fa-calendar-plus" id="add-class-modal-icon"></i>
          </div>
          <div>
            <h3 id="add-class-modal-title" class="modal-title">Thêm Tiết Học</h3>
            <span id="add-class-modal-subtitle" class="modal-subj-sub">Chọn môn từ Chiếc Cặp, gắn logo và ca học</span>
          </div>
        </div>
        <button type="button" id="btn-close-add-class" class="btn-modal-close" title="Đóng (ESC)">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form id="add-class-form" class="modal-form" style="padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; max-height: 550px;">
        
        <!-- SECTION 1: MÔN HỌC & CHỌN LOGO ICON -->
        <div class="form-group-styled">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label for="class-subject-input"><i class="fa-solid fa-graduation-cap"></i> Tên môn học & Logo: <span class="required-star">*</span></label>
            <span style="font-size: 0.72rem; color: var(--text-muted);">Gợi ý từ Chiếc Cặp:</span>
          </div>
          <div class="subject-chips-picker" id="subject-chips-picker">
            <!-- Render danh sách chip môn học -->
          </div>
          
          <div class="subject-input-with-icon-picker" style="display: flex; gap: 0.5rem; align-items: center;">
            <!-- Nút Mở Bộ Chọn Logo / Icon Môn Học -->
            <button type="button" id="btn-open-icon-picker" class="btn-subject-icon-trigger" title="Bấm để đổi Logo / Icon đại diện môn học (~120 icons tiêu biểu)">
              <div class="subject-icon-preview-box">
                <i id="display-subject-icon" class="fa-solid fa-book"></i>
              </div>
              <span class="icon-picker-badge-caret"><i class="fa-solid fa-caret-down"></i></span>
            </button>

            <!-- Ô Nhập Tên Môn Học -->
            <div class="input-with-icon" style="flex: 1;">
              <i class="fa-solid fa-book-open input-icon"></i>
              <input type="text" id="class-subject-input" class="form-input-styled" placeholder="Nhập tên môn học (VD: Học máy, Tiếng Nhật 7...)" required autocomplete="off">
            </div>
          </div>
        </div>

        <!-- SECTION 1B: LINK GOOGLE DRIVE / TÀI LIỆU -->
        <div class="form-group-styled">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label for="class-drive-url-input"><i class="fa-brands fa-google-drive"></i> Link Google Drive / Thư mục:</label>
            <span id="drive-sync-badge" class="drive-sync-status-badge hidden">
              <i class="fa-solid fa-link"></i> Đã lấy từ Chiếc Cặp
            </span>
          </div>
          <div class="input-row-preset-creator" style="display: flex; gap: 0.45rem; align-items: stretch;">
            <div class="input-with-icon" style="flex: 1;">
              <i class="fa-solid fa-link input-icon" style="color: #818cf8;"></i>
              <input type="url" id="class-drive-url-input" class="form-input-styled" placeholder="https://drive.google.com/drive/folders/... (Tùy chọn)" autocomplete="off">
            </div>
            <a id="btn-open-drive-preview" href="#" target="_blank" rel="noopener noreferrer" class="btn-open-drive-preview hidden" title="Mở thư mục Drive này trong tab mới">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              <span>Mở Drive</span>
            </a>
          </div>
        </div>

        <!-- SECTION 2: KHUNG GIỜ & CA HỌC CHUẨN ĐHBK & TỰ TẠO -->
        <div class="form-group-styled">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label><i class="fa-solid fa-clock"></i> Ca học mẫu (Chuẩn ĐHBK & Tự tạo):</label>
            <span style="font-size: 0.72rem; color: var(--text-muted);">Bấm để chọn nhanh</span>
          </div>
          <div class="preset-buttons-grid" id="time-presets-grid">
            <!-- Render động từ TIME_PRESETS + Custom Presets -->
          </div>
          
          <!-- Hàng Chọn Giờ Con Lăn 3D Chuẩn iOS Alarm + Nút Lưu Ca Mẫu -->
          <div class="ios-time-picker-row">
            <div class="ios-time-range-capsules">
              <!-- Capsule Bắt đầu -->
              <button type="button" id="btn-pick-start-time" class="ios-capsule-box" title="Bấm để mở con lăn iOS chọn giờ bắt đầu">
                <span class="ios-capsule-label">BẮT ĐẦU</span>
                <div class="ios-capsule-input-wrap">
                  <i class="fa-regular fa-clock"></i>
                  <span id="display-start-time" class="ios-capsule-time-text">07:00</span>
                </div>
              </button>

              <div class="ios-time-arrow">
                <i class="fa-solid fa-arrow-right-long"></i>
              </div>

              <!-- Capsule Kết thúc -->
              <button type="button" id="btn-pick-end-time" class="ios-capsule-box" title="Bấm để mở con lăn iOS chọn giờ kết thúc">
                <span class="ios-capsule-label">KẾT THÚC</span>
                <div class="ios-capsule-input-wrap">
                  <i class="fa-regular fa-clock"></i>
                  <span id="display-end-time" class="ios-capsule-time-text">08:50</span>
                </div>
              </button>
            </div>

            <!-- Nút Lưu ca mẫu -->
            <button type="button" id="btn-save-custom-preset" class="btn-save-custom-preset" title="Lưu khung giờ này lên danh sách mẫu ở trên">
              <i class="fa-solid fa-plus"></i>
              <span>Lưu ca mẫu</span>
            </button>
          </div>
        </div>

        <!-- SECTION 3: NGÀY & PHÒNG HỌC (Ô Thứ ngắn gọn, Ô Phòng rộng thoáng) -->
        <div class="modal-grid-day-room">
          <!-- Chọn ngày -->
          <div class="form-group-styled">
            <label for="class-day-select"><i class="fa-solid fa-calendar-day"></i> Thứ trong tuần:</label>
            <div class="input-with-icon">
              <i class="fa-regular fa-calendar input-icon"></i>
              <select id="class-day-select" class="form-input-styled" required>
                <option value="Thứ 2">Thứ 2</option>
                <option value="Thứ 3">Thứ 3</option>
                <option value="Thứ 4">Thứ 4</option>
                <option value="Thứ 5">Thứ 5</option>
                <option value="Thứ 6">Thứ 6</option>
                <option value="Thứ 7">Thứ 7</option>
                <option value="Chủ Nhật">Chủ Nhật</option>
              </select>
            </div>
          </div>

          <!-- Phòng học -->
          <div class="form-group-styled">
            <label for="class-room-input"><i class="fa-solid fa-door-open"></i> Phòng học:</label>
            <div class="input-row-preset-creator" style="display: flex; gap: 0.45rem; align-items: stretch;">
              <div class="input-with-icon" style="flex: 1;">
                <i class="fa-solid fa-location-dot input-icon"></i>
                <input type="text" id="class-room-input" class="form-input-styled" placeholder="VD: B1-305 (CS1)" required>
              </div>
              <button type="button" id="btn-save-custom-room" class="btn-save-custom-preset" title="Lưu phòng học này thành gợi ý mẫu để dùng sau">
                <i class="fa-solid fa-plus"></i>
                <span>Lưu phòng</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Gợi ý phòng học nhanh -->
        <div class="room-presets-row" id="room-presets-row">
          <!-- Render động từ ROOM_PRESETS + Custom Room Presets -->
        </div>

        <!-- FOOTER BUTTONS -->
        <div class="modal-footer" style="padding: 1rem 0 0 0; margin-top: 0.5rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color);">
          <button type="button" id="btn-delete-class" class="btn-danger-ghost" style="display: none;">
            <i class="fa-solid fa-trash-can"></i> Xóa tiết này
          </button>
          <div style="display: flex; gap: 0.65rem; margin-left: auto;">
            <button type="button" id="btn-cancel-add-class" class="btn-ghost">Hủy</button>
            <button type="submit" class="btn-primary-gradient">
              <i class="fa-solid fa-check"></i> <span id="btn-save-class-text">Thêm Tiết Học</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  `;

  modalRoot.appendChild(modalWrapper);
  ensureIosWheelPickerDom();
  ensureSubjectIconPickerDom();
  bindAddClassModalEvents();
}

/**
 * Đảm bảo Modal Con Lăn 3D Kiểu Báo Thức iOS (Alarm Drum Roller Picker) đã tồn tại trong DOM
 */
function ensureIosWheelPickerDom() {
  if (document.getElementById(PICKER_MODAL_ID)) return;

  const modalRoot = document.getElementById('modal-root') || document.body;
  const pickerWrapper = document.createElement('div');
  pickerWrapper.id = PICKER_MODAL_ID;
  pickerWrapper.className = 'ios-picker-backdrop hidden';
  pickerWrapper.innerHTML = `
    <div class="ios-picker-sheet" role="dialog" aria-modal="true">
      <!-- HEADER CHUẨN iPHONE BÁO THỨC TONE TÍM THAN -->
      <div class="ios-picker-header">
        <button type="button" id="btn-ios-picker-cancel" class="ios-picker-btn-cancel">Hủy</button>
        <div class="ios-picker-title-group">
          <span id="ios-picker-title" class="ios-picker-title">Chọn Giờ Bắt Đầu</span>
          <span id="ios-picker-subpreview" class="ios-picker-subpreview">07 : 00</span>
        </div>
        <button type="button" id="btn-ios-picker-save" class="ios-picker-btn-save">Lưu</button>
      </div>

      <!-- DRUM ROLLER WHEEL 3D CONTAINER -->
      <div class="ios-wheel-roller-container">
        <!-- Vạch thấu kính chọn chính giữa -->
        <div class="ios-wheel-lens"></div>

        <!-- CỘT CON LĂN GIỜ (00 - 23) -->
        <div class="ios-wheel-col" id="ios-wheel-hours-col" data-unit="hours">
          <div class="ios-wheel-scroller" id="ios-wheel-hours-scroller">
            ${Array.from({ length: 24 }, (_, i) => {
              const val = String(i).padStart(2, '0');
              return `<div class="ios-wheel-item" data-val="${i}">${val}</div>`;
            }).join('')}
          </div>
        </div>

        <!-- DẤU HAI CHẤM -->
        <div class="ios-wheel-colon">:</div>

        <!-- CỘT CON LĂN PHÚT (00 - 59) -->
        <div class="ios-wheel-col" id="ios-wheel-minutes-col" data-unit="minutes">
          <div class="ios-wheel-scroller" id="ios-wheel-minutes-scroller">
            ${Array.from({ length: 60 }, (_, i) => {
              const val = String(i).padStart(2, '0');
              return `<div class="ios-wheel-item" data-val="${i}">${val}</div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- GỢI Ý MỐC GIỜ THÔNG DỤNG CHUẨN TIẾT HỌC ĐHBK -->
      <div class="ios-quick-presets-bar">
        <button type="button" class="ios-quick-pill" data-time="07:00">07:00 (Sáng)</button>
        <button type="button" class="ios-quick-pill" data-time="08:50">08:50</button>
        <button type="button" class="ios-quick-pill" data-time="09:00">09:00</button>
        <button type="button" class="ios-quick-pill" data-time="11:50">11:50</button>
        <button type="button" class="ios-quick-pill" data-time="13:00">13:00 (Chiều)</button>
        <button type="button" class="ios-quick-pill" data-time="14:50">14:50</button>
        <button type="button" class="ios-quick-pill" data-time="15:00">15:00</button>
        <button type="button" class="ios-quick-pill" data-time="16:50">16:50</button>
      </div>
    </div>
  `;

  modalRoot.appendChild(pickerWrapper);
  bindIosWheelPickerEvents();
}

/**
 * Đảm bảo Modal Chọn Logo Icon (~120 Icon Tiêu Biểu) đã tồn tại trong DOM
 */
function ensureSubjectIconPickerDom() {
  if (document.getElementById(ICON_PICKER_MODAL_ID)) return;

  const modalRoot = document.getElementById('modal-root') || document.body;
  const iconPickerWrapper = document.createElement('div');
  iconPickerWrapper.id = ICON_PICKER_MODAL_ID;
  iconPickerWrapper.className = 'icon-picker-backdrop hidden';
  iconPickerWrapper.innerHTML = `
    <div class="icon-picker-sheet" role="dialog" aria-modal="true">
      <!-- HEADER -->
      <div class="icon-picker-header">
        <div class="icon-picker-title-group">
          <div class="icon-preview-current-badge">
            <i id="icon-picker-active-badge-icon" class="fa-solid fa-book"></i>
          </div>
          <div>
            <h4 class="icon-picker-title">Chọn Logo Môn Học</h4>
            <span class="icon-picker-subtitle">Hơn 560+ biểu tượng đa ngành & đa năng</span>
          </div>
        </div>
        <button type="button" id="btn-close-icon-picker" class="btn-modal-close" title="Đóng">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- SEARCH BAR -->
      <div class="icon-picker-search-wrap">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input type="text" id="icon-picker-search-input" placeholder="Tìm nhanh icon (VD: robot, code, toán, dược, luật, vẽ, gym, star...)" autocomplete="off">
      </div>

      <!-- CATEGORY TABS (FLEX-WRAP GỌN GÀNG 12 NHÓM NGÀNH) -->
      <div class="icon-picker-tabs-row" id="icon-picker-tabs-row">
        <button type="button" class="icon-tab-btn active" data-cat="all">Tất cả (560+)</button>
        <button type="button" class="icon-tab-btn" data-cat="tech">🤖 CNTT & AI</button>
        <button type="button" class="icon-tab-btn" data-cat="eng">⚙️ Kỹ thuật</button>
        <button type="button" class="icon-tab-btn" data-cat="science">📐 Toán & Khoa học</button>
        <button type="button" class="icon-tab-btn" data-cat="med">🧬 Y Dược & Nông nghiệp</button>
        <button type="button" class="icon-tab-btn" data-cat="biz">🏛️ Kinh tế & Quản trị</button>
        <button type="button" class="icon-tab-btn" data-cat="law">⚖️ Luật & Xã hội</button>
        <button type="button" class="icon-tab-btn" data-cat="lang">🌍 Ngoại ngữ</button>
        <button type="button" class="icon-tab-btn" data-cat="arts">🎨 Thiết kế & Âm nhạc</button>
        <button type="button" class="icon-tab-btn" data-cat="sport">🏃 Thể thao</button>
        <button type="button" class="icon-tab-btn" data-cat="life">⭐ Kỹ năng & SV</button>
        <button type="button" class="icon-tab-btn" data-cat="shapes">🔷 Ký hiệu & Đa năng</button>
      </div>

      <!-- ICON GRID -->
      <div class="icon-picker-grid-container" id="icon-picker-grid-container">
        <!-- Render động 120 icons -->
      </div>

      <!-- FOOTER -->
      <div class="icon-picker-footer">
        <span class="icon-picker-hint">💡 Bấm vào biểu tượng để áp dụng ngay</span>
        <button type="button" id="btn-confirm-icon-picker" class="btn-primary-gradient" style="padding: 0.45rem 1.1rem; font-size: 0.85rem;">
          <i class="fa-solid fa-check"></i> Xong
        </button>
      </div>
    </div>
  `;

  modalRoot.appendChild(iconPickerWrapper);
  renderIconPickerGrid();
  bindSubjectIconPickerEvents();
}

/**
 * Render lưới các icon trong Icon Picker Modal theo từ khóa và danh mục
 * @param {string} query 
 * @param {string} category 
 */
function renderIconPickerGrid(query = '', category = 'all') {
  const container = document.getElementById('icon-picker-grid-container');
  if (!container) return;

  const q = (query || '').toLowerCase().trim();
  const filtered = POPULAR_SUBJECT_ICONS.filter(item => {
    const matchCat = category === 'all' || item.category === category;
    const matchQuery = !q || item.icon.toLowerCase().includes(q) || item.label.toLowerCase().includes(q);
    return matchCat && matchQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        <i class="fa-solid fa-face-meh" style="font-size: 1.8rem; margin-bottom: 0.5rem; display: block; opacity: 0.6;"></i>
        Không tìm thấy icon nào khớp với "${escapeHtml(q)}"
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const isSelected = item.icon === pickerState.selectedIcon;
    return `
      <button type="button" class="icon-grid-item ${isSelected ? 'active' : ''}" data-icon="${escapeHtml(item.icon)}" title="${escapeHtml(item.label)}">
        <i class="${item.icon}"></i>
        <span class="icon-item-label">${escapeHtml(item.label)}</span>
      </button>
    `;
  }).join('');

  // Gắn sự kiện click icon -> Chọn ngay
  container.querySelectorAll('.icon-grid-item').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.icon-grid-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const iconClass = btn.dataset.icon;
      setSelectedSubjectIcon(iconClass);
      closeSubjectIconPicker();
    };
  });
}

/**
 * Cập nhật icon môn học đang chọn lên nút trigger và badge
 * @param {string} iconClass 
 */
function setSelectedSubjectIcon(iconClass = 'fa-solid fa-book') {
  pickerState.selectedIcon = iconClass || 'fa-solid fa-book';
  
  const displayIcon = document.getElementById('display-subject-icon');
  const badgeIcon = document.getElementById('icon-picker-active-badge-icon');
  
  if (displayIcon) {
    displayIcon.className = pickerState.selectedIcon;
  }
  if (badgeIcon) {
    badgeIcon.className = pickerState.selectedIcon;
  }
}

/**
 * Mở modal chọn Logo Icon
 */
export function openSubjectIconPicker() {
  ensureSubjectIconPickerDom();
  const modal = document.getElementById(ICON_PICKER_MODAL_ID);
  if (!modal) return;

  renderIconPickerGrid('', pickerState.activeIconCategory || 'all');
  setSelectedSubjectIcon(pickerState.selectedIcon);

  modal.classList.remove('hidden');
  const searchInput = document.getElementById('icon-picker-search-input');
  if (searchInput) {
    searchInput.value = '';
    setTimeout(() => searchInput.focus(), 80);
  }
}

/**
 * Đóng modal chọn Logo Icon
 */
export function closeSubjectIconPicker() {
  const modal = document.getElementById(ICON_PICKER_MODAL_ID);
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * Gắn các sự kiện cho Modal Chọn Icon
 */
function bindSubjectIconPickerEvents() {
  if (isIconPickerEventsBound) return;
  const modal = document.getElementById(ICON_PICKER_MODAL_ID);
  const closeBtn = document.getElementById('btn-close-icon-picker');
  const confirmBtn = document.getElementById('btn-confirm-icon-picker');
  const searchInput = document.getElementById('icon-picker-search-input');
  const tabsRow = document.getElementById('icon-picker-tabs-row');

  if (!modal) return;

  if (closeBtn) closeBtn.onclick = closeSubjectIconPicker;
  if (confirmBtn) confirmBtn.onclick = closeSubjectIconPicker;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSubjectIconPicker();
  });

  // Tìm kiếm icon theo từ khóa
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim();
      renderIconPickerGrid(q, pickerState.activeIconCategory || 'all');
    });
  }

  // Chuyển tab danh mục
  if (tabsRow) {
    tabsRow.querySelectorAll('.icon-tab-btn').forEach(tabBtn => {
      tabBtn.onclick = () => {
        tabsRow.querySelectorAll('.icon-tab-btn').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        pickerState.activeIconCategory = tabBtn.dataset.cat || 'all';
        const q = searchInput ? searchInput.value.trim() : '';
        renderIconPickerGrid(q, pickerState.activeIconCategory);
      };
    });
  }

  isIconPickerEventsBound = true;
}

/**
 * Cập nhật giao diện ô nhập link Google Drive, badge và nút xem trước
 * @param {string} url 
 * @param {boolean} fromBackpack 
 */
function updateDriveUrlUi(url = '', fromBackpack = false) {
  const driveInput = document.getElementById('class-drive-url-input');
  const syncBadge = document.getElementById('drive-sync-badge');
  const previewBtn = document.getElementById('btn-open-drive-preview');

  if (driveInput && driveInput.value !== url) {
    driveInput.value = url || '';
  }

  const safe = url ? formatSafeUrl(url) : '';
  if (syncBadge) {
    syncBadge.classList.toggle('hidden', !(fromBackpack && safe));
  }
  if (previewBtn) {
    if (safe && (safe.startsWith('http://') || safe.startsWith('https://'))) {
      previewBtn.href = safe;
      previewBtn.classList.remove('hidden');
    } else {
      previewBtn.classList.add('hidden');
    }
  }
}

/**
 * Render danh sách Chip môn học từ Chiếc Cặp
 */
function renderSubjectChips(selectedSubjectName = '') {
  const container = document.getElementById('subject-chips-picker');
  if (!container) return;

  const subjects = state.driveSubjects || [];
  if (subjects.length === 0) {
    container.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-muted);">Chưa có môn trong Chiếc Cặp. Bạn có thể tự gõ tên môn bên dưới.</span>`;
    return;
  }

  container.innerHTML = subjects.map(s => {
    const isSelected = selectedSubjectName && s.name.toLowerCase() === selectedSubjectName.toLowerCase();
    const color = s.color || '#6366f1';
    return `
      <button type="button" class="subject-chip-btn ${isSelected ? 'active' : ''}" 
        style="--chip-color: ${color};"
        data-name="${escapeHtml(s.name)}" 
        data-icon="${escapeHtml(s.icon || 'fa-solid fa-book')}"
        data-code="${escapeHtml(s.code)}">
        <i class="${s.icon || 'fa-solid fa-book'}"></i>
        <span>${escapeHtml(s.name)}</span>
      </button>
    `;
  }).join('');

  // Gắn sự kiện click chip -> Tự động nạp tên, Icon logo và link Drive từ Chiếc Cặp
  container.querySelectorAll('.subject-chip-btn').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.subject-chip-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const nameInput = document.getElementById('class-subject-input');
      const sName = btn.dataset.name;
      const sIcon = btn.dataset.icon || 'fa-solid fa-book';

      if (nameInput) {
        nameInput.value = sName;
        nameInput.focus();
      }

      // Tự động nạp Icon logo của môn
      setSelectedSubjectIcon(sIcon);

      // Tự động tìm và điền link Drive của môn này từ Chiếc Cặp
      const matched = (state.driveSubjects || []).find(s => s.name.toLowerCase() === sName.toLowerCase());
      if (matched && matched.driveUrl) {
        updateDriveUrlUi(matched.driveUrl, true);
      } else {
        updateDriveUrlUi('', false);
      }
    };
  });
}

/**
 * Lấy chuỗi khung giờ học từ 2 ô Bắt đầu và Kết thúc (VD: '07:00 - 08:50')
 * @returns {string}
 */
export function getCurrentTimeRangeString() {
  const startEl = document.getElementById('display-start-time');
  const endEl = document.getElementById('display-end-time');
  const start = startEl ? startEl.textContent.trim() : (pickerState.startTime || '07:00');
  const end = endEl ? endEl.textContent.trim() : (pickerState.endTime || '08:50');
  return `${start} - ${end}`;
}

/**
 * Đồng bộ 2 ô chọn giờ Bắt đầu và Kết thúc từ chuỗi timeRange
 * @param {string} timeRangeString 
 */
export function syncTimeInputsFromRange(timeRangeString = '07:00 - 08:50') {
  const parts = (timeRangeString || '').split('-').map(s => s.trim());
  const startVal = parts[0] || '07:00';
  const endVal = parts[1] || '08:50';
  
  pickerState.startTime = startVal;
  pickerState.endTime = endVal;

  const startEl = document.getElementById('display-start-time');
  const endEl = document.getElementById('display-end-time');
  if (startEl) startEl.textContent = startVal;
  if (endEl) endEl.textContent = endVal;
}

/**
 * Tô sáng Ca học mẫu nếu khung giờ khớp với các ca học có sẵn
 */
function highlightActivePreset() {
  const currentRange = getCurrentTimeRangeString();
  const container = document.getElementById('time-presets-grid');
  if (container) {
    container.querySelectorAll('.btn-time-preset').forEach(b => {
      b.classList.toggle('active', b.dataset.time === currentRange.trim());
    });
  }
}

/**
 * Render danh sách Ca học mẫu (Chuẩn ĐHBK + Ca Tùy Chỉnh do người dùng tạo)
 * @param {string} activeTime - Thời gian đang được chọn
 */
function renderTimePresets(activeTime = '') {
  const container = document.getElementById('time-presets-grid');
  if (!container) return;

  const customPresets = getCustomTimePresets();
  const allPresets = [
    ...TIME_PRESETS.map(p => ({ ...p, isCustom: false })),
    ...customPresets.map(p => ({ ...p, isCustom: true }))
  ];

  container.innerHTML = allPresets.map((p, idx) => {
    const isCustom = p.isCustom;
    const customIdx = isCustom ? (idx - TIME_PRESETS.length) : -1;
    const isActive = activeTime && (p.time.trim() === activeTime.trim());
    return `
      <div class="time-preset-wrapper ${isCustom ? 'is-custom' : ''}">
        <button type="button" class="btn-time-preset ${isActive ? 'active' : ''}" 
          data-time="${escapeHtml(p.time)}" 
          title="${escapeHtml(p.label || p.time)}">
          <span class="preset-time-title">${escapeHtml(p.time)}</span>
          ${p.period ? `<span class="preset-time-period">${escapeHtml(p.period)}</span>` : ''}
        </button>
        ${isCustom ? `
          <button type="button" class="btn-delete-custom-preset" data-custom-idx="${customIdx}" title="Xóa ca mẫu tự tạo này">
            <i class="fa-solid fa-xmark"></i>
          </button>
        ` : ''}
      </div>
    `;
  }).join('');

  // Gắn sự kiện click chọn ca học mẫu
  container.querySelectorAll('.btn-time-preset').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.btn-time-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      syncTimeInputsFromRange(btn.dataset.time);
    };
  });

  // Gắn sự kiện xóa ca tự tạo
  container.querySelectorAll('.btn-delete-custom-preset').forEach(delBtn => {
    delBtn.onclick = (e) => {
      e.stopPropagation();
      const customIdx = parseInt(delBtn.dataset.customIdx, 10);
      const currentList = getCustomTimePresets();
      if (currentList[customIdx]) {
        const removed = currentList.splice(customIdx, 1)[0];
        saveCustomTimePresets(currentList);
        renderTimePresets(getCurrentTimeRangeString());
        showToast(`Đã xóa ca mẫu "${removed.time}" 🗑️`);
      }
    };
  });
}

/**
 * Render danh sách Gợi ý phòng học (Chuẩn + Tự tạo)
 * @param {string} selectedRoom 
 */
function renderRoomPresets(selectedRoom = '') {
  const container = document.getElementById('room-presets-row');
  if (!container) return;

  const customRooms = getCustomRoomPresets();
  const allRooms = [
    ...ROOM_PRESETS.map(r => ({ room: r, isCustom: false })),
    ...customRooms.map(r => ({ room: r, isCustom: true }))
  ];

  container.innerHTML = `
    <span class="room-preset-label">Gợi ý phòng:</span>
    ${allRooms.map((r, idx) => {
      const isCustom = r.isCustom;
      const customIdx = isCustom ? (idx - ROOM_PRESETS.length) : -1;
      const isActive = selectedRoom && (r.room.trim().toLowerCase() === selectedRoom.trim().toLowerCase());
      return `
        <div class="room-preset-tag-wrapper ${isCustom ? 'is-custom-room' : ''}">
          <button type="button" class="btn-room-preset ${isActive ? 'active' : ''}" data-room="${escapeHtml(r.room)}">
            ${escapeHtml(r.room)}
          </button>
          ${isCustom ? `
            <button type="button" class="btn-delete-custom-room" data-custom-idx="${customIdx}" title="Xóa phòng mẫu này">
              <i class="fa-solid fa-xmark"></i>
            </button>
          ` : ''}
        </div>
      `;
    }).join('')}
  `;

  // Gắn sự kiện click chọn phòng
  container.querySelectorAll('.btn-room-preset').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.btn-room-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const roomInput = document.getElementById('class-room-input');
      if (roomInput) {
        roomInput.value = btn.dataset.room;
        roomInput.focus();
      }
    };
  });

  // Gắn sự kiện xóa phòng tự tạo
  container.querySelectorAll('.btn-delete-custom-room').forEach(delBtn => {
    delBtn.onclick = (e) => {
      e.stopPropagation();
      const customIdx = parseInt(delBtn.dataset.customIdx, 10);
      const currentList = getCustomRoomPresets();
      if (currentList[customIdx] !== undefined) {
        const removed = currentList.splice(customIdx, 1)[0];
        saveCustomRoomPresets(currentList);
        const roomInput = document.getElementById('class-room-input');
        renderRoomPresets(roomInput ? roomInput.value : '');
        showToast(`Đã xóa phòng mẫu "${removed}" 🗑️`);
      }
    };
  });
}

// ============================================================================
// 4. iOS DRUM ROLLER WHEEL ENGINE & CONTROLLER
// ============================================================================

/**
 * Cập nhật hiệu ứng 3D (perspective, rotateX, scale, opacity) cho từng item khi cuộn
 * @param {HTMLElement} scroller 
 */
function updateWheel3DEffect(scroller) {
  if (!scroller) return;
  const scrollTop = scroller.scrollTop;
  const items = scroller.querySelectorAll('.ios-wheel-item');
  
  items.forEach((item, idx) => {
    const itemCenter = idx * ITEM_HEIGHT;
    const distance = itemCenter - scrollTop;
    const absDist = Math.abs(distance);
    
    // Tính góc xoay rotateX (-65deg đến 65deg)
    const angle = Math.max(-65, Math.min(65, (distance / ITEM_HEIGHT) * 22));
    // Tính độ mờ opacity (0.18 đến 1.0)
    const opacity = Math.max(0.18, 1 - (absDist / (ITEM_HEIGHT * 2.6)));
    // Tính độ phóng đại
    const scale = absDist < (ITEM_HEIGHT * 0.5) ? 1.15 : 0.95;

    item.style.transform = `perspective(300px) rotateX(${-angle}deg) scale(${scale})`;
    item.style.opacity = opacity.toFixed(2);

    if (absDist < (ITEM_HEIGHT * 0.5)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

/**
 * Cuộn con lăn mượt mà tới giờ và phút cụ thể
 * @param {number} hour 
 * @param {number} minute 
 * @param {boolean} smooth 
 */
function scrollToTime(hour, minute, smooth = true) {
  const hoursScroller = document.getElementById('ios-wheel-hours-scroller');
  const minutesScroller = document.getElementById('ios-wheel-minutes-scroller');
  const behavior = smooth ? 'smooth' : 'auto';

  const h = Math.max(0, Math.min(23, hour || 0));
  const m = Math.max(0, Math.min(59, minute || 0));

  if (hoursScroller) {
    hoursScroller.scrollTo({ top: h * ITEM_HEIGHT, behavior });
    updateWheel3DEffect(hoursScroller);
  }
  if (minutesScroller) {
    minutesScroller.scrollTo({ top: m * ITEM_HEIGHT, behavior });
    updateWheel3DEffect(minutesScroller);
  }

  updatePickerSubpreview(h, m);
}

/**
 * Cập nhật số giờ xem trước trên header của picker
 * @param {number} h 
 * @param {number} m 
 */
function updatePickerSubpreview(h, m) {
  const subpreview = document.getElementById('ios-picker-subpreview');
  if (subpreview) {
    const strH = String(h).padStart(2, '0');
    const strM = String(m).padStart(2, '0');
    subpreview.textContent = `${strH} : ${strM}`;
  }
}

/**
 * Lấy giá trị giờ và phút hiện tại từ vị trí cuộn của 2 con lăn
 * @returns {{ hour: number, minute: number, formatted: string }}
 */
function getSelectedWheelTime() {
  const hoursScroller = document.getElementById('ios-wheel-hours-scroller');
  const minutesScroller = document.getElementById('ios-wheel-minutes-scroller');

  let h = 7;
  let m = 0;

  if (hoursScroller) {
    h = Math.max(0, Math.min(23, Math.round(hoursScroller.scrollTop / ITEM_HEIGHT)));
  }
  if (minutesScroller) {
    m = Math.max(0, Math.min(59, Math.round(minutesScroller.scrollTop / ITEM_HEIGHT)));
  }

  const strH = String(h).padStart(2, '0');
  const strM = String(m).padStart(2, '0');
  return { hour: h, minute: m, formatted: `${strH}:${strM}` };
}

/**
 * Mở modal con lăn iOS cho ô Bắt đầu hoặc ô Kết thúc
 * @param {'start' | 'end'} targetType 
 */
export function openIosWheelPicker(targetType = 'start') {
  ensureIosWheelPickerDom();
  pickerState.activeTarget = targetType;

  const pickerModal = document.getElementById(PICKER_MODAL_ID);
  const titleEl = document.getElementById('ios-picker-title');

  const currentVal = targetType === 'start' ? pickerState.startTime : pickerState.endTime;
  const parts = (currentVal || '').split(':').map(s => parseInt(s, 10));
  const h = isNaN(parts[0]) ? (targetType === 'start' ? 7 : 8) : parts[0];
  const m = isNaN(parts[1]) ? (targetType === 'start' ? 0 : 50) : parts[1];

  if (titleEl) {
    titleEl.textContent = targetType === 'start' ? 'Chọn Giờ Bắt Đầu' : 'Chọn Giờ Kết Thúc';
  }

  if (pickerModal) {
    pickerModal.classList.remove('hidden');
    // Cuộn tới vị trí ngay lập tức khi mở
    requestAnimationFrame(() => {
      scrollToTime(h, m, false);
      setTimeout(() => {
        scrollToTime(h, m, true);
      }, 50);
    });
  }
}

/**
 * Đóng modal con lăn iOS
 */
export function closeIosWheelPicker() {
  const pickerModal = document.getElementById(PICKER_MODAL_ID);
  if (pickerModal) {
    pickerModal.classList.add('hidden');
  }
}

/**
 * Gắn các sự kiện cho Modal Con Lăn iOS
 */
function bindIosWheelPickerEvents() {
  if (isPickerEventsBound) return;

  const pickerModal = document.getElementById(PICKER_MODAL_ID);
  const cancelBtn = document.getElementById('btn-ios-picker-cancel');
  const saveBtn = document.getElementById('btn-ios-picker-save');
  const hoursScroller = document.getElementById('ios-wheel-hours-scroller');
  const minutesScroller = document.getElementById('ios-wheel-minutes-scroller');

  if (!pickerModal) return;

  // Hủy
  if (cancelBtn) {
    cancelBtn.onclick = (e) => {
      e.preventDefault();
      closeIosWheelPicker();
    };
  }

  // Đóng khi click backdrop
  pickerModal.addEventListener('click', (e) => {
    if (e.target === pickerModal) {
      closeIosWheelPicker();
    }
  });

  // Lưu giờ đã chọn
  if (saveBtn) {
    saveBtn.onclick = (e) => {
      e.preventDefault();
      const selected = getSelectedWheelTime();
      
      if (pickerState.activeTarget === 'start') {
        pickerState.startTime = selected.formatted;
        const startEl = document.getElementById('display-start-time');
        if (startEl) startEl.textContent = selected.formatted;
      } else {
        pickerState.endTime = selected.formatted;
        const endEl = document.getElementById('display-end-time');
        if (endEl) endEl.textContent = selected.formatted;
      }

      closeIosWheelPicker();
      highlightActivePreset();
    };
  }

  // Lắng nghe sự kiện scroll của 2 con lăn để cập nhật 3D effect
  let hourScrollTimer = null;
  if (hoursScroller) {
    hoursScroller.addEventListener('scroll', () => {
      updateWheel3DEffect(hoursScroller);
      clearTimeout(hourScrollTimer);
      hourScrollTimer = setTimeout(() => {
        const cur = getSelectedWheelTime();
        updatePickerSubpreview(cur.hour, cur.minute);
      }, 50);
    }, { passive: true });
  }

  let minScrollTimer = null;
  if (minutesScroller) {
    minutesScroller.addEventListener('scroll', () => {
      updateWheel3DEffect(minutesScroller);
      clearTimeout(minScrollTimer);
      minScrollTimer = setTimeout(() => {
        const cur = getSelectedWheelTime();
        updatePickerSubpreview(cur.hour, cur.minute);
      }, 50);
    }, { passive: true });
  }

  // Gắn sự kiện click trực tiếp vào item số để tự cuộn tới item đó
  pickerModal.querySelectorAll('.ios-wheel-item').forEach(item => {
    item.addEventListener('click', () => {
      const val = parseInt(item.dataset.val, 10);
      const parentScroller = item.closest('.ios-wheel-scroller');
      if (parentScroller) {
        parentScroller.scrollTo({ top: val * ITEM_HEIGHT, behavior: 'smooth' });
      }
    });
  });

  // Gắn sự kiện cho các pill phím tắt nhanh mốc giờ chuẩn
  pickerModal.querySelectorAll('.ios-quick-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const timeStr = pill.dataset.time || '07:00';
      const parts = timeStr.split(':').map(s => parseInt(s, 10));
      scrollToTime(parts[0], parts[1], true);
    });
  });

  isPickerEventsBound = true;
}

// ============================================================================
// 5. EVENT HANDLERS & DOM BINDING FOR MAIN MODAL
// ============================================================================

/**
 * Gắn các sự kiện cho Modal Thêm Tiết Học
 */
function bindAddClassModalEvents() {
  if (isEventsBound) return;
  const modal = document.getElementById(MODAL_ID);
  const form = document.getElementById('add-class-form');
  const closeBtn = document.getElementById('btn-close-add-class');
  const cancelBtn = document.getElementById('btn-cancel-add-class');
  const deleteBtn = document.getElementById('btn-delete-class');
  const savePresetBtn = document.getElementById('btn-save-custom-preset');
  const saveRoomBtn = document.getElementById('btn-save-custom-room');
  
  const pickStartBtn = document.getElementById('btn-pick-start-time');
  const pickEndBtn = document.getElementById('btn-pick-end-time');
  const iconTriggerBtn = document.getElementById('btn-open-icon-picker');
  const subjectInput = document.getElementById('class-subject-input');
  const driveInput = document.getElementById('class-drive-url-input');

  if (!modal || !form) return;

  // Đóng modal chính
  const closeModal = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    currentEditingClass = null;
    form.reset();
    updateDriveUrlUi('', false);
    setSelectedSubjectIcon('fa-solid fa-book');
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      const iconPickerModal = document.getElementById(ICON_PICKER_MODAL_ID);
      const wheelModal = document.getElementById(PICKER_MODAL_ID);

      if (iconPickerModal && !iconPickerModal.classList.contains('hidden')) {
        closeSubjectIconPicker();
      } else if (wheelModal && !wheelModal.classList.contains('hidden')) {
        closeIosWheelPicker();
      } else {
        closeModal();
      }
    }
  });

  // Mở bộ chọn Logo Icon Môn Học
  if (iconTriggerBtn) {
    iconTriggerBtn.onclick = (e) => {
      e.preventDefault();
      openSubjectIconPicker();
    };
  }

  // Tự động nhận diện môn có sẵn trong Chiếc Cặp khi gõ tên môn
  if (subjectInput) {
    subjectInput.addEventListener('input', () => {
      const val = subjectInput.value.trim();
      const matched = (state.driveSubjects || []).find(s => s.name.toLowerCase() === val.toLowerCase());
      if (matched) {
        if (matched.icon) setSelectedSubjectIcon(matched.icon);
        if (matched.driveUrl) updateDriveUrlUi(matched.driveUrl, true);
      } else {
        const syncBadge = document.getElementById('drive-sync-badge');
        if (syncBadge) syncBadge.classList.add('hidden');
      }
    });
  }

  // Cập nhật nút xem trước Drive khi người dùng tự nhập link
  if (driveInput) {
    driveInput.addEventListener('input', () => {
      const val = driveInput.value.trim();
      updateDriveUrlUi(val, false);
    });
  }

  // Gắn sự kiện click 2 Capsule Bắt Đầu và Kết Thúc -> Mở iOS Roller Wheel
  if (pickStartBtn) {
    pickStartBtn.onclick = (e) => {
      e.preventDefault();
      openIosWheelPicker('start');
    };
  }
  if (pickEndBtn) {
    pickEndBtn.onclick = (e) => {
      e.preventDefault();
      openIosWheelPicker('end');
    };
  }

  // Gắn sự kiện Lưu Ca Học Mẫu Mới
  if (savePresetBtn) {
    savePresetBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const timeVal = getCurrentTimeRangeString();

      if (!timeVal) {
        showToast('Vui lòng chọn khung giờ học trước!');
        return;
      }

      const customList = getCustomTimePresets();
      const isDuplicate = TIME_PRESETS.some(p => p.time.trim() === timeVal) ||
                          customList.some(p => p.time.trim() === timeVal);
      if (isDuplicate) {
        showToast('Ca học này đã có sẵn trong danh sách mẫu!');
        renderTimePresets(timeVal);
        return;
      }

      const newPreset = {
        time: timeVal,
        period: '',
        label: `Tùy chỉnh: ${timeVal}`
      };

      customList.push(newPreset);
      saveCustomTimePresets(customList);
      renderTimePresets(timeVal);
      showToast(`Đã lưu ca mẫu: ${timeVal} 🎉`);
    };
  }

  // Gắn sự kiện Lưu Phòng Học Mẫu Mới
  if (saveRoomBtn) {
    saveRoomBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const roomInput = document.getElementById('class-room-input');
      const roomVal = roomInput ? roomInput.value.trim() : '';

      if (!roomVal) {
        showToast('Vui lòng nhập tên phòng học trước (VD: H6-204)!');
        if (roomInput) roomInput.focus();
        return;
      }

      const customList = getCustomRoomPresets();
      const isDuplicate = ROOM_PRESETS.some(r => r.toLowerCase() === roomVal.toLowerCase()) ||
                          customList.some(r => r.toLowerCase() === roomVal.toLowerCase());
      if (isDuplicate) {
        showToast('Phòng học này đã có trong danh sách gợi ý!');
        renderRoomPresets(roomVal);
        return;
      }

      customList.push(roomVal);
      saveCustomRoomPresets(customList);
      renderRoomPresets(roomVal);
      showToast(`Đã lưu phòng mẫu: "${roomVal}" 🎉`);
    };
  }

  // Xóa tiết
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      if (!currentEditingClass) return;
      if (onDeleteCallback) {
        onDeleteCallback(
          currentEditingClass.dayName, 
          currentEditingClass.classIndex, 
          currentEditingClass.classData
        );
      }
      closeModal();
    };
  }

  // Submit Form Lưu Tiết Học & Tự Động Đồng Bộ Vào Chiếc Cặp
  form.onsubmit = (e) => {
    e.preventDefault();
    const daySelect = document.getElementById('class-day-select');
    const roomInput = document.getElementById('class-room-input');
    const driveUrlInput = document.getElementById('class-drive-url-input');

    const dayName = daySelect ? daySelect.value : 'Thứ 2';
    const subject = subjectInput ? subjectInput.value.trim() : '';
    const timeRange = getCurrentTimeRangeString();
    const period = getPeriodFromTimeRange(timeRange);
    const room = roomInput ? roomInput.value.trim() : 'Chưa xếp phòng';
    const icon = pickerState.selectedIcon || 'fa-solid fa-book';
    
    const rawDriveUrl = driveUrlInput ? driveUrlInput.value.trim() : '';
    const safeDriveUrl = rawDriveUrl ? formatSafeUrl(rawDriveUrl) : '';

    const startTime = pickerState.startTime || (timeRange.split('-')[0] || '').trim();
    const endTime = pickerState.endTime || (timeRange.split('-')[1] || '').trim();

    if (!subject || !timeRange) {
      showToast('Vui lòng nhập tên môn và khung giờ học!');
      return;
    }

    // ========================================================================
    // TỰ ĐỘNG LƯU / ĐỒNG BỘ MÔN HỌC & ICON VÀO CHIẾC CẶP GOOGLE DRIVE
    // ========================================================================
    const subjectTrim = subject.trim();
    let subjectInBackpack = (state.driveSubjects || []).find(s => s.name.toLowerCase() === subjectTrim.toLowerCase());

    if (!subjectInBackpack) {
      // Tự động tạo môn mới trong Chiếc Cặp kèm Icon logo đã chọn
      const cleanCode = subjectTrim.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 10) || 'MON-HOC';
      const newSubject = {
        name: subjectTrim,
        code: cleanCode,
        credits: 3,
        color: '#6366f1',
        icon: icon,
        driveUrl: safeDriveUrl,
        notes: `Được tạo tự động khi thêm tiết học vào lịch (${dayName})`,
        components: [
          { name: 'Quá trình', weight: 50, score: null },
          { name: 'Cuối kỳ', weight: 50, score: null }
        ]
      };
      state.driveSubjects.push(newSubject);
      persistDriveSubjects();
      renderSubjectChips(subjectTrim);
      if (typeof window.renderBackpackView === 'function') {
        window.renderBackpackView();
      }
    } else {
      // Nếu môn đã có: Cập nhật link Drive & Icon nếu có thay đổi
      let updated = false;
      if (!subjectInBackpack.driveUrl && safeDriveUrl) {
        subjectInBackpack.driveUrl = safeDriveUrl;
        updated = true;
      }
      if (icon && icon !== 'fa-solid fa-book' && subjectInBackpack.icon !== icon) {
        subjectInBackpack.icon = icon;
        updated = true;
      }
      if (updated) {
        persistDriveSubjects();
        if (typeof window.renderBackpackView === 'function') {
          window.renderBackpackView();
        }
      }
    }

    const classData = {
      subject: subjectTrim,
      timeRange,
      period,
      room,
      startTime,
      endTime,
      driveUrl: safeDriveUrl,
      icon
    };

    if (onSaveCallback) {
      onSaveCallback({
        dayName,
        classData,
        isEdit: Boolean(currentEditingClass),
        classIndex: currentEditingClass ? currentEditingClass.classIndex : -1,
        oldDayName: currentEditingClass ? currentEditingClass.dayName : null
      });
    }

    closeModal();
    showToast(`Đã lưu tiết "${subjectTrim}" vào ${dayName} 🎉`);
  };

  isEventsBound = true;
}

// ============================================================================
// 6. PUBLIC CONTROLLER / EXPORTS
// ============================================================================

/**
 * Mở modal Thêm Tiết Học Mới vào 1 ngày cụ thể
 * @param {string} targetDayName - Tên ngày (VD: 'Thứ 2', 'Thứ 3'...)
 * @param {Function} onSave - Callback khi lưu
 */
export function openAddClassModal(targetDayName = 'Thứ 2', onSave) {
  ensureAddClassModalDom();
  currentEditingClass = null;
  onSaveCallback = onSave;
  onDeleteCallback = null;

  const modal = document.getElementById(MODAL_ID);
  const titleEl = document.getElementById('add-class-modal-title');
  const subEl = document.getElementById('add-class-modal-subtitle');
  const daySelect = document.getElementById('class-day-select');
  const deleteBtn = document.getElementById('btn-delete-class');
  const saveText = document.getElementById('btn-save-class-text');

  if (titleEl) titleEl.textContent = `Thêm Tiết Học (${targetDayName})`;
  if (subEl) subEl.textContent = 'Chọn môn từ Chiếc Cặp, gắn logo và ca học';
  if (daySelect) daySelect.value = targetDayName;
  if (deleteBtn) deleteBtn.style.display = 'none';
  if (saveText) saveText.textContent = 'Thêm Tiết Học';

  // Render chips, time presets & room presets
  renderSubjectChips('');
  syncTimeInputsFromRange('07:00 - 08:50');
  renderTimePresets('07:00 - 08:50');
  renderRoomPresets('B1-305 (CS1)');

  // Reset form inputs, icon & drive preview
  const subjectInput = document.getElementById('class-subject-input');
  const roomInput = document.getElementById('class-room-input');
  if (subjectInput) subjectInput.value = '';
  if (roomInput) roomInput.value = 'B1-305 (CS1)';
  
  setSelectedSubjectIcon('fa-solid fa-book');
  updateDriveUrlUi('', false);

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/**
 * Mở modal Chỉnh Sửa một tiết học hiện có
 * @param {string} dayName 
 * @param {number} classIndex 
 * @param {Object} classData 
 * @param {Function} onSave 
 * @param {Function} onDelete 
 */
export function openEditClassModal(dayName, classIndex, classData, onSave, onDelete) {
  ensureAddClassModalDom();
  currentEditingClass = { dayName, classIndex, classData };
  onSaveCallback = onSave;
  onDeleteCallback = onDelete;

  const modal = document.getElementById(MODAL_ID);
  const titleEl = document.getElementById('add-class-modal-title');
  const subEl = document.getElementById('add-class-modal-subtitle');
  const daySelect = document.getElementById('class-day-select');
  const deleteBtn = document.getElementById('btn-delete-class');
  const saveText = document.getElementById('btn-save-class-text');

  if (titleEl) titleEl.textContent = `Chỉnh Sửa Tiết: ${classData.subject}`;
  if (subEl) subEl.textContent = `Cập nhật phòng học, ca học hoặc đổi thứ`;
  if (daySelect) daySelect.value = dayName;
  if (deleteBtn) deleteBtn.style.display = 'inline-flex';
  if (saveText) saveText.textContent = 'Cập Nhật Tiết Học';

  // Render chips, time presets & room presets
  renderSubjectChips(classData.subject);
  syncTimeInputsFromRange(classData.timeRange || '07:00 - 08:50');
  renderTimePresets(classData.timeRange || '');
  renderRoomPresets(classData.room || '');

  // Fill values
  const subjectInput = document.getElementById('class-subject-input');
  const roomInput = document.getElementById('class-room-input');
  if (subjectInput) subjectInput.value = classData.subject || '';
  if (roomInput) roomInput.value = classData.room || '';

  // Nạp Icon của môn
  const matched = (state.driveSubjects || []).find(s => s.name.toLowerCase() === (classData.subject || '').toLowerCase());
  const iconToUse = classData.icon || (matched ? matched.icon : 'fa-solid fa-book');
  setSelectedSubjectIcon(iconToUse);

  // Nạp link Drive từ tiết học hoặc từ Chiếc Cặp
  const urlToUse = classData.driveUrl || (matched ? matched.driveUrl : '');
  updateDriveUrlUi(urlToUse, Boolean(matched && matched.driveUrl && matched.driveUrl === urlToUse));

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

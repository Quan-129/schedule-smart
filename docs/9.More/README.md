# MỤC LỤC & BÁO CÁO TỔNG HỢP TÀI LIỆU BỔ SUNG (MORE DOCS HUB) 📚

> **Thư mục**: `docs/9.More/`  
> **Chịu trách nhiệm**: `9-more-archiver (AI Agent Skill)`  
> **Mục tiêu**: Lưu trữ, phân loại và tóm tắt tập trung toàn bộ các bản kế hoạch thực thi, báo cáo tính năng và tài liệu kỹ thuật bổ sung phát sinh trong quá trình phát triển dự án.

---

## 📑 1. BẢNG DANH MỤC & MỤC LỤC TỔNG QUAN

| STT | Tên Tài Liệu & Đường Dẫn | Thể Loại | Tóm Tắt Mục Đích & Nội Dung Chính | Trạng Thái |
| :---: | :--- | :--- :--- | :--- | :---: |
| **1** | [implementation_plan.md](./implementation_plan.md) | `Kế hoạch Kiến trúc` | Đặc tả kỹ thuật và kế hoạch xây dựng tính năng "Chiếc Cặp Thông Minh" (Smart Backpack), cơ chế lưu trữ IndexedDB và nâng cấp ứng dụng PWA. | 🟢 Đã hoàn thành |
| **2** | [walkthrough.md](./walkthrough.md) | `Báo cáo Tính năng` | Báo cáo trải nghiệm người dùng đối với Màn hình Đăng nhập riêng biệt (Authentication Gate) và đồng bộ Cloud Firestore. | 🟢 Đã hoàn thành |
| **3** | [HocMay_BanChat_Va_LoiGiai.pdf](./HocMay_BanChat_Va_LoiGiai.pdf) ([HTML](./HocMay_BanChat_Va_LoiGiai.html)) | `Tài liệu Học thuật & Lời giải` | Cẩm nang phân tích bản chất và lời giải mẫu hoàn chỉnh 5 dạng bài tập Học Máy kinh điển (Ma trận nhầm lẫn, Hồi quy, Bias-Variance, Đa lớp, ROC-AUC) theo phương pháp ẩn dụ trực giác đời thực. | 🟢 Đã hoàn thành |
| **4** | [CayQuyetDinh_DecisionTrees_LoiGiai.pdf](./CayQuyetDinh_DecisionTrees_LoiGiai.pdf) ([HTML](./CayQuyetDinh_DecisionTrees_LoiGiai.html)) | `Tài liệu Học thuật & Lời giải` | Cẩm nang chuyên sâu Cây Quyết Định (Decision Trees): Phân tích bản chất Information Gain, Gain Ratio, Ngưỡng liên tục, Gini Index, Pessimistic Pruning (C4.5) và Cost-Complexity Pruning (CART). | 🟢 Đã hoàn thành |
| **5** | [LapTrinh_DecisionTrees_ScikitLearn.pdf](./LapTrinh_DecisionTrees_ScikitLearn.pdf) ([HTML](./LapTrinh_DecisionTrees_ScikitLearn.html)) | `Thực Hành Lập Trình & Lời Giải` | Cẩm nang thực hành Decision Trees với Scikit-Learn: Phân loại Iris/PlayTennis (ID3, C4.5, CART, plot_tree, 5-Fold CV), Hồi quy DecisionTreeRegressor trên Diabetes, so sánh max_depth, xử lý khuyết thiếu bằng SimpleImputer vs KNNImputer. | 🟢 Đã hoàn thành |
| **6** | [MangNeuron_BanChat_Va_LoiGiai.pdf](./MangNeuron_BanChat_Va_LoiGiai.pdf) ([HTML](./MangNeuron_BanChat_Va_LoiGiai.html)) | `Tài liệu Học thuật & Lời giải` | Cẩm nang chuyên sâu Mạng Neuron Nhân Tạo & Tối Ưu: Nghiệm đóng Hồi quy Tuyến tính X^T X, Hồi quy Logistic & Cross-Entropy Loss, So sánh Ridge (L2) vs LASSO (L1), Lan truyền thuận MLP với ReLU, và Định lý Xấp xỉ Phổ quát giải bài toán XOR. | 🟢 Đã hoàn thành |
| **7** | [ThuatToanHuanLuyen_MangNeuron.pdf](./ThuatToanHuanLuyen_MangNeuron.pdf) ([HTML](./ThuatToanHuanLuyen_MangNeuron.html)) | `Tài liệu Học thuật & Lời giải` | Cẩm nang chuyên sâu Thuật Toán Huấn Luyện Mạng Neuron: Gradient Descent with Momentum, Huber Loss (Kháng Outlier), Adam Optimizer (Thích nghi Moment 1 & 2), Focal Loss (Hard Example Mining), Cosine Annealing Learning Rate, và Lan truyền ngược Backpropagation toàn diện. | 🟢 Đã hoàn thành |
| **8** | [MoHinhTuyenTinh_HoiQuy_HCMUT.pdf](./MoHinhTuyenTinh_HoiQuy_HCMUT.pdf) ([HTML](./MoHinhTuyenTinh_HoiQuy_HCMUT.html)) | `Tài liệu Học thuật & Lời giải` | Masterclass Mô hình Tuyến tính cho Bài toán Hồi quy (Linear Models for Regression - HCMUT 43 Slides): Bản chất nhiễu Gaussian & MLE, Nghiệm đóng X^T X & Chiếu trực giao Span(X), Mini-batch GD, Hàm cơ sở Basis Functions, Bóc trần bảng trọng số bùng nổ Overfitting, Regularization Ridge (L2) vs LASSO (L1) qua hình học KKT, Hồi quy Đa mục tiêu & Master Cheat-Sheet. | 🟢 Đã hoàn thành |

---

## 🔍 2. CHI TIẾT & ĐÁNH GIÁ TỪNG TÀI LIỆU

### 🎒 1. [Kế Hoạch Triển Khai Chiếc Cặp Thông Minh & PWA](./implementation_plan.md)
- **Tập tin**: `docs/9.More/implementation_plan.md`
- **Mục tiêu giải quyết**:
  - Xây dựng giao diện File Explorer thu nhỏ cho từng môn học để quản lý Slide bài giảng, Bài tập lớn, Đề thi cũ.
  - Tích hợp công nghệ PWA (Progressive Web App) với `manifest.json` và Service Worker (`sw.js`) để cài đặt trực tiếp lên iPhone/Android.
  - Thiết lập cơ chế lưu trữ Offline bằng IndexedDB giúp sinh viên mở tài liệu bài giảng ngay cả khi không có kết nối Wi-Fi/4G.
- **Giá trị tra cứu**: Cung cấp tài liệu tham khảo chi tiết về các bước chuyển đổi Web App thông thường sang PWA hoàn chỉnh.

---

### 🚪 2. [Báo Cáo Màn Hình Đăng Nhập & Cổng Xác Thực](./walkthrough.md)
- **Tập tin**: `docs/9.More/walkthrough.md`
- **Mục tiêu giải quyết**:
  - Thiết kế màn hình Landing Login Gate phong cách Glassmorphism che chắn giao diện chính cho đến khi sinh viên đăng nhập Google.
  - Đảm bảo tính bảo mật và cá nhân hóa dữ liệu thời khóa biểu cho từng tài khoản.
- **Giá trị tra cứu**: Ghi lại luồng trải nghiệm đăng nhập và kiến trúc đồng bộ Firebase Auth / Firestore.

---

### 🧠 3. [Bản Chất Cốt Lõi & Lời Giải Mẫu 5 Dạng Bài Học Máy Kinh Điển](./HocMay_BanChat_Va_LoiGiai.pdf)
- **Tập tin**: `docs/9.More/HocMay_BanChat_Va_LoiGiai.pdf` (Kèm bản gốc [HTML](./HocMay_BanChat_Va_LoiGiai.html))
- **Mục tiêu giải quyết**:
  - Biên soạn tài liệu học thuật theo triết lý "Trực giác Đời thực $\rightarrow$ Cầu nối Toán học $\rightarrow$ Lời giải Chi tiết $\rightarrow$ Liên kết Thực chiến".
  - Bóc tách toàn diện 5 bài toán: Ma trận nhầm lẫn (Binary Confusion Matrix), Chỉ số Hồi quy (MAE, MSE, RMSE, R²), Phân rã Bias-Variance, Đánh giá Đa lớp (Macro vs Weighted Recall), và Xác suất ROC-AUC (Đếm cặp Mann-Whitney U).
- **Giá trị tra cứu**: Cẩm nang mẫu mực để tra cứu công thức, ôn tập kiểm tra, phỏng vấn tuyển dụng AI và hiểu sâu bản chất các độ đo đánh giá mô hình.

---

### 🌲 4. [Cây Quyết Định (Decision Trees): Bản Chất & Lời Giải Mẫu Toàn Diện](./CayQuyetDinh_DecisionTrees_LoiGiai.pdf)
- **Tập tin**: `docs/9.More/CayQuyetDinh_DecisionTrees_LoiGiai.pdf` (Kèm bản gốc [HTML](./CayQuyetDinh_DecisionTrees_LoiGiai.html))
- **Mục tiêu giải quyết**:
  - Biên soạn tài liệu học thuật chuẩn A4 6 trang hoàn chỉnh, tuân thủ 100% Zero-Emoji và Native CSS Math.
  - Bóc tách toàn diện 5 bài toán Cây Quyết Định:
    1. *Bài 1*: Entropy ban đầu $H(S) = 0.9403$, Information Gain Outlook ($0.2468$) vs Humidity ($0.1518$), SplitInfo ($1.5774$), Gain Ratio ($0.1565$ vs $0.1518$) $\rightarrow$ Chọn Outlook làm nút gốc.
    2. *Bài 2*: Ngưỡng tối ưu thuộc tính liên tục (Temperature), định lý Fayyad & Irani cắt tại ranh giới đổi nhãn ($T=72.5$ vượt trội $T=77.5$), tính $IG(T=75) = 0.0112$ và Gain Ratio ($0.0140$).
    3. *Bài 3*: Chỉ số Gini Impurity (Nút cha $0.3750$, con trái $0.5000$, con phải $0.1528$), mức giảm $\Delta\text{Gini} = 0.0833$.
    4. *Bài 4*: Đánh giá Pessimistic Error Pruning (C4.5), chứng minh cành con không giảm lỗi thực tế thì nên cắt tỉa ($7.5 < 8.0$).
    5. *Bài 5*: Cắt tỉa chi phí độ phức tạp Cost-Complexity Pruning (CART), phân tích hàm $R_\alpha(T) = R(T) + \alpha|T|$, so sánh với $\alpha=2.0$ nên chọn cây cắt tỉa $T'$ ($38.0 < 45.0$).
- **Giá trị tra cứu**: Cẩm nang nền tảng để hiểu sâu cơ chế hoạt động của thuật toán cây, làm tiền đề vững chắc cho Ensemble Learning (Random Forest, Gradient Boosting, XGBoost).

---

### 💻 5. [Lập Trình Decision Trees với Scikit-Learn: Bản Chất & Lời Giải Mẫu](./LapTrinh_DecisionTrees_ScikitLearn.pdf)
- **Tập tin**: `docs/9.More/LapTrinh_DecisionTrees_ScikitLearn.pdf` (Kèm bản gốc [HTML](./LapTrinh_DecisionTrees_ScikitLearn.html))
- **Mục tiêu giải quyết**:
  - Biên soạn cẩm nang thực hành chuẩn A4 6 trang hoàn chỉnh, tuân thủ 100% Zero-Emoji và Native CSS Math, không phát sinh lỗi Type3 font trên PDF.js.
  - Hướng dẫn phương pháp sư phạm 6 bước: Đề bài gốc -> Ẩn dụ thực tế -> Giải mã bản chất thuật toán & tham số -> Code Python chuẩn -> Kết quả thực nghiệm -> Đúc kết thực chiến.
  - Phân tích chi tiết 2 bài toán lớn:
    1. *Đề Bài 1 (Phân loại với Iris / PlayTennis)*:
       - Mã hóa dữ liệu phân loại với `OrdinalEncoder` / `OneHotEncoder`.
       - Huấn luyện `DecisionTreeClassifier` với `criterion='entropy'` và `criterion='log_loss'` (chứng minh đồng nhất trong Scikit-learn >= 1.1).
       - So sánh với `criterion='gini'` (CART) về tốc độ $O(1)$ vs $O(\log C)$.
       - Trực quan hóa cây với `plot_tree` và giải thích tường tận 5 dòng thông tin của từng hộp quyết định (`feature <= threshold`, `criterion`, `samples`, `value`, `class`).
       - Đánh giá mô hình bằng 5-Fold Stratified Cross-Validation (`cross_val_score`) đạt độ chính xác ~95.33% - 96.00%.
    2. *Đề Bài 2 (Hồi quy với DecisionTreeRegressor & Xử lý Dữ liệu Thiếu)*:
       - Huấn luyện mô hình hồi quy với tiêu chí `squared_error` (giải mã cơ chế dự đoán bằng giá trị trung bình $\bar{y}$ tại nút lá để tối thiểu hóa phương sai).
       - Thử nghiệm độ sâu `max_depth` (2, 3, 5, 8, None) và đánh giá MAE/RMSE: làm rõ ranh giới Underfitting vs Overfitting (Sweet spot tại `max_depth=3` đạt MAE=43.27; thả nổi không giới hạn làm MAE vọt lên 61.25 do ghi nhớ nhiễu).
       - Giả lập dữ liệu thiếu bằng cách xóa ngẫu nhiên 10% giá trị đặc trưng BMI (`np.nan`).
       - So sánh `SimpleImputer(strategy='mean')` (MAE=43.89) và `KNNImputer(n_neighbors=5)` (MAE=43.41): KNN phục hồi tới 99.7% hiệu năng gốc nhờ bảo toàn tương quan đa biến.
- **Giá trị tra cứu**: Cẩm nang thực hành mẫu mực cho sinh viên và kỹ sư AI khi làm việc với thư viện Scikit-learn, nắm vững kỹ thuật tiền xử lý, tinh chỉnh siêu tham số và xử lý dữ liệu thực tế.

---

### 🧠 6. [Mạng Neuron Nhân Tạo: Bản Chất Cốt Lõi & Lời Giải Chi Tiết](./MangNeuron_BanChat_Va_LoiGiai.pdf)
- **Tập tin**: `docs/9.More/MangNeuron_BanChat_Va_LoiGiai.pdf` (Kèm bản gốc [HTML](./MangNeuron_BanChat_Va_LoiGiai.html))
- **Mục tiêu giải quyết**:
  - Biên soạn cẩm nang học thuật chuyên sâu chuẩn A4 6 trang hoàn chỉnh, tuân thủ 100% Zero-Emoji và Native CSS Math, không phát sinh lỗi Type3 font trên PDF.js.
  - Phân tích và giải trọn vẹn 5 câu hỏi trọng tâm về Mạng Nơ-ron và Tối ưu hóa:
    1. *Câu 1 (Nghiệm Đóng Hồi Quy Tuyến Tính OLS)*: Tính ma trận Gram $X^T X$, giải mã ý nghĩa các phần tử trên đường chéo chính (năng lượng đặc trưng) và ngoài đường chéo (tương quan cặp), định thức $\det(X^T X) = 1$, chứng minh điều kiện khả nghịch để nghiệm không sụp đổ, và tìm vector trọng số $w = [0, 2, 0]^T$.
    2. *Câu 2 (Hồi Quy Logistic & Cross-Entropy Loss)*: Tính xác suất dự đoán Sigmoid ($\hat{y}_1 \approx 0.3775, \hat{y}_2 = 0.5000$), tính mất mát Cross-Entropy ($L_1 = 0.9741, L_2 = 0.6931$), giải mã 3 lý do bản chất vì sao Cross-Entropy là chuẩn mực (Nguyên lý MLE, hình phạt bất đối xứng vô cực $-\ln$, và triệt tiêu hiện tượng bão hòa đạo hàm Sigmoid giúp gradient $\frac{\partial L}{\partial z} = \hat{y} - y$ luôn thông suốt).
    3. *Câu 3 (So Sánh Ridge $L_2$ vs LASSO $L_1$)*: Tính đạo hàm của $R(w)$ ($\nabla R_{\text{Ridge}} = w$, dưới đạo hàm $\text{subgrad}(R_{\text{LASSO}}) = \text{sign}(w)$), giải thích cơ chế tạo trọng số 0 (Sparsity) qua 2 góc nhìn: Hình học không gian ràng buộc KKT (vùng kim cương có đỉnh nhọn trên trục tọa độ) và Động lực học gradient (lực kéo không đổi $\lambda$); so sánh với $\lambda=0.1$ thì mức phạt LASSO ($0.0900$) cao gấp 5.14 lần Ridge ($0.0175$).
    4. *Câu 4 (Lan Truyền Thuận MLP & Hàm Kích Hoạt ReLU)*: Tính đầu ra lớp ẩn $z^{(1)} = [0.50, 0.25]^T \implies a^{(1)} = [0.50, 0.25]^T$, đầu ra cuối cùng của mạng $z^{(2)} = 0.325$; giải thích vai trò của ReLU trong việc ngăn chặn sự sụp đổ tuyến tính (Linear Collapse), uốn lượn không gian từng đoạn (Piecewise Linear), và duy trì gradient bằng 1 khi dương.
    5. *Câu 5 (Universal Approximation Theorem & Bài Toán XOR)*: Chứng minh toán học phản chứng (hệ bất đẳng thức mâu thuẫn $b \le 0$ và $2b > 0$) khẳng định XOR bất khả phân tách tuyến tính; thiết kế mạng MLP tối thiểu cấu trúc 2 - 2 - 1 với hàm ReLU ($W^{(1)}, b^{(1)}, W^{(2)}=[2, -6], b^{(2)}=0$), kiểm chứng bảng chân trị đúng 4/4 điểm; đúc kết ý nghĩa định lý Cybenko (1989) đưa AI thoát khỏi "Mùa đông AI".
- **Giá trị tra cứu**: Cẩm nang toàn diện làm cầu nối vững chắc từ toán học đại số/giải tích sang kiến trúc học sâu (Deep Learning).

---

### 🚀 7. [Mạng Neuron Nhân Tạo: Thuật Toán Huấn Luyện & Tối Ưu Hóa](./ThuatToanHuanLuyen_MangNeuron.pdf)
- **Tập tin**: `docs/9.More/ThuatToanHuanLuyen_MangNeuron.pdf` (Kèm bản gốc [HTML](./ThuatToanHuanLuyen_MangNeuron.html))
- **Mục tiêu giải quyết**:
  - Biên soạn cẩm nang học thuật chuyên sâu chuẩn A4 7 trang độc lập, tuân thủ 100% Zero-Emoji và Native CSS Math, không phát sinh lỗi Type3 font trên PDF.js.
  - Phân tích và giải trọn vẹn 6 câu hỏi cốt lõi về Thuật toán Huấn luyện Mạng Nơ-ron theo triết lý "Giải thích cho một đứa trẻ 5 tuổi cũng hiểu được" kết hợp toán học chuẩn xác:
    1. *Câu 1 (Gradient Descent with Momentum)*: Quán tính xe trượt tuyết lăn dốc; tính vận tốc $v_t = [0.59, -1.47]$, cập nhật $\theta_t = [0.9941, -0.9853]$; phân tích cơ chế triệt tiêu dao động zíc-zắc sườn đồi, gia tốc gấp 10 lần theo hướng nhất quán và trượt qua cực tiểu địa phương/yên ngựa.
    2. *Câu 2 (Hàm Mất Mát Huber Loss)*: Vị quan tòa khoan dung với tin đồn thất thiệt (outliers); tính Huber cho 3 điểm $e=[0.3, -1.5, 2.1]$ ra $[0.045, 1.000, 1.600]$, MSE trung bình $=2.25$; so sánh điểm $e_3=2.1$ (Huber $1.600$ vs MSE $4.410$, thấp hơn 2.76 lần); chứng minh đạo hàm hằng số $\pm\delta$ chặn đứng nguy cơ mô hình bị điểm nhiễu lật đổ (Robust to Outliers).
    3. *Câu 3 (Cập Nhật Adam Optimizer)*: Vận động viên leo núi thông thái; tính First Moment $m_1$ (quán tính hướng đi) và Second Moment $v_1$ (độ gồ ghề mặt đất), hiệu chỉnh độ lệch $\hat{m}_1 = [0.1, -0.4], \hat{v}_1 = [0.01, 0.16]$, cập nhật tham số $\theta_1 = [-0.001, +0.001]$; giải mã vai trò phao cứu sinh của $\epsilon=10^{-8}$ chống thảm họa chia cho 0 sinh ra lỗi `NaN`/`Inf`.
    4. *Câu 4 (Focal Loss & Hard Example Mining)*: Người thầy thông minh kèm học sinh yếu; tính $FL_1 = 0.000263$ (dìm mẫu dễ 400 lần) vs $FL_2 = 0.020433$; so sánh độ chênh lệch giữa mẫu khó và mẫu dễ vọt từ 4.85 lần (trong Cross-Entropy) lên **77.57 lần** (trong Focal Loss); giải mã cơ chế giải cứu bài toán mất cân bằng lớp cực đoan trong Object Detection (RetinaNet) mà không cần lấy mẫu OHEM tốn kém.
    5. *Câu 5 (Cosine Annealing Learning Rate Schedule)*: Máy bay hạ cánh mượt mà xuống đường băng; tính tốc độ học tại $t=0$ ($0.1000$), $t=50$ ($0.0505$), $t=100$ ($0.0010$); phác thảo đồ thị nửa chu kỳ Cosine mềm mại; phân tích 3 ưu thế vượt trội loại bỏ cú sốc gradient giật cục của Step Decay và hội tụ sâu vào cực tiểu phẳng (Flat Minima).
    6. *Câu 6 (Backpropagation Trong MLP)*: Dây chuyền dập lỗi ngược tự động; thực hiện Forward pass tính $\hat{y} = 0.325$, MSE Loss $= 0.2278$; thực hiện Backward pass tính đầy đủ 4 gradient tensor: $\frac{\partial L}{\partial W^{(2)}} = [-0.3375, -0.16875]$, $\frac{\partial L}{\partial b^{(2)}} = -0.675$, $\frac{\partial L}{\partial W^{(1)}} = \begin{bmatrix} -0.2700 & -0.1350 \\ +0.2025 & +0.10125 \end{bmatrix}$, $\frac{\partial L}{\partial b^{(1)}} = [-0.2700, +0.2025]^T$; cập nhật toàn bộ tham số mới với learning rate $\eta=0.1$.
- **Giá trị tra cứu**: Cẩm nang mẫu mực về thuật toán tối ưu hóa nơ-ron, hỗ trợ toàn diện cho học phần Deep Learning, Computer Vision và phỏng vấn kỹ sư AI.

---

### 📊 8. [Mô Hình Tuyến Tính: Bài Toán Hồi Quy (HCMUT Masterclass)](./MoHinhTuyenTinh_HoiQuy_HCMUT.pdf)
- **Tập tin**: `docs/9.More/MoHinhTuyenTinh_HoiQuy_HCMUT.pdf` (Kèm bản gốc [HTML](./MoHinhTuyenTinh_HoiQuy_HCMUT.html))
- **Mục tiêu giải quyết**:
  - Chuyển hóa toàn diện 43 trang slide bài giảng "Linear Models - Regression Problems" (Đại học Bách Khoa TP.HCM - HCMUT) thành cẩm nang học thuật PDF 8 trang A4 độc lập chuẩn in ấn, khóa cứng 100% Zero-Emoji và Native CSS Math, không phát sinh lỗi Type3 font trên PDF.js (`Contains /Type3 font: False`).
  - Tích hợp 6 hình vẽ vector SVG hình học trực quan sắc nét:
    1. *Hình học Tiếng ồn Gaussian*: Hàm thực tế $h(x)$ và phân phối chuông Gaussian $\epsilon \sim \mathcal{N}(0, \sigma^2)$ giải thích nguồn gốc nhiễu ngẫu nhiên.
    2. *Hình chiếu Trực giao*: Minh họa không gian cột $\text{Span}(X)$ trong $\mathbb{R}^N$ và vector sai số $e = t - Xw$ trực giao với mọi cột của $X$, suy ra phương trình chuẩn tắc Normal Equation.
    3. *Mặt cong Paraboloid lồi*: Lòng chảo lồi của hàm mất mát và các bước nhảy Gradient Descent $\eta$ hội tụ về đáy $w^*$.
    4. *Ánh xạ Không gian Phi tuyến*: Uốn cong trục tọa độ 1D thành không gian đặc trưng $\mathbb{R}^M$ đa chiều qua hàm cơ sở (Polynomial, Gaussian RBF, Sigmoid).
    5. *Phổ 3 Trạng thái Khớp (Overfitting Spectrum)*: So sánh trực quan mô hình Bậc 0 (Underfit) vs Bậc 3 (Good Fit) vs Bậc 9 (Overfit uốn lượn dữ dội qua mọi điểm nhiễu).
    6. *Hình học KKT Ràng buộc Trọng số*: So sánh hình tròn tiếp xúc trơn (Ridge $L_2$) vs hình thoi tiếp xúc tại đỉnh nhọn nằm ngay trên trục tọa độ sinh ra nghiệm thưa Sparse (LASSO $L_1$).
  - Phân tích bóc trần bảng số liệu Slide 35 về hiện tượng bùng nổ trọng số $w$ lên hàng triệu khi bậc đa thức tăng từ $M=1$ lên $M=9$, cùng nguyên lý cứu nguy của siêu tham số $\lambda$.
  - Mở rộng sang Hồi quy Đa mục tiêu (Multi-target Regression) $W = (X^TX)^{-1}X^TT$ và Bảng Master Cheat-Sheet ôn thi và phỏng vấn toàn diện.
- **Giá trị tra cứu**: Tài liệu chuẩn mực cấp trường đại học giải mã cặn kẽ từ trực giác đời thực, dẫn xuất vi tích phân ma trận đến hình học đại số tuyến tính của mô hình hồi quy.

---

## 💡 3. NGUYÊN TẮC QUẢN LÝ THƯ MỤC NÀY

1. Mọi file `.md` phát sinh ở thư mục gốc (ngoại trừ `README.md` và `AGENTS.md`) sẽ tự động được skill `9-more-archiver` di chuyển vào đây.
2. File `README.md` này sẽ được tự động cập nhật thêm dòng vào bảng danh mục và phần tóm tắt chi tiết mỗi khi có tài liệu mới được lưu trữ.

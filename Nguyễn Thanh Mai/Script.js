// RẤT QUAN TRỌNG: Thay thế bằng URL Web App bạn đã có được ở Bước 2
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyJdy3KgthGz8B6mZ4ycUI3-4jzLGqm00wmea4M-D2lQC4EMiFjOmcRq5KwjI8PyXSY/exec'; // Ví dụ: 'https://script.google.com/macros/s/AKfycbyJdy3KgthGz8B6mZ4ycUI3-4jzLGqm00wmea4M-D2lQC4EMiFjOmcRq5KwjI8PyXSY/exec';

// Hỏi tên giám khảo khi tải trang và lưu vào localStorage
let judgeName = localStorage.getItem('judgeName');
if (!judgeName) {
    judgeName = prompt("Vui lòng nhập tên của bạn (Giám khảo):");
    if (judgeName) {
        localStorage.setItem('judgeName', judgeName);
    } else {
        judgeName = "Giám khảo Khách"; // Mặc định nếu người dùng không nhập
    }
}
// Hiển thị tên giám khảo trên trang
document.getElementById('judgeNameDisplay').textContent = `Chào mừng Giám khảo ${judgeName}`;

// Lấy tất cả các thẻ input điểm trong các thẻ ứng cử viên
const scoreInputs = document.querySelectorAll('.candidate-card input[type="number"]');

/**
 * Hàm tính tổng điểm cho một ứng cử viên dựa trên các input trong thẻ của họ.
 * @param {HTMLElement} cardElement Thẻ div của ứng cử viên.
 * @returns {string} Tổng điểm đã làm tròn đến 2 chữ số thập phân.
 */
function calculateTotalScore(cardElement) {
    let total = 0;
    // Lấy tất cả input có thuộc tính data-weight trong thẻ ứng cử viên đó
    const inputsInCard = cardElement.querySelectorAll('input[type="number"][data-weight]');
    inputsInCard.forEach(input => {
        const score = parseFloat(input.value); // Lấy giá trị điểm
        const weight = parseFloat(input.dataset.weight); // Lấy trọng số từ data-weight
        if (!isNaN(score) && !isNaN(weight)) { // Đảm bảo là số hợp lệ
            total += score * weight;
        }
    });
    return total.toFixed(2); // Làm tròn 2 chữ số thập phân
}

// Gán sự kiện 'input' cho mỗi ô điểm để cập nhật tổng điểm tức thì khi người dùng nhập
scoreInputs.forEach(input => {
    input.addEventListener('input', () => {
        const card = input.closest('.candidate-card'); // Tìm thẻ cha .candidate-card
        // Cập nhật nội dung của thẻ span chứa tổng điểm trong thẻ ứng cử viên đó
        card.querySelector('.total-score span').textContent = calculateTotalScore(card);
    });
});

// Xử lý sự kiện khi gửi form
document.getElementById('scoringForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Ngăn chặn form gửi đi theo cách truyền thống (tải lại trang)

    const submitButton = this.querySelector('.submit-button');
    submitButton.textContent = 'Đang gửi...'; // Thay đổi text nút
    submitButton.disabled = true; // Vô hiệu hóa nút để tránh gửi nhiều lần

    const candidateCards = document.querySelectorAll('.candidate-card');
    const scoresToSend = []; // Mảng để lưu trữ dữ liệu điểm của tất cả ứng cử viên

    // Lặp qua từng thẻ ứng cử viên để lấy dữ liệu
    candidateCards.forEach(card => {
        const candidateName = card.dataset.candidateName; // Lấy tên ứng cử viên từ data-candidate-name
        // Lấy giá trị từ các input điểm bằng data-weight
        const efficiency = card.querySelector('input[data-weight="0.5"]').value;
        const creativity = card.querySelector('input[data-weight="0.3"]').value;
        const compliance = card.querySelector('input[data-weight="0.2"]').value;

        scoresToSend.push({
            judgeName: judgeName, // Tên giám khảo đã nhập ở đầu trang
            candidateName: candidateName,
            efficiency: efficiency,
            creativity: creativity,
            compliance: compliance
        });
    });

    let allSuccess = true;
    // Gửi dữ liệu của từng ứng cử viên đến Apps Script
    // (Apps Script đã được thiết kế để nhận từng bản ghi một)
    for (const scoreData of scoresToSend) {
        try {
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors', // Rất quan trọng khi gửi đến Apps Script Web App để tránh lỗi CORS
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scoreData), // Chuyển dữ liệu thành chuỗi JSON
            });
            // Với mode: 'no-cors', bạn không thể đọc response.json() trực tiếp
            // Bạn phải kiểm tra log trong Apps Script để xác nhận dữ liệu đã được ghi.
        } catch (error) {
            console.error('Lỗi khi gửi điểm cho ' + scoreData.candidateName + ':', error);
            allSuccess = false;
            // Hiển thị thông báo lỗi cho người dùng
            alert(`Lỗi khi gửi điểm cho ${scoreData.candidateName}. Vui lòng kiểm tra console.`);
            break; // Ngừng vòng lặp nếu có lỗi
        }
    }

    if (allSuccess) {
        alert('Tất cả điểm đã được gửi thành công!');
    }

    // Khôi phục trạng thái nút gửi
    submitButton.textContent = 'Gửi Tất Cả Điểm';
    submitButton.disabled = false;
});

// Khởi tạo tổng điểm ban đầu cho tất cả ứng cử viên khi trang được tải
document.querySelectorAll('.candidate-card').forEach(card => {
    card.querySelector('.total-score span').textContent = calculateTotalScore(card);
});

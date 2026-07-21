export const dropdownConfig = {
    "Trong giờ học": {
        "Đánh giá ngữ pháp": ["", "Xuất sắc 9-10", "Khá 7-8", "Trung bình 5-6", "Dưới 5", "Mất gốc (1-2)"],
        "Đánh giá khả năng nói": ["", "A", "B", "C", "D"],
        "Đánh giá khả năng nghe": ["", "A", "B", "C", "D"],
        "Ý thức giờ học": ["", "Ngoan", "Thỉnh thoảng nói chuyện", "Nghịch nhưng cô nhắc vẫn nghe", "Tăng động"],
        "Tâm lý học sinh": ["", "Thoải mái, vui vẻ", "Chán học muốn nghỉ", "Không chơi với ai", "Rụt rè ít nói"]
    },
    "Ý thức ôn bài ở nhà": {
        "Thuộc từ mới": ["", "Tốt", "Khá", "Trung bình", "Yếu"],
        "Ý thức làm BTVN": ["", "Làm và ôn bài đầy đủ", "Có buổi làm, có buổi thiếu", "Thường xuyên không làm", "Không bao giờ làm"],
        "Thuộc ngữ pháp": ["", "Thuộc và biết cách áp dụng công thức", "Hiểu nhưng vẫn còn chưa vững...", "Gặp khó khăn...", "Không hiểu..."]
    },
    "Nhóm Đánh Giá Chung": {
        "So với tháng trước": ["", "Tiến bộ nhanh", "Tiến bộ chậm", "Như cũ", "Kém đi", "Báo động"],
        "Đề xuất của giáo viên": ["", "Can học vượt lớp", "Giữ nguyên", "GV Không thể dạy được", "Hà Vi không nên nhận dạy HS"]
    }
};

export function displayPhone(p) {  
    if(!p || p === 'Chưa có' || p === 'undefined') return 'Chưa có';
    let c = p.toString().replace(/\s+/g, '');  
    if(c.length === 10) return c.substring(0,4) + ' ' + c.substring(4,7) + ' ' + c.substring(7);
    return p;  
}

export function getGroupKeyBySheet(sheetName) {
    const s = sheetName.trim();
    if (["2", "3", "4", "5"].includes(s)) return { key: "TIEU_HOC", name: "Khối Tiểu Học (Lớp 2-5)" };
    if (["6", "7", "8", "9"].includes(s)) return { key: "THCS", name: "Khối THCS (Lớp 6-9)" };
    if (["10", "11", "12"].includes(s)) return { key: "THPT", name: "Khối THPT (Lớp 10-12)" };
    if (["DH25", "DH26"].includes(s)) return { key: "DAI_HOC", name: "Khối Đại Học (DH25-26)" };
    return { key: "KHAC", name: "Khối Khác / Sinh Viên" };
}

import { bigClassesDatabase, saveDatabaseStateLocally, saveToFirebase } from "./storage.js";

const dropdownConfig = {
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

function displayPhone(p) { 
    if(!p || p === 'Chưa có' || p === 'undefined') return 'Chưa có';
    let c = p.toString().replace(/\s+/g, ''); 
    if(c.length === 10) return c.substring(0,4) + ' ' + c.substring(4,7) + ' ' + c.substring(7);
    return p; 
}

export function showToast(message) {
    let toast = document.createElement("div");
    toast.className = "toast-msg";
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

export function showNotificationModal(title, message) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalBody').innerText = message;
    document.getElementById('customNotificationModal').classList.add('show');
}

window.closeNotificationModal = function() {
    document.getElementById('customNotificationModal').classList.remove('show');
}

export function openLoginModal() {
    document.getElementById('loginModalOverlay').classList.add('show');
}

export function closeLoginModal() {
    document.getElementById('loginModalOverlay').classList.remove('show');
}

window.toggleClassAccordion = function(headerElement) {
    headerElement.parentElement.classList.toggle('active');
}

window.toggleGroupAccordion = function(headerElement) {
    headerElement.parentElement.classList.toggle('active');
}

function getGroupKeyBySheet(sheetName) {
    const s = sheetName.trim();
    if (["2", "3", "4", "5"].includes(s)) return { key: "TIEU_HOC", name: "Khối Tiểu Học (Lớp 2-5)" };
    if (["6", "7", "8", "9"].includes(s)) return { key: "THCS", name: "Khối THCS (Lớp 6-9)" };
    if (["10", "11", "12"].includes(s)) return { key: "THPT", name: "Khối THPT (Lớp 10-12)" };
    if (["DH25", "DH26"].includes(s)) return { key: "DAI_HOC", name: "Khối Đại Học (DH25-26)" };
    return { key: "KHAC", name: "Khối Khác / Sinh Viên" };
}

export function renderFullSystemUI() {
    const mainContainer = document.getElementById("dynamicMainContainer");
    mainContainer.innerHTML = "";

    const classKeys = Object.keys(bigClassesDatabase);
    if (classKeys.length === 0) {
        mainContainer.innerHTML = '<div class="empty-alert">Danh sách trống. Hệ thống sẽ tự động vẽ giao diện HTML sau khi bạn nạp file Excel thành công!</div>';
        return;
    }

    classKeys.sort((a, b) => {
        const order = ["SV","2","3","4","5","6","7","8","9","10","11","12","DH25","DH26"];
        const sa = bigClassesDatabase[a].sheet;
        const sb = bigClassesDatabase[b].sheet;
        const ia = order.indexOf(sa);
        const ib = order.indexOf(sb);
        if (ia !== ib) return ia - ib;
        return a.localeCompare(b, "vi");
    });

    const groupedData = {
        "TIEU_HOC": { name: "Khối Tiểu Học (Lớp 2-5)", classes: [], totalStudents: 0 },
        "THCS": { name: "Khối THCS (Lớp 6-9)", classes: [], totalStudents: 0 },
        "THPT": { name: "Khối THPT (Lớp 10-12)", classes: [], totalStudents: 0 },
        "DAI_HOC": { name: "Khối Đại Học", classes: [], totalStudents: 0 },
        "KHAC": { name: "Khối Khác / Khối SV", classes: [], totalStudents: 0 }
    };

    classKeys.forEach(classKey => {
        const classObj = bigClassesDatabase[classKey];
        const groupInfo = getGroupKeyBySheet(classObj.sheet);
        groupedData[groupInfo.key].classes.push({ key: classKey, data: classObj });
        groupedData[groupInfo.key].totalStudents += classObj.students.length;
    });

    const groupOrder = ["TIEU_HOC", "THCS", "THPT", "DAI_HOC", "KHAC"];
    groupOrder.forEach(gKey => {
        const group = groupedData[gKey];
        if (group.classes.length === 0) return;

        const groupSection = document.createElement("div");
        groupSection.className = "group-block-wrapper";
        groupSection.id = `group-wrapper-${gKey}`;
        
        groupSection.innerHTML = `
            <div class="group-accordion-header" onclick="toggleGroupAccordion(this)">
                <div class="group-main-title">${group.name}</div>
                <div class="group-stats" id="group-stats-${gKey}">Tổng số lớp: ${group.classes.length} | Học sinh: ${group.totalStudents}</div>
            </div>
            <div class="group-panel" id="group-panel-${gKey}"></div>
        `;
        mainContainer.appendChild(groupSection);

        const groupPanel = groupSection.querySelector(".group-panel");

        group.classes.forEach(cls => {
            const classKey = cls.key;
            const classObj = cls.data;
            const students = classObj.students;
            
            const total = students.length;
            const absent = students.filter(s => s.status === 'absent').length;
            const present = total - absent;

            const addStudentBoxHtml = window.isLoggedIn ? `
                <div class="add-student-box">
                    <input type="text" id="inputName-${classKey.replace(/\s+/g, '-')}" placeholder="Dòng 1: Nhập họ và tên...">
                    <input type="tel" id="inputPhone-${classKey.replace(/\s+/g, '-')}" placeholder="Dòng 2: Nhập số điện thoại...">
                    <button class="btn-add" onclick="window.addNewStudentToClass('${classKey}')">+ Thêm vào danh sách</button>
                </div>` : '';

            const classSection = document.createElement("div");
            classSection.className = "class-block-wrapper";
            classSection.setAttribute("data-classname-box", classKey);

            classSection.innerHTML = `
                <div class="class-accordion-header" onclick="toggleClassAccordion(this)">
                    <div class="class-main-title">Lớp: ${classKey}</div>
                    <div class="class-schedule">${classObj.schedule || ""}</div>
                    <div class="class-stats" id="stats-${classKey.replace(/\s+/g, '-')}">Sĩ số: ${total} | Có mặt: ${present} | Vắng: ${absent}</div>
                </div>
                
                <div class="class-panel">
                    <h3>Danh Sách Chi Tiết</h3>
                    <br>
                    ${addStudentBoxHtml}
                    
                    <div class="absent-section">
                        <div class="absent-header">
                            <span class="absent-title">DANH SÁCH VẮNG HÔM NAY</span>
                            <button class="copy-btn" onclick="window.copyAbsentReport('${classKey}')">Copy</button>
                        </div>
                        <ul class="absent-list" id="absentList-${classKey.replace(/\s+/g, '-')}">
                            ${renderAbsentRowsHtml(students)}
                        </ul>
                    </div>
                    
                    <div class="student-list" id="studentList-${classKey.replace(/\s+/g, '-')}">
                        ${renderStudentCardsHtml(classKey, students)}
                    </div>
                </div>
            `;
            groupPanel.appendChild(classSection);
        });
    });
}

function renderAbsentRowsHtml(students) {
    const absentStudents = students.filter(s => s.status === 'absent');
    if (absentStudents.length === 0) return '<li><em>Chưa có học sinh vắng</em></li>';
    return absentStudents.map(s => `<li>• ${s.name} ${s.note ? '(' + s.note + ')' : '(Chưa rõ lý do)'}</li>`).join('');
}

function renderStudentCardsHtml(classKey, students) {
    const disabledAttr = window.isLoggedIn ? '' : 'disabled';
    const readonlyAttr = window.isLoggedIn ? '' : 'readonly';

    return students.map((student, idx) => {
        const cardId = `card-${classKey.replace(/\s+/g, '-')}-${student.id}`;

        let dynamicCriteriaHtml = '';
        for (const [groupName, criteria] of Object.entries(dropdownConfig)) {
            dynamicCriteriaHtml += `
                <div style="margin-top: 8px; border-top: 1px dashed rgba(0, 240, 255, 0.15); padding-top: 6px;">
                    <strong style="color: #ffd700; font-size: 0.75rem; text-transform: uppercase;">${groupName}</strong>
                    <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
            `;
            
            for (const [criterion, options] of Object.entries(criteria)) {
                const savedValue = student[criterion] || '';
                dynamicCriteriaHtml += `
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                        <span style="font-size: 0.75rem; color: #bbb; flex: 1; text-align: left;">${criterion}:</span>
                        <select class="note-select" style="flex: 1.3; padding: 3px; font-size: 0.75rem;" ${disabledAttr}
                                onchange="window.updateStudentEvaluation('${classKey}', ${student.id}, '${criterion.replace(/'/g, "\\'")}', this.value)">
                            ${options.map(opt => `<option value="${opt}" ${savedValue === opt ? 'selected' : ''}>${opt || '--'}</option>`).join('')}
                        </select>
                    </div>`;
            }
            dynamicCriteriaHtml += `</div></div>`;
        }

        const statusClass = student.status === 'absent' ? 'status-absent' : 'status-present';
        const deleteButtonHtml = window.isLoggedIn ? `<button class="btn-delete" onclick="window.deleteStudentFromClass('${classKey}', ${student.id}, '${student.name.replace(/'/g, "\\'")}')">Xoá</button>` : '';

        return `
            <div class="student-card ${statusClass}" id="${cardId}">
                <div class="student-info-row">
                    <div class="student-meta">
                        <span class="student-name">${idx + 1}. ${student.name}</span>
                        <span class="student-phone" style="display: none;">SĐT: ${displayPhone(student.phone)}</span>
                    </div>
                    <div class="student-actions-right">
                        <button class="btn-call" onclick="window.location.href='tel:${student.phone}'">Gọi</button>
                        ${deleteButtonHtml}
                    </div>
                </div>
                
                <div class="student-controls-row">
                    <button class="btn-action btn-present ${student.status === 'present' ? 'active' : ''}" ${disabledAttr} onclick="window.updateStudentStatus('${classKey}', ${student.id}, 'present')">CÓ MẶT</button>
                    <button class="btn-action btn-absent ${student.status === 'absent' ? 'active' : ''}" ${disabledAttr} onclick="window.updateStudentStatus('${classKey}', ${student.id}, 'absent')">VẮNG</button>
                    <input type="text" class="note-select" style="flex: 1.5; padding: 8px 5px;" placeholder="Ghi chú vắng..." value="${student.note || ''}" ${readonlyAttr} onchange="window.updateStudentNote('${classKey}', ${student.id}, this.value)">
                </div>

                ${dynamicCriteriaHtml}
            </div>
        `;
    }).join('');
}

// Gắn các hàm tương tác học viên vào phạm vi window để HTML gọi trực tiếp được
window.updateStudentStatus = function(classKey, studentId, status) {
    if (!window.isLoggedIn) { alert("Vui lòng đăng nhập để thay đổi trạng thái!"); return; }
    let student = bigClassesDatabase[classKey].students.find(s => s.id === studentId);
    if (student) {
        student.status = status;
        saveDatabaseStateLocally();
        saveToFirebase();
        showToast("Đã chuyển sang: " + (status === 'present' ? 'Có mặt' : 'Vắng'));
        
        const classKeyId = classKey.replace(/\s+/g, '-');
        const studentsArr = bigClassesDatabase[classKey].students;
        const total = studentsArr.length;
        const absent = studentsArr.filter(s => s.status === 'absent').length;
        const present = total - absent;
        
        document.getElementById(`stats-${classKeyId}`).innerText = 'Sĩ số: ' + total + ' | Có mặt: ' + present + ' | Vắng: ' + absent;
        document.getElementById(`absentList-${classKeyId}`).innerHTML = renderAbsentRowsHtml(studentsArr);
        document.getElementById(`studentList-${classKeyId}`).innerHTML = renderStudentCardsHtml(classKey, studentsArr);
    }
}

window.updateStudentNote = function(classKey, studentId, value) {
    if (!window.isLoggedIn) return;
    let student = bigClassesDatabase[classKey].students.find(s => s.id === studentId);
    if (student) {
        student.note = value;
        saveDatabaseStateLocally();
        saveToFirebase();
        showToast("Đã lưu ghi chú!");
        const classKeyId = classKey.replace(/\s+/g, '-');
        document.getElementById(`absentList-${classKeyId}`).innerHTML = renderAbsentRowsHtml(bigClassesDatabase[classKey].students);
    }
}

window.updateStudentEvaluation = function(classKey, studentId, criterionName, value) {
    if (!window.isLoggedIn) { alert("Vui lòng đăng nhập để đánh giá!"); return; }
    let student = bigClassesDatabase[classKey].students.find(s => s.id === studentId);
    if (student) {
        student[criterionName] = value;
        saveDatabaseStateLocally();
        saveToFirebase();
        showToast("Đã cập nhật: " + criterionName);
    }
}

window.addNewStudentToClass = function(classKey) {
    if (!window.isLoggedIn) return;
    const classKeyId = classKey.replace(/\s+/g, '-');
    const nameInput = document.getElementById(`inputName-${classKeyId}`);
    const phoneInput = document.getElementById(`inputPhone-${classKeyId}`);
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name) { alert("Vui lòng điền họ tên học sinh!"); return; }

    const studentsArr = bigClassesDatabase[classKey].students;
    const nextId = studentsArr.length > 0 ? Math.max(...studentsArr.map(s => s.id)) + 1 : 1;

    studentsArr.push({
        id: nextId,
        name: name,
        phone: phone || "Chưa có",
        status: "present",
        note: ""
    });

    nameInput.value = "";
    phoneInput.value = "";
    saveDatabaseStateLocally();
    saveToFirebase();

    const total = studentsArr.length;
    const absent = studentsArr.filter(s => s.status === 'absent').length;
    const present = total - absent;
    document.getElementById(`stats-${classKeyId}`).innerText = 'Sĩ số: ' + total + ' | Có mặt: ' + present + ' | Vắng: ' + absent;
    document.getElementById(`studentList-${classKeyId}`).innerHTML = renderStudentCardsHtml(classKey, studentsArr);
    showToast("Đã thêm học sinh mới!");
}

window.deleteStudentFromClass = function(classKey, studentId, studentName) {
    if (!window.isLoggedIn) { alert("Vui lòng đăng nhập để xóa!"); return; }
    if (confirm(`Bạn chắc chắn muốn xoá học viên "${studentName}" không?`)) {
        bigClassesDatabase[classKey].students = bigClassesDatabase[classKey].students.filter(s => s.id !== studentId);
        saveDatabaseStateLocally();
        saveToFirebase();

        const classKeyId = classKey.replace(/\s+/g, '-');
        const studentsArr = bigClassesDatabase[classKey].students;
        const total = studentsArr.length;
        const absent = studentsArr.filter(s => s.status === 'absent').length;
        const present = total - absent;

        document.getElementById(`stats-${classKeyId}`).innerText = 'Sĩ số: ' + total + ' | Có mặt: ' + present + ' | Vắng: ' + absent;
        document.getElementById(`absentList-${classKeyId}`).innerHTML = renderAbsentRowsHtml(studentsArr);
        document.getElementById(`studentList-${classKeyId}`).innerHTML = renderStudentCardsHtml(classKey, studentsArr);
        showToast("Đã xóa học viên!");
    }
}

window.copyAbsentReport = function(classKey) {
    const students = bigClassesDatabase[classKey].students;
    const absentArr = students.filter(s => s.status === 'absent');
    let msg = `DANH SÁCH VẮNG LỚP ${classKey}:\n`;
    if(absentArr.length === 0) {
        msg += "- Hôm nay không có ai vắng.";
    } else {
        absentArr.forEach((s, idx) => {
            msg += `${idx+1}. ${s.name} ${s.note ? '('+s.note+')' : '(Chưa rõ lý do)'}\n`;
        });
    }
    navigator.clipboard.writeText(msg).then(() => {
        showToast("Đã sao chép báo cáo vắng!");
    });
}

window.handleSearchKeyPress = function(event) {
    if (event.key === "Enter") window.searchGlobalStudent();
}

window.searchGlobalStudent = function() {
    const query = document.getElementById("globalSearchInput").value.trim().toLowerCase();
    const resultBox = document.getElementById("searchResultBox");
    const tableBody = document.getElementById("resultTableBody");
    const countSpan = document.getElementById("resultCount");

    if (!query) { resultBox.style.display = "none"; return; }

    tableBody.innerHTML = "";
    let count = 0;

    Object.keys(bigClassesDatabase).forEach(classKey => {
        bigClassesDatabase[classKey].students.forEach(s => {
            if (s.name.toLowerCase().includes(query) || s.phone.toString().includes(query)) {
                count++;
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td style="font-weight:bold; color:#fff;">${s.name}</td>
                    <td>${displayPhone(s.phone)}</td>
                    <td><span style="color:#00f0ff; font-weight:bold; cursor:pointer; text-decoration:underline;" onclick="window.focusToCard('${classKey}', ${s.id})">${classKey}</span></td>
                    <td><button class="btn-call" onclick="window.location.href='tel:${s.phone}'">Gọi</button></td>
                `;
                tableBody.appendChild(tr);
            }
        });
    });

    countSpan.innerText = `(${count} kết quả)`;
    resultBox.style.display = "block";
}

window.focusToCard = function(classKey, studentId) {
    const clsObj = bigClassesDatabase[classKey];
    if (!clsObj) return;
    const groupInfo = getGroupKeyBySheet(clsObj.sheet);

    const groupWrapper = document.getElementById(`group-wrapper-${groupInfo.key}`);
    if (groupWrapper && !groupWrapper.classList.contains('active')) groupWrapper.classList.add('active');

    const subClasses = document.querySelectorAll(`[data-classname-box="${classKey}"]`);
    subClasses.forEach(box => { if (!box.classList.contains('active')) box.classList.add('active'); });

    setTimeout(() => {
        const cardId = `card-${classKey.replace(/\s+/g, '-')}-${studentId}`;
        const card = document.getElementById(cardId);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('highlight-search');
            setTimeout(() => card.classList.remove('highlight-search'), 2500);
        }
    }, 150);
}

window.clearSystemCache = function() {
    if (!window.isLoggedIn) { alert("Bạn cần đăng nhập để thực hiện tính năng này!"); return; }
    if (confirm("Bạn có chắc chắn muốn xóa dữ liệu cũ không?")) {
        localStorage.clear();
        setBigClassesDatabase({});
        document.getElementById('fileStatusMessage').style.color = "#ff007f";
        document.getElementById('fileStatusMessage').innerText = "Chưa có dữ liệu học viên. Vui lòng chọn tệp Excel.";
        document.getElementById('searchResultBox').style.display = 'none';
        renderFullSystemUI();
        showToast("Đã xóa dữ liệu hệ thống!");
    }
}

window.togglePasswordVisibility = function() {
    const passwordInput = document.getElementById("loginPassword");
    
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
}

window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;

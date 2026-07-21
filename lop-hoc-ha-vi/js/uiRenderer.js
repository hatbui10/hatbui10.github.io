import { bigClassesDatabase, saveDatabaseStateLocally, saveToFirebase } from "./storage.js";
import { dropdownConfig, displayPhone, getGroupKeyBySheet } from "./uiConfig.js";

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

export function renderFullSystemUI() {
    const mainContainer = document.getElementById("dynamicMainContainer");
    if (!mainContainer) return;
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
        if (groupedData[groupInfo.key]) {
            groupedData[groupInfo.key].classes.push({ key: classKey, data: classObj });
            groupedData[groupInfo.key].totalStudents += classObj.students.length;
        }
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

export function renderAbsentRowsHtml(students) {
    const absentStudents = students.filter(s => s.status === 'absent');
    if (absentStudents.length === 0) return '<li><em>Chưa có học sinh vắng</em></li>';
    return absentStudents.map(s => `<li>• ${s.name} ${s.note ? '(' + s.note + ')' : '(Chưa rõ lý do)'}</li>`).join('');
}

export function renderStudentCardsHtml(classKey, students) {
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

// Đăng ký window cho các hàm gọi onclick trong HTML
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;

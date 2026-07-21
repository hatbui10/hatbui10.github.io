
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDbCF0pFsdXqD14Y-wjWLFoNCGfP1LBlD8",
  authDomain: "tienganhhavi-12b54.firebaseapp.com",
  projectId: "tienganhhavi-12b54",
  storageBucket: "tienganhhavi-12b54.firebasestorage.app",
  messagingSenderId: "208059039650",
  appId: "1:208059039650:web:d272318418e01d0f50fcfb",
  measurementId: "G-XPHJWRWSLZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

window.isLoggedIn = false;

onAuthStateChanged(auth, (user) => {
    const authStatusText = document.getElementById("authStatusText");
    const authActionButton = document.getElementById("authActionButton");
    const adminUploadCard = document.getElementById("adminUploadCard");

    if (user) {
        window.isLoggedIn = true;
        authStatusText.innerHTML = `🟢 Đã đăng nhập: <strong style="color:#00ff66;">${user.email}</strong>`;
        authActionButton.innerText = "Đăng Xuất";
        authActionButton.className = "auth-btn-danger";
        authActionButton.setAttribute("onclick", "processLogout()");
        adminUploadCard.style.display = "block";
    } else {
        window.isLoggedIn = false;
        authStatusText.innerHTML = `🔒 Chế độ Chỉ xem (Khách)`;
        authActionButton.innerText = "Đăng nhập GV";
        authActionButton.className = "auth-btn";
        authActionButton.setAttribute("onclick", "openLoginModal()");
        adminUploadCard.style.display = "none";
    }
    if (Object.keys(bigClassesDatabase).length > 0) {
        renderFullSystemUI();
    }
});

window.processLogin = async function() {
    const email = document.getElementById("loginEmail").value.trim();
    const pass = document.getElementById("loginPassword").value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        closeLoginModal();
        showToast("Đăng nhập thành công!");
    } catch (error) {
        alert("Đăng nhập thất bại: " + error.message);
    }
}

window.processLogout = async function() {
    try {
        await signOut(auth);
        showToast("Đã đăng xuất tài khoản!");
    } catch (error) {
        console.error(error);
    }
}

window.saveToFirebase = async function () { 
    if (!window.isLoggedIn) return; 
    try { 
        await setDoc(doc(db, "system", "database"), { 
            database: bigClassesDatabase, 
            filename: localStorage.getItem("big_classes_filename") || "", 
            updatedAt: new Date().toISOString() 
        }); 
    } catch (err) { console.error("Lỗi lưu Firebase:", err); } 
}

window.loadFromFirebase = async function () { 
    try { 
        const docRef = doc(db, "system", "database"); 
        const docSnap = await getDoc(docRef); 
        if (docSnap.exists()) { 
            const data = docSnap.data(); 
            bigClassesDatabase = data.database || {}; 
            localStorage.setItem("big_classes_database", JSON.stringify(bigClassesDatabase)); 
            if (data.filename) { localStorage.setItem("big_classes_filename", data.filename); } 
            renderFullSystemUI(); 
        } 
    } catch (err) { console.error("Lỗi đọc Firebase:", err); } 
}

const targetSheets = ["SV", "12", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2", "DH25", "DH26"];
let bigClassesDatabase = {};

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
        "Đề xuất của giáo viên": ["", "Có thể học vượt lớp", "Giữ nguyên", "GV Không thể dạy được", "Hà Vi không nên nhận dạy HS"]
    }
};

function displayPhone(p) { 
    if(!p || p === 'Chưa có' || p === 'undefined') return 'Chưa có';
    let c = p.toString().replace(/\s+/g, ''); 
    if(c.length === 10) return c.substring(0,4) + ' ' + c.substring(4,7) + ' ' + c.substring(7);
    return p; 
}

window.onload = async function () {
    if (window.loadFromFirebase) {
        try { await window.loadFromFirebase(); return; } catch (e) { console.log(e); }
    }
    const cachedData = localStorage.getItem("big_classes_database");
    if (cachedData) {
        bigClassesDatabase = JSON.parse(cachedData);
        renderFullSystemUI();
    }
}

async function saveDatabaseState() {
    if (!window.isLoggedIn) return;
    localStorage.setItem('big_classes_database', JSON.stringify(bigClassesDatabase));
    if (window.saveToFirebase) {
        try { await window.saveToFirebase(); } catch(e) {}
    }
}

function showToast(message) {
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

function showNotificationModal(title, message) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalBody').innerText = message;
    document.getElementById('customNotificationModal').classList.add('show');
}
window.closeNotificationModal = function() {
    document.getElementById('customNotificationModal').classList.remove('show');
}

window.openLoginModal = function() {
    document.getElementById('loginModalOverlay').classList.add('show');
}
window.closeLoginModal = function() {
    document.getElementById('loginModalOverlay').classList.remove('show');
}

window.startProcessingExcel = function(input) {
    if (!window.isLoggedIn) {
        alert("Bạn cần đăng nhập tài khoản giáo viên để thực hiện tính năng này!");
        return;
    }
    const file = input.files[0];
    if (!file) return;

    document.getElementById('fileStatusMessage').style.color = "#ffd700";
    document.getElementById('fileStatusMessage').innerText = `Đang xử lý phân tách lớp từ tệp: ${file.name}...`;
    document.getElementById('searchResultBox').style.display = 'none';
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressBar.innerText = '0%';

    let oldDatabase = JSON.parse(JSON.stringify(bigClassesDatabase));
    let updatedDatabase = {};

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellStyles: true });
            
            const sheetsToProcess = workbook.SheetNames.filter(name => targetSheets.includes(name.trim()));
            if (sheetsToProcess.length === 0) {
                alert("Không tìm thấy các sheet mục tiêu trong file Excel!");
                progressContainer.style.display = 'none';
                return;
            }

            let totalSheets = sheetsToProcess.length;
            let currentSheetIdx = 0;

            async function parseSheetStep() {
                if (currentSheetIdx >= totalSheets) {
                    progressBar.style.width = '100%';
                    progressBar.innerText = '100% Hoàn thành';
                    
                    bigClassesDatabase = updatedDatabase;

                    let totalStudentsCount = 0;
                    Object.keys(bigClassesDatabase).forEach(classKey => {
                        totalStudentsCount += bigClassesDatabase[classKey].students.length;
                    });
                    
                    const successMessage = `🎉 CẬP NHẬT THÀNH CÔNG!\n\n🔹 Tên tệp: ${file.name}\n🔹 Tổng số học viên: ${totalStudentsCount} học viên.`;
                    
                    document.getElementById('fileStatusMessage').style.color = "#00ff66";
                    document.getElementById('fileStatusMessage').innerText = `✅ Nạp thành công! Tổng số ${totalStudentsCount} học viên.`;
                    
                    localStorage.setItem('big_classes_database', JSON.stringify(bigClassesDatabase));
                    localStorage.setItem('big_classes_filename', file.name);
                    
                    await saveDatabaseState();
                    renderFullSystemUI();
                    showNotificationModal("CẬP NHẬT HOÀN TẤT", successMessage);
                    return;
                }

                let percent = Math.round((currentSheetIdx / totalSheets) * 100);
                progressBar.style.width = percent + '%';
                progressBar.innerText = percent + '%';

                const sheetName = sheetsToProcess[currentSheetIdx];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
                
                if (rows.length > 0) {
                    const colBIndex = 1;
                    const colPIndex = 16;

                    let detectedClassName = "";
                    let detectedSchedule = "";
                    let previousText = "";
                    let readingStudents = false;

                    rows.forEach((row) => {
                        if (!row) return;
                        let cellB = row[colBIndex] ? row[colBIndex].toString().trim() : "";
                        let cellP = row[colPIndex] ? row[colPIndex].toString().trim() : "";
                        let cellB_lower = cellB.toLowerCase();
                        let cleanPhone = cellP.replace(/[^0-9]/g, "");
                    
                        if (cleanPhone.length === 9 && !cleanPhone.startsWith("0")) {
                            cleanPhone = "0" + cleanPhone;
                        }

                        if (cellB === "" || cellB_lower === "tên học sinh" || cellB_lower === "tên hs" || cellB_lower === "họ và tên") {
                            return;
                        }

                        const isSchedule = /^t[2-7]/i.test(cellB) || /^cn/i.test(cellB) || /18h|19h|20h/i.test(cellB) || cellB.includes("THỨ");

                        if (isSchedule) {
                            if (previousText) { detectedClassName = previousText; }
                            detectedSchedule = cellB;
                            readingStudents = true;
                            return;
                        }

                        if (readingStudents) {
                            if (cellB && !/^\d+$/.test(cellB) && cleanPhone.length >= 9 && cleanPhone.length <= 11) {
                                let currentClassKey = detectedClassName;
                                if (!updatedDatabase[currentClassKey]) {
                                    updatedDatabase[currentClassKey] = { sheet: sheetName, schedule: detectedSchedule, students: [] };
                                }

                                let foundOldStudent = null;
                                Object.keys(oldDatabase).forEach(oldKey => {
                                    if (oldDatabase[oldKey].students) {
                                        let match = oldDatabase[oldKey].students.find(s => 
                                            s.name.trim().toLowerCase() === cellB.trim().toLowerCase() && 
                                            s.phone === cleanPhone
                                        );
                                        if (match) foundOldStudent = match;
                                    }
                                });

                                if (foundOldStudent) {
                                    updatedDatabase[currentClassKey].students.push(foundOldStudent);
                                } else {
                                    updatedDatabase[currentClassKey].students.push({
                                        id: Date.now() + Math.random(), 
                                        name: cellB,
                                        phone: cleanPhone,
                                        status: "present",
                                        note: ""
                                    });
                                }
                                return;
                            } else if (cellB && cleanPhone.length < 9) {
                                readingStudents = false;
                                previousText = cellB;
                                return;
                            }
                        } else {
                            if (cellB && cleanPhone.length < 9) { previousText = cellB; }
                        }
                    });
                }
                currentSheetIdx++;
                setTimeout(parseSheetStep, 10);
            }
            parseSheetStep();
        } catch (err) {
            console.error(err);
            alert("Lỗi khi đọc dữ liệu từ file Excel!");
            document.getElementById('progressContainer').style.display = 'none';
        }
    };
    reader.readAsArrayBuffer(file);
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

function renderFullSystemUI() {
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
                    <button class="btn-add" onclick="addNewStudentToClass('${classKey}')">+ Thêm vào danh sách</button>
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
                            <button class="copy-btn" onclick="copyAbsentReport('${classKey}')">Copy</button>
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
                                onchange="updateStudentEvaluation('${classKey}', ${student.id}, '${criterion.replace(/'/g, "\\'")}', this.value)">
                            ${options.map(opt => `<option value="${opt}" ${savedValue === opt ? 'selected' : ''}>${opt || '--'}</option>`).join('')}
                        </select>
                    </div>`;
            }
            dynamicCriteriaHtml += `</div></div>`;
        }

        const statusClass = student.status === 'absent' ? 'status-absent' : 'status-present';
        const deleteButtonHtml = window.isLoggedIn ? `<button class="btn-delete" onclick="deleteStudentFromClass('${classKey}', ${student.id}, '${student.name.replace(/'/g, "\\'")}')">Xoá</button>` : '';

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
                    <button class="btn-action btn-present ${student.status === 'present' ? 'active' : ''}" ${disabledAttr} onclick="updateStudentStatus('${classKey}', ${student.id}, 'present')">CÓ MẶT</button>
                    <button class="btn-action btn-absent ${student.status === 'absent' ? 'active' : ''}" ${disabledAttr} onclick="updateStudentStatus('${classKey}', ${student.id}, 'absent')">VẮNG</button>
                    <input type="text" class="note-select" style="flex: 1.5; padding: 8px 5px;" placeholder="Ghi chú vắng..." value="${student.note || ''}" ${readonlyAttr} onchange="updateStudentNote('${classKey}', ${student.id}, this.value)">
                </div>

                ${dynamicCriteriaHtml}
            </div>
        `;
    }).join('');
}

window.updateStudentStatus = function(classKey, studentId, status) {
    if (!window.isLoggedIn) { alert("Vui lòng đăng nhập để thay đổi trạng thái!"); return; }
    let student = bigClassesDatabase[classKey].students.find(s => s.id === studentId);
    if (student) {
        student.status = status;
        saveDatabaseState();
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
        saveDatabaseState();
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
        saveDatabaseState();
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
    saveDatabaseState();

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
        saveDatabaseState();

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
    if (event.key === "Enter") searchGlobalStudent();
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
                    <td><span style="color:#00f0ff; font-weight:bold; cursor:pointer; text-decoration:underline;" onclick="focusToCard('${classKey}', ${s.id})">${classKey}</span></td>
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
        bigClassesDatabase = {};
        document.getElementById('fileStatusMessage').style.color = "#ff007f";
        document.getElementById('fileStatusMessage').innerText = "Chưa có dữ liệu học viên. Vui lòng chọn tệp Excel.";
        document.getElementById('searchResultBox').style.display = 'none';
        renderFullSystemUI();
        showToast("Đã xóa dữ liệu hệ thống!");
    }
}

window.togglePasswordVisibility = function() {
    const passwordInput = document.getElementById("loginPassword");
    const toggleBtnContainer = document.getElementById("togglePasswordBtn");
    
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleBtnContainer.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00ff66" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px rgba(0,255,102,0.6));">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>`;
    } else {
        passwordInput.type = "password";
        toggleBtnContainer.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>`;
    }
}

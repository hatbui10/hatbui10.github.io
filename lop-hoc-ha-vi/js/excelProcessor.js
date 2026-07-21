import { bigClassesDatabase, setBigClassesDatabase, saveToFirebase, saveDatabaseStateLocally } from "./storage.js";
import { renderFullSystemUI, showNotificationModal, showToast } from "./uiRenderer.js";

const targetSheets = ["SV", "12", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2", "DH25", "DH26"];

export function startProcessingExcel(input) {
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
                    
                    setBigClassesDatabase(updatedDatabase);

                    let totalStudentsCount = 0;
                    Object.keys(bigClassesDatabase).forEach(classKey => {
                        totalStudentsCount += bigClassesDatabase[classKey].students.length;
                    });
                    
                    const successMessage = `🎉 CẬP NHẬT THÀNH CÔNG!\n\n🔹 Tên tệp: ${file.name}\n🔹 Tổng số học viên: ${totalStudentsCount} học viên.`;
                    
                    document.getElementById('fileStatusMessage').style.color = "#00ff66";
                    document.getElementById('fileStatusMessage').innerText = `✅ Nạp thành công! Tổng số ${totalStudentsCount} học viên.`;
                    
                    localStorage.setItem('big_classes_filename', file.name);
                    saveDatabaseStateLocally();
                    await saveToFirebase();
                    
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

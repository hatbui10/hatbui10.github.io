import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { loadFromFirebase, bigClassesDatabase, setBigClassesDatabase } from "./storage.js";
import { renderFullSystemUI, showToast, openLoginModal, closeLoginModal } from "./uiRenderer.js";
import { startProcessingExcel } from "./excelProcessor.js";

// Gắn hàm xử lý Excel vào window để file HTML gọi được từ thẻ input file
window.startProcessingExcel = startProcessingExcel;

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
        authActionButton.setAttribute("onclick", "window.processLogout()");
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

window.onload = async function () {
    const loaded = await loadFromFirebase();
    if (loaded) {
        renderFullSystemUI();
        return;
    }
    const cachedData = localStorage.getItem("big_classes_database");
    if (cachedData) {
        setBigClassesDatabase(JSON.parse(cachedData));
        renderFullSystemUI();
    }
}

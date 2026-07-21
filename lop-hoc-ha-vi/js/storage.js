import { db } from "./firebase.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export let bigClassesDatabase = {};

export function setBigClassesDatabase(newDb) {
    bigClassesDatabase = newDb;
}

export async function saveToFirebase() { 
    if (!window.isLoggedIn) return; 
    try { 
        await setDoc(doc(db, "system", "database"), { 
            database: bigClassesDatabase, 
            filename: localStorage.getItem("big_classes_filename") || "", 
            updatedAt: new Date().toISOString() 
        }); 
    } catch (err) { console.error("Lỗi lưu Firebase:", err); } 
}

export async function loadFromFirebase() { 
    try { 
        const docRef = doc(db, "system", "database"); 
        const docSnap = await getDoc(docRef); 
        if (docSnap.exists()) { 
            const data = docSnap.data(); 
            bigClassesDatabase = data.database || {}; 
            localStorage.setItem("big_classes_database", JSON.stringify(bigClassesDatabase)); 
            if (data.filename) { localStorage.setItem("big_classes_filename", data.filename); } 
            return true;
        } 
    } catch (err) { console.error("Lỗi đọc Firebase:", err); } 
    return false;
}

export function saveDatabaseStateLocally() {
    localStorage.setItem('big_classes_database', JSON.stringify(bigClassesDatabase));
}

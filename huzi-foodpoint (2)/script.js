import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, db, doc, setDoc, onAuthStateChanged, getDoc} from './firebase.js';

const showError = (title, text) => Swal.fire({ icon: "error", title, text });
const showSuccess = (title, text) => Swal.fire({ icon: "success", title, text });


const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

document.querySelectorAll(".toggle-password").forEach(toggle => {
    toggle.addEventListener("click", () => {
        const passwordInput = toggle.previousElementSibling;
        const eyeIcon = toggle.querySelector(".eye-icon");
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            eyeIcon.src = "images/unvisible eye.png";
        } else {
            passwordInput.type = "password";
            eyeIcon.src = "images/visible eye.png";
        }
    });
});

let signupBtn = document.querySelector(".sign-up-btn");
let adminSignupBtn = document.getElementById("admin-signup-btn");
let loginBtn = document.querySelector(".log-in-btn");
let signupCont = document.getElementById("signup-container");
let loginCont = document.getElementById("login-container");
let body = document.querySelector("body");
let frontPage = document.querySelector(".FrontPage");

let currentRole = "user";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User is logged in, UID:", user.uid);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const role = userDoc.data().role;
            console.log("User role:", role);
            signupBtn.disabled = true;
            loginBtn.disabled = true;
            adminSignupBtn.disabled = true;
            signupBtn.style.opacity = "0.5";
            loginBtn.style.opacity = "0.5";
            adminSignupBtn.style.opacity = "0.5";
            signupBtn.style.cursor = "not-allowed";
            loginBtn.style.cursor = "not-allowed";
            adminSignupBtn.style.cursor = "not-allowed";
            

            signupBtn.addEventListener("click", (e) => {
                e.preventDefault();
                showWarning("Already Logged In", "Please logout to sign up with another account.");
            });
            loginBtn.addEventListener("click", (e) => {
                e.preventDefault();
                showWarning("Already Logged In", "Please logout to login with another account.");
            });
            adminSignupBtn.addEventListener("click", (e) => {
                e.preventDefault();
                showWarning("Already Logged In", "Please logout to sign up as admin.");
            });
        }
    } else {
        console.log("No user logged in");
        signupBtn.disabled = false;
        loginBtn.disabled = false;
        adminSignupBtn.disabled = false;
        signupBtn.style.opacity = "1";
        loginBtn.style.opacity = "1";
        adminSignupBtn.style.opacity = "1";
        signupBtn.style.cursor = "pointer";
        loginBtn.style.cursor = "pointer";
        adminSignupBtn.style.cursor = "pointer";
    }
});

signupBtn.addEventListener("click", () => {
    if (!auth.currentUser) {
        signupCont.style.display = "block";
        loginCont.style.display = "none";
        body.style.overflowY = "hidden";
        frontPage.style.opacity = "0.5";
        frontPage.style.pointerEvents = "none";
        currentRole = "user";
        console.log("User Signup Clicked - Current Role:", currentRole);
        signupCont.querySelector("#su-email").value = "";
        signupCont.querySelector("#su-password").value = "";
    }
});

adminSignupBtn.addEventListener("click", () => {
    if (!auth.currentUser) {
        signupCont.style.display = "block";
        loginCont.style.display = "none";
        body.style.overflowY = "hidden";
        frontPage.style.opacity = "0.5";
        frontPage.style.pointerEvents = "none";
        currentRole = "admin";
        console.log("Admin Signup Clicked - Current Role:", currentRole);
        signupCont.querySelector("#su-email").value = "";
        signupCont.querySelector("#su-password").value = "";
    }
});

loginBtn.addEventListener("click", () => {
    if (!auth.currentUser) {
        loginCont.style.display = "block";
        signupCont.style.display = "none";
        body.style.overflowY = "hidden";
        frontPage.style.opacity = "0.5";
        frontPage.style.pointerEvents = "none";
        loginCont.querySelector("#li-email").value = "";
        loginCont.querySelector("#li-password").value = "";
    }
});

document.querySelectorAll(".close-popup").forEach(closeBtn => {
    closeBtn.addEventListener("click", () => {
        const target = document.getElementById(closeBtn.dataset.target);
        target.style.display = "none";
        body.style.overflowY = "auto";
        frontPage.style.opacity = "1";
        frontPage.style.pointerEvents = "auto";
    });
});

document.querySelectorAll(".switch-form").forEach(switchLink => {
    switchLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (!auth.currentUser) {
            const target = document.getElementById(switchLink.dataset.target);
            signupCont.style.display = target.id === "signup-container" ? "block" : "none";
            loginCont.style.display = target.id === "login-container" ? "block" : "none";
            body.style.overflowY = "hidden";
            frontPage.style.opacity = "0.5";
            frontPage.style.pointerEvents = "none";
            currentRole = target.id === "signup-container" ? "user" : currentRole;
            console.log("Switch Form - Current Role:", currentRole);

            if (target.id === "signup-container") {
                const emailInput = target.querySelector("#su-email");
                const passwordInput = target.querySelector("#su-password");
                if (emailInput) emailInput.value = "";
                if (passwordInput) passwordInput.value = "";
            } else if (target.id === "login-container") {
                const emailInput = target.querySelector("#li-email");
                const passwordInput = target.querySelector("#li-password");
                if (emailInput) emailInput.value = "";
                if (passwordInput) passwordInput.value = "";
            }
        } else {
            showWarning("Already Logged In", "Please logout to switch to another account.");
        }
    });
});

document.getElementById("signupBtn").addEventListener("click", async () => {
    const email = signupCont.querySelector("#su-email").value;
    const password = signupCont.querySelector("#su-password").value;

    if (!email || !password) {
        return showError("Missing Fields", "Please enter email and password!");
    }

    if (!validateEmail(email)) {
        return showError("Invalid Email", "Please enter a valid email address!");
    }

    if (password.length < 6) {
        return showError("Weak Password", `Password must be at least 6 characters long! Current length: ${password.length}`);
    }

    console.log("Signup Role:", currentRole);

    try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Firebase Signup Successful, UID:", user.uid);

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            role: currentRole,
            created_at: new Date().toISOString()
        });
        console.log("Firestore User Role Saved");

        showSuccess("Signup Successful", `Welcome, ${user.email}!`).then(() => {
            signupCont.style.display = "none";
            body.style.overflowY = "auto";
            frontPage.style.opacity = "1";
            frontPage.style.pointerEvents = "auto";
            if (currentRole === "admin") {
                window.location.href = '/admin.html';
            } else {
                window.location.href = '/menu.html';
            }
        });

if (currentRole === "admin") {
            window.location.href = '/admin.html';
}

else {
            window.location.href = '/menu.html';
}
        

    } catch (error) {
        console.error("Signup Error:", error);
        showError("Signup Failed", error.message);
    }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = loginCont.querySelector("#li-email").value;
    const password = loginCont.querySelector("#li-password").value;

    if (!email || !password) {
        return showError("Missing Fields", "Please enter email and password!");
    }

    if (!validateEmail(email)) {
        return showError("Invalid Email", "Please enter a valid email address!");
    }

    try {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        console.log("Firebase Login Successful, UID:", user.uid);

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
            throw new Error("User role not found in Firestore. Please sign up again.");
        }
        const role = userDoc.data().role;
        console.log("Firestore Role:", role);

        showSuccess("Login Successful", `Welcome back, ${user.email}!`).then(() => {
            loginCont.style.display = "none";
            body.style.overflowY = "auto";
            frontPage.style.opacity = "1";
            frontPage.style.pointerEvents = "auto";
            if (role === "admin") {
                window.location.href = '/admin.html';
            } else if (role === "user") {
                window.location.href = '/menu.html';
            } else {
                console.warn("Invalid role detected:", role);
                window.location.href = '/menu.html';
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        showError("Login Failed", error.message);
    }
});
import { auth, onAuthStateChanged, signOut, db, doc, getDoc, collection, addDoc, getDocs, query, orderBy, updateDoc, deleteDoc } from './firebase.js';

const showError = (title, text) => Swal.fire({ icon: "error", title, text });
const showSuccess = (title, text) => Swal.fire({ icon: "success", title, text });
const loadDishes = async () => {
    const dishesList = document.getElementById("dishesList");
    if (!dishesList) {
        console.error("Dishes list not found!");
        showError("Error", "Page not loaded correctly. Please refresh.");
        return;
    }

 if (auth.currentUser.email !== "huziadmin@gmail.com") {
        showError("Unauthorized", "You are not authorized to view this page.");
        return;
     
 }
 

    dishesList.innerHTML = '<p>Loading dishes...</p>';
    try {
        const q = query(collection(db, "dishes"), orderBy("created_at", "desc"));
        const querySnapshot = await getDocs(q);
        console.log("Fetched dishes count:", querySnapshot.size);

        dishesList.innerHTML = "";
        if (querySnapshot.empty) {
            dishesList.innerHTML = '<p>No dishes found.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const dish = doc.data();
            const dishId = doc.id;
            const card = `
                <div class="col-md-3 mb-3">
                    <div class="card admin">
                        <div class="card-img-container">
                            <img src="${dish.image_url || 'https://dummyimage.com/400x400/000/fff.png&text=No+Image+Available'}" class="card-img-top" alt="${dish.name}" onerror="this.src='https://dummyimage.com/400x400/000/fff.png&text=Image+Not+Found'">
                            <div class="card-img-overlay admin-only">
                                <button class="btn-admin btn-edit" data-id="${dishId}" data-bs-toggle="modal" data-bs-target="#editDishModal"><i class="fa-regular fa-pen-to-square"></i></button>
                                <button class="btn-admin btn-delete" data-id="${dishId}"><i class="fa-regular fa-trash-can"></i></button>
                            </div>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">${dish.name}</h5>
                            <p class="card-text"><strong>Price:</strong> PKR ${dish.price}</p>
                            <p class="card-text"><strong>Category:</strong> ${dish.category}</p>
                            <p class="card-text card-des">${dish.description}</p>
                        </div>
                    </div>
                </div>
            `;
            dishesList.innerHTML += card;
        });

        addReadMoreFunctionality()
        
        document.querySelectorAll(".btn-edit").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const dishId = e.currentTarget.dataset.id;
                try {
                    const dishDoc = await getDoc(doc(db, "dishes", dishId));
                    if (dishDoc.exists()) {
                        const dish = dishDoc.data();
                        document.getElementById("editDishId").value = dishId;
                        document.getElementById("editDishName").value = dish.name;
                        document.getElementById("editDishPrice").value = dish.price;
                        document.getElementById("editDishDescription").value = dish.description;
                        document.getElementById("editDishCategory").value = dish.category;
                        document.getElementById("editDishImageUrl").value = dish.image_url;
                    } else {
                        showError("Error", "Dish not found.");
                    }
                } catch (error) {
                    console.error("Error loading dish for edit:", error);
                    showError("Error", `Failed to load dish details: ${error.message}`);
                }
            });
        });

        document.querySelectorAll(".btn-delete").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const dishId = e.currentTarget.dataset.id;
                Swal.fire({
                    title: "Are you sure?",
                    text: "This dish will be deleted permanently!",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "Yes, delete it!"
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            await deleteDoc(doc(db, "dishes", dishId));
                            showSuccess("Deleted", "Dish deleted successfully!");
                            loadDishes();
                        } catch (error) {
                            console.error("Error deleting dish:", error);
                            showError("Error", `Failed to delete dish: ${error.message}`);
                        }
                    }
                });
            });
        });
    } catch (error) {
        console.error("Error loading dishes:", error);
        dishesList.innerHTML = "";
        if (error.code === "permission-denied") {
            showError("Access Denied", "You don't have permission to view dishes.");
        } else if (error.code === "unavailable") {
            showError("Network Error", "Failed to connect to the server.");
        } else {
            showError("Error", `Failed to load dishes: ${error.message}`);
        }
    }
};

function addReadMoreFunctionality() {
    document.querySelectorAll('.card-des').forEach(p => {
        const existingLink = p.nextElementSibling?.classList.contains('read-more-link') ? p.nextElementSibling : null;
        if (existingLink) existingLink.remove();

        const isLongText = p.scrollHeight > p.clientHeight || p.textContent.length > 100;
        if (isLongText) {
            const readMoreLink = document.createElement('a');
            readMoreLink.classList.add('read-more-link');
            readMoreLink.textContent = 'Read More';
            readMoreLink.href = '#';
            p.insertAdjacentElement('afterend', readMoreLink);

            readMoreLink.addEventListener('click', (e) => {
                e.preventDefault();
                p.classList.toggle('expanded');
                readMoreLink.textContent = p.classList.contains('expanded') ? 'Read Less' : 'Read More';
            });
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Admin page loaded");
    try {
        await new Promise((resolve, reject) => {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    resolve(user);
                } else {
                    reject(new Error("No user logged in"));
                }
            });
        });
        console.log("User authenticated");
        await loadDishes();
    } catch (error) {
        console.error("Authentication error:", error);
        showError("Access Denied", "Please log in to access the admin dashboard.");
        setTimeout(() => window.location.href = "/index.html", 2000);
    }
});

document.getElementById("saveDishBtn").addEventListener("click", async () => {
    const dishName = document.getElementById("dishName").value;
    const dishPrice = document.getElementById("dishPrice").value;
    const dishDescription = document.getElementById("dishDescription").value;
    const dishCategory = document.getElementById("dishCategory").value;
    const dishImageUrl = document.getElementById("dishImageUrl").value;

    if (!dishName || !dishPrice || !dishDescription || !dishCategory || !dishImageUrl) {
        return showError("Missing Fields", "Please fill all fields!");
    }

    if (dishPrice < 0) {
        return showError("Invalid Price", "Price cannot be negative!");
    }

    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Please log in as an admin.");

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) throw new Error("User role not found.");

        const role = userDoc.data().role;
        if (role !== "admin") throw new Error("Only admins can add dishes.");

        const dishData = {
            name: dishName,
            price: parseFloat(dishPrice),
            description: dishDescription,
            category: dishCategory,
            image_url: dishImageUrl,
            created_at: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, "dishes"), dishData);
        console.log("Dish added to Firestore, ID:", docRef.id);
        showSuccess("Success", "Dish added successfully!");
        document.getElementById("addDishForm").reset();
        bootstrap.Modal.getInstance(document.getElementById("addDishModal")).hide();
        await loadDishes();
    } catch (error) {
        console.error("Error adding dish:", error);
        showError("Error", error.message);
    }
});

document.getElementById("updateDishBtn").addEventListener("click", async () => {
    const dishId = document.getElementById("editDishId").value;
    const dishName = document.getElementById("editDishName").value;
    const dishPrice = document.getElementById("editDishPrice").value;
    const dishDescription = document.getElementById("editDishDescription").value;
    const dishCategory = document.getElementById("editDishCategory").value;
    const dishImageUrl = document.getElementById("editDishImageUrl").value;

    if (!dishName || !dishPrice || !dishDescription || !dishCategory || !dishImageUrl) {
        return showError("Missing Fields", "Please fill all required fields!");
    }

    if (dishPrice < 0) {
        return showError("Invalid Price", "Price cannot be negative!");
    }

    try {
        const dishRef = doc(db, "dishes", dishId);
        const dishDoc = await getDoc(dishRef);
        if (!dishDoc.exists()) throw new Error("Dish not found.");

        const currentDish = dishDoc.data();
        const updatedDishData = {
            name: dishName,
            price: parseFloat(dishPrice),
            description: dishDescription,
            category: dishCategory,
            image_url: dishImageUrl,
            created_at: currentDish.created_at
        };

        await updateDoc(dishRef, updatedDishData);
        console.log("Dish updated, ID:", dishId);
        showSuccess("Success", "Dish updated successfully!");
        bootstrap.Modal.getInstance(document.getElementById("editDishModal")).hide();
        await loadDishes();
    } catch (error) {
        console.error("Error updating dish:", error);
        showError("Error", error.message);
    }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    Swal.fire({
        icon: "warning",
        title: "Confirm Logout",
        text: "Are you sure you want to logout?",
        showCancelButton: true,
        confirmButtonText: "OK",
        cancelButtonText: "Cancel"
    }).then((result) => {
        if (result.isConfirmed) {
            signOut(auth)
                .then(() => {
                    showSuccess("Logged Out", "You have been successfully logged out.");
                    window.location.href = "/index.html";
                })
                .catch((error) => {
                    console.error("Logout error:", error);
                    showError("Logout Error", error.message);
                });
        }
    });
});
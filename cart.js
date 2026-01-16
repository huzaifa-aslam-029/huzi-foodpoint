import { auth, onAuthStateChanged, signOut, db, collection, getDocs, query, orderBy, doc, getDoc, deleteDoc, updateDoc } from './firebase.js';

const showError = (title, text) => Swal.fire({ icon: "error", title, text });
const showSuccess = (title, text) => Swal.fire({ icon: "success", title, text });

const updateCartNumber = async () => {
    const cartNumElements = document.querySelectorAll(".cart-num");
    if (!cartNumElements.length) return;

    try {
        const q = query(collection(db, `users/${auth.currentUser.uid}/cart`));
        const querySnapshot = await getDocs(q);
        let totalQuantity = 0;
        querySnapshot.forEach(doc => {
            totalQuantity += doc.data().quantity || 1;
        });
        cartNumElements.forEach(el => {
            el.textContent = totalQuantity;
        });
        console.log("Cart number updated:", totalQuantity);
    } catch (error) {
        console.error("Error updating cart number:", error);
    }
};

const loadCart = async () => {
    const cartList = document.getElementById("cartList");
    const cartTotal = document.getElementById("cartTotal");
    // if (!cartList || !cartTotal) {
    //     console.error("Cart list or total not found!");
    //     showError("Error", "Page not loaded correctly. Please refresh.");
    //     return;
    // }

    cartList.innerHTML = '<p>Loading cart...</p>';
    try {
        const q = query(collection(db, `users/${auth.currentUser.uid}/cart`), orderBy("added_at", "desc"));
        const querySnapshot = await getDocs(q);
        console.log("Fetched cart items count:", querySnapshot.size);

        cartList.innerHTML = "";
        let total = 0;

        if (querySnapshot.empty) {
            cartList.innerHTML = '<p>Your cart is empty.</p>';
            cartTotal.textContent = "0";
            return;
        }

        for (const cartDoc of querySnapshot.docs) {
            const cartItem = cartDoc.data();
            const dishId = cartItem.dishId;
            const dishDoc = await getDoc(doc(db, "dishes", dishId));
            if (dishDoc.exists()) {
                const dish = dishDoc.data();
                const quantity = cartItem.quantity || 1;
                const itemTotal = dish.price * quantity;
                total += itemTotal;

                const card = `
                    <div class="col-md-3 mb-3">
                        <div class="card cart-item">
                            <div class="card-img-container">
                                <img src="${dish.image_url || 'https://dummyimage.com/400x400/000/fff.png&text=No+Image+Available'}" class="card-img-top" alt="${dish.name}" onerror="this.src='https://dummyimage.com/400x400/000/fff.png&text=Image+Not+Found'">
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">${dish.name}</h5>
                                <p class="card-text"><strong>Price:</strong> PKR ${dish.price}</p>
                                <p class="card-text"><strong>Category:</strong> ${dish.category}</p>
                                <p class="card-text quantity" data-id="${cartDoc.id}"><strong>Quantity:</strong> ${quantity}</p>
                                <p class="card-text"><strong>Total:</strong> PKR ${itemTotal}</p>
                                <div class="cart-Btns">
                                    <button class="btn quantity-btn" onclick="decrement('${cartDoc.id}')"><i class="fa-solid fa-minus"></i></button>
                                    <button class="btn quantity-btn" onclick="increment('${cartDoc.id}')"><i class="fa-solid fa-plus"></i></button>
                                    <button class="btn btn-remove" data-id="${cartDoc.id}"><i class="fa-solid fa-xmark"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                cartList.innerHTML += card;
            }
        }

        cartTotal.textContent = total.toFixed(2);

        document.querySelectorAll(".btn-remove").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const cartItemId = e.currentTarget.dataset.id;
                try {
                    await deleteDoc(doc(db, `users/${auth.currentUser.uid}/cart`, cartItemId));
                    showSuccess("Removed", "Item removed from cart!");
                    loadCart();
                    await updateCartNumber();
                } catch (error) {
                    showError("Error", `Failed to remove item: ${error.message}`);
                }
            });
        });
    } catch (error) {
        console.error("Error loading cart:", error);
        cartList.innerHTML = "";
        showError("Error", `Failed to load cart: ${error.message}`);
    }
};

window.increment = async (cartItemId) => {
    try {
        const cartDocRef = doc(db, `users/${auth.currentUser.uid}/cart`, cartItemId);
        const cartDoc = await getDoc(cartDocRef);
        if (cartDoc.exists()) {
            const currentQuantity = cartDoc.data().quantity || 1;
            await updateDoc(cartDocRef, {
                quantity: currentQuantity + 1,
                added_at: new Date().toISOString()
            });
            loadCart();
            await updateCartNumber();
        }
    } catch (error) {
        showError("Error", `Failed to increment quantity: ${error.message}`);
    }
};

window.decrement = async (cartItemId) => {
    try {
        const cartDocRef = doc(db, `users/${auth.currentUser.uid}/cart`, cartItemId);
        const cartDoc = await getDoc(cartDocRef);
        if (cartDoc.exists()) {
            const currentQuantity = cartDoc.data().quantity || 1;
            if (currentQuantity > 1) {
                await updateDoc(cartDocRef, {
                    quantity: currentQuantity - 1,
                    added_at: new Date().toISOString()
                });
            } else {
                await deleteDoc(cartDocRef);
            }
            loadCart();
            await updateCartNumber();
        }
    } catch (error) {
        showError("Error", `Failed to decrement quantity: ${error.message}`);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            console.log("No user logged in, redirecting to index.html");
            window.location.href = "/index.html";
        } else {
            console.log("User authenticated, UID:", user.uid);
            loadCart();
            updateCartNumber();
        }
    });
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
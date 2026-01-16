// Hiding Container-1
document.querySelector(".close-logo").addEventListener(("click"), () => {
    document.querySelector(".cont-1").style.display = "none"
    document.querySelector(".cont-2").style.top = "0"

})

// Auto Typing
new Typed("#autowriting", {
    strings: ["with Team Huzaifa","delivery at your home!", "meal on wheel at your doorstep!","Food point!"],
    typeSpeed: 100,
    backSpeed: 100,
    loop: true
})

function scrollShadow() {
    const navbar = document.getElementById("navbarShadow");
    if (window.scrollY > 0) {
        navbar.classList.add("boxShadow");
    } else {
        navbar.classList.remove("boxShadow");
    }
}
window.addEventListener('scroll', scrollShadow);
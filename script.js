const menu=document.querySelector(".menu-toggle"),nav=document.querySelector("nav");
menu.addEventListener("click",()=>nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
document.getElementById("year").textContent=new Date().getFullYear();

document.querySelectorAll("[data-plan]").forEach(a=>a.addEventListener("click",()=>{
  const interest=document.getElementById("interest");
  const planMap={
    "Essential":"Essential Plan — $150/month",
    "Growth":"Growth Plan — $250/month",
    "Studio Retainer":"Studio Retainer — $500/month"
  };
  if (interest) interest.value=planMap[a.dataset.plan] || "";
  const m=document.getElementById("message");
  if(m && !m.value)m.value="I'd like to discuss the "+a.dataset.plan+" plan.";
}));

const motionSlides=document.querySelectorAll(".motion-slide");
const motionDots=document.querySelectorAll(".motion-dots span");
if(motionSlides.length){
  let motionIndex=0;
  setInterval(()=>{
    motionSlides[motionIndex].classList.remove("active");
    if(motionDots[motionIndex]) motionDots[motionIndex].classList.remove("active");
    motionIndex=(motionIndex+1)%motionSlides.length;
    motionSlides[motionIndex].classList.add("active");
    if(motionDots[motionIndex]) motionDots[motionIndex].classList.add("active");
  },3500);
}

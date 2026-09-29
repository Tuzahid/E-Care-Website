import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  increment
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";

/* =====================================================
   FIREBASE CONFIG
   নিজের Firebase Project-এর config এখানে বসাতে হবে
===================================================== */

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);

/* =====================================================
   CONSTANTS
===================================================== */

const REGISTRATION_FEE = 30;

const PAYMENT_NUMBER = "01797937668";
const WHATSAPP_NUMBER = "8801745221602";

const COURSES = {
  "ai-web-development": {
    name: "AI Web Development",
    price: 1200
  },

  "graphic-design": {
    name: "Graphic Design",
    price: 1000
  },

  "digital-marketing": {
    name: "Digital Marketing",
    price: 1000
  },

  "video-editing": {
    name: "Video Editing",
    price: 800
  }
};

/*
  Registration-এর পর এই দুইটি course automatically free.
*/
const REGISTRATION_FREE_COURSES = [
  "ai-web-development",
  "digital-marketing"
];

/* =====================================================
   BANGLADESH DIVISION / DISTRICT
===================================================== */

const divisions = {

  "ঢাকা": [
    "ঢাকা","গাজীপুর","নারায়ণগঞ্জ","নরসিংদী",
    "টাঙ্গাইল","কিশোরগঞ্জ","মানিকগঞ্জ","মুন্সিগঞ্জ",
    "মাদারীপুর","রাজবাড়ী","শরীয়তপুর","ফরিদপুর","গোপালগঞ্জ"
  ],

  "চট্টগ্রাম": [
    "চট্টগ্রাম","কক্সবাজার","কুমিল্লা","ব্রাহ্মণবাড়িয়া",
    "চাঁদপুর","ফেনী","খাগড়াছড়ি","লক্ষ্মীপুর",
    "নোয়াখালী","রাঙ্গামাটি","বান্দরবান"
  ],

  "রাজশাহী": [
    "রাজশাহী","বগুড়া","জয়পুরহাট","নওগাঁ",
    "নাটোর","চাঁপাইনবাবগঞ্জ","পাবনা","সিরাজগঞ্জ"
  ],

  "খুলনা": [
    "খুলনা","বাগেরহাট","চুয়াডাঙ্গা","যশোর",
    "ঝিনাইদহ","কুষ্টিয়া","মাগুরা","মেহেরপুর",
    "নড়াইল","সাতক্ষীরা"
  ],

  "বরিশাল": [
    "বরিশাল","ভোলা","ঝালকাঠি","পটুয়াখালী",
    "পিরোজপুর","বরগুনা"
  ],

  "সিলেট": [
    "সিলেট","মৌলভীবাজার","হবিগঞ্জ","সুনামগঞ্জ"
  ],

  "রংপুর": [
    "রংপুর","দিনাজপুর","গাইবান্ধা","কুড়িগ্রাম",
    "লালমনিরহাট","নীলফামারী","পঞ্চগড়","ঠাকুরগাঁও"
  ],

  "ময়মনসিংহ": [
    "ময়মনসিংহ","জামালপুর","নেত্রকোনা","শেরপুর"
  ]
};

/* =====================================================
   DOM
===================================================== */

const $ = id => document.getElementById(id);

const registrationModal = $("registrationModal");
const coursePaymentModal = $("coursePaymentModal");
const loginModal = $("loginModal");
const accountMenu = $("accountMenu");

let currentStudent = null;
let selectedCourse = null;
let selectedPaymentMethod = "bkash";
let selectedCoursePaymentMethod = "bkash";

/* =====================================================
   TOAST
===================================================== */

function toast(message){

  const el = $("toast");

  el.textContent = message;
  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 2800);
}

/* =====================================================
   MODAL
===================================================== */

function openModal(modal){
  modal.classList.remove("hidden");
}

function closeModal(modal){
  modal.classList.add("hidden");
}

document.querySelectorAll("[data-close]").forEach(btn => {

  btn.addEventListener("click", () => {
    closeModal($(btn.dataset.close));
  });

});

/* =====================================================
   DIVISION / DISTRICT
===================================================== */

Object.keys(divisions).forEach(division => {

  const option = document.createElement("option");

  option.value = division;
  option.textContent = division;

  $("division").appendChild(option);

});

$("division").addEventListener("change", () => {

  const selected = $("division").value;

  $("district").innerHTML =
    `<option value="">জেলা নির্বাচন করুন</option>`;

  if(!selected) return;

  divisions[selected].forEach(district => {

    const option = document.createElement("option");

    option.value = district;
    option.textContent = district;

    $("district").appendChild(option);

  });

});

/* =====================================================
   REGISTRATION OPEN
===================================================== */

$("registerBtn").addEventListener("click", () => {

  if(currentStudent){

    toast(
      `আপনার Registration ID: ${currentStudent.registrationId}`
    );

    return;
  }

  resetRegistration();

  openModal(registrationModal);

});

/* =====================================================
   REGISTRATION FORM
===================================================== */

$("registrationForm").addEventListener("submit", async event => {

  event.preventDefault();

  const name = $("name").value.trim();
  const division = $("division").value;
  const district = $("district").value;
  const mobile = $("mobile").value.trim();
  const gmail = $("gmail").value.trim().toLowerCase();

  if(!name || !division || !district || !mobile || !gmail){

    toast("সব তথ্য পূরণ করুন।");
    return;
  }

  if(!/^01[3-9]\d{8}$/.test(mobile)){

    toast("সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন।");
    return;
  }

  if(!gmail.endsWith("@gmail.com")){

    toast("সঠিক Gmail address দিন।");
    return;
  }

  /*
    Temporary registration data.
    Final student record is created ONLY after backend
    confirms the ৳30 payment.
  */

  sessionStorage.setItem(
    "pendingRegistration",
    JSON.stringify({
      name,
      division,
      district,
      mobile,
      gmail
    })
  );

  $("registrationStep1").classList.add("hidden");
  $("registrationStep2").classList.remove("hidden");

});

/* =====================================================
   PAYMENT METHOD
===================================================== */

document.querySelectorAll(".method").forEach(btn => {

  btn.addEventListener("click", () => {

    const group = btn.dataset.method
      ? "registration"
      : "course";

    if(group === "registration"){

      selectedPaymentMethod = btn.dataset.method;

      document
        .querySelectorAll(".method")
        .forEach(x => x.classList.remove("active"));

      btn.classList.add("active");

    }

  });

});

document.querySelectorAll("[data-course-method]").forEach(btn => {

  btn.addEventListener("click", () => {

    selectedCoursePaymentMethod =
      btn.dataset.courseMethod;

    document
      .querySelectorAll("[data-course-method]")
      .forEach(x => x.classList.remove("active"));

    btn.classList.add("active");

  });

});

/* =====================================================
   COPY PAYMENT NUMBER
===================================================== */

$("copyRegistrationNumber").addEventListener("click", async () => {

  await navigator.clipboard.writeText(PAYMENT_NUMBER);

  toast("Number Copied");

});

$("copyCourseNumber").addEventListener("click", async () => {

  await navigator.clipboard.writeText(PAYMENT_NUMBER);

  toast("Number Copied");

});

/* =====================================================
   REGISTRATION PAYMENT
===================================================== */

$("registrationPayBtn").addEventListener("click", async () => {

  const txn = $("registrationTxn").value.trim();

  if(!txn){

    toast("Transaction ID দিন।");
    return;
  }

  const pending =
    JSON.parse(
      sessionStorage.getItem("pendingRegistration") || "null"
    );

  if(!pending){

    toast("Registration session পাওয়া যায়নি।");
    return;
  }

  const button = $("registrationPayBtn");

  button.disabled = true;
  button.textContent = "Verifying...";

  try{

    /*
      SECURITY:
      Transaction verification happens in Firebase
      Cloud Function, not in this public JS file.
    */

    const verifyRegistrationPayment =
      httpsCallable(
        functions,
        "verifyRegistrationPayment"
      );

    const result =
      await verifyRegistrationPayment({

        paymentMethod: selectedPaymentMethod,

        transactionId: txn,

        amount: REGISTRATION_FEE,

        name: pending.name,

        division: pending.division,

        district: pending.district,

        mobile: pending.mobile,

        gmail: pending.gmail

      });

    if(!result.data || !result.data.success){

      throw new Error(
        result.data?.message ||
        "Payment verification failed."
      );
    }

    const student = result.data.student;

    currentStudent = student;

    localStorage.setItem(
      "eCareRegistrationId",
      student.registrationId
    );

    sessionStorage.removeItem("pendingRegistration");

    $("successName").textContent =
      student.name;

    $("successRegistrationId").textContent =
      student.registrationId;

    $("registrationStep2").classList.add("hidden");

    $("registrationStep3").classList.remove("hidden");

    updateUI();

    toast("Registration Successful");

  }catch(error){

    console.error(error);

    toast(
      error.message ||
      "Payment verification failed."
    );

  }finally{

    button.disabled = false;
    button.textContent = "Verify Payment";

  }

});

/* =====================================================
   SUCCESS CONTINUE
===================================================== */

$("successContinue").addEventListener("click", () => {

  closeModal(registrationModal);

  updateUI();

});

/* =====================================================
   COURSE BUTTONS
===================================================== */

document.querySelectorAll(".course-btn").forEach(btn => {

  btn.addEventListener("click", async () => {

    const courseId = btn.dataset.course;

    /*
      Registration ছাড়া কোনো course-এর payment
      করা যাবে না।
    */

    if(!currentStudent){

      toast("আগে Registration ID দিয়ে Login করুন।");

      openModal(loginModal);

      return;
    }

    const course = COURSES[courseId];

    if(!course) return;

    const status =
      currentStudent.courses?.[courseId];

    if(status === "free"){

      toast("এই কোর্সটি আপনার জন্য Free.");

      return;
    }

    selectedCourse = courseId;

    $("coursePaymentTitle").textContent =
      course.name;

    $("coursePaymentPrice").textContent =
      `Course Fee: ৳${course.price.toLocaleString("en-US")}`;

    $("courseTxn").value = "";

    openModal(coursePaymentModal);

  });

});

/* =====================================================
   COURSE PAYMENT
===================================================== */

$("coursePayBtn").addEventListener("click", async () => {

  if(!currentStudent){

    toast("আগে Login করুন।");
    return;
  }

  if(!selectedCourse) return;

  const txn = $("courseTxn").value.trim();

  if(!txn){

    toast("Transaction ID দিন।");
    return;
  }

  const course = COURSES[selectedCourse];

  const button = $("coursePayBtn");

  button.disabled = true;
  button.textContent = "Verifying...";

  try{

    const verifyCoursePayment =
      httpsCallable(
        functions,
        "verifyCoursePayment"
      );

    const result =
      await verifyCoursePayment({

        registrationId:
          currentStudent.registrationId,

        courseId:
          selectedCourse,

        paymentMethod:
          selectedCoursePaymentMethod,

        transactionId:
          txn,

        amount:
          course.price

      });

    if(!result.data || !result.data.success){

      throw new Error(
        result.data?.message ||
        "Payment verification failed."
      );
    }

    currentStudent =
      result.data.student;

    localStorage.setItem(
      "eCareRegistrationId",
      currentStudent.registrationId
    );

    closeModal(coursePaymentModal);

    updateUI();

    toast(`${course.name} এখন Free.`);

  }catch(error){

    console.error(error);

    toast(
      error.message ||
      "Payment verification failed."
    );

  }finally{

    button.disabled = false;
    button.textContent = "Verify Payment";

  }

});

/* =====================================================
   3 DOT MENU
===================================================== */

$("menuBtn").addEventListener("click", () => {

  if(!currentStudent){

    openModal(loginModal);

    return;
  }

  updateAccountMenu();

  accountMenu.classList.remove("hidden");

});

$("menuClose").addEventListener("click", () => {

  accountMenu.classList.add("hidden");

});

/* =====================================================
   LOGIN
===================================================== */

$("loginBtn").addEventListener("click", async () => {

  const registrationId =
    $("loginRegistrationId")
      .value
      .trim()
      .toUpperCase();

  if(!/^EC\d{5}$/.test(registrationId)){

    toast("সঠিক Registration ID দিন।");
    return;
  }

  const button = $("loginBtn");

  button.disabled = true;
  button.textContent = "Checking...";

  try{

    const loginStudent =
      httpsCallable(
        functions,
        "loginStudent"
      );

    const result =
      await loginStudent({
        registrationId
      });

    if(!result.data || !result.data.success){

      throw new Error(
        result.data?.message ||
        "Registration ID পাওয়া যায়নি।"
      );
    }

    currentStudent =
      result.data.student;

    localStorage.setItem(
      "eCareRegistrationId",
      currentStudent.registrationId
    );

    closeModal(loginModal);

    updateUI();

    toast("Login Successful");

  }catch(error){

    console.error(error);

    toast(
      "Invalid Registration ID"
    );

  }finally{

    button.disabled = false;
    button.textContent = "Login";

  }

});

/* =====================================================
   ACCOUNT MENU
===================================================== */

function updateAccountMenu(){

  if(!currentStudent) return;

  $("accountName").textContent =
    currentStudent.name;

  $("accountRegistrationId").textContent =
    currentStudent.registrationId;

  $("accountSerial").textContent =
    currentStudent.serial;

  $("accountTotalStudents").textContent =
    currentStudent.totalStudents;

}

/* =====================================================
   LOGOUT
===================================================== */

$("logoutBtn").addEventListener("click", () => {

  currentStudent = null;

  localStorage.removeItem(
    "eCareRegistrationId"
  );

  accountMenu.classList.add("hidden");

  updateUI();

  toast("Logout Successful");

});

/* =====================================================
   UPDATE UI
===================================================== */

function updateUI(){

  document.querySelectorAll(".course-btn")
    .forEach(btn => {

      const courseId = btn.dataset.course;

      btn.classList.remove("free");

      if(
        currentStudent &&
        currentStudent.courses &&
        currentStudent.courses[courseId] === "free"
      ){

        btn.textContent = "Free";
        btn.classList.add("free");

      }else{

        btn.textContent = "Paid";

      }

    });

  if(currentStudent){

    $("registerBtn").textContent =
      `ID: ${currentStudent.registrationId}`;

    $("whatsappBtn").disabled = false;

  }else{

    $("registerBtn").textContent =
      "Registration";

    $("whatsappBtn").disabled = true;

  }

}

/* =====================================================
   RESET REGISTRATION
===================================================== */

function resetRegistration(){

  $("registrationStep1")
    .classList.remove("hidden");

  $("registrationStep2")
    .classList.add("hidden");

  $("registrationStep3")
    .classList.add("hidden");

  $("registrationForm").reset();

  $("registrationTxn").value = "";

}

/* =====================================================
   WHATSAPP
===================================================== */

$("whatsappBtn").addEventListener("click", () => {

  if(!currentStudent){

    toast("আগে Registration/Login করুন।");
    return;
  }

  window.open(
    `https://wa.me/${WHATSAPP_NUMBER}`,
    "_blank"
  );

});

/* =====================================================
   LOAD EXISTING SESSION
===================================================== */

async function loadExistingSession(){

  const registrationId =
    localStorage.getItem(
      "eCareRegistrationId"
    );

  if(!registrationId) return;

  try{

    const loginStudent =
      httpsCallable(
        functions,
        "loginStudent"
      );

    const result =
      await loginStudent({
        registrationId
      });

    if(result.data?.success){

      currentStudent =
        result.data.student;

      updateUI();

    }else{

      localStorage.removeItem(
        "eCareRegistrationId"
      );

    }

  }catch(error){

    console.error(error);

    localStorage.removeItem(
      "eCareRegistrationId"
    );

  }

}

/* =====================================================
   START
===================================================== */

updateUI();
loadExistingSession();

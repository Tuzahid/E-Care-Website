/* =========================================================
   E-CARE WEBSITE
   Student Serial starts from 1000
   Registration Number is unique locally
   ========================================================= */

const $ = selector => document.querySelector(selector);

const $$ = selector => document.querySelectorAll(selector);


/* =========================
   BASIC SETTINGS
========================= */

const PAYMENT_NUMBER = "01797937668";

const WHATSAPP_NUMBER = "8801745221602";

const WHATSAPP_MESSAGE =
  "ধন্যবাদ স্যার আপনার রেজিস্ট্রেশন কমপ্লিট হয়েছে। " +
  "আপনার ক্লাসের সময় আমাদের অফিসিয়াল হোয়াটসঅ্যাপ এর মাধ্যমে জানিয়ে দেয়া হবে। " +
  "ধন্যবাদ";


/* =========================
   STORAGE HELPERS
========================= */

function loadArray(key){

  try{

    return JSON.parse(
      localStorage.getItem(key) || "[]"
    );

  }catch(error){

    return [];

  }

}


function loadObject(key){

  try{

    return JSON.parse(
      localStorage.getItem(key) || "null"
    );

  }catch(error){

    return null;

  }

}


/* =========================
   STATE
========================= */

const state = {

  students:
    loadArray("ecare_students"),

  purchases:
    loadArray("ecare_purchases"),

  next:
    1000,

  verified:
    loadObject("ecare_verified")

};


/* =========================
   SERIAL SYSTEM
========================= */

function extractSerial(id){

  const match = String(id || "")
    .match(/EC-2026-(\d+)/i);

  return match
    ? Number(match[1])
    : 0;

}


function maxUsedSerial(){

  return [

    ...state.students,

    ...state.purchases

  ].reduce(

    (max,item) =>
      Math.max(
        max,
        extractSerial(item.id)
      ),

    999

  );

}


const savedNext =
  Number(
    localStorage.getItem(
      "ecare_next_serial"
    ) || 1000
  );


state.next =
  Math.max(
    1000,
    savedNext,
    maxUsedSerial() + 1
  );


/* =========================
   SAVE DATA
========================= */

function save(){

  localStorage.setItem(
    "ecare_students",
    JSON.stringify(state.students)
  );

  localStorage.setItem(
    "ecare_purchases",
    JSON.stringify(state.purchases)
  );

  localStorage.setItem(
    "ecare_next_serial",
    String(state.next)
  );

  localStorage.setItem(
    "ecare_verified",
    JSON.stringify(state.verified)
  );

}


/* =========================
   LOGIN
========================= */

function getLoggedIn(){

  return loadObject(
    "ecare_logged_in"
  );

}


function setLoggedIn(student){

  if(student){

    localStorage.setItem(
      "ecare_logged_in",
      JSON.stringify(student)
    );

  }else{

    localStorage.removeItem(
      "ecare_logged_in"
    );

  }

}


/* =========================
   ACCOUNT UI
========================= */

function updateAccountUI(){

  const student =
    getLoggedIn();

  const button =
    $("#registerTopBtn");

  if(!button) return;


  if(student){

    button.textContent =
      student.id;

    button.classList.add(
      "logged-in"
    );

    button.title =
      "Student Account / Logout";

  }else{

    button.textContent =
      "👤 Registration";

    button.classList.remove(
      "logged-in"
    );

    button.title =
      "Registration";

  }

}


/* =========================
   MODALS
========================= */

function openModal(id){

  const modal =
    $("#" + id);

  if(modal){

    modal.classList.add(
      "show"
    );

  }

}


function closeModals(){

  $$(".modal")
    .forEach(
      modal =>
        modal.classList.remove(
          "show"
        )
    );

}


$$(".close").forEach(button => {

  button.addEventListener(
    "click",
    closeModals
  );

});


$$(".modal").forEach(modal => {

  modal.addEventListener(
    "click",
    event => {

      if(
        event.target === modal
      ){

        modal.classList.remove(
          "show"
        );

      }

    }
  );

});


/* =========================
   TOAST
========================= */

function toast(message){

  const element =
    $("#toast");

  element.textContent =
    message;

  element.classList.add(
    "show"
  );

  setTimeout(
    () =>
      element.classList.remove(
        "show"
      ),
    3000
  );

}


/* =========================
   WHATSAPP
========================= */

function openWhatsApp(message){

  const url =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${
      encodeURIComponent(message)
    }`;

  window.open(
    url,
    "_blank"
  );

}


/* =========================
   HEADER BUTTONS
========================= */

$("#registerTopBtn").onclick =
  () => {

    const loggedIn =
      getLoggedIn();

    if(loggedIn){

      $("#accountStudentId")
        .textContent =
        loggedIn.id;

      $("#accountRegistrationNo")
        .textContent =
        loggedIn.registrationNumber || "—";

      openModal(
        "accountModal"
      );

    }else{

      openModal(
        "registerModal"
      );

    }

  };


$("#verifyTopBtn").onclick =
  () =>
    openModal(
      "verifyModal"
    );


$("#infoWaBtn").onclick =
  () =>
    openWhatsApp(
      WHATSAPP_MESSAGE
    );


$("#footerVerify").onclick =
  event => {

    event.preventDefault();

    openModal(
      "verifyModal"
    );

  };


$("#footerContact").onclick =
  event => {

    event.preventDefault();

    openWhatsApp(
      WHATSAPP_MESSAGE
    );

  };


/* =========================
   SERIAL DISPLAY
========================= */

function updateSerialDisplay(){

  const next =
    state.next;

  const top =
    $("#serialTop");

  const hero =
    $("#serialHero");

  if(top)
    top.textContent =
      next;

  if(hero)
    hero.textContent =
      next;

}


updateSerialDisplay();


/* =========================
   UNIQUE RANDOM CODE
========================= */

function randomCode(){

  if(
    window.crypto &&
    window.crypto.getRandomValues
  ){

    const array =
      new Uint32Array(1);

    window.crypto.getRandomValues(
      array
    );

    return array[0]
      .toString(36)
      .slice(-5)
      .toUpperCase()
      .padStart(5,"0");

  }


  return Math.random()
    .toString(36)
    .slice(2,7)
    .toUpperCase();

}


/* =========================
   UNIQUE REGISTRATION NUMBER
========================= */

function makeRegistrationNumber(
  serial
){

  let number;

  do{

    number =
      `REG-2026-${String(serial)
        .padStart(4,"0")}-${randomCode()}`;

  }while(

    state.students.some(
      student =>
        student.registrationNumber === number
    )

    ||

    state.purchases.some(
      purchase =>
        purchase.registrationNumber === number
    )

  );


  return number;

}


/* =========================
   UNIQUE STUDENT ID
========================= */

function makeStudentId(){

  while(true){

    const serial =
      state.next;

    state.next++;

    const id =
      `EC-2026-${String(serial)
        .padStart(7,"0")}`;


    const alreadyUsed =
      state.students.some(
        student =>
          student.id === id
      )

      ||

      state.purchases.some(
        purchase =>
          purchase.id === id
      );


    if(!alreadyUsed){

      return {
        id,
        serial
      };

    }

  }

}


/* =========================
   REGISTRATION STEP SYSTEM
========================= */

$$(".next-step")
  .forEach(button => {

    button.onclick =
      () => {

        const name =
          $("#regName").value.trim();

        const phone =
          $("#regPhone").value.trim();

        if(!name){

          toast(
            "আপনার পূর্ণ নাম দিন।"
          );

          return;

        }


        if(!phone){

          toast(
            "আপনার মোবাইল নম্বর দিন।"
          );

          return;

        }


        $("[data-step='1']")
          .classList
          .remove("active");

        $("[data-step='2']")
          .classList
          .add("active");


        $$(".progress span")
          .forEach(
            span =>
              span.classList.remove(
                "active"
              )
          );

        $$(".progress span")[1]
          .classList
          .add("active");

      };

  });


$(".back-step").onclick =
  () => {

    $("[data-step='2']")
      .classList
      .remove("active");

    $("[data-step='1']")
      .classList
      .add("active");

    $$(".progress span")
      .forEach(
        span =>
          span.classList.remove(
            "active"
          )
      );

    $$(".progress span")[0]
      .classList
      .add("active");

  };


/* =========================
   REGISTRATION
========================= */

$("#regForm").onsubmit =
  event => {

    event.preventDefault();


    const name =
      $("#regName")
        .value
        .trim();

    const phone =
      $("#regPhone")
        .value
        .trim();

    const email =
      $("#regEmail")
        .value
        .trim();

    const course =
      $("#regCourse")
        .value;

    const transactionId =
      $("#txId")
        .value
        .trim();


    if(
      !name ||
      !phone ||
      !transactionId
    ){

      toast(
        "সব প্রয়োজনীয় তথ্য পূরণ করুন।"
      );

      return;

    }


    const student =
      makeStudentId();


    const registrationNumber =
      makeRegistrationNumber(
        student.serial
      );


    const record = {

      id:
        student.id,

      registrationNumber:

        registrationNumber,

      serial:
        student.serial,

      name:
        name,

      phone:
        phone,

      email:
        email,

      course:
        course,

      tx:
        transactionId,

      paid:
        30,

      registration:
        true,

      createdAt:
        new Date().toISOString()

    };


    state.students.push(
      record
    );

    state.verified =
      record;


    save();

    updateSerialDisplay();


    $("#newStudentId")
      .textContent =
      record.id;


    $("#newRegistrationNo")
      .textContent =
      record.registrationNumber;


    $("#newCourse")
      .textContent =
      record.course;


    $("[data-step='2']")
      .classList
      .remove("active");

    $("#successPane")
      .classList
      .add("active");


    $$(".progress span")
      .forEach(
        span =>
          span.classList.remove(
            "active"
          )
      );

    $$(".progress span")[2]
      .classList
      .add("active");


    toast(
      "Registration সফল হয়েছে।"
    );

  };


/* =========================
   SUCCESS VERIFY
========================= */

$("#successVerify").onclick =
  () => {

    const id =
      $("#newStudentId")
        .textContent;

    closeModals();

    $("#modalVerifyId")
      .value =
      id;

    openModal(
      "verifyModal"
    );

    verifyStudent(
      id
    );

  };


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(value){

  return String(value)
    .replace(
      /[&<>"']/g,
      character => {

        const map = {

          "&":"&amp;",
          "<":"&lt;",
          ">":"&gt;",
          '"':"&quot;",
          "'":"&#039;"

        };

        return map[
          character
        ];

      }
    );

}


/* =========================
   FIND STUDENT
========================= */

function findRecord(
  input
){

  const query =
    String(input || "")
      .trim()
      .toUpperCase();

  if(!query)
    return null;


  return [

    ...state.students,

    ...state.purchases

  ].find(
    record =>

      String(
        record.id || ""
      ).toUpperCase()
      === query

      ||

      String(
        record.registrationNumber || ""
      ).toUpperCase()
      === query

  ) || null;

}


/* =========================
   FREE COURSE
========================= */

function setCourseFree(
  course,
  lock = false
){

  $$(".course-card")
    .forEach(card => {

      const title =
        card
          .querySelector("h3")
          ?.textContent
          .trim();


      if(title !== course)
        return;


      card.classList.add(
        "free-unlocked"
      );


      if(lock){

        card.classList.add(
          "locked"
        );

      }


      const button =
        card.querySelector(
          ".course-pay,.tag"
        );


      const price =
        card.querySelector(
          ".course-foot>b"
        );


      if(button){

        button.textContent =
          "Free";

        button.classList.remove(
          "paid"
        );

        button.classList.add(
          "unlocked"
        );

        button.disabled =
          true;

      }


      if(price){

        price.textContent =
          "৳ Free";

      }

    });

}


/* =========================
   VERIFY
========================= */

function verifyStudent(
  input
){

  const record =
    findRecord(input);


  if(!record){

    $("#verifyResult")
      .innerHTML = `

        <div
          class="verified"
          style="
            color:#b14d32;
            background:#fff1ed;
          "
        >

          ❌ Student ID / Registration Number
          পাওয়া যায়নি।

        </div>

      `;

    return;

  }


  state.verified =
    record;

  save();


  setLoggedIn(
    record
  );

  updateAccountUI();


  /*
    Registration verification:
    AI Web Development এবং
    Digital Marketing Free + Locked
  */

  if(
    record.course &&
    record.paid !== 30
  ){

    setCourseFree(
      record.course
    );

  }else{

    setCourseFree(
      "AI Web Development",
      true
    );

    setCourseFree(
      "Digital Marketing",
      true
    );

  }


  const studentId =
    record.id;

  const registrationNumber =
    record.registrationNumber ||
    "—";


  const name =
    record.name
      ? `নাম: ${escapeHTML(record.name)}<br>`
      : `Course: ${escapeHTML(record.course)}<br>`;


  const whatsappText =
    WHATSAPP_MESSAGE +
    "\nStudent ID: " +
    studentId;


  $("#verifyResult")
    .innerHTML = `

      <div class="verified">

        <b>
          ✓ Verified & Authentic
        </b>

        <br>

        ${name}

        Student ID:
        ${escapeHTML(studentId)}

        <br>

        Registration No:
        ${escapeHTML(registrationNumber)}

        <br>

        <a
          href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}"
          target="_blank"
          rel="noopener"
        >
          💬 Official WhatsApp চালু করুন →
        </a>

      </div>

    `;


  toast(
    "Verification সফল হয়েছে।"
  );

}


/* =========================
   VERIFY BUTTONS
========================= */

$("#verifyBtn").onclick =
  () =>
    verifyStudent(
      $("#verifyId").value
    );


$("#verifyBtn2").onclick =
  () =>
    verifyStudent(
      $("#verifyId2").value
    );


$("#modalVerifyBtn").onclick =
  () =>
    verifyStudent(
      $("#modalVerifyId").value
    );


/* =========================
   COURSE PAYMENT
========================= */

$$(".course-pay")
  .forEach(button => {

    button.onclick =
      () => {

        if(button.disabled)
          return;


        $("#purchaseTitle")
          .textContent =
          button.dataset.course;


        $("#purchasePrice")
          .textContent =
          "৳ " +
          Number(
            button.dataset.price
          ).toLocaleString("en-US");


        $("#coursePayConfirm")
          .dataset.course =
          button.dataset.course;


        $("#coursePayConfirm")
          .dataset.price =
          button.dataset.price;


        $("#coursePayResult")
          .innerHTML =
          "";


        $("#courseTxId")
          .value =
          "";


        openModal(
          "purchaseModal"
        );

      };

  });


/* =========================
   COURSE PAYMENT SUBMIT
========================= */

$("#coursePayConfirm").onclick =
  () => {

    const transactionId =
      $("#courseTxId")
        .value
        .trim();


    if(!transactionId){

      toast(
        "Send Money করার পরে Transaction ID দিন।"
      );

      return;

    }


    const course =
      $("#coursePayConfirm")
        .dataset.course;


    const price =
      Number(
        $("#coursePayConfirm")
          .dataset.price
      );


    const student =
      makeStudentId();


    const registrationNumber =
      makeRegistrationNumber(
        student.serial
      );


    const purchase = {

      id:
        student.id,

      registrationNumber:
        registrationNumber,

      serial:
        student.serial,

      course:
        course,

      price:
        price,

      tx:
        transactionId,

      paid:
        true,

      createdAt:
        new Date().toISOString()

    };


    state.purchases.push(
      purchase
    );


    save();

    updateSerialDisplay();


    $("#coursePayResult")
      .innerHTML = `

        <div class="verified">

          <b>
            ✓ Payment Submitted
          </b>

          <br>

          Student ID:
          <strong>
            ${escapeHTML(student.id)}
          </strong>

          <br>

          Registration No:
          <strong>
            ${escapeHTML(registrationNumber)}
          </strong>

          <br>

          Course:
          ${escapeHTML(course)}

          <br>

          Paid:
          ৳${price.toLocaleString("en-US")}

          <br><br>

          এই Student ID অথবা
          Registration Number
          Verify & Login-এ দিন।

        </div>

      `;


    toast(
      "Student ID তৈরি হয়েছে।"
    );

  };


/* =========================
   ACCOUNT WHATSAPP
========================= */

$("#accountWhatsapp").onclick =
  () => {

    const student =
      getLoggedIn();

    if(!student)
      return;


    openWhatsApp(

      WHATSAPP_MESSAGE +
      "\nStudent ID: " +
      student.id

    );

  };


/* =========================
   LOGOUT
========================= */

$("#logoutBtn").onclick =
  () => {

    setLoggedIn(
      null
    );

    state.verified =
      null;

    save();

    updateAccountUI();

    closeModals();


    toast(
      "Student account থেকে Logout করা হয়েছে।"
    );

  };


/* =========================
   COPY PAYMENT NUMBER
========================= */

async function copyPaymentNumber(){

  try{

    await navigator
      .clipboard
      .writeText(
        PAYMENT_NUMBER
      );

    toast(
      "Payment নম্বর কপি হয়েছে।"
    );

  }catch(error){

    toast(
      "Payment নম্বর: " +
      PAYMENT_NUMBER
    );

  }

}


$("#copyPaymentNumber")
  ?.addEventListener(
    "click",
    copyPaymentNumber
  );


$("#copyCoursePayment")
  ?.addEventListener(
    "click",
    copyPaymentNumber
  );


/* =========================
   EXISTING LOGIN RESTORE
========================= */

const existingLogin =
  getLoggedIn();


if(existingLogin){

  updateAccountUI();


  if(
    existingLogin.course &&
    existingLogin.paid !== 30
  ){

    setCourseFree(
      existingLogin.course
    );

  }else{

    setCourseFree(
      "AI Web Development",
      true
    );

    setCourseFree(
      "Digital Marketing",
      true
    );

  }

}


/* =========================
   MENU
========================= */

$("#menuBtn")
  ?.addEventListener(
    "click",
    () => {

      const nav =
        document.querySelector(
          ".nav-actions"
        );


      if(!nav)
        return;


      nav.style.display =
        nav.style.display === "flex"
          ? "none"
          : "flex";

    }
  );


/* =========================
   FINAL INITIALIZATION
========================= */

updateSerialDisplay();

updateAccountUI();

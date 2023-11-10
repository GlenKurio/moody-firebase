/* === Imports === */
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

import {
  getFirestore,
  collection,
  addDoc,
  doc,
  //   setDoc,
  updateDoc,
  serverTimestamp,
  //   getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";

/* === Firebase Setup === */
const firebaseConfig = {
  apiKey: "AIzaSyCmCVW1-8tzzEeew7LC5H8dYS7j1VPEfkI",
  authDomain: "moody-scr.firebaseapp.com",
  projectId: "moody-scr",
  storageBucket: "moody-scr.appspot.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

/* === UI === */

/* == UI - Elements == */

const viewLoggedOut = document.getElementById("logged-out-view");
const viewLoggedIn = document.getElementById("logged-in-view");

const signInWithGoogleButtonEl = document.getElementById(
  "sign-in-with-google-btn"
);

const emailInputEl = document.getElementById("email-input");
const passwordInputEl = document.getElementById("password-input");

const signInButtonEl = document.getElementById("sign-in-btn");
const createAccountButtonEl = document.getElementById("create-account-btn");
const signOutButtonEl = document.getElementById("sign-out-btn");

const userProfilePictureEl = document.getElementById("user-profile-picture");

const userGreetingEl = document.getElementById("user-greeting");

const displayNameInputEl = document.getElementById("display-name-input");
const photoURLInputEl = document.getElementById("photo-url-input");
const updateProfileButtonEl = document.getElementById("update-profile-btn");

const moodEmojiEls = document.getElementsByClassName("mood-emoji-btn");

const textareaEl = document.getElementById("post-input");
const postButtonEl = document.getElementById("post-btn");

// const fetchPostsButtonEl = document.getElementById("fetch-posts-btn");
const allFilterButtonEl = document.getElementById("all-filter-btn");

const filterButtonEls = document.getElementsByClassName("filter-btn");

const postsEl = document.getElementById("posts");

/* == UI - Event Listeners == */

signInWithGoogleButtonEl.addEventListener("click", authSignInWithGoogle);

signInButtonEl.addEventListener("click", authSignInWithEmail);
createAccountButtonEl.addEventListener("click", authCreateAccountWithEmail);

signOutButtonEl.addEventListener("click", authSignOut);

updateProfileButtonEl.addEventListener("click", authUpdateProfile);

for (let moodEmojiEl of moodEmojiEls) {
  moodEmojiEl.addEventListener("click", selectMood);
}

for (let filterButtonEl of filterButtonEls) {
  filterButtonEl.addEventListener("click", selectFilter);
}

postButtonEl.addEventListener("click", postButtonPressed);

// fetchPostsButtonEl.addEventListener("click", fetchOnceAndRenderPostsFromDB);

/* === State === */

let moodState = 0;

/* === Global Consts === */

const postsCollection = "posts";

/* === Main Code === */

onAuthStateChanged(auth, (user) => {
  if (user) {
    showLoggedInView();
    showProfilePicture(userProfilePictureEl, user);
    showUserGreeting(userGreetingEl, user);
    updateFilterButtonStyle(allFilterButtonEl);
    fetchAllPosts(user);
    // fetchInRealtimeAndRenderPostsFromDB(user);
  } else {
    showLoggedOutView();
  }
});

/* === Functions === */

/* = Functions - Firebase - Authentication = */

// provider.setCustomParameters({
//   prompt: "select_account",
// });

function authSignInWithGoogle() {
  signInWithPopup(auth, googleProvider)
    .then((result) => {
      console.log("signed in with google");
    })
    .catch((error) => {
      console.log(error.message);
    });
}

function authSignInWithEmail() {
  const email = emailInputEl.value;
  const password = passwordInputEl.value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("Sign in with email and password");
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage);
    });
}

function authCreateAccountWithEmail() {
  const email = emailInputEl.value;
  const password = passwordInputEl.value;
  console.log(email, password);

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log(userCredential);
      clearAuthFields();
    })
    .catch((error) => {
      const errorCode = error.errorCode;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage);
    });
}

function authSignOut() {
  signOut(auth)
    .then(() => {
      console.log("Signed Out successfully");
      clearAuthFields();
    })
    .catch((error) => {
      console.log(error.message);
    });
}

function authUpdateProfile() {
  const newDisplayName = displayNameInputEl.value;
  const newPhotoURL =
    photoURLInputEl.value || "https://i.imgur.com/6GYlSed.jpg";

  updateProfile(auth.currentUser, {
    displayName: newDisplayName,
    photoURL: newPhotoURL,
  })
    .then(() => {
      showUserGreeting(userGreetingEl, auth.currentUser);
      showProfilePicture(userProfilePictureEl, auth.currentUser);
    })
    .catch((error) => {
      console.log(error.message);
    });
}

/* = Functions - Firebase - Cloud Firestore = */

async function addPostToDB(postBody, user) {
  try {
    const docRef = await addDoc(collection(db, postsCollection), {
      body: postBody,
      user: user.uid,
      createdAt: serverTimestamp(),
      mood: moodState,
    });

    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
  //   try {
  //     await setDoc(doc(db, "posts", "post01"), {
  //       body: postBody,
  //     });
  //   } catch (e) {
  //     console.log(e.message);
  //   }
}

async function updatePostInDB(docId, newBody) {
  const docRef = doc(db, postsCollection, docId);

  await updateDoc(docRef, {
    body: newBody,
  });
  /* Challenge:
        Import updateDoc and doc from 'firebase/firestore'
        
        Use the code from the documentation to make this function work.
        
        The function should update the correct post in the database using the docId.
        
        The body field should be updated with newBody as the new value.
     */
}

// -------- FOR FETCH BUTTON -------------
// async function fetchOnceAndRenderPostsFromDB() {
//   const querySnapshot = await getDocs(collection(db, "posts"));
//   clearAll(postsEl);
//   querySnapshot.forEach((doc) => {
//     const { createdAt, body, mood } = doc.data();
//     renderPost(postsEl, { createdAt, body, mood });
//   });
// }

function fetchInRealtimeAndRenderPostsFromDB(query, user) {
  onSnapshot(query, (querySnapshot) => {
    clearAll(postsEl);
    querySnapshot.forEach((doc) => {
      renderPost(postsEl, doc);
    });
  });
}

function fetchTodayPosts(user) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const postsRef = collection(db, postsCollection);

  const q = query(
    postsRef,
    where("user", "==", user.uid),
    where("createdAt", ">=", startOfDay),
    where("createdAt", "<=", endOfDay),
    orderBy("createdAt", "desc")
  );
  fetchInRealtimeAndRenderPostsFromDB(q, user);
}
function fetchWeekPosts(user) {
  const startOfWeek = new Date();
  startOfWeek.setHours(0, 0, 0, 0);

  if (startOfWeek.getDay() === 0) {
    // If today is Sunday
    startOfWeek.setDate(startOfWeek.getDate() - 6); // Go to previous Monday
  } else {
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  }

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const postsRef = collection(db, postsCollection);

  const q = query(
    postsRef,
    where("user", "==", user.uid),
    where("createdAt", ">=", startOfWeek),
    where("createdAt", "<=", endOfDay),
    orderBy("createdAt", "desc")
  );
  fetchInRealtimeAndRenderPostsFromDB(q, user);
}

function fetchMonthPosts(user) {
  const startOfMonth = new Date();
  startOfMonth.setHours(0, 0, 0, 0);
  startOfMonth.setDate(1);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const postsRef = collection(db, postsCollection);

  const q = query(
    postsRef,
    where("user", "==", user.uid),
    where("createdAt", ">=", startOfMonth),
    where("createdAt", "<=", endOfDay),
    orderBy("createdAt", "desc")
  );
  fetchInRealtimeAndRenderPostsFromDB(q, user);
}

function fetchAllPosts(user) {
  const postsRef = collection(db, postsCollection);

  const q = query(
    postsRef,
    where("user", "==", user.uid),
    orderBy("createdAt", "desc")
  );
  fetchInRealtimeAndRenderPostsFromDB(q, user);
}

/* == Functions - UI Functions == */

function createPostHeader(postData) {
  /*
        <div class="header">
        </div>
    */
  const headerDiv = document.createElement("div");
  headerDiv.className = "header";

  /* 
            <h3>21 Sep 2023 - 14:35</h3>
        */
  const headerDate = document.createElement("h3");
  headerDate.textContent = displayDate(postData.createdAt);
  headerDiv.appendChild(headerDate);

  /* 
            <img src="assets/emojis/5.png">
        */
  const moodImage = document.createElement("img");
  moodImage.src = `assets/emojis/${postData.mood}.png`;
  headerDiv.appendChild(moodImage);

  return headerDiv;
}

function createPostBody(postData) {
  /*
        <p>This is a post</p>
    */
  const postBody = document.createElement("p");
  postBody.innerHTML = replaceNewlinesWithBrTags(postData.body);

  return postBody;
}

function createPostUpdateButton(wholeDoc) {
  const postId = wholeDoc.id;
  const postData = wholeDoc.data();
  /* 
        <button class="edit-color">Edit</button>
    */
  const button = document.createElement("button");
  button.textContent = "Edit";
  button.classList.add("edit-color");
  button.addEventListener("click", function () {
    const newBody = prompt("Edit the post", postData.body);

    if (newBody) {
      console.log(newBody);
      updatePostInDB(postId, newBody);
    }
  });

  return button;
}

function createPostFooter(wholeDoc) {
  /* 
        <div class="footer">
            <button>Edit</button>
        </div>
    */
  const footerDiv = document.createElement("div");
  footerDiv.className = "footer";

  footerDiv.appendChild(createPostUpdateButton(wholeDoc));

  return footerDiv;
}

function renderPost(postsEl, wholeDoc) {
  const postData = wholeDoc.data();
  const postDiv = document.createElement("div");
  postDiv.className = "post";

  postDiv.appendChild(createPostHeader(postData));
  postDiv.appendChild(createPostBody(postData));
  postDiv.appendChild(createPostFooter(wholeDoc));

  postsEl.appendChild(postDiv);
}

function replaceNewlinesWithBrTags(inputString) {
  return inputString.replace(/\n/g, "<br>");
}

function postButtonPressed() {
  const postBody = replaceNewlinesWithBrTags(textareaEl.value);
  const user = auth.currentUser;

  if (postBody && moodState) {
    addPostToDB(postBody, user);
    clearInputField(textareaEl);
    resetAllMoodElements(moodEmojiEls);
  }
}

function clearAll(element) {
  element.innerHTML = "";
}

function showLoggedOutView() {
  hideView(viewLoggedIn);
  showView(viewLoggedOut);
}

function showLoggedInView() {
  hideView(viewLoggedOut);
  showView(viewLoggedIn);
}

function showView(view) {
  view.style.display = "flex";
}

function hideView(view) {
  view.style.display = "none";
}

function clearInputField(field) {
  field.value = "";
}

function clearAuthFields() {
  clearInputField(emailInputEl);
  clearInputField(passwordInputEl);
}

function showProfilePicture(imgElement, user) {
  const photoURL = user.photoURL;

  if (photoURL) {
    imgElement.src = photoURL;
  } else {
    imgElement.src = "assets/images/17-photo-room.png";
  }
}

function showUserGreeting(element, user) {
  const displayName = user.displayName;

  if (displayName) {
    const userFirstName = displayName.split(" ")[0];
    element.textContent = `Hey ${userFirstName}, how are you doing?`;
  } else {
    element.value = `Hey Friend, how are you doing?`;
  }
}

function displayDate(firebaseDate) {
  if (!firebaseDate) {
    return "Date not available";
  }
  const date = firebaseDate.toDate();

  const day = date.getDate();
  const year = date.getFullYear();

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];

  let hours = date.getHours();
  let minutes = date.getMinutes();
  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;

  return `${day} ${month} ${year} - ${hours}:${minutes}`;
}

/* = Functions - UI Functions - Mood = */

function selectMood(event) {
  const selectedMoodEmojiElementId = event.currentTarget.id;

  changeMoodsStyleAfterSelection(selectedMoodEmojiElementId, moodEmojiEls);

  const chosenMoodValue = returnMoodValueFromElementId(
    selectedMoodEmojiElementId
  );

  moodState = chosenMoodValue;
}

function changeMoodsStyleAfterSelection(
  selectedMoodElementId,
  allMoodElements
) {
  for (let moodEmojiEl of moodEmojiEls) {
    if (selectedMoodElementId === moodEmojiEl.id) {
      moodEmojiEl.classList.remove("unselected-emoji");
      moodEmojiEl.classList.add("selected-emoji");
    } else {
      moodEmojiEl.classList.remove("selected-emoji");
      moodEmojiEl.classList.add("unselected-emoji");
    }
  }
}

function resetAllMoodElements(allMoodElements) {
  for (let moodEmojiEl of allMoodElements) {
    moodEmojiEl.classList.remove("selected-emoji");
    moodEmojiEl.classList.remove("unselected-emoji");
  }

  moodState = 0;
}

function returnMoodValueFromElementId(elementId) {
  return Number(elementId.slice(5));
}

/* == Functions - UI Functions - Date Filters == */

function resetAllFilterButtons(allFilterButtons) {
  for (let filterButtonEl of allFilterButtons) {
    filterButtonEl.classList.remove("selected-filter");
  }
}

function updateFilterButtonStyle(element) {
  element.classList.add("selected-filter");
}

function fetchPostsFromPeriod(period, user) {
  if (period === "today") {
    fetchTodayPosts(user);
  } else if (period === "week") {
    fetchWeekPosts(user);
  } else if (period === "month") {
    fetchMonthPosts(user);
  } else {
    fetchAllPosts(user);
  }
}

function selectFilter(event) {
  const user = auth.currentUser;

  const selectedFilterElementId = event.target.id;

  const selectedFilterPeriod = selectedFilterElementId.split("-")[0];

  const selectedFilterElement = document.getElementById(
    selectedFilterElementId
  );

  resetAllFilterButtons(filterButtonEls);

  updateFilterButtonStyle(selectedFilterElement);

  fetchPostsFromPeriod(selectedFilterPeriod, user);
}

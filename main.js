import { initializeApp } from "firebase/app";
import { signInWithPopup, onAuthStateChanged , getAuth, GoogleAuthProvider, signOut} from "firebase/auth";
import {getFirestore, getDocs, collection, query, orderBy, addDoc} from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCvCjlA8XsyJ8tWCTu3akf0EArqaorMFUY",
  authDomain: "cloud-55c2a.firebaseapp.com",
  projectId: "cloud-55c2a",
  storageBucket: "cloud-55c2a.appspot.com",
  messagingSenderId: "928187250550",
  appId: "1:928187250550:web:4d54785534f114994cec57"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();
const provider = new GoogleAuthProvider();

let user;
let foods;
let cart = []
let cartEl;
const appDiv = document.getElementById("app")

// This function will execute when user login or logout 
onAuthStateChanged(auth, (usr) => {
  if (usr) {
    user = usr
    showHomePage()
  } else{
    user = null
    document.getElementById('loading-spinner').remove()
    loginBtn.classList.toggle('d-none')
  }
});

const loginBtn = document.getElementById("login-btn")
loginBtn.addEventListener("click", () => {
  signInWithPopup(auth, provider).catch(() => alert("Something went wrong"))
})


function showHomePage(){
  const logoutBtn = document.createElement('button');
  const h1 = document.createElement('h1')
  logoutBtn.textContent = "logout"
  logoutBtn.classList.add("btn", "btn-secondary", "btn-sm")
  h1.textContent = `Welcome ${user.displayName}!`

  logoutBtn.onclick = () => {
    signOut(auth).then(() => window.location.reload())
  }

  //  header name and logout btn
  const headerDiv = document.createElement("div")
  headerDiv.append(h1, logoutBtn)
  headerDiv.classList.add("d-flex", "justify-content-between","align-items-center")

  // cart
  appDiv.innerHTML = ''
  appDiv.append(headerDiv)
  cartEl = document.createElement('div')
  cartEl.classList.add("d-flex", "flex-column", "align-items-end")
  cartEl.innerHTML = `
  <h3> Your Cart  </h3>
  <p> Empty! <p>
  `
  appDiv.append(cartEl)

  showFoods()
}


function reCreateCart(){
  let total = 0
  cartEl.innerHTML = ''
  const h3 = document.createElement('h3')
  h3.textContent = 'Your Cart'
  cartEl.append(h3)

  if(cart.length === 0){
    cartEl.innerHTML += `<p> Empty! <p>`
    return
  }

  cart.forEach(item => {
    const itemDiv = document.createElement('div')
    itemDiv.classList.add('text-end','mb-1')

    const span = document.createElement('span')
    span.classList.add('mr-3')
    span.textContent = `${item.name} Rs.${item.price} x ${item.qty} = ${item.price * item.qty}    `

    const minusBtn = document.createElement('button')
    minusBtn.textContent = '-'
    minusBtn.classList.add('btn','btn-sm','btn-danger','ml-2')

    minusBtn.addEventListener('click', () => {
      let newCart = []
      for(let cartItem of cart){
        if(cartItem.id === item.id){
          if(cartItem.qty > 1){
            cartItem.qty -= 1
            newCart.push(cartItem)
          }
        }
        else{
          newCart.push(cartItem)
        }
      }
      cart = newCart
      reCreateCart()
    }) // end of btn event listener

    itemDiv.append(span)
    itemDiv.append(minusBtn)
    total += item.price * item.qty
    cartEl.append(itemDiv)
  }) // end of creating each cart item

  const p = document.createElement('p')
  p.innerHTML = `<b>Total: </b> ${total}`
  cartEl.append(p)

  if(total > 0){
    const submitBtn = document.createElement('button')
    submitBtn.classList.add('btn','btn-success')
    submitBtn.textContent = 'Submit'
    submitBtn.onclick = () => {
    // send Order
      addDoc(collection(db, "transactions"), {
        uid:user.uid,
        displayName: user.displayName,
        total,
        cart
      }).then(() => {
        const div = document.createElement('div')
        div.classList.add('p-2', 'text-success')
        div.textContent = 'Order Placed'
        cartEl.append(div)
        setTimeout(() => { 
          cart = []
          reCreateCart()
        }, 3000)
      })
    }// end of submitBtn

    cartEl.append(submitBtn)
  } // end of total
}


function addToCart(food){
  console.log("Add to cart", food)
  let flag = false
  for(let item of cart){
    if(item.id === food.id){
      item.qty += 1
      flag = true
      break
    }
  }

  if(!flag){
    food.qty = 1
    cart.push(food)
  }
  reCreateCart()
}


function showFoods(){
  const q = query(
    collection(db, "food"),
    orderBy('name')
  )

  getDocs(q).then(snapshot => {
    foods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}))
    let div = document.createElement('div')
    div.classList.add("my-flex")

    foods.forEach(food => {
      let foodDiv = document.createElement("div")
      foodDiv.classList.add("p-3","border","rounded","mt-4", "mb-4", "shadow-sm")
      let addToBtn = document.createElement('button')
      addToBtn.classList.add("btn", "btn-sm", "btn-primary")
      addToBtn.textContent ="Add to Cart"
      addToBtn.addEventListener('click', () => { addToCart(food)})
      foodDiv.innerHTML = `
        <h3> ${food.name} </h3>
        <img width="200" height="200" class="" src="${food.imageURL}" />
        <p> Rs: ${food.price} </p>
      `
      foodDiv.append(addToBtn)
      div.append(foodDiv)
    })

    appDiv.append(div)
  })
}
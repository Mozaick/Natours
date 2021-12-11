/* eslint-disable*/
import '@babel/polyfill';

import { displayMap } from './mapbox';
import { login, logout } from './login';
import { signup } from './signup';
import { updateMyData } from './updateSettings';
import { updateMyPassword } from './updateSettings';
import { bookTour } from './stripe';

const mapBox = document.getElementById('map');

const loginForm = document.querySelector('.login-form');
const logoutBtn = document.querySelector('.nav__el--logout');

const signupForm = document.querySelector('.signup-form');
const userDataForm = document.querySelector('.form-user-data');
const userDataPasswordForm = document.querySelector('.form-user-password');

const bookBtn = document.getElementById('book-tour');

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}
if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (signupForm) {
  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password_confirm').value;
    signup(name, email, password, passwordConfirm);
  });
}

if (userDataForm) {
  userDataForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const photo = document.getElementById('photo').files[0];
    form.append('name', name);
    form.append('email', email);
    form.append('photo', photo);
    updateMyData(name, email, photo);
  });
}

if (userDataPasswordForm) {
  userDataPasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateMyPassword(currentPassword, password, passwordConfirm);

    document.querySelector('.btn--save-password').textContent = 'Save password';

    // Clear password fields
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}
if (bookBtn) {
  bookBtn.addEventListener('click', (event) => {
    event.target.textContent = 'Processing...';
    const { tourId } = event.target.dataset;
    bookTour(tourId);
  });
}
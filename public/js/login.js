/* eslint-disable*/
import axios from 'axios';

import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if (res.data.status === 'success') {
      showAlert(
        'success',
        `${res.data.data.user.name} logged in successfully!!`
      );
      window.setTimeout(() => {
        location.assign('/');
      }, 1200);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if (res.data.status === 'success') {
      location.reload(true);
    }
  } catch (err) {
    showAlert('error', 'Error Logged out! Try later');
  }
};

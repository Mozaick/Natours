/* eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';
export const updateMyData = async (name, email, photo) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/updateMy',
      data: {
        name,
        email,
        photo,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Data has been updated successfully!!');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const updateMyPassword = async (
  currentPassword,
  password,
  passwordConfirm
) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/updateMyPassword',
      data: {
        currentPassword,
        password,
        passwordConfirm,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Password has been updated successfully!!');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

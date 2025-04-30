import { showAlert } from './alerts.js';

const logOutBtn = document.querySelector('.nav__el--logout');

const logout = async () => {
  try {
    console.log('Click')
    const res = await axios({
      method: 'GET',
      url: `http://localhost:3000/api/v1/users/logout`,
    });
    if (res.data.status === 'success') {
      window.location.replace('/');
    }
  } catch (err) {
    showAlert('error', 'Error logging out! Try again.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (logOutBtn) {
    logOutBtn.addEventListener('click', async () => {
      await logout();
    });
  }
})
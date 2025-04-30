import { showAlert} from './alerts.js';

const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: `http://localhost:3000/api/v1/users/login`,
      data: {
        email,
        password
      }
    });
    if (res.data.status === 'success') {
      showAlert(res.data.status, 'Logged in successfully.');
      window.setTimeout(() => {
        window.location.replace('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}

document.addEventListener('DOMContentLoaded',  () => {
  document.querySelector('.form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    await login(email, password);
  });
});
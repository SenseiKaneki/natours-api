import { showAlert} from './alerts.js';

const editAccount = async (data) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `http://localhost:3000/api/v1/users/updateMe`,
      data
    })
    if (res.status === 200) {
      showAlert('success', `You successfully changed your Data!`);
      window.setTimeout(() => {
        location.reload(true);
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}
const updatePassword = async (passwordCurrent, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `http://localhost:3000/api/v1/users/updateMyPassword`,
      data: {
        passwordCurrent,
        password,
        passwordConfirm
      }
    });
    if (res.status === 200) {
      showAlert('success', `You successfully changed your password!`);
      window.setTimeout(() => {
        location.reload(true);
      }, 1500)
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.form-user-data').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = new FormData(); // We need to do this to accept photos (recreating enctype='multipart/form-data')
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    await editAccount(form);
  });
  document.querySelector('.form-user-settings').addEventListener('submit', async (e) => {
    e.preventDefault();

    const curPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    document.querySelector('#btn-save-password').textContent = 'Updating...';

    await updatePassword(curPassword, password, passwordConfirm);

    document.querySelector('#btn-save-password').textContent = 'Password updated!';

    window.setTimeout(() => {
      document.querySelector('#btn-save-password').textContent = 'Save Password';
    }, 1000)
  });
})
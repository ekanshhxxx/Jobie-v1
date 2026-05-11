// @ts-nocheck
import { clearAuth } from './api';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';

export const logout = async () => {
  try {
    // Firebase logout
    await signOut(auth);

    // Clear local storage
    clearAuth();

    // Redirect to register page
    window.location.href = '/register';
  } catch (err) {
    console.error('Logout failed', err);
  }
};



import { useState } from 'react';
import { AuthService } from '@/services/firebase/auth';
import { getUserFacingError } from '@/utils/userFacingError';
import type { AccountActionResult } from '../types';

export function useAccountSecurityActions(isTurkish: boolean) {
  const [pending, setPending] = useState(false);
  const failure = (error: unknown, tr: string, en: string): AccountActionResult => ({ ok: false, message: getUserFacingError(error, isTurkish, { tr, en }) });
  const run = async (action: () => Promise<AccountActionResult>): Promise<AccountActionResult> => { setPending(true); try { return await action(); } finally { setPending(false); } };

  const changeEmail = (email: string, password: string) => run(async () => {
    if (!email.includes('@')) return { ok: false, message: isTurkish ? 'Geçerli bir e-posta adresi gir.' : 'Enter a valid email address.' };
    if (!password) return { ok: false, message: isTurkish ? 'Mevcut şifreni gir.' : 'Enter your current password.' };
    try { await AuthService.reauthenticate(password); await AuthService.updateEmailAddress(email); return { ok: true, message: isTurkish ? `${email} adresine doğrulama bağlantısı gönderildi.` : `A verification link was sent to ${email}.` }; } catch (error) { return failure(error, 'E-posta doğrulama bağlantısı gönderilemedi.', 'The email verification link could not be sent.'); }
  });
  const changePassword = (current: string, next: string, confirmation: string) => run(async () => {
    if (!current) return { ok: false, message: isTurkish ? 'Mevcut şifreni gir.' : 'Enter your current password.' };
    if (next.length < 6) return { ok: false, message: isTurkish ? 'Yeni şifre en az 6 karakter olmalıdır.' : 'The new password must be at least 6 characters.' };
    if (next !== confirmation) return { ok: false, message: isTurkish ? 'Yeni şifreler eşleşmiyor.' : 'The new passwords do not match.' };
    try { await AuthService.reauthenticate(current); await AuthService.updateUserPassword(next); return { ok: true, message: isTurkish ? 'Şifre güncellendi.' : 'Password updated.' }; } catch (error) { return failure(error, 'Şifre güncellenemedi.', 'The password could not be updated.'); }
  });
  const resetPassword = (email: string) => run(async () => { if (!email) return { ok: false, message: isTurkish ? 'Hesaba bağlı e-posta bulunamadı.' : 'No account email was found.' }; try { await AuthService.sendPasswordResetEmail(email); return { ok: true, message: isTurkish ? `${email} adresine sıfırlama bağlantısı gönderildi.` : `A reset link was sent to ${email}.` }; } catch (error) { return failure(error, 'Şifre sıfırlama bağlantısı gönderilemedi.', 'The password reset link could not be sent.'); } });
  const deleteAccount = (password: string | null) => run(async () => { try { if (password !== null) { if (!password) return { ok: false, message: isTurkish ? 'Mevcut şifreni gir.' : 'Enter your current password.' }; await AuthService.reauthenticate(password); } await AuthService.deleteAccount(); return { ok: true, message: isTurkish ? 'Hesap silindi.' : 'Account deleted.' }; } catch (error) { return failure(error, 'Hesap silinemedi. Yeniden giriş yapıp tekrar dene.', 'The account could not be deleted. Sign in again and retry.'); } });
  return { pending, changeEmail, changePassword, resetPassword, deleteAccount };
}

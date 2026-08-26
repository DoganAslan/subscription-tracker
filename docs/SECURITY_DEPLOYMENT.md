# SubMate security deployment

The client no longer reads `GEMINI_API_KEY`. Online chat and receipt scanning now use authenticated callable functions in `europe-west1`.

## One-time Firebase setup

1. Sign in again because the local Firebase CLI session was revoked during the security audit:

   ```powershell
   npx firebase login
   ```

2. Select the SubMate Firebase project:

   ```powershell
   npx firebase use --add
   ```

3. Create a new Gemini API key, restrict it to the Gemini API where Google Cloud permits, and enter it interactively. Do not paste it into source code, `.env`, chat, or a command-line argument:

   ```powershell
   npx firebase functions:secrets:set GEMINI_API_KEY
   ```

4. Build and deploy the callable functions and hardened Firestore rules:

   ```powershell
   npm --prefix functions run build
   npx firebase deploy --only functions,firestore:rules
   ```

Cloud Functions, outbound Gemini requests, and Secret Manager may require the Firebase project to use the Blaze billing plan. Review the Firebase and Google Cloud billing screens before deployment.

## Post-deployment cleanup

1. Test authenticated AI chat and receipt scanning on a non-production account.
2. Delete the legacy `config/secrets` Firestore document from the Firebase Console.
3. Revoke the old Gemini API key that was stored in Firestore.
4. Confirm that `config/secrets` is denied from the client and that AI rate-limit documents are not readable.
5. Run `npm test` locally before each rules deployment.

## App Check

Callable functions currently require Firebase Authentication and enforce per-user rate limits. App Check enforcement should be enabled only after Android Play Integrity, Apple App Attest/DeviceCheck, and web reCAPTCHA Enterprise providers have been registered and verified; enabling enforcement first would lock out legitimate clients.


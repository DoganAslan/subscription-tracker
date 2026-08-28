/**
 * Compatibility entry point for subscription forms.
 *
 * Keep this import stable for routes and downstream consumers while the
 * implementation lives in the focused subscription-form module.
 */
export { SubscriptionForm } from './subscription-form/SubscriptionForm';
export type {
  SubscriptionFormProps,
  SubscriptionFormSubmit,
} from './subscription-form/SubscriptionForm.types';

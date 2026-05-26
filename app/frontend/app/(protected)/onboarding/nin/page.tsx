import { redirect } from 'next/navigation';

export default function NinOnboardingRedirect() {
  redirect('/verifications/nin');
}

import { redirect } from 'next/navigation';

export default function VerificationsRedirect() {
  redirect('/vendor/profile?tab=verifications');
}

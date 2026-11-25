import { LegalDocView } from '@/components/LegalDocView';
import { TERMS } from '@/legal/content';

export default function TermsScreen() {
  return <LegalDocView doc={TERMS} />;
}

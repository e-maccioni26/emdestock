import { Lock } from 'lucide-react-native';
import { tokens } from '@emd/shared';
import { StatusScreen } from '@/components/StatusScreen';

export default function AccesSuspendu() {
  return (
    <StatusScreen
      icon={<Lock size={32} strokeWidth={tokens.icon.stroke} color={tokens.color.ink} />}
      title="Accès suspendu"
      text="L’accès de votre entreprise est suspendu. Contactez EMD DESTOCK pour en savoir plus."
    />
  );
}

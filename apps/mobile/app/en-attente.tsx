import { View } from 'react-native';
import { Check, Clock } from 'lucide-react-native';
import { formatSiret, tokens } from '@emd/shared';
import { StatusScreen } from '@/components/StatusScreen';
import { Text } from '@/components/Text';
import { useSession } from '@/lib/session';

function Step({
  state,
  title,
  subtitle,
  last,
}: {
  state: 'done' | 'current' | 'todo';
  title: string;
  subtitle?: string;
  last?: boolean;
}) {
  const c = tokens.color;
  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      <View style={{ alignItems: 'center' }}>
        {state === 'done' ? (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: c.ink,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={12} strokeWidth={3} color={c.white} />
          </View>
        ) : state === 'current' ? (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: c.ink,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.ink }} />
          </View>
        ) : (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: c.borderStrong,
            }}
          />
        )}
        {last ? null : (
          <View
            style={{ width: 2, height: 28, backgroundColor: state === 'done' ? c.ink : c.border }}
          />
        )}
      </View>
      <View style={{ gap: 2, paddingTop: 2 }}>
        <Text
          style={{
            fontFamily: state === 'todo' ? 'Geist-Medium' : 'Geist-SemiBold',
            fontSize: 15,
            color: state === 'todo' ? c.textSecondary : c.ink,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text variant="secondary" style={{ color: c.textSecondary }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function EnAttente() {
  const { profile } = useSession();
  const c = tokens.color;
  return (
    <StatusScreen
      icon={<Clock size={32} strokeWidth={tokens.icon.stroke} color={c.ink} />}
      title="Demande envoyée"
      text="EMD DESTOCK vérifie vos informations. Vous recevrez un e-mail dès l’activation de votre compte."
    >
      <View
        style={{
          marginTop: 40,
          padding: 20,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: tokens.radius.block,
        }}
      >
        <Step state="done" title="Demande envoyée" subtitle={profile?.company?.legal_name} />
        <Step state="current" title="Vérification en cours" subtitle="Par l’équipe EMD DESTOCK" />
        <Step state="todo" title="Accès au catalogue" last />
      </View>
      <View
        style={{
          marginTop: 16,
          paddingHorizontal: 16,
          paddingVertical: 4,
          borderRadius: tokens.radius.block,
          backgroundColor: c.stone,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 44,
            borderBottomWidth: 1,
            borderBottomColor: c.border,
          }}
        >
          <Text variant="secondary" style={{ color: c.textSecondary }}>
            SIRET
          </Text>
          <Text variant="data">{profile?.company ? formatSiret(profile.company.siret) : ''}</Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 44,
          }}
        >
          <Text variant="secondary" style={{ color: c.textSecondary }}>
            E-mail
          </Text>
          <Text variant="secondary" style={{ color: c.ink }}>
            {profile?.email}
          </Text>
        </View>
      </View>
    </StatusScreen>
  );
}

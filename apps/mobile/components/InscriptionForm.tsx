import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';
import {
  isValidSiret,
  normalizeSiret,
  registerErrorMessage,
  tokens,
  validatePassword,
  verifySiretMessage,
  type VerifySiretCompany,
  type VerifySiretResponse,
} from '@emd/shared';
import { Button } from './Button';
import { Field } from './Field';
import { Text } from './Text';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/lib/session';

type Check =
  { state: 'idle' } | { state: 'loading' } | { state: 'ok' } | { state: 'error'; message: string };
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL;
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL;

const Legal = ({ label, url }: { label: string; url?: string }) =>
  url ? (
    <Text
      variant="secondary"
      onPress={() => Linking.openURL(url)}
      style={{ textDecorationLine: 'underline', color: tokens.color.ink }}
    >
      {label}
    </Text>
  ) : (
    <Text variant="secondary">{label}</Text>
  );

/** Formulaire de demande d'accès (maquette Inscription). `resume` : déjà connecté, sans e-mail ni mot de passe à saisir. */
export function InscriptionForm({ resume = false }: { resume?: boolean }) {
  const { session, refresh } = useSession();
  const [siret, setSiret] = useState('');
  const [check, setCheck] = useState<Check>({ state: 'idle' });
  const [company, setCompany] = useState<VerifySiretCompany>({
    legal_name: '',
    address: '',
    postal_code: '',
    city: '',
  });
  const [contact, setContact] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
  });
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>();
  const [busy, setBusy] = useState(false);

  // Vérification automatique dès que le SIRET est complet et valide.
  useEffect(() => {
    const clean = normalizeSiret(siret);
    if (clean.length < 14) return setCheck({ state: 'idle' });
    if (!isValidSiret(clean))
      return setCheck({ state: 'error', message: verifySiretMessage('invalid_format') });
    let cancelled = false;
    setCheck({ state: 'loading' });
    supabase.functions
      .invoke<VerifySiretResponse>('verify-siret', { body: { siret: clean } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data)
          return setCheck({ state: 'error', message: verifySiretMessage('unavailable') });
        if (!data.ok) return setCheck({ state: 'error', message: verifySiretMessage(data.code) });
        setCompany(data.company);
        setCheck({ state: 'ok' });
      });
    return () => {
      cancelled = true;
    };
  }, [siret]);

  const set = (k: keyof typeof contact) => (v: string) => setContact((c) => ({ ...c, [k]: v }));

  async function submit() {
    const e: Record<string, string> = {};
    if (!company.legal_name.trim()) e.legal_name = 'Champ requis.';
    if (!company.address.trim()) e.address = 'Champ requis.';
    if (!/^\d{5}$/.test(company.postal_code)) e.postal_code = '5 chiffres.';
    if (!company.city.trim()) e.city = 'Champ requis.';
    if (!contact.first_name.trim()) e.first_name = 'Champ requis.';
    if (!contact.last_name.trim()) e.last_name = 'Champ requis.';
    if (!resume) {
      if (!/^\S+@\S+\.\S+$/.test(contact.email.trim())) e.email = 'Adresse e-mail invalide.';
      const pwd = validatePassword(contact.password);
      if (pwd) e.password = pwd;
    }
    if (!accepted) e.accepted = 'Vous devez accepter les conditions pour continuer.';
    setErrors(e);
    setSubmitError(undefined);
    if (Object.keys(e).length) return;

    setBusy(true);
    // Si une tentative précédente a créé le compte mais échoué sur la demande, on réutilise la session.
    if (!resume && !session) {
      const { data, error } = await supabase.auth.signUp({
        email: contact.email.trim(),
        password: contact.password,
      });
      if (error || !data.session) {
        setBusy(false);
        return setSubmitError(
          error?.message.toLowerCase().includes('already')
            ? 'Un compte existe déjà avec cet e-mail. Connectez-vous.'
            : 'Création du compte impossible. Réessayez.',
        );
      }
    }
    const { error } = await supabase.rpc('register_company', {
      p_siret: normalizeSiret(siret),
      p_legal_name: company.legal_name.trim(),
      p_address: company.address.trim(),
      p_postal_code: company.postal_code.trim(),
      p_city: company.city.trim(),
      p_first_name: contact.first_name.trim(),
      p_last_name: contact.last_name.trim(),
      // Les types générés ne marquent pas p_phone nullable ; la fonction SQL l'accepte.
      p_phone: (contact.phone.trim() || null) as string,
    });
    setBusy(false);
    if (error) return setSubmitError(registerErrorMessage(error));
    await refresh(); // le garde d'accès redirige vers « Demande envoyée »
  }

  const siretError = check.state === 'error' ? check.message : undefined;
  return (
    <View style={{ gap: 28 }}>
      <View style={{ gap: 16 }}>
        <Text variant="section">Entreprise</Text>
        <View style={{ gap: 6 }}>
          <Field
            label="SIRET"
            mono
            value={siret}
            onChangeText={(v) => setSiret(v.replace(/[^\d\s]/g, ''))}
            keyboardType="number-pad"
            maxLength={17}
            error={siretError}
            placeholder="000 000 000 00000"
          />
          {check.state === 'loading' ? (
            <Text variant="secondary" style={{ color: tokens.color.textSecondary }}>
              Vérification dans la base Sirene…
            </Text>
          ) : null}
          {check.state === 'ok' ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
                padding: 12,
                borderRadius: tokens.radius.card,
                backgroundColor: tokens.color.success.bg,
              }}
            >
              <Check
                size={18}
                strokeWidth={2.2}
                color={tokens.color.success.fg}
                style={{ marginTop: 1 }}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  variant="secondary"
                  style={{ color: tokens.color.success.fg, fontFamily: 'Geist-SemiBold' }}
                >
                  Entreprise trouvée dans la base Sirene
                </Text>
                <Text variant="secondary" style={{ color: tokens.color.textBody }}>
                  Les champs ci-dessous ont été préremplis, vérifiez-les.
                </Text>
              </View>
            </View>
          ) : null}
        </View>
        {check.state === 'ok' ? (
          <>
            <Field
              label="Raison sociale"
              value={company.legal_name}
              onChangeText={(v) => setCompany((c) => ({ ...c, legal_name: v }))}
              error={errors.legal_name}
            />
            <Field
              label="Adresse"
              value={company.address}
              onChangeText={(v) => setCompany((c) => ({ ...c, address: v }))}
              error={errors.address}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 120 }}>
                <Field
                  label="Code postal"
                  value={company.postal_code}
                  keyboardType="number-pad"
                  maxLength={5}
                  onChangeText={(v) => setCompany((c) => ({ ...c, postal_code: v }))}
                  error={errors.postal_code}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Ville"
                  value={company.city}
                  onChangeText={(v) => setCompany((c) => ({ ...c, city: v }))}
                  error={errors.city}
                />
              </View>
            </View>
          </>
        ) : null}
      </View>

      <View style={{ gap: 16 }}>
        <Text variant="section">Contact</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Prénom"
              placeholder="Camille"
              value={contact.first_name}
              onChangeText={set('first_name')}
              autoComplete="given-name"
              error={errors.first_name}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Nom"
              placeholder="Martin"
              value={contact.last_name}
              onChangeText={set('last_name')}
              autoComplete="family-name"
              error={errors.last_name}
            />
          </View>
        </View>
        <Field
          label="Téléphone"
          placeholder="06 00 00 00 00"
          value={contact.phone}
          onChangeText={set('phone')}
          keyboardType="phone-pad"
          autoComplete="tel"
        />
        {resume ? null : (
          <>
            <Field
              label="E-mail professionnel"
              placeholder="nom@entreprise.fr"
              value={contact.email}
              onChangeText={set('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />
            <View style={{ gap: 6 }}>
              <Field
                label="Mot de passe"
                placeholder="12 caractères minimum"
                value={contact.password}
                onChangeText={set('password')}
                secureTextEntry
                autoComplete="new-password"
                error={errors.password}
              />
              {errors.password ? null : (
                <Text variant="caption" style={{ color: tokens.color.textSecondary }}>
                  Au moins 12 caractères, dont un chiffre.
                </Text>
              )}
            </View>
          </>
        )}
      </View>

      <View style={{ gap: 6 }}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          onPress={() => setAccepted((a) => !a)}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 44 }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              borderWidth: 1.5,
              borderColor: tokens.color.ink,
              backgroundColor: accepted ? tokens.color.ink : tokens.color.white,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {accepted ? <Check size={14} strokeWidth={3} color={tokens.color.white} /> : null}
          </View>
          <Text variant="secondary" style={{ flex: 1, color: tokens.color.textBody }}>
            J’accepte les <Legal label="conditions d’utilisation" url={TERMS_URL} /> et la{' '}
            <Legal label="politique de confidentialité" url={PRIVACY_URL} />.
          </Text>
        </Pressable>
        {errors.accepted ? (
          <Text variant="secondary" style={{ color: tokens.color.error.fg }}>
            {errors.accepted}
          </Text>
        ) : null}
      </View>

      <View style={{ gap: 12, paddingBottom: 12 }}>
        {submitError ? (
          <Text variant="secondary" style={{ color: tokens.color.error.fg }}>
            {submitError}
          </Text>
        ) : null}
        <Button
          label={busy ? 'Envoi…' : 'Envoyer ma demande'}
          disabled={busy || check.state !== 'ok'}
          onPress={submit}
        />
        <Text variant="caption" style={{ color: tokens.color.textSecondary, textAlign: 'center' }}>
          Vous recevrez un e-mail dès que votre compte sera activé.
        </Text>
      </View>
    </View>
  );
}

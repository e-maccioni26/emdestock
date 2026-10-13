'use client';

import { useState, useTransition } from 'react';
import { validatePassword } from '@emd/shared';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { createClient } from '@/lib/supabase/browser';

/** Changement de son propre mot de passe (aucun appel serveur : la session de l'utilisateur suffit). */
export function PasswordCard() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setDone(false);
    const weak = validatePassword(password);
    if (weak) return setError(weak);
    if (password !== confirm) return setError('Les deux mots de passe ne correspondent pas.');
    setError(undefined);
    start(async () => {
      const { error: err } = await createClient().auth.updateUser({ password });
      if (err) return setError('Modification impossible. Reconnectez-vous puis réessayez.');
      setPassword('');
      setConfirm('');
      setDone(true);
    });
  }

  return (
    <form
      onSubmit={submit}
      className="flex max-w-[480px] flex-col gap-4 rounded-block border border-border bg-white p-4 md:p-6"
    >
      <h2 className="text-[16px] leading-[22px] font-semibold">Mon mot de passe</h2>
      <Field
        label="Nouveau mot de passe"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Field
        label="Confirmer le mot de passe"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={error}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Changer le mot de passe'}
        </Button>
        {done && (
          <span role="status" className="text-[13px] font-medium text-success-fg">
            Mot de passe modifié
          </span>
        )}
      </div>
    </form>
  );
}

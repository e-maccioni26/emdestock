'use client';

import { useActionState } from 'react';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { signIn, type LoginState } from './actions';

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {
    error: initialError,
  });
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="nom@entreprise.fr"
      />
      <Field
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state.error}
      />
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? 'Connexion…' : 'Se connecter'}
      </Button>
    </form>
  );
}

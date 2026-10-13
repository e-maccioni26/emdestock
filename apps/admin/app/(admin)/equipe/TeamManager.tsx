'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { validatePassword } from '@emd/shared';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { createMember, deleteMember, resetMemberPassword, setMemberDisabled } from './actions';

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  can_manage_team: boolean;
  disabled_at: string | null;
}

/** Mot de passe provisoire : 14 caractères, au moins un chiffre, sans caractères ambigus. */
function generatePassword() {
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const pick = (set: string, n: number) =>
    Array.from(crypto.getRandomValues(new Uint32Array(n)), (x) => set[x % set.length]).join('');
  return pick(letters, 11) + pick(digits, 3);
}

const link = 'min-h-11 text-[13px] font-medium disabled:opacity-50';

function Credentials({
  email,
  password,
  onClose,
}: {
  email: string;
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-card border border-border bg-surface-alt p-4 text-[14px]"
    >
      <strong>Compte prêt. Transmettez ces identifiants à la personne concernée :</strong>
      <span>
        E-mail : <span className="font-mono">{email}</span>
      </span>
      <span>
        Mot de passe provisoire : <span className="font-mono">{password}</span>
      </span>
      <span className="text-[12px] text-text-secondary">
        Ce mot de passe ne sera plus affiché. La personne pourra le changer depuis « Mon compte ».
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          small
          onClick={() => {
            navigator.clipboard?.writeText(`E-mail : ${email}\nMot de passe : ${password}`);
            setCopied(true);
          }}
        >
          {copied ? 'Copié' : 'Copier'}
        </Button>
        <Button variant="secondary" small onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  );
}

function MemberRow({ m, isMe }: { m: Member; isMe: boolean }) {
  const [resetting, setResetting] = useState(false);
  const [password, setPassword] = useState('');
  const [shown, setShown] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const disabled = m.disabled_at !== null;

  const run = (fn: () => Promise<{ error?: string }>, after?: () => void) => {
    setError(undefined);
    start(async () => {
      const r = await fn();
      if (r.error) setError(r.error);
      else after?.();
    });
  };

  return (
    <li className="flex flex-col gap-3 rounded-card border border-border p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={`text-[15px] font-semibold ${disabled ? 'text-text-secondary' : ''}`}>
          {m.first_name} {m.last_name}
        </span>
        {isMe && (
          <span className="rounded-badge bg-divider px-1.5 py-0.5 text-[11px] font-semibold">
            Vous
          </span>
        )}
        {disabled && (
          <span className="rounded-badge bg-divider px-1.5 py-0.5 text-[11px] font-semibold text-text-body">
            Désactivé
          </span>
        )}
        <span className="text-[13px] text-text-secondary">
          {m.can_manage_team ? 'Gestionnaire d’équipe' : 'Employé'}
        </span>
      </div>
      <span className="text-[13px] break-all text-text-body">{m.email}</span>
      {!isMe && (
        <div className="flex flex-wrap gap-x-5">
          <button
            type="button"
            className={link}
            disabled={pending}
            onClick={() => {
              setResetting((r) => !r);
              setPassword(generatePassword());
            }}
          >
            Nouveau mot de passe
          </button>
          <button
            type="button"
            className={link}
            disabled={pending}
            onClick={() => {
              if (
                !disabled &&
                !window.confirm(
                  `Désactiver ${m.first_name} ${m.last_name} ? L’accès est coupé immédiatement.`,
                )
              )
                return;
              run(() => setMemberDisabled(m.id, !disabled));
            }}
          >
            {disabled ? 'Réactiver' : 'Désactiver'}
          </button>
          <button
            type="button"
            className={`${link} text-error`}
            disabled={pending}
            onClick={() => {
              if (
                !window.confirm(
                  `Supprimer le compte de ${m.first_name} ${m.last_name} ? Action irréversible.`,
                )
              )
                return;
              run(() => deleteMember(m.id));
            }}
          >
            Supprimer
          </button>
        </div>
      )}
      {resetting && (
        <div className="flex flex-col gap-3 border-t border-divider pt-3">
          <Field
            label="Nouveau mot de passe provisoire"
            mono
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              small
              disabled={pending}
              onClick={() => {
                const weak = validatePassword(password);
                if (weak) return setError(weak);
                run(
                  () => resetMemberPassword(m.id, password),
                  () => {
                    setShown(password);
                    setResetting(false);
                  },
                );
              }}
            >
              Enregistrer
            </Button>
            <Button variant="secondary" small onClick={() => setResetting(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}
      {shown && (
        <Credentials email={m.email} password={shown} onClose={() => setShown(undefined)} />
      )}
      {error && (
        <p role="alert" className="text-[13px] text-error">
          {error}
        </p>
      )}
    </li>
  );
}

const EMPTY = { first_name: '', last_name: '', email: '', password: '', can_manage_team: false };

export function TeamManager({ members, meId }: { members: Member[]; meId: string }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(EMPTY);
  const [error, setError] = useState<string>();
  const [created, setCreated] = useState<{ email: string; password: string }>();
  const [pending, start] = useTransition();
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setV((p) => ({ ...p, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const weak = validatePassword(v.password);
    if (weak) return setError(weak);
    setError(undefined);
    start(async () => {
      const r = await createMember(v);
      if (r.error) return setError(r.error);
      setCreated({ email: v.email.trim().toLowerCase(), password: v.password });
      setV(EMPTY);
      setOpen(false);
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-block border border-border bg-white p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[16px] leading-[22px] font-semibold">Comptes administrateurs</h2>
        {!open && (
          <Button
            onClick={() => {
              setCreated(undefined);
              setV({ ...EMPTY, password: generatePassword() });
              setOpen(true);
            }}
          >
            <Plus size={20} strokeWidth={1.6} aria-hidden /> Ajouter un employé
          </Button>
        )}
      </div>

      {created && (
        <Credentials
          email={created.email}
          password={created.password}
          onClose={() => setCreated(undefined)}
        />
      )}

      {open && (
        <form
          onSubmit={submit}
          className="flex flex-col gap-4 rounded-card border border-border p-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Prénom" value={v.first_name} onChange={set('first_name')} required />
            <Field label="Nom" value={v.last_name} onChange={set('last_name')} required />
          </div>
          <Field
            label="Adresse e-mail"
            type="email"
            autoComplete="off"
            value={v.email}
            onChange={set('email')}
            required
          />
          <div className="flex flex-col gap-2">
            <Field
              label="Mot de passe provisoire"
              mono
              value={v.password}
              onChange={set('password')}
              required
            />
            <button
              type="button"
              className={`${link} self-start`}
              onClick={() => setV((p) => ({ ...p, password: generatePassword() }))}
            >
              Générer un autre mot de passe
            </button>
          </div>
          <label className="flex min-h-11 items-start gap-2.5 text-[14px]">
            <input
              type="checkbox"
              checked={v.can_manage_team}
              onChange={(e) => setV((p) => ({ ...p, can_manage_team: e.target.checked }))}
              className="mt-0.5 size-[18px] accent-ink"
            />
            <span>
              Peut gérer l’équipe
              <span className="block text-[12px] text-text-secondary">
                Créer, désactiver et supprimer des comptes. À réserver aux responsables.
              </span>
            </span>
          </label>
          {error && (
            <p role="alert" className="text-[13px] text-error">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Création…' : 'Créer le compte'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setError(undefined);
              }}
            >
              Annuler
            </Button>
          </div>
        </form>
      )}

      <ul className="flex flex-col gap-2.5" aria-label="Comptes administrateurs">
        {members.map((m) => (
          <MemberRow key={m.id} m={m} isMe={m.id === meId} />
        ))}
      </ul>
    </section>
  );
}

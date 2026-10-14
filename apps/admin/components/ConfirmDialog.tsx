'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Action irréversible : bouton rouge, et le focus part sur « Annuler ». */
  destructive?: boolean;
}
/** Même fenêtre avec un champ de saisie (remplace window.prompt). */
export interface PromptOptions extends ConfirmOptions {
  field: { label: string; placeholder?: string; maxLength?: number };
  /** Exécutée à la validation : renvoyer un message d'erreur garde la fenêtre ouverte (ex. « existe déjà »). */
  submit?: (value: string, checked: boolean) => Promise<string | undefined>;
  /** Case à cocher sous le champ (ex. « Créer dans la catégorie X »). */
  checkbox?: { label: string; defaultChecked?: boolean };
}

type Answer = { ok: boolean; value: string };
const AskContext = createContext<(o: PromptOptions | ConfirmOptions) => Promise<Answer>>(() =>
  Promise.resolve({ ok: false, value: '' }),
);

/** `if (!(await confirm({ title: '…' }))) return;` : remplace window.confirm par une vraie fenêtre modale. */
export function useConfirm() {
  const ask = useContext(AskContext);
  return useCallback((o: ConfirmOptions) => ask(o).then((a) => a.ok), [ask]);
}

/** `const name = await prompt({ title, field: { label } }); if (!name) return;` : texte saisi (sans espaces autour) ou null. */
export function usePrompt() {
  const ask = useContext(AskContext);
  return useCallback(
    (o: PromptOptions) => ask(o).then((a) => (a.ok && a.value.trim() ? a.value.trim() : null)),
    [ask],
  );
}

/** Fenêtre modale native `<dialog>` : focus piégé, Échap et clic à côté = annuler, annoncée aux lecteurs d'écran. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const resolver = useRef<((a: Answer) => void) | undefined>(undefined);
  const [opts, setOpts] = useState<PromptOptions | ConfirmOptions>({ title: '' });
  const [value, setValue] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(false);
  const field = 'field' in opts ? opts.field : undefined;

  const ask = useCallback((o: PromptOptions | ConfirmOptions) => {
    resolver.current?.({ ok: false, value: '' }); // une demande encore ouverte est annulée
    setOpts(o);
    setValue('');
    setError(undefined);
    setChecked('checkbox' in o && !!o.checkbox?.defaultChecked);
    return new Promise<Answer>((resolve) => {
      resolver.current = resolve;
      if (!dialog.current?.open) dialog.current?.showModal();
    });
  }, []);

  const answer = (ok: boolean) => {
    resolver.current?.({ ok, value });
    resolver.current = undefined;
    dialog.current?.close();
  };

  return (
    <AskContext.Provider value={ask}>
      {children}
      <dialog
        ref={dialog}
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClose={() => answer(false)}
        onClick={(e) => e.target === dialog.current && answer(false)}
        className="m-auto w-[calc(100%-40px)] max-w-[420px] rounded-block border border-border bg-white p-0 text-ink shadow-popover backdrop:bg-ink/40 print:hidden"
      >
        <form
          className="flex flex-col gap-4 p-5 md:p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            const submit = 'submit' in opts ? opts.submit : undefined;
            if (submit) {
              setBusy(true);
              const err = await submit(value.trim(), checked);
              setBusy(false);
              if (err) return setError(err);
            }
            answer(true);
          }}
        >
          <div className="flex flex-col gap-2">
            <h2 id="confirm-title" className="text-[16px] leading-[22px] font-semibold">
              {opts.title}
            </h2>
            {opts.message && (
              <p id="confirm-message" className="text-[14px] leading-[21px] text-text-body">
                {opts.message}
              </p>
            )}
          </div>
          {field && (
            <Field
              label={field.label}
              placeholder={field.placeholder}
              maxLength={field.maxLength ?? 60}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(undefined);
              }}
              error={error}
              autoFocus
              autoComplete="off"
            />
          )}
          {'checkbox' in opts && opts.checkbox && (
            <label className="flex min-h-11 items-center gap-2.5 text-[14px]">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="size-[18px] accent-ink"
              />
              {opts.checkbox.label}
            </label>
          )}
          <div className="flex gap-2 *:flex-1 md:justify-end md:*:flex-none">
            <Button variant="secondary" autoFocus={opts.destructive} onClick={() => answer(false)}>
              {opts.cancelLabel ?? 'Annuler'}
            </Button>
            <Button
              type="submit"
              className={opts.destructive ? '!bg-error' : ''}
              autoFocus={!opts.destructive && !field}
              disabled={busy || (!!field && !value.trim())}
            >
              {opts.confirmLabel ?? 'Confirmer'}
            </Button>
          </div>
        </form>
      </dialog>
    </AskContext.Provider>
  );
}

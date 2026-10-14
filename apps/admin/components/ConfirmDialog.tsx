'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/Button';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Action irréversible : bouton rouge, et le focus part sur « Annuler ». */
  destructive?: boolean;
}

const ConfirmContext = createContext<(o: ConfirmOptions) => Promise<boolean>>(() =>
  Promise.resolve(false),
);

/** `if (!(await confirm({ title: '…' }))) return;` : remplace window.confirm par une vraie fenêtre modale. */
export const useConfirm = () => useContext(ConfirmContext);

/** Fenêtre modale native `<dialog>` : focus piégé, Échap et clic à côté = annuler, annoncée aux lecteurs d'écran. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const resolver = useRef<((ok: boolean) => void) | undefined>(undefined);
  const [opts, setOpts] = useState<ConfirmOptions>({ title: '' });

  const confirm = useCallback((o: ConfirmOptions) => {
    resolver.current?.(false); // une demande encore ouverte est annulée
    setOpts(o);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      if (!dialog.current?.open) dialog.current?.showModal();
    });
  }, []);

  const answer = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = undefined;
    dialog.current?.close();
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialog}
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClose={() => answer(false)}
        onClick={(e) => e.target === dialog.current && answer(false)}
        className="m-auto w-[calc(100%-40px)] max-w-[420px] rounded-block border border-border bg-white p-0 text-ink shadow-popover backdrop:bg-ink/40 print:hidden"
      >
        <div className="flex flex-col gap-4 p-5 md:p-6">
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
          <div className="flex gap-2 *:flex-1 md:justify-end md:*:flex-none">
            <Button variant="secondary" autoFocus={opts.destructive} onClick={() => answer(false)}>
              {opts.cancelLabel ?? 'Annuler'}
            </Button>
            <Button
              className={opts.destructive ? '!bg-error' : ''}
              autoFocus={!opts.destructive}
              onClick={() => answer(true)}
            >
              {opts.confirmLabel ?? 'Confirmer'}
            </Button>
          </div>
        </div>
      </dialog>
    </ConfirmContext.Provider>
  );
}

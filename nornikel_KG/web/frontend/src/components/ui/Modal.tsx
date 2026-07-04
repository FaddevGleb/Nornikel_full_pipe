import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function Modal({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger = false,
}: ModalProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog ref={dialogRef} className="ui-modal" onClose={onCancel} aria-labelledby="modal-title">
      <div className="ui-modal-content">
        <h3 id="modal-title">{title}</h3>
        <div className="ui-modal-body">{children}</div>
        <div className="ui-modal-actions">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel ?? t('common.close')}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

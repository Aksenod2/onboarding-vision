import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import { createOffer } from '../mock/crmApi';
import type { ProductCode, ClientSource } from '../types/domain';
import { PRODUCT_OPTIONS, productKey } from './options';
import { useCrmI18n } from '../i18n';

// Модалка создания оффера (бриф §Profile, overlay-правило: Dialog, CTA справа / «Отмена» слева).
// Продукт обяз. (§3). Источник наследуем от профиля. Теги — строка через запятую.
export const OfferDialog = ({
  open,
  profileId,
  source,
  onClose,
  onCreated,
}: {
  open: boolean;
  profileId: string;
  source: ClientSource;
  onClose: () => void;
  onCreated: () => void;
}) => {
  const { t } = useCrmI18n();
  const [product, setProduct] = useState<ProductCode>('current-account');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    await createOffer({
      profileId,
      product,
      source,
      tags: tags.split(',').map((s) => s.trim()).filter(Boolean),
      description: description.trim() || undefined,
    });
    setBusy(false);
    onCreated();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="offer-dialog-title">
      <DialogTitle id="offer-dialog-title">{t('offer.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            required
            label={t('offer.product')}
            value={product}
            onChange={(e) => setProduct(e.target.value as ProductCode)}
          >
            {PRODUCT_OPTIONS.map((p) => (
              <MenuItem key={p} value={p}>
                {t(productKey(p))}
              </MenuItem>
            ))}
          </TextField>
          <TextField label={t('offer.tags')} value={tags} onChange={(e) => setTags(e.target.value)} />
          <TextField
            label={t('offer.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button variant="text" onClick={onClose} disabled={busy}>
          {t('offer.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {t('offer.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

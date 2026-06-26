import { useEffect, useState, type KeyboardEvent } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { listProfiles, getProcess } from '../mock/crmApi';
import type { CompanyProfile } from '../types/domain';
import { isValidPan, PAN_RE } from '../components/options';
import { useSelectedClient } from '../state/SelectedClientContext';
import { useCrmI18n } from '../i18n';

// Глобальный поиск по PAN/CIN/имени (зона A, объед.окно §1).
// Выбор результата → select(clientId, activeNode) → открывает рабочую область клиента.
// Ветка «не найдено» (входящий звонок, бриф §3): валидный PAN + Enter без совпадения →
// onNotFound(pan) → shell открывает создание профиля с предзаполненным PAN.

export const GlobalSearch = ({
  onPicked,
  onNotFound,
}: {
  onPicked?: () => void;
  onNotFound?: (pan: string) => void;
}) => {
  const { t } = useCrmI18n();
  const { select } = useSelectedClient();
  const [options, setOptions] = useState<CompanyProfile[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    let alive = true;
    listProfiles().then((list) => alive && setOptions(list));
    return () => {
      alive = false;
    };
  }, []);

  // Совпадает ли введённый текст с каким-либо профилем (по PAN/CIN/имени).
  const hasMatch = (q: string): boolean => {
    const low = q.trim().toLowerCase();
    if (!low) return false;
    return options.some(
      (o) =>
        o.legalName.toLowerCase().includes(low) ||
        o.pan.toLowerCase().includes(low) ||
        (o.cin ?? '').toLowerCase().includes(low),
    );
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter') return;
    const raw = input.trim().toUpperCase();
    // Только валидный PAN запускает ветку «не найдено» (PAN — обязательный ключ поиска, Д2).
    if (PAN_RE.test(raw) && isValidPan(raw) && !hasMatch(input) && onNotFound) {
      e.preventDefault();
      onNotFound(raw);
      setInput('');
    }
  };

  return (
    <Autocomplete
      size="small"
      options={options}
      inputValue={input}
      onInputChange={(_, v) => setInput(v)}
      sx={{ width: { xs: 200, sm: 320 } }}
      getOptionLabel={(o) => `${o.legalName} · ${o.pan}`}
      filterOptions={(opts, { inputValue }) => {
        const q = inputValue.trim().toLowerCase();
        if (!q) return opts;
        return opts.filter(
          (o) =>
            o.legalName.toLowerCase().includes(q) ||
            o.pan.toLowerCase().includes(q) ||
            (o.cin ?? '').toLowerCase().includes(q),
        );
      }}
      onChange={async (_, value) => {
        if (!value) return;
        const proc = await getProcess(value.id);
        select(value.id, proc?.activeNode);
        onPicked?.();
      }}
      noOptionsText={t('search.notFoundHint')}
      renderInput={(params) => (
        <TextField {...params} placeholder={t('shell.search')} variant="outlined" onKeyDown={onKeyDown} />
      )}
    />
  );
};

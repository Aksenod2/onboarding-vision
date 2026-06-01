import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, TextField, Select, Radiobox, Note, BodyL, BodyM, BodyS } from '@salutejs/sdds-serv';
import {
  textPrimary,
  textSecondary,
  textInfo,
  surfaceTransparentInfo,
  surfaceSolidSecondary,
} from '@salutejs/sdds-themes/tokens';
import { OnboardingLayout } from '../ui/OnboardingLayout';
import { addSignatory, getCompany, getSignatories, updateCompany } from '../mock/api';
import type { AuthorizedSignatory, Company } from '../mock/types';

// CL-03 — Анкета компании (KMP / Board Resolution). source: 2026-06-01_obo : 004
// Секции: Данные компании · Подписанты · Операционные инструкции.
// Часть полей авто-подтянута из реестра (бейдж «из реестра», read-only),
// PAN и др. manual-поля — редактируемые. Источник поля берём из companyFieldSources.

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionTitle = styled(BodyL)`
  color: ${textPrimary};
`;

const RegistryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 0.125rem 0.5rem;
  border-radius: 0.375rem;
  background-color: ${surfaceTransparentInfo};
  color: ${textInfo};
  font-size: 0.75rem;
  font-weight: 600;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const SignatoryCard = styled.div`
  background-color: ${surfaceSolidSecondary};
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const EditCard = styled.div`
  background-color: ${surfaceSolidSecondary};
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
`;

const EditHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Muted = styled(BodyS)`
  color: ${textSecondary};
`;

const Row = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  & > * {
    flex: 1 1 240px;
  }
`;

const SIGNING_RIGHTS = [
  { value: 'any', label: 'Любой подписант (Singly)' },
  { value: 'joint', label: 'Совместно (Jointly)' },
];

export const CL03Company = () => {
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [signatories, setSignatories] = useState<AuthorizedSignatory[]>([]);
  const [pan, setPan] = useState('');
  const [industry, setIndustry] = useState('');
  const [signingRights, setSigningRights] = useState('any');
  const [chequeBook, setChequeBook] = useState(true);
  const [resolutionUploaded, setResolutionUploaded] = useState(false);

  // Добавленные вручную подписанты (редактируемые черновики).
  const [drafts, setDrafts] = useState<AuthorizedSignatory[]>([]);
  const nextId = useRef(1);

  const addDraft = () => {
    const id = `NEW-${nextId.current++}`;
    setDrafts((d) => [
      ...d,
      { id, fullName: '', pan: '', designation: '', email: '', phone: '', residencyStatus: 'Resident', isPEP: false },
    ]);
  };
  const updateDraft = (id: string, patch: Partial<AuthorizedSignatory>) =>
    setDrafts((d) => d.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeDraft = (id: string) => setDrafts((d) => d.filter((s) => s.id !== id));

  useEffect(() => {
    getCompany().then((c) => {
      setCompany(c);
      setPan(c.pan);
      setIndustry(c.industry);
      setChequeBook(c.chequeBookRequired);
    });
    getSignatories().then(setSignatories);
  }, []);

  if (!company) {
    return (
      <OnboardingLayout step={1} title="Данные компании">
        <Muted>Загрузка данных из реестра…</Muted>
      </OnboardingLayout>
    );
  }

  const addr = company.registeredAddress;
  const addrLine = `${addr.line}, ${addr.city}, ${addr.state} ${addr.pin}`;

  const handleSubmit = async () => {
    await updateCompany({ pan, industry, chequeBookRequired: chequeBook });
    // Сохраняем добавленных подписантов в mock-«бэкенд».
    await Promise.all(drafts.map((s) => addSignatory(s)));
    navigate('/business');
  };

  // Read-only поле из реестра с бейджем (источник поля — companyFieldSources).
  const registryField = (label: string, value: string) => (
    <Field>
      <TextField label={label} value={value} readOnly size="m" />
      <RegistryBadge>Из реестра · Probe42</RegistryBadge>
    </Field>
  );

  return (
    <OnboardingLayout
      step={1}
      title="Данные компании"
      primary={<Button view="accent" size="m" text="Продолжить" onClick={handleSubmit} />}
    >
      <Note
        view="info"
        size="s"
        title="Данные подтянуты автоматически"
        text="Поля с бейджем «Из реестра» заполнены из государственных источников. Проверьте и при необходимости отредактируйте доступные поля."
      />

      {/* Секция 1 — Данные компании */}
      <Section>
        <SectionTitle>Компания</SectionTitle>
        {registryField('Наименование', company.companyName)}
        <Row>
          {registryField('CIN', company.cin)}
          {registryField('GSTIN', company.gstin)}
        </Row>
        <Row>
          <Field>
            <TextField
              label="PAN компании"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              size="m"
              leftHelper="Введите вручную для сверки"
            />
          </Field>
          {registryField('Дата регистрации', company.incorporationDate)}
        </Row>
        {registryField('Юридический адрес', addrLine)}
        <Field>
          <TextField
            label="Сфера деятельности"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            size="m"
          />
        </Field>
      </Section>

      {/* Секция 2 — Подписанты */}
      <Section>
        <SectionTitle>Подписанты (Board Resolution)</SectionTitle>
        {signatories.map((s) => (
          <SignatoryCard key={s.id}>
            <BodyM>{s.fullName}</BodyM>
            <Muted>
              {s.designation} · PAN {s.pan}
              {s.phone ? ` · ${s.phone}` : ''}
              {s.email ? ` · ${s.email}` : ''}
            </Muted>
          </SignatoryCard>
        ))}

        {drafts.map((s, i) => (
          <EditCard key={s.id}>
            <EditHead>
              <BodyM>Новый подписант {i + 1}</BodyM>
              <Button view="clear" size="s" text="Удалить" onClick={() => removeDraft(s.id)} />
            </EditHead>
            <Field>
              <TextField
                label="ФИО"
                value={s.fullName}
                onChange={(e) => updateDraft(s.id, { fullName: e.target.value })}
                size="m"
              />
            </Field>
            <Row>
              <Field>
                <TextField
                  label="Должность"
                  value={s.designation}
                  onChange={(e) => updateDraft(s.id, { designation: e.target.value })}
                  size="m"
                />
              </Field>
              <Field>
                <TextField
                  label="PAN"
                  value={s.pan}
                  onChange={(e) => updateDraft(s.id, { pan: e.target.value.toUpperCase() })}
                  size="m"
                />
              </Field>
            </Row>
            <Row>
              <Field>
                <TextField
                  label="Email"
                  type="email"
                  value={s.email ?? ''}
                  onChange={(e) => updateDraft(s.id, { email: e.target.value })}
                  size="m"
                />
              </Field>
              <Field>
                <TextField
                  label="Телефон"
                  placeholder="+91 …"
                  value={s.phone ?? ''}
                  onChange={(e) => updateDraft(s.id, { phone: e.target.value })}
                  size="m"
                />
              </Field>
            </Row>
          </EditCard>
        ))}

        <Button view="secondary" size="m" text="+ Добавить подписанта" onClick={addDraft} />
        {resolutionUploaded ? (
          <Note
            view="positive"
            size="s"
            title="Board Resolution загружен"
            text="board_resolution.pdf · принят к проверке"
          />
        ) : (
          <Button
            view="secondary"
            size="m"
            text="Загрузить Board Resolution (PDF)"
            onClick={() => setResolutionUploaded(true)}
          />
        )}
      </Section>

      {/* Секция 3 — Операционные инструкции */}
      <Section>
        <SectionTitle>Операционные инструкции</SectionTitle>
        <Field>
          <Select
            label="Право подписи по счёту"
            items={SIGNING_RIGHTS}
            value={signingRights}
            onChange={(v: string) => setSigningRights(v)}
            size="m"
          />
        </Field>
        <Field>
          <Muted>Нужна чековая книжка?</Muted>
          <Radiobox
            name="chequebook"
            label="Да"
            checked={chequeBook}
            onChange={() => setChequeBook(true)}
          />
          <Radiobox
            name="chequebook"
            label="Нет"
            checked={!chequeBook}
            onChange={() => setChequeBook(false)}
          />
        </Field>
      </Section>
    </OnboardingLayout>
  );
};

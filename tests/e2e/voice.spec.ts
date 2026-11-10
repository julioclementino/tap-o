import { test, expect } from '@playwright/test';
test('speech cancels before repeats and stops when tutorial is paused or closed', async ({
  page,
  request,
}) => {
  await request.put('http://localhost:3001/preferences', {
    data: {
      textScale: 1,
      highContrast: false,
      voiceEnabled: true,
      reducedMotion: true,
      inactivitySeconds: 10,
    },
  });
  await page.addInitScript(() => {
    const events: string[] = [];
    (window as unknown as { speechEvents: string[] }).speechEvents = events;
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        cancel: () => events.push('stop'),
        speak: (utterance: SpeechSynthesisUtterance) => events.push('speak:' + utterance.text),
        getVoices: () => [],
      },
    });
  });
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Entrar com perfil de demonstração', exact: true })
    .click();
  await page.getByRole('button', { name: 'Aprender a enviar uma mensagem', exact: true }).click();
  await page
    .getByRole('button', { name: 'Tocar na tartaruga para pedir ajuda', exact: true })
    .click();
  const events = () =>
    page.evaluate(() => (window as unknown as { speechEvents: string[] }).speechEvents);
  await expect
    .poll(async () => (await events()).filter((x) => x.startsWith('speak:')).length)
    .toBe(1);
  await page.getByRole('button', { name: 'Repetir orientação', exact: true }).click();
  await expect
    .poll(async () => (await events()).filter((x) => x.startsWith('speak:')).length)
    .toBe(2);
  const log = await events();
  for (let i = 0; i < log.length; i++)
    if (log[i].startsWith('speak:')) expect(log[i - 1]).toBe('stop');
  await page.getByRole('button', { name: 'Pausar ajuda', exact: true }).click();
  await expect.poll(async () => (await events()).at(-1)).toBe('stop');
  await page.getByRole('button', { name: 'Encerrar tutorial', exact: true }).click();
  await page.getByRole('button', { name: 'Encerrar tutorial', exact: true }).last().click();
  await expect(page).toHaveURL(/\/home$/);
  await expect.poll(async () => (await events()).at(-1)).toBe('stop');
});

import { test, expect, type Page } from '@playwright/test';
async function enter(page: Page) {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Entrar com perfil de demonstração', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'O que vamos aprender hoje?' })).toBeVisible();
}
async function message(page: Page) {
  await page.getByRole('button', { name: 'Ana · contato fictício', exact: true }).click();
  await page.getByRole('textbox', { name: 'Sua mensagem', exact: true }).click();
  await page.getByRole('textbox', { name: 'Sua mensagem', exact: true }).fill('Olá, Ana!');
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
}
test('full message path, no premature send, MySQL save, reopening progress', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await request.put('http://localhost:3001/preferences', {
    data: {
      textScale: 1,
      highContrast: false,
      voiceEnabled: false,
      reducedMotion: true,
      inactivitySeconds: 10,
    },
  });
  await enter(page);
  await page.screenshot({ path: 'docs/screenshots/home.png', fullPage: true });
  await page.getByRole('button', { name: 'Aprender a enviar uma mensagem', exact: true }).click();
  await page
    .getByRole('button', { name: 'Tocar na tartaruga para pedir ajuda', exact: true })
    .click();
  await expect(
    page.getByText('Toque em Ana para abrir a conversa de treinamento.', { exact: true }),
  ).toBeVisible();
  await message(page);
  await expect(page.getByText('✓ Enviada no treinamento', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar envio para Ana', exact: true }).click();
  await expect(page.getByText('Resultado salvo no MySQL.', { exact: true })).toBeVisible();
  await expect(page.getByText('Concluído com orientação', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/message-complete.png', fullPage: true });
  await page.getByRole('button', { name: 'Ver meu progresso', exact: true }).click();
  await expect(page).toHaveURL(/\/progress$/);
  await page.reload();
  await expect(page.getByText('Concluído com orientação', { exact: true }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
test('inactivity offers help without executing; explicit assistance is recorded', async ({
  page,
}) => {
  await enter(page);
  await page.getByRole('button', { name: 'Aprender a enviar uma mensagem', exact: true }).click();
  await page
    .getByRole('button', { name: 'Tocar na tartaruga para pedir ajuda', exact: true })
    .click();
  await expect(
    page.getByText('Quer que eu faça este passo com você?', { exact: true }),
  ).toBeVisible({ timeout: 16000 });
  await expect(
    page.getByRole('button', { name: 'Ana · contato fictício', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Sua mensagem', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sim, me ajude', exact: true }).click();
  await page.getByRole('textbox', { name: 'Sua mensagem', exact: true }).click();
  await page.getByRole('textbox', { name: 'Sua mensagem', exact: true }).fill('Bom dia!');
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar envio para Ana', exact: true }).click();
  await expect(page.getByText('Concluído com execução assistida', { exact: true })).toBeVisible();
  await expect(page.getByText('Resultado salvo no MySQL.', { exact: true })).toBeVisible();
});
test('API failure remains pending across reload and retries once', async ({ page }) => {
  await enter(page);
  await page.goto('/training/message?independent=1');
  await page.route('**/sessions/**', (route) => route.abort());
  await message(page);
  await page.getByRole('button', { name: 'Confirmar envio para Ana', exact: true }).click();
  await expect(page.getByText(/Sincronização pendente\./)).toBeVisible();
  await expect(page.getByText('Resultado salvo no MySQL.', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver meu progresso', exact: true }).click();
  await expect(page).toHaveURL(/\/progress$/);
  await page.reload();
  await expect(page.getByText('1 registro(s) pendente(s)', { exact: true })).toBeVisible();
  await page.unroute('**/sessions/**');
  await page.getByRole('button', { name: 'Sincronizar agora', exact: true }).click();
  await expect(page.getByText('1 registro(s) pendente(s)', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Concluído sem ajuda', { exact: true }).first()).toBeVisible();
});

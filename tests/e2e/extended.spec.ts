import { test, expect } from '@playwright/test';
test.beforeEach(async ({ request }) => {
  await request.put('http://localhost:3001/preferences', {
    data: {
      textScale: 1,
      highContrast: false,
      voiceEnabled: false,
      reducedMotion: true,
      inactivitySeconds: 10,
    },
  });
});
test('call requires a specific confirmation and ends without a real dialer', async ({ page }) => {
  await page.goto('/training/call');
  await page.getByRole('button', { name: 'Ana · contato fictício', exact: true }).click();
  await page.getByRole('button', { name: 'Ligar para Ana', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar ligação de treinamento', exact: true }).click();
  await expect(page.getByText('Ligação simulada com Ana', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar ligação de treinamento', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar ligação de treinamento', exact: true }).click();
  await expect(page.getByText('Ligação simulada com Ana', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Encerrar ligação', exact: true }).click();
  await expect(page.getByText('Resultado salvo no MySQL.', { exact: true })).toBeVisible();
});
test('bank checks actual action; wrong section never completes balance task', async ({ page }) => {
  await page.goto('/training/balance');
  await page.getByRole('button', { name: 'Consultar extrato', exact: true }).click();
  await expect(page.getByText('Resultado salvo no MySQL.', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Voltar ao banco', exact: true }).click();
  await page.getByRole('button', { name: 'Ver saldo fictício', exact: true }).click();
  await expect(page.getByText('R$ 1.250,00', { exact: true })).toBeVisible();
  await expect(page.getByText('Resultado salvo no MySQL.', { exact: true })).toBeVisible();
});
test('lesson and games save actual attempts with explanations and allow retry', async ({
  page,
}) => {
  await page.goto('/activity/phone-basics');
  await page.getByRole('button', { name: 'Próxima leitura', exact: true }).click();
  await page.getByRole('button', { name: 'Próxima leitura', exact: true }).click();
  await page.getByRole('button', { name: 'Vamos praticar o que lemos', exact: true }).click();
  await page.getByRole('button', { name: 'Tocar mais forte na tela', exact: true }).click();
  await expect(page.getByText('Vamos aprender com esta tentativa.', { exact: true })).toBeVisible();
  await expect(page.getByText('Resultado salvo no MySQL.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await page.getByRole('button', { name: 'Aumentar o tamanho do texto', exact: true }).click();
  await expect(page.getByText('Você encontrou o caminho!', { exact: true })).toBeVisible();
  await expect(page.getByText('Resultado salvo no MySQL.', { exact: true })).toBeVisible();
  await page.goto('/activity/order-game');
  for (const label of ['Escolher o contato', 'Escrever a mensagem', 'Conferir e enviar'])
    await page.getByRole('button', { name: label, exact: true }).click();
  await page.getByRole('button', { name: 'Conferir a ordem', exact: true }).click();
  await expect(page.getByText('Você encontrou o caminho!', { exact: true })).toBeVisible();
  await expect(page.getByText('Resultado salvo no MySQL.', { exact: true })).toBeVisible();
});
test('microphone denial offers labeled demonstration and completes audio playback', async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException('Permission denied', 'NotAllowedError');
    };
  });
  await page.goto('/training/audio');
  await page.getByRole('button', { name: 'Ana · contato fictício', exact: true }).click();
  await page.getByRole('button', { name: 'Gravar áudio', exact: true }).click();
  await expect(page.getByText(/O microfone não foi permitido/)).toBeVisible();
  await page.getByRole('button', { name: 'Usar áudio demonstrativo', exact: true }).click();
  await expect(page.getByText(/Não é uma gravação da sua voz/)).toBeVisible();
  await page.getByRole('button', { name: 'Parar gravação', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Enviar áudio', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Ouvir áudio', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Enviar áudio', exact: true })).toBeEnabled({
    timeout: 18000,
  });
  await page.getByRole('button', { name: 'Enviar áudio', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar envio do áudio', exact: true }).click();
  await expect(page.getByText('Resultado salvo no MySQL.', { exact: true })).toBeVisible();
});
test('large text, high contrast and narrow/tablet layouts remain operable', async ({ page }) => {
  await page.goto('/preferences');
  await page.getByRole('button', { name: 'Muito grande', exact: true }).click();
  await page.getByRole('switch', { name: 'Alto contraste', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar preferências', exact: true }).click();
  await expect(page.getByText('Preferências salvas no MySQL.', { exact: true })).toBeVisible();
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/training/message');
    await page.getByRole('button', { name: 'Ana · contato fictício', exact: true }).click();
    await page.getByRole('textbox', { name: 'Sua mensagem', exact: true }).fill('Olá');
    const input = await page
      .getByRole('textbox', { name: 'Sua mensagem', exact: true })
      .boundingBox();
    expect(input!.x).toBeGreaterThanOrEqual(0);
    expect(input!.x + input!.width).toBeLessThanOrEqual(width);
    await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
    await page.getByRole('button', { name: 'Confirmar envio para Ana', exact: true }).click();
    await expect(page.getByText('Resultado salvo no MySQL.', { exact: true })).toBeVisible();
  }
});

/** Serializes speech requests; stop or a newer request cancels stale async work. */
export class SpeechCoordinator {
  private generation = 0;
  constructor(private adapter: { stop: () => Promise<unknown>; speak: (text: string) => void }) {}
  async stop() {
    ++this.generation;
    await this.adapter.stop();
  }
  async speak(text: string) {
    const ticket = ++this.generation;
    await this.adapter.stop();
    if (ticket === this.generation) this.adapter.speak(text);
  }
}

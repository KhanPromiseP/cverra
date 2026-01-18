
type SaveCallback = (data: any) => Promise<void>;

class AutoSaveService {
  private timeouts = new Map<string, NodeJS.Timeout>();
  private lastSavedData = new Map<string, any>();
  private isSaving = new Map<string, boolean>();
  private saveQueue = new Map<string, any[]>();

  async scheduleSave(
    key: string,
    data: any,
    callback: SaveCallback,
    delay = 1000
  ): Promise<void> {
    // Add to queue for this key
    if (!this.saveQueue.has(key)) {
      this.saveQueue.set(key, []);
    }
    this.saveQueue.get(key)!.push(data);

    // Clear existing timeout
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key)!);
    }

    // Set new timeout
    this.timeouts.set(
      key,
      setTimeout(async () => {
        await this.executeSave(key, callback);
      }, delay)
    );
  }

  private async executeSave(key: string, callback: SaveCallback): Promise<void> {
    if (this.isSaving.get(key)) {
      // Already saving, reschedule
      this.timeouts.set(
        key,
        setTimeout(() => this.executeSave(key, callback), 500)
      );
      return;
    }

    const queue = this.saveQueue.get(key) || [];
    if (queue.length === 0) return;

    const latestData = queue[queue.length - 1];
    const lastSaved = this.lastSavedData.get(key);

    // Skip if data hasn't changed
    if (JSON.stringify(latestData) === JSON.stringify(lastSaved)) {
      this.saveQueue.set(key, []);
      return;
    }

    this.isSaving.set(key, true);

    try {
      console.log(`💾 Auto-saving ${key}...`);
      await callback(latestData);
      this.lastSavedData.set(key, latestData);
      console.log(`✅ Auto-save successful for ${key}`);
    } catch (error) {
      console.error(`❌ Auto-save failed for ${key}:`, error);
      // Retry after 2 seconds
      setTimeout(() => this.executeSave(key, callback), 2000);
    } finally {
      this.isSaving.set(key, false);
      this.saveQueue.set(key, []);
    }
  }

  forceSave(key: string, callback: SaveCallback): Promise<void> {
    return this.executeSave(key, callback);
  }

  cancelSave(key: string): void {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key)!);
      this.timeouts.delete(key);
    }
  }

  cleanup(): void {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    this.isSaving.clear();
    this.saveQueue.clear();
  }
}

export const autoSaveService = new AutoSaveService();
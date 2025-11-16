// Mock electron-store for testing

class MockStore {
  private data: any = {};
  public path: string = '/mock/path/config.json';

  constructor(options?: any) {
    if (options?.defaults) {
      this.data = JSON.parse(JSON.stringify(options.defaults));
    }
  }

  get(key: string, defaultValue?: any): any {
    const keys = key.split('.');
    let value = this.data;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return value !== undefined ? value : defaultValue;
  }

  set(key: string, value: any): void {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    let target = this.data;

    for (const k of keys) {
      if (!(k in target)) {
        target[k] = {};
      }
      target = target[k];
    }

    target[lastKey] = value;
  }

  delete(key: string): void {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    let target = this.data;

    for (const k of keys) {
      if (!(k in target)) {
        return;
      }
      target = target[k];
    }

    delete target[lastKey];
  }

  clear(): void {
    this.data = {};
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  // Helper for testing
  _getData(): any {
    return this.data;
  }

  _setData(data: any): void {
    this.data = data;
  }
}

export default MockStore;

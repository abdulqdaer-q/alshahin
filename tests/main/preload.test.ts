import { contextBridge } from 'electron';

// Mock the preload script behavior
describe('Preload Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should expose electronAPI to main world', () => {
    // Import preload script (this will execute it)
    require('../../src/main/preload');

    // Verify contextBridge.exposeInMainWorld was called
    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
      'electronAPI',
      expect.objectContaining({
        send: expect.any(Function),
        receive: expect.any(Function),
        platform: expect.any(String),
      })
    );
  });

  it('should expose platform information', () => {
    require('../../src/main/preload');

    const [[, exposedAPI]] = (contextBridge.exposeInMainWorld as jest.Mock).mock.calls;
    expect(exposedAPI.platform).toBe('darwin');
  });

  it('should expose send and receive methods', () => {
    require('../../src/main/preload');

    const [[, exposedAPI]] = (contextBridge.exposeInMainWorld as jest.Mock).mock.calls;
    expect(typeof exposedAPI.send).toBe('function');
    expect(typeof exposedAPI.receive).toBe('function');
  });
});

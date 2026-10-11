// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { chooseVideoExporterStrategy } from './chooseExporter';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('chooseVideoExporterStrategy', () => {
  it('prefers WebCodecs when supported', () => {
    expect(chooseVideoExporterStrategy(true)).toBe('webcodecs');
  });

  it('falls back to MediaRecorder when WebCodecs is unavailable', () => {
    expect(chooseVideoExporterStrategy(false)).toBe('mediarecorder');
  });

  it('defaults to feature detection via WebCodecsExporter.isSupported', () => {
    vi.stubGlobal('VideoEncoder', undefined);
    expect(chooseVideoExporterStrategy()).toBe('mediarecorder');

    class MockVideoEncoder {}
    vi.stubGlobal('VideoEncoder', MockVideoEncoder);
    expect(chooseVideoExporterStrategy()).toBe('webcodecs');
  });
});

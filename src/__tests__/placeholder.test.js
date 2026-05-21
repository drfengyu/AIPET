describe('AIPET Pipeline', () => {
  test('pipeline test stage works', () => {
    expect(1 + 1).toBe(2);
  });

  test('environment is ready', () => {
    const nodeVersion = process.version;
    expect(nodeVersion).toBeTruthy();
    console.log(`Node.js ${nodeVersion} - environment ready`);
  });
});

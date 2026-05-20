const { app, BrowserWindow } = require('electron');

console.log('Electron is working');
console.log('app:', app);
console.log('BrowserWindow:', BrowserWindow);

app.whenReady().then(() => {
  console.log('App is ready');
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600
  });
  mainWindow.loadURL('http://localhost:5187');
  console.log('Window created');
});

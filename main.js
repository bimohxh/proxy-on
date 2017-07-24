const {app, BrowserWindow, ipcMain, Tray, Menu} = require('electron')

let win
let revent

var forceQuit = false
let tray = null
function createWindow () {
  tray = new Tray('./imgs/logo.png')
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '主界面',
      click: function () {
        win.restore()
      }
    },
    {
      label: '退出',
      click: function () {
        forceQuit = true
        win.close()
      }
    }
  ])
  tray.on('double-click', () => {
    win.show()
  })
  tray.setToolTip('Proxy-on')
  tray.setContextMenu(contextMenu)

  win = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: false,
    frame: false
  })

  win.loadURL(`file://${__dirname}/index.html`)

  // win.webContents.openDevTools()

  // 处理窗口关闭
  win.on('close', (e) => {
    if (!forceQuit) {
      e.preventDefault()
      win.hide()
    }
  })
  win.on('closed', (e) => {
    revent.sender.send('close-app')
    win = null
  })
}

// Electron初始化完成
app.on('ready', createWindow)

// 处理退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

app.on('before-quit', () => forceQuit = true)

ipcMain.on('home-register', (event, arg) => {
  revent = event
  event.returnValue = 'pong'
})

ipcMain.on('close-main-window', function () {
  win.close()
})

ipcMain.on('show-window', function () {
  win.show()
})


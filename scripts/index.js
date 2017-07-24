const {ipcRenderer} = require('electron')
const httpProxy = require('http-proxy')
const storage = require('electron-json-storage')
var LocalIP = require('./lib/localip')
ipcRenderer.send('home-register')

// 退出 APP
ipcRenderer.on('close-app', (event, arg) => {
  return new Promise(resolve => {
    // 关闭所有连接
    vueApp.rules.forEach(rule => {
      if (rule.proxy) {
        rule.proxy.close()
      }
    })

    // 缓存
    // storage.set('rules', vueApp.rules, error => {
    //   resolve()
    // })
  })
})

let vueApp = new Vue({
  el: '#app',
  data: {
    rules: [],
    isShowEdit: false,
    editItem: {}
  },
  watch: {
    rules: function () {
      storage.set('rules', vueApp.rules)
    }
  },
  methods: {
    // 提交
    submit: function () {
      if (this.editItem.id > 0) {
        this.updateRule()
      } else {
        this.addRule()
      }
    },

    // 新增
    addRule: function () {
      this.rules.push({
        id: Date.now(),
        vIP: this.editItem.vIP,
        vPort: this.editItem.vPort,
        localPort: this.editItem.localPort,
        name: this.editItem.name,
        isopen: false
      })
      for (let k in this.editItem) {
        this.editItem[k] = ''
      }
      this.isShowEdit = false
    },

    // 更新
    updateRule: function () {
      let oldEditItem = this.rules.filter(item => { return item.id === this.editItem.id })[0]
      ;['vIP', 'vPort', 'name', 'localPort'].forEach(key => {
        oldEditItem[key] = this.editItem[key]
      })
      for (let k in this.editItem) {
        this.editItem[k] = ''
      }
      this.resetConnect(oldEditItem)
      this.isShowEdit = false
      storage.set('rules', vueApp.rules)
    },

    switchOpen: function (item) {
      item.isopen ? this.closeConnect(item) : this.openConnect(item)
    },

    // 删除 rule
    destroyEdit: function (item) {
      if (!confirm('确定删除该代理？')) {
        return
      }
      var index = this.rules.indexOf(item)
      this.rules.splice(index, 1)
    },

    // 开启连接
    openConnect: function (item) {
      item.proxy = httpProxy.createProxyServer({
        target: `${item.vIP}:${item.vPort}`
      }).listen(item.localPort)

      item.isopen = true
      item.proxy.on('error', function (err, req, res) {
        item.isopen = false
      })
      item.proxy.on('close', function (err, req, res) {
        item.isopen = false
      })
    },

    // 关闭连接
    closeConnect: function (item) {
      if (item.proxy) {
        item.proxy.close()
      }
      item.isopen = false
    },

    // 重置连接
    resetConnect: function (item) {
      if (item.proxy && item.isopen) {
        this.closeConnect(item)
        this.openConnect(item)
      }
    },

    // 关闭窗口
    closeWin: function () {
      ipcRenderer.send('close-main-window')
    },

    // 打开链接
    openLink: function (url) {
      require('electron').shell.openExternal(url)
    },

    // 访问地址
    open: function (rule) {
      this.openLink(`http://${LocalIP}:${rule.localPort}`)
    },

    switchEdit: function (rule) {
      this.isShowEdit = !this.isShowEdit
      if (rule) {
        this.editItem = {}
        for (let k in rule) {
          this.editItem[k] = rule[k]
        }
      }
    }
  },
  created () {
    storage.get('rules', (error, data) => {
      console.log(data)
      if (error) throw error
      vueApp.rules = data || []
    })
  }
})

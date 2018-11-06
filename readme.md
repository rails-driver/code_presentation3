# Ruby on Rails and React code examples

### RubyOnRails

[innovation_calls_controller.rb](https://github.com/rails-driver/code_presentation3/blob/master/innovation_calls_controller.rb) - Regular RoR controller which work in combinatoin with [Pundit]() based permissions.

[files_controller.rb](https://github.com/rails-driver/code_presentation3/blob/master/files_controller.rb) - One of the project features is a files manager, which can archive, download, share etc. files, this controller is responsible for this tasks.

[offers_controller.rb](https://github.com/rails-driver/code_presentation3/blob/master/offers_controller.rb) - Regular API stack. To achieve DDD architecture in the project, DTO objects were used with combination of Services and Presenters.

### JS

[api.js](https://github.com/rails-driver/code_presentation3/blob/master/api.js) - example of work with chat API, using superagent library

[chat.js](https://github.com/rails-driver/code_presentation3/blob/master/chat.js) - React component which works with MixPanel event statistic service, uses PropTypes validation and Redux

[index.js](https://github.com/rails-driver/code_presentation3/blob/master/index.js) - React component responsible for login form, which uses IPC communication between Electron backend and React application. Here you can check how React app can interacts with OS through Electron.

[transcript.js](https://github.com/rails-driver/code_presentation3/blob/master/transcript.js) - example of reducer which interacts wit Pubnub websockets service.


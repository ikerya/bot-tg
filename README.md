# A package for Telegram's bot API

## Table of contents

* [Examples](#examples)
* [Guides](#guides)
* [New](#new)

# Examples

Here is an example to use this package:

```javascript
const TelegramBot = require("bot-tg");
const bot = new TelegramBot({
	token: '<YOUR_BOT_TOKEN_HERE>',
	commands: [{
		id: 'hello',
		description: 'click here!',
		call: function(userId) {
			this.sendMessage(userId, 'World!');
		}
	}]
});
```

To get any kind of information from user you should do like that:

```javascript
const TelegramBot = require("bot-tg");
const bot = new TelegramBot({
    token: '<YOUR_BOT_TOKEN_HERE>',
    commands: [{
        id: 'set',
        description: 'set something',
        title: 'Send me something:',        
        done: function(userId, result) {
            this.sendMessage(userId, `Result is: ${result}`);
        }
    }]
});
```

To make a command hidden when calling the **help** (or **start**) command:

```javascript
const TelegramBot = require("bot-tg");
const bot = new TelegramBot({
    token: '<YOUR_BOT_TOKEN_HERE>',
    commands: [{
        id: 'set',
        description: 'set something',
        title: 'Send me something:',        
        done: function(userId, result) {
            this.sendMessage(userId, `Result is: ${result}`);
        }
    }, {
        id: 'action',
        description: 'admin action',
        call: function(userId) {
            this.sendMessage(userId, 'Hello, admin!');
        }
    }]
});
```

# Guides

To make some command hidden from list when calling the **help** (or **start**) command use **hidden: true** property:

```javascript
const TelegramBot = require("bot-tg");
const bot = new TelegramBot({
    token: '<YOUR_BOT_TOKEN_HERE>',
    commands: [{
        id: 'set',
        description: 'set something',
        title: 'Send me something:',        
        done: function(userId, result) {
            this.sendMessage(userId, `Result is: ${result}`);
        }
    }, {
        id: 'action',
        description: 'admin action',
        hidden: true,
        call: function(userId) {
            this.sendMessage(userId, 'Hello, admin!');
        }
    }]
});
```

To enable logging use:

```javascript
const bot = new TelegramBot({
    token: '<YOUR_BOT_TOKEN_HERE>',
    logging: true
    ...
});
```

# New

* When there are no matches with commands list identified at bot's initialization, bot's instance emits a message:

```javascript
const TelegramBot = require("bot-tg");
const bot = new TelegramBot({
    token: '<YOUR_BOT_TOKEN_HERE>',
    commands: [{
        id: 'set',
        description: 'set something',
        title: 'Send me something:',        
        done: function(userId, result) {
            this.sendMessage(userId, `Result is: ${result}`);
        }
    }]
});

bot.on('message', update => {
    console.log(update);
});
```
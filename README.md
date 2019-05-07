# A package for Telegram's bot API

## Table of contents

[Examples](#examples)
[New](#new)

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

# New

* Added hidden command's property to hide it from commands list when calling the **help** (or **start**) command.
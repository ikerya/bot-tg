## Table of contents

[Examples](#examples)

#Examples

Here is an example to use this package:

```javascript
const TelegramBot = require("bot-tg")
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
const TelegramBot = require("bot-tg")
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
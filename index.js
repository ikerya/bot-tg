const fs = require('fs');
const { promisify } = require('util');
const axios = require('axios');
const FormData = require('form-data');
const { sleep } = require('./lib/functions');
const EventEmitter = require('events');

axios.defaults.timeout = 5000;
FormData.prototype.submit = promisify(FormData.prototype.submit);

class TelegramBot extends EventEmitter {
	constructor(options = {}) {
		super();
		
		this._options = {
			commands: [],
			logging: false,
			interval: 1000,
			...options
		};
		this._lastUpdateId = 0;

		this._usersHistory = {};
		this._watchUpdates();
		this._watchMemory();
	} 

	_handleError(err, args = []) {
		console.error('An error was happened:', err.message, 'args', args);
	}

	_getMethodUrl(methodName) {
		return `https://api.telegram.org/bot${this._options.token}/${methodName}`;
	}

	_setLastUpdateId(updateId) {
		this._lastUpdateId = updateId;
	}

	call(methodName, requestType, params = {}) {
		if (this._options.logging) console.log('call', methodName, requestType, params);

		const handleError = promise => async err => {
			if (this._options.logging) {
				console.log('handleError');
			}

			const args = [methodName, requestType, params];
				
			if (this._options.logging) {
				this._handleError(err, args);
			}

			if (this._options.logging) {
				console.log('sleeping');
			}

			await sleep(1);

			if (this._options.logging) {
				console.log('slept');
			}

			return this.call(...args).then(promise);
		};
		const handleResponse = request => {
			return new Promise(resolve => {
				request
					.then(response => {
						if (response.data) {
							return resolve(response.data);
						}

						throw new Error('Could not recognize data:', response.data);
					})
					.catch(handleError(resolve));
			});
		};

		switch(requestType) {
			case "GET":
				return handleResponse(
					axios.get(
						this._getMethodUrl(methodName), 
						{ params }
					)
				);
			case "POST":
				return handleResponse(
					axios.post(
						this._getMethodUrl(methodName), 
						params
					)
				);
		}
	}

	get(methodName, params) {
		return this.call(methodName, 'GET', params);
	} 

	post(methodName, params) {
		return this.call(methodName, 'POST', params);
	} 

	_getMemory() {
		return (process.memoryUsage().heapUsed / (1024 ** 2)).toFixed(3);
	}

	_watchMemory() {
		if (!this._options.logging) return;

		console.log('Memory usage', this._getMemory());
		setTimeout(() => this._watchMemory(), 10000);
	}

	_watchUpdates() {
		const response = this.get('getUpdates', {
			offset: this._lastUpdateId
		})
			.then(response => {
				this._mapUpdates(response.result || []);

				setTimeout(() => this._watchUpdates(), this._options.interval);
			});
	}

	_mapUpdates(updates) {
		updates.map((update, i) => {
			const { update_id, message } = update;

			if (i === updates.length - 1) {
				this._setLastUpdateId(update_id + 1);
			}

			this._emitMessage(message || update);
		});
	}

	_getCommandHistory(userId) {
		return this._options.commands[this._usersHistory[userId]];
	}

	_setCommandHistory(userId, commandId) {
		this._usersHistory[userId] = commandId;
	}

	_resetCommandHistory(userId) {
		this._setCommandHistory(userId, null);
	}

	_emitMessage(message) {
		const text = message.text || '';
		const from = message.from || {};
		const userId = from.id;
		const lastCommand = this._getCommandHistory(userId);

		if (lastCommand) {
			this._resetCommandHistory(userId);
			return lastCommand.done.call(this, userId, text);
		}

		if (!text) {

		}

		const command = this._searchCommand(text);

		if (!command.id && TelegramBot.serviceCommands.includes(text)) {
			return this.sendHelpMessage(userId);
		} else if(!command.id) {
			return this.emit('message', message);
		}

		if (command.call) {
			command.call.call(this, userId, message);
		} else {
			this._setCommandHistory(userId, command.index);
			this.sendMessage(userId, command.title);
		}
	}

	_searchCommand(text) {
		const { commands } = this._options;
		const userCommand = text && text.replace('/', '');

		for (let i = 0; i < commands.length; i++) {
			const command = commands[i];

			if (userCommand === command.id) {
				command.index = i;

				return command;
			}
		}

		return false;
	}

	async isChatMember(userId, chatId) {
		const response = await this.get('getChatMember', {
			chat_id: chatId,
			user_id: userId
		});

		switch (response.result.status) {
			case "member":
			case "creator":
			case "administrator":
				return true;
			default:
				return false;
		}
	}

	sendMessage(chatId, text) {
		const params = typeof chatId === 'object' ? 
			chatId:
			{
				chat_id: chatId,
				text: text
			};

		return this.post('sendMessage', params);
	}

	sendPhoto(chatId, photoPath, caption) {
		const form = new FormData();

		form.append('chat_id', chatId);
		form.append('caption', caption);
		form.append('photo', fs.createReadStream(photoPath));

		return form.submit(this._getMethodUrl('sendPhoto'));
	}

	sendHelpMessage(userId) {
		const { commands } = this._options;
		const content = [
			'Вот полный список доступных команд:',
			''
		];

		for (let i = 0; i < commands.length; i++) {
			const command = commands[i];

			if (command.hidden) continue;

			content.push(
				`/${command.id} — ${command.description}`
			);
		}

		this.sendMessage(userId, content.join('\n'));
	}
}

TelegramBot.serviceCommands = [ '/help' ];

module.exports = TelegramBot;
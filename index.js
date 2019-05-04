const fs = require('fs');
const { promisify } = require('util');
const axios = require('axios');
const FormData = require('form-data');
const { sleep } = require('./lib/functions');

FormData.prototype.submit = promisify(FormData.prototype.submit);

class TelegramBot {
	constructor(options = {}) {
		this._options = {
			commands: [],
			...options
		};
		this._lastUpdateId = 0;

		this._usersHistory = {};
		this._watchUpdates();
	} 

	_handleError(err, args = []) {
		console.log('An error was happened:', err.message, 'args', args);
	}

	_getMethodUrl(methodName) {
		return `https://api.telegram.org/bot${this._options.token}/${methodName}`;
	}

	_setLastUpdateId(updateId) {
		this._lastUpdateId = updateId;
	}

	call(methodName, requestType, params = {}) {
		console.log('call', methodName, requestType, params);

		const handleError = async err => {
			const args = [methodName, requestType, params];
			this._handleError(err, args);

			await sleep(1);

			return this.call(...args, 2);
		};
		const handleResponse = request => {
			return new Promise((resolve, reject) => {
				request
					.then(response => 
						resolve(response.data)
					)
					.catch(reject);
			});
		}

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

	_watchUpdates() {
		const response = this.get('getUpdates', {
			offset: this._lastUpdateId
		})
			.then(response => {
				this._mapUpdates(response.result || []);

				setTimeout(() => this._watchUpdates(), 500);
			})
			.catch(err => {
				console.error(testCode, 'an error happened in watchUpdates', err);

				setTimeout(() => this._watchUpdates(), 1000);
			});
	}

	_mapUpdates(updates) {
		updates.map((update, i) => {
			const { update_id, message } = update;

			if (i === updates.length - 1) {
				this._setLastUpdateId(update_id + 1);
			}

			if (!message) {
				return;
			}

			this._emitMessage(message);
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
		const { text, from } = message;
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
			return this.sendMessage(userId, 'Неизвестная команда :(');
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

			content.push(
				`/${command.id} — ${command.description}`
			);
		}

		this.sendMessage(userId, content.join('\n'));
	}
}

TelegramBot.serviceCommands = [ '/start', '/help' ];

module.exports = TelegramBot;